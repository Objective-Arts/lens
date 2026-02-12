---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Quality Building Flow

How the 11-phase pipeline, abstract quality contracts, and self-learning lessons work together to turn a feature request into production-quality code.

---

## 1. What the Pipeline Does

The pipeline turns a feature request into production-quality code through 11 phases. Three construction phases build the feature; two self-review phases clean it; three external review phases inspect it from different model perspectives; one cleanup phase removes AI artifacts; two verification phases confirm correctness. Machine gates run between groups — no AI cost, just scripts. A self-learning loop feeds findings from review phases back to construction phases so the same defect class never recurs.

---

## 2. Quality Mechanisms at a Glance

The pipeline uses 12 quality mechanisms. Six are **enforced** — machine-verified, they block shipping. Six are **instructional** — loaded into AI context, they improve odds but can't guarantee outcomes. Understanding which is which matters.

```
                        ENFORCED                                  INSTRUCTIONAL
               (machine-verified, blocks)                   (context-loaded, advisory)
    ┌──────────────────────────────────────┐    ┌──────────────────────────────────────┐
    │                                      │    │                                      │
    │  ┌─────────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │
    │  │  Machine Gates                  │ │    │  │  Abstract Quality Contracts     │ │
    │  │  Exit code ≠ 0 → pipeline stops │ │    │  │  7 boundary types in SKILL.md   │ │
    │  └─────────────────────────────────┘ │    │  └─────────────────────────────────┘ │
    │  ┌─────────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │
    │  │  Proxy Checks                   │ │    │  │  Self-Learning Lessons          │ │
    │  │  25 patterns — match = fail     │ │    │  │  Past findings loaded at start  │ │
    │  └─────────────────────────────────┘ │    │  └─────────────────────────────────┘ │
    │  ┌─────────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │
    │  │  Evidence Checklists            │ │    │  │  Rubric Auto-Detection          │ │
    │  │  Machine counts — gaps rejected │ │    │  │  Domain criteria loaded          │ │
    │  └─────────────────────────────────┘ │    │  └─────────────────────────────────┘ │
    │  ┌─────────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │
    │  │  Three-Model Vote               │ │    │  │  Complexity Budget              │ │
    │  │  Disagreements → reconciliation │ │    │  │  "Net-zero" instruction          │ │
    │  └─────────────────────────────────┘ │    │  └─────────────────────────────────┘ │
    │  ┌─────────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │
    │  │  Canary Tests                   │ │    │  │  Clean-Slate Rule               │ │
    │  │  100% detection or review fails │ │    │  │  "Don't read prior artifacts"    │ │
    │  └─────────────────────────────────┘ │    │  └─────────────────────────────────┘ │
    │  ┌─────────────────────────────────┐ │    │  ┌─────────────────────────────────┐ │
    │  │  Completion Loops               │ │    │  │  False Positive Tracking        │ │
    │  │  Retries — unfinished reported  │ │    │  │  Known bad patterns to skip     │ │
    │  └─────────────────────────────────┘ │    │  └─────────────────────────────────┘ │
    │                                      │    │                                      │
    └──────────────────────────────────────┘    └──────────────────────────────────────┘
```

The enforced side is what the [five-layer model](../why-five-layers-wins.md) covers. The instructional side is better prompting — it makes the AI more likely to write correct code, but nothing stops it from ignoring the instructions. See sections 5-7 for how the instructional mechanisms work, and section 9 for the enforced ones.

---

## 3. The 11-Phase Pipeline

```
Phase 1 (plan) → Phase 2 (structure) → Phase 3 (implement)
    → Gate 3.5 → Phase 4 (refactor) → Phase 5 (dedupe)
    → Phase 6 (gemini) → Phase 7 (codex) → Gate 7.5
    → Phase 8 (security) → Phase 9 (ai-smell) → Gate 9.5
    → Phase 10 (tests) → Phase 11 (eval) → Gate 11.5
```

