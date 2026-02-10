---
name: eval-feedback
description: External evaluation + feedback routing. Scores production readiness, classifies findings, routes lessons and proposals.
---

# Phase 10: eval-feedback

External evaluation and feedback routing. Runs after all code phases complete (after gate 9.5). Invokes Codex and Gemini as independent evaluators, scores production readiness, classifies each finding, and routes them to the appropriate files.

> **SCOPE CONSTRAINT:** This phase is READ-ONLY. It is FORBIDDEN to edit any source, test, or config file. If this phase edits source code, it FAILS. The only files it may write to are:
> - `.claude/eval-report.md` (replaced each run)
> - `.claude/eval-proposals.md` (appended)
> - `.claude/lessons.md` (appended)
> - `workflow-skills/lessons.md` (appended, deduped)

**Gate marker:** `EVAL_COMPLETE`

## Clean-Slate Rule

This phase must evaluate code with fresh eyes. The evaluator subagent must NOT read any prior phase artifacts before forming its assessment:

- Do NOT read `.claude/evidence/` (prior review checklists)
- Do NOT read `.claude/canary-manifest.json`
- Do NOT read `.claude/create-plans/` (the implementation plan)
- Do NOT read `.claude/build.log` or `.claude/improve.log`
- Do NOT read the existing `.claude/eval-report.md` from a prior run

The evaluators receive **source code only** — no pipeline context, no prior phase opinions. This ensures findings are independently discovered, not echoed from earlier phases.

The only prior-output files the subagent may read are `.claude/lessons.md` and `workflow-skills/lessons.md` — and only during Step 6 (Deduplicate), after scoring and classification are already done.

## Scoring Categories

| Category | What It Measures |
|----------|-----------------|
| Deployability | Build succeeds, lockfile present, externalized config, health checks, graceful shutdown |
| Reliability | Error paths handled, resources cleaned up, bounded operations, graceful degradation |
| Security | Input validation, secret management, injection prevention, safe crypto |
| Test Coverage | Tests exist, edge cases covered, meaningful assertions, non-happy-path coverage |
| Operational Hygiene | Logging quality, error message UX, documentation, .gitignore, migrations |

**Scale:** 1-2 critical gaps, 3-4 major gaps, 5-6 needs work, 7-8 production-ready, 9-10 exemplary.

**Overall = min(all categories).** One weak link defines readiness.

## Steps

### Step 1: Collect Files

Find all source files in {TARGET}. Exclude: `node_modules/`, `dist/`, `.git/`, `.claude/`, `*.lock`, `*.map`.

Build a file manifest with paths and approximate line counts. This is the input for evaluators.

### Step 2: Run Codex Eval

Check if `codex` CLI is available:

```bash
which codex 2>/dev/null && echo "CODEX_AVAILABLE" || echo "CODEX_UNAVAILABLE"
```

**If available**, run Codex in read-only mode against the collected files:

```bash
codex exec -s read-only "Review this project for production readiness. Score each category 1-10 with specific findings:
1. Deployability: build, lockfile, config externalization, health checks, graceful shutdown
2. Reliability: error handling, resource cleanup, bounded operations, degradation
3. Security: input validation, secrets, injection, crypto
4. Test Coverage: existence, edge cases, assertions, failure paths
5. Operational Hygiene: logging, error UX, docs, .gitignore, migrations

For each finding, state: category, score impact, file:line if applicable, and whether it's a code pattern (LESSON) or a pipeline/tool change (PROFILE).

Output format per finding:
FINDING: {category} | {description} | {file:line or N/A} | {LESSON or PROFILE}"
```

**If Codex unavailable**, check for `review-bot.sh`:

```bash
[ -f scripts/review-bot.sh ] && echo "REVIEW_BOT_AVAILABLE" || echo "REVIEW_BOT_UNAVAILABLE"
```

If `review-bot.sh` exists, run it. Otherwise, set `CODEX_AVAILABLE: false` and note in report.

Parse Codex output into per-category scores and a list of findings.

### Step 3: Run Gemini Eval

Use the `mcp__gemini-reviewer__gemini_review` tool with `focus: "adversarial"`.

Concatenate the file manifest (or the most critical files if too large) and submit with this context:

```
Review this project for production readiness. Score each category 1-10:
1. Deployability  2. Reliability  3. Security  4. Test Coverage  5. Operational Hygiene

For each finding, provide:
- Category (one of the 5 above)
- Description (specific, actionable)
- File:line if applicable
- Classification: LESSON (code pattern to avoid) or PROFILE (pipeline/tool/config change)

Be adversarial: look for what's missing, not just what's wrong.
```

**If Gemini unavailable** (tool call fails), set `GEMINI_AVAILABLE: false` and note in report.

Parse Gemini output into per-category scores and a list of findings.

### Step 4: Score

For each category, compute the final score:
- If both evaluators available: `min(Codex score, Gemini score)`
- If only one available: use that score
- If neither available: score = `N/A`, note "no external evaluators"

