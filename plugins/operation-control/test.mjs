import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "./dist/manifest.js";
import plugin from "./dist/worker.js";

const companyId = "00000000-0000-4000-8000-000000000001";
const ownerId = "00000000-0000-4000-8000-000000000002";
const workerId = "00000000-0000-4000-8000-000000000003";
const manualPauseId = "00000000-0000-4000-8000-000000000004";
const reviewerId = "00000000-0000-4000-8000-000000000005";
const projectId = "00000000-0000-4000-8000-000000000006";
const workspaceId = "00000000-0000-4000-8000-000000000007";
const now = new Date();
const gitWorkspace = mkdtempSync(join(tmpdir(), "operation-control-git-"));
process.on("exit", () => rmSync(gitWorkspace, { recursive: true, force: true }));
const git = (...args) => execFileSync("git", args, { cwd: gitWorkspace, encoding: "utf8" }).trim();
git("init", "-q");
git("config", "user.name", "Operation Control Test");
git("config", "user.email", "operation-control@example.invalid");
writeFileSync(join(gitWorkspace, "README.md"), "# Fixture\n");
git("add", "README.md");
git("commit", "-qm", "fixture");
const baselineCommit = git("rev-parse", "HEAD");

const agent = (id, name, status, role = "engineer") => ({
  id,
  companyId,
  name,
  urlKey: name.toLowerCase().replaceAll(" ", "-"),
  role,
  title: name,
  icon: null,
  status,
  reportsTo: null,
  capabilities: null,
  adapterType: "process",
  adapterConfig: {},
  runtimeConfig: {},
  defaultEnvironmentId: null,
  budgetMonthlyCents: 0,
  spentMonthlyCents: 0,
  pauseReason: null,
  pausedAt: status === "paused" ? now : null,
  permissions: { canCreateAgents: false },
  lastHeartbeatAt: null,
  metadata: null,
  createdAt: now,
  updatedAt: now,
});

const harness = createTestHarness({ manifest });
harness.setConfig({ orchestratorRole: "ceo", maxRunsPerHour: 2 });
harness.seed({
  companies: [{
    id: companyId,
    name: "Test Company",
    description: null,
    status: "active",
    pauseReason: null,
    pausedAt: null,
    issuePrefix: "TEST",
    issueCounter: 0,
    budgetMonthlyCents: 0,
    spentMonthlyCents: 0,
    attachmentMaxBytes: 10_485_760,
    defaultResponsibleUserId: null,
    requireBoardApprovalForNewAgents: false,
    feedbackDataSharingEnabled: false,
    feedbackDataSharingConsentAt: null,
    feedbackDataSharingConsentByUserId: null,
    feedbackDataSharingTermsVersion: null,
    brandColor: null,
    logoAssetId: null,
    logoUrl: null,
    createdAt: now,
    updatedAt: now,
  }],
  projects: [{ id: projectId, companyId }],
  projectWorkspaces: [{
    id: workspaceId,
    projectId,
    name: "Git fixture",
    path: gitWorkspace,
    repoUrl: null,
    repoRef: null,
    defaultRef: null,
    isPrimary: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }],
  agents: [
    agent(ownerId, "Configured Coordinator", "idle", "ceo"),
    agent(workerId, "Engineer", "running"),
    agent(manualPauseId, "Already Paused", "paused"),
    agent(reviewerId, "Independent Reviewer", "idle", "qa"),
  ],
});
await plugin.definition.setup(harness.ctx);
assert.equal(
  manifest.tools?.some((tool) => tool.name === "record-milestone-confirmation"),
  false,
  "Agents must not receive a tool that can record the final Board decision",
);

await harness.performAction("start-maintenance", {
  ownerAgentId: ownerId,
  stopPolicy: "drain",
  reason: "Debt cleanup",
}, { companyId });

let data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "holding");
assert.equal(data.agents.find((item) => item.id === workerId).status, "running");

harness.seed({ agents: [agent(workerId, "Engineer", "idle")] });
await harness.emit("agent.run.finished", { agentId: workerId }, { companyId });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "maintenance");
assert.equal(data.agents.find((item) => item.id === workerId).status, "paused");

