# AllNewMTS Reference

이 문서는 [범용 AI Company Blueprint](../../blueprint/README.md)의 기반이 된 실제 사례다. `http://127.0.0.1:3100`의 AllNewMTS Company를 2026-07-15에 확인한 현재값이며 범용 기본값이 아니다.

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
└── Manager (CEO)
    ├── Builder (Engineer)
    ├── Researcher (Researcher)
    └── Tech Manager (CTO)
```

Board는 Agent 생성, environment 관리, join 승인, Skill 생성, Task 배정, 사용자 초대와 권한 관리 권한을 가진다. Agent별 상세 책임과 권한은 [roles](roles/README.md)에 있다.

각 Agent의 월 예산은 2,000 cents이며 80%에서 경고하고 초과 시 hard stop한다. 현재 terminated 상태인 이전 Manager의 budget policy도 활성 상태로 남아 있다.

## Company Skill

| 종류 | Skill | Agent 연결 |
|---|---|---:|
| 회사 고유 | [formde-migration](skills/formde-migration/SKILL.md) | 4 |
| Paperclip 기본 | paperclip | 0 |
| Paperclip 기본 | paperclip-board | 0 |
| Paperclip 기본 | paperclip-converting-plans-to-tasks | 0 |
| Paperclip 기본 | paperclip-create-agent | 0 |
| Paperclip 기본 | para-memory-files | 0 |

네 Agent의 adapter에는 `formde-migration`이 desired skill로 설정되어 있다. 기본 제공 Skill은 Company catalog에는 존재하지만 Agent에 직접 attach되어 있지 않다.

## Goal과 Project

Company Goal은 **iOS/Android 기반 SmartFormDe 시스템을 React Native Expo 기반으로 Migration**이다.

| Team Goal | 상태 |
|---|---|
| 개발 기반과 FormDe 호환성 계약 확보 | active |
| 대표 XMS E2E 호환 입증 | planned |
| XMS 런타임 v1 완성 | planned |
| 운영 화면 호환성 확대와 FormDe Cutover | planned |

별도 Task-level Goal **AI가 유지보수할 수 있는 시스템 구성**은 planned 상태다.

활성 Project는 `MTS Migration`이며 Manager가 lead다. `Onboarding` Project는 completed/archived 상태다.

## Runtime과 Workspace

| 항목 | 현재값 |
|---|---|
| Environment | Local, active, instance default |
| Adapter | 모든 Agent `codex_local` |
| Model | 모든 Agent `gpt-5.5` |
| 검색 | false |
| 제품 workspace | `/Users/chanheekim/Dev/AllNewMTS` |
| 실행 mode | shared workspace |
| 원본 | `/Users/chanheekim/Dev/Plus`, `/Users/chanheekim/Dev/mts_screen` 읽기 전용 |

Manager, Builder, Researcher는 on-demand heartbeat와 `maxConcurrentRuns: 1`을 사용한다. Tech Manager는 heartbeat 예약 없이 `maxConcurrentRuns: 20`으로 설정되어 있다.

## Delivery 규칙

- 신규 Task는 Manager가 최초 접수한다.
- 구현과 테스트는 Builder, 원본 조사와 스펙은 Researcher에게 배정한다.
- 한 Agent에는 실행 가능한 Task 하나만 둔다.
- 큰 Task는 2~5개 child로 분해한다.
- Builder/Researcher Root Task는 Manager review를 거친다.
- Team Goal은 한 번에 하나만 active로 유지한다.

## Operations

| 항목 | 현재값 |
|---|---|
| Routine | 없음 |
| Pipeline | 없음 |
| Operation Control | `local.operation-control` 0.1.0, ready/healthy |
| 기본 Maintenance owner | Tech Manager |
| 기본 stop policy | drain |

Maintenance 상태 설계는 [운영 설계](../../docs/architecture.md)에 있다.

## 재현 범위

현재 문서와 Role/Skill 원문은 범용 설계를 검증하는 근거다. AllNewMTS에서 발견된 차이는 [drift](drift.md)에 기록한다.
