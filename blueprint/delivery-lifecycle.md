# Delivery Lifecycle

5개 실행 Role을 Paperclip의 Task tree, label, Operation Control review와 workspace 제약에 맞게 연결하는 표준 계약이다. Goal과 Milestone 승인 경계는 [Goal → Milestone → Task Workflow](goal-milestone-task-workflow.md)에 정의한다.

## Task 표현

Paperclip에 임의의 Task 필드는 추가하지 않는다. 다음 기본 기능을 사용한다.

| 계약 | Paperclip 표현 |
|---|---|
| Delivery Role | `role:prototyper`, `role:builder`, `role:sweeper`, `role:grower`, `role:maintainer` label 중 하나 |
| 실행 담당 | `assigneeAgentId` 한 명 |
| 부모-자식 | Issue child relation, `blockParentUntilDone: true` |
| sibling 순서 | `blockedByIssueIds`; 기본은 직렬 실행 |
| 목적과 Gate | Task description의 `Delivery Contract` 절 |
| 독립 검토 | Operation Control의 `review-node`, 작성자와 다른 reviewer |
| 고위험 승인 | Company가 별도로 구성한 native `executionPolicy`의 Board `approval` stage |
| 작업공간 | Project 기본 policy 또는 Task `executionWorkspaceSettings` |
| 산출물 | comment, Issue Document, attachment, work product |
| Git 전달 | Task 전용 commit과 현재 Task branch의 pushed remote ref |

Root와 Node Task는 완료 전에 child를 모두 terminal로 만들고, 담당자가 결과를 취합해 부모 review를 요청한다. Git workspace를 수정한 실행 Agent는 검증을 통과한 Task 전용 commit을 현재 Task branch의 remote ref에 push한 뒤 review를 요청한다. Root 담당자는 `docs/milestones/<milestone-id>.md`를 Git에 commit하고 같은 branch를 push한 뒤 Product Steward에게 full commit SHA와 remote ref를 넘긴다. 거절 시 완료된 child를 재오픈하지 않고 실패 기준만 다루는 보완 child를 같은 부모 아래 추가한다.

Milestone 보고서가 자기 commit SHA를 본문에 포함하도록 요구하지 않는다. 보고서를 포함한 commit의 full SHA는 Product Steward가 Operation Control 요청 파라미터로 별도 제출한다.

현재 공개 Plugin SDK는 Issue의 native `executionPolicy`를 생성·변경할 수 없다. 따라서 Operation Control을 적용한 Company의 강제 경로는 `create-child-task`와 `review-node`이며, native review·approval stage는 Company 설정에서 별도로 실제 적용하고 검증한 경우에만 추가 Gate로 간주한다.

사람의 요청은 Goal로 등록한다. 확인된 Milestone의 필수 작업만 active Task tree의 `todo`가 되며, 선택 작업은 tree 밖의 `backlog`로 두고 Goal, 기대 가치, 선택인 이유와 폐기 조건을 기록한다. Backlog 승격은 Product Steward, 근거가 있는 취소는 Sweeper가 담당한다.

`todo` Task description은 최소한 다음 내용을 가진다.

```markdown
## Delivery Contract

- Role: Builder
- Objective: 검증할 결과
- Entry gate: 시작에 필요한 근거
- Exit gate: 완료를 판정할 조건
- Evidence: 남겨야 할 자료
- Next: Grower | Maintainer | Sweeper | Cancel
```

## 전환

```text
Board intent
    ↓
Product Steward
    ↓
Prototyper ── kill ──> Cancel
    │ keep
    ↓
Builder ─────────────> Grower 또는 Maintainer
  ↑  │                    │
  │  └──> Sweeper <───────┘
  └──────── Grower 또는 Maintainer의 제품 변경 요청
```

Sweeper는 모든 단계에서 개입할 수 있다.

