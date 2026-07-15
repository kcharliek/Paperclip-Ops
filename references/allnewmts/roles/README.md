# AllNewMTS Role Reference

## 공통 Runtime

- Adapter: `codex_local`
- Model: `gpt-5.5`
- Search/Fast mode: false
- Timeout: 3600초
- Grace: 15초
- Company Skill: `formde-migration`
- Workspace write: `/Users/chanheekim/Dev/AllNewMTS`
- Read-only sources: `/Users/chanheekim/Dev/Plus`, `/Users/chanheekim/Dev/mts_screen`
- 현재 모든 Role은 `dangerouslyBypassApprovalsAndSandbox: true`

## Role Matrix

| Role | ID | reportsTo | Task 배정 | Agent 생성 | Skill 생성 | heartbeat |
|---|---|---|---:|---:|---:|---|
| Manager | `d96accca-eb75-4b55-8a69-9608fe1a93a2` | Board | 가능 | 가능 | 가능 | on-demand, concurrency 1 |
| Builder | `0c82b32e-682c-4e8e-a53e-5790eaeadcbf` | Manager | 불가 | 불가 | 불가 | on-demand, concurrency 1 |
| Researcher | `e154b480-a914-4b1f-b40b-209ee332760d` | Manager | 불가 | 불가 | 불가 | on-demand, concurrency 1 |
| Tech Manager | `56cd8c39-6c19-4bf0-a6bb-8390e7b1bcd1` | Manager | 가능 | 불가 | 가능 | 예약 없음, concurrency 20 |

## 책임 분리

| Role | 수행 | 수행하지 않음 |
|---|---|---|
| Manager | Task triage, Goal 정렬, 배정, review, 단계 전환 | 제품 코드, 조사, Fixture 작성 |
| Builder | 승인된 계약 기반 런타임 코드와 테스트 | 미할당 Task, 스펙 추측, 다른 Agent 배정 |
| Researcher | 원본 근거 조사, 스펙, 인벤토리, Fixture | 제품 런타임 구현, 근거 없는 결정 |
| Tech Manager | 설정상 Task 배정과 Skill 생성 가능 | 현재 instructions상 Manager와 동일하며 기술 부채 전용 책임이 없음 |

## 실제 Instructions

- [Manager](manager/AGENTS.md)
- [Builder](builder/AGENTS.md)
- [Researcher](researcher/AGENTS.md)
- [Tech Manager](tech-manager/AGENTS.md)

Tech Manager instructions는 현재 Manager instructions의 복사본이다. 문서 오류가 아니라 3100 서버의 실제 상태이며 가장 먼저 해결할 Role drift다.
