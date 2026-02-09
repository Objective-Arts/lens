# How the Build/Improve Pipeline Works

## What It Is

A 12-phase assembly line that writes code and then checks it six different ways before it ships. You type `/build` or `/improve` with a description of what you want, and the pipeline runs each phase in order. No phase is skipped. If a phase fails, the pipeline stops.

## The Assembly Line

```
You describe what you want
    │
    ▼
Phase 1:  Plan it           ← you approve before anything gets built
Phase 2:  Design the data structures
Phase 3:  Write the code     ← the only phase that uses the most expensive model
    │
    ▼
Gate 3.5: MACHINE CHECK      ← linter + security scanner, no AI
    │
    ▼
Phase 4:  Refactor           ← Claude cleans up its own code
Phase 5:  Remove duplicates  ← consolidate repeated logic
Phase 6:  Gemini review      ← Google's model reviews Claude's work
Phase 7:  Static analysis    ← Qodana scans for bugs and smells
    │
    ▼
Gate 7.5: MACHINE CHECK      ← re-verify after fixes
    │
    ▼
Phase 8:  Security audit     ← Gemini thinks like an attacker
Phase 9:  Write tests        ← tests are not optional
Phase 10: Remove AI smells   ← fix patterns that look AI-generated
Phase 11: Codex review       ← third model reviews independently
    │
    ▼
Gate 11.5: MACHINE CHECK     ← final verification
    │
    ▼
Phase 12: Re-run tests       ← make sure cleanup didn't break anything
    │
    ▼
Done. Rollback available if you don't like the result.
```

## What Each Phase Does

### Phase 1: create-plan

**What:** Reads your description and produces a detailed plan — files to create, functions to write, data types, dependencies, security considerations, and a work item checklist.

**Who does it:** Claude (Sonnet — fast, cheap)

**Gate:** Plan file must exist with all required sections. No "TBD" or "as needed" allowed.

**Special:** The pipeline pauses here and shows you the plan. You approve, reject, or ask for revisions. Nothing gets built until you say go.

**Canon skills loaded:** Base Brain (clarity, pragmatism, simplicity, composition, distributed, data-first, correctness, algorithms, abstraction, optimization). If security-relevant, also loads security-mindset and owasp.

### Phase 2: structure-first

**What:** Designs the data structures and interfaces before any code gets written. Diagrams the architecture. For `/improve`, maps the existing code first.

**Who does it:** Claude (Sonnet)

**Gate:** Must output a current state diagram, issues found, target state diagram, and changes needed.

**Canon skills loaded:** Base Brain. If TypeScript, also loads typescript skill.

### Phase 3: implement-plan

**What:** Writes the actual code. The only phase that uses the most powerful (and expensive) model because this is where the hard work happens.

**Who does it:** Claude (Opus)

**Gate:** All work items from the plan must be completed. If some items remain, the phase re-runs targeting only the remaining items (up to 5 iterations). If items still remain after 5 tries, the pipeline asks you what to do.

**Constraints enforced:**
- Max 30 lines per function
- Max 300 lines per file
- Cyclomatic complexity ≤ 10
- No vague names
- Dead code removed

**Canon skills loaded:** Base Brain, plus typescript, security-mindset, owasp as needed.

### Gate 3.5: Machine Check

**What:** Runs the quality gate script against the code. No AI involved. The machine checks:
- Linter rules (no `any`, strict equality, const declarations, function length, file length, nesting depth, complexity)
- Security patterns (shell injection, hardcoded secrets, path traversal)
- Code structure (circular imports, empty catch blocks)

**Who does it:** A script (`tsx scripts/quality-gate.ts`). No model. Just pattern matching.

**Gate:** Exit code 0 (all checks pass) or the pipeline bounces back to Phase 3 with the error list. Max 2 retries before halting.

### Phase 4: refactor-check-fix

**What:** Systematic cleanup. Finds and fixes: long functions, large files, high complexity, vague names, duplication, deep nesting, magic numbers, missing error handling, god files. Also removes AI antipatterns (over-abstraction, defensive paranoia, comment spam).

**Who does it:** Claude (Sonnet)

**Gate:** All identified issues must be fixed (ISSUES_REMAINING = 0). Tests must pass. If issues remain after 3 iterations, reports to user and continues.

**Complexity budget:** This phase must not make the code MORE complex. Same or fewer files, functions, types, and total lines. If a fix adds lines, remove lines elsewhere.

