# Company Skill Blueprint

Company Skill은 조직 설명서가 아니라 모든 Role이 공유하는 도메인 계약이다.

## 포함한다

- 도메인 용어와 변하지 않는 규칙
- writable 대상과 read-only 근거
- 근거 우선순위와 충돌 해결 기준
- 대표 fixture 또는 검증 자료
- Task 완료 조건과 금지 사항

## 포함하지 않는다

- Agent의 고유 이름과 ID
- 현재 active Goal이나 일회성 Task
- model, 예산, heartbeat 같은 runtime 값
- Role instructions에 이미 있는 배정·review 규칙

조직이 바뀌어도 Skill을 고치지 않아도 되는 상태가 올바른 경계다. 작업 배정과 review 규칙은 Company Skill이 아니라 Role instructions에 둔다.
