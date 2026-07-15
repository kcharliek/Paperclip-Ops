# Paperclip Operation Control

Company-wide maintenance control without forking Paperclip.

- `Finish current work, then pause` leaves runs that were already active alone. New runs observed after the hold flag are cancelled, and each existing agent is paused after its last run finishes.
- `Pause now` pauses every non-owner agent immediately, cancelling active runs.
- The maintenance owner remains available in both modes.
- Returning to normal resumes only agents paused by this plugin.
- State is stored per company and mirrored to a `Company Operation State` issue document Artifact.

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

This uses only the public plugin SDK. Because the SDK has no synchronous run-admission hook, a newly queued run may start briefly before the plugin receives `agent.run.started` and pauses it.