**Canon skills loaded:** Base Brain + design-patterns + refactoring.

### Phase 5: dedupe-fix

**What:** Finds duplicated code (same logic in 2+ places) and consolidates into shared functions.

**Who does it:** Claude (Sonnet)

**Gate:** Lists duplicates found, how many were consolidated, and which were kept separate (with reasons). Build and tests must pass.

**Canon skills loaded:** composition, clarity, simplicity.

### Phase 6: gemini-fix

**What:** Sends the code to Google's Gemini model for an independent review. Gemini acts as a senior Google engineer — looks for bugs, edge cases, logic errors, performance issues, poor naming, missing error handling, and AI antipatterns. Then Claude applies the fixes Gemini found.

**Who does it:** Gemini reviews (via MCP tool), Claude (Sonnet) applies fixes.

**Gate:** All issues must be fixed. Only exception: DEFERRED_TO_HUMAN with an explanation.

**Complexity budget:** Same rules — net-zero or net-negative complexity.

### Phase 7: qodana-fix

**What:** Runs JetBrains Qodana static analysis. This is a machine scan — hundreds of inspections for bugs, code smells, security issues, and dead code. Claude fixes everything Qodana finds.

**Who does it:** Qodana scans (via MCP tools), Claude (Haiku — cheapest model, because the fixes are mechanical) applies fixes.

**Gate:** All Qodana findings must be resolved. No severity exemptions. Tests must pass.

### Gate 7.5: Machine Check

**What:** Re-runs the same quality gate script from Gate 3.5. Phases 4-7 may have introduced new violations while fixing other things. This catches that.

**Who does it:** Machine. No model.

**Gate:** Same as 3.5. Exit code 0 or bounce back to Phase 7.

### Phase 8: adversarial-security-review

**What:** Gemini reviews the code again, but this time thinking like an attacker. Looks for: secret leakage, crypto bugs, input validation gaps, path traversal, auth bypasses, error messages that leak internals.

**Who does it:** Gemini reviews (via MCP tool, focus: security), Claude (Sonnet) applies fixes.

**Gate:** All security issues must be fixed. No band-aids — root cause fixes only.

**Canon skills loaded:** security-mindset, owasp. Web-security if applicable.

### Phase 9: write-tests-run

**What:** Writes tests and runs them. Not optional. Covers happy path, error cases, and edge cases. Minimum one test per public function. All tests must pass.

**Who does it:** Claude (Sonnet)

**Gate:** All tests pass. Zero failures allowed.

**Rejects:** Tests that test implementation details. Excessive mocking. Mocking the thing you're testing. Brittle tests. Trivial tests.

**Canon skills loaded:** test-doubles, test-strategy. Security-mindset if applicable.

### Phase 10: ai-smell-fix

**What:** Hunts for code patterns that look AI-generated. Things a human developer would never write: single-use wrapper functions, over-abstracted factories for one-time operations, comments that restate the code, defensive null checks for things that can't be null, speculative features nobody asked for.

**Who does it:** Claude (Sonnet)

**Gate:** Lists smells found and smells fixed. Tests must pass. Records lessons learned to the feedback loop files.

### Phase 11: codex-check

**What:** Sends the code to OpenAI's Codex for a third independent review. Codex looks at the code fresh — different model, different training, different blind spots. Categorizes findings by security, reliability, operational, and architecture. Claude applies fixes.

If Codex CLI isn't installed, falls back to a bash-based pattern scanner (review-bot.sh) that checks for security patterns, AI smells, and quality markers.

**Who does it:** Codex reviews (via CLI), Claude (Sonnet) applies fixes.

**Gate:** All findings categorized and fixed. Security is priority 1, reliability priority 2, operational priority 3, architecture priority 4. Architecture fixes only if contained (< 20 lines changed).

### Gate 11.5: Machine Check

**What:** Final machine verification. Same quality gate script. Catches anything Phases 8-11 may have introduced.

**Who does it:** Machine. No model.

**Gate:** Exit code 0 or halt.

### Phase 12: write-tests-run (re-verify)

**What:** Re-runs the test suite. Phases 10-11 (ai-smell-fix and codex-check) may have changed code that breaks tests. This catches that.

