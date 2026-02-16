---
name: evaluation
description: "Reference templates for Codex evaluation. Used by build/improve orchestrators — not executed directly."
---

# Evaluation Reference

Templates for the Phase 8 evaluation loop. The orchestrator in `/build` and `/improve` reads these templates and runs scoring via Bash.

**This file is NOT executed directly.** The orchestrator owns the score-fix-lesson loop. Scoring runs via `codex exec` in Bash — never delegated to an agent (agents fabricate scores).

## Rubric Loading

1. Read `.claude/rubric/AUTO-DETECT.md` for the detection table
2. Always load: `.claude/rubric/base.md` and `.claude/rubric/product-quality.md`
3. Auto-detect domains: check target files against the detection table, load matching domain rubrics
4. Combine into `{RUBRIC_CRITERIA}`

If a rubric file doesn't exist, skip it and continue.

## Scorecard Prompt

The orchestrator runs this directly via Bash (iteration 1):

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

## Rescore Prompt

On iterations 2+, the orchestrator uses this prompt instead of the initial scorecard.
This gives Codex the previous scores and what was fixed, so it scores in context
rather than starting blind:

```
cd {TARGET} && codex exec -s read-only -o /tmp/lens-eval-scores.md "PRODUCTION READINESS RE-SCORE

You previously scored this codebase. Here were the scores:

{PREVIOUS_SCORES_BLOCK}

Since that scoring, these fixes were applied:

{FIX_APPLIED_LINES}

Re-read the codebase and re-score. Scores should reflect the actual state of
the code NOW. If a fix genuinely improved a dimension, the score should go up.
If a fix introduced new problems, the score should go down. Do not anchor to
previous scores — read the code fresh, but USE the context above to ensure you
are evaluating the same aspects consistently.

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

The orchestrator builds `{PREVIOUS_SCORES_BLOCK}` from the parsed scores of the previous iteration:

```
SECURITY: 7/10
STRUCTURE: 7/10
ERROR_HANDLING: 7/10
NAMING: 7/10
COMPLEXITY: 7/10
TYPE_SAFETY: 8/10
TESTABILITY: 6/10
TOTAL: 49/70
```

And `{FIX_APPLIED_LINES}` from the FIX agent output:

```
FIX_APPLIED: TESTABILITY | src/cli.ts:164 | Extracted main() function
FIX_APPLIED: SECURITY | src/schema.ts:26 | Added ReDoS pattern checks
...
```

## Scoreboard Format

The orchestrator prints this after parsing scores:

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

## Classification Tree

For each fix applied, the LESSON agent classifies:

```
Code pattern that should be avoided in future code?
  YES -> General rule?
    YES -> LESSON -> both lessons files (deduped)
    NO  -> LESSON -> .claude/lessons.md only
  NO  -> Suggests pipeline/tool/config change?
    YES -> PROPOSAL -> .claude/eval-proposals.md
    NO  -> eval-report.md only
```

Each LESSON gets a category: `LOGIC`, `DESIGN`, `CODE_QUALITY`, `DUPLICATION`, or `AI_SMELL`.

## Report Template

The LESSON agent replaces `.claude/eval-report.md` with:

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

## Lessons ({count})

| # | Category | Description |
|---|----------|-------------|
| 1 | {cat} | {desc} |

## Proposals ({count})

| # | Type | Description | Action |
|---|------|-------------|--------|
| 1 | {type} | {desc} | {action} |
```

### Lesson Files

- **`.claude/lessons.md`** — append new lessons under appropriate category sections
- **`.claude/universal-lessons.md`** — append only general patterns (not project-specific), deduplicate against existing
- **`.claude/eval-proposals.md`** — append new proposals with PENDING status
