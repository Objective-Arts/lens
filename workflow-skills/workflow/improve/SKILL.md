---
name: improve
description: Improve existing code. Quality pipeline with learning loop and rollback support.
---

# /improve [path] [--rollback] [--dry-run]

Improve existing code using the full quality pipeline.

> **No arguments?** Describe this skill and stop. Do not execute.

> **First action:** Run `/clear` to free context for the pipeline. This is a long-running workflow — stale conversation history wastes context budget.

## What Is This?

`/improve` runs 8 phases on **existing** code:

1. **plan** — Analyze what needs improvement
2. **structure** — Improve the existing structure
3. **implementation** — Apply the improvements
4. **refactoring** — Refine structurally
5. **deduplication** — Remove duplicates
6. **review** — Parallel scans, dedupe findings, fix
7. **testing** — Write and run tests
8. **evaluation** — Codex scores 7 dimensions, fix until all 9+, write lessons

```
[rollback] → Phase 1:plan → Phase 2:structure
  → Phase 3:implementation [loop if partial]
  → [quality-gate]
  → Phase 4:refactoring → Phase 5:deduplication
  → Phase 6:review (parallel scans → dedupe → fix)
  → Phase 7:testing → Phase 8:evaluation
  → [quality-gate]
  → [lessons written]
```

## When to Use

- Refactoring a module, quality pass on a component, technical debt cleanup

**Don't use for:** New features → `/build` | Simple changes → `/change`

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the phase table and stop |
| `--rollback` | Restore from last improve stash |
| `--from N` | Skip to phase N (e.g., `--from review`, `--from 6`, `--from evaluation`) |

## Phase Table

| # | Skill | Model | Gate Marker | Notes |
|---|-------|-------|-------------|-------|
| 1 | plan | sonnet | PLAN_COMPLETE | Loads rubrics. |
| 2 | structure | sonnet | STRUCTURE_COMPLETE | Improve existing structure |
| 3 | implementation | opus | IMPLEMENTATION_COMPLETE | Loop if partial (max 5). Quality gate runs after. |
| 4 | refactoring | sonnet | REFACTORING_COMPLETE | |
| 5 | deduplication | haiku | DEDUPLICATION_COMPLETE | |
| 6 | review | sonnet | REVIEW_COMPLETE | Parallel scans → dedupe → fix |
| 7 | testing | sonnet | TESTING_COMPLETE | |
| 8 | evaluation | sonnet | EVALUATION_COMPLETE | Orchestrator-owned loop: score (Codex) → fix → rescore. Max 3 iterations. Quality gate runs after. |

## Orchestrator Rules

1. **NEVER do phase work yourself** — you are a sequencer, not an implementer
2. **NEVER skip a phase** — every phase runs in order
3. **NEVER proceed without gate marker** — the subagent result must contain the marker string
4. **Log the Phase 1 plan summary and proceed** — do NOT ask for approval, do NOT pause
5. **ALWAYS create rollback point first** before any phase runs
6. **ALWAYS record metrics** after each phase completes
7. **ALWAYS update `.claude/build-log/build-state.json`** after each phase completes
8. **BEFORE each phase, re-read this skill file** (`workflow-skills/workflow/improve/SKILL.md`) to refresh your instructions — context compaction may have removed them

## Rollback

If `--rollback` flag is set:

```bash
git stash list | grep "improve:" | head -1
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

No rollback point is created when resuming (code already exists). Start execution at the specified step.

**State restore:** Read `.claude/build-log/build-state.json` if it exists. Restore target path, stash ref, phase summaries, scores, and flags. This preserves metrics across conversations when context runs out mid-pipeline.

## Execution

### Step 0: Clean Start + Rollback Point

```bash
rm -rf .claude/build-log && mkdir -p .claude/build-log
```

Initialize the state file:

```json
{
  "target": "{TARGET}",
  "startedAt": "{ISO_TIMESTAMP}",
  "currentPhase": 0,
  "stashRef": null,
  "phaseResults": {},
  "scores": {},
  "flags": { "force": false, "autoApprove": false }
}
```

```bash
git stash push -m "improve:$(basename {TARGET}):$(date +%s)"
```

Report the stash ref to the user. Update `build-state.json` with the stash ref.

### Step 1: Phases 1-3 (Plan + Structure + Implementation)

For each phase, spawn a **single Task subagent** (`subagent_type: "general-purpose"`) with the model from the Phase Table.

**Phase 1-2 prompt:**

```
Read the skill file at workflow-skills/workflow/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code. Focus on analysis,
refactoring, and enhancement rather than greenfield creation.

Follow every step in the skill. Do not skip any steps.