**Who does it:** Claude (Haiku — cheapest model, because it's just re-running and fixing, not writing new tests)

**Gate:** All tests pass.

**Special rule:** If tests fail, fix the CODE that phases 10-11 broke, not the tests.

---

## How It's Configured

### File Locations

```
.claude/phases/                          ← phase skill files (what each phase does)
    create-plan/SKILL.md
    structure-first/SKILL.md
    implement-plan/SKILL.md
    refactor-check-fix/SKILL.md
    dedupe-fix/SKILL.md
    gemini-fix/SKILL.md
    qodana-fix/SKILL.md
    adversarial-security-review/SKILL.md
    write-tests-run/SKILL.md
    ai-smell-fix/SKILL.md
    codex-check/SKILL.md
        review-bot.sh                    ← fallback scanner if Codex CLI unavailable

.claude/skills/                          ← canon skills (the expert knowledge)
    clarity/SKILL.md
    security-mindset/SKILL.md
    typescript/SKILL.md
    ... (73 total)

.claude/config/
    workflow-phases.yaml                 ← phase ordering configuration
    keyword-detection.yaml               ← which skills auto-load for which contexts

scripts/
    quality-gate.ts                      ← machine check script (gates 3.5, 7.5, 11.5)

CLAUDE.md                                ← project rules, auto-invoke table, anti-patterns
```

### How Phases are Executed

Each phase runs as a **subagent** — a separate Claude instance spawned by the orchestrator. The orchestrator (the `/build` or `/improve` skill) is just a sequencer. It:

1. Spawns a subagent with a prompt: "Read the skill file at `.claude/phases/{name}/SKILL.md` and execute it against {TARGET}"
2. Waits for the subagent to finish
3. Checks for the gate marker in the subagent's output
4. If the marker is present, moves to the next phase
5. If the marker is absent, retries (up to 3 times) or halts

The orchestrator never does the work itself. It just manages the sequence.

### Model Assignment

| Phase | Model | Why |
|-------|-------|-----|
| 1 (plan) | Sonnet | Planning doesn't need the strongest model |
| 2 (structure) | Sonnet | Data structure design is well-defined |
| 3 (implement) | **Opus** | The hard part — needs the best model |
| 4-6 (refactor, dedupe, gemini) | Sonnet | Review and cleanup are straightforward |
| 7 (qodana) | **Haiku** | Mechanical fixes from scanner output — cheapest model |
| 8-11 (security, tests, smells, codex) | Sonnet | Judgment-heavy review phases |
| 12 (re-test) | **Haiku** | Just re-running tests — cheapest model |
| Gates 3.5, 7.5, 11.5 | **None** | Machine script, no model at all |

Cost optimization: Opus only runs once (implementation). Haiku runs for mechanical work. Sonnet handles everything else. Machine gates cost nothing.

### Gate Markers

Each phase must end its output with a specific string. The orchestrator checks for this string. If it's missing, the phase didn't complete.

| Phase | Marker |
|-------|--------|
| 1 | `PLAN_COMPLETE` |
| 2 | `STRUCTURE_COMPLETE` |
| 3 | `IMPLEMENT_COMPLETE` (or `IMPLEMENT_PARTIAL` if items remain) |
| 4 | `REFACTOR_COMPLETE` |
| 5 | `DEDUPE_COMPLETE` |
| 6 | `FIX_COMPLETE` |
| 7 | `VERIFIED_CLEAN` |
| 8 | `VERIFIED_CLEAN` |
| 9 | `TEST_COMPLETE` |
| 10 | `AI_SMELL_COMPLETE` |
| 11 | `CODEX_CHECK_COMPLETE` |
| 12 | `TEST_COMPLETE` |

### Retry Logic

| Situation | What happens |
|-----------|-------------|
| Phase doesn't produce gate marker | Retry same phase, up to 3 times. Then halt. |
| Machine gate fails (non-zero exit) | Pass errors to previous phase for correction, up to 2 retries. Then halt. |
| Phase 3 partial completion | Re-run with remaining items, up to 5 iterations. Then ask user. |
| Phase 4 issues remain | Re-run targeting remaining issues, up to 3 iterations. Then continue. |

### Complexity Budget

Phases 4-11 have a complexity budget: they must not make the code MORE complex. After their changes, the codebase must have the same or fewer:
- Files
- Exported functions
- Types/interfaces
- Total lines of code

If a fix adds lines, the phase must find lines elsewhere to remove. Net-zero or net-negative.

### Self-Learning Feedback Loop

The pipeline gets smarter over time:

- **Phases 6-8** (gemini-fix, qodana-fix, adversarial-security-review) WRITE lessons to two files:
  - `workflow-skills/phase-loop-lessons.md` — universal patterns, ships across all projects
  - `.claude/phase-loop-lessons.md` — project-specific instances
- **Phases 1-5** (create-plan through dedupe-fix) READ both files before starting

When Gemini finds that Claude keeps making the same mistake, that pattern gets recorded. Next time the pipeline runs, the earlier phases read the lesson and avoid the mistake before the reviewer even sees the code.

### Rollback

Before the first phase runs, the pipeline creates a git stash:

```bash
git stash push -m "build:feature-name:timestamp"
```

If anything goes wrong or you don't like the result:

```
/build --rollback
/improve --rollback
```

This restores the codebase to its pre-pipeline state.

### Tools Available Per Phase

| Phase | Tools |
|-------|-------|
| 1-3 (plan, structure, implement) | Read, Write, Glob, Grep, Bash (compile check) |
| 4-5 (refactor, dedupe) | Read, Edit, Bash (build/test) |
| 6 (gemini-fix) | mcp__gemini-reviewer__gemini_review, Edit, Bash |
| 7 (qodana-fix) | mcp__qodana__qodana_scan, mcp__qodana__qodana_problems, Edit, Bash |
| 8 (security) | mcp__gemini-reviewer__gemini_review (focus: security), Edit, Bash |
| 9, 12 (tests) | Write, Bash (test runner) |
| 10 (ai-smells) | Read, Edit, Bash |
| 11 (codex) | Codex CLI or review-bot.sh, Edit, Bash |
| Gates | Bash only (runs script) |

### `/build` vs `/improve`

Same pipeline, different framing:

| | `/build` | `/improve` |
|---|---|---|
| **Starting point** | No code exists | Code already exists |
| **Phase 1** | "Design the feature" | "Analyze what needs improvement" |
| **Phase 2** | "Create data structures" | "Map existing architecture, design changes" |
| **Phase 3** | "Write the code" | "Apply the improvements" |
| **Phases 4-12** | Identical | Identical |
| **Subagent prompt** | Standard | Adds "This is an IMPROVEMENT workflow on existing code" |

---

## junior-lens Test Run: What Was Built

The pipeline was run against `/Users/steve/local-tech-projects/lens-testing/junior-lens` with the prompt:

> Build a CLI tool in TypeScript that stores API keys encrypted on disk. Add, list, get, delete, and rotate keys. Each key has a service name, environment, and optional expiry. Export to .env format. Include tests.

### What the Pipeline Produced

| File | Lines | What It Does |
|------|-------|-------------|
| `src/types.ts` | 75 | Data structures — KeyEntry, EncryptedData, KeystoreData, crypto params. All readonly. |
| `src/crypto.ts` | 52 | AES-256-GCM encryption with scrypt key derivation. Standard library crypto only. |
| `src/keystore.ts` | 53 | Pure functions for key operations — add, get, remove, update. Immutable data. |
| `src/storage.ts` | 66 | File I/O with path traversal protection, atomic writes (temp + rename), file locking. |
| `src/index.ts` | 209 | CLI commands via commander + all command handler functions in one file. |
| **Total** | **455** | |

### What the Pipeline Got Right

- Crypto is solid: AES-256-GCM, scrypt with proper parameters, auth tags
- Path traversal protection in storage layer
- Atomic writes with temp file + rename pattern
- File locking with proper-lockfile
- All types are readonly
- Named constants throughout (no magic numbers)
- No `any` types
- Error messages don't leak internals
- Separation: types → crypto → keystore logic → storage → CLI

### What the Pipeline Missed

- No tests (Phase 9 didn't run or didn't produce output)
- Missing `environment` field from the prompt (keys only have name + value)
- Missing `expiry` field from the prompt
- Export outputs JSON, not `.env` format as requested
- `index.ts` at 209 lines should be split (commands in separate files)
- No commit — changes are unstaged
- Pipeline appears to have stopped after Phase 3 (implementation only, no review phases ran)

### Verdict

The pipeline produced decent Phase 3 output but didn't complete. The review phases (4-12) that catch problems and enforce quality didn't run. This means the code was written by Claude and self-evaluated by Claude — exactly the "grading your own exam" problem the quality gates are designed to solve.
