# Paperclip Ops System Test

실제 Paperclip과 `opencode_local` Agent를 사용하는 최소 black-box 테스트다. 목표 설계이며 `references/*` 현재값 스냅샷을 대체하지 않는다.

## 범위

- Manager가 직접 구현하지 않고 Builder에게 라우팅하는지 확인한다.
- 읽기 전용 fixture를 보존하면서 writable fixture만 수정하는지 확인한다.
- Operation Control의 `immediate → maintenance → normal`과 수동 pause 보존을 확인한다.

응답 문장의 품질은 채점하지 않는다. Paperclip API 상태, run 종료 상태와 Git/file 결과만 판정한다. 실행마다 임시 Company를 만들고 종료 시 archive하며 AllNewMTS Company와 제품 저장소는 수정하지 않는다.

## 실행

```bash
node tests/system/run.mjs --preflight
node tests/system/run.mjs
```

기본 모델은 `opencode/big-pickle`, 기본 Paperclip 주소는 `http://127.0.0.1:3100`이다.

```bash
PAPERCLIP_TEST_MODEL=opencode/north-mini-code-free \
PAPERCLIP_TEST_TIMEOUT_SEC=300 \
PAPERCLIP_URL=http://127.0.0.1:3100 \
node tests/system/run.mjs
```

실패하면 조사할 수 있도록 임시 workspace와 `report.json`을 남긴다. 성공한 fixture는 자동 삭제한다. 현재 읽기 전용 경계는 OS mode bit와 Git diff로 검사하므로, 의도적인 `chmod`까지 차단해야 할 때만 별도 사용자 또는 container read-only mount로 올린다.
