# Autonomous Delivery Lifecycle

Delivery는 Paperclip native Issue, relation, blocker와 `executionPolicy`를 사용한다. Operation Control은 delivery 상태를 소유하지 않는다.

## 위험도와 Gate

| 위험도 | 예 | Gate |
|---|---|---|
| low | 문서, 테스트, 되돌릴 수 있는 작은 코드 수정 | 결정적 검사 + Agent review |
| medium | 일반 기능, 의존성 갱신, 내부 운영 변경 | 결정적 검사 + Agent review + 완료 알림 |
| high | production, 삭제, migration, 권한·secret, 외부 전송, 법무·비용 | Agent review 뒤 human approval |

불확실하면 한 단계 높인다. 인간 approval은 고위험 행동 직전에만 두며, 그 전의 구현과 검증을 막지 않는다.

## Native review policy

Product Steward는 코드와 사용자 산출물 Task를 만들 때 다음 형태의 native policy를 함께 기록한다.

```json
{
  "executionPolicy": {
    "commentRequired": true,
    "stages": [
      {
        "type": "review",
        "participants": [
          { "type": "agent", "agentId": "<independent-reviewer-id>" }
        ]
      }
    ]
  }
}
```

고위험 Task만 review stage 뒤에 user `approval` stage를 추가한다. 별도 `review-node`, Board evidence relay 또는 confirmation dashboard를 만들지 않는다.

executor는 작업이 끝나면 `PATCH /api/issues/:id`의 `{ "status": "in_review", "comment": "..." }`를 사용한다. reviewer는 `{ "status": "done" }`으로 승인하거나 `{ "status": "in_progress" }`로 수정 요청한다. Paperclip의 `executionState`, decision row와 wake가 audit 원본이다.

## Task description

```markdown
## Delivery
- Objective: <관찰 가능한 결과>
- Scope: <허용 파일·시스템>
- Verify: <명령 또는 판정 기준>
- Risk: low | medium | high — <이유>
```

Task가 기존 Goal과 Company Skill을 가리키므로 조직 설명, API 호출법과 전체 workflow를 description마다 복제하지 않는다.

## Git과 workspace

- shared workspace의 writer는 한 번에 한 명만 실행한다. 격리 worktree가 있으면 독립 작업을 병렬화한다.
- Git 변경 Task는 관련 파일만 stage하고 결정적 검증 뒤 focused commit을 만든다.
- reviewer는 같은 Task의 diff, commit과 검증 결과를 확인한다.
- remote push가 실제 배포·협업 계약에 필요한 Project에서만 push를 완료 조건으로 둔다.
- 별도 Git Milestone 보고서와 보고서 전용 commit은 만들지 않는다. Product Steward의 Goal 완료 comment가 요약 원본이다.

## 권한과 예외

- Agent는 주입된 자기 bearer, API key와 run context만 사용한다.
- 401/403은 권한 blocker이며 인증을 제거·교체해 Board actor로 상승하지 않는다.
- Board 전용 action은 human approval stage가 직접 소유한다. Agent Task에 Board action 재현을 넣지 않는다.
- 같은 acceptance 실패 두 번, scope·예산 변경, human-only permission 또는 안전한 rollback 부재만 Product Steward가 인간에게 escalation한다.
