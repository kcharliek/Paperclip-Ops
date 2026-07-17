# Paperclip Operation Control

Operation Control 1.x는 autonomous Company의 얇은 안전장치다. Delivery workflow는 Paperclip native Issue와 `executionPolicy`가 소유한다.

## 기능

- active Company Goal이 생성되면 configured `orchestratorRole` Agent에게 idempotent dispatch Task 하나를 만들고 깨운다.
- dispatch Task는 Product Steward에게 native Task tree, Agent review와 risk-based human approval을 사용하라고 지시한다.
- `Finish current work, then pause`는 기존 run을 마친 뒤 non-owner Agent를 pause한다.
- `Pause now`는 non-owner Agent를 즉시 pause한다.
- normal 복귀 시 plugin이 pause한 Agent만 resume하고 maintenance 중 미배정된 active Company Goal을 dispatch한다.
- `maxRunsPerHour` 초과 시 모든 Agent를 immediate maintenance로 멈춘다.
- Agent는 read-only `inspect-operation-state` tool로 mode와 run budget을 확인한다.

## 의도적으로 하지 않는 것

- custom Milestone과 delivery phase
- Root/child 생성 전용 tool
- custom review, remediation과 Board confirmation
- Git report와 commit SHA gate
- direct Issue write guard와 recovery state machine

코드·사용자 산출물 review는 Task의 native Agent `review` stage를 사용한다. destructive, production, external communication, permission, secret, legal, financial 또는 irreversible 행동에만 user `approval` stage를 추가한다.

## 설정

```json
{
  "orchestratorRole": "ceo",
  "autoDispatchGoals": true,
  "maxRunsPerHour": 20
}
```

`orchestratorRole`은 active Agent가 정확히 한 명이어야 한다. Team Goal은 독립 Company 요청으로 dispatch하지 않는다.

## Build and install

```bash
npm install
npm test
```

Local path:

```text
/Users/chanheekim/Dev/Paperclip-Ops/plugins/operation-control
```

코드 변경 후 Paperclip의 plugin upgrade 경로로 같은 manifest version 또는 새 version을 다시 적용해 worker와 manifest를 갱신한다. Disable/Enable만으로 local package 변경을 재로딩했다고 간주하지 않는다.
