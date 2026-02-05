---
name: phase-loop
description: Run 9-phase quality pipeline on any target. Supports rollback.
---

# /phase-loop [path] [--rollback] [--dry-run]

Run all quality phases against a class, component, or directory. Full pipeline with rollback support.

## Usage

```
/phase-loop src/components/Button.tsx
/phase-loop src/services/auth/
/phase-loop src/models/User.ts --dry-run
/phase-loop --rollback
```

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show what would change without modifying |
| `--rollback` | Restore from last phase-loop stash |

## First: Create Rollback Point

**Before any changes:**

```bash
git stash push -m "phase-loop:$(basename $TARGET):$(date +%s)"
echo "Rollback point created. Use '/phase-loop --rollback' to restore."
```

## The 9 Phases

| # | Skill | Purpose |
|---|-------|---------|
| 1 | create-plan | Analyze target, identify issues |
| 2 | structure-first | Map architecture, design improvements |
| 3 | implement-plan | Apply fixes and improvements |
| 4 | refactor-check-fix | Clean up, apply patterns |
| 5 | dedupe-fix | Consolidate duplicated code |
| 6 | gemini-fix | Gemini review, fix ALL issues |
| 7 | qodana-fix | Static analysis, fix ALL issues |
| 8 | adversarial-security-review | Security audit, fix vulnerabilities |
| 9 | write-tests-run | Write/update tests, all must pass |

**Skipped:** generate-docs (run separately if needed)

## Execution

```
# Create rollback point
git stash push -m "phase-loop:$TARGET:$(date +%s)"

for each phase in [create-plan, structure-first, implement-plan, refactor-check-fix,
                   dedupe-fix, gemini-fix, qodana-fix, adversarial-security-review,
                   write-tests-run]:
    run_phase(target_path)
    if phase_has_issues:
        fix_issues()
        re-run_phase()  # Loop until clean

# Mark complete
echo "phase-loop:complete:$(date)" >> .claude/phase-loop.log
```

## Quality Gates

Each phase must pass before moving to the next:

| Phase | Pass Criteria |
|-------|---------------|
| create-plan | Clear analysis documented |
| structure-first | Architecture mapped, target state defined |
| implement-plan | Changes applied |
| refactor-check-fix | Code clean, patterns applied |
| dedupe-fix | No duplicate code patterns |
| gemini-fix | 0 CRITICAL/HIGH issues |
| qodana-fix | 0 CRITICAL/HIGH issues |
| adversarial-security-review | No vulnerabilities found |
| write-tests-run | All tests pass |

## Rollback

To undo all changes from the last phase-loop:

```bash
/phase-loop --rollback
```

This runs:
```bash
git stash list | grep "phase-loop:" | head -1
git stash pop
```

## Output

```
Phase Loop: src/components/Button.tsx
  Rollback point created (stash@{0})

  1. create-plan → Identified 3 improvements
  2. structure-first → Mapped dependencies, designed extraction
  3. implement-plan → Applied changes
  4. refactor-check-fix → Extracted hook, simplified render
  5. dedupe-fix → Consolidated 2 patterns
  6. gemini-fix → 2 issues fixed
  7. qodana-fix → 1 issue fixed
  8. adversarial-security-review → No issues
  9. write-tests-run → 4 tests, all pass
  ✓ Complete

Rollback available: /phase-loop --rollback
```

## When to Use

- Improving a single component or file
- Quality pass on a directory/module
- Targeted refactoring with safety net
- Pre-commit quality check on changed files

## vs ralph-loop

| Feature | phase-loop | ralph-loop |
|---------|------------|------------|
| Target | File, class, or directory | Full PRD |
| Phases | 9 (skips docs) | 10 (full) |
| Rollback | Yes (git stash) | No |
| Loop behavior | One pass per target | Until PRD complete |

## Directory Behavior

When targeting a directory:
- Phases run on the directory as a unit
- Architecture mapping covers all files
- Tests cover the module boundary
