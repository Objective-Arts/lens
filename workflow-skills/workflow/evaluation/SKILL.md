---
name: evaluation
description: "Reference templates for Codex evaluation. Used by build/improve orchestrators — not executed directly."
---

# Evaluation Reference

Templates and formats for the Phase 8 evaluation loop. The orchestrator in `/build` and `/improve` reads these templates and injects them into single-purpose agents.

**This file is NOT executed directly.** The orchestrator owns the score-fix-report loop.

## Rubric Loading

1. Read `.claude/rubric/AUTO-DETECT.md` for the detection table
2. Always load: `.claude/rubric/base.md` and `.claude/rubric/product-quality.md`
3. Auto-detect domains: check target files against the detection table, load matching domain rubrics
4. Combine into `{RUBRIC_CRITERIA}`

If a rubric file doesn't exist, skip it and continue.

## Scorecard Prompt

The orchestrator injects this into the SCORE agent's `codex exec` command:

```
cd {TARGET} && codex exec -s read-only -o /tmp/lens-eval-scores.md "PRODUCTION READINESS SCORECARD

Score this codebase 1-10 on each dimension. No partial credit — round to
the nearest integer. A 5 means acceptable for production. Below 5 means
you would block the PR. Above 5 means you would approve with confidence.

Also check against these criteria:
{RUBRIC_CRITERIA}

1. SECURITY (1-10)
   Injection, traversal, secrets, trust boundaries, input validation

2. STRUCTURE (1-10)
   Single responsibility, file organization, dependency direction,
   interface clarity, no god objects

3. ERROR HANDLING (1-10)
   Cause chains preserved, no swallowed errors, explicit failure paths,
   no log-and-continue

4. NAMING (1-10)
   Intent-revealing names, no abbreviations, no generic names (data,
   result, info, item), consistent vocabulary

5. COMPLEXITY (1-10)
   Function length, nesting depth, branching factor, parameter count,
   cognitive load per function

6. TYPE SAFETY (1-10)
   No any, proper narrowing, discriminated unions where appropriate,
   inference used correctly

7. TESTABILITY (1-10)
   Pure functions, injectable dependencies, observable behavior,
   no hidden state

OUTPUT FORMAT (strict — one line per dimension, then total):

SECURITY: N/10 — one sentence justification. Top 3 weakest files: file:line, file:line, file:line
STRUCTURE: N/10 — one sentence justification. Top 3 weakest files: file:line, file:line, file:line
ERROR_HANDLING: N/10 — one sentence justification. Top 3 weakest files: file:line, file:line, file:line
NAMING: N/10 — one sentence justification. Top 3 weakest files: file:line, file:line, file:line
COMPLEXITY: N/10 — one sentence justification. Top 3 weakest files: file:line, file:line, file:line
TYPE_SAFETY: N/10 — one sentence justification. Top 3 weakest files: file:line, file:line, file:line
TESTABILITY: N/10 — one sentence justification. Top 3 weakest files: file:line, file:line, file:line

TOTAL: NN/70

Do not explain the scoring system. Do not add caveats. Score and justify." 2>&1
```

## Scoreboard Format

The orchestrator prints this after parsing SCORE agent output:

```
EVAL_SCORES (iteration {N}):
  Security:       {N}/10
  Structure:      {N}/10
  Error Handling: {N}/10
  Naming:         {N}/10
  Complexity:     {N}/10
  Type Safety:    {N}/10
  Testability:    {N}/10
  TOTAL:          {NN}/70
  Below 9:        {list of dimensions below 9, or "none"}
```

## Report Template

The report agent replaces `.claude/eval-report.md` with:

```markdown
# Eval Report — {TARGET}

**Date:** {ISO date}
**Evaluator:** Codex
**Iterations:** {N}

## Scores

| Dimension | Initial | Final |
|-----------|---------|-------|
| Security | N/10 | N/10 |
| Structure | N/10 | N/10 |
| Error Handling | N/10 | N/10 |
| Naming | N/10 | N/10 |
| Complexity | N/10 | N/10 |
| Type Safety | N/10 | N/10 |
| Testability | N/10 | N/10 |
| **Total** | **NN/70** | **NN/70** |

## Fixes Applied ({count})

| # | Dimension | File | Fix |
|---|-----------|------|-----|
| 1 | {dim} | {file:line} | {what was fixed} |
```

> Known pitfalls are maintained in `canon/pitfalls/SKILL.md`. If you discover a new recurring pattern during evaluation, note it in the report — it can be added to the pitfalls canon in a future release.
