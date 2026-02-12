---
name: improve
description: Improve existing code. 11-phase quality pipeline with rollback support.
---

# /improve [path] [--rollback] [--dry-run]

Improve existing code using the full 11-phase quality pipeline. Same rigor as `/build`, but for code that already exists.

> **No arguments?** Describe this skill and stop. Do not execute.

## What Is This?

`/improve` is the **heavy workflow** for refining existing code. It runs 11 phases in sequence:

1. **create-plan** — Analyze what needs improvement, identify issues
2. **structure-first** — Map current architecture, design improvements
3. **implement-plan** — Apply the improvements
4. **refactor-check-fix** — Clean up, enforce constraints
5. **dedupe-fix** — Consolidate duplicated code
6. **gemini-fix** — External code review via Gemini + product quality review
7. **codex-fix** — Independent Codex review + targeted fixes (same rubric as eval)
8. **adversarial-security-review** — Security audit
9. **ai-smell-fix** — Remove AI-generated antipatterns
10. **write-tests-run** — Write and run tests
11. **final-eval-check** — Final Codex + Gemini review, fix all findings, write lessons (ALWAYS LAST)

Script gates at 3.5, 7.5, 9.5, and 11.5 run lint, quality checks, and Qodana without burning AI context. Smoke test gates at 3.7 and 7.7 start the app and verify it serves endpoints. Each phase must pass its gate before the next begins. A rollback point is created before any changes.

**Context cost:** ~4,200 tokens (Base Brain) + phase-specific skills

## When to Use

- **Refactoring a module** — "Improve src/services/auth/"
- **Quality pass on a component** — "Improve src/components/Button.tsx"
- **Pre-commit quality check** — "Improve the files I changed"
- **Technical debt cleanup** — "Improve this legacy code"

**Don't use for:**
- Building new features → use `/build`
- Simple changes (add field, rename) → use `/quick-edit`
- Quick cleanup → use `/quick-clean`

## Usage

```
/improve src/components/Button.tsx
/improve src/services/auth/
/improve src/models/User.ts --dry-run
/improve --rollback
```

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the 11 phases without executing |
| `--rollback` | Restore from last improve stash |

## Orchestrator Rules

