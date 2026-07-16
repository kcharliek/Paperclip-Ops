# AllNewMTS Drift

| 우선순위 | 현재 | Blueprint와의 차이 |
|---|---|---|
| P1 | 기존 Team Goal과 `ALL-1..28` Task tree는 delivery-control 도입 전에 만들어졌고 native `executionPolicy`가 0개임 | 기존 tree와 문서상 review stage를 소급 신뢰하지 않는다. 현재 controlled draft `54fdb930-9921-4592-b397-9381a4946ad6`가 사람 확인을 받으면 plugin 경로로 Root 하나와 Node tree를 새로 만들어야 함 |
| P1 | AllNewMTS baseline commit은 로컬에만 있고 remote가 없음 | 로컬 rollback 기준점은 생겼지만 장비 손실에 대한 off-machine 복구는 아직 불가능함 |
| P1 | Issue/Goal guard는 SDK event 뒤에 취소·복구하는 post-event 방식 | 잘못된 직접 쓰기를 동기적으로 거부하지 못한다. Paperclip SDK에 write-veto가 생기기 전까지 plugin action/tool만 권위 경로로 사용해야 함 |
| P1 | Delivery state 전이와 orchestration Issue 생성·wakeup은 Plugin SDK의 단일 transaction이 아님 | live 정상 경로와 idempotent origin은 확인했지만 중간 API 실패를 주입한 복구 시험은 없다. 부분 실패 시 Board가 plugin state와 orchestration Issue를 함께 확인하고 미실행 Issue를 수동 wake해야 할 수 있음 |
| P1 | Paperclip 공식 자동 DB backup은 60분 주기·health `ok`이고 수동 backup 무결성도 확인했지만, 공개 restore API/CLI와 off-machine 보관은 없음 | RPO 목표는 60분으로 좁혀졌지만 장비 장애 복구와 RTO는 검증할 수 없음. 내부 DB restore 함수나 별도 backup daemon으로 우회하지 않고 공식 restore 표면이 생길 때까지 유지 |
| P1 | Paperclip `upgrade`는 새 plugin capability 승인을 처리하지 못했던 이력이 있음 | capability가 같은 0.6.0 upgrade는 성공했다. active Milestone 이후 capability 확장에는 여전히 안전한 공식 migration 경로가 필요함 |
| P2 | 모든 Agent가 `dangerouslyBypassApprovalsAndSandbox: true` | 로컬 trusted Company라는 신뢰 경계를 문서로 유지하고 외부 입력 Company에는 재사용하지 않아야 함 |
| P2 | `Backlog Sweep`에 매주 월요일 09:30 KST schedule을 등록했지만 첫 실행은 아직 관측 전 | 공식 scheduler의 `nextRunAt`은 2026-07-20 09:30 KST로 확인했다. 첫 실행 후 normal-mode no-op, 최대 10개 제한과 결과 기록을 재확인해야 함 |
| P2 | Product Steward는 Sweeper 소유 `Backlog Sweep` Routine을 직접 실행할 수 없고 live 시도는 403이었음 | Milestone 초안에는 실행 필요성만 표시하고 Board 또는 Routine owner가 별도 실행해야 한다. 자동 pre-confirmation sweep이 필요하면 공개 Routine 권한 또는 plugin 연결 기능이 필요함 |
| P2 | `Company Integrity Check` 수동 실행은 성공했지만 첫 schedule 실행은 아직 관측 전이고, `codex_local`이 Routine env를 실행 환경에 전달하지 않음 | 현재 AllNewMTS Profile은 Operation Control instance ID를 Routine description에 직접 바인딩했다. 2026-07-16 18:00 KST 첫 schedule 뒤 `integrity: healthy`와 실행 비용을 재확인해야 함 |
| P2 | 시간당 Company run 20회 hard cap은 plugin으로 강제하지만 Paperclip event에 token 수가 없음. 2026-07-16 Product Steward run input은 1,388,524 → 458,182 → 308,524였음 | 호출 지침과 이전 draft 전달로 비용은 줄었지만 한 run 내부 token 폭증은 차단하지 못함. 외부 계측기를 추가하지 않고 공식 token usage event를 기다림 |

역할 enum, 보고선, Board 채용 승인, role label, workspace override, 제한된 plugin child 경로와 인간 Milestone gate는 현재 Blueprint에 맞게 적용됐다. Native review/approval stage는 현재 적용값이 아니며 plugin `review-node`가 다음 controlled tree의 강제 경로다.

이 표의 미해결 항목은 외부 제어 시스템을 추가해도 된다는 뜻이 아니다. Paperclip 공식 기능으로 해결하고, 부족할 때만 공개 Plugin SDK 안에서 보완한다. 두 경로 모두 지원하지 않는 항목은 drift로 유지한다. 특히 Core 상태 DB restore·off-machine 복제와 동기 write-veto는 별도 daemon이나 DB 직접 쓰기로 구현하지 않는다.
