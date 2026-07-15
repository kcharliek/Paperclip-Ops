# Role Blueprint

| Role | 책임 | 기본 권한 |
|---|---|---|
| Board | Charter, 예산, 고위험 승인 | 모든 관리 권한 |
| Strategy Agent | 인간 요청 해석, Goal 정렬, Milestone 관리 | Goal 관리, PM/TPM handoff Task 배정 |
| PM | 범위, 요구사항, 조사, 스펙, 인수 기준 | Researcher Task 배정, PM/TPM handoff |
| TPM | 기술 계획, 개발 리딩, 구현 review, Maintenance | Builder Task 배정, Skill 관리, 승인된 Agent 채용 요청 |
| Builder | 할당된 구현과 테스트 | 제품 workspace 쓰기 |
| Researcher | 근거 조사, 계약, fixture | 근거 저장소 읽기, 문서 쓰기 |

## 공통 규칙

- 각 instructions는 자신의 Role과 보고 대상을 첫 문단에서 정확히 선언한다.
- 인간 요청은 Strategy Agent가 해석하고, `team` Goal을 Milestone으로 정의·관리한다.
- Strategy Agent는 실행 의도와 완료 조건을 필요한 최소 handoff Task로 PM과 TPM에만 배정한다.
- PM과 TPM은 같은 레이어이며 PM은 Researcher, TPM은 Builder만 직접 지휘한다.
- PM과 TPM은 서로의 하위 Agent에게 직접 배정하지 않고 peer handoff Task로 협업한다.
- PM과 TPM은 Milestone 상태를 바꾸지 않고 각 완료 근거를 Strategy Agent에게 보고한다.
- shared workspace에서 쓰기 Agent의 동시 실행은 기본 1이다.
- Researcher는 근거를 만들고 Builder는 구현한다. 합칠 때도 산출물 경계는 유지한다.
- TPM은 평상시 개발 리더이며 Maintenance 동안 owner로 독점 실행한다.
- Agent 생성은 Board 승인 정책을 우회하지 않는다.
- sandbox와 approval 우회는 신뢰된 로컬 환경에서 Company Profile이 명시한 경우에만 허용한다.

Role별 Agent 수, 이름, model과 예산은 범용 계약이 아니라 Company Profile 값이다.
