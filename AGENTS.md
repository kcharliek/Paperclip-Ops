# PaperClip-Ops 작업 규칙

- 이 저장소는 범용 AI Company Blueprint와 운영 플러그인의 기준 저장소다.
- 제품 코드는 각 Company Profile이 지정한 제품 저장소에서만 수정한다.
- 현재 설정과 목표 설계를 문서에서 명확히 구분한다.
- `references/*/roles/*/AGENTS.md`와 `references/*/skills/*/SKILL.md`는 Paperclip 현재값의 원문 스냅샷이다. 목표 설계만 바꿀 때 이 파일을 먼저 수정하지 않는다.
- 설정을 적용한 뒤 API와 원본 파일을 다시 확인해 스냅샷을 갱신한다.
- `plugins/operation-control` 변경 후에는 해당 디렉터리에서 `npm test`를 실행한다.
- 실행 정책, 권한, Gate 또는 상태 전이를 변경하면 같은 변경에서 대응 테스트를 추가·수정한다. 기존 테스트가 이미 같은 계약을 검증하면 변경하지 않은 근거와 실행 결과를 남긴다.
- Paperclip에 영향을 주는 동작은 Company 상태가 `normal`인지 먼저 확인한다.
