# AI 시대 제품팀의 5가지 역할

## 문서 개요

- 작성일: 2026-07-15
- 주제: Boris Cherny가 Claude Code 팀에서 관찰한 5가지 역할 원형
- 성격: Anthropic의 공식 직무체계가 아닌 제품 운영 분석 프레임

## 핵심 요약

이 5가지는 새로운 직무명이 아니라, 제품의 생애주기와 당면 과제에 따라 한 사람이 수행하는 업무 모드다. 전통적인 엔지니어·PM·디자이너·데이터 사이언티스트의 구분보다, 지금 어떤 문제를 해결하고 있는지가 더 중요하다는 관점이다.

AI는 구현 비용을 낮추지만 판단 비용까지 없애지는 않는다. 따라서 앞으로의 병목은 코드를 얼마나 빨리 쓰느냐보다 무엇을 만들고, 무엇을 버리고, 무엇을 계속 운영할지를 결정하는 능력에 가까워진다.

## 5가지 역할

### 1. Prototyper — 가능성을 탐색하는 사람

짧은 시간에 여러 아이디어와 접근법을 만들어 가능성을 확인한다. 대부분의 결과물이 출시되지 않는 것은 실패가 아니라 역할의 전제다.

핵심 질문은 다음과 같다.

> 이 아이디어는 실제로 존재할 가치가 있는가?

필요한 역량은 완성도 높은 결과물을 만드는 능력보다 빠른 실험, 비교, 폐기 판단이다. 주의할 점은 실험 개수 자체를 성과로 착각하지 않는 것이다.

### 2. Builder — 아이디어를 제품으로 만드는 사람

살아남은 프로토타입이나 아이디어를 실제 사용자와 운영 환경을 견딜 수 있는 제품·인프라로 전환한다.

여기에는 실제 데이터 흐름, 오류 처리, 보안과 권한, 테스트, 배포, 확장성이 포함된다. 데모를 만드는 능력과 운영 가능한 제품을 만드는 능력은 서로 다르다.

핵심 질문은 다음과 같다.

> 이 결과물을 실제 사용자가 안전하게 사용할 수 있는가?

### 3. Sweeper — 복잡성을 제거하는 사람

UI와 코드를 정리하고, 시스템을 단순화하며, 성과가 낮은 기능을 제거하고, 성능을 개선한다.

AI로 기능을 만드는 비용이 낮아질수록 제품은 쉽게 비대해진다. Sweeper는 기능 수를 늘리는 대신 유지보수 비용, 사용자 인지 부담, 기술 부채를 줄인다.

핵심 질문은 다음과 같다.

> 이 기능과 복잡성이 계속 존재할 이유가 있는가?

이 역할은 눈에 띄는 신규 기능을 만들지 않기 때문에 평가와 보상에서 소외되기 쉽지만, 빠르게 성장하는 팀일수록 중요하다.

### 4. Grower — 제품을 시장에 맞추는 사람

출시된 제품이 사용자에게 실제로 반복 사용되도록 개선하고, 제품-시장 적합성(Product-Market Fit)을 높인다.

사용자 행동, 이탈 지점, 반복 사용 여부, 고객 피드백을 관찰하고 가설을 세운 뒤 빠르게 개선한다. 단순히 기능을 추가하는 역할이 아니라, 제품이 사용자에게 왜 충분히 가치 있지 않은지를 찾아 해결하는 역할이다.

핵심 질문은 다음과 같다.

> 무엇이 사용자가 이 제품을 다시 사용하게 만드는가?

### 5. Maintainer — 제품을 오래 살리는 사람

성숙한 시스템을 안전하고, 안정적이고, 빠르고, 효율적으로 운영한다.

보안, 장애 대응, 성능, 비용, 운영 자동화, 기술 부채, 확장성을 책임진다. 성숙한 제품에서는 신규 기능보다 신뢰성과 운영 품질이 더 큰 사용자 가치를 만들 수 있다.

핵심 질문은 다음과 같다.

> 사용자가 의존하는 시스템을 계속 믿을 수 있게 유지할 수 있는가?

## 제품 단계별 역할 조합

| 제품 상태 | 필요한 역할 조합 | 주된 관심사 |
|---|---|---|
| 초기·PMF 이전 | Prototyper + Builder + Sweeper | 여러 가능성 탐색, 빠른 구현, 조기 정리 |
| 성장·PMF 확보 | Builder + Sweeper + Grower + 일부 Maintainer | 제품화, 사용자 적합성, 운영 기반 확보 |
| 성숙·강한 PMF | Sweeper + Grower + Maintainer + 일부 Builder | 단순화, 성장 지속, 안정성과 효율 |

역할은 순서대로 한 번씩 끝나는 단계가 아니다. 특히 Sweeper와 Maintainer는 모든 단계에서 필요하며, 한 사람이 한 주 안에서도 여러 역할을 오갈 수 있다.

