# 프로젝트 구조

이 저장소의 상세 디렉토리 트리입니다.

```text
.
├── .agent/
│   ├── config/
│   │   └── user-preferences.yaml   # 언어, 타임존, CLI 매핑
│   ├── workflows/
│   │   ├── coordinate.md           # /coordinate (UI 기반 멀티 에이전트 조율)
│   │   ├── orchestrate.md          # /orchestrate (CLI 자동 병렬 실행)
│   │   ├── plan.md                 # /plan (PM 태스크 분해)
│   │   ├── review.md               # /review (전체 QA 파이프라인)
│   │   ├── debug.md                # /debug (구조화된 버그 수정)
│   │   ├── setup.md                # /setup (CLI & MCP 설정)
│   │   └── tools.md                # /tools (MCP 도구 관리)
│   └── skills/
│       ├── _shared/                    # 공통 리소스 (스킬 아님)
│       │   ├── serena-memory-protocol.md
│       │   ├── common-checklist.md
│       │   ├── skill-routing.md
│       │   ├── context-loading.md
│       │   ├── context-budget.md
│       │   ├── reasoning-templates.md
│       │   ├── clarification-protocol.md
│       │   ├── difficulty-guide.md
│       │   ├── lessons-learned.md
│       │   ├── verify.sh
│       │   └── api-contracts/
│       ├── workflow-guide/             # 멀티 에이전트 조율
│       ├── pm-agent/                   # 프로덕트 매니저
│       ├── frontend-agent/             # React/Next.js
│       ├── backend-agent/              # FastAPI
│       ├── mobile-agent/               # Flutter
│       ├── qa-agent/                   # 보안 & QA
│       ├── debug-agent/                # 버그 수정
│       ├── orchestrator/               # CLI 기반 서브에이전트 실행
│       └── commit/                     # Conventional Commits 스킬
│       # 각 스킬 구조:
│       #   SKILL.md              (~40줄, 토큰 최적화)
│       #   resources/
│       #     ├── execution-protocol.md  (Chain-of-thought 단계)
│       #     ├── examples.md            (Few-shot 입출력 예시)
│       #     ├── checklist.md           (셀프 검증)
│       #     ├── error-playbook.md      (장애 복구)
│       #     ├── tech-stack.md          (기술 스택 상세)
│       #     └── snippets.md            (코드 스니펫)
├── .serena/
│   └── memories/                   # 런타임 상태 (gitignore 처리됨)
├── package.json
├── docs/
│   ├── USAGE.md                    # 상세 사용 가이드 (영문)
│   ├── USAGE.ko.md                 # 상세 사용 가이드 (한글)
│   ├── project-structure.md        # 전체 구조 참조 (영문)
│   └── project-structure.ko.md     # 전체 구조 참조 (한글)
├── README.md                       # 영문 가이드
└── README.ko.md                    # 한글 가이드
```
