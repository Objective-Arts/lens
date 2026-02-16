---
name: build
description: Build a new feature from scratch. Quality pipeline with learning loop and rollback support.
---

# /build [path|description] [--rollback] [--dry-run]

Build a new feature using the full quality pipeline.

> **No arguments?** Describe this skill and stop. Do not execute.

## What Is This?

`/build` runs 9 phases in sequence:

0. **reference** — Opus builds from PRD. Feature-rich implementation.
1. **plan** — Plan the hardening work against the reference
2. **structure** — Improve the structure Opus produced
3. **implementation** — Fix what the plan identified
4. **refactoring** — Clean up
5. **deduplication** — Consolidate
6. **review** — Parallel scans, dedupe findings, fix
7. **testing** — Write and run tests
8. **evaluation** — Codex scores 7 dimensions, fix until all 9+, write lessons

```
PRD → Phase 0:reference (Opus raw build)
  → [rollback] → Phase 1:plan → [approval] → Phase 2:structure
  → Phase 3:implementation [loop if partial]
  → [quality-gate]
  → Phase 4:refactoring → Phase 5:deduplication
  → Phase 6:review (parallel scans → dedupe → fix)
  → Phase 7:testing → Phase 8:evaluation (Codex only)
  → [quality-gate]
  → [lessons written]
```

## When to Use

- New feature from PRD, new component, new module

**Don't use for:** Improving existing code → `/improve` | Simple changes → `/quick-change`

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the phase table and stop |
| `--rollback` | Restore from last build stash |
| `--from N` | Skip to phase N (e.g., `--from review`, `--from 6`, `--from evaluation`) |

## Phase Table

| # | Skill | Model | Gate Marker | Notes |
|---|-------|-------|-------------|-------|
| 0 | reference | opus | REFERENCE_COMPLETE | Opus builds from PRD. Feature-rich implementation. |
| 1 | plan | sonnet | PLAN_COMPLETE | Plan hardening. Pause for user approval. Loads rubrics. |
| 2 | structure | sonnet | STRUCTURE_COMPLETE | Improve the structure Opus produced. |
| 3 | implementation | opus | IMPLEMENTATION_COMPLETE | Loop if partial (max 5). Quality gate runs after. |
| 4 | refactoring | sonnet | REFACTORING_COMPLETE | |
| 5 | deduplication | haiku | DEDUPLICATION_COMPLETE | |
| 6 | review | sonnet | REVIEW_COMPLETE | Parallel scans → dedupe → fix |
| 7 | testing | sonnet | TESTING_COMPLETE | |
| 8 | evaluation | sonnet | EVALUATION_COMPLETE | Codex scores 7 dimensions. Fix until all 9+. Max 3 iterations. Quality gate runs after. |

## Orchestrator Rules

1. **NEVER do phase work yourself** — you are a sequencer, not an implementer
2. **NEVER skip a phase** — every phase runs in order
3. **NEVER proceed without gate marker** — the subagent result must contain the marker string
4. **ALWAYS present Phase 1 plan to user for approval** before continuing
5. **ALWAYS create rollback point first** before any phase runs
6. **ALWAYS record metrics** after each phase completes

## Rollback

If `--rollback` flag is set:

```bash
git stash list | grep "build:" | head -1
# Extract stash ref and pop it
git stash pop <ref>
```

Then stop.

## Dry Run

If `--dry-run`, print the phase table and stop.

## Resume From

If `--from` is set, skip all phases before the specified phase. Accept phase name or number:
- `--from evaluation` or `--from 8` → skip to Phase 8
- `--from review` or `--from 6` → skip to Phase 6
- `--from testing` or `--from 7` → skip to Phase 7

No rollback point is created when resuming (code already exists). Skip plan approval. Start execution at the specified step.

## Execution

### Step 0: Phase 0 — Reference Build

Spawn a **single Task subagent** (`subagent_type: "general-purpose"`, model: `opus`) to build the feature from the PRD:

```
You are building a reference implementation from a PRD.

Build the feature described below. Focus on feature richness and
completeness. Do not worry about hardening — that comes later.

PRD / Feature description: {TARGET}

Write the code. Make it work. Make it feature-complete.
When complete, end your final message with the marker: REFERENCE_COMPLETE
```

When the reference build completes, report to the user what was built.

### Step 1: Rollback Point

```bash
git stash push -m "build:$(basename {TARGET}):$(date +%s)"
```

Report the stash ref to the user. This stash captures the reference build so it can be restored.

### Step 2: Phases 1-3 (Plan + Structure + Implementation)

For each phase, spawn a **single Task subagent** (`subagent_type: "general-purpose"`) with the model from the Phase Table.

**Phase 1 prompt:**

```
Read the skill file at workflow-skills/workflow/plan/SKILL.md
and execute ALL of its instructions against: {TARGET}

You are planning HARDENING work against a reference implementation
that Opus already built. The code exists. Plan what needs to be
improved, hardened, and fixed — not what needs to be created.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: PLAN_COMPLETE
```

