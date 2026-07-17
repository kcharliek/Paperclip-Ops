# Company Integrity Check

Maintainer가 Paperclip 공식 Routine으로 Company의 운영 정합성을 확인한다. 기본 주기는 6시간이며 `skip_if_active`와 `skip_missed`를 사용한다.

## 실행 경계

- 현재 Routine Task와 Paperclip API만 읽고 제품 workspace, 저장소와 Company 설정은 수정하지 않는다.
- Company Profile은 `$OPERATION_CONTROL_PLUGIN_ID`를 설치된 Operation Control instance ID로 치환해 Routine description에 저장한다. Routine env 전달에 의존하지 않는다.
- 먼저 API token으로 `POST $PAPERCLIP_API_URL/api/plugins/$OPERATION_CONTROL_PLUGIN_ID/actions/inspect-operation-state`를 호출한다. body는 `{"companyId":"$PAPERCLIP_COMPANY_ID","params":{}}`다. mode가 `normal`이 아니면 `resume`하지 않고 현재 상태와 이유만 기록한 뒤 종료한다.
- `$PAPERCLIP_API_URL/api/health`, Company Agents, Routines와 Heartbeat runs를 API token으로 조회한다.
- 자기 run과 이미 종료된 과거 run은 이상으로 판정하지 않는다.
- Routine Task description이 이 실행의 전체 계약이다. 계약을 찾기 위해 filesystem, server log, source 또는 과거 session을 검색하지 않는다.

## 계약

다음 조건을 모두 확인한다.

1. Paperclip health가 `ok`이고, backup이 활성화된 경우 backup status가 `ok`이며 최신 backup age가 `maxAgeHours` 이하다.
2. Operation mode가 `normal`이고 시간당 run count가 limit 이하다.
3. Agent의 `orgChainHealth.status`가 `healthy`이고 `errorReason`이 없다.
4. active Routine의 schedule trigger가 enabled이며 `nextRunAt`이 있다. 마지막 실행 실패는 한 번 재조회한 뒤 기록한다.
5. 자기 run을 제외하고 `running` 또는 `queued` 상태가 Agent timeout을 넘긴 Heartbeat run이 없다.
6. active Company Goal마다 `plugin:local.operation-control:goal-dispatch` origin의 Task가 최대 하나이며, 코드·사용자 산출물 Task는 별도 review bridge가 아니라 native Agent review stage를 사용한다.

## 결과와 보정

- 모두 정상이면 현재 Routine Task에 `integrity: healthy`와 확인값을 댓글로 남기고 `done`으로 종료한다.
- Operation Control이 이미 자동 취소·pause·상태 복구한 항목은 사후 상태를 재확인하고 `reconciled`로 기록한다.
- 그 밖의 이상은 check id, expected, actual, evidence와 안전한 다음 조치를 댓글로 남기고 Product Steward를 mention한 뒤 현재 Routine Task는 `done`으로 종료한다. 다음 schedule을 막는 장기 active Task로 만들지 않는다.
- Routine은 DB restore, `resume normal`, Agent·Role·권한·instruction, Goal·Task tree, execution policy, Routine 설정 또는 제품 코드를 직접 변경하지 않는다. Product Steward가 별도 Task로 분류하면 native review와 필요한 경우 human approval을 거쳐 보정한다.
