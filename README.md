# PaperClip-Ops

Paperclip 위에 인간 개입을 예외로 제한하는 재사용 가능한 AI Company를 설계하고 운영하기 위한 기준 저장소다. 특정 제품 설정은 범용 Blueprint의 검증 사례로만 보관한다.

## 프로젝트 목표

PaperClip-Ops의 목표는 AI가 제품을 자율적으로 개선하고, 인간은 주기적인 업무 보고와 주요 마일스톤의 방향 조정에 집중하는 운영 시스템을 만드는 것이다.

- 실무 계획, Task 분해, 구현, AI review와 보완은 Agent가 연속 수행한다.
- 인간은 Goal, 자율 실행 범위, 예산과 금지사항을 정하고 고위험 행동과 범위 변경만 승인한다.
- Product Steward는 새 Company Goal을 즉시 native Task tree로 연결하며 별도 Milestone 초안 승인을 기다리지 않는다.
- 인간은 완료 보고를 받고, AI가 승인 범위를 벗어나거나 같은 기준을 두 번 실패했을 때만 개입한다.
- 테스트용 Company와 제품은 실제 조직과 제품 개발에서 볼 수 있는 목표, 역할, 저장소 경계, 품질 게이트를 가진 현실적인 구조로 설계한다.
- 자율성은 무제한 실행을 뜻하지 않는다. 가장 작은 검증 가능한 단면부터 진행하고, Task·Agent·재시도·동시 실행을 필요한 만큼만 허용한다.
- 모든 테스트는 토큰 예산, 실행 시간, 동시 실행 수와 중단 조건을 둔다. 반복 실패나 진전 없는 실행은 중단하고 근거를 남긴다.

완료 기준은 AI가 실제 제품 개선을 수행하고, 인간이 보고와 마일스톤 개입만으로 방향을 통제하며, 각 단계의 비용·근거·검증 결과를 재현할 수 있는 상태다.

## 기술 경계

이 시스템의 운영 제어면은 Paperclip 안에만 둔다.

- Goal, Task, child relation, blocker, Agent, native execution policy, 승인, Routine, Pipeline과 workspace는 Paperclip 공식 기능을 먼저 사용한다.
- 공식 기능만으로 부족한 동작은 Paperclip에 설치되는 공개 Plugin SDK의 action, tool, state, event와 UI 안에서만 보완한다.
- Paperclip Core 포크·패치, 별도 오케스트레이터·daemon·scheduler·상태 DB·승인 UI, Core DB 직접 쓰기는 만들지 않는다.
- 제품 저장소는 제품 코드와 Git 근거만 보관하며 Paperclip 제어 상태의 원본으로 사용하지 않는다.
- system test는 Paperclip API를 black-box로 검증하는 일회성 도구이지 운영 controller가 아니다.
- 공식 기능이나 Plugin SDK에 필요한 경계가 없으면 외부 시스템으로 우회하지 않고 [drift](references/allnewmts/drift.md)에 남겨 공식 지원을 기다린다.

### 테스트 작성 원칙

- 테스트는 하나의 계약이나 동작만 검증하도록 작은 단위로 쪼갠다.
- 파일, API 상태, 권한, Git diff처럼 LLM 없이 확인할 수 있는 것은 결정적 검사로 작성한다.
- 전체 리그레션 테스트는 기본 실행에서 제외하고, 마일스톤·릴리스 후보·공통 경로 변경 시에만 실행한다.
- LLM이 필요한 black-box 테스트는 별도 예산·시간·재시도 한도를 두고, 실패 시 전체 테스트를 무한히 반복하지 않는다.
- 작은 테스트가 실패하면 해당 경계에서 중단하고 원인을 수정한 뒤 다음 범위로 진행한다.
- 실행 정책, 권한, Gate 또는 상태 전이가 바뀌면 같은 변경에서 대응 테스트를 추가·수정한다. 기존 테스트가 이미 같은 계약을 검증하면 변경하지 않은 근거와 실행 결과를 남긴다.

## 구조

```text
PaperClip-Ops/
├── blueprint/              # 모든 AI Company에 적용할 설계 계약
├── references/           # 3100 서버에서 수집한 실제 Company 사례
├── docs/                   # 전체 설계 지도와 운영 상태 모델
└── plugins/                # 범용 운영 기능
```

- [AI Company Blueprint](blueprint/README.md): 범용 Company 구성 원칙과 설정 순서
- [Role Blueprint](blueprint/roles.md): 공통 Role, 책임과 권한
- [Delivery Lifecycle](blueprint/delivery-lifecycle.md): native AI review, 위험도와 예외 승인
- [Goal → Autonomous Task Workflow](blueprint/goal-task-workflow.md): 자동 분해, 보완과 인간 escalation
- [Company Skill Blueprint](blueprint/company-skill.md): 도메인 지식을 분리하는 기준
- [Company Integrity Check](blueprint/company-integrity-routine.md): 주기적 운영 정합성 확인과 보정 경계
- [설계 지도](docs/design-map.md): Blueprint와 Company Profile의 경계
- [운영 상태](docs/architecture.md): `normal`/`holding`/`maintenance`
- [Paperclip Ops Company](docs/ops-company.md): Blueprint와 Plugin을 지속 개선하는 전용 Company
- [AllNewMTS Reference](references/allnewmts/README.md): 현재 서버 설정과 원본 스냅샷
- [Paperclip Ops Reference](references/paperclip-ops/README.md): Ops 전용 Company의 현재 설정과 자체개선 검증
- [Operation Control](plugins/operation-control/README.md): `drain`/`immediate` 정지 플러그인
- [Ops System Test](tests/system/README.md): 결정적 운영 계약과 선택적 OpenCode black-box 테스트

## 플러그인 개발

```bash
cd /Users/chanheekim/Dev/PaperClip-Ops/plugins/operation-control
npm ci
npm test
```

현재 플러그인은 위 local path에서 설치되어 있다. 코드 변경 후 Paperclip에서 Disable/Enable하면 빌드된 worker를 다시 읽는다.