OUTPUT RULES:
Write your full detailed output to .claude/build-log/phase-{N}-{SKILL_NAME}.md
Your final message back MUST contain ONLY:
  1. {GATE_MARKER} on its own line
  2. A single summary line (e.g. "12 improvement items planned across 4 files")
Do NOT return your full work log — the orchestrator reads the file when needed.
```

**After Phase 1:** Read `.claude/build-log/phase-1-plan.md`. Log a brief summary of the plan and proceed immediately. Do NOT ask for approval. Update `build-state.json` after each phase.

**Phase 3 prompt (implementation):**

```
Read the skill file at workflow-skills/workflow/implementation/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code. Focus on analysis,
refactoring, and enhancement rather than greenfield creation.

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

OUTPUT RULES:
Write your full detailed output to .claude/build-log/phase-3-implementation.md
Your final message back MUST contain ONLY:
  1. IMPLEMENTATION_COMPLETE (or IMPLEMENTATION_PARTIAL) on its own line
  2. A single summary line (e.g. "12 items implemented across 5 files")
Do NOT return your full work log — the orchestrator reads the file when needed.
```

**Phase 3 completion loop:** If output contains IMPLEMENTATION_PARTIAL, re-run targeting only remaining items. Max 5 iterations. If items remain after 5, report to user and ask whether to continue or halt.

Update `build-state.json` after Phase 3.

### Step 2: Quality Gate (after Phase 3)

Run via Bash (no subagent):

```bash
tsx .claude/scripts/quality-gate.ts {TARGET}
```

If non-zero, pass error output to Phase 3 for correction (max 2 retries).

### Step 3: Phases 4-5 (Refine)

**Phase 4-5 prompt:**

```
Read the skill file at workflow-skills/workflow/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code.

Follow every step in the skill. Do not skip any steps.

OUTPUT RULES:
Write your full detailed output to .claude/build-log/phase-{N}-{SKILL_NAME}.md
Your final message back MUST contain ONLY:
  1. {GATE_MARKER} on its own line
  2. A single summary line
Do NOT return your full work log — the orchestrator reads the file when needed.
```

Update `build-state.json` after each phase.

### Step 4: Phase 6 (Review)

All reviewers see the **same code state**. One fix pass at the end.

**4a. Insert canaries** — plant known violations before scans:

```bash
tsx .claude/scripts/quality-gate.ts insert-canaries review {TARGET}
```

This plants 3-5 known violations (bad names, shell injection, hardcoded secrets, `any` types, deep nesting) into random source files. If reviewers don't catch them, the review is invalid.

**4b. Parallel scans** — spawn 4 Task agents simultaneously:

- **Agent A (gemini-scan):** model: sonnet
  ```
  Read the skill at workflow-skills/utils/gemini-scan/SKILL.md.
  Execute against: {TARGET}

  Run Gemini TWICE:
  1. focus: "general" — code quality, architecture, AI smells
  2. focus: "security" — think like an attacker, find vulnerabilities

  Combine findings from both passes. Write all findings to .claude/build-log/scan-gemini.md as:
  [file:line] — description (severity)

  OUTPUT RULES:
  Your final message back MUST contain ONLY:
    1. GEMINI_SCAN_DONE on its own line
    2. A single summary line (e.g. "7 findings")
  Do NOT return findings in your message — the orchestrator reads the file.
  ```

- **Agent B (codex-scan):** model: sonnet
  ```
  Read the skill at workflow-skills/utils/codex-scan/SKILL.md.
  Execute against: {TARGET}

  Write all findings to .claude/build-log/scan-codex.md as:
  [file:line] — description (category)

  OUTPUT RULES:
  Your final message back MUST contain ONLY:
    1. CODEX_SCAN_DONE on its own line
    2. A single summary line (e.g. "4 findings")
  Do NOT return findings in your message — the orchestrator reads the file.
  ```

- **Agent C (qodana-scan):** model: haiku
  ```
  Read the skill at workflow-skills/utils/qodana-scan/SKILL.md.
  Execute against: {TARGET}

  Write all findings to .claude/build-log/scan-qodana.md as:
  [file:line] — description (severity)

  OUTPUT RULES:
  Your final message back MUST contain ONLY:
    1. QODANA_SCAN_DONE on its own line
    2. A single summary line (e.g. "3 findings")
  Do NOT return findings in your message — the orchestrator reads the file.
  ```

- **Agent D (ai-smell-scan):** model: haiku
  ```
  Read the skill at workflow-skills/utils/ai-smell-scan/SKILL.md.
  Execute against: {TARGET}

  Write all findings to .claude/build-log/scan-ai-smell.md as:
  [file:line] [smell type]: description

  OUTPUT RULES:
  Your final message back MUST contain ONLY:
    1. AI_SMELL_SCAN_DONE on its own line
    2. A single summary line (e.g. "5 findings")
  Do NOT return findings in your message — the orchestrator reads the file.
  ```

**4c. Deduplicate findings** — the orchestrator (not an agent) reads all 4 scan files:
- Read `.claude/build-log/scan-gemini.md`, `scan-codex.md`, `scan-qodana.md`, `scan-ai-smell.md`
- Extract `[file:line] description` from each
- Same file + line within 5 lines + similar description = one finding
- Keep the most specific description
- Write deduplicated findings to `.claude/build-log/phase-6-review-findings.md`

**4d. Fix** — if findings exist, spawn 1 fix agent (model: sonnet):

```
Read the deduplicated findings from .claude/build-log/phase-6-review-findings.md
Fix these review findings in {TARGET}.

