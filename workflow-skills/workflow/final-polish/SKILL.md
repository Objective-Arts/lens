---
name: final-polish
description: Final refinement pass after phase-loop. Ensures code is ready for senior review.
---

# /final-polish [path]

Final refinement pass that prepares code for senior review. **Requires `/phase-loop` to have been run first.**

## Prerequisite Check

```
if not exists(.claude/phase-loop.log) or path not in log:
    ERROR: "Run /phase-loop first"
    EXIT
```

## What It Does

1. **Re-read the code** with fresh eyes
2. **Check for AI antipatterns** that slipped through
3. **Verify naming** - every name earns its place
4. **Simplify** - any remaining complexity that can be reduced
5. **Final consistency check** - style, patterns, structure

## AI Antipatterns to Catch

| Antipattern | Example | Fix |
|-------------|---------|-----|
| Over-abstraction | Unused factory pattern | Inline it |
| Defensive paranoia | Null check where impossible | Remove it |
| Comment spam | `// increment i` | Delete it |
| Wrapper classes | `UserWrapper` around `User` | Unwrap it |
| Speculative features | Config nobody asked for | Delete it |

## The Senior Review Question

For every function, class, and file ask:

> "Would a senior engineer mass-delete this in review?"

If yes → fix it now.

## Output

```
Final Polish: src/components/Button.tsx
  ✓ No AI antipatterns
  ✓ Names are clear and justified
  ✓ Complexity is minimal
  ✓ Style is consistent
  ✓ Ready for senior review
```

Or if issues found:

```
Final Polish: src/components/Button.tsx
  ⚠ Found 2 issues:
    - Line 45: Unnecessary null check (props are typed)
    - Line 72: Comment restates the code

  Fixing...
  ✓ Issues resolved
  ✓ Ready for senior review
```

## When to Use

- After `/phase-loop` completes
- Before opening a PR
- Before requesting senior review
