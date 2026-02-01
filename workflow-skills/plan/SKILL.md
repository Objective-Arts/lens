---
name: plan
description: Create implementation plan before coding. Plan file must exist with required sections before completion.
---

# /plan

Create a detailed, actionable implementation plan. No vague language. No optional sections.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"plan","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## ⚠️ STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST produce a plan with ALL sections below. No "TBD". No "as needed". No "if applicable".

Every item must be SPECIFIC and ACTIONABLE.

## Process

1. **Explore** - Use Glob, Grep, Read to understand existing code
2. **Design** - Create plan with ALL required sections
3. **Save** - Write to `.claude/plans/[slug].md`
4. **Stop** - Exit and wait for approval

## ⚠️ NO INTERVIEW QUESTIONS

- Do NOT ask clarifying questions before planning
- Make reasonable assumptions
- State assumptions in the plan and proceed

## MANDATORY Plan File Format

```markdown
# Plan: [Feature/Task Name]

## FILES:
- path/to/file.ts: purpose of this file
- path/to/another.ts: purpose of this file

## FUNCTIONS:
- functionName(params): ReturnType (max N lines) - purpose
- anotherFunction(params): ReturnType (max N lines) - purpose

## TYPES:
- TypeName: { field: Type, field2: Type }
- AnotherType: { field: Type }

## INVARIANTS:
- Specific condition that must always be true
- Another specific invariant

## SECURITY:
- Specific security measure to implement
- Another specific security consideration

## TESTS:
- Specific test case: [what it verifies]
- Another test case: [what it verifies]

## APPLIED:
- [expert-name]: [specific planning decision based on their guidance]

PLAN_COMPLETE
```

## DO NOT:
- Be vague ("consider adding tests")
- Leave sections empty
- Say "as needed" or "if applicable"
- Use "TBD" or "to be determined"
- Make suggestions instead of decisions
- Proceed without all sections complete

## Validation (Phase will FAIL if violated)

- Missing any of: FILES, FUNCTIONS, TYPES, INVARIANTS, SECURITY, TESTS
- Contains "as needed", "if applicable", "TBD", "to be determined"
- Contains "consider" without specific action

## 🛑 MANDATORY STOP

After outputting the plan:
- DO NOT proceed to `/structure-first`
- DO NOT start writing any code
- DO NOT continue with "let me also..."

**Your turn ends here.** Output the plan and STOP.