## 이 관점의 중요한 의미

### 1. 직무보다 기여 방식이 중요해진다

디자이너가 Prototyper나 Sweeper가 될 수 있고, PM이 Builder나 Grower가 될 수 있다. 역할은 소속 부서보다 실제로 수행하는 일에 의해 정해진다.

### 2. 개발 속도보다 선택의 질이 중요해진다

프로토타입을 몇 시간 만에 만들 수 있다면, 병목은 구현이 아니라 평가가 된다. 많은 결과물 중 확장할 가치가 있는 것을 고르는 판단력이 핵심 역량이 된다.

### 3. 삭제 능력도 제품 역량이다

빠른 팀은 만드는 능력만으로 강해지지 않는다. 필요 없는 기능을 제거하고 시스템을 작게 유지해야 다음 변경도 빨라진다.

### 4. 운영은 별도의 핵심 역량이다

AI가 생성 속도를 높여도 보안, 장애, 데이터 손실, 비용 폭증 같은 운영 문제는 사라지지 않는다. Maintainer를 생략하면 빠른 개발이 빠른 장애로 이어질 수 있다.

## Ops 시스템을 위한 풀스펙

이 저장소에서는 5가지를 고정된 직급이나 초기 팀 구성으로 해석하지 않는다. **작업 분류와 실행 계약을 위한 delivery role**로 사용한다. 역할별 Agent 수는 `1..N`이며 backlog, 제품 단계, 예산, review capacity와 workspace 격리에 따라 자유롭게 늘리거나 줄인다.

5개 delivery role 위에는 제품 산출물을 직접 만들지 않는 **Product Steward**를 둔다. Product Steward는 여섯 번째 제품 역할이 아니라 Board 요청을 Goal, Task, keep/kill, review와 approval로 연결하는 orchestration role이다.

```text
Board
└── Product Steward
    ├── Prototyper 1..N
    ├── Builder 1..N
    ├── Sweeper 1..N
    ├── Grower 1..N
    └── Maintainer 1..N
```

### Role별 실행 계약

| Role | Entry gate | 대표 산출물 | Exit gate | 기본 독립 검토 |
|---|---|---|---|---|
| Prototyper | 문제, 평가 기준, 실험 경계 | 후보 비교, Prototype, keep/kill 근거 | keep 또는 kill 판단 가능 | Product Steward |
| Builder | keep된 Prototype 또는 승인 계약 | 제품 코드, 테스트, rollback 근거 | 인수 기준과 최소 검증 통과 | Sweeper 또는 Maintainer |
| Sweeper | 사용·복잡성·성능 근거 | 삭제, 단순화, 전후 측정 | 회귀 없이 복잡성 감소 | Maintainer |
| Grower | baseline, 가설, 성공 지표 | eval, 실험 결과, 전환 제안 | 지표 기반 keep/kill/다음 역할 결정 | Product Steward |
| Maintainer | SLO·보안·비용 기준, 재현 절차 | 운영 변경, 복구, runbook 근거 | 신뢰성 검증과 rollback 확보 | Builder 또는 Sweeper |

모든 Task는 delivery role label 하나, 담당 Agent 한 명, Objective, Entry gate, Exit gate, Evidence와 Next를 가져야 한다. production 변경은 작성자와 다른 reviewer를 두고, 고위험 변경과 Goal 전환은 Board approval을 추가한다.

### Agent 수를 바꾸는 기준

Agent 수는 조직도의 자리가 아니라 처리 능력이다.

- 같은 role backlog가 지속적으로 쌓이고 서로 독립된 workspace를 줄 수 있으면 scale-out한다.
- reviewer가 부족하거나 shared workspace writer가 겹치면 Agent 수보다 병렬 실행을 먼저 제한한다.
- role backlog가 사라지면 Agent를 idle, pause 또는 종료하되 역할 표준은 유지한다.
- 한 Agent가 여러 역할을 수행할 수는 있지만 Task마다 활성 role label은 하나만 사용한다.
- 새 Agent는 같은 role instruction을 복제하되 책임 범위, 예산, workspace와 reviewer를 명시한다.

## Paperclip 제약에 맞춘 표현

Paperclip `2026.707.0`에서는 다음과 같이 매핑한다.

| 표준 Role | Paperclip 내장 role enum | 실제 의미를 담는 위치 |
|---|---|---|
| Product Steward | `ceo` | name, title, capabilities, `AGENTS.md` |
| Prototyper | `researcher` | 동일 + `role:prototyper` label |
| Builder | `engineer` | 동일 + `role:builder` label |
| Sweeper | `qa` | 동일 + `role:sweeper` label |
| Grower | `pm` | 동일 + `role:grower` label |
| Maintainer | `devops` | 동일 + `role:maintainer` label |

