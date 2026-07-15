# Delivery Lifecycle

5개 실행 Role을 Paperclip의 Task tree, label, execution policy와 workspace 제약에 맞게 연결하는 표준 계약이다. Goal과 Milestone 승인 경계는 [Goal → Milestone → Task Workflow](goal-milestone-task-workflow.md)에 정의한다.

## Task 표현

Paperclip에 임의의 Task 필드는 추가하지 않는다. 다음 기본 기능을 사용한다.

| 계약 | Paperclip 표현 |
|---|---|
| Delivery Role | `role:prototyper`, `role:builder`, `role:sweeper`, `role:grower`, `role:maintainer` label 중 하나 |
| 실행 담당 | `assigneeAgentId` 한 명 |
| 부모-자식 | Issue child relation, `blockParentUntilDone: true` |
| sibling 순서 | `blockedByIssueIds`; 기본은 직렬 실행 |
| 목적과 Gate | Task description의 `Delivery Contract` 절 |
| 독립 검토 | `executionPolicy`의 `review` stage |
| 고위험 승인 | review 뒤 `approval` stage, Board participant |
| 작업공간 | Project 기본 policy 또는 Task `executionWorkspaceSettings` |
| 산출물 | comment, Issue Document, attachment, work product |

Root와 Node Task는 완료 전에 child를 모두 terminal로 만들고, 담당자가 결과를 취합해 부모 review를 요청한다. Root 담당자는 `docs/milestones/<milestone-id>.md`를 Git에 commit하고 Product Steward에게 full commit SHA를 넘긴다. 거절 시 완료된 child를 재오픈하지 않고 실패 기준만 다루는 보완 child를 같은 부모 아래 추가한다.

Task description은 최소한 다음 내용을 가진다.

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

## Agent 증감

- 표준은 모든 Role을 정의하고 reference Company는 각 Role Agent를 한 명 이상 둔다.
- Agent를 늘릴 때는 독립 backlog, 예산, review 경로와 workspace 격리를 먼저 확인한다.
- 같은 Role의 Agent가 여러 명이면 이름은 Company Profile이 정하되 title에 표준 Role을 유지한다.
- Agent 축소는 실행 중인 Task와 review 책임을 다른 Agent에게 이관한 뒤 수행한다.
