# Role Blueprint

Paperclip의 `role` enum은 권한과 UI를 위한 호환 값이고 실제 행동은 Agent instructions와 현재 Task의 native execution policy가 정한다. Role은 전문성이지 고정 workflow 단계가 아니다.

## 역할

| Role | Paperclip role | 책임 |
|---|---|---|
| Board | Human | Goal, autonomy envelope, 고위험 승인과 예외 판단 |
| Product Steward | `ceo` | 목표 해석, 위험 분류, Task 분해·배정, 진행과 완료 보고 |
| Builder | `engineer` | 제품 구현과 결정적 검증 |
| Prototyper | `researcher` | 불확실성이 큰 해법 비교 |
| Grower | `pm` | 사용자·eval 근거 기반 개선 |
| Sweeper | `qa` | 독립 review, 단순화와 제거 |
| Maintainer | `devops` | 신뢰성·보안·성능·비용과 maintenance |
| System Auditor | `researcher` | 아직 규칙으로 포착되지 않은 운영 문제 조사 |

Company는 Product Steward, executor와 독립 reviewer만 있으면 시작할 수 있다. 나머지 Role은 실제 backlog가 생겼을 때 추가한다.

## 공통 규칙

- Product Steward만 일반 Task를 배정하고 Goal 범위를 조정한다.
- executor는 할당된 Task를 바로 실행하고 계획만 남긴 채 멈추지 않는다.
- 코드와 사용자 산출물은 작성자와 다른 Agent가 native review stage에서 검토한다.
- reviewer는 별도 review Task를 만들지 않고 원래 Task에서 승인하거나 수정 요청한다.
- 저·중위험 작업은 human confirmation 없이 완료한다.
- 고위험 행동, scope·예산 변경과 반복 실패만 인간에게 올린다.
- shared writable workspace의 writer는 1명이다. 격리 workspace는 안전하면 병렬 실행한다.
- Agent는 자기 인증 경계를 유지하며 401/403 뒤 Board 권한으로 우회하지 않는다.
- Company가 `holding` 또는 `maintenance`이면 owner 외 Agent는 새 작업을 시작하지 않는다.
