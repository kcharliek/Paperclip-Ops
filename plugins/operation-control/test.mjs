import assert from "node:assert/strict";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "./dist/manifest.js";
import plugin from "./dist/worker.js";

const companyId = "00000000-0000-4000-8000-000000000001";
const ownerId = "00000000-0000-4000-8000-000000000002";
const workerId = "00000000-0000-4000-8000-000000000003";
const manualPauseId = "00000000-0000-4000-8000-000000000004";
const goalId = "00000000-0000-4000-8000-000000000005";
const deferredGoalId = "00000000-0000-4000-8000-000000000006";
const teamGoalId = "00000000-0000-4000-8000-000000000007";
const retryGoalId = "00000000-0000-4000-8000-000000000008";
const human = { type: "user", userId: "local-board" };
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

const goal = (id, title, level = "company", status = "active") => ({
  id,
  companyId,
  title,
  description: `${title} description`,
  level,
  status,
  parentId: null,
  ownerAgentId: null,
  createdAt: now,
  updatedAt: now,
});

const harness = createTestHarness({ manifest });
harness.setConfig({ orchestratorRole: "ceo", autoDispatchGoals: true, maxRunsPerHour: 2 });
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
    agent(ownerId, "Product Steward", "idle", "ceo"),
    agent(workerId, "Builder", "running"),
    agent(manualPauseId, "Already Paused", "paused", "qa"),
  ],
});

await plugin.definition.setup(harness.ctx);

assert.equal(manifest.version, "1.0.0");
assert.deepEqual(manifest.tools?.map((tool) => tool.name), ["inspect-operation-state"]);
for (const removedTool of ["propose-milestone", "create-root-task", "create-child-task", "review-node", "request-milestone-review"]) {
  assert.equal(manifest.tools?.some((tool) => tool.name === removedTool), false);
}

const inspected = await harness.performAction("inspect-operation-state", {}, {
  companyId,
  actor: { type: "agent", agentId: ownerId, runId: "run-inspection" },
});
assert.equal(inspected.state.mode, "normal");
assert.equal(inspected.autonomy.deliveryControl, "paperclip-native");
assert.equal(inspected.autonomy.autoDispatchGoals, true);
assert.equal(inspected.runBudget.limit, 2);
await assert.rejects(
  () => harness.performAction("inspect-operation-state", {}, { companyId, actor: human }),
  /requires an Agent actor/,
);
await assert.rejects(
  () => harness.performAction("start-maintenance", {
    ownerAgentId: ownerId,
    stopPolicy: "immediate",
  }, { companyId, actor: { type: "agent", agentId: ownerId, runId: "run-maintenance" } }),
  /requires a human actor/,
);

await harness.performAction("start-maintenance", {
  ownerAgentId: ownerId,
  stopPolicy: "drain",
  reason: "Maintenance contract test",
}, { companyId, actor: human });
let data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "holding");
assert.equal(data.agents.find((item) => item.id === ownerId).status, "idle");
assert.equal(data.agents.find((item) => item.id === workerId).status, "running");

harness.seed({ agents: [agent(workerId, "Builder", "idle")] });
await harness.emit("agent.run.finished", { agentId: workerId }, { companyId });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "maintenance");
assert.equal(data.agents.find((item) => item.id === workerId).status, "paused");

await harness.performAction("resume-normal", {}, { companyId, actor: human });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "normal");
assert.equal(data.agents.find((item) => item.id === workerId).status, "idle");
assert.equal(data.agents.find((item) => item.id === manualPauseId).status, "paused");

harness.seed({ goals: [goal(goalId, "Autonomous product improvement")] });
await harness.emit("goal.created", { goalId }, {
  companyId,
  entityId: goalId,
  entityType: "goal",
  actorType: "user",
});
let dispatches = await harness.ctx.issues.list({
  companyId,
  originKind: "plugin:local.operation-control:goal-dispatch",
  includePluginOperations: true,
  limit: 100,
});
assert.equal(dispatches.length, 1);
assert.equal(dispatches[0].goalId, goalId);
assert.equal(dispatches[0].assigneeAgentId, ownerId);
assert.match(dispatches[0].description ?? "", /Paperclip native Issues/);
assert.match(dispatches[0].description ?? "", /human approval stage only/);
assert.doesNotMatch(dispatches[0].description ?? "", /propose-milestone|review-node/);

