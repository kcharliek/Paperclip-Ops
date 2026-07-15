import assert from "node:assert/strict";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "./dist/manifest.js";
import plugin from "./dist/worker.js";

const companyId = "00000000-0000-4000-8000-000000000001";
const ownerId = "00000000-0000-4000-8000-000000000002";
const workerId = "00000000-0000-4000-8000-000000000003";
const manualPauseId = "00000000-0000-4000-8000-000000000004";
const now = new Date();

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
harness.setConfig({ orchestratorRole: "ceo" });
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
  agents: [
    agent(ownerId, "Configured Coordinator", "idle", "ceo"),
    agent(workerId, "Engineer", "running"),
    agent(manualPauseId, "Already Paused", "paused"),
  ],
});
await plugin.definition.setup(harness.ctx);

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

const human = { type: "user", userId: "local-board" };
const steward = { type: "agent", agentId: ownerId, runId: "run-steward" };
const builder = { type: "agent", agentId: workerId, runId: "run-builder" };

await harness.performAction("resume-normal", {}, { companyId });
const goal = await harness.performAction("register-goal", {
  title: "Workflow contract",
  description: "Verify human gates and recursive Task review.",
}, { companyId, actor: human });
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
const root = await harness.performAction("create-root-task", {
  goalId: goal.id,
  title: "Delivery root",
  assigneeAgentId: workerId,
}, { companyId, actor: steward });
const childOne = await harness.performAction("create-child-task", {
  parentIssueId: root.id,
  title: "Child one",
  assigneeAgentId: manualPauseId,
}, { companyId, actor: builder });
const childTwo = await harness.performAction("create-child-task", {
  parentIssueId: root.id,
  title: "Child two",
  assigneeAgentId: manualPauseId,
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
await harness.ctx.issues.update(childOne.id, { status: "done" }, companyId, { actorAgentId: manualPauseId });
await harness.ctx.issues.update(childTwo.id, { status: "done" }, companyId, { actorAgentId: manualPauseId });
await harness.performAction("review-node", {
  issueId: root.id,
  decision: "approved",
}, { companyId, actor: builder });
let delivery = await harness.getData("delivery-control", { companyId, goalId: goal.id });
assert.equal(delivery.state.phase, "awaiting_human_confirmation");
assert.equal(delivery.root.id, root.id);

const remediation = await harness.performAction("review-milestone", {
  goalId: goal.id,
  decision: "rejected",
  reason: "Human acceptance evidence is incomplete.",
  assigneeAgentId: manualPauseId,
}, { companyId, actor: human });
assert.equal(remediation.phase, "executing");
const rejectedRoot = await harness.ctx.issues.get(root.id, companyId);
assert.equal(rejectedRoot.status, "in_progress");
const remediationIssue = await harness.ctx.issues.get(remediation.remediationIssueId, companyId);
assert.equal(remediationIssue.parentId, root.id);

const rogueChild = await harness.ctx.issues.create({
  companyId,
  parentId: root.id,
  goalId: milestone.id,
  title: "Rogue child",
  status: "todo",
  priority: "low",
  assigneeAgentId: manualPauseId,
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
await harness.ctx.issues.update(remediationIssue.id, { status: "done" }, companyId, { actorAgentId: manualPauseId });
await harness.performAction("review-node", {
  issueId: root.id,
  decision: "approved",
}, { companyId, actor: builder });
await harness.performAction("review-milestone", {
  goalId: goal.id,
  decision: "approved",
}, { companyId, actor: human });
delivery = await harness.getData("delivery-control", { companyId, goalId: goal.id });
assert.equal(delivery.state.phase, "completed");
assert.equal(delivery.milestone.status, "achieved");

console.log("operation-control: ok");
