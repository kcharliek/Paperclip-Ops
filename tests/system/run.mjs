#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";

const baseUrl = (process.env.PAPERCLIP_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const token = process.env.PAPERCLIP_TOKEN;
const roleInstructionFiles = [
  "product-steward.md",
  "prototyper.md",
  "builder.md",
  "sweeper.md",
  "grower.md",
  "maintainer.md",
  "system-auditor.md",
];

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

function check(name, passed, actual, expected) {
  return { name, passed: Boolean(passed), actual, expected };
}

function assertRoleContracts() {
  for (const file of roleInstructionFiles) {
    const path = join(process.cwd(), "blueprint", "role-instructions", file);
    const contents = readFileSync(path, "utf8");
    if (!contents.includes("401/403") || !contents.includes("Board 권한으로 우회하지 않는다")) {
      throw new Error(`Role instruction is missing the actor boundary: ${path}`);
    }
    if (/create-child-task|review-node|request-milestone-review|propose-milestone/.test(contents)) {
      throw new Error(`Role instruction still depends on removed delivery tools: ${path}`);
    }
  }

  const steward = readFileSync(
    join(process.cwd(), "blueprint", "role-instructions", "product-steward.md"),
    "utf8",
  );
  if (!steward.includes("native `review` stage") || !steward.includes("저·중위험 작업은 인간 응답을 기다리지 않고")) {
    throw new Error("Product Steward instruction is missing autonomous native-review behavior");
  }
}

async function operationPlugin() {
  const plugins = await api("/api/plugins");
  const plugin = plugins.find((item) => item.pluginKey === "local.operation-control");
  if (!plugin || plugin.status !== "ready") throw new Error("local.operation-control is not ready");
  if (plugin.version !== "1.0.0") throw new Error(`Expected Operation Control 1.0.0, found ${plugin.version}`);
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
  assertRoleContracts();
  const plugin = await operationPlugin();
  return {
    ok: true,
    plugin: plugin.pluginKey,
    version: plugin.version,
    roleContracts: true,
    validationMode: "deterministic-only",
  };
}

async function createAgent(companyId, input) {
  return api(`/api/companies/${companyId}/agents`, {
    method: "POST",
    body: {
      ...input,
      adapterType: "process",
      adapterConfig: {
        command: "/usr/bin/true",
        timeoutSec: 10,
        graceSec: 1,
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
      permissions: input.role === "ceo"
        ? { canAssignTasks: true, canCreateAgents: false, canCreateSkills: false }
        : { canAssignTasks: false, canCreateAgents: false, canCreateSkills: false },
    },
  });
}

async function waitForDispatch(companyId, goalId) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const issues = await api(`/api/companies/${companyId}/issues?includePluginOperations=true&limit=100`);
    const matches = issues.filter((issue) => (
      issue.originKind === "plugin:local.operation-control:goal-dispatch"
      && issue.originId === goalId
    ));
    if (matches.length) return matches;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for autonomous Goal dispatch: ${goalId}`);
}

async function run() {
  const startedAt = new Date().toISOString();
  const checks = [];
  let company;
  let plugin;
  let fatal = null;

  try {
    const flight = await preflight();
    plugin = (await api("/api/plugins")).find((item) => item.pluginKey === flight.plugin);
    company = await api("/api/companies", {
      method: "POST",
      body: {
        name: `Autonomous Ops System Test ${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`,
        description: "Disposable deterministic test of native autonomous delivery boundaries.",
      },
    });

    const steward = await createAgent(company.id, {
      name: "Product Steward",
      role: "ceo",
      title: "Autonomous Product Steward",
      capabilities: "Decompose Company Goals into native Paperclip Tasks.",
    });
    const builder = await createAgent(company.id, {
      name: "Builder",
      role: "engineer",
      title: "Test Builder",
      reportsTo: steward.id,
    });
    const reviewer = await createAgent(company.id, {
      name: "Sweeper",
      role: "qa",
      title: "Independent Reviewer",
      reportsTo: steward.id,
    });
    const maintainer = await createAgent(company.id, {
      name: "Maintainer",
      role: "devops",
      title: "Maintenance Owner",
      reportsTo: steward.id,
    });

    const initial = await operationData(plugin.id, company.id);
    checks.push(check("New Company starts normal", initial.state.mode === "normal", initial.state.mode, "normal"));
    checks.push(check(
      "Delivery control is Paperclip-native",
      initial.autonomy?.deliveryControl === "paperclip-native",
      initial.autonomy?.deliveryControl,
      "paperclip-native",
    ));
    checks.push(check("Goal auto-dispatch is enabled", initial.autonomy?.autoDispatchGoals === true, initial.autonomy?.autoDispatchGoals, true));

    await api(`/api/agents/${builder.id}/pause`, { method: "POST" });
    await operationAction(plugin.id, company.id, "start-maintenance", {
      ownerAgentId: maintainer.id,
      stopPolicy: "immediate",
      reason: "Autonomous Ops system test",
    });
    const maintenance = await operationData(plugin.id, company.id);
    const maintenanceAgents = Object.fromEntries(maintenance.agents.map((agent) => [agent.id, agent.status]));
    checks.push(check("Immediate stop reaches maintenance", maintenance.state.mode === "maintenance", maintenance.state.mode, "maintenance"));
    checks.push(check("Maintenance owner stays available", maintenanceAgents[maintainer.id] !== "paused", maintenanceAgents[maintainer.id], "not paused"));

    await operationAction(plugin.id, company.id, "resume-normal");
    const resumed = await operationData(plugin.id, company.id);
    const resumedAgents = Object.fromEntries(resumed.agents.map((agent) => [agent.id, agent.status]));
    checks.push(check("Resume returns normal", resumed.state.mode === "normal", resumed.state.mode, "normal"));
    checks.push(check("Plugin-paused Steward resumes", resumedAgents[steward.id] !== "paused", resumedAgents[steward.id], "not paused"));
    checks.push(check("Manually paused Builder stays paused", resumedAgents[builder.id] === "paused", resumedAgents[builder.id], "paused"));

    const goal = await api(`/api/companies/${company.id}/goals`, {
      method: "POST",
      body: {
        title: "Deliver a reversible autonomous improvement",
        description: "Objective and autonomy envelope for a disposable system test.",
        level: "company",
        status: "active",
      },
    });
    const firstDispatch = await waitForDispatch(company.id, goal.id);
    checks.push(check("Company Goal creates one dispatch Task", firstDispatch.length === 1, firstDispatch.length, 1));
    checks.push(check("Dispatch is assigned to Product Steward", firstDispatch[0].assigneeAgentId === steward.id, firstDispatch[0].assigneeAgentId, steward.id));
    checks.push(check("Dispatch uses compact native-delivery guidance", /native Issues/.test(firstDispatch[0].description ?? "") && !/create-root-task|review-node/.test(firstDispatch[0].description ?? ""), firstDispatch[0].description, "native guidance without removed tools"));

    await api(`/api/goals/${goal.id}`, {
      method: "PATCH",
      body: { description: "Updated autonomy envelope; dispatch must remain idempotent." },
    });
    await sleep(200);
    const repeatedDispatch = await waitForDispatch(company.id, goal.id);
    checks.push(check("Goal update does not duplicate dispatch", repeatedDispatch.length === 1, repeatedDispatch.length, 1));

    const reviewIssue = await api(`/api/companies/${company.id}/issues`, {
      method: "POST",
      body: {
        title: "Native Agent review contract",
        description: "## Delivery\n- Objective: verify native review ownership\n- Scope: disposable issue only\n- Verify: executionState points to Sweeper\n- Risk: low",
        status: "todo",
        priority: "medium",
        assigneeAgentId: builder.id,
        goalId: goal.id,
        executionPolicy: {
          commentRequired: true,
          stages: [{
            type: "review",
            participants: [{ type: "agent", agentId: reviewer.id }],
          }],
        },
      },
    });
    checks.push(check("Issue stores native Agent review policy", reviewIssue.executionPolicy?.stages?.[0]?.type === "review", reviewIssue.executionPolicy, "review stage"));
    await api(`/api/issues/${reviewIssue.id}`, {
      method: "PATCH",
      body: { status: "in_review", comment: "Deterministic fixture ready for independent review." },
    });
    const pendingReview = await api(`/api/issues/${reviewIssue.id}`);
    checks.push(check("Native review activates independent reviewer", pendingReview.executionState?.currentParticipant?.agentId === reviewer.id, pendingReview.executionState?.currentParticipant, { type: "agent", agentId: reviewer.id }));

    const highRiskIssue = await api(`/api/companies/${company.id}/issues`, {
      method: "POST",
      body: {
        title: "High-risk native approval contract",
        description: "Disposable policy fixture; no external action is performed.",
        status: "backlog",
        priority: "high",
        assigneeAgentId: builder.id,
        goalId: goal.id,
        executionPolicy: {
          commentRequired: true,
          stages: [
            { type: "review", participants: [{ type: "agent", agentId: reviewer.id }] },
            { type: "approval", participants: [{ type: "user", userId: "local-board" }] },
          ],
        },
      },
    });
    checks.push(check(
      "High-risk policy places human approval after Agent review",
      highRiskIssue.executionPolicy?.stages?.map((stage) => stage.type).join(",") === "review,approval",
      highRiskIssue.executionPolicy?.stages?.map((stage) => stage.type),
      ["review", "approval"],
    ));
  } catch (error) {
    fatal = error instanceof Error ? error.stack ?? error.message : String(error);
  } finally {
    if (company && plugin) {
      try {
        const state = await operationData(plugin.id, company.id);
        if (state.state.mode !== "normal") await operationAction(plugin.id, company.id, "resume-normal");
        await api(`/api/companies/${company.id}/archive`, { method: "POST" });
      } catch (error) {
        fatal ??= `Cleanup failed: ${String(error)}`;
      }
    }
  }

  const passed = fatal === null && checks.length === 15 && checks.every((item) => item.passed);
  const report = {
    passed,
    startedAt,
    finishedAt: new Date().toISOString(),
    paperclipUrl: baseUrl,
    companyId: company?.id ?? null,
    fatal,
    checks,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = passed ? 0 : 1;
}

if (process.argv.includes("--preflight")) {
  console.log(JSON.stringify(await preflight(), null, 2));
} else {
  await run();
}
