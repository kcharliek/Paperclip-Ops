# AI Company 운영 상태

이 상태 모델은 [AI Company Blueprint](../blueprint/README.md)를 사용하는 모든 Company에 적용한다.

## 목적

평상시 개발 흐름과 기술 부채 정리 시간을 분리한다. 유지보수 전환 시 신규 Agent 실행은 멈추되 이미 실행 중인 작업은 정책에 따라 완료하거나 즉시 취소할 수 있어야 한다. Maintainer는 기본 Maintenance owner로서 정지 기간에 사전 승인된 코드 개선과 검증을 수행한다.

## 경계

| 영역 | 책임 |
|---|---|
| Paperclip Core | Agent lifecycle, run queue, Task, Company와 권한 |
| PaperClip-Ops | Company 운영 정책, 설정 문서, 운영 플러그인 |
| 제품 저장소 | 실제 제품 코드와 테스트 |

Paperclip Core는 포크하지 않는다. 공개 Plugin SDK의 Agent 상태, run 이벤트, plugin state, Issue Document와 Dashboard UI만 사용한다.

## 운영 상태

```text
NORMAL ── Start maintenance ──> HOLDING ── drain 완료 ──> MAINTENANCE
  ^                                                        │
  └──────────────── Resume normal ─────────────────────────┘
```

| 상태 | 의미 |
|---|---|
| `normal` | 모든 Agent가 기존 정책대로 실행된다. |
| `holding` | 신규 일반 Agent 실행을 정지시키고 기존 실행의 종료를 기다린다. |
| `maintenance` | Maintainer로 선택된 Maintenance owner 한 명만 실행할 수 있고 나머지 Agent는 paused 상태다. |

Company 운영 상태는 company-scoped plugin state에 저장한다. 첫 Maintenance 시작 시 `Company Operation State` Task와 `operation-state` Issue Document를 만들어 같은 상태를 Artifact로 미러링한다.

## 정지 정책

### Drain — 기본값

- 상태 플래그를 먼저 `holding`으로 기록한다.
- 이미 `running`인 일반 Agent는 현재 run을 끝낸다.
- run이 끝난 Agent는 pause한다.
- 플래그 이후 새로 시작된 run은 `agent.run.started` 이벤트에서 취소하고 Agent를 pause한다.
- 실행 중인 일반 Agent가 없어지면 `maintenance`로 전환한다.

### Immediate

- Maintenance owner를 제외한 모든 Agent를 즉시 pause한다.
- 실행 중인 run도 취소한다.
- 정리 완료 후 바로 `maintenance`로 전환한다.

## 재개

`Resume normal operation`은 상태를 먼저 `normal`로 바꾼다. 이후 플러그인이 직접 pause한 Agent만 resume한다. Maintenance 시작 전부터 수동으로 paused 상태였던 Agent는 건드리지 않는다.

## 안전 조건

- Maintenance owner는 pause 대상에서 제외한다.
- owner는 회사에 존재하고 terminated 상태가 아니어야 한다.
- 제품 저장소와 PaperClip-Ops 저장소를 섞지 않는다.
- Artifact 동기화가 실패해도 운영 상태는 plugin state에 유지한다.
- Maintenance 시작은 명시적인 UI 동작으로만 수행한다.
- Maintenance Task와 완료 조건은 `normal` 상태에서 Product Steward가 먼저 확정한다.
- Maintainer가 변경과 최소 검증을 완료하고 `normal` 복귀 뒤 Builder 또는 Sweeper가 독립 review한다.

## 현재 한계

Plugin SDK에는 동기식 `beforeAgentRun` veto hook이 없다. 따라서 신규 run이 프로세스 수준에서 아주 짧게 시작된 뒤 `agent.run.started` 이벤트로 취소될 수 있다. 또한 현재 플러그인은 Maintenance participant 목록이 아닌 owner 한 명만 허용한다. Paperclip Core를 포크하지 않는 조건에서 의도적으로 수용한 한계다.

## 향후 확장 기준

실제로 원자적 실행 차단이 필요해질 때만 공식 environment driver 도입을 검토한다. 현재는 Agent pause/resume와 lifecycle event 조합으로 충분하므로 별도 실행 환경은 만들지 않는다.
