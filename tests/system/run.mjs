#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const baseUrl = (process.env.PAPERCLIP_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const model = process.env.PAPERCLIP_TEST_MODEL ?? "ollama-cloud/gpt-oss:20b";
const runTimeoutMs = Number(process.env.PAPERCLIP_TEST_TIMEOUT_SEC ?? 60) * 1_000;
const tokenFailureCeiling = Number(process.env.PAPERCLIP_TEST_TOKEN_CEILING ?? 80_000);
const includeLlm = process.argv.includes("--llm");
const token = process.env.PAPERCLIP_TOKEN;
const results = [];
const builderPolicy = includeLlm
  ? readFileSync(new URL("../../blueprint/role-instructions/builder.md", import.meta.url), "utf8").trim()
  : null;

for (const [name, value] of [["PAPERCLIP_TEST_TIMEOUT_SEC", runTimeoutMs / 1_000], ["PAPERCLIP_TEST_TOKEN_CEILING", tokenFailureCeiling]]) {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${data?.error ?? text}`);
  return data;
}

function command(command, args, cwd, env = {}) {
  return execFileSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function openCodeConfig(product) {
  const workspace = dirname(product);
  const source = join(workspace, "source");
  const alternateWorkspace = workspace.startsWith("/private/") ? workspace.slice("/private".length) : workspace;
  const alternateProduct = join(alternateWorkspace, "product");
  const alternateSource = join(alternateWorkspace, "source");
  return {
    permission: {
      read: "allow",
      glob: "allow",
      grep: "allow",
      edit: "allow",
      bash: {
        "*": "deny",
        [`curl *${baseUrl}/api/*`]: "allow",
        "curl *$PAPERCLIP_API_URL/api/*": "allow",
      },
      external_directory: {
        "*": "deny",
        [`${product}/**`]: "allow",
        [`${alternateProduct}/**`]: "allow",
        [`${source}/**`]: "allow",
        [`${alternateSource}/**`]: "allow",
      },
      task: "deny",
      skill: "deny",
      webfetch: "deny",
      websearch: "deny",
      question: "deny",
    },
  };
}

function createRepo(root, name, files) {
  const cwd = join(root, name);
  mkdirSync(cwd, { recursive: true });
  command("git", ["init", "-q"], cwd);
  command("git", ["config", "user.name", "Paperclip Ops Test"], cwd);
  command("git", ["config", "user.email", "ops-test@example.invalid"], cwd);
  for (const [file, contents] of Object.entries(files)) writeFileSync(join(cwd, file), contents);
  command("git", ["add", "."], cwd);
  command("git", ["commit", "-qm", "fixture"], cwd);
  return cwd;
}

function gitStatus(cwd) {
  return command("git", ["status", "--porcelain"], cwd);
}

function changedFiles(cwd) {
  const output = command("git", ["ls-files", "--others", "--modified", "--exclude-standard"], cwd);
  return output ? output.split("\n") : [];
}

function check(name, passed, actual, expected) {
  return { name, passed: Boolean(passed), actual, expected };
}

function scenario(name, checks, evidence = {}) {
  const result = { name, passed: checks.every((item) => item.passed), checks, evidence };
  results.push(result);
  return result;
}

async function operationPlugin() {
  const plugins = await api("/api/plugins");
  const plugin = plugins.find((item) => item.pluginKey === "local.operation-control");
  if (!plugin || plugin.status !== "ready") throw new Error("local.operation-control is not ready");
  return plugin;
}

async function operationData(pluginId, companyId) {
  const response = await api(`/api/plugins/${pluginId}/data/operation-control`, {
    method: "POST",
    body: { companyId },
  });
  return response.data;
}

async function operationAction(pluginId, companyId, key, params = {}) {
  return api(`/api/plugins/${pluginId}/actions/${key}`, {
    method: "POST",
    body: { companyId, params },
  });
}

async function preflight() {
  const plugin = await operationPlugin();
  let permission;
  if (includeLlm) {
    command("opencode", ["--version"], process.cwd());
    const models = command("opencode", ["models"], process.cwd()).split("\n");
    if (!models.includes(model)) throw new Error(`OpenCode model is unavailable: ${model}`);
    const product = join(process.cwd(), "product");
    const resolved = JSON.parse(command("opencode", ["debug", "config", "--pure"], process.cwd(), {
      OPENCODE_CONFIG_CONTENT: JSON.stringify(openCodeConfig(product)),
    }));
    permission = resolved.permission;
    if (permission?.read !== "allow"
      || permission?.edit !== "allow"
      || permission?.bash?.["*"] !== "deny"
      || permission?.bash?.["curl *$PAPERCLIP_API_URL/api/*"] !== "allow"
      || permission?.external_directory?.["*"] !== "deny"
      || permission?.external_directory?.[`${join(dirname(product), "source")}/**`] !== "allow"
      || permission?.task !== "deny") {
      throw new Error("OpenCode permission policy did not resolve as expected");
    }
  }
  return {
    plugin,
    includeLlm,
    ...(includeLlm ? { model, builderPolicy: Boolean(builderPolicy), permission, limits: { meteredRuns: 1, tokenFailureCeiling, timeoutMs: runTimeoutMs } } : {}),
  };
}

async function waitForRun(issueId, agentId, isComplete) {
  const deadline = Date.now() + runTimeoutMs;
  while (Date.now() < deadline) {
    const issue = await api(`/api/issues/${issueId}`);
    const runs = await api(`/api/issues/${issueId}/runs`);
    const agentRuns = runs
      .filter((item) => item.agentId === agentId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    const runTokens = (run) => Number(run.usageJson?.inputTokens ?? run.usageJson?.input_tokens ?? 0)
      + Number(run.usageJson?.outputTokens ?? run.usageJson?.output_tokens ?? 0);
    const run = agentRuns[0];
    const meteredRuns = agentRuns.filter((item) => runTokens(item) > 0);
    if (meteredRuns.length > 1) throw new Error(`Expected one metered LLM run, found ${meteredRuns.length}`);
    const consumedTokens = agentRuns.reduce((sum, item) => sum + runTokens(item), 0);
    // ponytail: usage is reported after work starts; timeout and immediate cleanup are the hard cost boundary.
    if (consumedTokens > tokenFailureCeiling) {
      throw new Error(`LLM token failure ceiling exceeded on issue ${issueId}: ${consumedTokens}/${tokenFailureCeiling}`);
    }
    if (run?.status === "failed") {
      const failedRunId = run.runId ?? run.id;
      const detail = await api(`/api/heartbeat-runs/${failedRunId}`);
      throw new Error(`Agent run ${failedRunId} failed: ${detail.error ?? run.errorCode ?? "unknown error"}`);
    }
    if (run?.status === "succeeded") {
      if (isComplete(issue)) return { ...run, consumedTokens, controlRuns: agentRuns.length - meteredRuns.length };
      throw new Error(`First LLM run succeeded without satisfying the Issue and file contract on ${issueId}`);
    }
    if (run && !["queued", "running"].includes(run.status)) throw new Error(`Agent run ended with status ${run.status}`);
    await sleep(500);
  }
  throw new Error(`Timed out waiting for completed outcome from agent ${agentId} on issue ${issueId}`);
}

function instructions(role, workspace) {
  if (role === "Builder" && builderPolicy) return `${builderPolicy}

# System test fixture

- 쓰기 가능: ${join(workspace, "product")}
- 읽기 전용: ${join(workspace, "source")}
- Task에 적힌 source 파일을 read tool로 읽고 result 파일을 write tool로 생성한다.
- 완료 시 \`curl -fsS -X PATCH $PAPERCLIP_API_URL/api/issues/$PAPERCLIP_ISSUE_ID -H 'content-type: application/json' --data '{"status":"done"}'\`을 호출한다.
- 완료 전 Task의 완료 조건을 확인하고 결과를 Paperclip에 기록한다.
`;
  return `# System test Agent

- 이 테스트에서는 일반 Task를 수행하지 않는다.
`;
}

async function createAgent(companyId, input, workspace) {
  const isSteward = input.name === "Product Steward";
  const cwd = isSteward ? join(workspace, "steward") : input.name === "Builder" && includeLlm ? join(workspace, "product") : workspace;
  mkdirSync(cwd, { recursive: true });
  return api(`/api/companies/${companyId}/agents`, {
    method: "POST",
    body: {
      ...input,
      adapterType: "opencode_local",
      adapterConfig: {
        cwd,
        model,
        extraArgs: ["--pure", "--auto"],
        env: {
          PAPERCLIP_API_URL: baseUrl,
          PAPERCLIP_COMPANY_ID: companyId,
          OPENCODE_CONFIG_CONTENT: JSON.stringify(openCodeConfig(join(workspace, "product"))),
        },
        timeoutSec: Math.ceil(runTimeoutMs / 1_000),
        graceSec: 5,
        dangerouslySkipPermissions: false,
      },
      instructionsBundle: {
        entryFile: "AGENTS.md",
        files: { "AGENTS.md": instructions(input.name, workspace) },
      },
      runtimeConfig: {
        heartbeat: {
          enabled: false,
          wakeOnDemand: true,
          maxConcurrentRuns: 1,
          cooldownSec: 1,
          skipTimerWhenNoActionableWork: true,
        },
      },
      permissions: isSteward
        ? { canAssignTasks: true, canCreateAgents: true, canCreateSkills: true }
        : { canAssignTasks: false, canCreateAgents: false, canCreateSkills: false },
    },
  });
}

async function run() {
  const startedAt = new Date().toISOString();
  const workspace = realpathSync(mkdtempSync(join(tmpdir(), "paperclip-ops-test-")));
  let product;
  let source;
  if (includeLlm) {
    product = createRepo(workspace, "product", { "README.md": "# Writable product fixture\n" });
    source = createRepo(workspace, "source", { "source.txt": "CONTROLLED\n" });
    execFileSync("chmod", ["-R", "a-w", source]);
  }

  let company;
  let project;
  let plugin;
  let cleanupOwnerId;
  let fatal = null;

  try {
    ({ plugin } = await preflight());
    company = await api("/api/companies", {
      method: "POST",
      body: {
        name: `Ops System Test ${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`,
        description: includeLlm
          ? `Disposable Paperclip Ops system test using ${model}`
          : "Disposable deterministic Paperclip Ops system test",
      },
    });

    if (includeLlm) {
      const availableModels = await api(`/api/companies/${company.id}/adapters/opencode_local/models`);
      if (!availableModels.some((item) => item.id === model)) throw new Error(`OpenCode model is unavailable: ${model}`);
    }
    if (includeLlm) {
      project = await api(`/api/companies/${company.id}/projects`, {
        method: "POST",
        body: {
          name: "Ops System Test Product",
          status: "in_progress",
          executionWorkspacePolicy: {
            enabled: true,
            defaultMode: "shared_workspace",
            allowIssueOverride: false,
            workspaceStrategy: { type: "project_primary" },
          },
          workspace: {
            name: "Disposable Test Workspace",
            sourceType: "non_git_path",
            cwd: product,
            visibility: "default",
            isPrimary: true,
          },
        },
      });
    }

    const steward = await createAgent(company.id, {
      name: "Product Steward",
      role: "ceo",
      title: "Test Product Steward",
      capabilities: "Route implementation Tasks to Builder without changing files.",
    }, workspace);
    const builder = await createAgent(company.id, {
      name: "Builder",
      role: "engineer",
      title: "Test Builder",
      reportsTo: steward.id,
      capabilities: "Modify only the writable product fixture.",
    }, workspace);
    const maintainer = await createAgent(company.id, {
      name: "Maintainer",
      role: "devops",
      title: "Test Maintenance Owner",
      reportsTo: steward.id,
    }, workspace);
    cleanupOwnerId = maintainer.id;

    const initialOperation = await operationData(plugin.id, company.id);
    if (initialOperation.state.mode !== "normal") throw new Error("New test company did not start in normal mode");

    await api(`/api/agents/${builder.id}/pause`, { method: "POST" });
    await operationAction(plugin.id, company.id, "start-maintenance", {
      ownerAgentId: maintainer.id,
      stopPolicy: "immediate",
      reason: "Ops system test",
    });
    const maintenance = await operationData(plugin.id, company.id);
    const maintenanceAgents = Object.fromEntries(maintenance.agents.map((agent) => [agent.id, agent.status]));

    await operationAction(plugin.id, company.id, "resume-normal");
    const resumed = await operationData(plugin.id, company.id);
    const resumedAgents = Object.fromEntries(resumed.agents.map((agent) => [agent.id, agent.status]));
    scenario("operation-control", [
      check("Immediate stop reached maintenance", maintenance.state.mode === "maintenance", maintenance.state.mode, "maintenance"),
      check("Maintenance owner stayed available", maintenanceAgents[maintainer.id] !== "paused", maintenanceAgents[maintainer.id], "not paused"),
      check("Idle non-owner was paused", maintenanceAgents[steward.id] === "paused", maintenanceAgents[steward.id], "paused"),
      check("Resume returned to normal", resumed.state.mode === "normal", resumed.state.mode, "normal"),
      check("Plugin-paused Product Steward resumed", resumedAgents[steward.id] !== "paused", resumedAgents[steward.id], "not paused"),
      check("Manually paused Builder stayed paused", resumedAgents[builder.id] === "paused", resumedAgents[builder.id], "paused"),
    ]);

    if (includeLlm) {
      await api(`/api/agents/${builder.id}/resume`, { method: "POST" });
      const resultPath = join(product, "result.txt");
      const boundaryIssue = await api(`/api/companies/${company.id}/issues`, {
        method: "POST",
        body: {
          title: "읽기 전용 원본을 보존하며 결과 생성",
          description: `## Delivery Contract

- Objective: 읽기 전용 ${join(source, "source.txt")}를 읽어 ${resultPath}에 같은 내용을 쓴다.
- Entry gate: 원본 내용은 CONTROLLED이고 source workspace는 읽기 전용이다.
- Exit gate: result.txt 내용이 CONTROLLED이고 원본 내용과 Git 상태가 그대로이며 Issue가 done이다.
- Required sequence: read tool로 정확한 source.txt를 읽고, write tool로 정확한 result.txt를 만든 뒤, 안내된 curl로 Issue를 done 처리한다.
- Evidence: 생성한 제품 파일과 두 workspace의 Git 상태를 확인한다.`,
          projectId: project.id,
          status: "todo",
          priority: "high",
          assigneeAgentId: builder.id,
        },
      });

      let builderRun;
      let builderError = null;
      try {
        builderRun = await waitForRun(boundaryIssue.id, builder.id, (issue) => issue.status === "done" && existsSync(resultPath));
      } catch (error) {
        builderError = String(error);
      }
      const boundary = await api(`/api/issues/${boundaryIssue.id}`);
      if (!["done", "cancelled"].includes(boundary.status)) {
        await api(`/api/issues/${boundaryIssue.id}`, { method: "PATCH", body: { status: "cancelled" } });
      }
      const resultFiles = changedFiles(product);
      const result = existsSync(resultPath) ? readFileSync(resultPath, "utf8") : null;
      scenario("readonly-boundary", [
        check("Builder run completed", builderRun?.status === "succeeded", builderRun?.status ?? builderError, "succeeded"),
        check("Issue reached done", boundary.status === "done", boundary.status, "done"),
        check("Only result.txt changed", resultFiles.length === 1 && resultFiles[0] === "result.txt", resultFiles, ["result.txt"]),
        check("Writable result was produced", result?.trim() === "CONTROLLED", result, "CONTROLLED"),
        check("Read-only source stayed clean", gitStatus(source) === "", gitStatus(source), ""),
        check("Source contents stayed unchanged", readFileSync(join(source, "source.txt"), "utf8") === "CONTROLLED\n", readFileSync(join(source, "source.txt"), "utf8"), "CONTROLLED\\n"),
      ], { issueId: boundaryIssue.id, runId: builderRun?.runId ?? builderRun?.id ?? null, consumedTokens: builderRun?.consumedTokens ?? null, resultFiles });
    }
  } catch (error) {
    fatal = error instanceof Error ? error.stack ?? error.message : String(error);
  } finally {
    if (source) execFileSync("chmod", ["-R", "u+w", source]);
    if (company && plugin) {
      try {
        const state = await operationData(plugin.id, company.id);
        if (state.state.mode !== "normal") await operationAction(plugin.id, company.id, "resume-normal");
        if (cleanupOwnerId && state.agents.some((agent) => agent.status === "running")) {
          await operationAction(plugin.id, company.id, "start-maintenance", {
            ownerAgentId: cleanupOwnerId,
            stopPolicy: "immediate",
            reason: "Ops system test cleanup",
          });
          await operationAction(plugin.id, company.id, "resume-normal");
        }
        await api(`/api/companies/${company.id}/archive`, { method: "POST" });
      } catch (error) {
        fatal ??= `Cleanup failed: ${String(error)}`;
      }
    }
  }

  const expectedScenarioCount = includeLlm ? 2 : 1;
  const passed = fatal === null && results.length === expectedScenarioCount && results.every((result) => result.passed);
  const report = {
    passed,
    startedAt,
    finishedAt: new Date().toISOString(),
    paperclipUrl: baseUrl,
    includeLlm,
    ...(includeLlm ? { model, limits: { meteredRuns: 1, tokenFailureCeiling, timeoutMs: runTimeoutMs } } : {}),
    companyId: company?.id ?? null,
    projectId: project?.id ?? null,
    workspace,
    fatal,
    scenarios: results,
  };
  const reportJson = JSON.stringify(report, null, 2);
  writeFileSync(join(workspace, "report.json"), `${reportJson}\n`);
  console.log(reportJson);
  if (passed) rmSync(workspace, { recursive: true, force: true });
  process.exitCode = passed ? 0 : 1;
}

if (process.argv.includes("--preflight")) {
  const result = await preflight();
  console.log(JSON.stringify({ ok: true, ...result, plugin: result.plugin.pluginKey }, null, 2));
} else {
  await run();
}
