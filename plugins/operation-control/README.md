# Paperclip Operation and Delivery Control

Company-wide maintenance control and Goal → Milestone → Task delivery gates without forking Paperclip.

- `Finish current work, then pause` leaves runs that were already active alone. New runs observed after the hold flag are cancelled, and each existing agent is paused after its last run finishes.
- `Pause now` pauses every non-owner agent immediately, cancelling active runs.
- The Maintainer is the default maintenance owner and remains available in both modes.
- Returning to normal resumes only agents paused by this plugin.
- An optional `maxRunsPerHour` counts Paperclip run-start events per Company. The first run above the limit is cancelled, all Agents enter immediate maintenance, and the Board can reset the window only by resuming normal operation in the dashboard.
- State is stored per company and mirrored to a `Company Operation State` issue document Artifact.
- Maintainer Routines can read the same state through the Agent-only `inspect-operation-state` action without receiving pause or resume authority.
- Starting maintenance and returning to normal are authenticated human actions. Delivery mutations are rejected unless Company operation is `normal`.

## Delivery control

The plugin exposes a controlled path:

`adopt-goal` → `propose-milestone` → `confirm-milestone` → `create-root-task` → `create-child-task` → `review-node` → `request-milestone-review` → direct Board decision.

- Adopting an existing company Goal and both Milestone decisions require a human actor. A proposal includes a human-readable scope description; the Board can accept it or request changes with a reason.
- Goal adoption, accepted Milestone confirmation, requested draft revision, and final Milestone acceptance create an idempotent Paperclip orchestration Task and wake the configured orchestrator. This keeps the workflow moving while leaving product work behind the human Gate.
- If orchestration stalls in a planning phase, the Board can re-wake the single pending orchestration Task or recreate a missing one with **Repair stalled delivery**. A completed earlier recovery does not block a fresh attempt. Human gates and active delivery are intentionally left untouched.
- Milestone proposal and Root Task creation require an Agent whose role matches the configured `orchestratorRole`.
- Each Milestone has exactly one tracked Root Task. Distinct delivery areas are Node Tasks below that Root, so Git reporting and final Board review have one canonical revision.
- Child creation requires the parent owner, an independent executor, and sibling blockers are validated.
- The first Node rejection creates a remediation child. A second rejection of the same Node stops automatic remediation and records that a Board design or scope decision is required; approval remains available after that decision. Human Milestone rejection also creates a remediation child below the Root Task.
- Root approval returns the Task to the configured orchestrator. The orchestrator submits `docs/milestones/<milestone-id>.md`, its full Git commit SHA, summary and evidence for Board review.
- The plugin resolves the Root Task's Paperclip execution workspace, or its primary Project workspace, and rejects the report unless the commit exists, is reachable from `HEAD`, and contains that exact report path.
- Only the authenticated Board action in the dashboard widget can accept or reject that report. Agents have no final-decision tool.
- Acceptance completes the Milestone. Rejection reopens delivery with an independently assigned remediation child. After completion the orchestrator can propose the next Milestone under the same company Goal.
- Direct child creation and direct completion of a parent with children are cancelled/reopened by the event guard.
- Orchestration Tasks carry the exact plugin-tool invocation fallback. A rejected proposal also carries the previous description so the orchestrator can revise it without scanning server source or past sessions.

Agents receive only `propose-milestone`, `create-root-task`, `create-child-task`, `review-node`, and `request-milestone-review`. Keep worker Agents' normal task-assignment permission disabled; these plugin tools are the narrow delivery path.

The current Paperclip plugin SDK cannot read a resolved interaction or mutate an Issue's native execution policy. The plugin therefore enforces Node/Root review through its own tools and uses a direct, authenticated Board action for the final Milestone gate instead of trusting an Agent to relay a human response.

Configure the workflow owner and run ceiling through the plugin instance configuration, for example `{ "orchestratorRole": "ceo", "maxRunsPerHour": 20 }`. The plugin does not infer an owner from an Agent name or a hardcoded role.

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
