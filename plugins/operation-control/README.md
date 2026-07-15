# Paperclip Operation and Delivery Control

Company-wide maintenance control and Goal → Milestone → Task delivery gates without forking Paperclip.

- `Finish current work, then pause` leaves runs that were already active alone. New runs observed after the hold flag are cancelled, and each existing agent is paused after its last run finishes.
- `Pause now` pauses every non-owner agent immediately, cancelling active runs.
- The Maintainer is the default maintenance owner and remains available in both modes.
- Returning to normal resumes only agents paused by this plugin.
- State is stored per company and mirrored to a `Company Operation State` issue document Artifact.

## Delivery control

The plugin exposes `delivery-control` actions for the controlled path:

`register-goal` → `propose-milestone` → `confirm-milestone` → `create-root-task` → `create-child-task` → `review-node` → `request-milestone-review` → `record-milestone-confirmation`.

- Goal registration and Milestone confirmation require a human actor.
- Milestone proposal and Root Task creation require an Agent whose role matches the configured `orchestratorRole`.
- Child creation requires the parent owner, an independent executor, and sibling blockers are validated.
- Node rejection creates a remediation child. Human Milestone rejection also creates a remediation child below the Root Task.
- Root approval returns the Task to the configured orchestrator. The orchestrator verifies `docs/milestones/<milestone-id>.md` and its full Git commit SHA before sending a native Paperclip `request_confirmation`.
- Paperclip wakes the orchestrator when the Board responds. The orchestrator records that exact interaction ID and response through `record-milestone-confirmation`; acceptance completes the Milestone and rejection reopens delivery with a remediation child.
- Direct child creation and direct completion of a parent with children are cancelled/reopened by the event guard.

Agents receive `propose-milestone`, `create-root-task`, `create-child-task`, `review-node`, `request-milestone-review`, and `record-milestone-confirmation` tools. Keep worker Agents' normal task-assignment permission disabled; these plugin tools are the narrow delivery path.

The current Paperclip SDK can create an interaction but cannot read its resolved state or subscribe to an interaction-resolution event. Until that SDK surface exists, `record-milestone-confirmation` trusts only the configured orchestrator to relay the Board continuation payload; the pending interaction ID must match plugin state.

Configure the workflow owner through the plugin instance configuration, for example `{ "orchestratorRole": "ceo" }`. The plugin does not infer an owner from an Agent name or a hardcoded role.

## Build and install

```bash
npm install
npm test
```

In Paperclip, install a local-path plugin using:

```text
/Users/chanheekim/Dev/PaperClip-Ops/plugins/operation-control
```

The control appears as an **Operation Control** dashboard widget.

This uses only the public plugin SDK. The SDK has no synchronous write-veto hook, so the guard is post-event; controlled actions/tools are the authoritative path and illegal direct writes are immediately cancelled or reopened.
