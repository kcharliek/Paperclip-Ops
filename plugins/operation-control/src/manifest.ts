import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest = {
  id: "local.operation-control",
  apiVersion: 1,
  version: "1.0.0",
  displayName: "Operation Control",
  description: "Maintenance safety, run caps and one-shot autonomous dispatch of Company Goals to Paperclip native Tasks.",
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
    "issues.read",
    "issues.create",
    "issues.wakeup",
    "ui.dashboardWidget.register"
  ],
  instanceConfigSchema: {
    type: "object",
    properties: {
      orchestratorRole: {
        type: "string",
        minLength: 1,
        title: "Autonomous Goal orchestrator role",
        description: "The single active Agent role that receives new Company Goals and decomposes them into native Tasks."
      },
      autoDispatchGoals: {
        type: "boolean",
        title: "Automatically dispatch Company Goals",
        description: "Create one idempotent orchestration Task when an active Company Goal is created or resumed."
      },
      maxRunsPerHour: {
        type: "integer",
        minimum: 1,
        title: "Company runs per hour",
        description: "Immediately pause all Agents when this hourly run-start limit is exceeded."
      }
    },
    required: ["orchestratorRole"],
    additionalProperties: false
  },
  tools: [
    {
      name: "inspect-operation-state",
      displayName: "Inspect Operation State",
      description: "Read maintenance mode, run budget and autonomous Goal dispatch configuration.",
      parametersSchema: { type: "object", properties: {}, additionalProperties: false }
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
