---
name: fix
description: "Fast quality loop: Codex reviews, Claude fixes, Codex verifies. Accepts a path (review existing code) or a PRD (build then review). No pipeline. No phases. Just fix."
---

# /fix [path|PRD] [--dry-run]

Fast outside-in quality loop. Handles two modes:

- **Path mode:** Point it at existing code. Codex reviews, Claude fixes, Codex verifies.
- **PRD mode:** Give it a feature description or PRD file. Claude builds it fast, then Codex reviews, Claude fixes, Codex verifies.

Same command. It figures out which mode based on what you give it.

> **No arguments?** Describe this skill and stop. Do not execute.

## Why This Exists

The full `/build` and `/improve` pipelines trade quality for performance — 8 phases, multiple models, quality gates, evidence checklists. For most work, that's overkill.

`/fix` is the alternative. In path mode: one review-fix-verify loop on existing code. In PRD mode: Claude writes fast (no plan phase, no structure phase, no deduplication), then the same review-fix-verify loop cleans it up. Either way, an outside model (Codex) that didn't write the code reviews it without author bias.

**Cost:** ~2-3 Codex calls + Claude work. Not 8 phases.
**Time:** Minutes, not tens of minutes.

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Run Codex review only, show findings, don't fix (in PRD mode: build but don't fix) |

---

## Step 0: Determine Mode

Look at the argument ($1):

**It's a PRD if:**
- It's a `.md` file that contains requirements language (should, must, feature, user story, acceptance criteria)
- It's a multi-line description in quotes
- It starts with verbs like "build", "create", "add", "implement"
- It references something that doesn't exist yet

**It's a path if:**
- It's a directory or file that exists on disk
- It contains source code files

If ambiguous, ask. Don't guess.

---

## Step 1: Build (PRD mode only)

Skip this step entirely if in path mode — go straight to Step 2.

### Read the PRD

If $1 is a file, read it. If it's a quoted description, use it directly.

### Build fast

Implement the feature. Write the code. No planning phase, no structure phase, no hardening. Just build what the PRD asks for.

Rules for the build:
- Get the feature working. That's the only goal.
- Follow existing project conventions (check surrounding code for patterns)
- Put files where they belong based on project structure
- Don't over-engineer. Don't add defensive patterns "just in case." Don't write exhaustive comments. Just make it work.
- If the project has tests, write basic tests. If not, skip.
- Run lint and tests after building to make sure nothing is broken:

```bash
npm run lint 2>&1 || true
npm test 2>&1 || true
```

Fix anything that breaks the build. Don't fix warnings — Codex will catch what matters.

### Set the target

Set `{TARGET}` to the directory/files that were created or modified. This becomes the input for Step 2.

---

## Step 2: Detect and Load Canons

Determine what expertise applies to the target code. Check files in scope:

| Signal | Canon |
|--------|-------|
| `.ts`, `.tsx`, `tsconfig.json` | typescript, javascript |
| `.js`, `.jsx`, `.mjs` | javascript |
| `angular.json`, `*.component.ts` | angular |
| `.sql` files OR SQL strings in source | database |
| `.css`, `.scss`, `.html` with components | ui-ux |
| `*.test.*`, `*.spec.*` | testing patterns |
| `.md`, `README` | writing, docs |

Load the matching canon SKILL.md files from `canon/`. Extract the **anti-patterns** and **core principles** sections from each. These become the review criteria injected into the Codex prompt.

If `.claude/rubric/AUTO-DETECT.md` exists, also load matching rubrics for additional criteria.

Combine all extracted principles into `{CANON_CRITERIA}` — a numbered list of specific things to check.

## Step 3: Codex Review

Shell out to Codex for an independent review:

```bash
cd {TARGET} && codex exec -s read-only -o /tmp/lens-fix-review.md "CODE REVIEW — independent assessment.

Review ALL source code. Cite file:line for every finding. Be specific. No vague observations.

CHECK AGAINST THESE EXPERT CRITERIA:
{CANON_CRITERIA}

ALSO CHECK:
- AI-generated antipatterns: over-abstraction, defensive paranoia, single-use wrappers, comment spam, generic naming (data, info, result, item, handle, process, manage), reimplementing stdlib
- Functions over 30 lines
- Files over 300 lines
- Cyclomatic complexity over 10
- Dead code, unused imports, commented-out blocks
- Missing error handling or swallowed errors
- Security: injection, traversal, secrets in code, unsafe input

SEVERITY:
- CRITICAL: exploitable vulnerability, data loss, crash in production
- HIGH: would cause incidents, missing critical validation, architectural flaw
- MEDIUM: poor practice, inconsistent handling, AI smell, naming issue
- LOW: style, documentation, minor cleanup

OUTPUT FORMAT (strict — one finding per line):
FINDING: {severity} | {category} | {file:line} | {description} | {suggested fix}

End with:
TOTAL: {N} findings ({N} critical, {N} high, {N} medium, {N} low)
VERDICT: production-ready | needs-fixes | needs-rework" 2>&1
```

If `codex` is not installed, fall back to the pattern scanner:

```bash
SKILL_DIR="$(dirname "$(readlink -f workflow-skills/workflow/codex-review/SKILL.md)" 2>/dev/null || echo workflow-skills/workflow/codex-review)"
bash "$SKILL_DIR/review-bot.sh" {TARGET} --run --out /tmp/lens-fix-review.json
```

## Step 4: Parse Findings

Read `/tmp/lens-fix-review.md` (or `.json` for fallback). Parse all FINDING lines.

Sort by severity: CRITICAL → HIGH → MEDIUM → LOW.