| 전환 | 필수 Gate | 기본 reviewer |
|---|---|---|
| Prototyper → Builder | 비교 가능한 후보, keep 이유, 폐기 대안 | Product Steward |
| Builder → Grower | 테스트를 통과한 제품 단면과 측정 지점 | Sweeper |
| Builder → Maintainer | 운영 기준, 관측 가능성, 복구 방법 | Maintainer |
| Grower → Builder | baseline과 사용자·eval 근거가 있는 변경 요구 | Product Steward |
| Grower → Sweeper | 낮은 사용률 또는 복잡성 증가 근거 | Product Steward |
| Sweeper → Maintainer | 축소 전후 차이와 회귀 없음 | Maintainer |
| Maintainer → Builder | 장애·성능·보안 근거와 제품 변경 필요성 | Product Steward |

## Workspace

- 기본은 `shared_workspace`이며 writer 하나만 실행한다.
- Git 기준점이 있고 Paperclip isolated workspace 기능이 활성화된 Project만 `isolated_workspace`와 `git_worktree`를 사용한다.
- Milestone 완료 확인은 Git 기준점과 full commit SHA가 없으면 요청하지 않는다.
- 격리 조건을 충족하지 못한 Prototype은 제품 파일이 아니라 Artifact로 만든다.
- Product Steward는 workspace 상태를 확인하지 않고 병렬 writer를 배정하지 않는다.

## Actor와 인증 경계

- Agent는 Paperclip이 주입한 자기 bearer, API key와 run context로만 API를 호출한다.
- 401 또는 403은 권한 blocker다. 더 넓은 권한을 얻기 위해 인증 header를 제거·교체하거나 local-trusted 배포의 무인증 Board 경로로 재시도하지 않는다.
- Board 전용 action, Company·Agent 관리와 사람 confirmation은 인증된 인간이 직접 수행한다. Agent가 같은 host의 unauthenticated API, 저장된 Board credential 또는 테스트 helper로 인간 actor를 대신하지 않는다.
- Board actor가 필요한 disposable system test는 Board가 실행해 evidence를 제공하거나, Agent actor를 유지하는 제한된 harness를 별도 설계한다. Agent에게 Board credential을 주입해 테스트를 통과시키지 않는다.
- evidence에는 사용한 actor type과 권한 경계를 기록한다. actor 경계를 바꾸어야만 Exit gate를 충족할 수 있으면 결과를 만들지 않고 Milestone 범위·설계 판단을 요청한다.

## Git 전달

Git workspace를 수정하는 실행 Task는 다음 계약을 따른다. read-only 조사, Backlog Sweep과 workspace를 수정하지 않는 Routine에는 적용하지 않는다.

1. 시작 전에 현재 branch, upstream, remote와 working tree를 확인한다. detached HEAD, 대상 remote·branch 불명확 또는 Task 파일과 겹치는 관련 없는 변경은 blocker다.
2. 사용자와 다른 Agent의 변경을 보존하고 자기 Task 파일만 명시적으로 stage한다. `git add .`, secret commit, 다른 Task branch 전환과 다른 사람의 history 재작성은 금지한다.
3. Exit gate의 검증을 통과한 뒤 한 Task 범위의 focused commit을 만든다. commit 전 staged diff를 다시 확인한다.
4. 현재 Task branch의 configured upstream으로 push한다. upstream이 없고 `origin`이 명확하면 현재 branch에 upstream을 설정해 push할 수 있다.
5. force push는 하지 않는다. 인증·권한·branch protection·non-fast-forward 때문에 push가 실패하면 임의 merge, rebase 또는 reset으로 우회하지 않고 local full commit SHA와 원본 오류를 blocker로 보고한다.
6. review 근거에는 branch, full commit SHA, pushed remote/ref, 검증 명령과 결과를 기록한다. push가 확인되지 않은 변경은 완료 또는 review-ready로 보고하지 않는다.

## Agent 증감

- 표준은 모든 Role을 정의하고 reference Company는 각 Role Agent를 한 명 이상 둔다.
- Agent를 늘릴 때는 독립 backlog, 예산, review 경로와 workspace 격리를 먼저 확인한다.
- 같은 Role의 Agent가 여러 명이면 이름은 Company Profile이 정하되 title에 표준 Role을 유지한다.
- Agent 축소는 실행 중인 Task와 review 책임을 다른 Agent에게 이관한 뒤 수행한다.