주요 제약과 대응은 다음과 같다.

- custom role string을 허용하지 않으므로 내장 enum은 호환용으로만 사용한다.
- Agent에는 `reportsTo`가 하나뿐이므로 모든 delivery role은 Product Steward에게 직접 보고한다.
- 신규 Agent는 Product Steward가 생성 요청을 만들고 Board approval을 통과시킨다.
- 역할 전환은 별도 상태 머신 대신 Task label, assignee, `executionPolicy` review/approval stage로 표현한다.
- 기본 Project workspace는 shared이고 writer는 동시에 한 명만 둔다.
- Prototyper의 코드 실험은 `isolated_workspace`에서만 허용한다. 격리가 불가능하면 Issue Document, attachment 또는 work product를 사용한다.
- Operation Control은 owner 한 명만 유지하므로 Maintainer 한 명이 Maintenance owner가 되고, 정상 복귀 후 다른 Agent가 독립 검토한다.

상세 표준은 [Role Blueprint](../blueprint/roles.md)와 [Delivery Lifecycle](../blueprint/delivery-lifecycle.md)에 있다.

## AllNewMTS 적용 결과

2026-07-15 기준 AllNewMTS Company에는 Product Steward와 5개 delivery role을 각각 한 명씩 배치했다. 기존 Agent ID를 가능한 한 재사용하고 Sweeper만 Board 승인으로 새로 채용했다.

- Product Steward만 Task 배정, Agent 생성 요청과 Skill 생성 권한을 가진다.
- 다섯 delivery role은 서로 Task를 배정하지 않는다.
- 기존 스펙·조사 backlog는 Prototyper, 구현 backlog는 Builder로 재배정했다.
- Prototyper Task는 Product Steward, Builder Task는 Sweeper review stage를 갖는다.
- Goal 전환 Task는 `local-board` approval stage를 갖는다.
- 다섯 role label과 Issue workspace override를 생성·활성화했다.
- AllNewMTS 저장소에는 Git `HEAD`가 없어 isolated workspace 코딩은 아직 사용할 수 없으며 Prototyper는 artifact-only로 동작한다.

현재값 스냅샷은 [AllNewMTS Reference](../references/allnewmts/README.md)에 있다.

## 한계와 비판

### Discovery와 전략이 명시적으로 빠져 있다

5가지 역할은 아이디어를 만들고 제품으로 전환하는 과정은 잘 보여주지만, 애초에 어떤 고객 문제를 풀어야 하는지 결정하는 역할은 약하게 다룬다. 따라서 Prototyper 이전에 문제 탐색과 전략 판단이 필요하다.

### “PRD가 사라진다”는 해석은 주의해야 한다

Build-first는 문서가 불필요하다는 뜻이 아니다. 프로토타입, PR, 평가 기준, 테스트, 사용자 피드백, 변경 기록이 기존 PRD의 기능을 나눠 맡는 것이다. 형식은 바뀌어도 의도와 검증 기준은 필요하다.

### Anthropic의 환경을 일반화하면 안 된다

Claude Code 팀은 기술 역량이 높고, AI 도구와 모델에 직접 접근하며, 빠른 실험과 폐기가 가능한 환경이다. 대규모 조직에서는 권한, 보안, 예산, 승인 절차 때문에 동일한 속도를 그대로 적용하기 어렵다.

## 실무 적용 질문

팀이나 프로젝트를 점검할 때 다음 질문을 사용할 수 있다.

1. 우리는 지금 어떤 역할 모드에 있는가?
2. 우리 팀에 가장 부족한 역할은 무엇인가?
3. 최근 만든 것 중 무엇을 폐기해야 하는가?
4. 프로토타입을 제품으로 넘길 기준은 무엇인가?
5. 사용자 가치와 운영 안정성을 어떻게 측정할 것인가?

## 결론

이 프레임의 핵심은 조직도를 5개 직무로 바꾸자는 것이 아니다. 제품의 현재 상태에 맞춰 사람과 시간을 배치하고, 한 사람이 필요에 따라 여러 역할을 수행하도록 하자는 제안이다.

가장 현실적인 해석은 다음과 같다.

> AI 시대의 좋은 제품 인력은 단순히 빠르게 만드는 사람이 아니라, 탐색하고 만들고 줄이고 키우고 오래 운영할 수 있는 사람이다.

## 출처

- [Aakash Gupta의 LinkedIn 게시물](https://www.linkedin.com/posts/aagupta_boris-cherny-just-mapped-the-5-roles-forming-share-7477457566609055744-Fe8t/)
- [Boris Cherny의 원래 X 게시물](https://x.com/bcherny/status/2071379474277613732)
- [Aakash Gupta의 상세 해설](https://aakashgupta.medium.com/anthropics-claude-code-team-has-5-roles-and-zero-job-titles-bf4860a389fc)
