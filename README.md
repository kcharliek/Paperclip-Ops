# PaperClip-Ops

Paperclip 위에 재사용 가능한 AI Company를 설계하고 운영하기 위한 기준 저장소다. 특정 제품 설정은 범용 Blueprint의 검증 사례로만 보관한다.

## 프로젝트 목표

PaperClip-Ops의 목표는 AI가 제품을 자율적으로 개선하고, 인간은 주기적인 업무 보고와 주요 마일스톤의 방향 조정에 집중하는 운영 시스템을 만드는 것이다.

- 실무 작업은 AI Agent가 담당한다. 인간은 Board/Operator로서 목표, 예산, 위험한 변경과 마일스톤을 승인한다.
- Strategy Agent는 인간의 니즈를 Goal과 Milestone으로 해석하고, Manager는 이를 Task로 나눠 조사·구현·검토·검증을 수행하게 한다.
- 인간은 정해진 주기의 보고를 받고, 마일스톤 완료·실패·범위 변경 시 직접 개입한다.
- 테스트용 Company와 제품은 실제 조직과 제품 개발에서 볼 수 있는 목표, 역할, 저장소 경계, 품질 게이트를 가진 현실적인 구조로 설계한다.
- 자율성은 무제한 실행을 뜻하지 않는다. 가장 작은 검증 가능한 단면부터 진행하고, Task·Agent·재시도·동시 실행을 필요한 만큼만 허용한다.
- 모든 테스트는 토큰 예산, 실행 시간, 동시 실행 수와 중단 조건을 둔다. 반복 실패나 진전 없는 실행은 중단하고 근거를 남긴다.

완료 기준은 AI가 실제 제품 개선을 수행하고, 인간이 보고와 마일스톤 개입만으로 방향을 통제하며, 각 단계의 비용·근거·검증 결과를 재현할 수 있는 상태다.

### 테스트 작성 원칙

- 테스트는 하나의 계약이나 동작만 검증하도록 작은 단위로 쪼갠다.
- 파일, API 상태, 권한, Git diff처럼 LLM 없이 확인할 수 있는 것은 결정적 검사로 작성한다.
- 전체 리그레션 테스트는 기본 실행에서 제외하고, 마일스톤·릴리스 후보·공통 경로 변경 시에만 실행한다.
- LLM이 필요한 black-box 테스트는 별도 예산·시간·재시도 한도를 두고, 실패 시 전체 테스트를 무한히 반복하지 않는다.
- 작은 테스트가 실패하면 해당 경계에서 중단하고 원인을 수정한 뒤 다음 범위로 진행한다.

## 구조

```text
PaperClip-Ops/
├── blueprint/              # 모든 AI Company에 적용할 설계 계약
├── references/allnewmts/  # 3100 서버에서 수집한 실제 사례
├── docs/                   # 전체 설계 지도와 운영 상태 모델
└── plugins/                # 범용 운영 기능
```

- [AI Company Blueprint](blueprint/README.md): 범용 Company 구성 원칙과 설정 순서
- [Role Blueprint](blueprint/roles.md): 공통 Role, 책임과 권한
- [Company Skill Blueprint](blueprint/company-skill.md): 도메인 지식을 분리하는 기준
- [설계 지도](docs/design-map.md): Blueprint와 Company Profile의 경계
- [운영 상태](docs/architecture.md): `normal`/`holding`/`maintenance`
- [AllNewMTS Reference](references/allnewmts/README.md): 현재 서버 설정과 원본 스냅샷
- [Operation Control](plugins/operation-control/README.md): `drain`/`immediate` 정지 플러그인
- [Ops System Test](tests/system/README.md): 실제 OpenCode Agent를 사용하는 black-box 운영 계약 테스트

## 플러그인 개발

```bash
cd /Users/chanheekim/Dev/PaperClip-Ops/plugins/operation-control
npm ci
npm test
```

현재 플러그인은 위 local path에서 설치되어 있다. 코드 변경 후 Paperclip에서 Disable/Enable하면 빌드된 worker를 다시 읽는다.
