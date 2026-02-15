---
name: evaluation
description: Final external review via Codex + Gemini. Fixes all findings, routes lessons and proposals.
---

# Phase 8: evaluation

Final external review and feedback routing. Invokes Codex and Gemini as independent reviewers, fixes everything they find, and routes lessons and proposals to the appropriate files. Incorporates evaluation logic (fix-in-place from eval report).

**Gate marker:** `EVALUATION_COMPLETE`

**Do NOT read prior phase artifacts** (`.claude/evidence/`, `.claude/plans/`, `.claude/build.log`, `.claude/improve.log`) before the Codex review. Evaluate source code only. The only exception: `.claude/lessons.md` and `.claude/universal-lessons.md` may be read during Step 5 (Deduplicate), after findings are collected.

## Steps

### Step 0: Load Rubric

Read `.claude/rubric/AUTO-DETECT.md` for the detection table. Then:

1. **Always load:** `.claude/rubric/base.md` and `.claude/rubric/product-quality.md`
2. **Auto-detect domains:** Check target files against the detection table. Load matching domain rubrics (`.claude/rubric/web-api.md`, `.claude/rubric/data-persistence.md`, `.claude/rubric/cli.md`, `.claude/rubric/microservice.md`).
3. **Extract Review Criteria:** From each loaded rubric, collect the numbered items under `## Review Criteria`. Combine into a single criteria list — use this for `{RUBRIC_CRITERIA}` in the Codex and Gemini prompts below.
4. **Extract Product Quality Criteria:** From `.claude/rubric/product-quality.md`, collect the Review Criteria — use this for `{PRODUCT_QUALITY_CRITERIA}` in the product quality prompt.

If a rubric file doesn't exist, skip it and continue.

### Step 1: Collect Files

Find all source files in {TARGET}. Exclude: `node_modules/`, `dist/`, `.git/`, `.claude/`, `*.lock`, `*.map`.

Build a file manifest with paths and approximate line counts.

### Step 2: Run Codex Review

Check if `codex` CLI is available:

```bash
which codex 2>/dev/null && echo "CODEX_AVAILABLE" || echo "CODEX_UNAVAILABLE"
```

**If available**, run Codex in read-only mode with output captured to a file:

```bash
cd {TARGET} && codex exec -s read-only -o /tmp/lens-eval-codex.md "PRODUCTION READINESS review. Review ALL source code and cite file:line for every finding.

Check against these criteria:
{RUBRIC_CRITERIA}

SEVERITY:
- CRITICAL: exploitable vulnerability, data loss, crash in production
- HIGH: would cause incidents, missing critical validation
- MEDIUM: poor practice, inconsistent handling, minor gaps
- LOW: style, naming, documentation

OUTPUT FORMAT:
FINDING: {category} | {severity} | {description} | {file:line or N/A}" 2>&1
```

Replace `{RUBRIC_CRITERIA}` with the combined Review Criteria from all loaded rubric files, numbered sequentially. Include a single Test Coverage line: "N. Test Coverage: tests exist, edge cases covered, meaningful assertions (handled by testing phase)".

After Codex completes, **read the output file**:

```bash
cat /tmp/lens-eval-codex.md
```

**If Codex unavailable**, check for `review-bot.sh`:

```bash
[ -f scripts/review-bot.sh ] && echo "REVIEW_BOT_AVAILABLE" || echo "REVIEW_BOT_UNAVAILABLE"
```

If `review-bot.sh` exists, run it. Otherwise, note in report that Codex was unavailable.

### Step 3: Run Gemini Review (per-file)

**For each source file** (from the manifest in Step 1), call `mcp__gemini-reviewer__gemini_review` with `focus: "adversarial"`:

```
mcp__gemini-reviewer__gemini_review
  code: <contents of this single file>
  focus: "adversarial"
  context: "PRODUCTION READINESS review for {filename}. Check against these criteria: {RUBRIC_CRITERIA}. Also note if public APIs lack tests (Test Coverage — handled by testing phase). SEVERITY: CRITICAL = exploitable vulnerability, data loss, crash in production. HIGH = would cause incidents, missing critical validation. MEDIUM = poor practice, minor gaps. LOW = style, naming. OUTPUT FORMAT: FINDING: {category} | {severity} | {description} | {file:line}"
```

Replace `{RUBRIC_CRITERIA}` with the combined Review Criteria from all loaded rubric files, numbered sequentially.

After all per-file reviews complete, aggregate all FINDING lines into a single list.

**If Gemini unavailable** (tool call fails), note in report that Gemini was unavailable.

#### 3b. Product Quality Review

After the per-file code review, do a separate product-level review. This catches bad products built with good code.

Call Gemini with the main entry point / CLI / config code:

```
mcp__gemini-reviewer__gemini_review
  code: <paste the main entry point / CLI / config code>
  focus: "adversarial"
  context: "PRODUCTION READINESS — user experience gate. Review as a user deploying this to production. Check against the product quality criteria: {PRODUCT_QUALITY_CRITERIA}. Flag any issue that would cause a production incident or require rollback. OUTPUT FORMAT: FINDING: Product Quality | {severity} | {description} | {file:line}"
```

Replace `{PRODUCT_QUALITY_CRITERIA}` with the Review Criteria from `.claude/rubric/product-quality.md` (loaded in Step 0), numbered sequentially.

Add product quality findings to the aggregated list.

### Step 4: Fix All Findings

Combine findings from both Codex and Gemini. Deduplicate overlapping findings (same file:line, same issue). Fix everything.

> **SCOPE CONSTRAINT:** Fix in place. No restructuring, no new abstractions. "Fix in place" means you CAN: add private helper methods, add config entries, add validation logic, restructure internals of existing functions, add middleware/headers to existing startup files, add config files (appsettings, .env.example, docker-compose), add documentation files (README). Be aggressive about fixing — the goal is every category at 8+.

