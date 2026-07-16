# Paperclip Ops Drift

| 우선순위 | 현재 | 목표와의 차이 |
|---|---|---|
| P1 | Company Goal은 active지만 Operation Control delivery state가 아직 없음 | 첫 Ops 개선 항목을 사람이 Milestone으로 확인할 때 Ops Steward가 plugin 경로로 Goal을 adopt하고 Root 하나의 controlled delivery를 시작해야 함 |
| P1 | 첫 System Improvement Review는 성공했지만 input 592,505 tokens 중 cached input이 520,704였음 | 주 1회보다 자주 자동 실행하지 않고 `PAP-2`의 공식 usage/context 정책 표면을 기다림 |
| P2 | Company Integrity Check는 6시간 schedule만 생성했고 live 실행은 아직 없음 | 첫 schedule 뒤 `integrity: healthy`, 실행 비용과 no-op 계약을 확인해야 함 |
| P2 | System Improvement Review의 manual run은 성공했지만 첫 schedule 실행은 아직 없음 | 2026-07-20 10:00 KST 이후 revision 2가 같은 최대 3개·no-auto-fix 계약으로 dispatch되는지 확인해야 함 |

Ops Company는 소비 Company의 제품 코드나 Goal을 직접 변경하지 않는다. Backlog가 확인된 Milestone으로 승격된 뒤에만 이 저장소를 수정하며, Plugin 변경은 일회용 Company에서 검증하고 Board가 배포를 확인한다.
