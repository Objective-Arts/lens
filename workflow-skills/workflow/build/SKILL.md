---
name: build
description: Build a new feature from scratch. 5-stage quality pipeline (Design → Build → Refine → Review → Verify) with learning loop and rollback support.
---

# /build [path|description] [--rollback] [--dry-run]

Build a new feature, component, or module from scratch using the full 5-stage quality pipeline.

> **No arguments?** Describe this skill and stop. Do not execute.

## What Is This?

`/build` is the **heavy workflow** for creating new code. It runs 5 stages:

1. **Design** — Plan the feature, map architecture, assign quality contracts
2. **Build** — Write the code, verify it compiles and runs
3. **Refine** — Refactor, dedupe, enforce complexity budget
4. **Review** — Multi-model external review, security audit, AI smell removal
5. **Verify** — Write tests, final evaluation, write lessons

A **Learn** loop feeds findings from late stages back to early stages on future runs. Gates between stages run lint, quality checks, and Qodana without burning AI context. Each stage must pass its gate before the next begins. A rollback point is created before any changes.

**Context cost:** ~4,200 tokens (Base Brain) + phase-specific skills

## When to Use

- **New feature from PRD** — "Build user authentication"
- **New component** — "Build a date picker component"
- **New service/module** — "Build the payment processing module"
- **Greenfield code** — When you're starting fresh

**Don't use for:**
- Improving existing code → use `/improve`
- Simple changes (add field, rename) → use `/quick-edit`
- Quick cleanup → use `/quick-clean`

## Usage

```
/build user authentication system
/build src/components/DatePicker
/build payment-processing --dry-run
/build --rollback
```

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the stages and phases without executing |
| `--rollback` | Restore from last build stash |

## Orchestrator Rules