If `--dry-run` was specified, print the findings report and stop here. Do not fix anything.

If Codex verdict is `production-ready` with zero CRITICAL/HIGH findings, print the clean report and stop. Nothing to fix.

## Step 5: Fix

Work through findings by priority. For each finding:

1. Read the file at the cited location
2. Understand the surrounding context (don't just pattern-match the fix)
3. Apply the minimal correct change
4. Move to the next finding

### Priority Order

**CRITICAL — fix all, no exceptions.**
- Security vulnerabilities → patch immediately
- Data loss risks → add protection
- Crash paths → add error handling

**HIGH — fix all.**
- Missing validation → add it
- Swallowed errors → preserve cause chain
- Architectural issues (within existing files only)

**MEDIUM — fix if contained.**
- AI smells → simplify (remove wrapper, inline single-use abstraction, delete obvious comments)
- Naming → rename to intent-revealing names
- Functions over 30 lines → extract
- Consistency issues → align with dominant pattern

**LOW — fix if trivial.**
- Style/formatting → fix if it's a one-line change
- Documentation gaps → add brief doc if function is public
- Skip anything that's purely cosmetic

### Scope Constraint

ALLOWED:
- Change logic within existing functions
- Add validation/checks to existing code paths
- Rename variables, functions, parameters
- Extract helper functions within the same file
- Inline single-use abstractions
- Delete dead code, unused imports, comment spam
- Add/improve error handling
- Add new files ONLY in PRD mode (if the build step created them, they're fair game)

FORBIDDEN:
- Adding new source files (in path mode — in PRD mode the build step handles file creation)
- Adding new external dependencies
- Rewriting modules (that's `/improve` territory)

## Step 6: Verify

Run Codex again to confirm fixes landed:

```bash
cd {TARGET} && codex exec -s read-only -o /tmp/lens-fix-verify.md "VERIFICATION PASS — confirm previous findings are resolved.

The following issues were found and fixes were applied. Verify each fix:

{LIST_OF_FINDINGS_AND_FIXES_APPLIED}

For each original finding, report:
VERIFIED: {file:line} | {original finding} | FIXED or STILL_PRESENT or REGRESSION

Also check for NEW issues introduced by the fixes:
NEW_ISSUE: {severity} | {file:line} | {description}

End with:
ORIGINAL_FIXED: {N}/{M}
NEW_ISSUES: {N}
VERDICT: clean | has-remaining | has-regressions" 2>&1
```

Read `/tmp/lens-fix-verify.md`. Parse results.

### If STILL_PRESENT findings exist:
Apply fixes for any remaining CRITICAL or HIGH items. Skip remaining MEDIUM/LOW — diminishing returns.

### If REGRESSION found:
Fix the regression. This takes priority over everything.

### If NEW_ISSUES found:
Fix if CRITICAL or HIGH. Log MEDIUM/LOW in the report but don't chase them — that's a second `/fix` run if the developer wants it.

## Step 7: Lint and Test

```bash
npm run lint 2>&1 || true
npm test 2>&1 || true
```

If tests fail due to fixes, fix the code to pass the existing tests. Do not modify tests to match new code.

## Step 8: Clean Up

```bash
rm -f /tmp/lens-fix-review.md /tmp/lens-fix-review.json /tmp/lens-fix-verify.md
```

## Step 9: Report

```
## /fix Report: {target}
### Mode: {PRD | Path}

### Build (PRD mode only)
- Files created: N
- Files modified: N
- Tests: {written | skipped}

### Review (Codex)
| Severity | Count |
|----------|-------|
| Critical | N |
| High     | N |
| Medium   | N |
| Low      | N |

### Fixes Applied
| # | Severity | File:Line | What | Canon |
|---|----------|-----------|------|-------|
| 1 | HIGH | src/auth.ts:30 | Added input validation | security-mindset |
| 2 | MEDIUM | src/utils.ts:15 | Inlined single-use wrapper | refactoring |

### Verification (Codex)
- Original findings fixed: N/M
- New issues: N
- Regressions: N
- Verdict: {clean | has-remaining | has-regressions}

### Skipped (by design)
- N LOW findings (cosmetic/style)
- N MEDIUM findings (would require new files or deps)

### Test/Lint
- Lint: {pass | N warnings | N errors}
- Tests: {pass | N failures}

FIX_COMPLETE: {N} fixes applied, verified by Codex
```

---

## Decision Tree

```
/fix "Add user auth with JWT"          (PRD mode)
/fix docs/auth-feature.md              (PRD mode — file with requirements)
/fix src/features/auth                  (Path mode — existing code)
/fix src/                               (Path mode — whole project)
  │
  ├─ PRD? → Claude builds fast (no planning, no phases)
  │         └─ Sets target to new/modified files
  │
  ├─ Codex reviews (independent, didn't write this code)
  │   └─ production-ready? → DONE
  │   └─ findings? → continue
  │
  ├─ Claude fixes (CRITICAL → HIGH → MEDIUM → LOW)
  │
  ├─ Codex verifies (did fixes land? any regressions?)
  │   └─ clean? → DONE
  │   └─ remaining CRITICAL/HIGH? → fix those, stop
  │   └─ regression? → fix regression, stop
  │
  └─ Report
```

## When to Use

| Situation | Command |
|-----------|---------|
| New feature, want it fast with quality | `/fix "description"` or `/fix prd.md` |
| Existing code needs cleanup | `/fix src/path` |
| One small targeted change | `/change` |
| Just want to see issues, no fixing | `/fix --dry-run` or `/codex-scan` |
| Need full pipeline with lessons and phases | `/build` or `/improve` |
