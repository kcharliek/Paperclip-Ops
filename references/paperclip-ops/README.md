# Paperclip Ops Reference

이 문서는 [Paperclip Ops Company 목표 설계](../../docs/ops-company.md)를 Paperclip `2026.707.0`에 적용한 현재값의 요약이다. 확인 기준은 2026-07-16, local instance `127.0.0.1:3100`이다.

- Company: Paperclip Ops / `82f74ffb-1693-4b90-a5cf-b88c05e19b26` / prefix `PAP`
- Company Goal: AI Company Ops 시스템을 지속 개선하고 검증된 운영 표준을 제공한다
- Project와 workspace: Paperclip Ops / `/Users/chanheekim/Dev/Paperclip-Ops`
- 조직: Ops Steward 직속 System Auditor, Builder, Sweeper, Maintainer
- Operation Control: `normal`, 시간당 run 20회, 아직 adopted delivery Goal 없음
- Routine: `System Improvement Review` 주 1회, `Company Integrity Check` 6시간마다

System Improvement Review의 첫 수동 실행 `PAP-1`은 성공했고 source/config 변경 없이 `PAP-2..4` 세 건을 Backlog로 만들었다. 상세 ID와 남은 차이는 [current-state](current-state.md)와 [drift](drift.md)에 있다.

`roles/*/AGENTS.md`는 적용 뒤 Paperclip 원본을 다시 읽어 저장한 current snapshot이다. 목표 계약은 `blueprint/role-instructions/*`와 [Ops Company 설계](../../docs/ops-company.md)에서 관리한다.
