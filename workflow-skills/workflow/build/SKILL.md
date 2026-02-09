---
name: build
description: Build a new feature from scratch. 12-phase quality pipeline with rollback support.
---

# /build [path|description] [--rollback] [--dry-run]

Build a new feature, component, or module from scratch using the full 12-phase quality pipeline.

> **No arguments?** Describe this skill and stop. Do not execute.

## What Is This?

`/build` is the **heavy workflow** for creating new code. It runs 12 phases in sequence:

1. **create-plan** — Design the feature with scope, files, and risks
2. **structure-first** — Define data structures and interfaces
3. **implement-plan** — Write the code
4. **refactor-check-fix** — Clean up, enforce constraints
5. **dedupe-fix** — Consolidate duplicated code
6. **gemini-fix** — External code review via Gemini
7. **qodana-fix** — Static analysis fixes
8. **adversarial-security-review** — Security audit
9. **write-tests-run** — Write and run tests
10. **ai-smell-fix** — Remove AI-generated antipatterns
11. **codex-check** — Fast pattern scan + targeted fixes
12. **write-tests-run** — Re-verify tests after cleanup

Each phase must pass its gate before the next begins. A rollback point is created before any changes.

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
| `--dry-run` | Show the 12 phases without executing |
| `--rollback` | Restore from last build stash |

## Orchestrator Rules

1. **NEVER do phase work yourself** — you are a sequencer, not an implementer
2. **NEVER skip a phase** — every phase runs in order
3. **NEVER proceed without gate marker** — the subagent result must contain the marker string
4. **ALWAYS present Phase 1 plan to user for approval** before continuing
5. **ALWAYS create rollback point first** before any phase runs

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
| 3.5 | **machine-gate** | **none** | exit code 0 | `tsx .claude/scripts/quality-gate.ts {TARGET}` — no agent |
| 4 | refactor-check-fix | sonnet | REFACTOR_COMPLETE | |
| 5 | dedupe-fix | haiku | DEDUPE_COMPLETE | Pattern-match and apply |
| 6 | gemini-fix | sonnet | FIX_COMPLETE | Gemini reviews, agent applies |
| 7 | qodana-fix | haiku | VERIFIED_CLEAN | Tool finds issues, agent applies |
| 7.5 | **machine-gate** | **none** | exit code 0 | `tsx .claude/scripts/quality-gate.ts {TARGET}` — re-verify |
| 8 | adversarial-security-review | sonnet | VERIFIED_CLEAN | Gemini reviews, agent applies |
| 9 | write-tests-run | sonnet | TEST_COMPLETE | |
| 10 | ai-smell-fix | haiku | AI_SMELL_COMPLETE | Pattern-match and apply |
| 11 | codex-check | haiku | CODEX_CHECK_COMPLETE | Fast pattern scan + fixes |
| 11.5 | **machine-gate** | **none** | exit code 0 | `tsx .claude/scripts/quality-gate.ts {TARGET}` — final |
| 12 | write-tests-run | haiku | TEST_COMPLETE | Re-verify after cleanup |

## Execution

### Step 1: Create Rollback Point

```bash
git stash push -m "build:$(basename {TARGET}):$(date +%s)"
```

Report the stash ref to the user.

### Step 2: Run Phases

For each phase in the table above, spawn a **single Task subagent** (`subagent_type: "general-purpose"`) with the `model` parameter set to the value in the Phase Table's Model column.

#### Subagent Prompt Template

For phases 1-5, 9-12 (no MCP tools needed):

```
Read the skill file at .claude/phases/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

For phases 4-5, 9-11 (review phases, no MCP tools) — add complexity budget:

```
Read the skill file at .claude/phases/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
After your changes, the codebase must have the same or fewer: files,
exported functions, types/interfaces, and total lines. If your fix
adds lines, find lines elsewhere to remove. Net-zero or net-negative.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

For phase 6 (gemini-fix) — add to prompt:

```
You have access to the mcp__gemini-reviewer__gemini_review tool for code review.
Use it as instructed by the skill.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
After your changes, the codebase must have the same or fewer: files,
exported functions, types/interfaces, and total lines. If your fix
adds lines, find lines elsewhere to remove. Net-zero or net-negative.
```

For phase 7 (qodana-fix) — add to prompt:

```
You have access to Qodana MCP tools (mcp__qodana__qodana_scan, mcp__qodana__qodana_problems, etc).
Use them as instructed by the skill.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
After your changes, the codebase must have the same or fewer: files,
exported functions, types/interfaces, and total lines. If your fix
adds lines, find lines elsewhere to remove. Net-zero or net-negative.
```

For phase 8 (adversarial-security-review) — add to prompt:

```
You have access to the mcp__gemini-reviewer__gemini_review tool for security review.
Use it as instructed by the skill.

COMPLEXITY BUDGET: Review phases must not increase overall complexity.
After your changes, the codebase must have the same or fewer: files,
exported functions, types/interfaces, and total lines. If your fix
adds lines, find lines elsewhere to remove. Net-zero or net-negative.
```

For phase 12 (write-tests-run, second run) — add to prompt:

