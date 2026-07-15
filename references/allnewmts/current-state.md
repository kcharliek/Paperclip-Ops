# AllNewMTS Company 현재 구성

확인 기준: 2026-07-15, Paperclip local instance `127.0.0.1:3100`.

이 문서는 범용 Blueprint를 검증하는 AllNewMTS reference의 빠른 요약이다. 실제 설정은 [AllNewMTS Company 설계](README.md), Role 원문은 [Role 설계](roles/README.md), 범용 기준은 [AI Company Blueprint](../../blueprint/README.md)에 있다.

## Company

| 항목 | 값 |
|---|---|
| 이름 | AllNewMTS |
| ID | `91871447-f0a0-4d53-aadb-fc0246d94565` |
| 상태 | active |
| Issue prefix | `ALL` |
| 목적 | SmartFormDe XMS 화면 런타임을 React Native Expo로 이주 |
| 신규 Agent 승인 | Board approval 필요 |

## 조직

```text
Strategy Agent (CEO)
├── PM
│   └── Researcher (Spec Analyst)
└── TPM (Development Lead)
    └── Builder (Engineer)
```

| Agent | 주요 책임 | Task 배정 | Agent 생성 | 현재 상태 |
|---|---|---:|---:|---|
| Strategy Agent | 인간 요청 해석, Goal·Milestone 관리, PM/TPM 인계 | PM/TPM에게 가능 | 불가 | idle |
| PM | 범위·요구사항·조사 계획과 Researcher review | 가능 | 가능 | idle |
| TPM | 기술 계획, Builder 리딩, 구현 review와 품질 게이트 | 가능 | 불가 | idle |
| Builder | Expo 기반 FormDe 런타임 구현 | 불가 | 불가 | idle |
| Researcher | 원본 분석, 호환성 스펙과 Fixture 작성 | 불가 | 불가 | idle |

모든 Agent는 `codex_local`, `gpt-5.5`를 사용한다. heartbeat는 비활성이고 on-demand 실행과 `maxConcurrentRuns: 1`만 허용한다.

## 프로젝트

활성 프로젝트는 `MTS Migration`이다.

- 제품 workspace: `/Users/chanheekim/Dev/AllNewMTS`
- 실행 정책: shared workspace
- Project lead: PM
- 쓰기 대상: AllNewMTS
- Plus와 `mts_screen`: 읽기 전용 원본

## Goal 구조

- 네 Team Goal의 owner는 Strategy Agent이며 이 Goal들을 Milestone으로 관리한다.
- Company Goal: SmartFormDe 시스템을 React Native Expo 기반으로 Migration
  - 개발 기반과 FormDe 호환성 계약 확보 — active
  - 대표 XMS E2E 호환 입증 — planned
  - XMS 런타임 v1 완성 — planned
  - 운영 화면 호환성 확대와 FormDe Cutover — planned
- 별도 Goal: AI가 유지보수할 수 있는 시스템 구성 — planned

## Operation Control

| 항목 | 값 |
|---|---|
| Plugin key | `local.operation-control` |
| 버전 | `0.1.0` |
| 상태 | ready / healthy |
| 설치 경로 | `/Users/chanheekim/Dev/PaperClip-Ops/plugins/operation-control` |
| 기본 owner | TPM |
| 기본 stop policy | drain |

현재 Company 운영 상태는 `normal`이다. Operation Artifact는 첫 `Start maintenance` 실행 때 생성된다.

## 확인된 설정 차이

목표 역할과 현재 Agent 설정에는 다음 차이가 있다.

- TPM은 `canCreateAgents: false`라 Board 승인 아래 Builder 채용 요청을 직접 만들 수 없다.
- 정기적인 기술 부채 점검 routine 또는 heartbeat가 아직 없다.

현재 TPM은 Builder 배정, 구현 review와 Maintenance owner 역할을 수행할 수 있다. Agent 채용과 주기 점검까지 맡기려면 permission과 routine 변경이 필요하다.
