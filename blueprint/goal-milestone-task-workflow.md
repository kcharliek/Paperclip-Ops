# Goal → Milestone → Task Workflow

사람은 방향과 인수만 결정하고, Agent는 승인된 Milestone을 실행 가능한 Task tree로 만든다. 승인 경계는 두 곳뿐이다.

1. 사람은 Goal을 등록한다.
2. Goal 채택 시 Operation Control이 Product Steward에게 orchestration Task를 배정하고 깨운다. Product Steward는 Goal을 바탕으로 필수 범위, 선택 Backlog, Exit gate와 위험을 포함한 Milestone 초안을 만들어 사람에게 확인을 요청한다.
3. 사람은 초안을 확인하거나 변경 사유와 함께 돌려보낸다. 확인하면 Product Steward가 Root Task를 만들고, 돌려보내면 이전 draft를 취소하고 새 orchestration Task에서 수정안을 만든다.
4. Leaf Task가 끝나면 상위 Node Task 담당자가 확인한다.
5. Root Task 담당자가 완료 근거를 `docs/milestones/<milestone-id>.md`에 기록해 Git에 commit한다.
6. Product Steward가 보고서와 commit SHA를 Operation Control에 제출하고, 인증된 Board 사용자가 dashboard에서 직접 최종 확인한다.

## 상태와 권한

| 대상 | 상태 흐름 | 변경 권한 |
|---|---|---|
| Goal | `active` → `completed` | 사람만 등록·완료 확정 |
| Milestone | `draft` → `awaiting_confirmation` → `confirmed` → `in_progress` → `awaiting_confirmation` → `completed`; 초안 변경 요청은 기존 draft를 `cancelled`로 종료하고 새 `draft` 생성 | Product Steward가 제안·진행, 사람만 확인·거절 |
| Backlog Task | `backlog` → `todo` 또는 `cancelled` | Product Steward만 필수 범위로 승격, Sweeper는 근거가 있는 항목만 취소 |
| Node Task | `todo` → `in_progress` → `in_review` → `done` | 담당 Agent가 실행·제출, 상위 담당자가 확인 |
| Leaf Task | `todo` → `in_progress` → `done` | 실행 Agent가 실행, 상위 Node 담당자가 확인 |

`reject`는 완료된 결과를 지우거나 무작정 재실행하는 상태가 아니다. 초안 변경 요청은 사유를 보존하고 새 revision을 만들며, 실행 결과 거절은 실패한 Node 아래에 보완 child Task를 추가한 뒤 같은 Node를 다시 review한다.

사람의 요청은 Task가 아니라 Goal로 등록한다. Milestone 초안에서 Exit gate 달성에 필요한 작업은 확인 뒤 `todo` Task tree로 만들고, 하면 좋지만 없어도 완료 가능한 작업은 `backlog`로 기록한다. Backlog는 active Root/Node의 child가 아니며 Milestone 완료를 막지 않는다.

Product Steward만 Backlog를 `todo`로 승격하고 적절한 부모, Role, 담당자와 Delivery Contract를 붙인다. 확인된 Exit gate 안의 누락 작업은 바로 승격할 수 있지만 범위나 Exit gate가 바뀌면 Milestone을 다시 확인한다. Sweeper는 Backlog를 `todo`로 승격하거나 Goal·Milestone을 바꾸지 않는다.

## Backlog 정리

- Backlog에는 Goal, 기대 가치, 선택인 이유와 폐기 조건을 기록한다.
- `Backlog Sweep` Routine은 관련 Backlog가 있을 때 Milestone 확인 전과 완료 후 실행한다. Product Steward는 필요성을 표시하고, Board 또는 Routine owner가 실행하면 Sweeper에게 정리 Task가 배정된다.
- Sweeper는 한 번에 최대 10개를 확인하고 명백한 중복, `done`으로 완료된 결과, 충족된 폐기 조건만 근거를 댓글로 남긴 뒤 `cancelled`로 바꾼다. planned·active Milestone과 미완료 Task는 완료 근거가 아니다.
- 기존 Task처럼 선택 여부나 폐기 조건이 불명확한 Backlog는 취소하지 않고 Product Steward에게 분류를 요청한다.
- Backlog 쓰기가 Agent 권한 경계에 막히면 취소로 집계하지 않고 Product Steward 분류 요청으로 남기며 Routine 자체는 완료한다.
- Routine이 만든 정리 Task는 active Root/Node의 child로 두지 않고 제품 workspace를 수정하지 않는다.

## Task tree 규칙

- Milestone마다 Product Steward가 Root Task 하나를 만든다. Operation Control의 delivery state와 Git 완료 보고 기준점도 이 Root 하나를 추적한다.
- Root Task는 Milestone 전체 완료 기준과 통합·검토 담당 Agent를 가지며, 서로 다른 실행 범위는 그 아래 2~5개 Node로 나눈다.
- 담당 Agent는 자신이 맡은 Node가 한 heartbeat로 끝나지 않으면 Operation Control의 `create-child-task`로 2~5개의 child Task를 만든다. 일반 Issue child API를 직접 호출하지 않는다.
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
   ↓ human confirm / request changes
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
              ↓ Board dashboard accept / reject
