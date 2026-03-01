---
name: fix
description: "Review against canons + quality gate, fix findings, verify. Claude-native — no external models."
---

# /fix [path] [--dry-run]

Review existing code against canons and the quality gate, fix findings, verify.

> **No arguments?** Describe this skill and stop. Do not execute.

## Why This Exists

`/fix` is the focused quality pass. The quality gate catches deterministic violations (secrets, injection, async void, naming). Claude catches subjective issues (canon anti-patterns, rubric criteria, design smells). Together they cover both static analysis and expert review — no external models, no MCP servers.

**Cost:** Gate run + Claude reading/fixing. Minutes.

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Run gate + review only, show findings, don't fix |

---

## Step 1: Detect and Load Canons

Determine what expertise applies to the target code. Check files in scope:

| Signal | Canon |
|--------|-------|
| `.ts`, `.tsx`, `tsconfig.json` | typescript, javascript |
| `.js`, `.jsx`, `.mjs` | javascript |
| `.cs`, `*.csproj` | csharp-depth |
| `.java` | java |
| `angular.json`, `*.component.ts` | angular |
| `.sql` files OR SQL strings in source | database |
| `.css`, `.scss`, `.html` with components | ui-ux |
| `*.test.*`, `*.spec.*` | testing patterns |
| `.md`, `README` | writing, docs |

Load the matching canon SKILL.md files from `canon/`. Extract the **anti-patterns** and **core principles** sections from each. These become the review criteria.

If `.claude/rubric/AUTO-DETECT.md` exists, also load matching rubrics for additional criteria.

Combine all extracted principles into `{CANON_CRITERIA}` — a numbered list of specific things to check.

## Step 2: Quality Gate (Deterministic)

Run the quality gate against the target:

```bash
tsx node_modules/lens-scan-lite/scripts/quality-gate.ts {TARGET} 2>&1
```

If the gate script is not at that path, search for it:
```bash
find . -path "*/scripts/quality-gate.ts" -not -path "*/node_modules/*" 2>/dev/null | head -1
```

Parse the output for violations. Each violation becomes a finding with:
- File and line number
- Check name (e.g., `shell-injection`, `async-void`, `hardcoded-secret`)
- Message describing the issue

Gate violations are deterministic — they must be fixed.

## Step 3: Claude Review (Judgment)

Read ALL target files with canons loaded. Review against:

1. Canon anti-patterns from `{CANON_CRITERIA}`
2. Rubric review criteria (from `.claude/rubric/`)
3. AI-generated antipatterns: over-abstraction, defensive paranoia, single-use wrappers, comment spam, generic naming (data, info, result, item, handle, process, manage), reimplementing stdlib
4. Functions over 30 lines
5. Files over 300 lines
6. Dead code, unused imports, commented-out blocks
7. Missing error handling or swallowed errors
8. Security: injection, traversal, secrets in code, unsafe input

Produce findings in the same format:

```
FINDING: {severity} | {category} | {file:line} | {description} | {suggested fix}
```

Severity levels:
- **CRITICAL:** exploitable vulnerability, data loss, crash in production
- **HIGH:** would cause incidents, missing critical validation, architectural flaw
- **MEDIUM:** poor practice, inconsistent handling, AI smell, naming issue
- **LOW:** style, documentation, minor cleanup

### Merge Findings

Combine gate violations and Claude review findings. Deduplicate — if the gate already caught something (e.g., shell injection), don't repeat it from the review.

Sort all findings by severity: CRITICAL → HIGH → MEDIUM → LOW.

If `--dry-run` was specified, print the findings report and stop here. Do not fix anything.

If zero CRITICAL/HIGH findings and gate passed, print the clean report and stop. Nothing to fix.

## Step 4: Fix

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

FORBIDDEN:
- Adding new source files
- Adding new external dependencies
- Rewriting modules (that's a larger effort)

## Step 5: Verify

Run the quality gate again:

```bash
tsx node_modules/lens-scan-lite/scripts/quality-gate.ts {TARGET} 2>&1
```

Gate violations must be zero — deterministic issues must be resolved.

Re-read changed files. Confirm subjective fixes landed correctly. Check for:
- **STILL_PRESENT:** original finding not addressed
- **REGRESSION:** fix introduced a new problem
- **NEW_ISSUE:** something else discovered

### If STILL_PRESENT findings exist:
Apply fixes for any remaining CRITICAL or HIGH items. Skip remaining MEDIUM/LOW — diminishing returns.

### If REGRESSION found:
Fix the regression. This takes priority over everything.

### If NEW_ISSUE found:
Fix if CRITICAL or HIGH. Log MEDIUM/LOW in the report but don't chase them — that's a second `/fix` run if the developer wants it.

## Step 6: Lint and Test

```bash
npm run lint 2>&1 || true
npm test 2>&1 || true
```

If tests fail due to fixes, fix the code to pass the existing tests. Do not modify tests to match new code.

## Step 7: Report

```
## /fix Report: {target}

### Gate Violations
| Severity | Count |
|----------|-------|
| Critical | N |
| High     | N |
| Medium   | N |
| Low      | N |

### Review Findings
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

### Verification
- Gate rerun: {pass | N remaining violations}
- Review recheck: {clean | N remaining findings}
- Regressions: N
- Verdict: {clean | has-remaining | has-regressions}

### Skipped (by design)
- N LOW findings (cosmetic/style)
- N MEDIUM findings (would require new files or deps)

### Test/Lint
- Lint: {pass | N warnings | N errors}
- Tests: {pass | N failures}

FIX_COMPLETE: {N} fixes applied, verified by gate + review
```

---

## When to Use

| Situation | Command |
|-----------|---------|
| Existing code needs cleanup | `/fix src/path` |
| One small targeted change | `/change` |
| Just want to see issues, no fixing | `/fix --dry-run` or `/code-scan` |
