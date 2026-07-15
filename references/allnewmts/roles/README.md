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
| Strategy Agent | `6b6296b0-c22d-4a63-a578-ef1041ec7541` | Board | PM/TPM에게 가능 | 불가 | 불가 | on-demand, concurrency 1 |
| PM | `d96accca-eb75-4b55-8a69-9608fe1a93a2` | Strategy Agent | 가능 | 가능 | 가능 | on-demand, concurrency 1 |
| Researcher | `e154b480-a914-4b1f-b40b-209ee332760d` | PM | 불가 | 불가 | 불가 | on-demand, concurrency 1 |
| TPM | `56cd8c39-6c19-4bf0-a6bb-8390e7b1bcd1` | Strategy Agent | 가능 | 불가 | 가능 | on-demand, concurrency 1 |
| Builder | `0c82b32e-682c-4e8e-a53e-5790eaeadcbf` | TPM | 불가 | 불가 | 불가 | on-demand, concurrency 1 |

## 책임 분리

| Role | 수행 | 수행하지 않음 |
|---|---|---|
| Strategy Agent | 인간 요청 해석, Goal 정렬, Team Goal Milestone 관리, PM/TPM 인계 | Task 세부 분해, 실행 Agent 직접 배정, 제품 작업 |
| PM | 범위, 요구사항, 조사, 스펙, 인수 기준과 Researcher review | Builder 지휘, 구현 승인, Goal 상태 전환 |
| TPM | 기술 계획, 개발 리딩, Builder 배정, 구현 review와 품질 게이트 | Researcher 지휘, 스펙 추측, Goal 상태 전환 |
| Builder | 승인된 계약 기반 런타임 코드와 테스트 | 미할당 Task, 스펙 추측, 다른 Agent 배정 |
| Researcher | 원본 근거 조사, 스펙, 인벤토리, Fixture | 제품 런타임 구현, 근거 없는 결정 |

## 실제 Instructions

- [Strategy Agent](strategy/AGENTS.md)
- [PM](pm/AGENTS.md)
- [TPM](tpm/AGENTS.md)
- [Builder](builder/AGENTS.md)
- [Researcher](researcher/AGENTS.md)
