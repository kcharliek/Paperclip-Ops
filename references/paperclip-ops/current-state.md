# Paperclip Ops Company 현재 구성

확인 기준: 2026-07-16, Paperclip local instance `127.0.0.1:3100`, Paperclip `2026.707.0`.

## Company와 Project

| 항목 | 값 |
|---|---|
| Company / ID | Paperclip Ops / `82f74ffb-1693-4b90-a5cf-b88c05e19b26` |
| 상태 / prefix | active / `PAP` |
| 신규 Agent | Board approval 필요 |
| Company Goal | `d8e33e86-7070-4570-9813-aa4726208d00`, active |
| Project | `747d1bd0-5fa8-486e-ae30-e8567d7f11b7`, in_progress, lead Ops Steward |
| primary workspace | `/Users/chanheekim/Dev/Paperclip-Ops`, shared workspace, Issue override 허용 |

## 조직

| Agent | ID | Paperclip role | 상태 |
|---|---|---|---|
| Ops Steward | `d4feead0-0016-4075-a832-cd7b6a80a4d3` | `ceo` | idle |
| System Auditor | `5ea8e748-58e2-4489-ad32-955dcd51e943` | `researcher` | idle |
| Builder | `61b6a42d-f25d-454a-85af-76e1af379f3d` | `engineer` | idle |
| Sweeper | `e4c241ef-01ed-443d-9009-b03296eceec9` | `qa` | idle |
| Maintainer | `720bb970-94f2-4dc7-ad1e-d472c65624ff` | `devops` | idle |

실행 Agent 네 명은 Ops Steward에게 직접 보고한다. 모두 `codex_local`, `gpt-5.5`, search off, on-demand heartbeat와 `maxConcurrentRuns: 1`을 사용한다.

## 분류와 운영

- 개선 분류 label: `blueprint`, `plugin`, `local-profile`, `paperclip-gap`, `maintenance`
- delivery label: `role:system-auditor`, `role:builder`, `role:sweeper`, `role:maintainer`
- Operation Control: `normal`, `drain`, 시간당 20 run, delivery state는 아직 없음
- System Improvement Review: `5ec9d58a-6317-4192-9f56-cebe3aaa56de`, System Auditor, 매주 월요일 10:00 KST, `skip_if_active` / `skip_missed`
- Company Integrity Check: `0ecd5074-9fc1-4115-81e8-f0af753a1f1b`, Maintainer, 6시간마다, `skip_if_active` / `skip_missed`

## 초기 자체개선 검증

2026-07-16 수동 실행 `PAP-1`은 succeeded와 `done`을 확인했다. System Auditor는 source/config를 바꾸지 않고 다음 Backlog를 만들었다.

| Task | 분류 | 내용 |
|---|---|---|
| `PAP-2` | `paperclip-gap` | 공식 usage event와 runtime context 정책 표면 |
| `PAP-3` | `paperclip-gap` | 공식 restore API와 off-machine backup 보관 표면 |
| `PAP-4` | `plugin` | Operation Control live 누락 Task 복구 검증 |

run usage는 input 592,505, cached input 520,704, output 7,626 tokens였다. 신규 3, 중복 0, 보류 0을 기록했고 Ops 저장소와 소비 Company는 수정하지 않았다.
