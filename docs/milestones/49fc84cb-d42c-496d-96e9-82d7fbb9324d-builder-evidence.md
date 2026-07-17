# Operation Control live 복구 경계 검증 Builder evidence

- Milestone: `49fc84cb-d42c-496d-96e9-82d7fbb9324d`
- Root: `PAP-18` / `7ae9aa5d-f1e4-4f93-8348-778cee83d519`
- Scope: Maintainer Root exit에서 작성할 final report의 입력 evidence다.
- Not final report: Operation Control이 요구하는 final report path는 `docs/milestones/49fc84cb-d42c-496d-96e9-82d7fbb9324d.md`이며, 해당 파일과 final report commit은 Maintainer Root exit 작업이다.

## Current delivery state

- `PAP-19` Node 1: done. `tests/system/run.mjs`가 매 실행 disposable Company를 만들고 성공 시 archive하는 격리/rollback 경계로 확정됐다.
- `PAP-20` Node 2: done. Board evidence를 Builder가 검토했고, Board-only recovery action은 재실행하지 않았다.
- `PAP-21` Node 3: done. Board evidence를 Builder가 검토했고, 회귀 테스트 commit `e82dc9f33b76810f68d51d283fea8c1f3bff93ef`가 `origin/main`에 있다.
- `PAP-22` Node 4: this evidence bundle and verification handoff.
- Operation Control inspect at Node 4 start: mode `normal`, stopPolicy `drain`, delivery phase `executing`, run budget `10/20`.

## Node evidence for report

### Node 1 isolation

- Issue: `PAP-19` / `d212ec39-e081-4b8d-a227-662924eb741d`
- Boundary: current Ops Company and active PAP delivery state are not used for failure injection.
- Harness: `tests/system/run.mjs` creates runtime disposable Company/Project/Goal/Task IDs inside the run and records them in `report.json` and scenario evidence.
- Cleanup: harness restores disposable operation mode if needed and archives the disposable Company on success; failed runs keep temp workspace/report for inspection.
- Verification note: Builder bearer could not run Board/admin preflight (`GET /api/plugins` returned 403), so no unauthenticated or credential-swapped retry was used.

### Node 2 missing orchestration recovery

- Issue: `PAP-20` / `3682a13d-41d6-4e68-8492-92020868747b`
- Disposable Company: `6ed3cd26-c6e3-4c89-9f7b-14ecc99eb133` (archived)
- Before: delivery phase `goal_registered`; original orchestration Task `e8be51a8-7e03-4b45-b2ae-4e3edb156290` was made terminal by Board.
- Recovery: Board `repair-delivery-orchestration` created Task `15342ad1-bd96-4d73-a2bb-f7f8fdc9a17d`.
- Duplicate check: repeated repair returned `woken` for the same Task ID with exactly one pending orchestration Task.
- Linkage: `originKind` remained `plugin:local.operation-control:delivery-orchestration`; Goal `92305991-404f-4635-b236-414720dbe029` and Project `null` were preserved.
- Cleanup: disposable Company archived; test fixture removed.

### Node 3 wake retry and human gate

- Issue: `PAP-21` / `e1d273f2-1fbe-4952-9b54-0cd4482e8ff4`
- Wake failure disposable Company: `9365fedc-857f-4f3e-b765-e4df45141d22` (archived)
- Existing orchestration Task: `d2a28633-acc8-4190-9a7c-6f1af08c1a27`
- Before retry: phase `goal_registered`, exactly one pending orchestration Task, Root count `0`.
- Failure injection: Board paused the disposable orchestrator; Board repair returned HTTP 502 `Agent is not invokable in its current state`.
- Bounded retry: after Board resumed the same orchestrator, repair returned `woken` with the same issue ID. The same Task moved in progress, pending orchestration Task count stayed `1`, and Root count stayed `0`.
- Human-gate disposable Company: `daa8c562-a478-4afb-af2d-57b556b030f7` (archived)
- Human-gate IDs: Project `72b0d110-7943-4110-b9f3-b7816075e792`, Goal `55cbdcca-51a7-4c60-b2e5-4e6aefcac02d`, Milestone `99e24036-6d33-4d1f-a12f-47850f3db283`, orchestration Task `81481870-ed25-4d39-821a-3dfb9158e9d7`.
- Human-gate result: Board repair returned `{status: human_gate, phase: milestone_pending}`. Phase, Milestone ID, rootTaskId, full Issue ID/status/origin set, and Issue count were unchanged; Root count stayed `0`.

## Regression protection

- Commit: `e82dc9f33b76810f68d51d283fea8c1f3bff93ef` (`test: cover delivery repair retry gates`)
- Changed file: `plugins/operation-control/test.mjs`
- Added coverage:
  - `human_gate` repair no-op preserves delivery phase, milestoneId, rootTaskId, and full Issue ID set.
  - Injected repair wakeup failure does not create duplicate pending orchestration Tasks.
  - The next repair wakes the same Task and preserves the `operation-control:delivery-repair` idempotency key prefix `<issueId>:repair:`.

## Actor and permission boundary

- Board-only actions were executed by Board evidence gates, not by Builder.
- Agent-only propose-milestone actions in disposable evidence used the disposable Product Steward bearer/run context.
- Builder did not remove, replace, or omit the provided authentication headers after 401/403.
- During Node 4, `GET /api/plugins` with Builder bearer returned HTTP 403 `Board access required`; no unauthenticated retry was attempted.
- Operation Control state was checked through the known plugin action using the provided Builder bearer and returned mode `normal`.

## Verification commands

- `cd plugins/operation-control && npm test`
- `git status --short --branch`

Node 4 result:

- `cd plugins/operation-control && npm test` passed and printed `operation-control: ok`.
- Before staging, `git status --short --branch` showed only this evidence bundle as an untracked docs change.

Expected final-report result: the Task branch is clean after the focused evidence commit.

## Impact, risk, rollback

- Impact: documentation/evidence bundle only in this Node; no runtime behavior changes.
- Remaining risk: Maintainer must still review `PAP-22`, create `docs/milestones/49fc84cb-d42c-496d-96e9-82d7fbb9324d.md`, commit it, push it, and request Board milestone review.
- Remaining backlog risk: `PAP-24` still tracks structural enforcement of the actor boundary beyond instructions and evidence gates.
- Rollback: revert the Node 4 evidence commit if the Maintainer chooses to rebuild the report evidence from issue comments only. This does not affect Operation Control runtime behavior.
