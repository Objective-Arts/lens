---
name: codex-review
description: "Internal phase: independent Codex review + targeted fixes. Not user-facing."
---

# codex-review [path]

Internal pipeline phase. Invokes OpenAI Codex CLI for an independent code review, then applies fixes based on its findings. This provides multi-model triangulation — a different model's perspective after Claude implementation and Gemini review.

> **This is an internal phase.** It is called by `/build` and `/improve` orchestrators. Do not expose as a user command.

## Scope Constraint (MANDATORY)

Fix ALL findings for production readiness. Every issue gets fixed. No deferring, no "backlog for next cycle," no "appropriate for MVP."

ALLOWED:
- Change logic within an existing function
- Add validation/checks to existing code paths
- Fix crypto/security bugs in existing implementations
- Add private helper methods within existing files
- Add config entries, constants, enums to existing files
- Add interfaces to existing files if needed for proper typing
- Restructure function internals (keep same signature)

FORBIDDEN:
- Adding new source files (config files are OK)
- Moving code between files
- Adding new external dependencies

If a finding seems to require restructuring: fix it anyway by
restructuring within the existing file. The only acceptable
unfixed items are findings that require adding new external
dependencies — report those with a one-line explanation.

---

## Step 0: Load Rubric

Read `.claude/rubric/AUTO-DETECT.md` for the detection table. Then:

1. **Always load:** `.claude/rubric/base.md` and `.claude/rubric/product-quality.md`
2. **Auto-detect domains:** Check target files against the detection table. Load matching domain rubrics (`.claude/rubric/web-api.md`, `.claude/rubric/data-persistence.md`, `.claude/rubric/cli.md`, `.claude/rubric/microservice.md`).
3. **Extract Review Criteria:** From each loaded rubric, collect the numbered items under `## Review Criteria`. Combine into a single criteria list for the Codex prompt.
4. **Extract Product Quality Criteria:** From `.claude/rubric/product-quality.md`, collect the Review Criteria for the product quality review in Step 4.

If a rubric file doesn't exist, skip it and continue.

## Step 1: Run Codex Review

Invoke Codex CLI non-interactively against the target:

```bash
cd {TARGET} && codex exec -s read-only -o /tmp/lens-codex-review.md "PRODUCTION READINESS review. Review ALL source code and cite file:line for every finding.

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

Replace `{RUBRIC_CRITERIA}` with the combined Review Criteria from all loaded rubric files, numbered sequentially.

**Note:** Test Coverage is handled by the testing phase — include a single line: "N. Test Coverage: tests exist, edge cases covered, meaningful assertions (handled by testing phase)".

If `codex` is not installed, fall back to Step 1b. If it fails for any other reason, log the error and fall back to Step 1b.

### Step 1b: Fallback — Pattern Scanner

Run the review-bot.sh script bundled with this skill:

```bash
SKILL_DIR="$(dirname "$(readlink -f .claude/phases/codex-review/SKILL.md)" 2>/dev/null || dirname .claude/phases/codex-review/SKILL.md)"
bash "$SKILL_DIR/review-bot.sh" {TARGET} --run --out /tmp/lens-codex-report.json
```

## Step 2: Read the Codex Review

Read `/tmp/lens-codex-review.md` (or `/tmp/lens-codex-report.json` if fallback was used).

For Codex review output, parse all findings with file:line references. Categorize by:
- **Security** — vulnerabilities, secret leakage, crypto issues, injection, path traversal
- **Reliability** — error handling, resource cleanup, cross-filesystem, atomicity, bounded operations
- **Deployability** — build, lockfile, externalized config, health checks, graceful shutdown
- **Operational Hygiene** — logging quality, error UX, documentation, CI/CD support
- **AI Code Smells** — verbose defensive patterns, single-use wrappers, comment spam, over-abstraction
- **Test Coverage** — missing tests, edge cases, assertions
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

Walk through each criterion from `.claude/rubric/product-quality.md` (loaded in Step 0). For each criterion, check the target code and flag violations.

### Apply Product Fixes

Product quality issues follow the same priority as code issues. Fix them in place
using the Scope Constraint rules. If a fix seems to require a new file, restructure
within the existing file instead. Every product quality issue gets fixed.

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
- Number of findings by category (security, reliability, deployability, operational-hygiene, ai-smells, test-coverage, architecture, product-quality)
- Number of fixes applied vs deferred
- Any findings left unresolved (with reason)
- Product quality findings (defaults, prompts, orphaned features, error UX)

End with: CODEX_REVIEW_COMPLETE
