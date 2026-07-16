# AllNewMTS Company 현재 구성

확인 기준: 2026-07-16, Paperclip local instance `127.0.0.1:3100`, Paperclip `2026.707.0`.

이 문서는 범용 Blueprint를 적용한 현재값의 빠른 요약이다. 목표 표준은 [AI Company Blueprint](../../blueprint/README.md), 상세 현재값은 [AllNewMTS Reference](README.md)에 있다.

## Company

| 항목 | 값 |
|---|---|
| 이름 / ID | AllNewMTS / `91871447-f0a0-4d53-aadb-fc0246d94565` |
| 상태 | active |
| Issue prefix | `ALL` |
| 신규 Agent 승인 | Board approval 필요 |
| Company Skill | `formde-migration`, Agent 6명 연결 |

## 조직

```text
Product Steward
├── Prototyper
├── Builder
├── Sweeper
├── Grower
└── Maintainer
```

| Agent | Paperclip role | 주요 책임 | Task 배정 | Agent 생성 | 상태 |
|---|---|---|---:|---:|---|
| Product Steward | `ceo` | Goal, keep/kill, controlled Root와 review 전환 | Root만 | 가능 | idle |
| Prototyper | `researcher` | 후보 비교, 원본 분석, Prototype | 자기 Node의 plugin child만 | 불가 | idle |
| Builder | `engineer` | production-grade 구현과 테스트 | 자기 Node의 plugin child만 | 불가 | idle |
| Sweeper | `qa` | 삭제, 단순화, 성능과 회귀 검토 | 자기 Node의 plugin child만 | 불가 | idle |
| Grower | `pm` | baseline, eval, 적합성 개선 | 자기 Node의 plugin child만 | 불가 | idle |
| Maintainer | `devops` | 신뢰성, 보안, 비용, 장애와 복구 | normal에서 자기 Node의 plugin child만 | 불가 | idle |

모든 Agent는 `codex_local`, `gpt-5.5`, on-demand heartbeat와 `maxConcurrentRuns: 1`을 사용한다.

## Project와 Task Gate

- Project: `MTS Migration`, lead Product Steward
- 기본 workspace: `/Users/chanheekim/Dev/AllNewMTS`, shared workspace
- shared writer: 동시에 한 명
- Issue workspace override: 허용
- Plus와 `mts_screen`: 읽기 전용 원본
- Role label: 5개 모두 생성됨
- 새 controlled Node/Root: Operation Control `review-node`; direct child·부모 조기 완료는 post-event guard가 취소·복구
- 기존 Issue 29개: native `executionPolicy` 0개
- `ALL-25`: blocked, native `executionPolicy` 없음, Operation Control 도입 전 legacy Task
- 사람의 요청은 Goal, Milestone 필수 작업은 `todo`, 선택 작업은 active Task tree 밖의 `backlog`
- Backlog `todo` 승격은 Product Steward, `done` 결과나 객관적 폐기 조건에 근거한 취소만 Sweeper

AllNewMTS 제품 저장소는 초기 Expo scaffold를 `01fddaf6e4f0b23457c10a442684d20e578a9599`에 commit해 isolated workspace와 Git Milestone 보고서의 로컬 기준점을 갖는다.

## Goal 구조

- Company Goal: SmartFormDe 시스템을 React Native Expo 기반으로 Migration
- active Team Goal: 개발 기반과 FormDe 호환성 계약 확보
- controlled Milestone draft: `54fdb930-9921-4592-b397-9381a4946ad6`, planned, 사람 확인 대기
- 변경 요청된 이전 controlled draft 2개: cancelled
- planned Team Goal: 대표 XMS E2E 호환 입증, XMS 런타임 v1 완성, 운영 화면 호환성 확대와 FormDe Cutover
- 네 Team Goal의 owner: Product Steward
- 별도 planned Task Goal: AI가 유지보수할 수 있는 시스템 구성

## Operation Control