1. **NEVER do phase work yourself** — you are a sequencer, not an implementer
2. **NEVER skip a phase** — every phase runs in order
3. **NEVER proceed without gate marker** — the subagent result must contain the marker string
4. **ALWAYS present Phase 1 plan to user for approval** before continuing
5. **ALWAYS create rollback point first** before any phase runs
6. **ALWAYS record metrics** after each phase completes
7. **NEVER accept >10% test failures** — if more than 10% of tests fail for any reason (provider limitations, missing infrastructure), the gate fails and must be fixed
8. **NEVER wave through "infrastructure limitation" test failures** — if tests fail because the test setup is wrong (e.g., InMemory provider doesn't support transactions), fix the test setup (e.g., use SQLite in-memory), don't skip the failures
9. **NEVER allow "out of scope" as a security finding disposition** — if a security review phase identifies a vulnerability (missing auth, injection, data exposure), it must be fixed or escalated to the user with a concrete fix proposal. "Out of scope" and "architectural gap by design" are not valid dispositions. If the fix is too large for the current phase, create a blocking work item — do not silently accept the risk.
10. **ALWAYS action Codex/Gemini findings** — when Codex or Gemini returns findings (in any phase or post-pipeline review), every finding must be either fixed or explicitly escalated to the user with justification. Summarizing findings without fixing them is not acceptable. The orchestrator must spawn a fix agent for unresolved findings before the pipeline can complete.
11. **ALWAYS write runtime constraints after Phase 3** — after Phase 3 completes, write a `.claude/runtime-constraints.md` file documenting any runtime-specific constraints discovered during implementation (e.g., "SQLite can't translate DateTimeOffset comparisons — use client-side filtering", "Only ReadCommitted isolation supported"). Every subsequent phase (4-11) must read this file before making changes. If a phase's changes would violate a runtime constraint, the change must not be made.
12. **EXEMPT security fixes from complexity budget** — if a fix addresses a security finding (missing auth, injection, data exposure, missing HTTPS), it is allowed to add lines, files, and functions without requiring removals elsewhere. Security is not negotiable against a line count.
13. **NEVER make error handling silent** — if a review phase changes a `throw` to a log-and-continue, that is a regression, not a fix. Fail-fast on misconfiguration (CORS, auth, connection strings) is always correct. Silent failures in production config are worse than crashes.

## Rollback

If `--rollback` flag is set:

```bash
git stash list | grep "build:" | head -1
# Extract stash ref and pop it
git stash pop <ref>
```

Then stop. Do not run any phases.

## Dry Run

If `--dry-run` flag is set, print the phase table below and stop. Do not run any phases or create a rollback point.

## Phase Table

| # | Skill | Model | Gate Marker | Notes |
|---|-------|-------|-------------|-------|
| 1 | create-plan | sonnet | PLAN_COMPLETE | Pause for user approval |
| 2 | structure-first | sonnet | STRUCTURE_COMPLETE | |
| 3 | implement-plan | opus | IMPLEMENT_COMPLETE | Only phase needing Opus |
| 3.5 | **machine-gate** | **none** | exit code 0 | quality-gate + construction check |
| 3.7 | **smoke-test** | **none** | exit code 0 | Start app, hit endpoints, verify frontend serves |
| 4 | refactor-check-fix | sonnet | REFACTOR_COMPLETE | |
| 5 | dedupe-fix | haiku | DEDUPE_COMPLETE | Pattern-match and apply |
| 6 | gemini-fix | sonnet | FIX_COMPLETE | Gemini code + product quality review |
| 7 | codex-fix | sonnet | CODEX_FIX_COMPLETE | Independent Codex review + fixes (eval rubric) |
| 7.5 | **machine-gate** | **none/haiku** | exit code 0 | Qodana scan; Haiku fixer only if issues found |
| 7.7 | **smoke-test** | **none** | exit code 0 | Re-verify app starts after review phases |
| 8 | adversarial-security-review | sonnet | VERIFIED_CLEAN | Gemini reviews, agent applies |
| 9 | ai-smell-fix | haiku | AI_SMELL_COMPLETE | Pattern-match and apply |
| 9.5 | **machine-gate** | **none** | exit code 0 | npm test + quality-gate |
| 10 | write-tests-run | sonnet | TEST_COMPLETE | |
| 11 | final-eval-check | sonnet | EVAL_COMPLETE | Codex + Gemini review, fix all, write lessons |
| 11.5 | **machine-gate** | **none** | exit code 0 | test + quality-gate + smoke-test (final) |

## Execution

### Step 0: Start Metrics

```bash
tsx scripts/quality-gate.ts start-metrics build {TARGET}
```

### Step 1: Create Rollback Point

```bash
git stash push -m "build:$(basename {TARGET}):$(date +%s)"
```

Report the stash ref to the user.

### Step 2: Run Phases

For each phase in the table above, spawn a **single Task subagent** (`subagent_type: "general-purpose"`) with the `model` parameter set to the value in the Phase Table's Model column.

Record the start time before spawning each subagent. After each phase completes, record metrics:

```bash
tsx scripts/quality-gate.ts record-metrics {PHASE_NAME} {ISSUES_FOUND} {ISSUES_FIXED} {DURATION_MS} {TARGET}
```

Parse `ISSUES_FOUND` and `ISSUES_FIXED` from the subagent output when available (e.g., gemini-fix reports these). For phases that don't report counts, use 0 for both.

#### Subagent Prompt Template

For phases 1-2, 10 (no MCP tools needed):

```
Read the skill file at .claude/phases/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

For phase 3 (implement-plan):

```
Read the skill file at .claude/phases/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

IMPORTANT: Follow the compile loop. For each unit: refresh the relevant
canon principle, write the code, then compile-check before starting the
next unit. Do not write all code first and check later.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

For phases 4-5, 9 (review phases, no MCP tools) — add complexity budget and completeness rule:

```
Read the skill file at .claude/phases/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

RUNTIME CONSTRAINTS: Read .claude/runtime-constraints.md FIRST. Do not
make changes that violate any listed constraint. If the file says "do not
use GroupBy with SQLite", do not rewrite queries to use GroupBy.

SCOPE CONSTRAINT: Only modify code directly related to findings you identify.
Do not refactor, rename, or restructure code that was not flagged as an issue.
Do not "improve" surrounding code while fixing a specific finding.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
After your changes, the codebase must have the same or fewer: files,
exported functions, types/interfaces, and total lines. If your fix
adds lines, find lines elsewhere to remove. Net-zero or net-negative.
EXCEPTION: Security fixes (auth, injection, HTTPS) are exempt from this budget.

COMPLETENESS RULE: If you change infrastructure (DB initialization, startup
config, static file serving, package references), you must complete the
full change. Do not change EnsureCreated() to Migrate() without generating
migrations. Do not change file paths without updating middleware config.
Half-finished infrastructure changes will break the smoke test gate.

NO SILENT FAILURES: Do not change a throw/crash to a log-and-continue.
Fail-fast on misconfiguration is always correct. If CORS is not configured
in production, the app must throw, not silently disable CORS.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

For phase 6 (gemini-fix) — add to prompt:

```
You have access to the mcp__gemini-reviewer__gemini_review tool for code review.
Use it as instructed by the skill. This includes the product quality review step.

RUNTIME CONSTRAINTS: Read .claude/runtime-constraints.md FIRST. Do not
make changes that violate any listed constraint.

SCOPE CONSTRAINT: Only modify code directly related to findings you identify.
Do not refactor, rename, or restructure code that was not flagged as an issue.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
Net-zero or net-negative lines/functions/types.
EXCEPTION: Security fixes (auth, injection, HTTPS) are exempt from this budget.

COMPLETENESS RULE: If you change infrastructure, complete the full change.
Half-finished infrastructure changes will break the smoke test.

NO SILENT FAILURES: Do not change a throw/crash to a log-and-continue.
Fail-fast on misconfiguration is always correct.
```

For phase 7 (codex-fix) — independent Codex review:

```
Read the skill file at .claude/phases/codex-fix/SKILL.md
and execute ALL of its instructions against: {TARGET}

RUNTIME CONSTRAINTS: Read .claude/runtime-constraints.md FIRST. Do not
make changes that violate any listed constraint.

SCOPE CONSTRAINT: Only modify code directly related to findings you identify.
Do not refactor, rename, or restructure code that was not flagged as an issue.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
Net-zero or net-negative lines/functions/types.
EXCEPTION: Security fixes (auth, injection, HTTPS) are exempt from this budget.

COMPLETENESS RULE: If you change infrastructure (DB initialization, startup
config, static file serving, package references), you must complete the
full change. Do not change EnsureCreated() to Migrate() without generating
migrations. Do not change file paths without updating middleware config.
Half-finished infrastructure changes will break the smoke test gate.

NO SILENT FAILURES: Do not change a throw/crash to a log-and-continue.
Fail-fast on misconfiguration is always correct.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: CODEX_FIX_COMPLETE
```

For phase 8 (adversarial-security-review) — add to prompt:

```
You have access to the mcp__gemini-reviewer__gemini_review tool for security review.
Use it as instructed by the skill.

NO OUT-OF-SCOPE DISPOSITIONS: You may NOT mark security findings as "out of
scope", "architectural gap", or "deferred." Every finding must be fixed or
escalated with a concrete fix proposal. Missing authentication on state-changing
endpoints is a CRITICAL finding that must be fixed — add at minimum API key
auth on POST/PUT/DELETE endpoints. Missing auth is never acceptable for any
system that modifies data, regardless of whether the requirements mention it.

RUNTIME CONSTRAINTS: Read .claude/runtime-constraints.md FIRST. Do not
make changes that violate any listed constraint.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
Net-zero or net-negative lines/functions/types.
EXCEPTION: Security fixes (auth, injection, HTTPS) are exempt from this budget.

COMPLETENESS RULE: If you change infrastructure, complete the full change.
Half-finished infrastructure changes will break the smoke test.

NO SILENT FAILURES: Do not change a throw/crash to a log-and-continue.
Fail-fast on misconfiguration is always correct.
```

For phase 11 (final-eval-check) — Codex + Gemini review, fix all findings:

```
Read the skill file at .claude/phases/final-eval-check/SKILL.md
and execute ALL of its instructions against: {TARGET}

You have access to the mcp__gemini-reviewer__gemini_review tool for per-file review.
Use it as instructed by the skill.

CLEAN-SLATE RULE: Do NOT read any prior phase artifacts before the reviews.
No .claude/evidence/, no .claude/create-plans/, no build/improve logs.
Evaluate the source code with fresh eyes. Only read lessons.md files
during the deduplication step AFTER findings are collected.

FIX EVERYTHING: Every Codex and Gemini finding must be fixed — not
summarized, not documented, not deferred. If a finding requires adding
auth, add auth. If it requires adding config, add config. The only
valid reason to skip a finding is if fixing it would break a runtime
constraint you've been given. Report skipped findings with justification.
"Out of scope" is not a justification. Write lessons and proposals to
the appropriate files.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: EVAL_COMPLETE
```

#### Machine Gate 3.5 (Post-Implementation)

Run via Bash tool (no subagent):

1. **Lint + quality gate:**
   ```bash
   tsx scripts/quality-gate.ts {TARGET}
   ```
   For the Lens project itself, also run `npm run lint` before the quality gate script.

2. **Construction check** (if plan has CONSTRUCTION_CHECKS section):
   ```bash
   tsx scripts/quality-gate.ts validate-construction .claude/create-plans/{PLAN_SLUG}.md {TARGET}
   ```
   Report pass/fail to user. Failures are informational (do not halt pipeline) — they indicate Phase 3 didn't follow the plan.

If quality gate returns non-zero exit, pass the error output to Phase 3 for correction (max 2 retries). If still failing after 2 retries, halt the pipeline and report the failures to the user.

#### Smoke Test Gate 3.7 (Post-Implementation)

Run via Bash tool (no subagent). This gate verifies the app actually starts and serves responses. **This is not optional.** Static analysis cannot replace runtime verification.

1. **Detect app type and start command:**
   - If `*.csproj` exists: `dotnet run --project {CSPROJ_PATH} --urls "http://localhost:0" &` (port 0 = OS-assigned)
   - If `package.json` exists with `start` script: `npm start &`
   - If `package.json` exists with `main` field: `node {MAIN} &`
   - Capture the PID: `APP_PID=$!`

2. **Wait for ready** (max 30 seconds):
   ```bash
   for i in $(seq 1 30); do
     curl -sf http://localhost:{PORT}/ > /dev/null 2>&1 && break
     sleep 1
   done
   ```
   For dotnet apps, parse the listening URL from stdout/stderr to get the assigned port.

3. **Verify API endpoints respond:**
   Read the plan file and extract API endpoints from WORK_ITEMS. For each GET endpoint:
   ```bash
   curl -sf http://localhost:{PORT}{ENDPOINT} -o /dev/null -w "%{http_code}"
   ```
   Accept 200, 204, or 401 (if auth is required). Reject 404, 500, connection refused.

4. **Verify frontend is served** (if plan includes frontend files):
   ```bash
   curl -sf http://localhost:{PORT}/ -o /dev/null -w "%{http_code}"
   ```
   If the plan specifies static files in a directory (e.g., `frontend/`, `wwwroot/`), verify that directory is actually served by the app. A 404 here means the static file middleware is misconfigured.

5. **Verify runtime prerequisites exist:**
   - If app calls `Database.Migrate()`: verify migration classes exist (e.g., `find . -path "*/Migrations/*.cs" | head -1`)
   - If app calls `EnsureCreated()`: note this is not production-safe (informational warning)
   - If `.csproj` targets a preview TFM (e.g., `net10.0` when not yet GA): warn user

6. **Cleanup:**
   ```bash
   kill $APP_PID 2>/dev/null || true
   ```

7. **Gate result:**
   - If app failed to start: **HALT pipeline**. Report the startup error.
   - If any API endpoint returned 500 or connection refused: **HALT pipeline**.
   - If frontend returned 404: **HALT pipeline** with message "Static files not served. Check UseStaticFiles() configuration and file directory."
   - If `Database.Migrate()` is used without migration classes: **HALT pipeline** with message "Database.Migrate() called but no EF migration classes found. Run `dotnet ef migrations add Initial`."
   - If TFM is preview: **WARN** (do not halt). Report to user.

If gate fails, pass the error to Phase 3 for correction (max 2 retries). The subagent must fix the runtime issue (e.g., generate migrations, fix static file path, change TFM).

#### Smoke Test Gate 7.7 (Post-Review Verification)

**Identical to Gate 3.7** but runs after review phases 4-7. Purpose: catch review phases that break runtime behavior (e.g., changing `EnsureCreated()` to `Migrate()` without generating migrations).

If gate fails, identify which review phase introduced the breaking change (diff against the Gate 3.7 state) and pass the error to that phase for correction.

#### Review Phase Completeness Rule

Review phases (4-9) must follow this constraint in addition to the complexity budget:

**COMPLETENESS: If you change a call site, complete the change.** Examples:
- If you change `EnsureCreated()` to `Migrate()`, you must also generate the migration classes
- If you change a static file path, you must update the middleware configuration
- If you add a NuGet package reference, you must run `dotnet restore`
- If you change a connection string format, you must update all environments

#### Machine Gate 7.5 (Qodana + Quality Gate)

Run via Bash tool (no subagent):

1. **Qodana scan:**
   ```bash
   qodana scan --linter qodana-js --project-dir {PROJECT_ROOT} --print-problems 2>&1 || true
   ```
   If `qodana` CLI is not installed, skip with a note.

2. **If Qodana finds issues:** Spawn a **single Haiku subagent** to fix them:
   ```
   Qodana found these issues:
   {QODANA_OUTPUT}

   Fix each issue in the listed files. Do not restructure code — fix in place.
   When complete, end with: QODANA_FIXED
   ```

3. **If Qodana is clean:** No subagent needed. Proceed.

4. **Quality gate re-verify:**
   ```bash
   tsx scripts/quality-gate.ts {TARGET}
   ```

#### Machine Gate 11.5 (Final)

Run via Bash tool (no subagent):

1. **Tests + quality gate:**
   ```bash
   npm test && tsx scripts/quality-gate.ts {TARGET}
   ```
   If non-zero exit, pass error output to Phase 10 (write-tests-run) for correction (max 2 retries).

2. **Smoke test:** Run the same smoke test procedure as Gate 3.7. If the app fails to start or endpoints return errors, **HALT** and report. Do not re-run Phase 11 after Phase 10 fixes.

After Phase 10 fixes the issue and gate 11.5 passes, the pipeline is done — do NOT re-run Phase 11.

#### Gate Check

After each subagent completes, check that its result contains the gate marker string.

- **Gate passes:** Report phase completion to user, proceed to next phase.
- **Gate fails:** Retry the phase (same prompt) up to **3 times**. If still failing after 3 retries, **halt the pipeline** and report the failure to the user.

#### Phase 3 Completion Loop (CRITICAL)

Phase 3 (implement-plan) must complete ALL WORK_ITEMS from the plan. After Phase 3 runs:

1. **Read the plan file** and extract all WORK_ITEMS
2. **Check subagent output** for IMPLEMENT_COMPLETE vs IMPLEMENT_PARTIAL
3. **If IMPLEMENT_PARTIAL** (items remain):
   - Parse the REMAINING items from the subagent output
   - Re-run Phase 3 with a modified prompt targeting only the remaining items:
     ```
     Continue implementing the plan. These WORK_ITEMS are already done: [list].
     Implement ONLY these remaining items: [remaining list].
     ```
   - Repeat until IMPLEMENT_COMPLETE or **5 iterations** reached
4. **If 5 iterations reached** with items still remaining:
   - Report to user which items could not be completed
   - Ask user: "Continue with remaining phases?" or "Halt pipeline?"
   - Do NOT silently drop items

#### Runtime Constraints File (After Phase 3)

After Phase 3 completes (and passes Gate 3.5/3.7), the orchestrator must write `.claude/runtime-constraints.md` documenting any runtime-specific constraints discovered during implementation. This file is read by every subsequent phase.

Example content:
```markdown
# Runtime Constraints
- SQLite EF Core provider cannot translate DateTimeOffset comparisons or GroupBy aggregations — use client-side filtering (load then filter in C#)
- SQLite only supports ReadCommitted isolation level, not Serializable
- Frontend served via UseDefaultFiles + UseStaticFiles with PhysicalFileProvider — do not change the path pattern
- Database uses EnsureCreatedAsync() for SQLite — do not change to MigrateAsync()
```

Extract constraints from: Phase 3 subagent output, smoke test failures and fixes, any workarounds applied during implementation. If no constraints exist, write "No runtime constraints identified."

#### Phase 4 Completion Loop

Phase 4 (refactor-check-fix) must address ALL files that exceed constraints. After Phase 4 runs:

1. **Check subagent output** for ISSUES_REMAINING count
2. **If ISSUES_REMAINING > 0**:
   - Re-run Phase 4 targeting only the remaining issues
   - Repeat until ISSUES_REMAINING = 0 or **3 iterations** reached
3. **If 3 iterations reached** with issues remaining:
   - Report remaining issues to user
   - Continue to Phase 5 (remaining phases may catch some issues)

#### Canary Wrapping (Phase 6)

Phase 6 (gemini-fix) is wrapped with canary pre/post steps. This is NOT optional — it tests whether the review agent is actually reading code.

1. **Pre:** `tsx scripts/quality-gate.ts insert-canaries gemini {TARGET}`
2. **Run:** Spawn the gemini-fix subagent (same prompt as above)
3. **Post:** `tsx scripts/quality-gate.ts validate-canaries gemini {TARGET}`
4. If canaries missed: re-run Phase 6 once (with note: "Previous run missed planted violations. Read ALL code carefully.")
5. If missed again: halt pipeline and report to user

#### Evidence Validation Gates

After review phases that produce evidence checklists, run the evidence validator. If incomplete, bounce back to the phase with specifics (max 2 retries).

**After Phase 4 (refactor-check-fix):**
```bash
tsx scripts/quality-gate.ts validate-evidence refactor {TARGET}
```
If incomplete: re-run Phase 4 with "You missed N items in checklist X. Review ALL items."

**After Phase 6 (gemini-fix):**
```bash
tsx scripts/quality-gate.ts validate-evidence gemini {TARGET}
```
If incomplete: re-run Phase 6 with "You missed N items in checklist X. Review ALL items."

**After Phase 7 (codex-fix):**
```bash
tsx scripts/quality-gate.ts validate-evidence codex {TARGET}
```
If incomplete: re-run Phase 7 with "You missed N items in checklist X. Review ALL items."

**After Phase 8 (adversarial-security-review):**
```bash
tsx scripts/quality-gate.ts validate-evidence adversarial {TARGET}
```
If incomplete: re-run Phase 8 with "You missed N items in checklist X. Review ALL items."

#### Vote Reconciliation (After Phase 8 Evidence Gate)

After all evidence gates pass, run the three-model vote reconciliation:

```bash
tsx scripts/quality-gate.ts reconcile-votes {TARGET}
```

If disagreements exist, the command writes a report to `.claude/evidence/vote-disagreements.md` and exits non-zero. Spawn a final reconciliation subagent (model: sonnet, subagent_type: "general-purpose"):

```
Read the disagreement report at .claude/evidence/vote-disagreements.md

These items had disagreement across reviewers. For each flagged item:
1. Read the source code at the location
2. Re-evaluate whether a fix is warranted
3. If warranted, apply the fix
4. Run tests to verify

When complete, end with: RECONCILIATION_COMPLETE
```

#### Phase 1 Special Handling

After Phase 1 passes its gate:

1. Read the plan file that create-plan wrote
2. Present the plan summary to the user
3. Ask the user for approval using AskUserQuestion:
   - "Approve plan" — continue to Phase 2
   - "Reject plan" — halt the pipeline, rollback is available
   - "Revise plan" — re-run Phase 1 (this does NOT count against the 3-retry limit)

Do not proceed to Phase 2 until the user explicitly approves.

### Step 3: Deployment Readiness Gate

After Gate 11.5 passes, run this checklist via Bash (no subagent). Every item must pass or the orchestrator must fix it directly before proceeding.

1. **`.gitignore` exists and covers artifacts:**
   ```bash
   test -f {TARGET}/.gitignore || echo "FAIL: no .gitignore"
   ```
   If missing, create one covering: `bin/`, `obj/`, `*.db`, `*.db-shm`, `*.db-wal`, `.vs/`, `*.user`, `.env`, `.DS_Store`

2. **No database/secret files in source tree:**
   ```bash
   find {TARGET} -name "*.db" -o -name "*.db-shm" -o -name "*.db-wal" -o -name ".env" -o -name "credentials.json" | grep -v node_modules | grep -v bin | grep -v obj
   ```
   If found, delete them and ensure `.gitignore` covers them.

3. **HTTPS redirection in non-dev:**
   ```bash
   grep -l "UseHttpsRedirection" {TARGET}/src/**/*.cs || echo "FAIL: no UseHttpsRedirection"
   ```
   If missing, add `app.UseHttpsRedirection()` inside the `!IsDevelopment()` block.

4. **Production config fails fast (not silent):**
   Verify that missing CORS origins, missing connection strings, and missing auth config all throw `InvalidOperationException` in production — not log-and-continue. Read Program.cs and check.

5. **HSTS conditional on proxy config:**
   If `BehindProxy` is a config option, HSTS should only be set when the app handles TLS directly (not behind a TLS-terminating proxy).

If any item fails, fix it directly (these are mechanical fixes, not phase work). Then re-run Gate 11.5 smoke test to verify nothing broke.

### Step 3b: Codex Fix Loop

After the deployment readiness gate, run the Codex production readiness eval and fix every finding.

1. **Run Codex eval** (via Bash tool):
   ```bash
   codex --approval never -q "PRODUCTION READINESS review. Review ALL source code and cite file:line for every finding. [full rubric from eval]" 2>&1
   ```
   If `codex` CLI is not available, skip with a note.

2. **Parse findings** from Codex output (lines starting with `FINDING:`)

3. **For each finding**, spawn a fix agent (model: sonnet, subagent_type: "general-purpose"):
   ```
   Fix this Codex finding in {TARGET}:
   {FINDING_LINE}

   Read .claude/runtime-constraints.md first. Do not violate any constraint.
   Fix the issue. If the fix requires adding auth, add auth. If it requires
   adding config validation, add it. Run tests after fixing.
   When complete, end with: CODEX_FINDING_FIXED
   ```

4. **Re-run tests** after all findings are fixed:
   ```bash
   dotnet test {TEST_PROJECT} --verbosity quiet
   ```

5. **If findings remain** that could not be fixed, present them to the user with justification. Do not summarize — explain why each one could not be fixed.

### Step 3c: Cleanup

After the Codex fix loop, remove evidence artifacts:

```bash
rm -rf {TARGET}/.claude/evidence/
rm -f {TARGET}/.claude/canary-manifest.json
rm -f {TARGET}/.claude/runtime-constraints.md
```

### Step 4: Report Metrics + Log Completion

```bash
tsx scripts/quality-gate.ts report-metrics {TARGET}
echo "build:complete:{TARGET}:$(date +%Y-%m-%dT%H:%M:%S)" >> .claude/build.log
```

### Step 5: Report

Print a summary:

```
Build: {TARGET}
  Rollback: stash@{N}

  ✓ Design    plan approved, {N} contracts identified
  ✓ Build     implemented, gate passed
  ✓ Refine    {+/-N} lines net, gate passed
  ✓ Review    3 models, {N} findings fixed, gate passed
  ✓ Verify    {N} tests, 0 failures, gate passed
  ↻ Learn     {N} lessons written

Rollback: /build --rollback
```

## vs Other Workflows

| Workflow | When to Use | Pipeline |
|----------|-------------|----------|
| `/build` | New feature from scratch | Full (5 stages + learn) |
| `/improve` | Refine existing code | Full (5 stages + learn) |
| `/quick-edit` | Add field, rename, small fix | None (checklist only) |
| `/quick-clean` | Fast AI smell cleanup | None (review + fix) |
| `/ralph-loop` | Full PRD implementation | Full per item |

## Directory Behavior

When targeting a directory:
- Phases run on the directory as a unit
- Architecture mapping covers all files
- Tests cover the module boundary
