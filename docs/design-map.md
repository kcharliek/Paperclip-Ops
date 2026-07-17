# AI Company 설계 지도

## 설계 계층

```text
AI Company Blueprint
├── Charter: 목적과 완료 조건
├── Autonomy: 허용 범위, 금지 행동, 예산과 위험도
├── Organization: Steward, executor, reviewer
├── Knowledge: Company Skill
├── Delivery: native Goal, Task tree, review와 예외 approval
├── Runtime: model, workspace, concurrency
└── Operations: maintenance, run cap, integrity routine
```

## Blueprint와 Company Profile

| Blueprint가 정한다 | Company Profile이 채운다 |
|---|---|
| 자동 진행과 exception-only human gate | 회사 목적, autonomy envelope와 위험 예시 |
| native Issue와 execution policy 사용 | Agent ID, reviewer 후보와 Board user ID |
| Role 책임과 권한 원칙 | 이름, model, 예산, timeout |
| maintenance와 run cap | owner, stop policy와 상한 |
| 검증 단계 | 제품별 테스트와 workspace |

## 개선 루프

```text
실제 Company 관찰
  → Reference 갱신
  → System Auditor가 반복 문제를 Backlog로 제안
  → 새 Goal 범위에 채택
  → Agent 구현 + native review
  → 고위험 행동만 human approval
  → API와 실제 run으로 검증
```

한 번 발생한 문제는 reference drift로 남기고 둘 이상의 Company에서 반복될 때 Blueprint 후보로 올린다. 개선 자체도 별도 custom Milestone 없이 같은 native delivery 흐름을 사용한다.
