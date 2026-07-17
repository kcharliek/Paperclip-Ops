# Paperclip Ops Drift

| 우선순위 | 현재 | 목표와의 차이 |
|---|---|---|
| P1 | Operation Control 1.0은 Goal 자동 dispatch와 native `executionPolicy` 계약을 일회용 Company에서 결정적으로 통과함 | 재구성 이후 생성된 첫 유한 live Goal에서 Ops Steward 분해 → executor → 독립 Agent review → 자동 완료 전체 loop를 아직 관측하지 않음 |
| P1 | Agent instruction은 401/403 뒤 Board actor 우회를 금지함 | platform 강제 actor 경계와 제한된 공식 test actor 표면은 아직 없음 |
| P1 | Paperclip `2026.707.0`의 Issue hard-delete는 `cost_events.issue_id` 참조에서 실패하고 Company delete는 heartbeat·feedback·goal 참조 삭제 순서가 완전하지 않음 | 공식 delete transaction이 모든 FK를 안전한 순서로 정리해야 하며, 이번 초기화는 구 Company에 한정한 FK 정리 뒤 공식 Company delete를 완료함 |
| P2 | Company Integrity Check revision 2는 새 Company에서 아직 첫 schedule 전임 | 다음 6시간 schedule에서 native-contract `integrity: healthy` 또는 구체적 drift 결과를 확인해야 함 |
| P2 | System Improvement Review revision 2는 새 Company에서 아직 첫 schedule 전임 | 첫 run에서 최대 3개, duplicate 확인, no-auto-fix 계약을 확인해야 함 |
| P2 | shared workspace는 writer 한 명만 허용함 | 독립 작업의 실제 병렬화에는 Task별 worktree 또는 별도 workspace 전략이 필요함 |

2026-07-17 구 Company와 전체 Task 이력을 삭제하고 Company Profile을 다시 구성했다. 현재 mode는 `normal`, 모든 Agent는 `idle`, plugin run window는 0/20이고 Task는 0개다. 삭제 전 자동 DB backup은 `/Users/chanheekim/.paperclip/instances/default/data/backups/paperclip-20260717-190436.sql.gz`에 남아 있다.

폐기한 custom Milestone, plugin phase, Root/child tool, recovery Task, review bridge와 단계별 human confirmation은 남은 목표가 아니다. 새 delivery의 인간 개입은 고위험 행동, scope·예산 변경, human-only permission 또는 전략 변경 뒤에도 반복되는 실패로 제한한다.
