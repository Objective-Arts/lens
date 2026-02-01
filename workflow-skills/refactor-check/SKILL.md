---
name: refactor-check
description: Systematic code cleanup with MANDATORY verification. All issues must be fixed.
---

# /refactor-check [target]

Systematically refactor code. ALL identified issues must be fixed.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"refactor-check","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## ⚠️ STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST check for and FIX all of these issues. Not "consider" - FIX:

1. **FUNCTIONS > 30 LINES** - Split them. No exceptions.
2. **VAGUE NAMES** - Rename data/result/temp/item/info to meaningful names.
3. **DUPLICATE CODE** - Extract to shared function.
4. **DEEP NESTING** - Flatten with early returns.
5. **MAGIC NUMBERS/STRINGS** - Extract to named constants.
6. **MISSING ERROR HANDLING** - Add it.
7. **GOD FILES** - Split files with multiple concerns.

## FORBIDDEN (Phase will FAIL if detected):

- Saying "could be improved" without fixing
- Skipping issues because they're "minor"
- Suggesting future refactorings instead of doing them
- Leaving any identified issue unfixed
- Tests failing after refactoring

## Process

1. **Identify Issues** - Find all code quality problems
2. **Fix Each One** - Use Edit tool to fix
3. **Run Tests** - Verify behavior preserved
4. **Report** - Document what was fixed

## REQUIRED Output Format

```markdown
## Refactoring: [target]

ISSUES_IDENTIFIED:
- [file:line] [issue type] [description]
- [file:line] [issue type] [description]

REFACTORED:
- [file:line] [issue type] - FIXED: [what was done]
- [file:line] [issue type] - FIXED: [what was done]

ISSUES_REMAINING: 0 (must be zero)

REFACTOR_COUNT: N

TESTS_PASS: yes

APPLIED:
- [expert]: [decision]

REFACTOR_COMPLETE
```

## Validation (Phase will FAIL if violated)

- ISSUES_REMAINING > 0
- TESTS_PASS: no
- Issues identified but not in REFACTORED section

## 🛑 MANDATORY STOP

After refactoring:
- DO NOT proceed to next phase
- DO NOT continue with "let me also..."

**Your turn ends here.** Output REFACTOR_COMPLETE and STOP.
