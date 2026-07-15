# AllNewMTS Role Reference

## 공통 Runtime

- Adapter / Model: `codex_local` / `gpt-5.5`
- Search/Fast mode: false
- Timeout / Grace: 3600초 / 15초
- Company Skill: `formde-migration`
- Heartbeat: on-demand, `maxConcurrentRuns: 1`
- Product workspace: `/Users/chanheekim/Dev/AllNewMTS`
- Read-only sources: `/Users/chanheekim/Dev/Plus`, `/Users/chanheekim/Dev/mts_screen`
- 현재 모든 Role은 `dangerouslyBypassApprovalsAndSandbox: true`

## Role Matrix

| Role | Paperclip enum | ID | reportsTo | Task 배정 | Agent 생성 | Skill 생성 |
|---|---|---|---|---:|---:|---:|
| Product Steward | `ceo` | `6b6296b0-c22d-4a63-a578-ef1041ec7541` | Board | 가능 | 가능 | 가능 |
| Prototyper | `researcher` | `e154b480-a914-4b1f-b40b-209ee332760d` | Product Steward | 불가 | 불가 | 불가 |
| Builder | `engineer` | `0c82b32e-682c-4e8e-a53e-5790eaeadcbf` | Product Steward | 불가 | 불가 | 불가 |
| Sweeper | `qa` | `f1cf482a-27cf-44de-a5e0-1d9274485453` | Product Steward | 불가 | 불가 | 불가 |
| Grower | `pm` | `d96accca-eb75-4b55-8a69-9608fe1a93a2` | Product Steward | 불가 | 불가 | 불가 |
| Maintainer | `devops` | `56cd8c39-6c19-4bf0-a6bb-8390e7b1bcd1` | Product Steward | 불가 | 불가 | 불가 |

Paperclip은 custom role string을 허용하지 않아 enum은 호환용으로만 사용한다. 실제 역할 의미는 Agent 이름, title, capabilities, instructions와 Task label이 결정한다. 역할별 Agent 수는 필요에 따라 `1..N`으로 늘리거나 줄일 수 있으며 신규 Agent는 Product Steward의 요청과 Board approval을 거친다.

## 책임 분리

| Role | 수행 | 수행하지 않음 |
|---|---|---|
| Product Steward | Goal 정렬, Task 배정, Backlog 승격, keep/kill, review·approval 전환 | 제품 코드·스펙·Fixture 작성, 자기 결과 승인 |
| Prototyper | 후보 비교, 원본 분석, Prototype, keep/kill 근거 | shared 제품 workspace 수정, production merge |
| Builder | 승인된 계약 기반 구현, 테스트와 rollback 근거 | 미승인 기능, 스펙 추측, 다른 Agent 배정 |
| Sweeper | 삭제, 단순화, 성능 개선, 회귀 검증과 근거가 있는 Backlog 취소 | 신규 기능, Backlog 승격, 근거 없는 unship |
| Grower | baseline, eval, 사용자 가치 가설과 전환 제안 | 지표 없는 기능 추가, 임의 production 변경 |
| Maintainer | SLO, 보안, 성능, 비용, 장애와 복구 | roadmap 변경, 승인되지 않은 보안 완화 |

## 실제 Instructions

- [Product Steward](product-steward/AGENTS.md)
- [Prototyper](prototyper/AGENTS.md)
- [Builder](builder/AGENTS.md)
- [Sweeper](sweeper/AGENTS.md)
- [Grower](grower/AGENTS.md)
- [Maintainer](maintainer/AGENTS.md)
