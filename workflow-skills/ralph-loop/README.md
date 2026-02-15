# Ralph Loop

Top-level autonomous orchestrator. Implements PRD items through a quality pipeline.

## The Phases

**Per PRD Item:**

| Phase | Skills | Purpose |
|-------|--------|---------|
| 1. plan | `/plan` | Decompose task, design approach |
| 2. structure | `/structure` | Map architecture, define types |
| 3. implementation | `/implementation` | Write code from plan |
| 4. refactoring | `/refactoring` | Clean up under complexity budget |
| 5. deduplication | `/deduplication` | Consolidate duplicated code |
| 6. review | parallel scans (Gemini, Codex, AI smell) | Multi-model review, dedupe, fix |
| 7. testing | `/testing` | Write and run tests |
| 8. evaluation | `/evaluation` | Final review, write lessons |

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