await harness.emit("goal.updated", { goalId }, {
  companyId,
  entityId: goalId,
  entityType: "goal",
  actorType: "user",
});
dispatches = await harness.ctx.issues.list({
  companyId,
  originKind: "plugin:local.operation-control:goal-dispatch",
  includePluginOperations: true,
  limit: 100,
});
assert.equal(dispatches.length, 1, "Goal updates must not duplicate the autonomous dispatch Task");

const requestWakeup = harness.ctx.issues.requestWakeup;
let retriedWakeups = 0;
harness.ctx.issues.requestWakeup = async (...args) => {
  retriedWakeups += 1;
  if (retriedWakeups === 1) throw new Error("injected dispatch wakeup failure");
  return requestWakeup(...args);
};
harness.seed({ goals: [goal(retryGoalId, "Retry native Goal dispatch")] });
await assert.rejects(
  () => harness.emit("goal.created", { goalId: retryGoalId }, {
    companyId,
    entityId: retryGoalId,
    entityType: "goal",
    actorType: "user",
  }),
  /injected dispatch wakeup failure/,
);
await harness.emit("goal.updated", { goalId: retryGoalId }, {
  companyId,
  entityId: retryGoalId,
  entityType: "goal",
  actorType: "user",
});
harness.ctx.issues.requestWakeup = requestWakeup;
dispatches = await harness.ctx.issues.list({
  companyId,
  originKind: "plugin:local.operation-control:goal-dispatch",
  includePluginOperations: true,
  limit: 100,
});
assert.equal(dispatches.filter((item) => item.goalId === retryGoalId).length, 1);
assert.equal(retriedWakeups, 2, "An existing dispatch Task retries the native idempotent wakeup without a custom recovery state");

harness.seed({ goals: [goal(teamGoalId, "Team-only planning", "team")] });
await harness.emit("goal.created", { goalId: teamGoalId }, {
  companyId,
  entityId: teamGoalId,
  entityType: "goal",
  actorType: "agent",
});
dispatches = await harness.ctx.issues.list({
  companyId,
  originKind: "plugin:local.operation-control:goal-dispatch",
  includePluginOperations: true,
  limit: 100,
});
assert.equal(dispatches.length, 2, "Team Goals are not independent Company delivery requests");

await harness.performAction("start-maintenance", {
  ownerAgentId: ownerId,
  stopPolicy: "immediate",
}, { companyId, actor: human });
harness.seed({ goals: [goal(deferredGoalId, "Goal created during maintenance")] });
await harness.emit("goal.created", { goalId: deferredGoalId }, {
  companyId,
  entityId: deferredGoalId,
  entityType: "goal",
  actorType: "user",
});
dispatches = await harness.ctx.issues.list({
  companyId,
  originKind: "plugin:local.operation-control:goal-dispatch",
  includePluginOperations: true,
  limit: 100,
});
assert.equal(dispatches.length, 2);

await harness.performAction("resume-normal", {}, { companyId, actor: human });
dispatches = await harness.ctx.issues.list({
  companyId,
  originKind: "plugin:local.operation-control:goal-dispatch",
  includePluginOperations: true,
  limit: 100,
});
assert.equal(dispatches.length, 3, "Resuming normal operation dispatches Goals deferred during maintenance");

const toolResult = await harness.executeTool("inspect-operation-state", {}, {
  companyId,
  agentId: ownerId,
  runId: "run-tool-inspection",
});
assert.equal(toolResult.data.autonomy.deliveryControl, "paperclip-native");

await harness.emit("agent.run.started", { agentId: ownerId }, { companyId });
await harness.emit("agent.run.started", { agentId: workerId }, { companyId });
await harness.emit("agent.run.started", { agentId: ownerId }, { companyId });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "maintenance");
assert.match(data.state.reason ?? "", /Hourly run limit exceeded \(3\/2\)/);

await harness.performAction("resume-normal", {}, { companyId, actor: human });
data = await harness.getData("operation-control", { companyId });
assert.equal(data.state.mode, "normal");
assert.equal(data.runBudget.count, 0);

console.log("operation-control: ok");
