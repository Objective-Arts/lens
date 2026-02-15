# Workflow

Multi-step processes that modify code. Each follows a scan → fix → verify pattern.

## Skills

### Development Pipeline

| Skill | Purpose |
|-------|---------|
| `/plan` | Create implementation plan before coding |
| `/structure` | Design types/interfaces first |
| `/implementation` | Write code from approved plan |
| `/testing` | Write and run tests |

### Full Pipeline (Design → Build → Refine → Review → Verify)

| Skill | Purpose |
|-------|---------|
| `/build` | New feature with full quality pipeline |
| `/improve` | Refine existing code with full pipeline |

### Light Workflows

| Skill | Purpose |
|-------|---------|
| `/quick-change` | Simple changes + cleanup |

### Quality Skills

| Skill | Purpose |
|-------|---------|
| `/refactoring` | Clean up and simplify code |
| `/ai-smell-review` | Remove AI-generated code smells |
| `/gemini-review` | Gemini review + fix all issues |
| `/qodana-review` | Qodana analysis + fix all issues |
| `/deduplication` | Consolidate duplicated code |

### Finalization

| Skill | Purpose |
|-------|---------|
| `/codex-review` | Codex review + fix all issues |
| `/security-review` | Security audit + fix issues |
| `/evaluation` | Final external review via Codex + Gemini |

## Usage

```bash
/plan auth-system      # Plan a feature
/structure              # Design types from plan
/implementation               # Implement from plan
/testing unit             # Write unit tests

/build user-auth              # New feature (full pipeline)
/improve src/component.ts     # Improve existing (full pipeline)
/quick-change add email field  # Simple change + cleanup
/refactoring src/      # Refactor with verification
/ai-smell-review src/            # Remove AI patterns
/gemini-review src/              # Gemini review + fix
```

## All Workflows Modify Code

Every skill in this directory will make changes. Use `utils/` for read-only analysis.
