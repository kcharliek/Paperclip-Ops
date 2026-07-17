# AI Company Blueprint

Paperclip Company가 인간의 Goal을 받아 계획, 분해, 실행, AI review와 보완을 스스로 이어가는 표준 계약이다. 인간은 자율 실행 범위를 정하고 예외만 판단한다.

## 기본 조직

```text
Board (Human owner)
└── Product Steward
    ├── Builder / domain executor 1..N
    └── Reviewer 1..N
```

Prototyper, Grower, Sweeper, Maintainer와 System Auditor는 실제 전문 작업이 있을 때 executor 또는 reviewer로 참여한다. Role 수가 workflow 단계 수를 뜻하지 않으며, 모든 Role을 매 Task에 순차 투입하지 않는다.

[Role 계약](roles.md)은 책임과 권한을, [Delivery Lifecycle](delivery-lifecycle.md)은 native review와 위험도 정책을, [Goal → Autonomous Task Workflow](goal-task-workflow.md)는 자동 진행과 escalation을 정한다.

## Company Profile 필수 값

| 영역 | 필수 값 |
|---|---|
| Charter | 목적, 완료 조건, issue prefix |
| Autonomy envelope | writable 범위, 금지 행동, 시간·비용 상한, 위험도 기준 |
| Organization | Product Steward, executor와 독립 reviewer 후보 |
| Knowledge | 도메인 [Company Skill](company-skill.md) |
| Delivery | Company Goal, Project, native Task와 `executionPolicy` |
| Runtime | workspace, model, writer 동시성, 격리 가능 여부 |
| Operations | Maintainer, [Company Integrity Check](company-integrity-routine.md), maintenance 정책과 run 상한 |

## 공통 실행 흐름

1. 인간이 Goal과 autonomy envelope를 등록한다.
2. Operation Control이 Goal당 하나의 native Task를 Product Steward에게 자동 배정한다.
3. Product Steward가 Project와 현재 상태를 읽고 바로 실행 Task를 만든다.
4. 코드와 사용자 산출물 Task에는 작성자와 다른 Agent의 native `review` stage를 붙인다.
5. executor가 구현과 결정적 검증을 마치고 Task를 `in_review`로 전환한다.
6. reviewer는 같은 Task에서 승인하거나 `in_progress`로 돌려보낸다. 보완은 자동으로 계속한다.
7. 되돌리기 어려운 고위험 행동에만 native human `approval` stage를 추가한다.
8. 모든 Task가 끝나면 Product Steward가 Goal 결과를 한 번 보고하고 다음 Goal을 기다린다.

## 설정 순서

1. Company, Board, Project와 workspace를 만든다.
2. Product Steward 한 명과 executor·reviewer 후보를 만든다.
3. Agent instructions와 Company Skill을 연결한다.
4. Product Steward에게 Task 배정 권한을 주고 나머지 권한은 필요한 범위로 제한한다.
5. Operation Control의 Goal auto-dispatch와 maintenance 전이를 확인한다.
6. 일반 Task에 Agent review stage만 적용해 구현→review→보완→완료를 검증한다.
7. disposable 고위험 Task에 Agent review 뒤 human approval stage를 적용해 승인 전 행동이 멈추는지 확인한다.
8. Company Integrity Check의 healthy no-op을 확인한다.

역할 문구 변경은 정적 검사로 끝낸다. Plugin 상태 전이가 바뀔 때만 plugin unit test를 실행하고, Paperclip 전체 black-box 검증은 릴리스 후보 또는 공통 실행 경로 변경에만 수행한다.