```
This is a re-verification run after ai-smell-fix (phase 10) and codex-check (phase 11).
If tests fail, fix the code that phases 10-11 broke, not the tests.
```

#### Machine Gate (Phases 3.5, 7.5, 11.5)

Machine gates are NOT subagent phases. Run `tsx .claude/scripts/quality-gate.ts {TARGET}` directly via Bash tool. The script auto-detects project language and runs the appropriate linter (ESLint for JS/TS, Qodana for Java/C#/Python/Go/Rust/PHP/Ruby) plus universal custom checks (secrets, shell injection, etc.).

If non-zero exit, pass the error output to the PREVIOUS phase for correction (max 2 retries). If still failing after 2 retries, halt the pipeline and report the failures to the user.

For the Lens project itself (`{TARGET}` is `.` or `src/`), also run `npm run lint` before the quality gate script.

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

#### Canary Wrapping (Phases 6 and 11)

Phases 6 (gemini-fix) and 11 (codex-check) are wrapped with canary pre/post steps. This is NOT optional — it tests whether the review agent is actually reading code.

**Phase 6 (gemini-fix) execution:**

1. **Pre:** `tsx .claude/scripts/quality-gate.ts insert-canaries gemini {TARGET}`
2. **Run:** Spawn the gemini-fix subagent (same prompt as above)
3. **Post:** `tsx .claude/scripts/quality-gate.ts validate-canaries gemini {TARGET}`
4. If canaries missed: re-run Phase 6 once (with note: "Previous run missed planted violations. Read ALL code carefully.")
5. If missed again: halt pipeline and report to user

**Phase 11 (codex-check) execution:**

1. **Pre:** `tsx .claude/scripts/quality-gate.ts insert-canaries codex {TARGET}`
2. **Run:** Spawn the codex-check subagent (same prompt as above)
3. **Post:** `tsx .claude/scripts/quality-gate.ts validate-canaries codex {TARGET}`
4. If canaries missed: re-run Phase 11 once (with note: "Previous run missed planted violations. Read ALL code carefully.")
5. If missed again: halt pipeline and report to user

#### Evidence Validation Gates

After review phases that produce evidence checklists, run the evidence validator. If incomplete, bounce back to the phase with specifics (max 2 retries).

**After Phase 4 (refactor-check-fix):**
```bash
tsx .claude/scripts/quality-gate.ts validate-evidence refactor {TARGET}
```
If incomplete: re-run Phase 4 with "You missed N items in checklist X. Review ALL items."

**After Phase 6 (gemini-fix):**
```bash
tsx .claude/scripts/quality-gate.ts validate-evidence gemini {TARGET}
```
If incomplete: re-run Phase 6 with "You missed N items in checklist X. Review ALL items."

**After Phase 8 (adversarial-security-review):**
```bash
tsx .claude/scripts/quality-gate.ts validate-evidence adversarial {TARGET}
```
If incomplete: re-run Phase 8 with "You missed N items in checklist X. Review ALL items."

**After Phase 11 (codex-check):**
```bash
tsx .claude/scripts/quality-gate.ts validate-evidence codex {TARGET}
```
If incomplete: re-run Phase 11 with "You missed N items in checklist X. Review ALL items."

#### Vote Reconciliation (After Phase 11 Evidence Gate)

After all evidence gates pass, run the three-model vote reconciliation:

```bash
tsx .claude/scripts/quality-gate.ts reconcile-votes {TARGET}
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

After all 12 phases complete, remove evidence artifacts:

```bash
rm -rf {TARGET}/.claude/evidence/
rm -f {TARGET}/.claude/canary-manifest.json
```

### Step 4: Log Completion

After all 12 phases complete:

```bash
echo "build:complete:{TARGET}:$(date +%Y-%m-%dT%H:%M:%S)" >> .claude/build.log
```

### Step 5: Report

Print a summary:

```
Build: {TARGET}
  Rollback point: stash@{N}

  1. create-plan → {one-line summary from subagent}
  2. structure-first → {one-line summary}
  3. implement-plan → {one-line summary}
  4. refactor-check-fix → {one-line summary}
  5. dedupe-fix → {one-line summary}
  6. gemini-fix → {one-line summary}
  7. qodana-fix → {one-line summary}
  8. adversarial-security-review → {one-line summary}
  9. write-tests-run → {one-line summary}
  10. ai-smell-fix → {one-line summary}
  11. codex-check → {one-line summary}
  12. write-tests-run → {one-line summary}
  Done

Rollback available: /build --rollback
```

## vs Other Workflows

| Workflow | When to Use | Phases |
|----------|-------------|--------|
| `/build` | New feature from scratch | 12 |
| `/improve` | Refine existing code | 12 |
| `/quick-edit` | Add field, rename, small fix | 0 |
| `/quick-clean` | Fast AI smell cleanup | 0 |
| `/ralph-loop` | Full PRD implementation | 10 per item |

## Directory Behavior

When targeting a directory:
- Phases run on the directory as a unit
- Architecture mapping covers all files
- Tests cover the module boundary