await harness.performAction("resume-normal", {}, { companyId });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "normal");
assert.equal(data.agents.find((item) => item.id === workerId).status, "idle");
assert.equal(data.agents.find((item) => item.id === manualPauseId).status, "paused");

harness.seed({ agents: [agent(workerId, "Engineer", "running")] });
await harness.performAction("start-maintenance", {
  ownerAgentId: ownerId,
  stopPolicy: "immediate",
}, { companyId });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "maintenance");
assert.equal(data.agents.find((item) => item.id === workerId).status, "paused");

await harness.performAction("resume-normal", {}, { companyId });
harness.seed({ agents: [agent(workerId, "Engineer", "running")] });
await harness.emit("agent.run.started", { agentId: workerId }, { companyId });
await harness.emit("agent.run.started", { agentId: workerId }, { companyId });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "normal");
assert.equal(data.runBudget.count, 2);
assert.equal(data.runBudget.limit, 2);
await harness.emit("agent.run.started", { agentId: workerId }, { companyId });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "maintenance");
assert.match(data.state.reason, /Hourly run limit exceeded \(3\/2\)/);
assert.equal(data.agents.find((item) => item.id === workerId).status, "paused");
assert.equal(data.agents.find((item) => item.id === ownerId).status, "paused");
await harness.performAction("resume-normal", {}, { companyId });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "normal");
assert.equal(data.runBudget.count, 0);
assert.equal(data.agents.find((item) => item.id === manualPauseId).status, "paused");

const human = { type: "user", userId: "local-board" };
const steward = { type: "agent", agentId: ownerId, runId: "run-steward" };
const builder = { type: "agent", agentId: workerId, runId: "run-builder" };

