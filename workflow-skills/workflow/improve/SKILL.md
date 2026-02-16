---
name: improve
description: Improve existing code. Quality pipeline with learning loop and rollback support.
---

# /improve [path] [--rollback] [--dry-run]

Improve existing code using the full quality pipeline.

> **No arguments?** Describe this skill and stop. Do not execute.

## What Is This?

`/improve` runs 8 phases on **existing** code:

1. **plan** — Analyze what needs improvement
2. **structure** — Map existing architecture, design changes
3. **implementation** — Apply the improvements
4. **refactoring** — Refine structurally
5. **deduplication** — Remove duplicates
6. **review** — Parallel scans, dedupe findings, fix
7. **testing** — Write and run tests
8. **evaluation** — Final review, write lessons

```
[rollback] → Phase 1:plan → [approval] → Phase 2:structure
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

**Don't use for:** New features → `/build` | Simple changes → `/quick-change`

## Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the phase table and stop |
| `--rollback` | Restore from last improve stash |

## Phase Table

| # | Skill | Model | Gate Marker | Notes |
|---|-------|-------|-------------|-------|
| 1 | plan | sonnet | PLAN_COMPLETE | Pause for user approval. Loads rubrics. |
| 2 | structure | sonnet | STRUCTURE_COMPLETE | Map existing, design changes |
| 3 | implementation | opus | IMPLEMENTATION_COMPLETE | Loop if partial (max 5). Quality gate runs after. |
| 4 | refactoring | sonnet | REFACTORING_COMPLETE | |
| 5 | deduplication | haiku | DEDUPLICATION_COMPLETE | |
| 6 | review | sonnet | REVIEW_COMPLETE | Parallel scans → dedupe → fix |
| 7 | testing | sonnet | TESTING_COMPLETE | |
| 8 | evaluation | Bash+sonnet | EVALUATION_COMPLETE | Codex scores 1-100, fix→rescore loop (max 3), lessons. |

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
git stash list | grep "improve:" | head -1
# Extract stash ref and pop it
git stash pop <ref>
```

Then stop.

## Dry Run

If `--dry-run`, print the phase table and stop.

## Execution

### Step 0: Rollback Point

```bash
git stash push -m "improve:$(basename {TARGET}):$(date +%s)"
```

Report the stash ref to the user.

### Step 1: Phases 1-3 (Plan + Structure + Implementation)

For each phase, spawn a **single Task subagent** (`subagent_type: "general-purpose"`) with the model from the Phase Table.

**Phase 1-2 prompt:**

```
Read the skill file at .claude/phases/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code. Focus on analysis,
refactoring, and enhancement rather than greenfield creation.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

**After Phase 1:** Read the plan file. Present the summary to the user. Ask for approval (Approve / Reject / Revise). Do not proceed until approved.

**Phase 3 prompt (implementation):**

```
Read the skill file at .claude/phases/implementation/SKILL.md
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
When complete, end your final message with the marker: IMPLEMENTATION_COMPLETE
```

**Phase 3 completion loop:** If output contains IMPLEMENTATION_PARTIAL, re-run targeting only remaining items. Max 5 iterations. If items remain after 5, report to user and ask whether to continue or halt.

### Step 2: Quality Gate (after Phase 3)

Run via Bash (no subagent):

```bash
tsx scripts/quality-gate.ts {TARGET}
```

If non-zero, pass error output to Phase 3 for correction (max 2 retries).

### Step 3: Phases 4-5 (Refine)

**Phase 4-5 prompt:**

```
Read the skill file at .claude/phases/{SKILL_NAME}/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: {GATE_MARKER}
```

### Step 4: Phase 6 (Review)

All reviewers see the **same code state**. One fix pass at the end.

**4a. Parallel scans** — spawn 4 Task agents simultaneously:

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

**4b. Deduplicate findings** — the orchestrator (not an agent) parses all 4 scan outputs:
- Extract `[file:line] description` from each
- Same file + line within 5 lines + similar description = one finding
- Keep the most specific description

**4c. Fix** — if findings exist, spawn 1 fix agent (model: sonnet):

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

### Step 5: Phases 7-8 (Verify)

**Phase 7 (testing) prompt:**

```
Read the skill file at .claude/phases/testing/SKILL.md
and execute ALL of its instructions against: {TARGET}

This is an IMPROVEMENT workflow on existing code.