**Overall score = min(all category scores).**

### Step 5: Classify Findings

Apply the classification decision tree to each finding:

```
Finding about a code pattern that should be avoided in future code?
  YES -> Can it be expressed as a general rule?
    YES -> LESSON -> both lessons.md files (deduped)
    NO  -> LESSON -> .claude/lessons.md only (project-specific)
  NO  -> Suggests changing pipeline, tools, profiles, or config?
    YES -> PROFILE -> .claude/eval-proposals.md (human review)
    NO  -> Informational only -> eval-report.md only
```

Each LESSON gets a category tag: `LOGIC`, `DESIGN`, `CODE_QUALITY`, `DUPLICATION`, or `AI_SMELL`.

Each PROFILE gets a sub-type: `SKILL_CHANGE`, `PIPELINE_CHANGE`, `CONFIG_CHANGE`, `DEPENDENCY_CHANGE`, or `RUBRIC_CHANGE`.

### Step 6: Deduplicate

Read both lessons files:
- `.claude/lessons.md`
- `workflow-skills/lessons.md`

For each LESSON finding, check if the pattern is already documented. Skip if:
- The exact same concept is already described (semantic match, not string match)
- The finding is a specific instance of an already-documented general pattern

Only append genuinely new patterns.

### Step 7: Write Outputs

#### 7a. Eval Report (`.claude/eval-report.md`)

Replace the entire file each run:

```markdown
# Eval Report — {TARGET}

**Date:** {ISO date}
**Evaluators:** {Codex: available/unavailable, Gemini: available/unavailable}

## Scores

| Category | Codex | Gemini | Final |
|----------|-------|--------|-------|
| Deployability | {score} | {score} | {min} |
| Reliability | {score} | {score} | {min} |
| Security | {score} | {score} | {min} |
| Test Coverage | {score} | {score} | {min} |
| Operational Hygiene | {score} | {score} | {min} |
| **Overall** | | | **{min of all}** |

## Findings

### Lessons ({count})

| # | Category | Description | File | Source |
|---|----------|-------------|------|--------|
| 1 | {cat} | {desc} | {file:line} | {Codex/Gemini/Both} |

### Proposals ({count})

| # | Type | Description | Suggested Action | Source |
|---|------|-------------|-----------------|--------|
| 1 | {sub-type} | {desc} | {action} | {Codex/Gemini/Both} |

### Informational ({count})

{Findings that are neither lessons nor proposals}
```

#### 7b. Project Lessons (`.claude/lessons.md`)

Append new LESSON findings. Format each as:

```markdown
### {Pattern Name}
- {Description with file:line reference}
- Source: eval-feedback ({date})
```

Place under the appropriate category section (`## LOGIC Patterns`, `## DESIGN Patterns`, etc.). If the section doesn't exist, create it.

#### 7c. Universal Lessons (`workflow-skills/lessons.md`)

Append only general patterns (not project-specific instances). Deduplicate against existing content. Format same as existing entries in that file.

#### 7d. Proposals (`.claude/eval-proposals.md`)

Append new PROFILE findings:

```markdown
## Proposal: {short title}

- **Status:** PENDING
- **Type:** {SKILL_CHANGE | PIPELINE_CHANGE | CONFIG_CHANGE | DEPENDENCY_CHANGE | RUBRIC_CHANGE}
- **Source:** {Codex/Gemini/Both} ({date})
- **Description:** {detailed description}
- **Suggested Action:** {what to change and where}
```

### Step 8: Verify Writes

After writing outputs, verify that learnings were actually persisted. This is NOT optional.

1. **If any LESSON findings were classified in Step 5:**
   - Read `.claude/lessons.md` and confirm the new entries appear
   - Read `workflow-skills/lessons.md` and confirm general patterns appear (unless all were deduped — in that case, confirm the dedup reasoning)
   - If lessons are missing: go back to Step 7b/7c and write them. Do not proceed without them.

2. **If any PROFILE findings were classified in Step 5:**
   - Read `.claude/eval-proposals.md` and confirm the new proposals appear
   - If proposals are missing: go back to Step 7d and write them.

3. **Always:** Read `.claude/eval-report.md` and confirm it contains the score table and findings.

Report in the summary: `Verified: {N} lessons written, {N} proposals written, report confirmed`

If no LESSON or PROFILE findings exist (all informational), report: `Verified: report only (no actionable findings)`

### Step 9: Summary

Print a summary to the conversation:

```
Phase 10: eval-feedback
  Evaluators: {Codex: Y/N, Gemini: Y/N}
  Overall score: {N}/10
  Categories: Deployability {N}, Reliability {N}, Security {N}, Tests {N}, Ops {N}
  Lessons: {N} new ({N} deduped)
  Proposals: {N} new
  Report: .claude/eval-report.md
```

End with: `EVAL_COMPLETE`
