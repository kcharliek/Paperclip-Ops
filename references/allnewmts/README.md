# AllNewMTS Reference

이 문서는 [범용 AI Company Blueprint](../../blueprint/README.md)를 Paperclip `2026.707.0` 제약에 맞춰 적용한 실제 스냅샷이다. `http://127.0.0.1:3100`의 AllNewMTS Company를 2026-07-16에 API로 다시 확인한 현재값이며, 목표 표준 자체는 아니다.

## Company Charter

| 항목 | 현재값 |
|---|---|
| Company ID | `91871447-f0a0-4d53-aadb-fc0246d94565` |
| 이름 | AllNewMTS |
| 상태 | active |
| Issue prefix | `ALL` |
| 목적 | SmartFormDe의 XMS 기반 화면 런타임을 React Native Expo로 온전히 이주 |
| Board | `local-board`, owner |
| 신규 Agent | Board approval 필요 |

## 조직과 Governance

```text
Board
└── Product Steward (ceo)
    ├── Prototyper (researcher)
    ├── Builder (engineer)
    ├── Sweeper (qa)
    ├── Grower (pm)
    └── Maintainer (devops)
```

Paperclip은 임의 Role 값을 허용하지 않으므로 괄호 안의 내장 enum을 사용하고 실제 역할은 Agent 이름, title, capabilities, instructions와 Task label로 표현한다. 현재 각 역할은 한 명이지만 표준은 역할별 `1..N` Agent를 허용한다.

Product Steward만 Task 배정, Agent 생성 요청과 Skill 생성 권한을 갖는다. 새 Agent는 이 권한과 별개로 Board approval을 통과해야 한다. 다섯 delivery role은 다른 Agent에게 Task를 배정하지 않는다. 상세 책임과 실제 instruction 원문은 [roles](roles/README.md)에 있다.

각 Agent의 월 예산은 2,000 cents이며 모든 heartbeat는 on-demand, `maxConcurrentRuns: 1`이다.

## Company Skill

| 종류 | Skill | Agent 연결 |
|---|---|---:|
| 회사 고유 | [formde-migration](skills/formde-migration/SKILL.md) | 6 |
| Paperclip 기본 | paperclip | 0 |
| Paperclip 기본 | paperclip-board | 0 |
| Paperclip 기본 | paperclip-converting-plans-to-tasks | 0 |
| Paperclip 기본 | paperclip-create-agent | 0 |
| Paperclip 기본 | para-memory-files | 0 |

여섯 Agent의 adapter에는 `formde-migration`이 desired skill로 설정되어 있다. 기본 제공 Skill은 Company catalog에는 존재하지만 Agent에 직접 attach되어 있지 않다.

## Goal과 Project

Company Goal은 **iOS/Android 기반 SmartFormDe 시스템을 React Native Expo 기반으로 Migration**이다.

| Team Goal Milestone | 상태 | owner |
|---|---|---|
| 개발 기반과 FormDe 호환성 계약 확보 | active | Product Steward |
| 대표 XMS E2E 호환 입증 | planned | Product Steward |
| XMS 런타임 v1 완성 | planned | Product Steward |
| 운영 화면 호환성 확대와 FormDe Cutover | planned | Product Steward |

별도 Task-level Goal **AI가 유지보수할 수 있는 시스템 구성**은 planned 상태다.

활성 Project는 `MTS Migration`이며 Product Steward가 lead다. 현재 Goal 전환 Task `ALL-25`는 선행 Task가 끝날 때까지 blocked이고, 완료 뒤 `local-board` approval stage를 통과해야 한다.

## Runtime과 Workspace

| 항목 | 현재값 |
|---|---|
| Environment | Local, active, instance default |
| Adapter / Model | 모든 Agent `codex_local` / `gpt-5.5` |
| 검색 | false |
| 제품 workspace | `/Users/chanheekim/Dev/AllNewMTS` |
| 기본 실행 mode | shared workspace |
| Issue override | 허용 |
| 원본 | `/Users/chanheekim/Dev/Plus`, `/Users/chanheekim/Dev/mts_screen` 읽기 전용 |

shared workspace writer는 동시에 한 명만 허용한다. isolated workspace override는 설정상 허용되며 AllNewMTS 초기 Expo scaffold의 baseline commit `01fddaf6e4f0b23457c10a442684d20e578a9599`부터 사용할 수 있다.

## Delivery 규칙

- 사람의 요청은 Goal로 등록하고 Milestone 확인 과정에서 필수 작업은 `todo`, 선택 작업은 `backlog`로 나눈다.
- Backlog는 active Root/Node의 child가 아니며 Product Steward만 `todo`로 승격한다.
- Sweeper는 `Backlog Sweep` Routine에서 명백한 중복, 이미 반영된 결과 또는 충족된 폐기 조건만 근거와 함께 `cancelled`로 바꾼다.
- Task에는 `role:prototyper`, `role:builder`, `role:sweeper`, `role:grower`, `role:maintainer` 중 정확히 하나를 붙인다.
- Product Steward가 Goal, blocker와 delivery contract를 확인해 해당 역할 Agent 한 명에게 배정한다.
- Prototyper 결과는 Product Steward review, Builder 결과는 Sweeper review를 거친다.
- Goal·고위험 전환은 Board approval stage를 추가한다.
- Prototyper 결과는 keep 또는 kill하며 keep된 결과만 Builder로 넘긴다.
- Root 담당자는 `docs/milestones/<milestone-id>.md`를 commit하고 Product Steward는 full commit SHA를 확인한다.
- Product Steward는 Git 보고서를 Operation Control에 제출하고, 인증된 Board 사용자가 dashboard에서 직접 결정한 뒤에만 Milestone이 완료된다. Agent에게 최종 결정 도구는 노출하지 않는다.
- shared workspace의 제품 writer는 한 번에 한 명이다.

범용 상태 전이와 Task contract는 [Delivery Lifecycle](../../blueprint/delivery-lifecycle.md)에 정의한다.

## Operations

| 항목 | 현재값 |
|---|---|
| Routine | `Backlog Sweep`, active, Sweeper 담당, 수동/API 실행, schedule 없음 |
| Pipeline | 없음 |
| Operation Control | `local.operation-control` 0.4.0, ready/healthy |
| Controlled delivery | Company Goal `goal_registered`, plugin Milestone·Root Task 없음 |
| Maintenance owner 관례 | Maintainer |
| 기본 stop policy | drain |

Operation Control은 Paperclip Agent 한 명만 owner로 유지할 수 있다. Maintenance 중 Maintainer가 사전 승인된 변경과 최소 검증을 수행하고, `normal` 복귀 후 Builder 또는 Sweeper가 독립 검토한다.

## 재현 범위

현재 문서와 Role/Skill 원문은 적용 결과의 근거다. 아직 남은 차이는 [drift](drift.md)에 기록한다.
