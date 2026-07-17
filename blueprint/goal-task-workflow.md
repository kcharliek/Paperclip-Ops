# Goal → Autonomous Task Workflow

인간은 Goal과 자율 실행 범위를 정한다. AI는 그 범위 안에서 계획, Task 분해, 구현, review와 보완을 멈추지 않고 진행한다.

## 유일한 기본 경로

```text
Human Goal + autonomy envelope
  → Product Steward 자동 배정
  → native Root/child Tasks
  → executor 구현·검증
  → native Agent review
  → 승인 또는 자동 보완
  → Goal 완료 보고
```

별도 Milestone entity, plugin delivery phase, Git Milestone 보고서와 단계별 인간 확인을 만들지 않는다. 계획은 Root Task description 또는 `plan` Issue Document이고 실행 상태의 원본은 Paperclip Issue다.

## Autonomy envelope

Goal에는 다음만 명시한다.

- Objective: 달성할 사용자·운영 결과
- Allowed scope: 수정 가능한 제품, 저장소, 환경과 외부 시스템
- Forbidden actions: 삭제, production 적용, 외부 전송 등 금지 또는 승인 대상
- Budget: 시간, run, 비용 또는 반복 상한
- Acceptance: 완료를 판정할 결정적 검사와 사용자 기준

누락된 세부 구현은 Product Steward가 현재 제품 근거로 결정한다. 목표·허용 범위·금지사항·비용 상한을 바꾸는 판단만 인간에게 올린다.

## Task tree

- Goal당 Product Steward 소유 Root Task 하나를 둔다.
- Root가 한 run에 끝나지 않을 때만 2~5개의 독립 child로 나눈다.
- 같은 writable workspace의 writer만 `blockedByIssueIds`로 직렬화한다. 읽기와 격리 workspace 작업은 안전하면 병렬화한다.
- child는 Objective, Scope, Verify, Risk 네 항목만 가진다. 긴 Entry/Exit/Evidence/Next 서식을 반복하지 않는다.
- 코드 또는 사용자 산출물 Task는 native `executionPolicy`의 Agent `review` stage를 가진다.
- parent/child, blocker, review, approval와 wake 상태의 원본은 Paperclip이다. Plugin state에 복제하지 않는다.

## Review와 보완

executor는 검증 뒤 같은 Task를 `in_review`로 바꾼다. Paperclip이 `executionState.currentParticipant`의 reviewer를 깨운다.

- 승인: reviewer가 근거 comment와 함께 `done`으로 바꾼다.
- 수정 요청: reviewer가 불충족 기준 하나씩을 comment로 남기고 `in_progress`로 돌린다.
- executor는 같은 Task와 session에서 실패 기준만 보완한 뒤 다시 `in_review`로 보낸다.
- 같은 acceptance 기준을 두 번 실패하면 Product Steward가 방법이나 담당자를 한 번 바꾼다.
- 그래도 해결되지 않거나 envelope 변경이 필요하면 정확한 선택지와 근거를 인간에게 요청한다.

완료된 child를 재현하기 위한 recovery Task, review bridge Task 또는 별도 evidence 검토 Task를 만들지 않는다.

## 인간 개입 조건

다음 중 하나일 때만 human approval 또는 질문을 만든다.

- production 배포, 비가역적 데이터 변경 또는 대규모 삭제
- 외부 사용자·고객·공급자에게 메시지나 데이터를 전송
- 권한, 인증, secret, 결제, 법무 또는 규제 경계를 변경
- Goal의 허용 범위·금지사항·예산을 바꿔야 함
- AI review와 전략 변경 후에도 같은 acceptance 기준을 충족하지 못함

고위험 행동 전까지의 조사, 구현, 테스트와 Agent review는 자동으로 완료해 둔다. 인간은 승인 가능한 결과와 정확한 영향만 판단한다.

## Backlog

현재 Goal의 acceptance에 필요하지 않은 발견은 active tree 밖 `backlog`로 남긴다. Product Steward는 새 Goal의 범위에 들어갈 때만 `todo`로 승격한다. Routine은 중복과 이미 충족된 항목만 정리하고 제품을 수정하지 않는다.
