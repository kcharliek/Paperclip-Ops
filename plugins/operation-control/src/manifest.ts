import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest = {
  id: "local.operation-control",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Operation Control",
  description: "Drain or immediately pause agents while a maintenance owner keeps working.",
  author: "Local",
  categories: ["automation", "ui"],
  capabilities: [
    "agents.read",
    "agents.pause",
    "agents.resume",
    "events.subscribe",
    "plugin.state.read",
    "plugin.state.write",
    "issues.read",
    "issues.create",
    "issue.documents.write",
    "ui.dashboardWidget.register"
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
