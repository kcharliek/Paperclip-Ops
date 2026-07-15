# AI Company Blueprint

Paperclip Company를 제품과 무관하게 세팅하기 위한 최소 설계 계약이다. 제품별 설정은 이 계약을 채우는 Company Profile이며 [AllNewMTS](../references/allnewmts/README.md)는 첫 reference다.

## 기본 조직

```text
Board (Human owner)
└── Strategy Agent
    └── Manager
        ├── Builder 1..N
        ├── Researcher 0..N
        └── Tech Manager
```

Role 이름보다 [책임과 권한 계약](roles.md)이 우선이다. 작은 Company는 Builder와 Researcher를 한 Agent가 맡을 수 있지만 Strategy Agent, Manager와 Tech Manager의 실행 모드는 분리한다.

## Company Profile에 필요한 값

| 영역 | 필수 값 |
|---|---|
| Charter | 목적, 완료 조건, issue prefix |
| Governance | Board owner, Agent 생성 승인, 예산 |
| Knowledge | 하나의 도메인 [Company Skill](company-skill.md) |
| Delivery | Company Goal, `team` Goal Milestone, active Milestone 하나, Project, Task 완료 조건 |
| Runtime | writable workspace, read-only sources, model, concurrency |
| Operations | Maintenance owner, `drain` 또는 `immediate` |

## 공통 실행 흐름

1. Board가 Charter와 Company Profile을 승인한다.
2. Strategy Agent가 인간 요청을 해석해 Goal과 Milestone을 정렬하고 Manager에게 실행 의도를 인계한다.
3. Manager가 승인된 Milestone을 실행 가능한 Task로 나누고 Role에 배정한다.
4. Builder와 Researcher가 근거와 산출물을 Task에 남긴다.
5. Manager가 완료 조건을 검토하고 Milestone 근거를 Strategy Agent에게 보고한다.
6. Strategy Agent가 Milestone 상태를 관리하고 주요 전환은 Board에 보고한다.
7. Tech Manager가 주기적으로 부채를 확인하고 필요하면 [Maintenance](../docs/architecture.md)를 시작한다.
8. Maintenance에서는 Task 조정, 승인된 Agent 채용, 코드 개선과 검증을 마친 뒤 `normal`로 복귀한다.

## 설정 순서

1. Company와 Board를 만든다.
2. Strategy Agent, Manager와 Tech Manager를 만들고 보고선·권한을 검증한다.
3. 필요한 실행 Role만 추가한다.
4. Company Skill과 writable workspace를 연결한다.
5. Company Goal 하나와 첫 `team` Goal Milestone, Project를 만든다.
6. Operation Control을 연결하고 `drain → maintenance → normal`을 시험한다.
7. 인간 요청 하나가 Milestone에 정렬되고 실제 Task가 배정, 실행, review, 완료되는지 확인한다.

현재는 이 문서가 기준이다. Company 생성 자동화는 두 번째 Company에서도 같은 입력 구조가 확인된 뒤 추가한다.
