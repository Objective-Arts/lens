---
name: improve
description: "Plan and improve existing code with quality gates."
---

# /improve [path] [--dry-run] [--rollback]

Plan and improve existing code with quality gates, canon review, and verification.

> **No arguments?** Describe this skill and stop. Do not execute.

## When to Use

- Refactoring a module or component
- Quality pass on existing code
- Technical debt cleanup
- Intentional enhancements beyond what `/cleanup` catches

**Don't use for:** New features → `/build` | Simple changes → `/change` | Review + fix against canons → `/cleanup`

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the improvement plan without making changes |
| `--rollback` | Restore from last improve stash |

---

## Step 1: Analyze

Read ALL files in the target path. Understand:

- Architecture and module boundaries
- Existing patterns and conventions
- Pain points: complexity, duplication, poor naming, missing abstractions
- Dependencies between files

## Step 2: Detect and Load Canons

Check files in scope for technology signals:

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

Load matching canon SKILL.md files from `.claude/canon/`. Extract **anti-patterns** and **core principles**. These become `{CANON_CRITERIA}`.

If `.claude/rubric/AUTO-DETECT.md` exists, load matching rubrics.

Load lessons from `.claude/universal-lessons.md` and `.claude/lessons.md` if they exist.

## Step 3: Plan

Produce a numbered improvement plan. For each item:

1. File path
2. What to change
3. Why (which canon, rubric, or principle)
4. Risk level (low / medium / high)

Order by risk: low-risk changes first, high-risk last.

Present the plan to the conversation.

If `--dry-run`, display the plan and stop. Emit `IMPROVE_DRY_RUN`.

## Step 4: Rollback Point

Before modifying any files:

```bash
git stash push -m "improve:$(basename {TARGET}):$(date +%s)"
```

Report the stash ref.

If `--rollback` was specified instead:

```bash
git stash list | grep "improve:" | head -1
# Extract stash ref and pop it
git stash pop <ref>
```

Then stop.

## Step 5: Implement

Apply improvements in plan order. For each item:

1. Re-read the file before changing (never edit from stale memory)
2. Apply the minimal correct change
3. Verify it compiles/parses before moving to the next item
4. Re-read the file after writing to confirm correctness

Follow the quality gate rules to pass on the first attempt:

**SECURITY (instant fail):**
- No hardcoded secrets (API keys, passwords, tokens, private keys)
- No exec()/execSync() with template literals — use spawn() with args
- No path.join/resolve with user input without traversal validation
- No eval(), innerHTML assignment, or document.write()

**NAMING:**
- No parameters named: data, info, result, item, obj, val, tmp, temp, ret, res
- No single-letter parameters (except _, i, j, k, e)
- No exported functions shorter than 4 characters
- No files named: utils.ts, helpers.ts, misc.ts, common.ts, shared.ts
- No abbreviations in exports: mgr, impl, proc, svc, repo

**SIZE LIMITS:**
- Functions: max 30 significant lines
- Files: max 300 lines
- Parameters per function: max 4
- Exports per file: max 10 (index.ts exempt)
- Project imports per file: max 8
- Class methods: max 10

**CODE QUALITY:**
- No magic numbers (except -1, 0, 1, 2) — extract to named constants
- No magic strings in conditionals — extract to constants
- No circular imports
- Types/interfaces before functions in each file
- No empty catch blocks

## Step 6: Quality Gate #1

Run the quality gate:

```bash
tsx .claude/scripts/quality-gate.ts {TARGET} 2>&1
```

If the gate script is not at that path:
```bash
find . -path "*/.claude/scripts/quality-gate.ts" 2>/dev/null | head -1
```

Parse violations. If any exist, fix them and rerun. Max 2 retries.

## Step 7: Canon Review + Fix

Review ALL changed files against:

1. Canon anti-patterns from `{CANON_CRITERIA}`
2. Rubric review criteria (from `.claude/rubric/`)
3. AI-generated antipatterns: over-abstraction, defensive paranoia, single-use wrappers, comment spam, generic naming, reimplementing stdlib
4. Functions over 30 lines, files over 300 lines
5. Dead code, unused imports, commented-out blocks
6. Missing error handling or swallowed errors
7. Security: injection, traversal, secrets in code, unsafe input

Produce findings:

```
FINDING: {severity} | {category} | {file:line} | {description} | {suggested fix}
```

Severity levels:
- **CRITICAL:** exploitable vulnerability, data loss, crash in production
- **HIGH:** would cause incidents, missing critical validation, architectural flaw
- **MEDIUM:** poor practice, AI smell, naming issue
- **LOW:** style, documentation, minor cleanup

Fix by priority: CRITICAL → HIGH → MEDIUM (if contained) → LOW (if trivial).

**Scope constraint:** Only modify code directly related to findings. Do not refactor unflagged code.

**Complexity budget:** Net-zero or net-negative lines/functions/types. Security fixes exempt.

## Step 8: Quality Gate #2

Rerun the gate:

```bash
tsx .claude/scripts/quality-gate.ts {TARGET} 2>&1
```

Must pass. Max 2 retries. If still failing after retries, report remaining violations.

## Step 9: Lint + Test

```bash
npm run lint 2>&1 || true
npm test 2>&1 || true
```

If lint errors or test failures were caused by changes, fix them. Do not modify existing tests to match new code unless the test was testing the old (now-improved) behavior.

## Step 10: Report

```
## /improve Report: {target}

### Plan
{numbered list from Step 3}

### Changes Applied
| # | File | What Changed | Why | Risk |
|---|------|-------------|-----|------|
| 1 | src/foo.ts | Extracted validation | clarity canon | low |

### Gate Results
| Gate | Status |
|------|--------|
| Gate #1 | {pass | N violations → fixed} |
| Gate #2 | {pass | N violations → fixed} |

### Review Findings
| # | Severity | File:Line | What | Canon |
|---|----------|-----------|------|-------|
| 1 | MEDIUM | src/foo.ts:30 | Inlined single-use wrapper | refactoring |

### Verification
- Lint: {pass | N warnings | N errors}
- Tests: {pass | N failures}

### Rollback
Rollback: /improve --rollback

IMPROVE_COMPLETE
```

---

## Key Differences from Other Workflows

| Workflow | When to Use |
|----------|-------------|
| `/improve` | Planned enhancements to existing code — identifies what *should* change |
| `/cleanup` | Review + fix what exists against canons — reacts to what's wrong |
| `/build` | New feature from description/PRD — creates new files |
| `/change` | One small change, done right |
