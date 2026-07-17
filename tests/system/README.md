# Paperclip Ops System Test

Paperclip의 운영 계약을 검증하는 최소 system test다. 기본 실행은 결정적 Operation Control 상태만 확인하고, `--llm`일 때만 실제 `opencode_local` Builder 검증을 추가한다. 목표 설계이며 `references/*` 현재값 스냅샷을 대체하지 않는다.

## 범위

- Operation Control의 `immediate → maintenance → normal`과 수동 pause 보존을 확인한다.
- 기존 company Goal을 Board가 controlled delivery로 채택할 수 있고, Board actor가 Agent 전용 Milestone 제안 단계를 가장할 수 없는지 확인한다.
- preflight에서 모든 표준 Role instruction이 401/403 뒤 local-trusted 무인증 Board 경로로 재시도하지 않는 actor 경계를 포함하는지 확인한다.
- `--llm`: 실제 Builder 정책으로 Issue를 `done` 처리하고 product만 수정하는지 확인한다.
- `--llm`: OpenCode가 workspace 밖과 source를 수정하지 못하도록 resolved permission을 확인한다.

응답 문장의 품질은 채점하지 않는다. Paperclip API 상태, run 종료 상태와 Git/file 결과만 판정한다. 실행마다 `Ops System Test ...` 전용 Company를 만들고 종료 시 archive하며, Project와 Git fixture는 `--llm`에서만 만든다. AllNewMTS Company, Project와 제품 저장소는 테스트 입력으로 사용하지 않는다.

Builder 지침은 `blueprint/role-instructions/builder.md` 원문을 직접 읽고 테스트 fixture 경계만 뒤에 추가한다. OpenCode는 product 저장소를 cwd로 `--pure --auto` 실행한다. Inline permission은 product와 읽기 전용 source 밖 접근 및 일반 bash를 막고 Paperclip API curl만 허용한다.

## 실행

```bash
node tests/system/run.mjs --preflight
node tests/system/run.mjs --preflight --llm
node tests/system/run.mjs
node tests/system/run.mjs --llm
```

기본 실행과 기본 preflight는 OpenCode 설치나 모델을 요구하지 않는다. `--llm`은 Ollama Cloud GPT-OSS 20B 모델 `ollama-cloud/gpt-oss:20b`를 사용한다. 기본 Paperclip 주소는 `http://127.0.0.1:3100`, timeout은 60초다.

```bash
PAPERCLIP_TEST_MODEL=ollama-cloud/gpt-oss:20b \
PAPERCLIP_TEST_TIMEOUT_SEC=60 \
PAPERCLIP_TEST_TOKEN_CEILING=80000 \
PAPERCLIP_URL=http://127.0.0.1:3100 \
node tests/system/run.mjs --llm
```

실패하면 임시 workspace와 `report.json`을 남기고 성공한 fixture는 삭제한다. `--llm`은 정확히 한 metered LLM run만 허용하며 첫 run에서 Issue `done`과 file/Git 계약을 모두 만족하지 못하면 즉시 실패한다. Paperclip이 만든 0-token 상태복구 run은 비용 계산에서 제외하고 cleanup에서 정지한다. Token ceiling은 사용량 보고 후 판정하는 실패 기준이며 사전 hard cap은 아니다.

Source는 OS mode bit로 쓰기를 막고 일반 bash도 deny해 `chmod` 우회를 차단한다. 별도 사용자나 container read-only mount는 이 두 경계를 우회하는 실제 사례가 생길 때만 추가한다.
