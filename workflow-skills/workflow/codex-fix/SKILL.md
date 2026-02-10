---
name: codex-fix
description: "Internal phase: independent Codex review + targeted fixes. Not user-facing."
---

# codex-fix [path]

Internal pipeline phase. Invokes OpenAI Codex CLI for an independent code review, then applies fixes based on its findings. This provides multi-model triangulation — a different model's perspective after Claude implementation and Gemini review.

> **This is an internal phase.** It is called by `/build` and `/improve` orchestrators. Do not expose as a user command.

## Scope Constraint (MANDATORY)

Fix bugs and vulnerabilities IN PLACE. Do not restructure.

ALLOWED:
- Change logic within an existing function
- Add validation/checks to existing code paths
- Fix crypto/security bugs in existing implementations

FORBIDDEN:
- Adding new files
- Adding new types/interfaces
- Adding new exported functions
- Splitting existing functions into multiple
- Moving code between files
- Adding new dependencies

If a finding genuinely requires restructuring to fix, DO NOT fix it.
Report it as DEFERRED_TO_HUMAN with a one-line explanation. These are
the ONLY items allowed in UNFIXED.

---

## Step 1: Run Codex Review

Invoke Codex CLI non-interactively against the target:

```bash
codex exec -s read-only -o /tmp/lens-codex-review.md "Review all source code in {TARGET} for production readiness. Focus on: 1) AI-generated code smells — verbose defensive patterns nobody asked for, single-use wrapper functions, excessive comments restating obvious code, console.error/console.log that leak implementation details, unnecessary try/catch that swallow context, over-abstraction for one-time operations 2) Security vulnerabilities — secret leakage in errors/logs, crypto implementation flaws, input validation gaps, path traversal 3) Reliability — cross-filesystem operations, atomic writes, error handling that swallows context 4) Operational gaps — missing env var support for CI/CD, unclear add-vs-update semantics 5) Architecture — god files, tight coupling, missing abstractions. Be specific: cite file:line for every finding. Rate overall as production-ready, production-leaning, or not-production-ready." 2>&1
```

If `codex` is not installed, fall back to Step 1b. If it fails for any other reason, log the error and fall back to Step 1b.

### Step 1b: Fallback — Pattern Scanner

Run the review-bot.sh script bundled with this skill:

```bash
SKILL_DIR="$(dirname "$(readlink -f .claude/phases/codex-fix/SKILL.md)" 2>/dev/null || dirname .claude/phases/codex-fix/SKILL.md)"
bash "$SKILL_DIR/review-bot.sh" {TARGET} --run --out /tmp/lens-codex-report.json
```

## Step 2: Read the Codex Review

Read `/tmp/lens-codex-review.md` (or `/tmp/lens-codex-report.json` if fallback was used).

For Codex review output, parse all findings with file:line references. Categorize by:
- **Security** — vulnerabilities, secret leakage, crypto issues
- **Reliability** — cross-filesystem, atomicity, error handling
- **Operational** — UX gaps, CI/CD support, unclear semantics
- **Architecture** — structural issues, coupling, missing abstractions

If Codex found no issues and rated the code production-ready, skip to Step 4.

## Step 3: Apply Fixes

Work through Codex findings by priority:

### Priority 1: Security
Apply every security fix Codex identified. These are non-negotiable.
- Secret leakage in error messages → sanitize
- Crypto weaknesses → fix implementation
- Input validation gaps → add validation
- Path traversal → use safe path construction

### Priority 2: Reliability
- Cross-filesystem rename → write temp file in same directory as target
- Non-atomic writes → use write-then-rename pattern
- Error handling that swallows context → preserve cause chain

### Priority 3: Operational
- Password UX → support env var (`KEYCHAIN_PASSWORD` or similar) for CI/CD
- Unclear semantics (add vs overwrite) → make behavior explicit, require flags for destructive operations

### Priority 4: Architecture
- Apply only if the fix is contained (< 20 lines changed per finding)
- Skip large refactors — those belong in earlier phases

For each fix: read the file, understand context, apply the minimal safe change. Do not rewrite surrounding code.

## Step 4: Product Quality Review

Review the code **as a user, not an engineer.** Code review catches bad code.
This step catches bad products built with good code.

### 4a. Defaults and First-Run Experience

Check every configurable value (file paths, ports, URLs, timeouts). For each:
- Is the default stable across runs? (Randomized or timestamped defaults = CRITICAL)
- Does the default work without setup? (e.g., creates parent directories)
- Can a user run the tool with zero flags and get a useful result?

Flag: values that change per-invocation, require non-existent directories, or
force the user to pass a flag that should have a sensible default.

### 4b. Interactive Fallbacks

Check every required input (passwords, tokens, API keys). For each:
- If not provided via flag or env var, does the tool prompt interactively?
- If stdin is not a TTY, does it fail with a clear message naming the flag/env var?

Flag: required inputs that crash or produce cryptic errors when omitted.

### 4c. Feature Completeness

Check every data model field and internal capability. For each:
- Is there a CLI command or flag that lets users control it?
- If intentionally internal-only, is this documented in `--help`?

Flag: capabilities the code supports but no user can reach (orphaned features).

### 4d. Error UX

Run through failure scenarios: wrong password, missing file, invalid input.
- Does the error message tell the user what to do?
- Does the process exit with a non-zero code?
- Are stack traces hidden from end users?

Flag: raw stack traces, exit code 0 on failure, errors that don't say what went wrong.

### 4e. Competitor Parity

If the tool has a clear category (CLI keystore, config manager, etc.):
- Does it match basic UX expectations? (e.g., password managers prompt for passwords)
- Are there obvious missing commands that every similar tool has?

### Apply Product Fixes

Product quality issues follow the same priority as code issues. Fix them in place
using the Scope Constraint rules. If a fix requires a new file or restructuring,
report as DEFERRED_TO_HUMAN.

## Evidence Checklist (MANDATORY)

After applying all fixes, produce an evidence checklist. Write to `.claude/evidence/` (create directory if needed).

### Checklist 7a: Auth + Failure Paths

Review EVERY catch block in the codebase. Write to `.claude/evidence/codex-7a.md`:

```markdown
# Evidence: Codex 7a — Auth + Failure Paths

| Location | Item | Verdict | Reasoning |
|----------|------|---------|-----------|
| src/auth.ts:30 | catch block re-throws with context | PASS | Preserves error cause chain |
| src/db.ts:55 | catch swallows error silently | FAIL | Empty catch loses error context |
```

Every row must have a PASS or FAIL verdict. No blanks. The machine gate validates row counts against codebase counters — incomplete checklists block the pipeline.

## Step 5: Verify

Run lint and tests:

```bash
npm run lint 2>&1 || true
npm test 2>&1 || true
```

If tests fail due to fixes in this phase, fix the code, not the tests.

## Step 6: Clean Up

```bash
rm -f /tmp/lens-codex-review.md /tmp/lens-codex-report.json
```

## Step 7: Summary

Report:
- Codex's overall rating (production-ready / production-leaning / not-production-ready)
- Number of findings by category (security, reliability, operational, architecture, product-quality)
- Number of fixes applied vs deferred
- Any findings left unresolved (with reason)
- Product quality findings (defaults, prompts, orphaned features, error UX)

End with: CODEX_CHECK_COMPLETE
