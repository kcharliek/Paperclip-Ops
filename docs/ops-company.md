# Paperclip Ops Company

Paperclip Ops Company는 Blueprint, Operation Control Plugin과 Company Profile을 제품으로 관리한다. 소비 Company의 제품 코드는 수정하지 않는다.

## 조직

```text
Board
└── Ops Steward
    ├── Builder
    ├── Sweeper (default reviewer)
    ├── Maintainer
    └── System Auditor
```

Ops Steward가 Goal을 native Task로 분해하고 Builder·Maintainer가 실행하며 Sweeper가 원래 Task의 native review stage에서 판정한다. 모든 Role을 매번 거치지 않는다.

## 자체개선 흐름

```text
관측 또는 인간 Goal
  → Ops Steward 자동 분해
  → Builder/Maintainer 구현
  → Sweeper native review
  → 결정적 unit/system 검증
  → reversible 변경 자동 완료
  → 설치·권한·production 영향만 human approval
```

System Improvement Review는 주 1회와 incident 후에 최대 3개 backlog 후보만 만든다. Company Integrity Check는 알려진 운영 계약을 read-only로 확인한다. 둘 다 직접 수정하지 않는다.

## 인간에게 올리는 조건

- Plugin capability 추가, production 설치 또는 rollback처럼 운영 영향이 큰 변경
- 인증·권한·secret 경계 변경
- scope·예산 변경
- 같은 acceptance 실패 두 번과 Product Steward 전략 변경 후에도 해결되지 않은 문제

일반 Blueprint 문구, 결정적 테스트와 되돌릴 수 있는 Plugin 구현은 Agent review 통과 뒤 자동 완료한다.

## Backlog 분류

| Label | 의미 |
|---|---|
| `blueprint` | 둘 이상의 Company에 적용할 계약 후보 |
| `plugin` | Operation Control 기능 후보 |
| `local-profile` | 한 Company에만 필요한 설정 |
| `paperclip-gap` | 공식 Paperclip 지원이 필요한 제약 |

Backlog는 active Goal tree 밖에 둔다. Product Steward가 새 Goal scope에 포함할 때만 실행한다.
