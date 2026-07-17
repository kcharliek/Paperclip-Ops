# AI Company 운영 상태

운영 상태는 autonomous delivery의 workflow 상태가 아니라 Company-wide maintenance 안전장치다. Task, review와 approval 상태는 Paperclip Issue가 직접 소유한다.

## 경계

| 영역 | 책임 |
|---|---|
| Paperclip Core | Goal, Issue tree, blocker, run, native execution policy, review·approval와 audit |
| Operation Control | Goal one-shot dispatch, run cap, `normal`/`holding`/`maintenance` |
| Product repository | 제품 코드, 결정적 테스트와 Git 변경 |

Plugin은 Milestone, review, remediation, completion report 상태를 복제하지 않는다.

## 운영 상태

```text
NORMAL ── Start maintenance ──> HOLDING ── drain 완료 ──> MAINTENANCE
  ^                                                        │
  └──────────────── Resume normal ─────────────────────────┘
```

- `normal`: Goal auto-dispatch와 모든 native Task가 기존 policy대로 실행된다.
- `holding`: 새 일반 run을 막고 이미 실행 중인 작업의 종료를 기다린다.
- `maintenance`: 선택된 owner만 사전 정의된 Maintenance Task를 수행한다.

Drain은 기존 run을 끝낸 뒤 Agent를 pause하고, Immediate는 owner 외 Agent를 즉시 pause한다. Resume은 plugin이 pause한 Agent만 재개하고 maintenance 중 생성되어 미배정된 active Company Goal을 dispatch한다.

## Run cap

시간당 Company run-start 수가 설정 상한을 넘으면 즉시 maintenance로 전환하고 모든 Agent를 pause한다. 이는 무한 반복의 최후 안전장치이지 정상적인 retry scheduler가 아니다. 정상 workflow는 같은 acceptance 기준 두 번 실패 시 Product Steward 전략 변경 또는 human escalation으로 멈춘다.

## 현재 한계

Plugin SDK에는 동기식 `beforeAgentRun` veto가 없어 hold 이후 run이 아주 짧게 시작된 다음 취소될 수 있다. Delivery review와 approval은 이 한계와 무관하게 Paperclip native `executionPolicy`를 사용한다.