| # | Name | Model | Purpose | Gate Marker |
|---|------|-------|---------|-------------|
| 1 | create-plan | Sonnet | Decompose task into WORK_ITEMS with contract tags | PLAN_COMPLETE |
| 2 | structure-first | Sonnet | Map architecture, assign abstract types, define QUALITY_CONTRACTS | STRUCTURE_COMPLETE |
| 3 | implement-plan | Opus | Write code from plan using contract idioms | IMPLEMENT_COMPLETE |
| **3.5** | **machine-gate** | **None** | **quality-gate + construction check** | **exit code 0** |
| 4 | refactor-check-fix | Sonnet | Systematic cleanup under complexity budget | REFACTOR_COMPLETE |
| 5 | dedupe-fix | Haiku | Consolidate duplicated code | DEDUPE_COMPLETE |
| 6 | gemini-fix | Sonnet | Gemini code + product quality review, fix all | FIX_COMPLETE |
| 7 | codex-fix | Sonnet | Independent Codex review + fixes (eval rubric) | CODEX_FIX_COMPLETE |
| **7.5** | **machine-gate** | **None/Haiku** | **Qodana scan; Haiku fixer only if issues found** | **exit code 0** |
| 8 | adversarial-security-review | Sonnet | Think like an attacker, Gemini reviews, agent applies | VERIFIED_CLEAN |
| 9 | ai-smell-fix | Haiku | Remove AI-generated antipatterns | AI_SMELL_COMPLETE |
| **9.5** | **machine-gate** | **None** | **npm test + quality-gate** | **exit code 0** |
| 10 | write-tests-run | Sonnet | Write and run tests for coverage | TEST_COMPLETE |
| 11 | final-eval-check | Sonnet | Codex + Gemini review, fix all, write lessons | EVAL_COMPLETE |
| **11.5** | **machine-gate** | **None** | **npm test + quality-gate (final)** | **exit code 0** |

### Phase Groups

**Construction (1-3)**: Plan, structure, implement. Quality designed in from the start. Phase 1 reads lessons and rubrics to avoid known defects. Phase 2 identifies boundaries and assigns abstract types. Phase 3 implements using the deepest-reasoning model (Opus) with contract idioms baked into the code.

**Self-review (4-5)**: Refactor and dedupe. Operates under a complexity budget — net-zero or net-negative lines, functions, and types. Forces cleanup instead of feature creep.

**External review (6-8)**: Gemini, Codex, and adversarial security. Three independent model perspectives. Each reviews the code without seeing prior review results. Disagreements resolved by vote reconciliation after Phase 8.

**Cleanup (9)**: AI smell removal. Haiku model — pattern-match and apply, no deep reasoning needed. Removes single-use helpers, comment spam, defensive paranoia, and speculative features.

**Verification (10-11)**: Tests and final eval. Phase 11 uses a clean-slate rule — it does not read prior phase artifacts before reviewing, ensuring an unbiased final assessment.

**Machine gates (3.5, 7.5, 9.5, 11.5)**: No AI cost. Run scripts: quality-gate proxy checks, Qodana static analysis, npm test. Binary pass/fail.

---

## 4. Knowledge Flow Across Phases

```
                    ┌─────────────────────────────────────┐
                    │           .claude/rubric/            │
                    │  contracts.md  base.md  cli.md  ...  │
                    └──────┬──────────┬───────────────────┘
                           │          │
    canon/*/SUMMARY.md ────┤          │
                           ▼          ▼
              ┌────── Phase 1 (plan) ──────┐
              │  Reads: canon, lessons,     │
              │    rubrics, contracts        │
              │  Writes: WORK_ITEMS with    │
              │    contract tags, plan file  │
              └─────────────┬───────────────┘
                            ▼
              ┌────── Phase 2 (structure) ──┐
              │  Reads: canon, lessons,     │
              │    contracts                 │
              │  Writes: QUALITY_CONTRACTS  │
              │    table, type files         │
              └─────────────┬───────────────┘
                            ▼
              ┌────── Phase 3 (implement) ──┐
              │  Reads: canon (per-unit),   │
              │    lessons, plan constraints │
              │  Writes: source code with   │
              │    contract idioms           │
              └─────────────┬───────────────┘
                            ▼
              [Gates 3.5 → Phases 4-5 → Phases 6-8 → ...]
                            │
                            ▼
              ┌────── Phases 6-8, 11 ───────┐
              │  Finds issues in code        │
              │  Writes: lessons files       │
              │  (project + universal)       │
              └─────────────┬───────────────┘
                            │
                    ┌───────▼───────┐
                    │  Next pipeline │
                    │  run reads     │
                    │  lessons at    │
                    │  Phases 1-5    │
                    └───────────────┘
```

