# Paperclip Ops Company

Paperclip Ops Company는 AI Company Blueprint, Operation Control Plugin과 Company Profile의 지속 개선을 제품 목표로 갖는다. AllNewMTS 같은 제품 Company는 이 시스템의 소비자이며 Ops 자체를 개선할 책임을 지지 않는다.

## 조직

```text
Board
└── Ops Steward
    ├── System Auditor
    ├── Builder
    ├── Sweeper
    └── Maintainer
```

- Ops Steward는 개선 Backlog를 Milestone 필수 범위로 승격하고 사람 확인 뒤 실행시킨다.
- System Auditor는 불완전성을 찾되 코드·설정·제품 Company를 수정하지 않는다.
- Builder는 확인된 Blueprint·Plugin·Profile 변경을 구현한다.
- Sweeper는 범용성, 회귀와 불필요한 복잡성을 독립 검토한다.
- Maintainer는 승인된 버전을 적용하고 복구·비용·운영 정합성을 확인한다.

Prototyper와 Grower는 별도 후보 비교나 사용자 eval이 실제로 필요할 때 채용한다. 초기 Company에는 역할만을 맞추기 위한 Agent를 만들지 않는다.

## 자체개선 흐름

```text
소비 Company 관측 또는 Ops 실행 결과
  → System Improvement Review
  → Ops Backlog
  → Ops Steward 분류
  → 사람의 Milestone 확인
  → Builder 구현
  → Sweeper 독립 검토
  → 일회용 Company 검증
  → Git Milestone 보고와 Board 배포 승인
  → Maintainer가 Ops Company에 적용
  → 소비 Company가 별도 Maintenance Task로 선택 적용
```

System Improvement Review는 주 1회와 incident 후 on-demand로 실행한다. 한 run에서 신규 제안을 최대 3개로 제한하고 자동 보정하지 않는다.

Company Integrity Check는 6시간마다 알려진 운영 계약만 검사하고, System Improvement Review는 주 1회 아직 규칙으로 포착되지 않은 문제만 찾는다. 두 Routine 모두 이상을 직접 수정하지 않는다.

확인된 delivery Node가 human·actor·permission 경계에서 blocked되면 active tree는 그대로 멈추되 Company 전체를 멈추지 않는다. Operation Control이 Product Steward에게 active tree 밖의 blocker triage Task를 한 episode당 하나만 배정하고, System Auditor와 Sweeper의 read-only Routine은 계속한다. Board 전용 검증은 Board가 일회용 Company에서 evidence를 만들고 Builder·Maintainer가 그 evidence만 검토한다. 범위나 Exit gate 변경은 새 Milestone 확인 없이는 실행하지 않는다.

## Backlog 분류

| Label | 의미 |
|---|---|
| `blueprint` | 둘 이상의 Company에 적용할 범용 계약 후보 |
| `plugin` | Operation Control 동작·Gate·상태 전이 후보 |
| `local-profile` | 한 Company에만 필요한 적용 차이 |
| `paperclip-gap` | 공식 Paperclip 또는 공개 Plugin SDK 지원이 필요한 제약 |

`backlog`가 실행 후보의 원본이다. Reference의 `drift.md`는 현재 제약을 요약하고 관련 Ops Task ID를 연결한다. Product Steward가 확인된 Milestone에 포함한 항목만 `todo`가 된다.

Ops Company 자체의 결함도 같은 Backlog로 돌아간다. 별도 상위 Company를 만들지 않으며 Board 확인, Git, 일회용 Company 검증을 재귀의 종료점으로 둔다.
