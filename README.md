# PaperClip-Ops

Paperclip 위에 재사용 가능한 AI Company를 설계하고 운영하기 위한 기준 저장소다. 특정 제품 설정은 범용 Blueprint의 검증 사례로만 보관한다.

## 구조

```text
PaperClip-Ops/
├── blueprint/              # 모든 AI Company에 적용할 설계 계약
├── references/allnewmts/  # 3100 서버에서 수집한 실제 사례
├── docs/                   # 전체 설계 지도와 운영 상태 모델
└── plugins/                # 범용 운영 기능
```

- [AI Company Blueprint](blueprint/README.md): 범용 Company 구성 원칙과 설정 순서
- [Role Blueprint](blueprint/roles.md): 공통 Role, 책임과 권한
- [Company Skill Blueprint](blueprint/company-skill.md): 도메인 지식을 분리하는 기준
- [설계 지도](docs/design-map.md): Blueprint와 Company Profile의 경계
- [운영 상태](docs/architecture.md): `normal`/`holding`/`maintenance`
- [AllNewMTS Reference](references/allnewmts/README.md): 현재 서버 설정과 원본 스냅샷
- [Operation Control](plugins/operation-control/README.md): `drain`/`immediate` 정지 플러그인
- [Ops System Test](tests/system/README.md): 실제 OpenCode Agent를 사용하는 black-box 운영 계약 테스트

## 플러그인 개발

```bash
cd /Users/chanheekim/Dev/PaperClip-Ops/plugins/operation-control
npm ci
npm test
```

현재 플러그인은 위 local path에서 설치되어 있다. 코드 변경 후 Paperclip에서 Disable/Enable하면 빌드된 worker를 다시 읽는다.
