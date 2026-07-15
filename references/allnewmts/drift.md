# AllNewMTS Drift

| 우선순위 | 현재 | Blueprint와의 차이 |
|---|---|---|
| P1 | AllNewMTS Git 저장소에 `HEAD`가 없음 | `allowIssueOverride`는 켰지만 Prototyper의 `isolated_workspace` 코딩과 Git Milestone 보고서는 baseline commit 전까지 사용할 수 없음 |
| P1 | 정기 Routine이 없음 | Sweeper·Grower·Maintainer의 주기 점검은 Task로 요청해야 하며 자동 주기는 아직 없음 |
| P2 | 모든 Agent가 `dangerouslyBypassApprovalsAndSandbox: true` | 로컬 trusted Company라는 신뢰 경계를 문서로 유지하고 외부 입력 Company에는 재사용하지 않아야 함 |

역할 enum, 보고선, 권한, Board 채용 승인, role label, review/approval stage와 workspace override는 현재 Blueprint에 맞게 적용됐다.
