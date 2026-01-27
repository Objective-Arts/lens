---
name: generate-validate
description: "Iterating on code until a single quality gate passes. Use when tests are failing after changes, lint errors need fixing, or code needs refinement until validation succeeds."
---

# GENERATE-VALIDATE-LOOP Pattern

**Intent**: Keep generating until quality gates pass.

## The Pattern

```
     ┌──────────────────────────────────────┐
     │                                      │
     ▼                                      │
  SKILL              HOOK                   │
(Generate) ────► (Validate)                 │
                     │                      │
                PASS │ FAIL ────────────────┘
                     │
                     ▼
                 COMPLETE
```

## When to Use

- Any code generation task
- When quality must be verified
- When tests or linters exist
- When you need iterative refinement

## Execution Steps

### Step 1: GENERATE (First Attempt)

Generate code applying best principles:
- Follow existing patterns
- Apply relevant canon (Kernighan clarity, Bloch defensive design, etc.)
- Write with intent to pass validation

```
GENERATING:
- Applying: [principles being used]
- Following: [existing patterns matched]
- Output: [the generated code]
```

### Step 2: VALIDATE (Run Checks)

Run all available quality gates:

```bash
# Example validation sequence
npm run lint        # Style checks
npm run typecheck   # Type safety
npm run test        # Unit tests
```

### Step 3: EVALUATE Results

```
VALIDATION RESULTS:
- Lint: [PASS/FAIL - details]
- Types: [PASS/FAIL - details]
- Tests: [PASS/FAIL - details]
```

### Step 4: LOOP or COMPLETE

**If any FAIL:**
1. Analyze the failure
2. Understand root cause (not just symptoms)
3. Regenerate with feedback incorporated
4. Return to Step 2

**If all PASS:**
- Proceed to completion
- Document what was validated

## Example Flow

```
Iteration 1:
  Generate: Initial implementation
  Validate: 2 tests failing
  → Loop back

Iteration 2:
  Generate: Fix edge case handling
  Validate: Lint error on line 47
  → Loop back

Iteration 3:
  Generate: Fix formatting
  Validate: All passing
  → COMPLETE
```

## Validation Layers

Run in order of speed (fail fast):

| Order | Check | Catches |
|-------|-------|---------|
| 1 | Lint | Style, formatting |
| 2 | Types | Type errors |
| 3 | Unit Tests | Logic errors |
| 4 | Integration | System errors |

## Anti-Patterns

```
❌ WRONG: Generate once, declare done
❌ WRONG: Skip validation "to save time"
❌ WRONG: Ignore failing tests
❌ WRONG: Disable linter rules to pass

✅ RIGHT: Loop until genuinely passing
✅ RIGHT: Fix root causes, not symptoms
✅ RIGHT: All gates green before done
```

## Completion Criteria

- [ ] All lint checks pass
- [ ] All type checks pass
- [ ] All existing tests pass
- [ ] New tests added if needed
- [ ] No validation bypassed or disabled

## The Rule

> **Not done until validation passes. No exceptions.**