SCOPE CONSTRAINT: Only modify code directly related to findings.
Do not refactor, rename, or restructure code that was not flagged.

COMPLEXITY BUDGET: Do not increase overall complexity. Net-zero or
net-negative lines/functions/types.
EXCEPTION: Security fixes are exempt.

NO SILENT FAILURES: Do not change a throw/crash to a log-and-continue.

Apply each fix. Run tests after.

OUTPUT RULES:
Write your detailed fix log to .claude/build-log/phase-6-review-fix.md
Your final message back MUST contain ONLY:
  1. REVIEW_COMPLETE on its own line
  2. A single summary line (e.g. "Fixed 8 findings across 4 files")
Do NOT return your full work log — the orchestrator reads the file when needed.
```

If no findings from any scan, skip the fix agent and emit REVIEW_COMPLETE.

**4e. Validate canaries** — verify reviewers caught the planted violations:

```bash
tsx .claude/scripts/quality-gate.ts validate-canaries review {TARGET}
```

If any canaries were missed, the review is invalid. Re-run Phase 6 from 4a (max 2 retries). Canary validation also restores the original files — planted code is removed regardless of pass/fail.

### Step 5: Phases 7-8 (Verify)

**Phase 7 (testing) prompt:**

```
Read the skill file at workflow-skills/workflow/testing/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code.

Follow every step in the skill. Do not skip any steps.

OUTPUT RULES:
Write your full detailed output to .claude/build-log/phase-7-testing.md
Your final message back MUST contain ONLY:
  1. TESTING_COMPLETE on its own line
  2. A single summary line (e.g. "23 tests written, all passing")
Do NOT return your full work log — the orchestrator reads the file when needed.
```

Update `build-state.json` after Phase 7.

**Phase 8 (evaluation) — orchestrator-owned loop:**

The orchestrator owns the score-fix loop. Do NOT delegate the entire evaluation to one agent.

**8a. Prepare:**

Read `workflow-skills/workflow/evaluation/SKILL.md` for the scorecard prompt template, scoreboard format, classification tree, and report template. Load rubrics per its Rubric Loading section. Build `{SCORECARD_PROMPT}` by inserting `{RUBRIC_CRITERIA}` into the scorecard template.

**8b. Score-fix loop** (max 3 iterations):

**i. Spawn SCORE agent** (`subagent_type: "general-purpose"`, model: `sonnet`):

```
You have ONE task: run the Codex scorecard and report scores. Do NOTHING else.

1. which codex 2>/dev/null && echo "CODEX_AVAILABLE" || echo "CODEX_UNAVAILABLE"
   If unavailable: print CODEX_UNAVAILABLE and end with SCORE_COMPLETE.

2. Run this exact command:
   {SCORECARD_PROMPT}

3. cat /tmp/lens-eval-scores.md

4. Write parsed scores to .claude/build-log/phase-8-scores.md in this EXACT format:
   SCORE_SECURITY: N
   SCORE_STRUCTURE: N
   SCORE_ERROR_HANDLING: N
   SCORE_NAMING: N
   SCORE_COMPLEXITY: N
   SCORE_TYPE_SAFETY: N
   SCORE_TESTABILITY: N
   SCORE_TOTAL: NN

5. rm -f /tmp/lens-eval-scores.md

PROHIBITED: editing files, committing, using Gemini, fixing code

OUTPUT RULES:
Your final message back MUST contain ONLY:
  1. SCORE_COMPLETE on its own line
  2. The total score (e.g. "Total: 58/70")
