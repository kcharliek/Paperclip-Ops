# Paperclip Ops Drift

| 우선순위 | 현재 | 목표와의 차이 |
|---|---|---|
| P1 | Operation Control 1.0은 Goal 자동 dispatch와 native `executionPolicy` 계약을 일회용 Company에서 결정적으로 통과함 | 전환 이후 생성된 첫 유한 live Goal에서 Ops Steward 분해 → executor → 독립 Agent review → 자동 완료 전체 loop를 아직 관측하지 않음 |
| P1 | 시간당 20 run cap은 정상이나 과거 한 run이 input 2.8M tokens까지 증가함 | run 내부 token/context ceiling은 Paperclip 공식 표면이 없어 `PAP-2`로 추적 중 |
| P1 | Agent instruction은 401/403 뒤 Board actor 우회를 금지함 | platform 강제 actor 경계는 아니므로 `PAP-24`의 공식 scoped API 또는 제한된 test harness가 필요함 |
| P1 | 이전 instance에서 plugin worker의 transient `No worker registered`가 관측됨 | 1.0 worker registration lifecycle과 bounded retry의 live 근거는 `PAP-15`로 추적 중 |
| P2 | Company Integrity Check revision 3을 적용했으나 마이그레이션 중 `PAP-27`을 취소해 마지막 run이 failed로 남음 | 다음 6시간 schedule에서 native-contract `integrity: healthy` 또는 구체적 drift 결과를 확인해야 함 |
| P2 | System Improvement Review revision 2는 아직 첫 schedule 전임 | 첫 run에서 최대 3개, duplicate 확인, no-auto-fix 계약을 확인해야 함 |
| P2 | shared workspace는 writer 한 명만 허용함 | 독립 작업의 실제 병렬화에는 Task별 worktree 또는 별도 workspace 전략이 필요함 |

2026-07-17 Operation Control 1.0 배포, 다섯 live Role instruction, Integrity revision 3과 obsolete Backlog 정리를 적용했다. Company mode는 `normal`, 모든 Agent는 `idle`이고 plugin run window는 0/20이다.

폐기한 custom Milestone, plugin phase, Root/child tool, recovery Task, review bridge와 단계별 human confirmation은 남은 목표가 아니다. 새 delivery의 인간 개입은 고위험 행동, scope·예산 변경, human-only permission 또는 전략 변경 뒤에도 반복되는 실패로 제한한다.
