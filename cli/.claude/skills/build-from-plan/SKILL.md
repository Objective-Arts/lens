---
name: build-from-plan
description: Implement code from an approved plan. Use after /plan or /structure-first to execute the design.
---

# /build-from-plan [plan-file]

Implement code from an approved plan file. Executes exactly per the plan without re-exploring.

## When to Use

- After `/plan` has been approved
- After `/structure-first` has defined the data structures
- When resuming work on a partially-implemented plan
- For complex features that need disciplined execution

## When NOT to Use

- Simple tasks that don't need a plan
- When the plan hasn't been approved yet
- When requirements have changed (update plan first)

## Process

1. **Load Plan** - Read the plan file from `.claude/plans/` or specified path
2. **Verify Approval** - Confirm plan was approved
3. **Execute Steps** - Implement each step in order
4. **Track Progress** - Mark completed steps
5. **Report** - Show implementation progress

## Plan File Location

Plans are stored in `.claude/plans/`:
- `.claude/plans/auth-system.md`
- `.claude/plans/payment-flow.md`
- `.claude/plans/[feature-name].md`

## Usage

```
/build-from-plan                    # Build from most recent plan
/build-from-plan auth-system        # Build from specific plan
/build-from-plan --resume           # Resume partially-completed plan
```

## Implementation Guidelines

When building from plan:
- Follow the plan steps exactly
- Don't add features not in the plan
- Don't refactor code outside the plan scope
- If blocked, note the issue and continue with next step
- Use canon skills for domain-specific code (e.g., `/bloch` for Java)

## Output

After implementation, report:

```markdown
## Build Complete

**Plan**: [plan name]
**Steps Completed**: X/Y

### Implemented
- [x] Step 1: Created auth service
- [x] Step 2: Added middleware
- [ ] Step 3: (blocked - need database schema)

### Files Created/Modified
- `src/auth/authService.ts` (new)
- `src/middleware/auth.ts` (new)

### Next Steps
- Run `/test` to add tests
- Run `/review-hard` before PR
```

## Workflow Position

```
/plan → /structure-first → /build-from-plan → /refactor-check → /test → /review-hard
```

`/build-from-plan` is the implementation phase - after planning and structure design, before testing and review.
