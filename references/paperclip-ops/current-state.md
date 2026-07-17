# Paperclip Ops Company 현재 구성

확인 기준: 2026-07-17, Paperclip default local instance `127.0.0.1:3100`, Paperclip `2026.707.0`.

2026-07-16 snapshot의 Company는 현재 instance에 없어서 성공 run 이력을 복제하지 않고 새 Company를 구성했다. `PAP-1`은 이 재구성 기준점이며, 기존 drift만 새 Backlog로 이관했다.

## Company와 Project

| 항목 | 값 |
|---|---|
| Company / ID | Paperclip Ops / `94fa4eb9-df28-455d-8c9a-eb5bd6287356` |
| 상태 / prefix | active / `PAP` |
| 신규 Agent | Board approval 필요 |
| Company Goal | `687f9b61-1cfc-4215-a58e-1258cd4e710e`, active |
| Project | `73777e76-01dd-459f-a527-a3547fe44f36`, in_progress, lead Ops Steward |
| primary workspace | `262745da-14a7-4bec-8c8c-06ef26ab0254`, `/Users/chanheekim/Dev/Paperclip-Ops`, shared workspace, Issue override 허용 |

## 조직

| Agent | ID | Paperclip role | 상태 |
|---|---|---|---|
| Ops Steward | `e55a2362-5520-4006-8fbe-17827a6be382` | `ceo` | idle |
| System Auditor | `177e9782-9b8d-416e-9865-273252eca151` | `researcher` | idle |
| Builder | `fb595d00-0021-4e2c-88d7-fc3bd329a7a2` | `engineer` | idle |
| Sweeper | `960a20e4-32e6-49dc-9d8c-4cbab025c595` | `qa` | idle |
| Maintainer | `16fb2f08-9318-415b-9c46-0ff404810474` | `devops` | idle |

실행 Agent 네 명은 Ops Steward에게 직접 보고하고 org chain은 모두 healthy다. 전원 `codex_local`, `gpt-5.5`, search/fast mode off, timeout 3600초, on-demand heartbeat와 `maxConcurrentRuns: 1`을 사용한다. Ops Steward만 Task 배정, Agent와 Skill 생성 권한을 갖고 실행 Agent의 세 권한은 모두 false다.

2026-07-17 Ops Steward, Builder, Sweeper와 Maintainer의 live instructions에 Git 전달 계약을 적용했다. Git workspace를 수정한 실행 Role은 필수 검증 뒤 자기 Task 파일만 focused commit으로 만들고 현재 Task branch를 push하며, branch·full SHA·remote/ref를 review 근거로 남긴다. force push와 history 재작성은 금지하고 인증·권한·branch protection·non-fast-forward 오류는 임의 우회 없이 blocker로 보고한다. read-only Integrity Check와 workspace를 수정하지 않는 Backlog Sweep은 commit·push 대상이 아니다.

같은 날 Ops Steward, System Auditor, Builder, Sweeper와 Maintainer의 live instructions에 actor·인증 경계를 추가했다. Agent는 Paperclip이 주입한 자기 bearer, API key와 run context만 사용하고 401/403을 권한 blocker로 보고한다. 인증 header를 제거·교체하거나 local-trusted의 무인증 Board 경로로 인간 actor를 대신하지 않는다. 적용 뒤 다섯 managed `AGENTS.md`와 이 저장소의 current snapshot이 byte-for-byte 일치함을 다시 확인했다.

Operation Control 0.6.3과 같은 다섯 live instructions에는 blocked-work fallback도 적용했다. 미완료 Task dependency가 없는 controlled `blocked` Task는 active tree와 Milestone을 바꾸지 않고 outside-tree Product Steward triage를 blocking episode당 하나만 만들며, 단순 sibling dependency 대기는 만들지 않는다. blocked delivery 중 read-only Integrity, Improvement Review와 Backlog Sweep은 계속할 수 있다.

## 분류와 운영

- 개선 분류 label: `blueprint`, `plugin`, `local-profile`, `paperclip-gap`, `maintenance`
- delivery label: `role:system-auditor`, `role:builder`, `role:sweeper`, `role:maintainer`
- Operation Control: instance `979f4503-0512-4747-b3de-5c098ee3ece1`, version `0.6.3`, ready/healthy, `normal`, `drain`, 시간당 20 run, `executing`
- 현재 run window: 4/20. `PAP-19` fresh-session 성공, `PAP-20` 자동 인계 뒤 안전 취소와 live instruction 적용 후의 재개 안전 취소가 포함된다.
- System Improvement Review: `da9b24ae-29f9-445f-a6e4-642ab4fb2bc5`, System Auditor, 매주 월요일 10:00 KST, 다음 2026-07-20 10:00 KST, `skip_if_active` / `skip_missed`
- Company Integrity Check: `24f95458-8bee-4260-94f3-04ed8e638dfa`, Maintainer, 6시간마다, 다음 2026-07-17 18:00 KST, `skip_if_active` / `skip_missed`

## Backlog 이관

