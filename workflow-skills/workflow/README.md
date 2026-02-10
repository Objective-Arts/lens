# Workflow

Multi-step processes that modify code. Each follows a scan → fix → verify pattern.

## Skills

### Development Pipeline

| Skill | Purpose |
|-------|---------|
| `/create-plan` | Create implementation plan before coding |
| `/structure-first` | Design types/interfaces first |
| `/implement-plan` | Write code from approved plan |
| `/write-tests-run` | Write and run tests |

### Heavy Workflows (9 phases)

| Skill | Purpose |
|-------|---------|
| `/build` | New feature with full quality pipeline |
| `/improve` | Refine existing code with full pipeline |

### Light Workflows (no phases)

| Skill | Purpose |
|-------|---------|
| `/quick-edit` | Simple changes (add field, rename, fix) |
| `/quick-clean` | Fast AI smell cleanup |

### Quality Skills

| Skill | Purpose |
|-------|---------|
| `/refactor-check-fix` | Clean up and simplify code |
| `/ai-smell-fix` | Remove AI-generated code smells |
| `/gemini-fix` | Gemini review + fix all issues |
| `/qodana-fix` | Qodana analysis + fix all issues |
| `/dedupe-fix` | Consolidate duplicated code |

### Finalization

| Skill | Purpose |
|-------|---------|
| `/adversarial-security-review` | Security audit + fix issues |
| `/final-polish` | Final refinement for senior review |

## Usage

```bash
/create-plan auth-system      # Plan a feature
/structure-first              # Design types from plan
/implement-plan               # Implement from plan
/write-tests-run unit             # Write unit tests

/build user-auth              # New feature (9 phases)
/improve src/component.ts     # Improve existing (9 phases)
/quick-edit add email field   # Simple change
/quick-clean src/             # Fast cleanup
/refactor-check-fix src/      # Refactor with verification
/ai-smell-fix src/            # Remove AI patterns
/gemini-fix src/              # Gemini review + fix
```

## All Workflows Modify Code

Every skill in this directory will make changes. Use `utils/` for read-only analysis.