Each phase reads specific inputs and produces specific outputs. The critical feedback loop: review phases (6-8, 11) write lessons that construction phases (1-3) read on the next run. This means a defect caught once is prevented forever.

---

## 5. Abstract Quality Contracts

### The Problem

Phases 6-8 repeatedly catch the same structural defects — raw strings where validated types belong, errors without cause chains, paths built from user input without validation. These are design decisions, not review findings. Fixing them in review is expensive; preventing them in construction is cheap.

### The 7 Contract Types

| Type | Meaning | Boundary Signal |
|------|---------|-----------------|
| ValidatedInput | Data that passed boundary validation | CLI args, API params, form fields, query strings |
| SafePath | Path constructed through validation, not concatenation | path.join with user input, file reads, directory traversal |
| CausedError | Error preserving original cause chain | catch blocks, error construction, re-throws |
| Secret | Value that must never appear in logs/errors/responses | passwords, tokens, API keys, connection strings |
| ExternalData | Untrusted data from outside the system | file reads, API responses, env vars, stdin |
| BoundedOperation | Operation with timeout or size limit | recursion, network calls, file reads, loops over user input |
| IdempotentAction | Action safe to retry without side effects | file writes, DB updates, state mutations |

### Detection Questions

- Does it accept user input? → ValidatedInput
- Does it construct file paths with external data? → SafePath
- Does it catch and re-throw errors? → CausedError
- Does it handle credentials or tokens? → Secret
- Does it read files, APIs, or env vars? → ExternalData
- Does it do I/O that could hang or grow unbounded? → BoundedOperation
- Could it be called twice with the same input? → IdempotentAction

### The 3-Phase Contract Flow

1. **Phase 2 (structure)** identifies boundaries and assigns abstract types → writes a QUALITY_CONTRACTS table listing each boundary and its contract types
2. **Phase 1 (plan)** tags each WORK_ITEM constraint with abstract type(s) → `[ValidatedInput + CausedError]`
3. **Phase 3 (implement)** reads the tags and implements using the target language's idiom
4. **Gate 3.5** structurally verifies contract functions/types exist via EXPORT_FUNCTION/EXPORT_TYPE checks

### Language Idioms

The 7 types are language-agnostic concepts. Each maps to a specific pattern per language:

| Type | TypeScript | Python | Java |
|------|-----------|--------|------|
| ValidatedInput | Branded type `string & { __brand: 'Validated' }` | Pydantic model | Wrapper class with factory |
| SafePath | Branded type with factory function | `pathlib.Path` subclass | `Path` wrapper with validation |
| CausedError | `new Error(msg, { cause: e })` | `raise X from e` | `new Exception(msg, cause)` |
| Secret | Opaque type, redacted `toString()` | `__repr__` returns `***` | `toString()` returns `***` |

### Why Static

Seven fixed types cover 80%+ of boundary defects found in review phases. No dynamic detection needed. The types are stable — they map to fundamental security and reliability boundaries that exist in every codebase.

---

## 6. The Self-Learning Lesson System

### Two-Tier Architecture

**Universal** (`.claude/universal-lessons.md`): General patterns that apply to any project. Authored in `workflow-skills/lessons.md` and seeded to the target project on profile apply. Review phases write new universal patterns here; the file grows with each pipeline run. Example: "Never pair existsSync + readFileSync — use try-catch to avoid TOCTOU races."

**Project-specific** (`.claude/lessons.md`): Instances with file paths. Stays with the project. Example: "src/trace/index.ts:42 — TOCTOU race in file reading."

### Who Reads (Preventive)

Construction phases read lessons before writing code:

| Phase | Categories Read |
|-------|----------------|
| 1 (plan) | LOGIC, DESIGN, CODE_QUALITY, DUPLICATION, AI_SMELL |
| 2 (structure) | DESIGN, LOGIC, AI_SMELL |
| 3 (implement) | All categories — most impactful reader |
| 4 (refactor) | All categories |
| 5 (dedupe) | All categories |

