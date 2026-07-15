---
name: formde-migration
description: XMS 기반 SmartFormDe 런타임을 Expo로 이주할 때 공통 계약, 작업 경계, Task 자동 분해와 Root 검토 흐름을 적용한다. AllNewMTS의 SmartFormDe, XMS/XMF, Expo 이주, FormDe 호환성, 파싱, 렌더링, TR, 실시간, 스크립트 관련 Paperclip Task를 계획, 분해, 실행, 검토하거나 보완할 때 사용한다.
---

# FormDe Migration

## 원본과 작업 경계

- 쓰기 대상은 /Users/chanheekim/Dev/AllNewMTS 하나다.
- /Users/chanheekim/Dev/Plus와 /Users/chanheekim/Dev/mts_screen은 읽기 전용 원본이다.
- Plus의 기존 FormDe 동작과 문서를 계약 근거로 삼되 원본 파일을 수정하지 않는다.
- 원본에서 유도할 수 없는 XMS 속성, TR 필드, 기본값은 추측하지 않는다.

## 핵심 전략

- 화면을 하나씩 React Native로 다시 작성하지 않는다.
- XMS 로더, 정규화 AST, Control 렌더러, 데이터 바인딩, 이벤트·스크립트 런타임을 공통 계층으로 구현한다.
- 화면별 이슈는 공통 런타임으로 해결할 수 없는 예외가 확인될 때만 만든다.
- Expo Go가 아니라 Expo Development Build를 기준으로 한다.
- 순수 TypeScript로 가능한 로더·파서부터 시작하고 실제 네이티브 필요성이 확인된 지점에만 Expo Module을 추가한다.

## Task 크기와 자동 분해

- heartbeat를 시작하면 구현 전에 Task 크기를 판정한다.
- leaf Task는 담당자 1명, 독립 산출물 1개, 검증 방법 1세트이며 한 heartbeat의 약 30~45분 안에 완료 가능한 크기로 제한한다.
- 독립 산출물이 둘 이상이거나 한 heartbeat를 넘길 가능성이 높으면 구현 전에 2~5개의 standard child Task로 분해한다.
- child는 Parent의 Goal, Project와 workspace를 상속하고 각각 완료 기준과 검증 방법을 가진다.
- child 생성은 POST /api/issues/{parentId}/children을 사용하고 blockParentUntilDone: true를 설정한다. parentId만으로 실행 대기를 표현하지 않는다.
- 같은 Agent가 수행하는 child는 blockedByIssueIds로 직렬화한다. 서로 다른 Agent가 안전하게 병렬 수행할 수 있을 때만 병렬로 둔다.
- 분해 방법이 명확하면 Board 승인 없이 즉시 child를 만든다. 설계 선택이나 범위 승인이 필요할 때만 planning mode와 plan confirmation을 사용한다.

## Root Task 검토와 보완

- child를 가진 Task를 Root Task로 취급하고 leaf Task에는 기본 Reviewer를 두지 않는다.
- 모든 child가 terminal이 되면 Root 담당자가 완료 기준, 산출물과 검증 결과를 취합한 뒤 done을 요청한다. Execution Policy가 Root를 in_review로 전환한다.
- Reviewer는 통과 시 근거 댓글과 함께 done 처리하고, 실패 시 불충족 완료 기준, 확인 근거와 기대 결과를 댓글로 명시해 changes requested로 반환한다.
- changes requested를 받은 담당자는 완료된 child를 다시 열지 않고 실패 항목만 해결하는 1~3개의 보완 child를 Root 아래에 생성하고 blockParentUntilDone: true로 연결한다.
- 보완 child가 끝나면 동일 Root를 동일 Reviewer에게 다시 제출한다.
- 같은 완료 기준이 두 번 거절되면 추가 자동 분해를 멈추고 Board에 설계 또는 범위 판단을 요청한다.

## 이슈 수행 순서

1. 관련 원본 파일과 호출 경로를 확인한다.
2. Task 크기를 판정하고 필요하면 child로 분해한다.
3. 공통 런타임에서 해결할 수 있는지 먼저 판단한다.
4. 가장 작은 수직 단면을 구현한다.
5. 파싱, 렌더링, 입력·이벤트, TR·실시간, iOS·Android를 필요한 범위에서 검증한다.
6. 검증 결과와 사용자 확인 가능한 산출물을 Paperclip에 남긴다.
7. Root Task라면 Reviewer의 승인을 거쳐 완료한다.

## 완료 기준

- 대상 XMS와 지원 범위가 명시되어 있다.
- 알 수 없는 태그와 속성이 숨겨지지 않고 진단된다.
- 테스트 또는 재현 가능한 검증 명령이 있다.
- iOS와 Android 차이가 확인되고 기록되어 있다.
- 화면·리포트·문서 산출물은 attachment 또는 work product로 연결된다.
- 미검증 항목이 있으면 done이 아니라 명확한 blocker 또는 후속 이슈로 남긴다.
