---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# How to Use the Build/Improve Pipeline

## Prerequisites

- Claude Code CLI installed
- Project configured with a profile
- Workflow skills installed (`lens workflow install`)

## Choosing Your Workflow

| Situation | Command | Phases |
|-----------|---------|--------|
| New feature from scratch | `/build` | 9 phases |
| Improve existing code | `/improve` | 9 phases |
| Simple change (add field, rename) | `/quick-edit` | Checklist only |
| Post-edit cleanup | `/quick-clean` | Smell check only |
| Pre-PR polish | `/final-polish` | Review checklist |

## Using /build

Build a new feature through the full 9-phase quality pipeline:

```
/build user authentication system
/build src/components/DatePicker
```

### What Happens

| # | Phase | Purpose |
|---|-------|---------|
| 1 | create-plan | Design approach, scope, files, risks |
| 2 | structure-first | Define data structures and interfaces |
| 3 | implement-plan | Write the code |
| 3.5 | *machine gate* | `npm run build && npm test` |
| 4 | refactor-check-fix | Enforce constraints (30 lines/fn, 300 lines/file) |
| 5 | dedupe-fix | Consolidate duplicated code |
| 6 | gemini-fix | External code review + product quality via Gemini |
| 6.5 | *machine gate* | Qodana scan; Haiku fixer only if issues found |
| 7 | adversarial-security-review | Security audit (attacker mindset) |
| 8 | write-tests-run | Write and run tests |
| 9 | ai-smell-fix | Remove AI-generated antipatterns |
| 9.5 | *machine gate* | `npm test` + quality-gate (final) |

### Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the 9 phases without executing |
| `--rollback` | Restore from last build stash |

### Dry Run

Preview what will happen:

```
/build user dashboard --dry-run
```

### Rollback

If the build produces unwanted changes:

```
/build --rollback
```

This restores from the git stash created at the start.

## Using /improve

Same 9-phase pipeline, but focused on existing code:

```
/improve src/services/auth/
/improve src/components/Button.tsx
```

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the 9 phases without executing |
| `--rollback` | Restore from last improve stash |

## Using Individual Phase Skills

You can run any phase skill directly without the full pipeline:

```
/create-plan add password reset feature
/structure-first src/services/
/implement-plan PasswordResetService
/refactor-check-fix src/features/auth
/dedupe-fix src/services/
/gemini-fix src/features/auth
/qodana-fix src/
/adversarial-security-review src/features/auth
/write-tests-run unit
/ai-smell-fix src/services/
```

## Using Read-Only Scans

Assess code quality without making changes:

```
/gemini-scan src/features/auth    # Gemini review (report only)
/qodana-scan src/                 # Static analysis (report only)
/ai-smell-scan src/services/      # AI code patterns (report only)
/refactor-scan src/services/      # Refactoring opportunities
/dedupe-scan src/services/        # Duplicate code detection
/naming-review src/app/           # Name clarity check
```

## Quick Workflows

### /quick-edit

For simple changes that don't need the full pipeline:

```
/quick-edit add email field to User model
/quick-edit rename processData to parseUserInput
```

If the change touches 5+ files or has design decisions, use `/build` or `/improve` instead.

### /quick-clean

Fast AI smell cleanup after code changes:

```
/quick-clean src/services/
```

## Typical Development Session

```bash
# 1. Plan the work
/create-plan add user password reset

# 2. Design types first
/structure-first

# 3. Implement from plan
/implement-plan PasswordResetService

# 4. Clean up
/refactor-check-fix src/features/password-reset
/ai-smell-fix src/features/password-reset

# 5. External validation
/gemini-fix src/features/password-reset
/qodana-fix src/features/password-reset

# 6. Security check
/adversarial-security-review src/features/password-reset

# 7. Test
/write-tests-run unit

# 8. Document
/generate-docs src/features/password-reset
```

Or use the pipeline to do it all in one command:

```
/build user password reset
```

## See Also

- [Workflow Skills Reference](../../WORKFLOW-SKILLS.md)
- [Configure Ralph Loop](configure-ralph-loop.md) — for autonomous PRD implementation
- [Canon Loading Strategy](../reference/canon-loading-strategy.md)
