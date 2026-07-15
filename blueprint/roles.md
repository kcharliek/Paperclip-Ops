# Role Blueprint

| Role | 책임 | 기본 권한 |
|---|---|---|
| Board | Charter, 예산, 고위험 승인 | 모든 관리 권한 |
| Strategy Agent | 인간 요청 해석, Goal 정렬, Milestone 관리 | Goal 관리, Manager handoff Task 배정 |
| Manager | 승인된 Milestone의 Task 분해·배정·review | 실행 Task 배정, Agent/Skill 생성 요청 또는 생성 |
| Builder | 할당된 구현과 테스트 | 제품 workspace 쓰기 |
| Researcher | 근거 조사, 계약, fixture | 근거 저장소 읽기, 문서 쓰기 |
| Tech Manager | 기술 부채 점검, Maintenance, 구조 개선 | Task 배정, Skill 관리, 승인된 Agent 채용, 코드 개선 |

## 공통 규칙

- 각 instructions는 자신의 Role과 보고 대상을 첫 문단에서 정확히 선언한다.
- 인간 요청은 Strategy Agent가 해석하고, `team` Goal을 Milestone으로 정의·관리한다.
- Strategy Agent는 실행 의도와 완료 조건을 handoff Task 하나로 Manager에게만 배정한다.
- 일반 Task는 Manager만 배정하고 실행 Agent는 미할당 일을 가져가지 않는다.
- Manager는 Milestone 상태를 바꾸지 않고 완료 근거를 Strategy Agent에게 보고한다.
- shared workspace에서 쓰기 Agent의 동시 실행은 기본 1이다.
- Researcher는 근거를 만들고 Builder는 구현한다. 합칠 때도 산출물 경계는 유지한다.
- Tech Manager는 평상시 개발을 지휘하지 않고 Maintenance owner로만 독점 실행한다.
- Agent 생성은 Board 승인 정책을 우회하지 않는다.
- sandbox와 approval 우회는 신뢰된 로컬 환경에서 Company Profile이 명시한 경우에만 허용한다.

Role별 Agent 수, 이름, model과 예산은 범용 계약이 아니라 Company Profile 값이다.
