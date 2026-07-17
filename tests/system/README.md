# Paperclip Ops System Test

Paperclip native autonomous delivery 계약을 LLM 없이 검증하는 bounded black-box test다.

## 범위

- Operation Control 1.0.0 ready 상태와 Role instruction의 actor 경계를 확인한다.
- disposable Company에서 `immediate → maintenance → normal`과 수동 pause 보존을 확인한다.
- active Company Goal이 Product Steward에게 한 번만 dispatch되는지 확인한다.
- Goal update가 dispatch Task를 중복 생성하지 않는지 확인한다.
- low-risk Issue가 native Agent `review` stage와 독립 reviewer를 사용하는지 확인한다.
- high-risk Issue가 Agent review 뒤 user `approval` stage를 사용하는지 확인한다.
- 성공·실패와 무관하게 disposable Company를 archive한다.

별도 LLM run, 응답 품질 채점, custom Milestone, recovery injection과 Board evidence relay를 실행하지 않는다. 제품 behavior 검증은 각 제품 저장소의 결정적 테스트가 담당한다.

## 실행

```bash
node tests/system/run.mjs --preflight
node tests/system/run.mjs
```

기본 Paperclip 주소는 `http://127.0.0.1:3100`이다. 인증된 배포에서는 `PAPERCLIP_TOKEN`을 제공한다.
