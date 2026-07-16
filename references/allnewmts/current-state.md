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
| Product Steward | `ceo` | Goal, keep/kill, Task 전환, review와 approval | 가능 | 가능 | idle |
| Prototyper | `researcher` | 후보 비교, 원본 분석, Prototype | 불가 | 불가 | idle |
| Builder | `engineer` | production-grade 구현과 테스트 | 불가 | 불가 | idle |
| Sweeper | `qa` | 삭제, 단순화, 성능과 회귀 검토 | 불가 | 불가 | idle |
| Grower | `pm` | baseline, eval, 적합성 개선 | 불가 | 불가 | idle |
| Maintainer | `devops` | 신뢰성, 보안, 비용, 장애와 복구 | 불가 | 불가 | idle |

모든 Agent는 `codex_local`, `gpt-5.5`, on-demand heartbeat와 `maxConcurrentRuns: 1`을 사용한다.

## Project와 Task Gate

- Project: `MTS Migration`, lead Product Steward
- 기본 workspace: `/Users/chanheekim/Dev/AllNewMTS`, shared workspace
- shared writer: 동시에 한 명
- Issue workspace override: 허용
- Plus와 `mts_screen`: 읽기 전용 원본
- Role label: 5개 모두 생성됨
- Prototyper 결과: Product Steward review stage
- Builder 결과: Sweeper review stage
- `ALL-25`: `local-board` approval stage, 현재 선행 Task 때문에 blocked
- 사람의 요청은 Goal, Milestone 필수 작업은 `todo`, 선택 작업은 active Task tree 밖의 `backlog`
- Backlog `todo` 승격은 Product Steward, 근거가 있는 취소는 Sweeper

AllNewMTS 제품 저장소는 초기 Expo scaffold를 `01fddaf6e4f0b23457c10a442684d20e578a9599`에 commit해 isolated workspace와 Git Milestone 보고서의 로컬 기준점을 갖는다.

## Goal 구조

- Company Goal: SmartFormDe 시스템을 React Native Expo 기반으로 Migration
- active Team Goal: 개발 기반과 FormDe 호환성 계약 확보
- planned Team Goal: 대표 XMS E2E 호환 입증, XMS 런타임 v1 완성, 운영 화면 호환성 확대와 FormDe Cutover
- 네 Team Goal의 owner: Product Steward
- 별도 planned Task Goal: AI가 유지보수할 수 있는 시스템 구성

## Operation Control

| 항목 | 값 |
|---|---|
| Plugin key | `local.operation-control` |
| 버전 / 상태 | `0.2.0` / ready, healthy |
| Company mode | `normal` |
| Delivery state | Company Goal `goal_registered`, 아직 plugin Milestone·Root Task 없음 |
| Milestone 완료 gate | Git 보고서 + dashboard의 인증된 Board 직접 결정 |
| Maintenance owner 관례 | Maintainer |
| 기본 stop policy | drain |
| Backlog Sweep Routine | active, Sweeper 담당, 수동/API 실행, schedule 없음 |

Pipeline은 아직 없다. 남은 운영 차이는 [drift](drift.md)에 기록한다.
