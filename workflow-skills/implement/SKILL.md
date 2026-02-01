---
name: implement
description: Implement code from plan. Writes the actual code following the approved plan and structure.
---

# /implement [target]

Implement code from the approved plan. Just write the code - no TDD ceremony.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"implement","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Step 0: Load Expert Context (MANDATORY)

Before writing code, read these expert skills:

```
Read: .claude/skills/kernighan/SKILL.md   (clarity, readability)
Read: .claude/skills/bloch/SKILL.md       (effective APIs)
Read: .claude/skills/gang-of-four/SKILL.md (design patterns)
Read: .claude/skills/thompson/SKILL.md    (get it working first)
```

Apply these principles throughout implementation. Skip if files don't exist.

## When to Use

- After `/plan` has created an implementation plan
- After `/structure-first` has defined types/interfaces
- When you have a clear plan and just need to write code

## Target

If a path/feature argument is provided, implement that specific item.
If no argument, implement from the most recent plan in `.claude/plans/`.

## Process

1. **Load Plan** - Read plan from `.claude/plans/` or context
2. **Check Structure** - Verify types/interfaces exist from `/structure-first`
3. **Implement** - Write code following the plan step by step
4. **Verify** - Ensure code compiles/lints

## Output Format

```markdown
## Implementation: [feature]

### Plan Used:
.claude/plans/[plan-name].md

### Files Created/Modified:

| File | Action | Description |
|------|--------|-------------|
| src/service.ts | Created | Main service implementation |
| src/types.ts | Modified | Added new interface |

### Implementation Steps:

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create service class | Done |
| 2 | Add validation logic | Done |
| 3 | Wire up dependencies | Done |

### Verification:
```bash
$ npx tsc --noEmit
(no errors)
```

IMPLEMENT_COMPLETE
```

## Rules

- Follow the plan exactly - don't add features not in the plan
- Use types/interfaces from `/structure-first` if they exist
- Keep functions small (max 30 lines per Kernighan)
- Handle errors explicitly
- Don't write tests here - that's `/build-tests`