const goal = await harness.ctx.goals.create({
  companyId,
  title: "Workflow contract",
  description: "Verify human gates and recursive Task review.",
  level: "company",
  status: "active",
});
await harness.performAction("adopt-goal", { goalId: goal.id }, { companyId, actor: human });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.delivery.state.goalId, goal.id);
assert.equal(data.delivery.state.phase, "goal_registered");
const milestone = await harness.performAction("propose-milestone", {
  goalId: goal.id,
  title: "First delivery slice",
}, { companyId, actor: steward });
await assert.rejects(
  () => harness.performAction("create-root-task", {
    goalId: goal.id,
    title: "Should wait for human",
    assigneeAgentId: workerId,
  }, { companyId, actor: steward }),
  /human-confirmed/,
);
await harness.performAction("confirm-milestone", { goalId: goal.id }, { companyId, actor: human });
await assert.rejects(
  () => harness.performAction("create-root-task", {
    goalId: goal.id,
    title: "Orchestrator must not execute",
    assigneeAgentId: ownerId,
  }, { companyId, actor: steward }),
  /active execution Agent/,
);
const root = await harness.performAction("create-root-task", {
  goalId: goal.id,
  projectId,
  title: "Delivery root",
  assigneeAgentId: workerId,
}, { companyId, actor: steward });
await harness.ctx.issues.update(root.id, { status: "backlog" }, companyId, { actorAgentId: ownerId });
await assert.rejects(
  () => harness.performAction("create-child-task", {
    parentIssueId: root.id,
    title: "Backlog child",
    assigneeAgentId: manualPauseId,
  }, { companyId, actor: builder }),
  /promoted to todo/,
);
await harness.ctx.issues.update(root.id, { status: "todo" }, companyId, { actorAgentId: ownerId });
await assert.rejects(
  () => harness.performAction("create-child-task", {
    parentIssueId: root.id,
    title: "Paused executor",
    assigneeAgentId: manualPauseId,
  }, { companyId, actor: builder }),
  /active and invokable/,
);
const childOne = await harness.performAction("create-child-task", {
  parentIssueId: root.id,
  title: "Child one",
  assigneeAgentId: reviewerId,
}, { companyId, actor: builder });
const childTwo = await harness.performAction("create-child-task", {
  parentIssueId: root.id,
  title: "Child two",
  assigneeAgentId: reviewerId,
  blockedByIssueIds: [childOne.id],
}, { companyId, actor: builder });
assert.equal(childTwo.parentId, root.id);
assert.deepEqual((await harness.ctx.issues.relations.get(childTwo.id, companyId)).blockedBy.map((item) => item.id), [childOne.id]);
await assert.rejects(
  () => harness.performAction("review-node", {
    issueId: root.id,
    decision: "approved",
  }, { companyId, actor: builder }),
  /terminal/,
);
await harness.ctx.issues.update(childOne.id, { status: "done" }, companyId, { actorAgentId: reviewerId });
await harness.ctx.issues.update(childTwo.id, { status: "done" }, companyId, { actorAgentId: reviewerId });
const firstNodeRejection = await harness.performAction("review-node", {
  issueId: root.id,
  decision: "rejected",
  reason: "Evidence does not satisfy the Node contract",
  assigneeAgentId: reviewerId,
}, { companyId, actor: builder });
const firstNodeRemediation = await harness.ctx.issues.get(firstNodeRejection.remediationIssueId, companyId);
assert.equal(firstNodeRemediation?.parentId, root.id);
await harness.ctx.issues.update(
  firstNodeRejection.remediationIssueId,
  { status: "done" },
  companyId,
  { actorAgentId: reviewerId },
);
const childrenBeforeSecondNodeRejection = await harness.ctx.issues.getSubtree(root.id, companyId, { includeRoot: false });
await assert.rejects(
  () => harness.performAction("review-node", {
    issueId: root.id,
    decision: "rejected",
    reason: "The same Node contract is still not satisfied",
    assigneeAgentId: reviewerId,
  }, { companyId, actor: builder }),
  /rejected twice/,
);
const childrenAfterSecondNodeRejection = await harness.ctx.issues.getSubtree(root.id, companyId, { includeRoot: false });
assert.equal(childrenAfterSecondNodeRejection.issues.length, childrenBeforeSecondNodeRejection.issues.length);
assert.equal(await harness.ctx.state.get({
  scopeKind: "issue",
  scopeId: root.id,
  stateKey: "delivery-node-rejection-count",
}), 2);
const rootReview = await harness.performAction("review-node", {
  issueId: root.id,
  decision: "approved",
}, { companyId, actor: builder });
assert.equal(rootReview.next, "milestone_report");
let delivery = await harness.getData("delivery-control", { companyId, goalId: goal.id });
assert.equal(delivery.state.phase, "executing");
assert.equal(delivery.root.id, root.id);
assert.equal(delivery.root.status, "in_review");
assert.equal(delivery.root.assigneeAgentId, ownerId);

const reportPath = `docs/milestones/${milestone.id}.md`;
await assert.rejects(
  () => harness.executeTool("request-milestone-review", {
    goalId: goal.id,
    reportPath,
    commitSha: "abc123",
    summary: "Ready for review.",
  }, { companyId, agentId: ownerId, runId: "run-report" }),
  /full Git commit SHA/,
);
await assert.rejects(
  () => harness.executeTool("request-milestone-review", {
    goalId: goal.id,
    reportPath,
    commitSha: "f".repeat(40),
    summary: "Unknown commit.",
  }, { companyId, agentId: ownerId, runId: "run-unknown-commit" }),
  /does not exist in the Root Task workspace/,
);
await assert.rejects(
  () => harness.executeTool("request-milestone-review", {
    goalId: goal.id,
    reportPath,
    commitSha: baselineCommit,
    summary: "Report is not committed yet.",
  }, { companyId, agentId: ownerId, runId: "run-missing-report" }),
  /does not contain the Milestone report/,
);
mkdirSync(join(gitWorkspace, "docs", "milestones"), { recursive: true });
writeFileSync(join(gitWorkspace, reportPath), "# First completion report\n");
git("add", reportPath);
git("commit", "-qm", "first milestone report");
const firstCommit = git("rev-parse", "HEAD");
const firstRequest = await harness.executeTool("request-milestone-review", {
  goalId: goal.id,
  reportPath,
  commitSha: firstCommit,
  summary: "First completion report.",
  evidence: "All scoped checks passed.",
}, { companyId, agentId: ownerId, runId: "run-report" });
assert.equal(firstRequest.data.phase, "awaiting_human_confirmation");
assert.equal(firstRequest.data.report.path, reportPath);
assert.equal(firstRequest.data.report.commitSha, firstCommit);
await assert.rejects(
  () => harness.performAction("record-milestone-confirmation", {
    goalId: goal.id,
    decision: "accepted",
  }, { companyId, actor: steward }),
  /human actor/,
);

