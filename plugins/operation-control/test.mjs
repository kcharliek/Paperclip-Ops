import assert from "node:assert/strict";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "./dist/manifest.js";
import plugin from "./dist/worker.js";

const companyId = "00000000-0000-4000-8000-000000000001";
const ownerId = "00000000-0000-4000-8000-000000000002";
const workerId = "00000000-0000-4000-8000-000000000003";
const manualPauseId = "00000000-0000-4000-8000-000000000004";
const now = new Date();

const agent = (id, name, status) => ({
  id,
  companyId,
  name,
  urlKey: name.toLowerCase().replaceAll(" ", "-"),
  role: "engineer",
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
    agent(ownerId, "Tech Manager", "idle"),
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

console.log("operation-control: ok");