1. **NEVER do phase work yourself** — you are a sequencer, not an implementer
2. **NEVER skip a phase** — every phase runs in order
3. **NEVER proceed without gate marker** — the subagent result must contain the marker string
4. **ALWAYS present Phase 1 plan to user for approval** before continuing
5. **ALWAYS create rollback point first** before any phase runs
6. **ALWAYS record metrics** after each phase completes
7. **NEVER accept >10% test failures** — if more than 10% of tests fail for any reason (provider limitations, missing infrastructure), the gate fails and must be fixed
8. **NEVER wave through "infrastructure limitation" test failures** — if tests fail because the test setup is wrong (e.g., InMemory provider doesn't support transactions), fix the test setup (e.g., use SQLite in-memory), don't skip the failures

## Rollback

If `--rollback` flag is set:

```bash
git stash list | grep "improve:" | head -1
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
| 2 | structure-first | sonnet | STRUCTURE_COMPLETE | Map existing, design changes |
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
tsx scripts/quality-gate.ts start-metrics improve {TARGET}
```

### Step 1: Create Rollback Point

```bash
git stash push -m "improve:$(basename {TARGET}):$(date +%s)"
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

This is an IMPROVEMENT workflow on existing code. The code already exists.
Focus on analysis, refactoring, and enhancement rather than greenfield creation.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

For phase 3 (implement-plan):

```
Read the skill file at .claude/phases/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code. The code already exists.
Focus on analysis, refactoring, and enhancement rather than greenfield creation.

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

This is an IMPROVEMENT workflow on existing code. The code already exists.
Focus on analysis, refactoring, and enhancement rather than greenfield creation.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
After your changes, the codebase must have the same or fewer: files,
exported functions, types/interfaces, and total lines. If your fix
adds lines, find lines elsewhere to remove. Net-zero or net-negative.

COMPLETENESS RULE: If you change infrastructure (DB initialization, startup
config, static file serving, package references), you must complete the
full change. Do not change EnsureCreated() to Migrate() without generating
migrations. Do not change file paths without updating middleware config.
Half-finished infrastructure changes will break the smoke test gate.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

For phase 6 (gemini-fix) — add to prompt:

```
You have access to the mcp__gemini-reviewer__gemini_review tool for code review.
Use it as instructed by the skill. This includes the product quality review step.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
After your changes, the codebase must have the same or fewer: files,
exported functions, types/interfaces, and total lines. If your fix
adds lines, find lines elsewhere to remove. Net-zero or net-negative.

COMPLETENESS RULE: If you change infrastructure (DB initialization, startup
config, static file serving, package references), you must complete the
full change. Half-finished infrastructure changes will break the smoke test.
```

For phase 7 (codex-fix) — independent Codex review:

```
Read the skill file at .claude/phases/codex-fix/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code. The code already exists.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
Net-zero or net-negative lines/functions/types.

COMPLETENESS RULE: If you change infrastructure (DB initialization, startup
config, static file serving, package references), you must complete the
full change. Do not change EnsureCreated() to Migrate() without generating
migrations. Do not change file paths without updating middleware config.
Half-finished infrastructure changes will break the smoke test gate.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: CODEX_FIX_COMPLETE
```

For phase 8 (adversarial-security-review) — add to prompt:

```
You have access to the mcp__gemini-reviewer__gemini_review tool for security review.
Use it as instructed by the skill.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
After your changes, the codebase must have the same or fewer: files,
exported functions, types/interfaces, and total lines. If your fix
adds lines, find lines elsewhere to remove. Net-zero or net-negative.

COMPLETENESS RULE: If you change infrastructure (DB initialization, startup
config, static file serving, package references), you must complete the
full change. Half-finished infrastructure changes will break the smoke test.
```

For phase 11 (final-eval-check) — Codex + Gemini review, fix all findings:

```
Read the skill file at .claude/phases/final-eval-check/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code. The code already exists.

You have access to the mcp__gemini-reviewer__gemini_review tool for per-file review.
Use it as instructed by the skill.

CLEAN-SLATE RULE: Do NOT read any prior phase artifacts before the reviews.
No .claude/evidence/, no .claude/create-plans/, no build/improve logs.
Evaluate the source code with fresh eyes. Only read lessons.md files
during the deduplication step AFTER findings are collected.

Fix everything Codex and Gemini find. Write lessons and proposals to
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

### Step 3: Cleanup

After all 11 phases complete, remove evidence artifacts:

```bash
rm -rf {TARGET}/.claude/evidence/
rm -f {TARGET}/.claude/canary-manifest.json
```

### Step 4: Report Metrics + Log Completion

```bash
tsx scripts/quality-gate.ts report-metrics {TARGET}
echo "improve:complete:{TARGET}:$(date +%Y-%m-%dT%H:%M:%S)" >> .claude/improve.log
```

### Step 5: Report

Print a summary:

```
Improve: {TARGET}
  Rollback point: stash@{N}

  1. create-plan → {one-line summary from subagent}
  2. structure-first → {one-line summary}
  3. implement-plan → {one-line summary}
  4. refactor-check-fix → {one-line summary}
  5. dedupe-fix → {one-line summary}
  6. gemini-fix → {one-line summary}
  7. codex-fix → {one-line summary}
  8. adversarial-security-review → {one-line summary}
  9. ai-smell-fix → {one-line summary}
 10. write-tests-run → {one-line summary}
 11. final-eval-check → {N} findings fixed, {N} lessons
  Done

Rollback available: /improve --rollback
```

## vs Other Workflows

| Workflow | When to Use | Phases |
|----------|-------------|--------|
| `/build` | New feature from scratch | 11 |
| `/improve` | Refine existing code | 11 |
| `/quick-edit` | Add field, rename, small fix | 0 |
| `/quick-clean` | Fast AI smell cleanup | 0 |
| `/ralph-loop` | Full PRD implementation | 10 per item |

## Directory Behavior

When targeting a directory:
- Phases run on the directory as a unit
- Architecture mapping covers all files
- Tests cover the module boundary
