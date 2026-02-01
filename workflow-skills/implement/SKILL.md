---
name: implement
description: Implement code from plan. Max 30 lines per function. No vague names.
---

# /implement [target]

Implement code from the approved plan. Strict constraints enforced.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"implement","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## ⚠️ STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST follow these constraints EXACTLY:

1. **MAX 30 LINES PER FUNCTION** - No function may exceed 30 lines. Split if needed.
2. **ONE FILE PER CONCERN** - No god files. Each file has one purpose.
3. **FOLLOW THE PLAN** - Create exactly the files/functions listed in the plan. No extras.
4. **MEANINGFUL NAMES** - Variables/functions must describe what they do.
5. **NO HARDCODED VALUES** - Use constants or config for magic numbers/strings.
6. **HANDLE ALL ERRORS** - Every operation that can fail must have error handling.

## FORBIDDEN (Phase will FAIL if detected):

- Functions longer than 30 lines
- Vague names: `data`, `result`, `temp`, `item`, `stuff`, `info`, `obj`
- Multiple concerns in one file
- Hardcoded configuration values
- Ignored error cases
- Features not in the plan

## Process

1. **Load Plan** - Read plan from `.claude/plans/` or context
2. **Check Structure** - Verify types/interfaces exist from `/structure-first`
3. **Implement** - Write code following the plan EXACTLY
4. **Verify** - Ensure code compiles/lints

## REQUIRED Output Format

```markdown
## Implementation: [feature]

FILES_CREATED:
- path/to/file.ts: [functions defined]

LONGEST_FUNCTION: [name] at [N] lines (must be ≤30)

### Verification:
```bash
$ npx tsc --noEmit
(no errors)
```

APPLIED:
- [expert]: [decision]

IMPLEMENT_COMPLETE
```

## Validation (Phase will FAIL if violated)

- Any function > 30 lines
- Vague variable names detected
- Files not in plan created without justification

## 🛑 MANDATORY STOP

After implementation:
- DO NOT proceed to next phase
- DO NOT continue with "let me also..."

**Your turn ends here.** Output IMPLEMENT_COMPLETE and STOP.
