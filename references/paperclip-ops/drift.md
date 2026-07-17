# Paperclip Ops Drift

| 우선순위 | 현재 | 목표와의 차이 |
|---|---|---|
| P1 | 수정 Milestone `49fc84cb-d42c-496d-96e9-82d7fbb9324d`은 active이고 `PAP-19` 완료 뒤 `PAP-20` 자동 시작까지 확인됨 | `PAP-20`은 Board 전용 recovery action을 Agent actor로 실행해야 Exit gate를 만족하는 설계라 blocked다. Milestone 범위를 바꾸지 않고 제한된 Agent harness 또는 Board 제공 evidence 경계를 결정해야 함 |
| P1 | `PAP-20`에서 Agent bearer의 Board API는 403이었고 local-trusted 무인증 Board fallback 시도 직전에 run을 취소함. 다섯 live Role instructions와 Blueprint에 401/403 actor 경계를 적용함 | instruction 회귀는 막았지만 platform 강제는 아니다. `PAP-24`에서 unauthenticated actor 상승을 구조적으로 차단하고 Agent actor를 유지하는 disposable harness 또는 공식 evidence 전달 경로를 검증해야 함 |
| P1 | 첫 Root 생성 orchestration은 `goalId`에 Milestone ID를 넣어 human-confirmed 오류를 냈고, Board가 Company Goal ID를 명시한 같은 Task resume에서 중복 없이 `PAP-18`을 생성함 | `PAP-4`에서 orchestration 안내가 Company Goal ID와 Milestone ID를 명시적으로 구분하고 live retry가 같은 Root를 중복 생성하지 않는 계약을 system test로 고정해야 함 |
| P1 | Maintainer가 child tool 응답을 잘못 읽어 native blocker를 누락해 Node 2가 먼저 실행됐고 Board가 pause/cancel 뒤 `20←19`, `21←20`, `22←21`을 보정함 | `PAP-4`의 live evidence에 잘못된 선행 wake 취소, blocker 복구와 재개 순서를 포함하고, 승인된 Milestone의 blocker 계약을 생성 시 검증할 방법을 결정해야 함 |
| P1 | Operation Control의 Root/child tool은 Role label을 받지 않아 `PAP-18..22`가 무label로 생성됐고 Board가 사후 보정함 | `PAP-23`에서 허용 Role label을 생성 시 원자적으로 적용하고 system test로 검증해야 함 |
| P1 | 7개 성공 run은 input 7,105,302, cached input 6,479,232, output 94,443 tokens였고 Maintainer 분해 run 하나가 input 2,830,358이었음 | 시간당 20 run cap은 정상이나 한 run context 폭증을 막지 못한다. `PAP-2`의 공식 usage/context 정책 표면을 기다림 |
| P1 | 이전 AllNewMTS scheduled Integrity run의 transient `No worker registered`는 새 instance에서도 미해결 drift로 이관됨 | `PAP-15`에서 plugin worker registration lifecycle과 bounded retry를 disposable Company로 검증해야 함 |
| P2 | 새 Company Integrity Check는 2026-07-17 18:00 KST 첫 schedule 대기 중임 | 첫 run 뒤 `integrity: healthy`, no-op 계약과 실행 비용을 확인해야 함 |
| P2 | 새 System Improvement Review는 2026-07-20 10:00 KST 첫 schedule 대기 중임 | 최대 3개, duplicate 확인, no-auto-fix 계약으로 dispatch되는지 확인해야 함 |

2026-07-17 `npm test`, actor-boundary preflight와 기본 deterministic system test는 모두 통과했다. 현재 Company mode는 `normal`, Builder는 `idle`이고 system test fixture는 남지 않았다. 실행 Role의 검증 후 focused commit·현재 branch push 계약과 Agent actor·인증 경계는 live instructions에 적용했다.

Ops Company는 소비 Company의 제품 코드나 Goal을 직접 변경하지 않는다. Backlog가 확인된 Milestone으로 승격된 뒤에만 이 저장소를 수정하며, Plugin 변경은 일회용 Company에서 검증하고 Board가 배포를 확인한다.
