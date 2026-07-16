---
name: formde-migration
description: XMS 기반 SmartFormDe 런타임을 Expo로 이주할 때 공통 기술 계약과 작업 경계를 적용한다. AllNewMTS의 SmartFormDe, XMS/XMF, Expo 이주, FormDe 호환성, 파싱, 렌더링, TR, 실시간, 스크립트 관련 Paperclip Task를 계획하거나 실행할 때 사용한다.
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

## 이슈 수행 순서

1. 관련 원본 파일과 호출 경로를 확인한다.
2. 공통 런타임에서 해결할 수 있는지 먼저 판단한다.
3. 가장 작은 수직 단면을 구현한다.
4. 파싱, 렌더링, 입력·이벤트, TR·실시간, iOS·Android를 필요한 범위에서 검증한다.
5. 검증 결과와 사용자 확인 가능한 산출물을 Paperclip에 남긴다.

## 완료 기준

- 대상 XMS와 지원 범위가 명시되어 있다.
- 알 수 없는 태그와 속성이 숨겨지지 않고 진단된다.
- 테스트 또는 재현 가능한 검증 명령이 있다.
- iOS와 Android 차이가 확인되고 기록되어 있다.
- 화면·리포트·문서 산출물은 attachment 또는 work product로 연결된다.
- 미검증 항목이 있으면 done이 아니라 명확한 blocker 또는 후속 이슈로 남긴다.