**After Phase 1:** Read the plan file. Present the summary to the user. Ask for approval (Approve / Reject / Revise). Do not proceed until approved.

**Phase 2 prompt:**

```
Read the skill file at workflow-skills/workflow/structure/SKILL.md
and execute ALL of its instructions against: {TARGET}

You are IMPROVING the structure of a reference implementation that
Opus already built. Analyze the architecture and improve it — assign
quality contract types, fix boundaries, restructure where needed.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: STRUCTURE_COMPLETE
```

**Phase 3 prompt (implementation):**

```
Read the skill file at workflow-skills/workflow/implementation/SKILL.md
and execute ALL of its instructions against: {TARGET}

IMPORTANT: Follow the compile loop. For each unit: refresh the relevant
canon principle, write the code, then compile-check before starting the
next unit. Do not write all code first and check later.

QUALITY GATE RULES — the gate runs immediately after this phase.
Every violation below causes a pipeline failure and a retry. Write code
that passes on the first attempt:

  SECURITY (instant fail):
  - No hardcoded secrets (API keys, passwords, tokens, private keys)
  - No exec()/execSync() with template literals — use spawn() with args
  - No path.join/resolve with user input without traversal validation
  - No eval(), innerHTML assignment, or document.write()

  NAMING:
  - No parameters named: data, info, result, item, obj, val, tmp, temp, ret, res
  - No single-letter parameters (except _, i, j, k, e)
  - No exported functions shorter than 4 characters
  - No files named: utils.ts, helpers.ts, misc.ts, common.ts, shared.ts
  - No abbreviations in exports: mgr, impl, proc, svc, repo

  SIZE LIMITS:
  - Functions: max 30 significant lines
  - Files: max 300 lines
  - Parameters per function: max 4
  - Exports per file: max 10 (index.ts exempt)
  - Project imports per file: max 8
  - Class methods: max 10
  - Inheritance depth: max 2

  CODE QUALITY:
  - No magic numbers (except -1, 0, 1, 2) — extract to named constants
  - No magic strings in conditionals — extract to constants
  - No circular imports
  - No console.error(err) — use err.message
  - No existsSync() then readFileSync() on same path — use try/catch
  - No readFileSync() right after writeFileSync() on same path
  - No truthy check on optional numbers (0 is falsy) — use !== undefined
  - No JSDoc that restates the function name
  - Types/interfaces must appear before functions in each file
  - No empty catch/except/rescue blocks
  - Max 3 TODO/FIXME/HACK markers per file
  - No http:// URLs (except localhost) — use https://
  - No hardcoded IP:port values — use config/env vars

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: IMPLEMENTATION_COMPLETE
```

**Phase 3 completion loop:** If output contains IMPLEMENTATION_PARTIAL, re-run targeting only remaining items. Max 5 iterations. If items remain after 5, report to user and ask whether to continue or halt.

### Step 3: Quality Gate (after Phase 3)

Run via Bash (no subagent):

```bash
tsx scripts/quality-gate.ts {TARGET}
```

If non-zero, pass error output to Phase 3 for correction (max 2 retries).

### Step 4: Phases 4-5 (Refine)

**Phase 4-5 prompt:**

```
Read the skill file at workflow-skills/workflow/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

### Step 5: Phase 6 (Review)

All reviewers see the **same code state**. One fix pass at the end.

**5a. Insert canaries** — plant known violations before scans:

```bash
tsx scripts/quality-gate.ts insert-canaries review {TARGET}
```

This plants 3-5 known violations (bad names, shell injection, hardcoded secrets, `any` types, deep nesting) into random source files. If reviewers don't catch them, the review is invalid.

**5b. Parallel scans** — spawn 4 Task agents simultaneously:

- **Agent A (gemini-scan):** model: sonnet
  ```
  Read the skill at workflow-skills/utils/gemini-scan/SKILL.md.
  Execute against: {TARGET}

  Run Gemini TWICE:
  1. focus: "general" — code quality, architecture, AI smells
  2. focus: "security" — think like an attacker, find vulnerabilities

  Combine findings from both passes. Output all findings as:
  [file:line] — description (severity)

  End with: GEMINI_SCAN_DONE
  ```

- **Agent B (codex-scan):** model: sonnet
  ```
  Read the skill at workflow-skills/utils/codex-scan/SKILL.md.
  Execute against: {TARGET}

  Output all findings as:
  [file:line] — description (category)

  End with: CODEX_SCAN_DONE
  ```

- **Agent C (qodana-scan):** model: haiku
  ```
  Read the skill at workflow-skills/utils/qodana-scan/SKILL.md.
  Execute against: {TARGET}

  Output all findings as:
  [file:line] — description (severity)

  End with: QODANA_SCAN_DONE
  ```

- **Agent D (ai-smell-scan):** model: haiku
  ```
  Read the skill at workflow-skills/utils/ai-smell-scan/SKILL.md.
  Execute against: {TARGET}

  Output all findings as:
  [file:line] [smell type]: description

  End with: AI_SMELL_SCAN_DONE
  ```

**5c. Deduplicate findings** — the orchestrator (not an agent) parses all 4 scan outputs:
- Extract `[file:line] description` from each
- Same file + line within 5 lines + similar description = one finding
- Keep the most specific description

**5d. Fix** — if findings exist, spawn 1 fix agent (model: sonnet):

```
Fix these review findings in {TARGET}:

