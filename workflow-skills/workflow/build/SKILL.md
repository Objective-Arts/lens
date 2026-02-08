---
name: build
description: Build a new feature from scratch. 11-phase quality pipeline with rollback support.
---

# /build [path|description] [--rollback] [--dry-run]

Build a new feature, component, or module from scratch using the full 11-phase quality pipeline.

> **No arguments?** Describe this skill and stop. Do not execute.

## What Is This?

`/build` is the **heavy workflow** for creating new code. It runs 11 phases in sequence:

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
11. **write-tests-run** — Re-verify tests after cleanup

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
| `--dry-run` | Show the 11 phases without executing |
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

| # | Skill | Gate Marker | Notes |
|---|-------|-------------|-------|
| 1 | create-plan | PLAN_COMPLETE | Pause for user approval |
| 2 | structure-first | STRUCTURE_COMPLETE | |
| 3 | implement-plan | IMPLEMENT_COMPLETE | |
| 4 | refactor-check-fix | REFACTOR_COMPLETE | |
| 5 | dedupe-fix | DEDUPE_COMPLETE | |
| 6 | gemini-fix | FIX_COMPLETE | Uses Gemini MCP tools |
| 7 | qodana-fix | VERIFIED_CLEAN | Uses Qodana MCP tools |
| 8 | adversarial-security-review | VERIFIED_CLEAN | Uses Gemini MCP tools |
| 9 | write-tests-run | TEST_COMPLETE | |
| 10 | ai-smell-fix | AI_SMELL_COMPLETE | |
| 11 | write-tests-run | TEST_COMPLETE | Re-verify after ai-smell cleanup |

## Execution

### Step 1: Create Rollback Point

```bash
git stash push -m "build:$(basename {TARGET}):$(date +%s)"
```

Report the stash ref to the user.

### Step 2: Run Phases

For each phase in the table above, spawn a **single Task subagent** (`subagent_type: "general-purpose"`).

#### Subagent Prompt Template

For phases 1-5, 9-11 (no MCP tools needed):

```
Read the skill file at /Users/steve/local-tech-projects/lens/workflow-skills/workflow/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

For phase 6 (gemini-fix) — add to prompt:

```
You have access to the mcp__gemini-reviewer__gemini_review tool for code review.
Use it as instructed by the skill.
```

For phase 7 (qodana-fix) — add to prompt:

```
You have access to Qodana MCP tools (mcp__qodana__qodana_scan, mcp__qodana__qodana_problems, etc).
Use them as instructed by the skill.
```

For phase 8 (adversarial-security-review) — add to prompt:

```
You have access to the mcp__gemini-reviewer__gemini_review tool for security review.
Use it as instructed by the skill.
```

For phase 11 (write-tests-run, second run) — add to prompt:

```
This is a re-verification run after ai-smell-fix cleanup in phase 10.
If tests fail, fix the code that ai-smell-fix broke, not the tests.
```

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

#### Phase 1 Special Handling

After Phase 1 passes its gate:

1. Read the plan file that create-plan wrote
2. Present the plan summary to the user
3. Ask the user for approval using AskUserQuestion:
   - "Approve plan" — continue to Phase 2
   - "Reject plan" — halt the pipeline, rollback is available
   - "Revise plan" — re-run Phase 1 (this does NOT count against the 3-retry limit)

Do not proceed to Phase 2 until the user explicitly approves.

### Step 3: Log Completion

After all 11 phases complete:

```bash
echo "build:complete:{TARGET}:$(date +%Y-%m-%dT%H:%M:%S)" >> .claude/build.log
```

### Step 4: Report

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
  11. write-tests-run → {one-line summary}
  Done

Rollback available: /build --rollback
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
