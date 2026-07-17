# Paperclip Ops Reference

이 문서는 [Paperclip Ops Company 목표 설계](../../docs/ops-company.md)를 Paperclip `2026.707.0`에 적용한 현재값의 요약이다. 확인 기준은 2026-07-17, default local instance `127.0.0.1:3100`이다.

- Company: Paperclip Ops / `94fa4eb9-df28-455d-8c9a-eb5bd6287356` / prefix `PAP`
- Company Goal: AI Company Ops 시스템을 지속 개선하고 검증된 운영 표준을 제공한다
- Project와 workspace: Paperclip Ops / `/Users/chanheekim/Dev/Paperclip-Ops`
- 조직: Ops Steward 직속 System Auditor, Builder, Sweeper, Maintainer
- Operation Control: `1.0.0`, `normal`, 시간당 run 20회, 새 Goal 자동 dispatch
- Delivery: Paperclip native Issue, blocker와 `executionPolicy`
- Review: 코드·사용자 산출물은 독립 Agent review, 고위험 행동만 human approval
- Routine: `System Improvement Review` 주 1회, `Company Integrity Check` 6시간마다
- Actor 경계: Agent는 주입된 자기 인증만 사용하며 401/403 뒤 Board 권한으로 우회하지 않음

이전 custom Milestone delivery는 마이그레이션 이력으로 종료했다. 확인된 Milestone과 `PAP-18..22`는 완료했고, 전환 중 생성된 `PAP-27..28`은 취소했다. 폐기한 custom delivery 전제의 Backlog `PAP-4`, `PAP-5`, `PAP-7`, `PAP-13`, `PAP-23`도 취소했다. 이후 delivery는 별도 plugin phase, Root/child tool, review bridge 또는 단계별 Board confirmation을 사용하지 않는다.

`roles/*/AGENTS.md`는 적용 뒤 Paperclip 원본과 byte-for-byte 일치를 확인하는 current snapshot이다. 상세 ID, 검증과 남은 차이는 [current-state](current-state.md)와 [drift](drift.md)에 있다. 목표 계약은 `blueprint/role-instructions/*`와 [Ops Company 설계](../../docs/ops-company.md)에서 관리한다.
