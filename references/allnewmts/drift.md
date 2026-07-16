# AllNewMTS Drift

| 우선순위 | 현재 | Blueprint와의 차이 |
|---|---|---|
| P1 | 기존 Team Goal과 `ALL-1..28` Task tree는 delivery-control 도입 전에 만들어졌고 native `executionPolicy`가 0개임 | 기존 tree와 문서상 review stage를 소급 신뢰하지 않는다. 현재 controlled draft `54fdb930-9921-4592-b397-9381a4946ad6`가 사람 확인을 받으면 plugin 경로로 Root 하나와 Node tree를 새로 만들어야 함. Ops Backlog `PAP-5`가 추적 |
| P1 | AllNewMTS baseline commit은 로컬에만 있고 remote가 없음 | 로컬 rollback 기준점은 생겼지만 장비 손실에 대한 off-machine 복구는 아직 불가능함. Ops Backlog `PAP-6`가 추적 |
| P1 | Issue/Goal guard는 SDK event 뒤에 취소·복구하는 post-event 방식 | 잘못된 직접 쓰기를 동기적으로 거부하지 못한다. Paperclip SDK에 write-veto가 생기기 전까지 plugin action/tool만 권위 경로로 사용해야 함. Ops Backlog `PAP-7`이 추적 |
| P1 | Delivery state 전이와 orchestration Issue 생성·wakeup은 Plugin SDK의 단일 transaction이 아님 | 0.6.2에서 Issue create 실패 뒤 누락 Task 재생성, wakeup 실패 뒤 기존 Task 재-wake, 종료된 이전 recovery 뒤 새 recovery 생성을 실패 주입 test로 확인했다. live `human_gate` no-op도 재확인했지만 누락 Task live 복구 시험은 아직 없음. Ops Backlog `PAP-4`가 추적 |
| P1 | Paperclip 공식 자동 DB backup은 60분 주기·health `ok`이고 수동 backup 무결성도 확인했지만, 공개 restore API/CLI와 off-machine 보관은 없음 | RPO 목표는 60분으로 좁혀졌지만 장비 장애 복구와 RTO는 검증할 수 없음. 내부 DB restore 함수나 별도 backup daemon으로 우회하지 않고 공식 restore 표면이 생길 때까지 유지. Ops Backlog `PAP-3`가 추적 |
| P1 | Paperclip `upgrade`는 새 plugin capability 승인을 처리하지 못했던 이력이 있음 | capability가 같은 0.6.2 upgrade는 성공했다. active Milestone 이후 capability 확장에는 여전히 안전한 공식 migration 경로가 필요함. Ops Backlog `PAP-8`이 추적 |
| P2 | 모든 Agent가 `dangerouslyBypassApprovalsAndSandbox: true` | 로컬 trusted Company라는 신뢰 경계를 문서로 유지하고 외부 입력 Company에는 재사용하지 않아야 함. Ops Backlog `PAP-9`가 추적 |
| P2 | `Backlog Sweep`의 manual revision 5는 최대 10개·normal 확인·결과 기록·interaction 없는 완료를 통과했지만 첫 schedule 실행은 아직 관측 전 | 공식 scheduler의 `nextRunAt`은 2026-07-20 09:30 KST다. schedule 경로가 같은 revision을 실제 dispatch하는지 첫 실행 뒤 재확인해야 함. Ops Backlog `PAP-10`이 추적 |
| P2 | Product Steward는 Sweeper 소유 Routine을 직접 실행할 수 없고, Sweeper도 다른 Agent 소유 Backlog를 직접 취소할 수 없음 | revision 4에서 미확정 Milestone을 완료 근거로 오판한 취소 시도가 native 권한에 차단돼 실제 변경은 없었다. revision 5는 권한 거부와 불확실한 항목을 Product Steward 분류 요청으로 전환하지만 autonomous cancellation은 아직 불가능함. Ops Backlog `PAP-11`이 추적 |
| P2 | `Company Integrity Check` 첫 schedule은 `ALL-35`로 실행됐지만 Operation Control inspect가 두 번 `No worker registered`를 반환해 `integrity: degraded`였고, `codex_local`은 Routine env를 실행 환경에 전달하지 않음 | health/backup, org chain, Routine과 timeout run은 정상이었고 worker는 이후 다시 응답했다. worker 가용성은 `PAP-15`, env 전달은 `PAP-12`, 남은 Backlog Sweep schedule 관측은 `PAP-10`이 추적 |
| P2 | 시간당 Company run 20회 hard cap은 plugin으로 강제하지만 Paperclip event에 token 수가 없음. Product Steward input은 1,388,524 → 458,182 → 308,524였고 Backlog Sweep 검증도 911,510 / 299,805 / 322,570이었음 | 역할 지침이 검색을 금지해도 상위 Codex memory 지침이 시작 시 관리 메모리·Company 파일 검색을 유발했다. prompt만으로 검색이나 한 run 내부 token 폭증을 강제 차단할 수 없어 공식 usage event와 runtime-level context 정책이 필요함. Ops Backlog `PAP-2`가 추적 |

역할 enum, 보고선, Board 채용 승인, role label, workspace override, 제한된 plugin child 경로와 인간 Milestone gate는 현재 Blueprint에 맞게 적용됐다. Native review/approval stage는 현재 적용값이 아니며 plugin `review-node`가 다음 controlled tree의 강제 경로다.

이 표의 미해결 항목은 외부 제어 시스템을 추가해도 된다는 뜻이 아니다. Paperclip 공식 기능으로 해결하고, 부족할 때만 공개 Plugin SDK 안에서 보완한다. 두 경로 모두 지원하지 않는 항목은 drift로 유지한다. 특히 Core 상태 DB restore·off-machine 복제와 동기 write-veto는 별도 daemon이나 DB 직접 쓰기로 구현하지 않는다.