const remediation = await harness.performAction("record-milestone-confirmation", {
  goalId: goal.id,
  decision: "rejected",
  reason: "Human acceptance evidence is incomplete.",
  assigneeAgentId: reviewerId,
}, { companyId, actor: human });
assert.equal(remediation.phase, "executing");
const rejectedRoot = await harness.ctx.issues.get(root.id, companyId);
assert.equal(rejectedRoot.status, "in_progress");
assert.equal(rejectedRoot.assigneeAgentId, workerId);
const remediationIssue = await harness.ctx.issues.get(remediation.remediationIssueId, companyId);
assert.equal(remediationIssue.parentId, root.id);

const rogueChild = await harness.ctx.issues.create({
  companyId,
  parentId: root.id,
  goalId: milestone.id,
  title: "Rogue child",
  status: "todo",
  priority: "low",
  assigneeAgentId: reviewerId,
  actor: { actorAgentId: workerId },
});
await harness.emit("issue.created", { issueId: rogueChild.id }, {
  companyId,
  entityId: rogueChild.id,
  entityType: "issue",
  actorType: "agent",
  actorId: workerId,
});
assert.equal((await harness.ctx.issues.get(rogueChild.id, companyId)).status, "cancelled");

await harness.ctx.issues.update(root.id, { status: "done" }, companyId, { actorAgentId: workerId });
await harness.emit("issue.updated", { issueId: root.id }, {
  companyId,
  entityId: root.id,
  entityType: "issue",
  actorType: "agent",
  actorId: workerId,
});
assert.equal((await harness.ctx.issues.get(root.id, companyId)).status, "in_review");
await harness.ctx.issues.update(remediationIssue.id, { status: "done" }, companyId, { actorAgentId: reviewerId });
await harness.performAction("review-node", {
  issueId: root.id,
  decision: "approved",
}, { companyId, actor: builder });
writeFileSync(join(gitWorkspace, reportPath), "# Remediated completion report\n");
git("add", reportPath);
git("commit", "-qm", "remediate milestone report");
const secondCommit = git("rev-parse", "HEAD");
const secondRequest = await harness.executeTool("request-milestone-review", {
  goalId: goal.id,
  reportPath,
  commitSha: secondCommit,
  summary: "Remediated completion report.",
}, { companyId, agentId: ownerId, runId: "run-report-2" });
await harness.performAction("record-milestone-confirmation", {
  goalId: goal.id,
  decision: "accepted",
}, { companyId, actor: human });
delivery = await harness.getData("delivery-control", { companyId, goalId: goal.id });
assert.equal(delivery.state.phase, "completed");
assert.equal(delivery.milestone.status, "achieved");
assert.equal(delivery.root.status, "done");

const nextMilestone = await harness.performAction("propose-milestone", {
  goalId: goal.id,
  title: "Second delivery slice",
}, { companyId, actor: steward });
assert.notEqual(nextMilestone.id, milestone.id);
delivery = await harness.getData("delivery-control", { companyId, goalId: goal.id });
assert.equal(delivery.state.phase, "milestone_pending");
assert.equal(delivery.state.milestoneId, nextMilestone.id);
assert.equal(delivery.state.rootTaskId, null);
assert.equal((await harness.ctx.goals.get(milestone.id, companyId)).status, "achieved");

console.log("operation-control: ok");