| 항목 | 값 |
|---|---|
| Plugin key | `local.operation-control` |
| 버전 / 상태 | `0.6.2` / ready, healthy |
| Company mode | `normal` |
| Delivery state | `milestone_pending`; Root 하나 + Node 세 개 초안, 사람 확인 전이라 Root Task 없음 |
| Milestone 완료 gate | Plugin의 Git commit·보고서 실재 검증 + dashboard의 인증된 Board 직접 결정 |
| Node 반복 거절 gate | 같은 Node의 두 번째 거절에서 자동 보완 생성을 중단하고 Board 범위·설계 판단을 요청 |
| Orchestration 복구 | planning 단계의 단일 pending Task 재-wake 또는 누락 Task 재생성; 사람 gate와 active delivery는 무변경 |
| Company run ceiling | 시간당 20회; 초과 run 즉시 취소 후 전체 Agent maintenance, Board resume 시 현재 시간 창 reset |
| Maintenance owner 관례 | Maintainer |
| 기본 stop policy | drain |
| Company Integrity Check Routine | active, Maintainer 담당, 6시간마다, `skip_if_active` / `skip_missed`; 첫 schedule `ALL-35` 완료, 다음 schedule 2026-07-17 00:00 KST |
| Backlog Sweep Routine | active, Sweeper 담당, 매주 월요일 09:30 KST, `skip_if_active` / `skip_missed` |
| Paperclip DB backup | 공식 자동 backup 활성화, 60분 주기, health `ok`; 보존은 daily 7일·weekly 4주·monthly 1개월 |

2026-07-16 13:55 KST에 공식 `POST /api/instance/database-backups`로 수동 backup을 생성했다. 결과는 5,216,643 bytes, 1.555초였고 gzip 무결성 검사와 Paperclip health 재확인을 통과했다. 공개 API/CLI에는 restore 경로가 없어 복원 drill과 RTO는 아직 검증하지 않았다.

Backlog Sweep의 첫 schedule 실행 예정 시각은 2026-07-20 09:30 KST다. 수동 live 검증에서 `ALL-33`은 미확정 Milestone을 완료 근거로 오판했지만 native 권한이 취소를 막아 Backlog 변경 없이 `blocked`와 failure reason을 남겼고, Board가 무변경을 확인한 뒤 Task만 정리했다. 보정된 `ALL-34`는 유지 0, 취소 0, Product Steward 분류 요청 10으로 interaction 없이 `done` 완료했다. 첫 schedule 실행은 아직 관측 전이다.

Company Integrity Check의 첫 schedule은 2026-07-16 18:00 KST에 `ALL-35`로 dispatch되어 `done`과 succeeded를 확인했다. health/backup, org chain, Routine과 timeout run은 정상이었지만 Operation Control inspect action이 두 번 `No worker registered`를 반환해 `integrity: degraded`로 종료했다. worker는 이후 다시 응답했고 두 run 합계는 input 498,962, cached input 432,640, output 4,955 tokens였다.

Pipeline은 아직 없다. 남은 운영 차이는 [drift](drift.md)에 기록한다.

Live progression 검증은 `ALL-29` → Board 변경 요청 → `ALL-30` → Board 변경 요청 → `ALL-31` 순서로 성공했다. 세 orchestration run은 모두 succeeded였고 input token은 각각 1,388,524 / 458,182 / 308,524였다. 호출 지침과 이전 초안 전달로 감소했지만 run당 컨텍스트 비용은 여전히 drift다.

0.6.2 Board 복구 action은 Issue create 실패 뒤 누락 Task 재생성, wakeup 실패 뒤 기존 Task 재-wake, 종료된 이전 recovery 뒤 새 recovery 생성을 plugin test로 확인했다. 현재 `milestone_pending` live 호출은 Issue 수를 바꾸지 않은 `human_gate` 결과였다. 따라서 복구 표면은 생겼지만 state 전이와 Issue 생성의 원자성 자체는 바뀌지 않았다.