`PAP-2..13`은 이전 snapshot의 미해결 drift를 성공 run 이력 없이 새 instance로 이관한 Backlog다. `PAP-15`는 transient plugin worker registration, `PAP-23`은 controlled Root/child 생성 시 Role label을 원자적으로 적용하지 못하는 live 발견을 추적한다. `PAP-24`는 Agent bearer의 401/403 뒤 local-trusted 무인증 Board 경로로 우회할 수 있는 actor 경계 gap과 제한된 test harness 필요성을 추적한다. 모두 active Root 밖의 `backlog`다.

## 첫 controlled Milestone

Ops Steward의 첫 초안 `2690187a-e939-4bd5-a45c-32864eedf5af`은 단일 Builder를 Root owner와 네 Builder Node에 동시에 배정해 독립 review 계약을 만족하지 못했으므로 Board가 거절했다. `PAP-16` 수정 초안 `49fc84cb-d42c-496d-96e9-82d7fbb9324d`은 Maintainer Root와 순차 Builder Node 네 개로 고쳤고 Board가 확인했다.

`PAP-17` 첫 Root 생성 시 Steward가 `create-root-task.goalId`에 Milestone ID를 넣어 human-confirmed 오류를 받았다. Board가 Company Goal ID를 명시해 같은 Task를 resume했고, 중복 없이 Maintainer 소유 Root `PAP-18`을 생성했다.

| Task | 상태 | 역할 / blocker | 현재 근거 |
|---|---|---|---|
| `PAP-18` | blocked | `role:maintainer` Root | 네 child가 완료될 때까지 first-class blocker 유지 |
| `PAP-19` | done | `role:builder`, blocker 없음 | `tests/system/run.mjs`가 runtime에 일회용 Company를 만들고 archive하는 격리 경계, safe-stop 조건과 관측값을 기록 |
| `PAP-20` | blocked | `role:builder`, `PAP-19` 완료 | Board 전용 recovery action을 Agent actor로 검증할 수 없어 안전 정지. 제한된 harness 또는 Board 제공 evidence 설계 필요 |
| `PAP-21` | todo | `role:builder`, blocked by `PAP-20` | wake 실패, bounded retry, human-gate no-op 검증 대기 |
| `PAP-22` | todo | `role:builder`, blocked by `PAP-21` | 회귀 테스트와 evidence bundle 대기 |

Maintainer가 child 생성 응답을 잘못 읽어 native blocker를 누락했고 Node 2가 먼저 시작했다. Board가 Builder를 pause해 active/queued run을 취소하고 native blocker chain과 Role label을 보정했다.

Board가 `PAP-19`의 task session을 reset하고 Builder를 재개하자 run `30551595-187f-4cf3-a5ff-3bae9a4c0b64`이 fresh session으로 성공해 Node를 `done`으로 전환했다. Operation Control은 blocker 해소를 감지해 `PAP-20` run `cff9f7d2-43bb-4ee2-b6d0-11a91ba4a1e1`을 자동 시작했다. 이 자동 인계로 자율 실행 loop는 확인됐다.

`PAP-20`에서 Builder bearer의 Board 전용 API 호출은 403이었고, Agent가 인증을 제거해 local-trusted 무인증 Board 호출로 재시도하려는 시점에 Board가 run을 취소했다. 현재 Ops Company에는 recovery/failure injection이 수행되지 않았고 Git workspace에는 Agent가 만든 변경이 없다. live actor 경계 적용 뒤 resume에서 시작된 run `d630826b-9ffa-4d33-b7be-95d811d1718f`도 즉시 취소하고 `PAP-20`을 다시 `blocked`로 고정했다. Builder는 다시 `idle`이며 Company mode는 `normal`이다.

## 실행 비용과 검증

7개 성공 run 합계는 input 7,105,302, cached input 6,479,232, output 94,443 tokens다. `PAP-19` fresh run은 input 1,108,454, cached input 979,456, output 15,563 tokens였다. Maintainer의 분해 run 하나가 input 2,830,358이어서 run별 context 폭증은 계속 `PAP-2`의 runtime context 정책 gap 근거로 남는다.

2026-07-17 결정적 검증은 다음과 같이 통과했다.

- `plugins/operation-control`: `npm test` → `operation-control: ok`
- `node tests/system/run.mjs --preflight` → plugin ready, 모든 Role instruction의 actor 경계 확인
- `node tests/system/run.mjs` → maintenance 전이, 수동 pause 보존, Goal adopt, Board/Agent actor 경계, Board 복구의 생성→동일 Task re-wake와 단일 pending 계약 모두 pass

마지막 system test의 disposable Company `6ed3cd26-c6e3-4c89-9f7b-14ecc99eb133`는 성공 뒤 archive됐다. Board actor evidence는 원본 orchestration Task `e8be51a8-7e03-4b45-b2ae-4e3edb156290`, 복구 Task `15342ad1-bd96-4d73-a2bb-f7f8fdc9a17d`, phase `goal_registered`, 반복 호출 `woken`, pending 1건이며 test fixture는 남지 않았다.
