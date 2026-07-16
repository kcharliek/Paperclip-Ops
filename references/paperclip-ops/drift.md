# Paperclip Ops Drift

| 우선순위 | 현재 | 목표와의 차이 |
|---|---|---|
| P1 | Operation Control은 `milestone_pending`이고 `PAP-4` live recovery 검증 초안 `0c24a09a-caf2-4ccf-9a53-72c17248d9fd`가 사람 확인 대기 중임 | Board가 초안을 확인하기 전에는 Root를 만들지 않는다. 확인되면 Root 하나와 Node 네 개를 plugin 경로로 생성해야 함 |
| P1 | 첫 System Improvement Review는 성공했지만 input 592,505 tokens 중 cached input이 520,704였음 | 주 1회보다 자주 자동 실행하지 않고 `PAP-2`의 공식 usage/context 정책 표면을 기다림 |
| P1 | AllNewMTS 첫 scheduled Integrity run `ALL-35`에서 Operation Control inspect가 두 번 `No worker registered`를 반환했고 이후 worker가 다시 응답함 | `PAP-15`에서 plugin worker registration lifecycle과 safe retry 경계를 disposable Company로 검증해야 함 |
| P2 | Company Integrity Check는 6시간 schedule만 생성했고 live 실행은 아직 없음 | 첫 schedule 뒤 `integrity: healthy`, 실행 비용과 no-op 계약을 확인해야 함 |
| P2 | System Improvement Review의 manual run은 성공했지만 첫 schedule 실행은 아직 없음 | 2026-07-20 10:00 KST 이후 revision 2가 같은 최대 3개·no-auto-fix 계약으로 dispatch되는지 확인해야 함 |

Ops Company는 소비 Company의 제품 코드나 Goal을 직접 변경하지 않는다. Backlog가 확인된 Milestone으로 승격된 뒤에만 이 저장소를 수정하며, Plugin 변경은 일회용 Company에서 검증하고 Board가 배포를 확인한다.