Follow every step in the skill. Do not skip any steps.
When complete, end your final message with the marker: TESTING_COMPLETE
```

**Phase 8 (evaluation) — orchestrator-owned:**

The orchestrator owns scoring and fix coordination. Scoring runs via Bash — never delegated to an agent.

**Prepare:** Read `.claude/phases/evaluation/SKILL.md` for the scorecard prompt, rescore prompt, classification tree, and report template. Load rubrics per its Rubric Loading section. Build `{SCORECARD_PROMPT}` by inserting `{RUBRIC_CRITERIA}` into the scorecard template.

**8a. Score via Bash (no agent):**

```bash
which codex 2>/dev/null && echo "CODEX_AVAILABLE" || echo "CODEX_UNAVAILABLE"
```

If `CODEX_UNAVAILABLE`: skip evaluation, note in report, continue to Step 6. Otherwise:

```bash
rm -f /tmp/lens-eval-scores.md
{SCORECARD_PROMPT}
cat /tmp/lens-eval-scores.md
```

**8b. Orchestrator parses output** — extract `ISSUE:` lines and the `SCORE: NN/100` line. Save as `{INITIAL_SCORE}` and `{ISSUES_LIST}`.

**8c–8d. Fix→Rescore loop (max 3 iterations):**

Set `{CURRENT_SCORE}` = `{INITIAL_SCORE}`, `{CURRENT_ISSUES}` = `{ISSUES_LIST}`, `{ALL_FIX_APPLIED}` = empty.

**For each iteration** (while `{CURRENT_ISSUES}` is non-empty AND iteration <= 3):

**8c. Fix all issues** — spawn FIX agent (`subagent_type: "general-purpose"`, model: `sonnet`):

```
Fix ALL of these issues in {TARGET}:

{CURRENT_ISSUES}

For each fix, print: FIX_APPLIED: {file:line} | {what changed}

After all fixes: npm test

PROHIBITED: committing, re-scoring, modifying code not cited in the issues
End with: FIX_COMPLETE
```

**8d. Rescore via Bash** — collect `FIX_APPLIED` lines from fix agent, append to `{ALL_FIX_APPLIED}`. Build `{RESCORE_PROMPT}` using the Rescore Prompt template, injecting `{CURRENT_SCORE}` and the new `FIX_APPLIED` lines:

```bash
rm -f /tmp/lens-eval-scores.md
{RESCORE_PROMPT}
cat /tmp/lens-eval-scores.md
rm -f /tmp/lens-eval-scores.md
```

Parse `SCORE: NN/100` → update `{CURRENT_SCORE}`. Parse remaining `ISSUE:` lines → update `{CURRENT_ISSUES}`.

**Exit loop** if: no remaining issues, OR score did not improve from previous iteration, OR iteration limit reached.

**End of loop.** Set `{FINAL_SCORE}` = `{CURRENT_SCORE}`, `{REMAINING_ISSUES}` = `{CURRENT_ISSUES}`.

**8e. Lessons** — spawn LESSON agent (`subagent_type: "general-purpose"`, model: `sonnet`):

```
Classify fixes and write evaluation outputs. Do NOT modify source code.

Initial score: {INITIAL_SCORE}/100
Final score: {FINAL_SCORE}/100
Issues found: {ISSUES_LIST}
Fixes applied: {ALL FIX_APPLIED LINES}
Remaining issues: {REMAINING_ISSUES}

Classify each fix using this tree:
- Code pattern to avoid? YES + general → LESSON in both .claude/lessons.md and .claude/universal-lessons.md
- Code pattern to avoid? YES + project-specific → LESSON in .claude/lessons.md only
- Suggests pipeline/tool change? → PROPOSAL in .claude/eval-proposals.md
- Neither → eval-report.md only

Category: LOGIC | DESIGN | CODE_QUALITY | DUPLICATION | AI_SMELL

Read .claude/lessons.md and .claude/universal-lessons.md — skip duplicates.
Write .claude/eval-report.md (replace file using template from
.claude/phases/evaluation/SKILL.md Report Template section).
Append to lessons + proposals.
Verify writes by reading each file.

End with: LESSONS_COMPLETE
```

The orchestrator checks for `FIX_COMPLETE` and `LESSONS_COMPLETE` markers. After the lesson agent completes, emit `EVALUATION_COMPLETE`.

### Step 6: Quality Gate (final)

```bash
npm test && tsx scripts/quality-gate.ts {TARGET}
```

If non-zero, pass error to Phase 7 (testing) for correction (max 2 retries). After Phase 7 fixes and gate passes, do NOT re-run Phase 8.

### Step 7: Report

```
Improve: {TARGET}
  Rollback: stash@{N}

  ✓ Design    plan approved
  ✓ Build     implemented, gate passed
  ✓ Refine    refactored + deduped
  ✓ Review    4 scans, {N} findings fixed
  ✓ Verify    {N} tests, 0 failures
  ✓ Evaluate  {initial}/100 → {final}/100, lessons written

Rollback: /improve --rollback
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