**Priority order** (maps to rubric categories):
1. **Security** — base.md criteria 1-4 (input validation, injection, secrets, auth lifecycle) + domain security criteria
2. **Reliability** — base.md criteria 5-7 (error handling, bounded ops, atomic writes) + domain reliability criteria
3. **Deployability** — base.md criterion 8 (config externalization) + domain criteria (health checks, schema versioning, exit codes)
4. **Product Quality** — product-quality.md criteria (defaults, fallbacks, orphaned features, error UX, secrets handling)
5. **Operational Hygiene** — base.md criteria 9-10 (logging, error messages)
6. **AI Code Smells** — base.md criteria 11-12 (AI smells, architecture)

**Skip entirely:** Test Coverage findings — the testing phase handles tests.

**Test Coverage findings:** Tests already exist (phase 7 wrote them). Fix test gaps Codex/Gemini identify — add missing test cases, improve assertions.

**Findings without file:line references:** These often describe missing infrastructure. Fix by adding the missing piece to the most appropriate existing file.

**Complexity Budget:** Net-zero or net-negative for source code. Config files, documentation files, and CI configs are exempt.

**Rules:**
- One finding = one targeted fix
- Do not refactor surrounding code
- Do not add comments explaining the fix
- If a finding requires major restructuring, skip it and note in the report
- Run the project's build command after fixes to verify nothing broke

### Step 5: Classify Findings

Apply the classification decision tree to each finding:

```
Finding about a code pattern that should be avoided in future code?
  YES -> Can it be expressed as a general rule?
    YES -> LESSON -> both lessons.md files (deduped)
    NO  -> LESSON -> .claude/lessons.md only (project-specific)
  NO  -> Suggests changing pipeline, tools, profiles, or config?
    YES -> PROPOSAL -> .claude/eval-proposals.md (human review)
    NO  -> Informational only -> eval-report.md only
```

Each LESSON gets a category tag: `LOGIC`, `DESIGN`, `CODE_QUALITY`, `DUPLICATION`, or `AI_SMELL`.

Each PROPOSAL gets a sub-type: `SKILL_CHANGE`, `PIPELINE_CHANGE`, `CONFIG_CHANGE`, `DEPENDENCY_CHANGE`, or `RUBRIC_CHANGE`.

### Step 6: Deduplicate

Read both lessons files:
- `.claude/lessons.md`
- `.claude/universal-lessons.md`

For each LESSON finding, check if the pattern is already documented. Skip if:
- The exact same concept is already described (semantic match, not string match)
- The finding is a specific instance of an already-documented general pattern

Only append genuinely new patterns.

### Step 7: Write Outputs

#### 6a. Eval Report (`.claude/eval-report.md`)

Replace the entire file each run:

```markdown
# Eval Report — {TARGET}

**Date:** {ISO date}
**Evaluators:** Codex: {available/unavailable}, Gemini: {available/unavailable}

## Findings

### Fixed ({count})

| # | Category | Severity | Description | File | Fix Applied |
|---|----------|----------|-------------|------|-------------|
| 1 | {cat} | {severity} | {desc} | {file:line} | {what was fixed} | {Codex/Gemini/Both} |

### Skipped ({count})

| # | Category | Severity | Description | File | Reason | Source |
|---|----------|----------|-------------|------|--------|--------|
| 1 | {cat} | {severity} | {desc} | {file:line} | {why skipped} | {Codex/Gemini/Both} |

### Lessons ({count})

| # | Category | Description | File |
|---|----------|-------------|------|
| 1 | {cat} | {desc} | {file:line} |

### Proposals ({count})

| # | Type | Description | Suggested Action |
|---|------|-------------|-----------------|
| 1 | {sub-type} | {desc} | {action} |
```

#### 6b. Project Lessons (`.claude/lessons.md`)

Append new LESSON findings. Format each as:

```markdown
### {Pattern Name}
- {Description with file:line reference}
- Source: evaluation ({date})
```

Place under the appropriate category section (`## LOGIC Patterns`, `## DESIGN Patterns`, etc.). If the section doesn't exist, create it.

#### 6c. Universal Lessons (`.claude/universal-lessons.md`)

Append only general patterns (not project-specific instances). Deduplicate against existing content. Format same as existing entries in that file.

#### 6d. Proposals (`.claude/eval-proposals.md`)

Append new PROPOSAL findings:

```markdown
## Proposal: {short title}

- **Status:** PENDING
- **Type:** {SKILL_CHANGE | PIPELINE_CHANGE | CONFIG_CHANGE | DEPENDENCY_CHANGE | RUBRIC_CHANGE}
- **Source:** {Codex/Gemini/Both} ({date})
- **Description:** {detailed description}
- **Suggested Action:** {what to change and where}
```

### Step 8: Verify Writes

After writing outputs, verify that learnings were actually persisted.

1. **If any LESSON findings:** Read `.claude/lessons.md` and `.claude/universal-lessons.md` to confirm entries appear.
2. **If any PROPOSAL findings:** Read `.claude/eval-proposals.md` to confirm proposals appear.
3. **Always:** Read `.claude/eval-report.md` and confirm it contains findings.

### Step 9: Clean Up

```bash
rm -f /tmp/lens-eval-codex.md
```

### Step 10: Summary

Print a summary to the conversation:

```
Phase 8: evaluation
  Evaluators: Codex {Y/N}, Gemini {Y/N}
  Findings: {N} total ({N} fixed, {N} skipped)
  Lessons: {N} new ({N} deduped)
  Proposals: {N} new
  Report: .claude/eval-report.md
```

End with: `EVALUATION_COMPLETE`
