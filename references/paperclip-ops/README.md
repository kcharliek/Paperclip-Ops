# Paperclip Ops Reference

이 문서는 [Paperclip Ops Company 목표 설계](../../docs/ops-company.md)를 Paperclip `2026.707.0`에 적용한 현재값의 요약이다. 확인 기준은 2026-07-17, default local instance `127.0.0.1:3100`이다.

- Company: Paperclip Ops / `94fa4eb9-df28-455d-8c9a-eb5bd6287356` / prefix `PAP`
- Company Goal: AI Company Ops 시스템을 지속 개선하고 검증된 운영 표준을 제공한다
- Project와 workspace: Paperclip Ops / `/Users/chanheekim/Dev/Paperclip-Ops`
- 조직: Ops Steward 직속 System Auditor, Builder, Sweeper, Maintainer
- Operation Control: `normal`, 시간당 run 20회, `executing`
- Routine: `System Improvement Review` 주 1회, `Company Integrity Check` 6시간마다
- Git 전달: 검증 뒤 Task 전용 commit과 현재 branch push를 실행 Role이 직접 완료하고 branch·full SHA·remote/ref를 근거로 남김

이전 instance의 성공 run은 복제하지 않았다. `PAP-1`은 재구성 기준점이고 `PAP-2..13`, `PAP-15`, `PAP-23`이 미해결 Backlog를 추적한다. Board가 수정 Milestone `49fc84cb-d42c-496d-96e9-82d7fbb9324d`를 확인해 Root `PAP-18`과 순차 Node `PAP-19..22`를 시작했다. 현재 `PAP-19`는 disposable system-test 경계를 다음 run에 적용하기 위한 비용 checkpoint이며 Builder는 수동 paused다. 상세 ID, 검증과 남은 차이는 [current-state](current-state.md)와 [drift](drift.md)에 있다.

`roles/*/AGENTS.md`는 적용 뒤 Paperclip 원본과 byte-for-byte 일치를 다시 확인한 current snapshot이다. 목표 계약은 `blueprint/role-instructions/*`와 [Ops Company 설계](../../docs/ops-company.md)에서 관리한다.