Phase 3 is the most impactful reader because it's where code gets written. A lesson read at Phase 3 directly prevents the defect from entering the codebase.

### Who Writes (Capture)

Review phases write lessons after finding issues:

| Phase | Categories Written | Focus |
|-------|--------------------|-------|
| 6 (gemini-fix) | LOGIC, CODE_QUALITY, DESIGN, AI_SMELL | Code + product quality |
| 7 (codex-fix) | CODE_QUALITY, LOGIC | Independent model perspective |
| 8 (adversarial) | LOGIC, DESIGN | Security-focused |
| 9 (ai-smell-fix) | AI_SMELL, DESIGN | AI antipatterns |
| 11 (final-eval) | All categories | Clean-slate review |

### The 5 Categories

| Category | What It Captures | Routed To |
|----------|-----------------|-----------|
| LOGIC | Bugs, races, injection, traversal | Phase 3 (implement) |
| DESIGN | Architecture mistakes, size limits, cleanup symmetry | Phases 1-2 (plan, structure) |
| CODE_QUALITY | Dead code, unused imports, naming, exception handling | Phase 4 (refactor) |
| DUPLICATION | Repeated constants, duplicate patterns | Phase 5 (dedupe) |
| AI_SMELL | Single-use helpers, comment spam, defensive paranoia, speculative features | Phase 3 (implement) |

### Lesson Formats

**Universal** (`.claude/universal-lessons.md`):
```markdown
### Pattern Name
- Rule in imperative form. Generalizable, not project-specific.
```

**Project-specific** (`.claude/lessons.md`):
```markdown
## {date} - {target path}
### {Phase Name} Found (phase N)
- {CATEGORY}: {specific description with file:line} → {which earlier phase should catch this}
```

---

## 7. Lesson Promotion

How a finding becomes a permanent rule:

1. Phase 6 catches "secrets interpolated into error messages" in `src/auth.ts:42`
2. Writes to `.claude/lessons.md`: `LOGIC: Secret in error message at src/auth.ts:42 → implement-plan should use opaque types`
3. Checks `.claude/universal-lessons.md` for an existing general pattern
4. If new, writes general rule: "Never interpolate credentials into error messages or logs. Use opaque types with redacted toString()."
5. On the next pipeline run, Phase 3 reads `.claude/universal-lessons.md`
6. Phase 3 applies it proactively — the defect never occurs

### Deduplication

Before appending to the universal file, the phase reads the file and searches for the pattern. If a matching rule already exists, it skips the write. This prevents duplicate rules from accumulating.

### False Positive Tracking

Gemini-fix and codex-fix record patterns the reviewer consistently flags incorrectly. Examples:
- "Missing rate limiting" — not applicable to local CLI tools
- "`process.env` propagation as environment variable injection" — not applicable when user controls terminal

Future runs skip these patterns, reducing noise and wasted fix cycles.

---

## 8. Rubric System

### What Rubrics Are

Quality criteria templates that define what "production-ready" means for different types of software. Each rubric is a checklist of concerns with detection questions and planning prompts.

Rubrics are authored in `workflow-skills/rubric/` and travel with the skills repo. When a profile is applied (`lens profile apply`), `installAllWorkflowSkills()` copies the rubric directory to `.claude/rubric/` in the target project. Skills reference rubrics at `.claude/rubric/base.md`, `.claude/rubric/contracts.md`, etc. — the deployed path, not the source path. Rubric upgrades happen automatically during `upgradeWorkflowSkills()`.

### Auto-Detection

`AUTO-DETECT.md` maps file signals to domain rubrics:

| Signal | Detection Patterns | Rubric Loaded |
|--------|-------------------|---------------|
| Always | — | `base.md` + `product-quality.md` |
| HTTP server | Express, Fastify, Koa, Hono, `http.createServer`, Flask, Django | `web-api.md` |
| Data persistence | SQL, ORM (Prisma, TypeORM, Sequelize), `fs.writeFile` on user data, SQLite, Redis | `data-persistence.md` |
| CLI tool | `process.argv`, commander, yargs, cac, argparse, click | `cli.md` |
| Microservice | Dockerfile, docker-compose, Kubernetes manifests, health endpoints | `microservice.md` |