Do NOT return full scores — the orchestrator reads .claude/build-log/phase-8-scores.md.
```

**ii. Orchestrator parses scores** — read `.claude/build-log/phase-8-scores.md` and extract `SCORE_*` lines. Log the scoreboard using the format from evaluation SKILL.md. Save iteration 1 scores as `{INITIAL_SCORES}`. Update `build-state.json` with scores.

If `CODEX_UNAVAILABLE` on iteration 1: skip the loop, note in report, continue to 8c.

**iii. Check threshold** — all dimensions >= 9? Break the loop.

**iv. Spawn FIX agent** (`subagent_type: "general-purpose"`, model: `sonnet`):

```
Read scores from .claude/build-log/phase-8-scores.md.
Fix ONLY these issues in {TARGET}:

{For each dimension below 9, ordered lowest-first:}
{DIMENSION} ({SCORE}/10) — {JUSTIFICATION} — Weakest: {file:line}, ...

For each fix, write to .claude/build-log/phase-8-fixes.md:
FIX_APPLIED: {dimension} | {file:line} | {what changed}

After all fixes: npm test

PROHIBITED: committing, re-scoring, modifying unrelated code

OUTPUT RULES:
Your final message back MUST contain ONLY:
  1. FIX_COMPLETE on its own line
  2. A single summary line (e.g. "Fixed 3 dimensions across 5 files")
Do NOT return your full work log — the orchestrator reads the file when needed.
```

**v. Read** `FIX_APPLIED` lines from `.claude/build-log/phase-8-fixes.md`. Continue to next iteration.

**8c. Lessons** — after the loop, spawn **LESSON agent** (`subagent_type: "general-purpose"`, model: `sonnet`):

```
Classify fixes and write evaluation outputs. Do NOT modify source code.

Read scores and fixes from:
- .claude/build-log/phase-8-scores.md (final scores)
- .claude/build-log/phase-8-fixes.md (all fixes applied)

Initial scores: {INITIAL_SCORES}

Classify each fix using this tree:
- Code pattern to avoid? YES + general → LESSON in both .claude/lessons.md and .claude/universal-lessons.md
- Code pattern to avoid? YES + project-specific → LESSON in .claude/lessons.md only
- Suggests pipeline/tool change? → PROPOSAL in .claude/eval-proposals.md
- Neither → eval-report.md only

Category: LOGIC | DESIGN | CODE_QUALITY | DUPLICATION | AI_SMELL

Read .claude/lessons.md and .claude/universal-lessons.md — skip duplicates.
Write .claude/eval-report.md (replace file using template from
workflow-skills/workflow/evaluation/SKILL.md Report Template section).
Write detailed evaluation log to .claude/build-log/phase-8-evaluation.md
Append to lessons + proposals.
Verify writes by reading each file.

OUTPUT RULES:
Your final message back MUST contain ONLY:
  1. LESSONS_COMPLETE on its own line
  2. A single summary line (e.g. "3 lessons written, 1 proposal filed")
Do NOT return your full work log — the orchestrator reads the file when needed.
```

The orchestrator checks for `SCORE_COMPLETE`, `FIX_COMPLETE`, and `LESSONS_COMPLETE` markers. After the lesson agent completes, update `build-state.json` and emit `EVALUATION_COMPLETE`.

### Step 6: Quality Gate (final)

```bash
npm test && tsx .claude/scripts/quality-gate.ts {TARGET}
```

If non-zero, pass error to Phase 7 (testing) for correction (max 2 retries). After Phase 7 fixes and gate passes, do NOT re-run Phase 8.

### Step 7: Report

Read `build-state.json` to assemble the summary using phase summaries:

```
Improve: {TARGET}
  Rollback: stash@{N}

  ✓ Design    plan approved
  ✓ Build     implemented, gate passed
  ✓ Refine    refactored + deduped
  ✓ Review    4 scans, {N} findings fixed
  ✓ Verify    {N} tests, 0 failures
  ✓ Evaluate  {initial}/70 → {final}/70, lessons written

Rollback: /improve --rollback
```

## Gate Check

After each subagent completes, check that its result contains the gate marker string. Because subagents return only the marker + summary, this is a simple string check.

- **Passes:** Update `build-state.json`, report phase completion, proceed.
- **Fails:** Retry (same prompt) up to **3 times**. If still failing, halt and report.

## 6 Mechanisms

| # | Mechanism | Where | What |
|---|-----------|-------|------|
| 1 | plan-log | after Phase 1 | Log plan summary and proceed (no approval pause) |
| 2 | quality-gate | after Phase 3, after Phase 8 | Phase 3: lint + code pattern checks. Phase 8: lint + tests + code pattern checks. |
| 3 | implementation-loop | Phase 3 | Re-run for remaining work items. Max 5. |
| 4 | gate-retry | all phases | Check for marker string. Retry 3x. |
| 5 | rollback | before pipeline | Git stash. |
| 6 | learning | Phases 1-5 read, Phase 8 writes | Lessons files + rubrics. |
