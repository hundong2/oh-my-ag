# Project Structure

Detailed directory tree for this repository.

```text
.
├── .agent/
│   ├── config/
│   │   └── user-preferences.yaml   # Language, timezone, CLI mapping
│   ├── workflows/
│   │   ├── coordinate.md           # /coordinate (multi-agent orchestration via UI)
│   │   ├── orchestrate.md          # /orchestrate (automated CLI parallel execution)
│   │   ├── plan.md                 # /plan (PM task decomposition)
│   │   ├── review.md               # /review (full QA pipeline)
│   │   ├── debug.md                # /debug (structured bug fixing)
│   │   ├── setup.md                # /setup (CLI & MCP configuration)
│   │   └── tools.md                # /tools (MCP tool management)
│   └── skills/
│       ├── _shared/                    # Common resources (not a skill)
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
│       ├── workflow-guide/             # Multi-agent coordination
│       ├── pm-agent/                   # Product manager
│       ├── frontend-agent/             # React/Next.js
│       ├── backend-agent/              # FastAPI
│       ├── mobile-agent/               # Flutter
│       ├── qa-agent/                   # Security & QA
│       ├── debug-agent/                # Bug fixing
│       ├── orchestrator/               # CLI-based sub-agent spawner
│       └── commit/                     # Conventional commits skill
│       # Each skill has:
│       #   SKILL.md              (~40 lines, token-optimized)
│       #   resources/
│       #     ├── execution-protocol.md  (chain-of-thought steps)
│       #     ├── examples.md            (few-shot input/output)
│       #     ├── checklist.md           (self-verification)
│       #     ├── error-playbook.md      (failure recovery)
│       #     ├── tech-stack.md          (detailed tech specs)
│       #     └── snippets.md            (copy-paste patterns)
├── .serena/
│   └── memories/                   # Runtime state (gitignored)
├── package.json
├── docs/
│   ├── USAGE.md                    # Detailed usage guide (English)
│   ├── USAGE.ko.md                 # Detailed usage guide (Korean)
│   ├── project-structure.md        # Full structure reference (English)
│   └── project-structure.ko.md     # Full structure reference (Korean)
├── README.md                       # This file (English)
└── README.ko.md                    # Korean guide
```