Multiple domains can match. A CLI tool that persists data loads both `cli.md` and `data-persistence.md`.

### How Rubrics Feed the Pipeline

1. **Phase 1** loads all applicable rubrics and generates a PRODUCTION_CHECKLIST
2. **Review phases (6, 7, 8, 11)** use rubric criteria as their review framework
3. If a plan omits an applicable rubric item without justification, it fails validation

The base rubric covers 12 universal concerns: input validation, injection prevention, secret management, error handling, bounded operations, atomic writes, config externalization, structured logging, actionable errors, AI code smells, and architecture.

---

## 9. Integrity Mechanisms

Four mechanisms ensure review quality:

### Canary Testing (Phase 6)

Intentional violations planted before review. 3-5 known bugs inserted from categories: naming, security, secrets, types, complexity. After the review completes, the pipeline validates that 100% of canaries were detected. If the reviewer misses any, the pipeline re-runs or halts. Canary manifest stored at `.claude/canary-manifest.json` (ephemeral — deleted after validation).

### Evidence Validation (Phases 4, 6, 7, 8)

Evidence checklists verified by machine. Each checklist is a table of locations, items, verdicts, and reasoning:

```markdown
# Evidence: {check name}
Canon: {canon-file} {check number}
Scanned: {count} items in {count} files

| Location | Item | Verdict | Reasoning |
|----------|------|---------|-----------|
| src/file.ts:8 | symbol | PASS/FAIL | reasoning |
```

If incomplete, the phase bounces back with specifics (max 2 retries). Phase 4 produces 3 checklists (name sufficiency, single responsibility, magic values). Phase 6 produces 2 (error messages, input boundaries). Phase 7 produces 1 (auth/failure paths). Phase 8 produces 1 (attack surface).

### Vote Reconciliation (After Phase 8)

Three models (Claude, Gemini, Codex) review independently. When they disagree on a finding, a reconciliation agent re-evaluates each flagged item. This prevents false positives from a single model from driving unnecessary changes.

### Completion Loops

Phase 3 retries up to 5 times for remaining WORK_ITEMS. Phase 4 retries up to 3 times for remaining issues. Neither silently drops items — if retries exhaust, the pipeline reports what remains unfinished.

---

## 10. Complexity Budget

Review phases (4, 5, 6, 8, 9) operate under a net-zero or net-negative constraint: they cannot add more files, functions, types, or lines than they remove. This forces:

- **Refactoring** instead of feature-adding
- **Consolidation** instead of new abstractions
- **Deletion** of dead code rather than working around it

Scope creep is structurally impossible in review phases. Only Phase 3 (implement) can add net-new complexity, and it does so under the constraints set by Phases 1-2.

---

## 11. Model Selection

| Model | Phases | Rationale |
|-------|--------|-----------|
| Opus | 3 (implement) | Implementation requires the deepest reasoning to translate plans into correct code with contract idioms |
| Sonnet | 1-2, 4, 6-8, 10-11 | Review, planning, and test writing need strong reasoning but not maximum depth |
| Haiku | 5, 9 | Pattern-match and apply tasks — dedupe consolidation and AI smell removal don't need deep reasoning |
| None | Gates 3.5, 7.5, 9.5, 11.5 | Script execution only — lint, Qodana, npm test. Zero AI cost |

Opus is used sparingly (Phase 3 only) because it's the most expensive model. The pipeline reserves it for the phase where reasoning depth matters most: turning a structured plan into correct, contract-respecting code. Everything else runs on Sonnet or Haiku.

---

## Cross-References

- [Quality Gate Spec](../quality-gate-spec.md) — machine gate technical specification (proxy checks, evidence checklists, canary tests)
- [Use Quality Flags](../how-to/use-quality-flags.md) — user-facing flags and options for `/build` and `/improve`
- [Two-Tier Review Architecture](two-tier-review.md) — self-review vs external validation design
- [Skill Enforcement Model](skill-enforcement-model.md) — how skills become hard gates, not suggestions
