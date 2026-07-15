# AI Company Blueprint

Paperclip Company를 제품과 무관하게 세팅하기 위한 전체 설계 계약이다. 제품별 설정은 이 계약을 채우는 Company Profile이며 [AllNewMTS](../references/allnewmts/README.md)는 첫 reference다.

## 표준 조직

```text
Board (Human owner)
└── Product Steward
    ├── Prototyper 1..N
    ├── Builder 1..N
    ├── Sweeper 1..N
    ├── Grower 1..N
    └── Maintainer 1..N
```

[Role 계약](roles.md)은 책임과 권한을, [Delivery Lifecycle](delivery-lifecycle.md)은 Task 표현과 Role 전환을, [Goal → Milestone → Task Workflow](goal-milestone-task-workflow.md)는 승인과 재진입을 정한다.

## Company Profile에 필요한 값

| 영역 | 필수 값 |
|---|---|
| Charter | 목적, 완료 조건, issue prefix |
| Governance | Board owner, Agent 생성 승인, 예산과 고위험 기준 |
| Knowledge | 하나의 도메인 [Company Skill](company-skill.md) |
| Organization | 표준 Role별 Agent 이름, 수, Paperclip role mapping과 보고선 |
| Delivery | Company Goal, `team` Goal Milestone, active Milestone 하나, Project와 Role label |
| Runtime | writable workspace, read-only sources, model, concurrency와 격리 가능 여부 |
| Operations | Maintainer, `drain` 또는 `immediate`, 신뢰성 기준 |

## 공통 실행 흐름

1. Board가 Charter와 Company Profile을 승인한다.
2. 사람은 Goal을 등록하고, Product Steward가 만든 Milestone 초안을 확인하거나 거절한다.
3. 확인된 Milestone을 바탕으로 Product Steward와 실행 Agent가 Root·child Task tree를 만든다.
4. Product Steward가 제품 상태에 맞는 Delivery Role과 entry·exit gate를 정한다.
5. Prototyper는 여러 후보를 만들고 Product Steward는 keep 또는 kill을 결정한다.
6. Builder는 선택된 후보를 제품화하고 Task의 review stage를 거친다.
7. Grower는 사용자·eval 근거로 개선을 요청하고 Sweeper는 불필요한 복잡성을 제거한다.
8. Maintainer는 운영 가능한 시스템의 보안, 신뢰성, 성능과 비용을 책임진다.
9. Leaf는 상위 Node 담당자가 확인하고, Root 완료 뒤 Product Steward가 사람에게 Milestone 최종 확인을 요청한다.
10. Maintainer가 필요하면 [Maintenance](../docs/architecture.md)를 요청하고 단일 owner로 실행한 뒤 `normal`로 복귀한다.

## 설정 순서

1. Company와 Board를 만든다.
2. Product Steward를 만들고 Board 보고선과 Task 배정 권한을 검증한다.
3. Prototyper, Builder, Sweeper, Grower와 Maintainer를 각각 한 명 이상 만든다.
4. 다섯 Role label과 review·approval stage 사용 규칙을 연결한다.
5. Company Skill과 writable workspace를 연결한다.
6. Company Goal 하나를 만들고 Product Steward가 첫 `team` Goal Milestone 초안을 만든다.
7. 사람이 Milestone을 확인한 뒤 Root Task, child 분해와 review policy를 연결한다.
8. workspace의 Git 기준점과 isolated workspace 지원 여부를 확인하고 안전한 실행 policy를 선택한다.
9. Operation Control의 owner를 Maintainer로 선택하고 `drain → maintenance → normal`을 시험한다.
10. Leaf 확인 → Node review → Root review → Milestone 사람 확인의 한 사이클을 검증한다.

Company 생성 자동화는 두 번째 Company에서도 같은 입력 구조가 확인된 뒤 추가한다.
