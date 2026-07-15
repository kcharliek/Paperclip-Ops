# Role Blueprint

Paperclip의 `role` enum은 권한과 UI를 위한 호환 값이고, 실제 Role 계약은 Agent의 이름, title, capabilities와 instructions가 정한다.

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

| Role | Paperclip role | 책임 | 기본 권한 |
|---|---|---|---|
| Board | Human | Charter, 예산, 고위험 승인 | 모든 관리 권한 |
| Product Steward | `ceo` | 인간 요청 해석, Goal·Milestone, Role 배치, keep/kill과 단계 전환 | Task 배정, 승인된 Agent 채용 요청, Skill 관리 |
| Prototyper | `researcher` | 여러 해법 탐색, Prototype와 비교 근거 | 격리 workspace 또는 Artifact 쓰기 |
| Builder | `engineer` | 선택된 해법의 제품화와 테스트 | 제품 workspace 쓰기 |
| Sweeper | `qa` | UI·코드·기능 단순화, 제거, 성능 개선과 선택 Backlog 정리 | 제품 workspace 쓰기와 삭제, 근거가 있는 Backlog 취소 |
| Grower | `pm` | 사용 근거와 eval 기반 반복 개선 | 근거 읽기, 승인된 실험 쓰기 |
| Maintainer | `devops` | 보안, 신뢰성, 성능, 비용, 장애와 유지보수 | 제품 workspace와 운영 근거 쓰기, Maintenance owner |

## Paperclip 제약을 반영한 공통 규칙

- 모든 실행 Role은 Product Steward 한 명에게 직접 보고한다. Paperclip의 `reportsTo`는 하나만 허용한다.
- Product Steward는 Root Task와 Agent 간 배정을 담당한다. Node 담당 Agent는 자신이 맡은 Node 아래의 child를 분해할 수 있지만 Goal·Milestone·형제 범위를 바꾸거나 다른 Root를 만들 수 없다. Paperclip 권한이 없으면 Product Steward가 분해안을 받아 child 생성을 대행한다.
- 사람의 요청은 Goal로 등록한다. Product Steward는 Milestone의 필수 작업만 `todo`로 만들고 선택 작업은 active Task tree 밖의 `backlog`로 둔다. Sweeper는 근거가 있는 Backlog를 취소할 수 있지만 `todo` 승격은 Product Steward만 수행한다.
- `todo` Task에는 delivery Role label 하나와 [Delivery 계약](delivery-lifecycle.md)을 기록한다. Backlog에는 Goal, 기대 가치, 선택인 이유와 폐기 조건만 기록한다.
- Leaf 완료는 상위 Node 담당자가 확인하고, Node와 Root 완료는 부모의 review stage를 통과해야 한다. 인간은 Milestone만 확인·거절한다.
- 구현 결과는 Paperclip `executionPolicy`의 review stage를 거친다. 작성자와 reviewer는 달라야 한다.
- 고위험 변경은 review 뒤 Board approval stage를 추가한다.
- shared workspace의 writer 동시 실행은 1이다. 독립 Git history와 isolated workspace가 확인된 경우에만 병렬 writer를 늘린다.
- isolated workspace를 사용할 수 없으면 Prototyper는 shared 제품 workspace를 수정하지 않고 Issue Document, attachment 또는 work product로 결과를 남긴다.
- Role Agent 수는 1..N이지만 같은 writable workspace를 공유하는 실행은 직렬화한다.
- Company가 `holding` 또는 `maintenance`이면 Maintenance owner가 아닌 Agent는 새 작업을 시작하지 않는다.
- Maintenance는 단일 owner 제약을 수용한다. Maintainer가 사전 승인된 변경과 검증을 수행하고 정상 복귀 뒤 다른 Role이 review한다.
- Agent 생성은 Board 승인 정책을 우회하지 않는다.
- sandbox와 approval 우회는 신뢰된 로컬 환경에서 Company Profile이 명시한 경우에만 허용한다.

표준 instructions는 [role-instructions](role-instructions/)에 있다. Agent 이름, ID, model, 예산과 실제 수는 Company Profile 값이다.
