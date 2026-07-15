# AI Company 설계 지도

이 저장소의 중심은 특정 Company가 아니라 반복 적용할 수 있는 [AI Company Blueprint](../blueprint/README.md)다.

## 설계 계층

```text
AI Company Blueprint
├── Charter: 목적과 완료 조건
├── Governance: Board, 승인, 예산
├── Organization: Board, Strategy Agent, PM, TPM, 실행 Role, 보고선, 권한
├── Knowledge: Company Skill
├── Delivery: Company Goal, Team Goal Milestone, Project, Task, review
├── Runtime: model, environment, workspace, concurrency
└── Operations: 상태, maintenance, routine, plugin
```

## 고정 설계와 Company Profile

| Blueprint가 정한다 | Company Profile이 채운다 |
|---|---|
| Role의 책임 경계와 권한 원칙 | 회사 목적, 이름, issue prefix |
| Task 배정과 review 흐름 | 제품 workspace와 읽기 전용 근거 |
| Company Skill의 구조 | 도메인 계약과 완료 조건 |
| `normal → holding → maintenance` 상태 모델 | Maintenance owner와 정지 정책 |
| shared workspace 동시성 원칙 | model, 예산, timeout |
| 설정 검증 순서 | Goal, Project와 단계별 roadmap |

제품 고유 이름, ID, 경로와 도메인 규칙은 Blueprint에 넣지 않는다.

## 개선 루프

```text
실제 Company 관찰
  → Reference 갱신
  → 반복되는 문제만 Blueprint에 반영
  → Company Profile에 적용
  → API와 실제 run으로 검증
```

한 Company에서 한 번 발생한 문제는 우선 reference drift다. 두 번째 Company에서도 필요한 규칙임이 확인될 때 범용 Blueprint로 올린다.
