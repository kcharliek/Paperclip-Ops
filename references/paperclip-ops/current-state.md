# Paperclip Ops Company 현재 구성

확인 기준: 2026-07-17, Paperclip default local instance `127.0.0.1:3100`, Paperclip `2026.707.0`.

## Company와 Project

| 항목 | 값 |
|---|---|
| Company / ID | Paperclip Ops / `adb591e0-eae2-41f5-8d4e-9b8a5054b60f` |
| 상태 / prefix / issue counter | active / `PAP` / `0` |
| Company Goal | `b5f0b530-e571-4781-aba7-766c07b92d9e`, active |
| Project | `08de096f-20ea-48d7-830f-c71351fb2c5b`, in_progress, lead Ops Steward |
| primary workspace | `8632080d-4ffb-4a55-b103-c7a44e9dda03`, `/Users/chanheekim/Dev/Paperclip-Ops`, shared workspace |
| Task | 0개, plugin operation 포함 0개 |

구 Company와 Task 이력은 삭제했고 같은 이름과 prefix로 새 Company를 구성했다. 제품 저장소와 Git 이력은 삭제 대상에 포함하지 않았다. 현재 Company에는 과거 Task, Milestone, Backlog와 Routine execution이 없다.

## 조직

| Agent | ID | Paperclip role | 상태 |
|---|---|---|---|
| Ops Steward | `446f7fad-ba71-49c3-acb2-be87b702eec1` | `ceo` | idle |
| System Auditor | `e11ce0c6-0a88-4cc6-9866-725892a013a3` | `researcher` | idle |
| Builder | `62465e48-c6d4-4f53-bbbe-42f1f969b04c` | `engineer` | idle |
| Sweeper | `c466b861-0013-483e-bbcb-80a71496687e` | `qa` | idle |
| Maintainer | `0e34359b-a6f2-4f67-bc0e-d166257725bc` | `devops` | idle |

실행 Agent 네 명은 Ops Steward에게 직접 보고한다. Ops Steward만 `canAssignTasks: true`이고 Agent·Skill 생성 권한은 모든 Role에서 꺼져 있다. Product Steward는 Goal을 직접 구현하지 않고 native Task로 분해한다. Builder와 Maintainer가 실행하고, 기본 독립 reviewer인 Sweeper가 원래 Task의 native review stage에서 승인하거나 같은 Task를 수정 상태로 되돌린다. Role은 고정 순차 phase가 아니라 필요한 전문성이다.

다섯 live `AGENTS.md`에는 다음 자율 실행 계약이 적용되어 있다.

- 저·중위험 작업은 인간 응답 없이 계획, 실행, 독립 Agent review와 보완을 계속한다.
- production, 삭제, migration, 권한·secret, 외부 전송, 결제·법무 등 고위험 행동만 review 뒤 user approval을 요구한다.
- 같은 acceptance를 두 번 실패하면 Product Steward가 방법이나 담당자를 바꾸고, 그래도 실패하거나 scope·예산 변경이 필요할 때만 인간에게 올린다.
- Agent는 주입된 자기 인증만 사용하며 401/403 뒤 Board 권한으로 우회하지 않는다.
- shared workspace writer는 한 번에 한 명만 실행하고, Git 변경은 focused commit과 결정적 검증을 남긴다.

모든 Agent는 `codex_local`, `gpt-5.5`, on-demand heartbeat, timeout 3600초로 설정했다. 적용 뒤 Blueprint, current snapshot과 Paperclip 원본 instruction의 byte-for-byte 일치를 다시 확인했다.

## Operation Control 1.0

| 항목 | 현재값 |
|---|---|
| instance | `979f4503-0512-4747-b3de-5c098ee3ece1` |
| version / status | `1.0.0` / ready |
| mode | `normal` |
| run budget | 현재 window 0/20 |
| orchestrator | role `ceo` |
| Goal dispatch | `autoDispatchGoals: true` |
| delivery owner | `paperclip-native` |

Plugin은 maintenance mode, 시간당 run cap과 Goal당 하나의 idempotent dispatch Task만 소유한다. Agent tool은 read-only `inspect-operation-state` 하나뿐이다. custom Milestone phase, Root/child 생성 tool, recovery Task, review bridge, Git Milestone report와 Board evidence relay는 복원하지 않았다.

현재 장기 Goal은 재구성 중 `autoDispatchGoals: false`인 상태에서 만들고, 구성이 끝난 뒤 자동 dispatch를 켰다. 따라서 현재 Goal에는 dispatch Task가 없고, 새로 생성하거나 재개된 Company Goal부터 `plugin:local.operation-control:goal-dispatch` origin Task 하나가 Ops Steward에게 전달된다.

## Routine과 공통 자원

- System Improvement Review: `0ce25bce-468e-4eee-a10b-e665fc5b1e96`, revision 2, trigger `4f2668e0-5b43-4c48-a36f-5f9935a7a0a4`, 매주 월요일 10:00 KST
- Company Integrity Check: `fecdb35c-c63b-441a-bb1d-14fa3dec0e74`, revision 2, trigger `719a0d25-a872-4740-aba8-0a1f4ddab50b`, 6시간마다
- 두 Routine 모두 `active`, `skip_if_active`, `skip_missed`이며 아직 실행 이력이 없다.
- Label 9개와 Paperclip bundled Skill 5개를 새 Company에 동기화했다.

Integrity 계약은 Company health와 backup, Operation Control 상태와 run cap, org chain, Routine schedule, stalled heartbeat, Goal dispatch 중복과 native review policy를 read-only로 확인한다. System Improvement Review는 근거가 있는 새 결함만 최대 3개까지 분류하고 자동 보정하지 않는다.

## 검증

2026-07-17 현재 다음 계약을 확인했다.

- 구 Company API는 `404`, 새 Company API는 `active`, issue counter와 Task 수는 모두 `0`
- Operation Control data는 `normal`, `paperclip-native`, `autoDispatchGoals: true`, run budget `0/20`
- 다섯 Agent가 모두 `idle`이고 보고선, 권한, adapter와 heartbeat 설정이 목표값과 일치
- 다섯 live instruction bundle이 대응 `blueprint/role-instructions/*`와 byte-for-byte 일치
- Project primary workspace와 shared workspace policy, Routine trigger, Label 9개, bundled Skill 5개 확인
- `plugins/operation-control` 단위 테스트와 `tests/system/run.mjs`의 결정적 native autonomy 계약 통과

결정적 system test는 실제 LLM run을 시작하지 않고 일회용 Company에서 maintenance, 수동 pause 보존, Goal dispatch 단일성, native Agent review와 고위험 human approval 순서를 검증한다.
