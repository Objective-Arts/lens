---
name: evaluation
description: "Score-driven evaluation via Codex. Fixes weakest dimensions until all score 9+."
---

# Phase 8: evaluation

Codex scores the codebase on 7 dimensions. Anything below 9 gets fixed. Re-score until all dimensions hit 9 or max 3 iterations.

**Gate marker:** `EVALUATION_COMPLETE`

## Steps

### Step 0: Load Rubric

Read `.claude/rubric/AUTO-DETECT.md` for the detection table. Then:

1. **Always load:** `.claude/rubric/base.md` and `.claude/rubric/product-quality.md`
2. **Auto-detect domains:** Check target files against the detection table. Load matching domain rubrics.
3. **Extract Review Criteria:** Combine into `{RUBRIC_CRITERIA}` for the Codex prompt.

If a rubric file doesn't exist, skip it and continue.

### Step 1: Collect Files

Find all source files in {TARGET}. Exclude: `node_modules/`, `dist/`, `.git/`, `.claude/`, `*.lock`, `*.map`.

### Step 2: Score via Codex

Check if `codex` CLI is available:

```bash
which codex 2>/dev/null && echo "CODEX_AVAILABLE" || echo "CODEX_UNAVAILABLE"
```

**If available**, run the scorecard:

```bash
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

Read the scores:

```bash
cat /tmp/lens-eval-scores.md
```

**If Codex unavailable**, fall back to `review-bot.sh` if it exists, otherwise note unavailable in report.

### Step 3: Parse Scores

Extract the numeric score for each dimension. Identify any dimension scoring below 9.

If all dimensions are 9 or above: skip to Step 5.

### Step 4: Fix Weakest Dimensions

For each dimension below 9, ordered from lowest score to highest:

1. Read the justification and weakest files from the scorecard
2. Fix the specific issues cited
3. **Scope constraint:** Only modify code related to that dimension's weaknesses. No restructuring beyond what's needed.
4. **Complexity budget:** Net-zero or net-negative lines/functions/types. Security fixes exempt.

After fixing all sub-9 dimensions, re-run Step 2 (re-score).

**Max 3 iterations.** If dimensions remain below 9 after 3 passes, report final scores and continue.

### Step 5: Classify Findings

For each fix applied, classify:

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

### Step 6: Deduplicate Lessons

Read both lessons files:
- `.claude/lessons.md`
- `.claude/universal-lessons.md`

Skip any finding already documented (semantic match). Only append genuinely new patterns.

### Step 7: Write Outputs

#### 7a. Eval Report (`.claude/eval-report.md`)

Replace the entire file:

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

#### 7b. Project Lessons (`.claude/lessons.md`)

Append new lessons under appropriate category sections.

#### 7c. Universal Lessons (`.claude/universal-lessons.md`)

Append only general patterns (not project-specific). Deduplicate against existing.

#### 7d. Proposals (`.claude/eval-proposals.md`)

Append new proposals with PENDING status.

### Step 8: Verify Writes

Confirm lessons, proposals, and eval report were persisted by reading the files.

### Step 9: Clean Up

```bash
rm -f /tmp/lens-eval-scores.md
```

### Step 10: Summary

```
Phase 8: evaluation
  Evaluator: Codex {available/unavailable}
  Iterations: {N}
  Scores: {initial total}/70 → {final total}/70
  Dimensions at 9+: {N}/7
  Fixes: {N} applied
  Lessons: {N} new
  Proposals: {N} new
  Report: .claude/eval-report.md
```

End with: `EVALUATION_COMPLETE`
