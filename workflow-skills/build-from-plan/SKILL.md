---
name: build-from-plan
description: Implement NEW CODE from an approved plan. Use after /plan and /structure-first in the New Code Flow.
---

# /build-from-plan [plan-file]

**NEW CODE FLOW ONLY** - Implement new features from an approved plan file.

For legacy code modernization, use `/refactor-clean` instead.

## Why This Skill Exists

This skill consumes the plan artifact created by `/plan`:

```
/plan              → Creates .claude/plans/feature.md (artifact)
                          ↓
/build-from-plan   → Reads that file, implements exactly per plan
```

Without this separation:
- Claude would re-explore and potentially change approach mid-implementation
- No clear checkpoint between "agree on plan" and "execute plan"
- Scope creep happens naturally without discipline

With `/build-from-plan`:
- **Separation of concerns**: Planning and implementation are distinct phases
- **Resumability**: Can resume a partially-implemented plan later
- **Discipline**: Implementation follows the plan exactly, no scope creep
- **Trackability**: Progress is marked against the plan steps

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

## Invoke Canon Skills

While implementing, invoke domain-specific canon skills based on what you're building:

| File Type | Canon Skills | What They Guide |
|-----------|--------------|-----------------|
| `.java` | `/bloch` | API design, immutability, builders |
| `.py` | `/hettinger`, `/ramalho` | Pythonic idioms, data model |
| `.ts`, `.js` | `/kyle-simpson`, `/cherny` | Closures, type system |
| `.go` | `/pike` | Composition, interfaces |
| Tests | `/dodds`, `/meszaros` | Testing patterns, test doubles |

**Also invoke based on concern:**
- Security-sensitive code → `/schneier`, `/owasp`
- Legacy code modifications → `/feathers`
- Refactoring steps → `/fowler`
- Data structures → `/linus`

**Example**: Implementing a Java auth service from plan:
1. Before writing code, invoke `/bloch` for Java idioms
2. For security aspects, invoke `/schneier`
3. For test steps, invoke `/meszaros`

Check the project's CLAUDE.md for additional domain-specific skills to invoke.

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

## Workflow Position: New Code Flow

```
NEW CODE FLOW (this skill):
PRD/Feature Request → /plan → /structure-first → /build-from-plan → [review gates]

LEGACY CODE FLOW (use /refactor-clean instead):
Existing Code → /plan → /structure-first → /refactor-clean → [review gates]
```

`/build-from-plan` is the implementation phase for NEW CODE - after planning and structure design, before review gates.

### When to Use Which

| Situation | Use |
|-----------|-----|
| Building new feature from PRD | `/build-from-plan` |
| Adding new module/component | `/build-from-plan` |
| Greenfield development | `/build-from-plan` |
| Refactoring existing code | `/refactor-clean` |
| Modernizing legacy code | `/refactor-clean` |
| Cleaning up tech debt | `/refactor-clean` |