```

Node review 또는 Root review가 거절되면 다음만 수행한다.

1. reviewer가 불충족 기준, 확인 근거와 기대 결과를 댓글로 남긴다.
2. 담당 Agent가 완료된 child를 다시 열지 않고 실패 항목만 다루는 1~3개의 보완 child를 같은 부모 아래 만든다.
3. 보완 child가 끝나면 같은 부모를 같은 reviewer에게 다시 제출한다.
4. Paperclip에 구조화된 완료 기준 ID가 없으므로, 같은 Node 결과가 두 번 거절되면 plugin이 자동 보완 생성을 멈추고 Product Steward가 범위·설계 판단을 사람에게 올린다. 사람의 판단 뒤 기존 Node를 승인하는 복구 경로는 유지한다.

Milestone 최종 확인이 거절되면 Product Steward가 거절 사유를 Root 또는 해당 Node에 연결하고, 그 아래에 보완 child를 만들어 다시 실행한다. Goal이나 Milestone 범위가 바뀌면 새 Milestone 확인을 먼저 받아야 한다.

## Paperclip 표현

임의의 Task 필드를 추가하지 않고 기존 Issue/Task, Goal, Project, comment와 execution policy를 사용한다.

| 워크플로우 의미 | Paperclip 표현 |
|---|---|
| Goal / Milestone 연결 | Task의 기존 `goalId`, `projectId`와 Milestone 기록 |
| 선택 작업 후보 | active Task tree 밖의 `backlog`, `goalId`와 `projectId`로만 연결 |
| 필수 실행 범위 | 확인된 Milestone 아래의 `todo` Task tree |
| 부모-자식 | Operation Control의 `create-child-task`; 내부에서 Paperclip child relation 생성 |
| 부모 완료 대기 | `blockParentUntilDone: true` |
| sibling 순서 | `blockedByIssueIds` |
| leaf 확인 | 부모 담당자의 완료 comment와 evidence |
| Node/Root review | Operation Control의 `review-node`; Company가 별도로 구성한 경우 native `executionPolicy`를 추가 사용 |
| 인간 Milestone 확인 | Operation Control dashboard의 인증된 Board action, 대상 revision은 보고서 Git commit SHA |
| 거절 재진입 | 기존 child 재오픈 대신 보완 child 생성 |
| Backlog 정리 | Sweeper에게 배정된 on-demand `Backlog Sweep` Routine run |

## Milestone 완료 보고

Root 담당 Agent는 Root review 전에 제품 저장소의 `docs/milestones/<milestone-id>.md`를 commit한다. 보고서는 다음만 포함한다.

```markdown
# <Milestone title>

- Milestone: <milestone id>
- 완료 결과: <완료 기준별 결과>
- 검증: <명령과 결과>
- 영향 범위: <변경된 사용자·시스템 범위>
- 남은 위험: <없으면 없음>
- 롤백: <복구 방법>
```

Git Markdown이 원본이다. 보고서가 자기 자신을 포함한 commit SHA를 기록하는 순환 조건은 두지 않는다. Product Steward가 full commit SHA와 보고서 경로를 제출하면 Operation Control은 Paperclip Root execution workspace 또는 Project primary workspace에서 commit 존재, `HEAD` 도달 가능성과 해당 경로 포함 여부를 검증한 뒤 dashboard에 표시한다. Product Steward는 보고서를 직접 작성하거나 제품 workspace를 수정하지 않는다. Board가 거절하면 기존 보고서를 덮어쓰지 않고 보완 commit을 만든 뒤 새 SHA로 다시 요청한다.

Backlog description에는 최소한 다음을 기록한다.

```markdown
## Backlog Candidate

- Goal: <goal id>
- Value: <기대 가치>
- Why optional: <현재 Milestone에 필수가 아닌 이유>
- Discard when: <취소할 수 있는 객관적 조건>
```

`todo` Task description에는 최소한 다음을 기록한다.

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
- Operation Control: Goal 채택·Milestone 확인·최종 완료 뒤 다음 단계 orchestration Task를 만들고 Product Steward를 깨운다. 이 제어 Task는 제품 delivery tree 밖에 둔다.
- Product Steward: 배정된 orchestration Task에서 Milestone 초안, Root Task 생성, 실행 Agent 배정, tree 진행 조정, Git 보고서를 Operation Control에 제출한다. 최종 결정을 대신 기록하지 않는다.
- Node 담당 Agent: child 분해, leaf 실행 확인, Node review 제출, 거절된 Node의 보완 child 생성.
- 실행 Agent: 할당된 leaf 또는 child 하나를 수행하고 evidence를 남긴다. Root 담당자는 Milestone 완료 보고서를 commit한다. Goal, Milestone 상태와 sibling 범위를 바꾸지 않는다.

실행 Agent가 직접 child를 만들 수 없는 Paperclip 권한 구성에서는 Product Steward가 해당 Agent의 분해안을 받아 child 생성만 대행한다. 이 예외는 흐름을 바꾸지 않는다.
