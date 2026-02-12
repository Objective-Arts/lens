# Ralph Loop

Top-level autonomous orchestrator. Implements PRD items through a quality pipeline.

## The Stages

**Per PRD Item (Design → Build → Refine → Review → Verify):**

| Stage | Skills | Purpose |
|-------|--------|---------|
| Design | `/create-plan`, `/structure-first` | Plan and map architecture |
| Build | `/implement-plan` | Write code from plan |
| Refine | `/refactor-check-fix`, `/dedupe-fix` | Clean up, consolidate |
| Review | `/gemini-fix`, `/qodana-fix`, `/adversarial-security-review` | External review + security |
| Verify | `/write-tests-run`, `/generate-docs` | Test and document |

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
