---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Pipeline Sequential Analysis

A step-by-step walkthrough of everything that happens when you run `/build` or `/improve`, from the first skill load to the final lesson write. Every gate, check, pattern, and decision point is documented in execution order.

---

## Table of Contents

1. [Before the Pipeline: Canon Loading](#1-before-the-pipeline-canon-loading)
2. [Before the Pipeline: Profile Application](#2-before-the-pipeline-profile-application)
3. [Pipeline Entry](#3-pipeline-entry)
4. [Design Stage (Phases 1-2)](#4-design-stage-phases-1-2)
5. [Build Stage (Phase 3)](#5-build-stage-phase-3)
6. [Gate 3.5: Quality Gate](#6-gate-35-quality-gate)
7. [Gate 3.7: Smoke Test](#7-gate-37-smoke-test)
8. [Refine Stage (Phases 4-5)](#8-refine-stage-phases-4-5)
9. [Review Stage (Phases 6-9)](#9-review-stage-phases-6-9)
10. [Gate 7.5: Qodana + Quality Gate](#10-gate-75-qodana--quality-gate)
11. [Gate 7.7: Smoke Test](#11-gate-77-smoke-test)
12. [Gate 9.5: Test + Quality Gate](#12-gate-95-test--quality-gate)
13. [Verify Stage (Phases 10-11)](#13-verify-stage-phases-10-11)
14. [Gate 11.5: Final Gate](#14-gate-115-final-gate)
15. [Post-Pipeline: Deployment Readiness](#15-post-pipeline-deployment-readiness)
16. [Post-Pipeline: Cleanup](#16-post-pipeline-cleanup)
17. [Learn Loop: How Findings Become Prevention](#17-learn-loop-how-findings-become-prevention)
18. [Pattern Reference](#18-pattern-reference)

---

## 1. Before the Pipeline: Canon Loading

Before any pipeline phase runs, the system loads expert guidance through 4 additive layers. Every phase gets a tailored skill set. The formula:

```
Loaded Skills = Base Brain + Profile + Phase + Detected Keywords
```

### Layer 1: Base Brain (Always On)

10 foundational skills loaded for every software project, regardless of language or type:

| Skill | Focus |
|-------|-------|
| clarity | Readability, no cleverness, names reveal intent |
| pragmatism | Get it working first, brute force is fine |
| simplicity | Small interfaces, composition over inheritance |
| composition | Unix philosophy, do one thing well |
| distributed | Failure handling, distributed systems |
| data-first | Data structures first, algorithms follow |
| correctness | Formal discipline, correctness by construction |
| algorithms | Algorithmic rigor, literate programming |
| abstraction | Substitution principle, type contracts |
| optimization | Performance awareness, measure before optimizing |

**Context cost:** ~4,200 tokens (~2% of context window).

**Source file:** `profiles/software-base.yaml`

Beyond the 10 base skills, `software-base.yaml` also loads: design-patterns, security-mindset, owasp, failure, safety, resilience, docs, prose, brevity, editing, react-test, legacy, test-doubles, test-strategy. These are available for phase-specific and keyword-triggered loading.

### Layer 2: Profile (Project Type)

Set once when you configure the project with `lens profile apply`. Each profile extends `software-base` and adds domain-specific skills:

| Profile | Added Skills |
|---------|-------------|
| typescript-cli | typescript, type-systems, js-safety, js-internals, js-perf, functional, async, composition, simplicity |
| react | react-state, react-test, components, typescript |
| python | python-idioms, python-protocols, python-patterns, python-advanced |
| java | java |
| angular | angular-core, angular-arch, angular-perf, rxjs |

**Source files:** `profiles/{name}.yaml`

### Layer 3: Phase (What You're Doing)

Each pipeline phase loads specific skills suited to its activity. This is defined in `config/workflow-phases.yaml`:

| Phase | Skills Loaded |
|-------|--------------|
| plan | clarity, simplicity, distributed, pragmatism, data-first, correctness, abstraction, resilience, failure, safety |
| structure-first | data-first, correctness, abstraction, java, design-patterns, pragmatism |
| implement | pragmatism, clarity, simplicity, composition, distributed, optimization + language-specific from profile |
| refactor-check | clarity, pragmatism, legacy, design-patterns, simplicity, refactoring, style |
| test | test-doubles, test-strategy, react-test, angular-core, legacy |
| code-review | (none — Gemini handles) |
| static-analysis | (none — Qodana handles) |
| security-review | (none — Gemini with security focus handles) |

### Layer 4: Detection (What You Mentioned)

Keywords in the task description trigger additional skills at runtime. Defined in `config/keyword-detection.yaml`. There are 21 detection categories:

| Category | Example Keywords | Skills Added |
|----------|-----------------|-------------|
| security | auth, password, JWT, token, csrf, xss | security-mindset, owasp, appsec, web-security |
| database | sql, prisma, postgres, migration, transaction | sql, sql-perf, security-mindset |
| api | endpoint, REST, graphql, middleware, webhook | java, simplicity |
| testing | test, mock, coverage, jest, vitest | test-doubles, test-strategy, react-test |
| performance | optimize, cache, latency, bottleneck, N+1 | optimization, algorithms |
| cli | command line, terminal, shell, argv, pipe | composition, simplicity, clarity, pragmatism |
| typescript | type, interface, generic, discriminated union | typescript, type-systems |
| react | hook, useState, useEffect, redux, zustand | react-state, react-test |
| algorithms | sort, tree, graph, recursive, dynamic programming | algorithms, correctness |
| architecture | design pattern, factory, singleton, SOLID | design-patterns, abstraction, simplicity |

(Plus 11 more categories: ui, forms, animation, design-system, typography, distributed, documentation, visualization, error-handling, debugging, refactoring, javascript, python, java, csharp, angular, rxjs, svelte, golang, deployment, risk.)

### How Loading Works at Runtime

The loading logic lives in:
- `src/ralph/phases/loader.ts` — `loadPhaseConfig()`, `loadKeywordRules()`
- `src/ralph/phases/index.ts` — `createPhases()` phase factory
- `src/ralph/types.ts` — type definitions
- `detectSkills()` — combines all 4 layers into the final skill set

---

## 2. Before the Pipeline: Profile Application

Running `lens profile apply {profile-name} -p {project-path}` sets up the project for pipeline use. This happens once, before any `/build` or `/improve` invocation.

### What Profile Apply Does

1. **Installs canon skills** — copies skill SUMMARY.md files from `canon/` to `.claude/canon/` based on the profile's `skills.canon` list
2. **Installs workflow skills** — creates symlinks in `.claude/skills/` pointing to `workflow-skills/` subdirectories (all 24+ skills)
3. **Copies phase config** — `config/workflow-phases.yaml` and `config/keyword-detection.yaml` to `.claude/config/`
4. **Generates ralph-config.yaml** — iteration limits, quality gates, exit criteria from the profile
5. **Deploys rubrics** — copies `workflow-skills/rubric/` to `.claude/rubric/` (base.md, contracts.md, cli.md, etc.)
6. **Seeds lessons** — copies `workflow-skills/lessons.md` to `.claude/universal-lessons.md` (universal patterns)
7. **Installs hooks** — merges hook definitions into `.claude/settings.json`
8. **Generates CLAUDE.md** — combines standards, anti-patterns, auto-invoke rules, and available commands from both the base profile and the project-specific profile

### CLAUDE.md Generation

The generated CLAUDE.md includes:
- **Profiles Applied** — which profile is active
- **Available Commands** — table of all installed workflow skills (pipeline, phase, scan, utility categories)
- **Standards** — merged from `software-base.yaml` + project profile
- **Anti-Patterns** — merged from both profiles
- **Auto-Invoke Skills** — context→action mappings that trigger skills automatically

**Implementation:** `src/profiles/apply-config.ts` — `buildProfileSections()`, `updateClaudeMdWithProfile()`

---

## 3. Pipeline Entry

When you invoke `/build target` or `/improve target`:

### Step 0: Metrics Start

```bash
tsx scripts/quality-gate.ts start-metrics build {TARGET}
```

Creates a metrics tracking file for timing and issue counts across all phases.

### Step 1: Rollback Point

```bash
git stash push -m "build:$(basename {TARGET}):$(date +%s)"
```

The stash ref is reported to the user. If anything goes wrong, `/build --rollback` pops this stash and restores the pre-pipeline state.

### Step 2: Dry Run Check

If `--dry-run` is set, the orchestrator prints the phase table and stops. No rollback point is created.

### Orchestrator Rules

The orchestrator (the build/improve SKILL.md) is a **sequencer, not an implementer**. It:
- Never does phase work itself
- Never skips a phase
- Never proceeds without a gate marker
- Always presents the Phase 1 plan for user approval
- Records metrics after each phase

---

## 4. Design Stage (Phases 1-2)

### Phase 1: create-plan

**Model:** Sonnet | **Gate marker:** `PLAN_COMPLETE`

**What it does:**
1. Reads `.claude/universal-lessons.md` and `.claude/lessons.md` (all 5 lesson categories)
2. Reads applicable rubrics from `.claude/rubric/` (auto-detected by `AUTO-DETECT.md` — always loads `base.md` + `product-quality.md`, plus domain rubrics like `cli.md`, `web-api.md`, `data-persistence.md`)
3. Reads `.claude/rubric/contracts.md` for abstract quality contract types
4. Decomposes the task into WORK_ITEMS
5. Tags each WORK_ITEM with applicable contract types: `[ValidatedInput + CausedError]`
6. Generates a PRODUCTION_CHECKLIST from rubric items
7. Writes the plan file to `.claude/create-plans/{plan-slug}.md`

**Special handling:** After Phase 1 passes its gate, the orchestrator reads the plan and presents it to the user via `AskUserQuestion`:
- **Approve plan** — continue to Phase 2
- **Reject plan** — halt, rollback available
- **Revise plan** — re-run Phase 1 (does NOT count against retry limit)

Phase 2 does not start until the user explicitly approves.

### Phase 2: structure-first

**Model:** Sonnet | **Gate marker:** `STRUCTURE_COMPLETE`

**What it does:**
1. Reads the approved plan
2. Reads lessons (categories: DESIGN, LOGIC, AI_SMELL)
3. Reads `.claude/rubric/contracts.md`
4. Maps the architecture — identifies all data boundaries
5. For each boundary, assigns abstract quality contract types
6. Writes a `QUALITY_CONTRACTS` table:

```
QUALITY_CONTRACTS:
| Boundary | Abstract Type | Contract | Construction Check |
|----------|--------------|----------|--------------------|
| CLI args (profile name) | ValidatedInput | Must match ^[a-z0-9-]+$ | EXPORT_FUNCTION: validateProfileName |
| File path from user | SafePath | Must resolve within project dir | EXPORT_FUNCTION: resolveProjectPath |
| catch blocks | CausedError | Must preserve cause chain | EXPORT_TYPE: none (pattern check) |
| API keys in config | Secret | Must not appear in logs | EXPORT_TYPE: none (pattern check) |
```

7. Creates type files / interface definitions

### The 7 Abstract Quality Contract Types

These are language-agnostic concepts that prevent the most common boundary defects:

| Type | Meaning | Boundary Signal | TypeScript Idiom |
|------|---------|-----------------|------------------|
| **ValidatedInput** | Data that passed boundary validation | CLI args, API params, form fields | Branded type: `string & { __brand: 'Validated' }` |
| **SafePath** | Path constructed through validation, not concatenation | path.join with user input, file reads | Branded type with factory function |
| **CausedError** | Error preserving original cause chain | catch blocks, re-throws | `new Error(msg, { cause: e })` |
| **Secret** | Value that must never appear in logs/errors/responses | passwords, tokens, API keys | Opaque type, redacted `toString()` |
| **ExternalData** | Untrusted data from outside the system | file reads, API responses, env vars | Parse + validate before use |
| **BoundedOperation** | Operation with timeout or size limit | recursion, network calls, loops over user input | Timeout wrapper, size check |
| **IdempotentAction** | Action safe to retry without side effects | file writes, DB updates, state mutations | Check-before-write, atomic ops |

**Why 7 fixed types:** They cover 80%+ of boundary defects found in review phases. No dynamic detection needed — these map to fundamental security and reliability boundaries in every codebase.

**Detection questions per boundary:**
- Does it accept user input? → ValidatedInput
- Does it construct file paths with external data? → SafePath
- Does it catch and re-throw errors? → CausedError
- Does it handle credentials/tokens? → Secret
- Does it read files/APIs/env? → ExternalData
- Does it do I/O that could hang or grow unbounded? → BoundedOperation
- Could it be called twice with the same input? → IdempotentAction

### Rubric Auto-Detection

The rubric system selects quality checklists based on project signals:

| Signal | Detection Patterns | Rubric Loaded |
|--------|-------------------|---------------|
| Always | — | `base.md` + `product-quality.md` |
| HTTP server | Express, Fastify, Koa, Hono, `http.createServer`, Flask, Django, ASP.NET | `web-api.md` |
| Data persistence | SQL, ORM (Prisma, TypeORM), `fs.writeFile` on user data, SQLite, Redis | `data-persistence.md` |
| CLI tool | `process.argv`, commander, yargs, cac, argparse, click | `cli.md` |
| Microservice | Dockerfile, docker-compose, Kubernetes manifests, health endpoints | `microservice.md` |

Multiple domains can match. A CLI that persists data loads both `cli.md` and `data-persistence.md`.

---

## 5. Build Stage (Phase 3)

### Phase 3: implement-plan

**Model:** Opus (deepest reasoning) | **Gate marker:** `IMPLEMENT_COMPLETE`

**What it does:**
1. Reads the approved plan and QUALITY_CONTRACTS table
2. Reads lessons (ALL 5 categories — this is the most impactful reader)
3. For each WORK_ITEM in the plan:
   a. Refreshes the relevant canon principle for that unit
   b. Writes the code using contract idioms (branded types, cause chains, etc.)
   c. Compile-checks before starting the next unit
4. Follows the contract tags from Phase 1 to implement boundary protections

**Why Opus:** Implementation is the only phase where reasoning depth directly determines code quality. Turning a structured plan into correct, contract-respecting code requires understanding the full context. Every other phase runs on Sonnet or Haiku.

### Completion Loop (Pattern: Loop)

Phase 3 must complete ALL WORK_ITEMS from the plan:

1. After Phase 3 runs, the orchestrator reads the plan and checks the output
2. If output contains `IMPLEMENT_PARTIAL` (items remain):
   - Parses REMAINING items from the subagent output
   - Re-runs Phase 3 targeting only remaining items
   - Repeats until `IMPLEMENT_COMPLETE` or **5 iterations** reached
3. If 5 iterations exhausted with items still remaining:
   - Reports to user which items could not be completed
   - Asks: "Continue with remaining phases?" or "Halt pipeline?"
   - Does NOT silently drop items

### Runtime Constraints File

After Phase 3 completes (and passes Gate 3.5/3.7), the orchestrator writes `.claude/runtime-constraints.md` documenting any runtime-specific constraints discovered during implementation. Example:

```markdown
# Runtime Constraints
- SQLite EF Core provider cannot translate DateTimeOffset comparisons — use client-side filtering
- Frontend served via UseDefaultFiles + UseStaticFiles — do not change the path pattern
- Database uses EnsureCreatedAsync() for SQLite — do not change to MigrateAsync()
```

Every subsequent phase (4-11) reads this file before making changes. If a phase's changes would violate a constraint, the change must not be made.

---

## 6. Gate 3.5: Quality Gate

**Model:** None (scripts only) | **Cost:** Zero AI tokens

This is the first machine gate. It runs two checks:

### Check 1: Quality Gate Proxy Checks

```bash
tsx scripts/quality-gate.ts {TARGET}
```

The quality gate runs 25+ proxy checks organized in 6 categories. Each check traces to a canon SUMMARY.md principle. All checks skip `*.test.ts`, `node_modules/`, `dist/`, `.claude/`.

#### Naming Checks (canon: clarity)

| Check | Fail Condition |
|-------|----------------|
| Banned parameter names | Exported function parameter named `data`, `info`, `result`, `item`, `obj`, `val`, `tmp`, `temp`, `ret`, `res` |
| Single-letter params | Single-letter parameter except `_`, `i`/`j`/`k` in loops, `e` in catch |
| Short function names | Exported function name under 4 characters |
| Banned file names | File named `utils.ts`, `helpers.ts`, `misc.ts`, `common.ts`, `shared.ts` |
| Abbreviated names | Exported name containing `mgr`, `impl`, `proc`, `svc`, `repo` |

#### Composition Checks (canon: composition, simplicity)

| Check | Fail Condition |
|-------|----------------|
| Export count | Non-index file with >10 exports |
| Parameter count | Function with >4 parameters (destructured object = 1) |
| Import fan-in | File importing from >8 other project files |
| File length | File over 300 lines |
| Function length | Function over 30 lines (excluding blanks/comments) |

#### Testing Checks (canon: test-strategy, test-doubles)

| Check | Fail Condition |
|-------|----------------|
| Test file coverage | `src/**/*.ts` file has no corresponding `.test.ts` |
| Empty tests | `it()` or `test()` block with no `expect()` call |
| Test importing test | `.test.ts` importing from another `.test.ts` |

#### Security Checks (canon: owasp, security-mindset)

| Check | Fail Condition |
|-------|----------------|
| Shell injection | `exec()`/`execSync()` with template literal or concatenation |
| Hardcoded secrets | String matching `password=`, `api_key=`, `sk-`, `ghp_`, `AKIA` |
| Path traversal | `path.join()` with unvalidated user input |
| Empty catch | `catch` block with zero statements |
| Raw error exposure | `console.error(err)` instead of `console.error(err.message)` |
| Unguarded JSON.parse | `JSON.parse()` not wrapped in try/catch |
| Circular imports | DFS cycle detection on import graph |

#### Design Checks (canon: abstraction, data-first)

| Check | Fail Condition |
|-------|----------------|
| Class method count | Class with >10 methods |
| Inheritance depth | Inheritance depth > 2 |
| Types before functions | First function appears before first type/interface (in files with types) |

#### Magic Value Checks (canon: clarity)

| Check | Fail Condition |
|-------|----------------|
| Magic numbers | Numeric literal (not -1/0/1/2) in logic not assigned to named constant |
| Magic strings | String literal in `if`/`switch`/`===`/`!==` not assigned to named constant |

### Check 2: Construction Check

```bash
tsx scripts/quality-gate.ts validate-construction .claude/create-plans/{PLAN_SLUG}.md {TARGET}
```

If the plan has a `CONSTRUCTION_CHECKS` section, validates that Phase 3 followed the plan. Checks for expected `EXPORT_FUNCTION` and `EXPORT_TYPE` declarations.

Construction check failures are **informational** (do not halt) — they indicate Phase 3 didn't follow the plan but don't block the pipeline.

### Gate Result

- **Exit 0:** Proceed to Phase 4
- **Non-zero:** Pass error output to Phase 3 for correction (max 2 retries)
- **Still failing after 2 retries:** Halt pipeline, report to user

---

## 7. Gate 3.7: Smoke Test

**Model:** None (scripts only) | **Cost:** Zero AI tokens

Verifies the application actually starts and serves responses. Static analysis cannot replace runtime verification.

### Procedure

1. **Detect app type and start:**
   - `*.csproj` → `dotnet run --urls "http://localhost:0"`
   - `package.json` with `start` → `npm start`
   - `package.json` with `main` → `node {main}`
   - Capture PID

2. **Wait for ready** (max 30 seconds):
   ```bash
   for i in $(seq 1 30); do
     curl -sf http://localhost:{PORT}/ > /dev/null 2>&1 && break
     sleep 1
   done
   ```

3. **Verify API endpoints:** Read plan, extract endpoints, curl each GET. Accept 200, 204, 401. Reject 404, 500.

4. **Verify frontend:** If plan includes static files, verify they're served.

5. **Verify runtime prerequisites:** Check for migrations, preview TFMs.

6. **Cleanup:** `kill $APP_PID`

### Gate Result

- App failed to start → **HALT**
- Any API endpoint returned 500 → **HALT**
- Frontend returned 404 → **HALT** ("Check UseStaticFiles() configuration")
- `Database.Migrate()` without migration classes → **HALT**
- Preview TFM → **WARN** (do not halt)

If gate fails, pass error to Phase 3 for correction (max 2 retries).

---

## 8. Refine Stage (Phases 4-5)

### Complexity Budget (Pattern: Budget)

Phases 4-9 all operate under the complexity budget:

> After your changes, the codebase must have the same or fewer: files, exported functions, types/interfaces, and total lines. If your fix adds lines, find lines elsewhere to remove. Net-zero or net-negative.

**Exception:** Security fixes (auth, injection, HTTPS) are exempt from the budget.

This forces refactoring instead of feature-adding, consolidation instead of new abstractions, and deletion of dead code.

### Shared Review Phase Rules

All review phases (4-9) must also follow:

- **Runtime constraints:** Read `.claude/runtime-constraints.md` first. Never violate a listed constraint.
- **Scope constraint:** Only modify code directly related to findings. No "improving" surrounding code.
- **Completeness rule:** If you change infrastructure (DB init, startup config, static files, package references), complete the full change. Half-finished changes break the smoke test.
- **No silent failures:** Never change a `throw` to log-and-continue. Fail-fast on misconfiguration is always correct.

### Phase 4: refactor-check-fix

**Model:** Sonnet | **Gate marker:** `REFACTOR_COMPLETE`

**What it does:**
1. Reads runtime constraints
2. Reads lessons (ALL categories)
3. Systematically reviews all code for refactoring opportunities
4. Applies fixes under complexity budget
5. Produces 3 evidence checklists (Pattern: Evidence)

**Evidence Checklist 4a: Name Sufficiency**
- Canon source: `clarity/SUMMARY.md` check #2
- Machine counts all exported functions and constants
- Claude lists every exported symbol with an 8-word-max description
- Validation: row count must equal exported symbol count

**Evidence Checklist 4b: Single Responsibility**
- Canon source: `clarity/SUMMARY.md` check #1
- Machine counts all exported functions
- Claude lists every function with a one-sentence purpose WITHOUT using "and"
- Validation: row count = function count. Any row containing " and " in reasoning → auto-FAIL (function does two things)

**Evidence Checklist 4c: Magic Value Audit**
- Canon source: `clarity/SUMMARY.md` check #3
- Machine counts all non-trivial numeric and string literals
- Claude lists every literal with justification or extraction recommendation
- Validation: row count = literal count from proxy check

**Evidence format:**
```markdown
# Evidence: {check name}
Canon: {canon-file} {check number}
Scanned: {count} items in {count} files

| Location | Item | Verdict | Reasoning |
|----------|------|---------|-----------|
| src/crypto.ts:8 | encrypt | PASS | encrypts plaintext with AES-256-GCM |
| src/commands/add.ts:4 | handleAdd | FAIL | "handle" is meaningless — rename to addKey |
```

Rules: one row per item (no grouping), location must be file:line, verdict PASS or FAIL, reasoning one sentence, FAIL rows must include what to do.

### Evidence Validation Gate (After Phase 4)

```bash
tsx scripts/quality-gate.ts validate-evidence refactor {TARGET}
```

The validator:
1. Parses the markdown table in `.claude/evidence/refactor-4a.md`, `refactor-4b.md`, `refactor-4c.md`
2. Counts rows with `src/` in Location column
3. Runs the corresponding counter against the codebase
4. Compares: `Checklist 4a: 14/14 items reviewed ✓` or `Checklist 4a: 9/14 items reviewed ✗ INCOMPLETE`

If incomplete: re-run Phase 4 with "You missed N items in checklist X. Review ALL items." (max 2 retries)

### Phase 4 Completion Loop (Pattern: Loop)

After Phase 4 runs:
1. Check output for `ISSUES_REMAINING` count
2. If `ISSUES_REMAINING > 0`: re-run targeting remaining issues
3. Repeat until ISSUES_REMAINING = 0 or **3 iterations** reached
4. If 3 iterations exhausted: report remaining, continue to Phase 5

### Phase 5: dedupe-fix

**Model:** Haiku | **Gate marker:** `DEDUPE_COMPLETE`

**What it does:**
1. Pattern-matches for duplicated code across the target
2. Consolidates duplicates under complexity budget
3. Uses only composition, clarity, simplicity skills

Haiku is sufficient because deduplication is pattern-matching, not deep reasoning.

---

## 9. Review Stage (Phases 6-9)

The review stage uses three independent model perspectives (Claude/Sonnet, Gemini, Codex) to review code. Each reviewer sees the code fresh — none reads prior review results. Disagreements are resolved by vote reconciliation.

### Phase 6: gemini-fix

**Model:** Sonnet (orchestrates) + Gemini (reviews via MCP) | **Gate marker:** `FIX_COMPLETE`

**What it does:**
1. Reads runtime constraints
2. Reads `.claude/universal-lessons.md` (checks for existing patterns, only appends NEW ones)
3. Sends code to Gemini via `mcp__gemini-reviewer__gemini_review` for code review
4. Sends code to Gemini with `focus: "adversarial"` for product quality review
5. Fixes all findings under complexity budget
6. Produces 2 evidence checklists
7. Writes new lessons to both `.claude/lessons.md` and `.claude/universal-lessons.md`

**Evidence Checklist 6a: Error Message Audit**
- Canon: `security-mindset/SUMMARY.md` hard gate #1
- Machine counts all `console.error`, `console.log`, `throw new Error`, `reject(` calls
- Gemini lists every error/log statement, what it exposes, whether it leaks internals
- Validation: row count = error/log statement count

**Evidence Checklist 6b: Input Boundary Check**
- Canon: `security-mindset/SUMMARY.md` hard gate #3
- Machine counts CLI arg reads, `fs.readFile`, env access
- Gemini lists every input boundary with validation description
- Validation: row count = input boundary count

#### Canary Wrapping (Pattern: Canary)

Phase 6 is wrapped with canary pre/post steps. This is NOT optional.

**Pre-review:**
```bash
tsx scripts/quality-gate.ts insert-canaries gemini {TARGET}
```

Plants 3-5 known violations into random source files from 5 categories:

| Category | Canon Source | What Gets Planted | Example |
|----------|-------------|-------------------|---------|
| Naming | clarity check #2 | Vague exported function name | `export function process(d: any) { return d; }` |
| Security | owasp check #1 | Shell injection | `` exec(`echo ${input}`) `` |
| Secrets | security-mindset gate #5 | Hardcoded credential | `const apiKey = "sk-canary-test-00000";` |
| Types | typescript gate #1 | Explicit any | `export function load(config: any): void {}` |
| Complexity | clarity check #4 | Deeply nested logic | `if (a) { if (b) { if (c) { if (d) { ... } } } }` |

The machine picks 3-5 per run (never all 5 — reviewer shouldn't guess the pattern). Canaries are inserted inside real function bodies, never in test files or index.ts. The inserted code must compile.

**Canary manifest** (`.claude/canary-manifest.json`, NOT visible to reviewer):
```json
{
  "phase": "gemini-fix",
  "canaries": [
    {
      "id": "c1",
      "category": "secrets",
      "file": "src/crypto.ts",
      "line": 12,
      "inserted": "const apiKey = \"sk-canary-test-00000\";",
      "original": ""
    }
  ]
}
```

**Run:** Gemini reviews and writes evidence checklists normally.

**Post-review:**
```bash
tsx scripts/quality-gate.ts validate-canaries gemini {TARGET}
```

For each canary, checks: does any checklist row reference that file:line with a FAIL verdict?

```
Canary validation for gemini-fix:
  c1 (secrets)  src/crypto.ts:12    → DETECTED ✓
  c2 (naming)   src/storage.ts:5    → DETECTED ✓
  c3 (security) src/commands/add.ts:8 → MISSED ✗
Result: 2/3 detected. Review INVALID — rerun required.
```

**Detection threshold:** 100%. These are deliberately obvious violations. If the reviewer can't find a hardcoded `sk-` key, it's not finding real issues either.

**Retry:** If canaries missed, re-run Phase 6 once with note: "Previous run missed planted violations. Read ALL code carefully." If missed again, halt pipeline.

Source files are always restored to pre-canary state after validation.

**Why not canary Claude's self-review?** Claude wrote the code. It knows what it wrote. Canaries test whether a reviewer is actually reading code it sees for the first time.

### Evidence Validation Gate (After Phase 6)

```bash
tsx scripts/quality-gate.ts validate-evidence gemini {TARGET}
```

Same validation as Phase 4's evidence gate — count rows vs expected items.

### Phase 7: codex-fix

**Model:** Sonnet (orchestrates) + Codex (reviews) | **Gate marker:** `CODEX_FIX_COMPLETE`

**What it does:**
1. Reads runtime constraints
2. Runs independent Codex review using the same rubric as the final eval
3. Fixes all findings under complexity budget
4. Produces 1 evidence checklist

**Evidence Checklist 7a: Auth and Failure Path Review**
- Machine counts all `catch` blocks + all `if` blocks checking permissions/auth
- Codex lists every catch block (fail open or closed?) and every auth check (bypass path?)
- Validation: row count = catch block count

### Evidence Validation Gate (After Phase 7)

```bash
tsx scripts/quality-gate.ts validate-evidence codex {TARGET}
```

### Phase 8: adversarial-security-review

**Model:** Sonnet (orchestrates) + Gemini (reviews with security focus) | **Gate marker:** `VERIFIED_CLEAN`

**What it does:**
1. Reads runtime constraints
2. Reads lessons (categories: LOGIC, DESIGN)
3. Reviews code from an attacker's perspective
4. Fixes all security findings — NO "out of scope" dispositions allowed
5. Produces 1 evidence checklist

**Evidence Checklist 8a: Attack Surface Inventory**
- Canon: `owasp/SUMMARY.md` checks #1-#5
- Machine counts all entry points (CLI commands, HTTP handlers, file I/O with external paths)
- Lists every entry point: what an attacker can send, what stops them
- Validation: row count = entry point count

**Critical rule:** Every security finding must be fixed or escalated with a concrete fix proposal. "Out of scope", "architectural gap by design", and "deferred" are NOT valid dispositions. Missing auth on state-changing endpoints is always a CRITICAL finding.

### Evidence Validation Gate (After Phase 8)

```bash
tsx scripts/quality-gate.ts validate-evidence adversarial {TARGET}
```

### Vote Reconciliation (Pattern: Vote)

After all evidence gates pass (phases 4, 6, 7, 8), the three-model vote reconciliation runs:

```bash
tsx scripts/quality-gate.ts reconcile-votes {TARGET}
```

Three models (Claude/Sonnet for Phase 4, Gemini for Phase 6, Codex for Phase 7) reviewed independently. When they disagree on a finding:

1. The command writes a report to `.claude/evidence/vote-disagreements.md`
2. Exits non-zero if disagreements exist
3. A reconciliation subagent (Sonnet) re-evaluates each flagged item:
   - Reads the source code at each disputed location
   - Re-evaluates whether a fix is warranted
   - If warranted, applies the fix
   - Runs tests to verify
4. Gate marker: `RECONCILIATION_COMPLETE`

This prevents false positives from a single model from driving unnecessary changes.

### Phase 9: ai-smell-fix

**Model:** Haiku | **Gate marker:** `AI_SMELL_COMPLETE`

**What it does:**
1. Pattern-matches for AI-generated antipatterns:
   - Single-use helper functions
   - Comment spam (obvious comments, section dividers)
   - Defensive paranoia (unnecessary null checks, redundant validation)
   - Speculative features (unused parameters, premature abstraction)
2. Removes them under complexity budget
3. Writes lessons to `.claude/lessons.md` and `.claude/universal-lessons.md` (category: AI_SMELL)

Haiku is sufficient because AI smell removal is pattern-matching, not deep reasoning.

---

## 10. Gate 7.5: Qodana + Quality Gate

**Model:** None (Qodana) / Haiku (fixer, only if needed) | **Cost:** Zero unless issues found

Runs between Phase 7 and Phase 8 (after the Codex review, before security review).

### Procedure

1. **Qodana scan:**
   ```bash
   qodana scan --linter qodana-js --project-dir {PROJECT_ROOT} --print-problems
   ```
   If `qodana` CLI not installed, skip with a note.

2. **If issues found:** Spawn a Haiku subagent to fix them:
   ```
   Fix each issue in the listed files. Do not restructure code — fix in place.
   ```

3. **If clean:** No subagent needed.

4. **Quality gate re-verify:**
   ```bash
   tsx scripts/quality-gate.ts {TARGET}
   ```

---

## 11. Gate 7.7: Smoke Test

**Model:** None | **Cost:** Zero

Identical to Gate 3.7 but runs after review phases 4-7. Purpose: catch review phases that break runtime behavior (e.g., changing `EnsureCreated()` to `Migrate()` without generating migrations, changing static file paths without updating middleware).

If gate fails, identify which review phase introduced the breaking change (diff against Gate 3.7 state) and pass the error to that phase for correction.

---

## 12. Gate 9.5: Test + Quality Gate

**Model:** None | **Cost:** Zero

```bash
npm test && tsx scripts/quality-gate.ts {TARGET}
```

Runs after Phase 9 (ai-smell-fix), before the Verify stage. Ensures that all the review phase changes haven't broken tests or introduced proxy check violations.

---

## 13. Verify Stage (Phases 10-11)

### Phase 10: write-tests-run

**Model:** Sonnet | **Gate marker:** `TEST_COMPLETE`

**What it does:**
1. Writes tests for implemented code (tests follow code, not TDD)
2. Uses test-doubles and test-strategy skills
3. Runs tests and fixes failures
4. Achieves coverage for the target

**Critical rule:** Never accept >10% test failures. If tests fail because test setup is wrong (e.g., InMemory provider doesn't support transactions), fix the test setup — don't skip the failures.

### Phase 11: final-eval-check

**Model:** Sonnet (orchestrates) + Codex + Gemini | **Gate marker:** `EVAL_COMPLETE`

**What it does:**
1. **Clean-Slate Rule:** Does NOT read any prior phase artifacts before reviewing. No `.claude/evidence/`, no `.claude/create-plans/`, no build/improve logs. Evaluates source code with fresh eyes.
2. Runs Codex production readiness review
3. Runs Gemini per-file code review via `mcp__gemini-reviewer__gemini_review`
4. Fixes ALL findings — not summarized, not documented, not deferred
5. Reads lessons.md files ONLY during the deduplication step AFTER findings are collected
6. Writes new lessons and proposals to both lessons files
7. Produces 1 evidence checklist

**Evidence Checklist 10a: Attack Surface Inventory**
- Canon: `owasp/SUMMARY.md` checks #1-#5
- Machine counts all entry points
- Claude lists every entry point, what an attacker can send, what stops them
- Validation: row count = entry point count

**Why clean-slate:** If Phase 11 reads evidence from Phase 6, it might assume those issues are already fixed and skip re-checking. The clean-slate rule ensures an unbiased final assessment.

---

## 14. Gate 11.5: Final Gate

**Model:** None | **Cost:** Zero

The final machine gate runs three checks:

### Check 1: Tests + Quality Gate

```bash
npm test && tsx scripts/quality-gate.ts {TARGET}
```

If non-zero, pass error to Phase 10 for correction (max 2 retries). After Phase 10 fixes and this gate passes, the pipeline is done — do NOT re-run Phase 11.

### Check 2: Smoke Test

Same procedure as Gate 3.7. Verifies the app still starts and endpoints respond after all 11 phases of modifications.

### Check 3: Quality Gate (final)

Final run of all 25+ proxy checks. Catches any regressions introduced by Phases 10-11.

---

## 15. Post-Pipeline: Deployment Readiness

After Gate 11.5 passes, a deployment readiness checklist runs via Bash (no subagent). Every item must pass or the orchestrator fixes it directly.

1. **`.gitignore` coverage:** Check for `bin/`, `obj/`, `*.db`, `.env`, `.DS_Store`
2. **No secrets in source tree:** Check for `*.db`, `.env`, `credentials.json`
3. **HTTPS redirection:** Check for `UseHttpsRedirection` in non-dev
4. **Fail-fast config:** Missing CORS/auth/connection strings must throw, not log-and-continue
5. **HSTS conditional on proxy:** Only set when app handles TLS directly

If items fail, fix them directly (mechanical fixes). Re-run Gate 11.5 smoke test to verify.

### Codex Fix Loop

After deployment readiness gate:

1. Run Codex production readiness eval
2. Parse findings
3. For each finding, spawn a Sonnet fix agent
4. Re-run tests
5. If findings remain unfixable, present to user with justification

---

## 16. Post-Pipeline: Cleanup

```bash
rm -rf {TARGET}/.claude/evidence/
rm -f {TARGET}/.claude/canary-manifest.json
rm -f {TARGET}/.claude/runtime-constraints.md
```

Evidence files are proof of work, not documentation. Once the build passes, they're not needed.

### Metrics + Log

```bash
tsx scripts/quality-gate.ts report-metrics {TARGET}
echo "build:complete:{TARGET}:$(date +%Y-%m-%dT%H:%M:%S)" >> .claude/build.log
```

### Final Report

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

---

## 17. Learn Loop: How Findings Become Prevention

The learn loop is the feedback mechanism that makes the pipeline improve over time. Findings from late stages feed back to early stages so the same defect class never recurs.

```
Design → Build → Refine → Review → Verify
  ↑                                    │
  └──────────── Learn ←────────────────┘
```

### Two-Tier Architecture

**Universal lessons** (`.claude/universal-lessons.md`):
- General patterns applicable to any project
- Seeded from `workflow-skills/lessons.md` during profile apply
- Grows with each pipeline run
- Example: "Never pair existsSync + readFileSync — use try-catch to avoid TOCTOU races."

**Project-specific lessons** (`.claude/lessons.md`):
- Instances with file paths, stays with the project
- Example: "src/trace/index.ts:42 — TOCTOU race in file reading."

### Who Writes (Capture)

Review phases write lessons after finding issues:

| Phase | Categories Written | Focus |
|-------|--------------------|-------|
| 6 (gemini-fix) | LOGIC, CODE_QUALITY, DESIGN, AI_SMELL | Code + product quality |
| 7 (codex-fix) | CODE_QUALITY, LOGIC | Independent model perspective |
| 8 (adversarial) | LOGIC, DESIGN | Security-focused |
| 9 (ai-smell-fix) | AI_SMELL, DESIGN | AI antipatterns |
| 11 (final-eval) | All categories | Clean-slate review |

### Who Reads (Prevention)

Construction phases read lessons before writing code:

| Phase | Categories Read |
|-------|----------------|
| 1 (plan) | LOGIC, DESIGN, CODE_QUALITY, DUPLICATION, AI_SMELL |
| 2 (structure) | DESIGN, LOGIC, AI_SMELL |
| 3 (implement) | All categories — **most impactful reader** |
| 4 (refactor) | All categories |
| 5 (dedupe) | All categories |

Phase 3 is the most impactful reader because it's where code gets written. A lesson read at Phase 3 directly prevents the defect from entering the codebase.

### The 5 Lesson Categories

| Category | What It Captures | Routed To |
|----------|-----------------|-----------|
| **LOGIC** | Bugs, races, injection, traversal | Phase 3 (implement) |
| **DESIGN** | Architecture mistakes, size limits, cleanup symmetry | Phases 1-2 (plan, structure) |
| **CODE_QUALITY** | Dead code, unused imports, naming, exception handling | Phase 4 (refactor) |
| **DUPLICATION** | Repeated constants, duplicate patterns | Phase 5 (dedupe) |
| **AI_SMELL** | Single-use helpers, comment spam, defensive paranoia, speculative features | Phase 3 (implement) |

### Promotion Flow

How a finding becomes a permanent rule:

1. Phase 6 catches "secrets interpolated into error messages" in `src/auth.ts:42`
2. Writes to `.claude/lessons.md`: `LOGIC: Secret in error message at src/auth.ts:42 → implement-plan should use opaque types`
3. Checks `.claude/universal-lessons.md` for existing general pattern
4. If new, writes general rule: "Never interpolate credentials into error messages or logs. Use opaque types with redacted toString()."
5. Next pipeline run: Phase 3 reads `.claude/universal-lessons.md`
6. Phase 3 applies it proactively — the defect never occurs

### Deduplication

Before appending to the universal file, the phase reads it and searches for the pattern. If a matching rule already exists, it skips the write. This prevents duplicate rules from accumulating.

### False Positive Tracking

Gemini-fix and codex-fix record patterns the reviewer consistently flags incorrectly:
- "Missing rate limiting" — not applicable to local CLI tools
- "`process.env` propagation as environment variable injection" — not applicable when user controls terminal

Future runs skip these patterns, reducing noise and wasted fix cycles.

---

## 18. Pattern Reference

Nine named patterns recur throughout the pipeline:

| Pattern | Meaning | Where Used |
|---------|---------|------------|
| **Gate** | Machine check between stages. Binary pass/fail, zero AI cost. | Gates 3.5, 3.7, 7.5, 7.7, 9.5, 11.5 |
| **Contract** | Abstract quality type assigned at Design, enforced at Build. 7 types: ValidatedInput, SafePath, CausedError, Secret, ExternalData, BoundedOperation, IdempotentAction. | Phases 1-3 |
| **Budget** | Complexity constraint — review phases can't add more than they remove. Net-zero or net-negative lines/functions/types. Security fixes exempt. | Phases 4-9 |
| **Canary** | Planted violation to test reviewer attention. 3-5 known bugs inserted from 5 categories before Phase 6. 100% detection required. | Phase 6 |
| **Evidence** | Structured checklist proving every item was examined. Machine validates completeness (row count vs item count), not correctness. | Phases 4, 6, 7, 8, 10 |
| **Vote** | Multi-model disagreement resolution. Three models review independently; disagreements trigger reconciliation agent. | After Phase 8 |
| **Loop** | Retry with specifics until complete or max attempts. Phase 3: 5 iterations. Phase 4: 3 iterations. Never silently drops items. | Phases 3, 4 |
| **Lesson** | Finding captured so the same defect class is prevented next run. Two-tier: universal (cross-project) + project-specific (with file paths). 5 categories. | Phases 6-9, 11 write; Phases 1-5 read |
| **Rubric** | Domain checklist auto-detected from project signals (HTTP server, CLI, data persistence, microservice). Always loads base + product-quality. | Phase 1 |

### Reliability Layers

| Layer | What Gets Checked | Who Checks | Reliability |
|-------|-------------------|------------|-------------|
| Machine gates | function length, secrets, shell injection, imports | Machine | 100% |
| Proxy checks | bad names, params, empty catches, magic values | Machine | 100% for what it catches, misses subtle cases |
| Evidence checklists | every function, error, input boundary reviewed | LLM judges, machine validates completeness | LLM judgment varies, but nothing gets skipped |
| Three-model vote | same checks, different perspectives | 3 LLMs | Reduces blind spots |
| Canary tests | known violations seeded before review | Machine validates detection | Catches lazy reviews |

Combined effect: ~10% fully machine-enforced → ~30% with proxies → remaining 70% has verified-complete LLM review with three-model cross-check.

---

## Cross-References

- [Quality Gate Spec](../quality-gate-spec.md) — proxy check and evidence checklist technical specification
- [Quality Building Flow](quality-building-flow.md) — architectural overview of quality mechanisms
- [How Skills Load](how-skills-load.md) — the 4-layer skill loading system
- [Use Quality Flags](../how-to/use-quality-flags.md) — user-facing flags for `/build` and `/improve`
- [Configure Ralph Loop](../how-to/configure-ralph-loop.md) — iteration limits, quality gates, post-loop validation
- [Two-Tier Review Architecture](two-tier-review.md) — self-review vs external validation design
- [Skill Enforcement Model](skill-enforcement-model.md) — how skills become hard gates