{DEDUPED_FINDINGS_LIST}

SCOPE CONSTRAINT: Only modify code directly related to findings.
Do not refactor, rename, or restructure code that was not flagged.

COMPLEXITY BUDGET: Do not increase overall complexity. Net-zero or
net-negative lines/functions/types.
EXCEPTION: Security fixes are exempt.

NO SILENT FAILURES: Do not change a throw/crash to a log-and-continue.

Apply each fix. Run tests after.
When complete, end with: REVIEW_COMPLETE
```

If no findings from any scan, skip the fix agent and emit REVIEW_COMPLETE.

**5e. Validate canaries** — verify reviewers caught the planted violations:

```bash
tsx scripts/quality-gate.ts validate-canaries review {TARGET}
```

If any canaries were missed, the review is invalid. Re-run Phase 6 from 5a (max 2 retries). Canary validation also restores the original files — planted code is removed regardless of pass/fail.

### Step 6: Phases 7-8 (Verify)

**Do NOT start Phase 7 until Phase 6 (review) has returned REVIEW_COMPLETE.** The review fix agent modifies code — testing against stale code produces false results.

**Phase 7 (testing) prompt:**

```
Read the skill file at workflow-skills/workflow/testing/SKILL.md
and execute ALL of its instructions against: {TARGET}

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: TESTING_COMPLETE
```

**Phase 8 (evaluation) prompt:**

```
Read the skill file at workflow-skills/workflow/evaluation/SKILL.md
and execute ALL of its instructions against: {TARGET}

CRITICAL CONSTRAINTS — follow these exactly:

1. CODEX ONLY. Do NOT use Gemini for evaluation. The evaluator is Codex.
   Run: codex exec -s read-only -o /tmp/lens-eval-scores.md "<scorecard prompt>"
   If codex CLI is unavailable, note it and skip scoring.

2. SCORE 7 DIMENSIONS (1-10 each, total out of 70):
   Security, Structure, Error Handling, Naming, Complexity, Type Safety, Testability

3. ITERATE: If ANY dimension scores below 9:
   a. Fix the weakest dimension first (read the justification + weakest files)
   b. Re-score via Codex
   c. Repeat until all dimensions hit 9+ OR max 3 iterations

4. Do NOT read prior phase artifacts before scoring. Fresh eyes only.
   Only read lessons.md files during the deduplication step AFTER scoring.

5. Do NOT commit changes. Do NOT run git add or git commit.

6. Write outputs: eval-report.md, lessons.md, universal-lessons.md

Follow every step in the skill file. Do not skip any steps.
When complete, end your final message with the marker: EVALUATION_COMPLETE
```

### Step 7: Quality Gate (final)

```bash
npm test && tsx scripts/quality-gate.ts {TARGET}
```

If non-zero, pass error to Phase 7 (testing) for correction (max 2 retries). After Phase 7 fixes and gate passes, do NOT re-run Phase 8.

### Step 8: Report

```
Build: {TARGET}
  Rollback: stash@{N}

  ✓ Reference Opus built from PRD
  ✓ Design    plan approved
  ✓ Structure improved
  ✓ Build     implemented, gate passed
  ✓ Refine    refactored + deduped
  ✓ Review    4 scans, {N} findings fixed
  ✓ Verify    {N} tests, 0 failures
  ✓ Evaluate  {initial}/70 → {final}/70, lessons written

Rollback: /build --rollback
```

## Gate Check

After each subagent completes, check that its result contains the gate marker string.

- **Passes:** Report phase completion, proceed.
- **Fails:** Retry (same prompt) up to **3 times**. If still failing, halt and report.

## 6 Mechanisms

| # | Mechanism | Where | What |
|---|-----------|-------|------|
| 1 | plan-approval | after Phase 1 | User approves plan before building |
| 2 | quality-gate | after Phase 3, after Phase 8 | Phase 3: lint + code pattern checks. Phase 8: lint + tests + code pattern checks. |
| 3 | implementation-loop | Phase 3 | Re-run for remaining work items. Max 5. |
| 4 | gate-retry | all phases | Check for marker string. Retry 3x. |
| 5 | rollback | before pipeline | Git stash. |
| 6 | learning | Phases 1-5 read, Phase 8 writes | Lessons files + rubrics. |
