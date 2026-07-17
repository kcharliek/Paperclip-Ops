# Paperclip Ops Company 현재 구성

확인 기준: 2026-07-17, Paperclip default local instance `127.0.0.1:3100`, Paperclip `2026.707.0`.

## Company와 Project

| 항목 | 값 |
|---|---|
| Company / ID | Paperclip Ops / `94fa4eb9-df28-455d-8c9a-eb5bd6287356` |
| 상태 / prefix | active / `PAP` |
| Company Goal | `687f9b61-1cfc-4215-a58e-1258cd4e710e`, active |
| Project | `73777e76-01dd-459f-a527-a3547fe44f36`, in_progress, lead Ops Steward |
| primary workspace | `262745da-14a7-4bec-8c8c-06ef26ab0254`, `/Users/chanheekim/Dev/Paperclip-Ops`, shared workspace |

## 조직

| Agent | ID | Paperclip role | 상태 |
|---|---|---|---|
| Ops Steward | `e55a2362-5520-4006-8fbe-17827a6be382` | `ceo` | idle |
| System Auditor | `177e9782-9b8d-416e-9865-273252eca151` | `researcher` | idle |
| Builder | `fb595d00-0021-4e2c-88d7-fc3bd329a7a2` | `engineer` | idle |
| Sweeper | `960a20e4-32e6-49dc-9d8c-4cbab025c595` | `qa` | idle |
| Maintainer | `16fb2f08-9318-415b-9c46-0ff404810474` | `devops` | idle |

실행 Agent 네 명은 Ops Steward에게 직접 보고하며 org chain은 healthy다. Product Steward는 Goal을 직접 구현하지 않고 native Task로 분해한다. Builder와 Maintainer가 실행하고, 기본 독립 reviewer인 Sweeper가 원래 Task의 native review stage에서 승인하거나 같은 Task를 수정 상태로 되돌린다. Role은 고정 순차 phase가 아니라 필요한 전문성이다.

다섯 live `AGENTS.md`에는 다음 자율 실행 계약이 적용되어 있다.

- 저·중위험 작업은 인간 응답 없이 계획, 실행, 독립 Agent review와 보완을 계속한다.
- production, 삭제, migration, 권한·secret, 외부 전송, 결제·법무 등 고위험 행동만 review 뒤 user approval을 요구한다.
- 같은 acceptance를 두 번 실패하면 Product Steward가 방법이나 담당자를 바꾸고, 그래도 실패하거나 scope·예산 변경이 필요할 때만 인간에게 올린다.
- Agent는 주입된 자기 인증만 사용하며 401/403 뒤 Board 권한으로 우회하지 않는다.
- shared workspace writer는 한 번에 한 명만 실행하고, Git 변경은 focused commit과 결정적 검증을 남긴다.

적용 뒤 Blueprint, current snapshot과 Paperclip 원본 instruction의 byte-for-byte 일치를 다시 확인했다.

## Operation Control 1.0

| 항목 | 현재값 |
|---|---|
| instance | `979f4503-0512-4747-b3de-5c098ee3ece1` |
| version / status | `1.0.0` / ready |
| mode | `normal` |
| run budget | 현재 window 0/20 |
| orchestrator | role `ceo` |
| Goal dispatch | `autoDispatchGoals: true` |
| delivery owner | `paperclip-native` |

Plugin은 이제 maintenance mode, 시간당 run cap과 Goal당 하나의 idempotent dispatch Task만 소유한다. Agent tool은 read-only `inspect-operation-state` 하나뿐이다. custom Milestone phase, Root/child 생성 tool, recovery Task, review bridge, Git Milestone report와 Board evidence relay는 제거했다.

새로 생성되거나 재개된 Company Goal은 `plugin:local.operation-control:goal-dispatch` origin의 Task 하나로 Ops Steward에게 전달된다. 1.0 전환 이전부터 active였던 현재 장기 Goal은 자동 재생하지 않아 dispatch Task가 없다. 기능 계약은 일회용 Company에서 검증했으며, 다음 유한 Goal부터 live native delivery를 관측한다.

## Routine

- System Improvement Review: `da9b24ae-29f9-445f-a6e4-642ab4fb2bc5`, revision 2, 매주 월요일 10:00 KST, `skip_if_active` / `skip_missed`
- Company Integrity Check: `24f95458-8bee-4260-94f3-04ed8e638dfa`, revision 3, 6시간마다, `skip_if_active` / `skip_missed`

Integrity revision 3은 native Goal dispatch의 중복과 코드·사용자 산출물 Task의 native review policy를 read-only로 확인한다. 전환 중 기존 Routine execution `PAP-27`을 취소했으므로 마지막 routine run은 failed로 기록되어 있고, 다음 schedule에서 새 계약의 첫 실제 결과를 확인해야 한다.

## 마이그레이션 이력

이전 custom delivery의 수정 Milestone `49fc84cb-d42c-496d-96e9-82d7fbb9324d`은 `achieved`로 종료했다. Root `PAP-18`과 child `PAP-19..22`, blocker triage `PAP-25..26`은 `done`이다. 구버전 acceptance가 만든 다음 Milestone 계획 `PAP-28`과 당시 실행 중이던 Routine `PAP-27`은 전환 과정에서 `cancelled`로 정리했다.

새 구조와 전제가 충돌하는 Backlog도 다음과 같이 취소했다.

- `PAP-4`: custom delivery recovery 검증
- `PAP-5`: controlled Root/Node 전환
- `PAP-7`: custom state machine write-veto
- `PAP-13`: human-gated 첫 controlled delivery
- `PAP-23`: custom Root/child Role label 적용

usage/context ceiling, backup/restore, plugin upgrade, trusted-local sandbox, actor 경계와 worker lifecycle처럼 새 구조에서도 유효한 Backlog는 유지한다.

## 검증

2026-07-17 결정적 검증은 다음 계약을 통과했다.

- `plugins/operation-control`: `npm test` → `operation-control: ok`
- `node tests/system/run.mjs --preflight` → plugin `1.0.0`, Role 자율 실행·actor 경계 확인
- `node tests/system/run.mjs` → maintenance와 수동 pause 보존, Goal dispatch 단일성, native Agent review, Agent review 뒤 user approval의 15개 check 통과

마지막 system test의 disposable Company `c2ffb160-1a10-4fa8-89d0-f86a3c8dd686`는 성공 뒤 archive됐다. 기본 system test는 실제 LLM run을 시작하지 않고 Paperclip API와 native execution state만 검증한다.
