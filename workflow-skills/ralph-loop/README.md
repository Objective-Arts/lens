# Ralph Loop

Top-level autonomous orchestrator. Implements PRD items through a quality pipeline.

## The Phases

**Per PRD Item:**

| Phase | Skill | Purpose |
|-------|-------|---------|
| 1 | `/create-plan` | Create implementation plan |
| 2 | `/structure-first` | Map architecture or design types |
| 3 | `/implement-plan` | Write code from plan |
| 4 | `/refactor-check-fix` | Clean up code |
| 5 | `/dedupe-fix` | Consolidate duplicates |
| 6 | `/gemini-fix` | Gemini review, fix ALL issues |
| 7 | `/qodana-fix` | Qodana analysis, fix ALL issues |
| 8 | `/adversarial-security-review` | Security audit via Gemini |
| 9 | `/write-tests-run` | Write tests, all must pass |
| 10 | `/generate-docs` | Document public APIs |

## Usage

```bash
/ralph-loop PRD.md            # Run all phases per PRD item
/ralph-loop --max 30          # Limit iterations
/ralph-loop --resume          # Continue from last session
/ralph-loop --external        # Enable Gemini + Qodana post-loop
/ralph-loop --dry-run         # Show what would be done
```

## Skill

- `ralph-loop/` - The orchestrator skill
