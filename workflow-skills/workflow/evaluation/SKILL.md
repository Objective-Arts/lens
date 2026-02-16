---
name: evaluation
description: "Reference templates for Codex evaluation. Used by build/improve orchestrators — not executed directly."
---

# Evaluation Reference

Templates for the Phase 8 evaluation loop. The orchestrator in `/build` and `/improve` reads these templates and runs scoring via Bash.

**This file is NOT executed directly.** The orchestrator owns the score-fix loop. Scoring runs via `codex exec` in Bash — never delegated to an agent (agents fabricate scores).

## Rubric Loading

1. Read `.claude/rubric/AUTO-DETECT.md` for the detection table
2. Always load: `.claude/rubric/base.md` and `.claude/rubric/product-quality.md`
3. Auto-detect domains: check target files against the detection table, load matching domain rubrics
4. Combine into `{RUBRIC_CRITERIA}`

If a rubric file doesn't exist, skip it and continue.

## Scorecard Prompt

The orchestrator runs this directly via Bash:

```
cd {TARGET} && codex exec -s read-only -o /tmp/lens-eval-scores.md "CODE QUALITY REVIEW

Rate this codebase on a scale of 1-100. Evaluate everything: code quality, security, error handling, naming, structure, test coverage, CI/CD, documentation, and project hygiene.

Also check against these criteria:
{RUBRIC_CRITERIA}

Every issue you report will be sent to an agent for fixing. Be specific — cite the exact file and line, and say exactly what needs to change.

OUTPUT FORMAT (strict — no prose, no strengths, no explanation):

ISSUE: {file:line} — {description}
ISSUE: {file:line} — {description}
...

SCORE: NN/100" 2>&1
```

## Rescore Prompt

After fixes are applied, the orchestrator runs this to get the final score:

```
cd {TARGET} && codex exec -s read-only -o /tmp/lens-eval-scores.md "CODE QUALITY RE-SCORE

Previous score: {PREVIOUS_SCORE}/100

Fixes applied since last scoring:

{FIX_APPLIED_LINES}

Re-read the codebase and re-score 1-100. Every issue you report will be sent to an agent for fixing. Be specific.

OUTPUT FORMAT (strict — no prose, no strengths, no explanation):

ISSUE: {file:line} — {description}
...

SCORE: NN/100" 2>&1
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
**Score:** {initial}/100 → {final}/100

## Issues Found ({count})

| # | File | Issue |
|---|------|-------|
| 1 | {file:line} | {description} |

## Fixes Applied ({count})

| # | File | Fix |
|---|------|-----|
| 1 | {file:line} | {what was fixed} |

## Remaining Issues ({count})

| # | File | Issue |
|---|------|-------|
| 1 | {file:line} | {description} |

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
