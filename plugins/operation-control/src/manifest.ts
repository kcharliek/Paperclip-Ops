import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest = {
  id: "local.operation-control",
  apiVersion: 1,
  version: "0.3.0",
  displayName: "Operation Control",
  description: "Drain or immediately pause agents and enforce human-gated Goal → Milestone → Task delivery.",
  author: "Local",
  categories: ["automation", "ui"],
  capabilities: [
    "agents.read",
    "agents.pause",
    "agents.resume",
    "agent.tools.register",
    "events.subscribe",
    "plugin.state.read",
    "plugin.state.write",
    "goals.read",
    "goals.create",
    "goals.update",
    "project.workspaces.read",
    "execution.workspaces.read",
    "issues.read",
    "issues.create",
    "issues.update",
    "issues.wakeup",
    "issue.relations.read",
    "issue.subtree.read",
    "issue.comments.create",
    "issue.documents.write",
    "ui.dashboardWidget.register"
  ],
  instanceConfigSchema: {
    type: "object",
    properties: {
      orchestratorRole: {
        type: "string",
        minLength: 1,
        title: "Workflow orchestrator role",
        description: "Agent role allowed to propose Milestones and create Root Tasks."
      }
    },
    required: ["orchestratorRole"],
    additionalProperties: false
  },
  tools: [
    {
      name: "propose-milestone",
      displayName: "Propose Milestone",
      description: "Create a Milestone proposal below a registered Goal.",
      parametersSchema: {
        type: "object",
        properties: {
          goalId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["goalId", "title"]
      }
    },
    {
      name: "create-root-task",
      displayName: "Create Root Task",
      description: "Create the Root Task after human Milestone confirmation.",
      parametersSchema: {
        type: "object",
        properties: {
          goalId: { type: "string" },
          projectId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          assigneeAgentId: { type: "string" }
        },
        required: ["goalId", "title", "assigneeAgentId"]
      }
    },
    {
      name: "create-child-task",
      displayName: "Create child Task",
      description: "Create a child Task below the current Agent's owned Node Task.",
      parametersSchema: {
        type: "object",
        properties: {
          parentIssueId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          assigneeAgentId: { type: "string" },
          blockedByIssueIds: { type: "array", items: { type: "string" } }
        },
        required: ["parentIssueId", "title", "assigneeAgentId"]
      }
    },
    {
      name: "review-node",
      displayName: "Review Node Task",
      description: "Approve or reject a Node Task after its child Tasks finish.",
      parametersSchema: {
        type: "object",
        properties: {
          issueId: { type: "string" },
          decision: { type: "string", enum: ["approved", "rejected"] },
          reason: { type: "string" },
          assigneeAgentId: { type: "string" }
        },
        required: ["issueId", "decision"]
      }
    },
    {
      name: "request-milestone-review",
      displayName: "Request Milestone Review",
      description: "Send a Git-backed Milestone completion report to the Board for confirmation.",
      parametersSchema: {
        type: "object",
        properties: {
          goalId: { type: "string" },
          reportPath: { type: "string" },
          commitSha: { type: "string" },
          summary: { type: "string" },
          evidence: { type: "string" }
        },
        required: ["goalId", "reportPath", "commitSha", "summary"]
      }
    }
  ],
  entrypoints: {
    worker: "dist/worker.js",
    ui: "dist/ui"
  },
  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "operation-control",
        displayName: "Operation Control",
        exportName: "OperationControlWidget"
      }
    ]
  }
} satisfies PaperclipPluginManifestV1;

export default manifest;
