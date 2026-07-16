# AllNewMTS Drift

| 우선순위 | 현재 | Blueprint와의 차이 |
|---|---|---|
| P1 | 기존 Team Goal과 `ALL-*` Task tree는 delivery-control 도입 전에 만들어짐 | Company Goal만 `goal_registered`로 채택했다. 기존 tree를 소급 신뢰하지 않고 다음 Milestone부터 plugin 경로로 새 Root를 만들어야 함 |
| P1 | AllNewMTS baseline commit은 로컬에만 있고 remote가 없음 | 로컬 rollback 기준점은 생겼지만 장비 손실에 대한 off-machine 복구는 아직 불가능함 |
| P1 | Milestone report는 경로 규칙과 full SHA 형식만 plugin이 검사 | 해당 commit과 보고서 파일이 실제 제품 Git 저장소에 존재하는지는 아직 Product Steward와 Board 검토에 의존함 |
| P1 | Issue/Goal guard는 SDK event 뒤에 취소·복구하는 post-event 방식 | 잘못된 직접 쓰기를 동기적으로 거부하지 못한다. Paperclip SDK에 write-veto가 생기기 전까지 plugin action/tool만 권위 경로로 사용해야 함 |
| P1 | Paperclip 상태 DB의 자동 backup·restore drill과 RPO/RTO가 없음 | 제품 Git rollback과 별개로 Company·Issue·plugin state 자체의 장비 장애 복구가 보장되지 않음 |
| P2 | 모든 Agent가 `dangerouslyBypassApprovalsAndSandbox: true` | 로컬 trusted Company라는 신뢰 경계를 문서로 유지하고 외부 입력 Company에는 재사용하지 않아야 함 |
| P2 | `Backlog Sweep` Routine은 schedule/phase trigger 없이 수동 실행 | Milestone 전후 정리 시점은 Product Steward instruction에 의존함 |
| P2 | 같은 완료 기준 두 번 거절 시 중단 규칙은 문서에만 있음 | plugin은 rejection count를 기록하지만 criterion별 자동 중단과 Board escalation을 강제하지 않음 |
| P2 | 예산은 `billed_cents` 중심이고 현재 구독 실행비가 0으로 기록됨 | token/run 폭증을 금액 예산만으로 차단하지 못하므로 별도 run·token 상한이 필요함 |

역할 enum, 보고선, 권한, Board 채용 승인, role label, review/approval stage, workspace override와 인간 Milestone gate는 현재 Blueprint에 맞게 적용됐다.
