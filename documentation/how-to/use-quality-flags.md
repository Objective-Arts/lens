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

| Situation | Command | Pipeline |
|-----------|---------|----------|
| New feature from scratch | `/build` | Full (5 stages + learn) |
| Improve existing code | `/improve` | Full (5 stages + learn) |
| Simple change (add field, rename) | `/quick-edit` | Checklist only |
| Post-edit cleanup | `/quick-clean` | Smell check only |
| Pre-PR polish | `/final-polish` | Review checklist |

## Using /build

Build a new feature through the full quality pipeline (Design → Build → Refine → Review → Verify):

```
/build user authentication system
/build src/components/DatePicker
```

### What Happens

| Stage | Skills | Purpose |
|-------|--------|---------|
| **Design** | create-plan, structure-first | Design approach, scope, data structures |
| *gate* | *machine check* | *Build + test verification* |
| **Build** | implement-plan | Write the code |
| *gate* | *machine check* | *Lint, quality-gate, smoke test* |
| **Refine** | refactor-check-fix, dedupe-fix | Enforce constraints, consolidate |
| **Review** | gemini-fix, codex-fix, adversarial-security-review, ai-smell-fix | Multi-model review, security audit |
| *gate* | *machine check* | *Qodana scan, smoke test* |
| **Verify** | write-tests-run, final-eval-check | Tests, evaluation, lessons |
| *gate* | *machine check* | *Final test + quality-gate* |
| **Learn** | *(automatic)* | Findings written for future runs |

### Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the stages and phases without executing |
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

Same 5-stage pipeline, but focused on existing code:

```
/improve src/services/auth/
/improve src/components/Button.tsx
```

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the stages and phases without executing |
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

# 5. External validation
/gemini-fix src/features/password-reset
/qodana-fix src/features/password-reset

# 6. Security check + AI smell removal
/adversarial-security-review src/features/password-reset
/ai-smell-fix src/features/password-reset

# 7. External evaluation
/final-eval-check src/features/password-reset

# 8. Test (final inspection — ALWAYS LAST)
/write-tests-run unit

# 9. Document
/generate-docs src/features/password-reset
```

Or use the pipeline to do it all in one command:

```
/build user password reset
```

## See Also

- [Configure Ralph Loop](configure-ralph-loop.md) — for autonomous PRD implementation
