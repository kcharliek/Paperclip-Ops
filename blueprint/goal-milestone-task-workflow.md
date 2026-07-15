# Goal → Milestone → Task Workflow

사람은 방향과 인수만 결정하고, Agent는 승인된 Milestone을 실행 가능한 Task tree로 만든다. 승인 경계는 두 곳뿐이다.

1. 사람은 Goal을 등록한다.
2. Product Steward가 Goal을 바탕으로 Milestone 초안을 만들고 사람에게 확인을 요청한다.
3. 사람이 Milestone을 확인하면 Agent가 Root Task를 만들고 실행을 시작한다.
4. Leaf Task가 끝나면 상위 Node Task 담당자가 확인한다.
5. Root Task 담당자가 완료 근거를 `docs/milestones/<milestone-id>.md`에 기록해 Git에 commit한다.
6. Product Steward가 보고서와 commit SHA를 확인하고 Paperclip confirm request로 사람에게 최종 확인을 요청한다.

## 상태와 권한

| 대상 | 상태 흐름 | 변경 권한 |
|---|---|---|
| Goal | `active` → `completed` | 사람만 등록·완료 확정 |
| Milestone | `draft` → `awaiting_confirmation` → `confirmed` → `in_progress` → `awaiting_confirmation` → `completed` | Product Steward가 제안·진행, 사람만 확인·거절 |
| Node Task | `todo` → `in_progress` → `in_review` → `done` | 담당 Agent가 실행·제출, 상위 담당자가 확인 |
| Leaf Task | `todo` → `in_progress` → `done` | 실행 Agent가 실행, 상위 Node 담당자가 확인 |

`reject`는 완료된 결과를 지우거나 무작정 재실행하는 상태가 아니다. 거절 사유와 기대 결과를 기록하고, 실패한 Node 아래에 보완 child Task를 추가한 뒤 같은 Node를 다시 review한다.

## Task tree 규칙

- Milestone마다 Product Steward가 하나 이상의 Root Task를 만든다.
- Root Task는 Milestone의 완료 기준과 담당 Agent를 가진다.
- 담당 Agent는 자신이 맡은 Node가 한 heartbeat로 끝나지 않으면 2~5개의 child Task로 쪼갠다.
- child는 부모의 Goal, Project, workspace를 상속하고 독립적인 완료 기준과 검증 방법을 가진다.
- 부모는 모든 child가 terminal이 될 때까지 완료되지 않는다. Paperclip child 생성 시 `blockParentUntilDone: true`를 사용한다.
- 같은 담당 Agent의 sibling은 `blockedByIssueIds`로 직렬화한다. 서로 다른 Agent가 안전하게 작업할 때만 병렬 실행한다.
- Leaf에는 기본 Reviewer를 두지 않는다. 상위 Node 담당자가 leaf 산출물, 검증 결과와 완료 기준을 확인한다.
- Node 담당자가 해당 child의 작성자이기도 하면 자기 결과를 승인하지 않고 별도 reviewer를 둔다.

## 실행 순서

```text
Human Goal
   ↓
Product Steward Milestone draft
   ↓ human confirm
Milestone confirmed
   ↓
Root Task
   ├─ Node A
   │   ├─ Leaf A1 → parent owner confirm
   │   └─ Leaf A2 → parent owner confirm
   │       └─ all terminal → Node A review
   └─ Node B (A done 후 시작; 안전한 경우에만 병렬)
       └─ all sibling nodes done → Root review
              ↓
        Git Milestone report
              ↓ Paperclip confirm / reject
```

Node review 또는 Root review가 거절되면 다음만 수행한다.

1. reviewer가 불충족 기준, 확인 근거와 기대 결과를 댓글로 남긴다.
2. 담당 Agent가 완료된 child를 다시 열지 않고 실패 항목만 다루는 1~3개의 보완 child를 같은 부모 아래 만든다.
3. 보완 child가 끝나면 같은 부모를 같은 reviewer에게 다시 제출한다.
4. 같은 완료 기준이 두 번 거절되면 자동 분해를 멈추고 Product Steward가 범위·설계 판단을 사람에게 올린다.

Milestone 최종 확인이 거절되면 Product Steward가 거절 사유를 Root 또는 해당 Node에 연결하고, 그 아래에 보완 child를 만들어 다시 실행한다. Goal이나 Milestone 범위가 바뀌면 새 Milestone 확인을 먼저 받아야 한다.

## Paperclip 표현

임의의 Task 필드를 추가하지 않고 기존 Issue/Task, Goal, Project, comment와 execution policy를 사용한다.

| 워크플로우 의미 | Paperclip 표현 |
|---|---|
| Goal / Milestone 연결 | Task의 기존 `goalId`, `projectId`와 Milestone 기록 |
| 부모-자식 | `POST /api/issues/{parentId}/children` |
| 부모 완료 대기 | `blockParentUntilDone: true` |
| sibling 순서 | `blockedByIssueIds` |
| leaf 확인 | 부모 담당자의 완료 comment와 evidence |
| Node/Root review | 부모 Task의 `executionPolicy` `review` stage |
| 인간 Milestone 확인 | Root Task의 `request_confirmation`, 대상 revision은 보고서 Git commit SHA |
| 거절 재진입 | 기존 child 재오픈 대신 보완 child 생성 |

## Milestone 완료 보고

Root 담당 Agent는 Root review 전에 제품 저장소의 `docs/milestones/<milestone-id>.md`를 commit한다. 보고서는 다음만 포함한다.

```markdown
# <Milestone title>

- Milestone: <milestone id>
- Git commit: <full commit SHA>
- 완료 결과: <완료 기준별 결과>
- 검증: <명령과 결과>
- 영향 범위: <변경된 사용자·시스템 범위>
- 남은 위험: <없으면 없음>
- 롤백: <복구 방법>
```

Git Markdown이 원본이다. Paperclip confirm request는 같은 내용을 별도 편집하지 않고 요약, 파일 경로와 full commit SHA를 표시한다. Product Steward는 보고서를 직접 작성하거나 제품 workspace를 수정하지 않고 commit에 포함됐는지만 확인한다. Confirm이 거절되면 기존 보고서를 덮어쓰지 않고 보완 commit을 만든 뒤 새 SHA로 다시 요청한다.

Task description에는 최소한 다음을 기록한다.

```markdown
## Delivery Contract

- Goal: <goal id>
- Milestone: <milestone id>
- Parent: <parent task id or root>
- Objective: <한 가지 결과>
- Entry gate: <시작 조건>
- Exit gate: <완료 조건>
- Evidence: <검증 결과와 산출물>
- Reviewer: <상위 Node 담당자 또는 별도 reviewer>
```

## 책임 경계

- 사람: Goal 등록, Milestone 확인·거절, 범위·예산·고위험 결정, 최종 방향.
- Product Steward: Milestone 초안, Root Task 생성, 실행 Agent 배정, tree 진행 조정, Git 보고서 확인과 Paperclip confirm request.
- Node 담당 Agent: child 분해, leaf 실행 확인, Node review 제출, 거절된 Node의 보완 child 생성.
- 실행 Agent: 할당된 leaf 또는 child 하나를 수행하고 evidence를 남긴다. Root 담당자는 Milestone 완료 보고서를 commit한다. Goal, Milestone 상태와 sibling 범위를 바꾸지 않는다.

실행 Agent가 직접 child를 만들 수 없는 Paperclip 권한 구성에서는 Product Steward가 해당 Agent의 분해안을 받아 child 생성만 대행한다. 이 예외는 흐름을 바꾸지 않는다.
