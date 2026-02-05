---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Workflow Skills

> Interactive commands for improving code quality at each development phase.

These skills guide Claude through a structured development process. Each loads expert knowledge appropriate to the task.

---

## Directory Structure

```
workflow-skills/
├── ralph-loop/     # Top-level orchestrator
├── workflow/       # Multi-step processes (scan → fix → verify)
└── utils/          # Single-purpose tools (read-only scans, reports)
```

---

## Entry Point

### `/lens`

**Purpose:** Lens home base — status, help, and guided choices.

**What it does:**
- Shows quick status (profile, skills, MCP servers, issues)
- Presents choices: check status, apply profile, view skills, quick start, fix issues
- Guides you to the right workflow

**Modifies Code:** No

**Example:**
```
/lens
```

---

## The Development Loop

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   /create-plan ──► /structure-first ──► /implement-plan ──► /refactor-check-fix │
│                                                                             │
│                                │                                            │
│                                ▼                                            │
│                                                                             │
│   /write-tests-run ◄── /qodana-fix ◄── /gemini-fix ◄── /dedupe-fix         │
│                                                                             │
│                                │                                            │
│                                ▼                                            │
│                                                                             │
│            /adversarial-security-review ──► /generate-docs                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Workflow Skills

### `/create-plan [task]`

**Purpose:** Design approach before writing code.

**What it does:**
- Creates a plan file (`.claude/plans/{feature}.md`)
- Defines scope, files to create/modify, risks
- Requires user approval before implementation

**Expert lens:** clarity, simplicity, correctness, data-first

**Example:**
```
/create-plan user authentication system
```

---

### `/structure-first [path]`

**Purpose:** Design data structures and architecture. Context-aware.

**Modes:**
- **Map mode** (existing code): Analyzes architecture, diagrams relationships, designs improvements
- **Create mode** (from plan): Creates TypeScript interfaces, defines API contracts

**Expert lens:** abstraction, typescript, data-first

**Example:**
```
/structure-first src/services/auth/    # Map existing code
/structure-first                        # Create from plan
```

---

### `/implement-plan [target]`

**Purpose:** Write code from the approved plan.

**What it does:**
- Loads expert skills for quality guidance
- Creates files/functions defined in the plan
- Enforces quality constraints (single responsibility, meaningful names, error handling)
- Verifies code compiles/lints

**Expert lens:** clarity, pragmatism, composition, design-patterns

**Example:**
```
/implement-plan UserService
```

---

### `/refactor-check-fix [path]`

**Purpose:** Systematically clean up and simplify code.

**What it checks:**
- Function length (< 30 lines)
- Single responsibility
- DRY violations
- Dead code
- Naming clarity

**Expert lens:** clarity, legacy, design-patterns

**Example:**
```
/refactor-check-fix src/app/features/client-admin
```

---

### `/ai-smell-fix [path]`

**Purpose:** Remove AI-generated code patterns. Make code look human-written.

**What it catches:**
- Over-abstraction (factories/wrappers used once)
- Defensive paranoia (null checks where null impossible)
- Comment spam (`// increment counter`)
- Speculative features (unused config options)
- Enterprise patterns in simple code
- Generic wrapper abuse (`Result<T>` when you just throw)
- Verbose naming (names > 25 chars)
- Excessive structure (single-method classes)

**Example:**
```
/ai-smell-fix src/services/
```

---

### `/dedupe-fix [path]`

**Purpose:** Find duplicated code and consolidate it.

**What it does:**
- Identifies duplicated code patterns
- Extracts shared functions/utilities
- Updates all call sites

**Example:**
```
/dedupe-fix src/services/
```

---

### `/gemini-fix [path]`

**Purpose:** Hard-ass code review via Gemini. ALL issues must be fixed.

**What it catches:**
- Bugs and edge cases
- Performance issues
- Readability problems
- Logic errors
- AI-generated antipatterns

**Style:** Senior Google engineer—no false praise, direct feedback. Fixes all issues found.

**Example:**
```
/gemini-fix src/services/
```

---

### `/qodana-fix [path]`

**Purpose:** Run Qodana static analysis and fix ALL issues found.

**What it catches:**
- Code smells
- Potential bugs
- Style violations
- Security issues

**Process:** Runs scan, lists problems by severity, fixes all critical/high issues.

**Example:**
```
/qodana-fix src/
```

---

### `/adversarial-security-review [path]`

**Purpose:** Adversarial security review via Gemini. ALL issues must be fixed.

**What it catches:**
- Auth bypasses
- Injection flaws (SQL, XSS, command)
- Data exposure risks
- Missing input validation
- Insecure defaults

**Expert lens:** security-mindset, owasp

**Example:**
```
/adversarial-security-review src/app/features/auth
```

---

### `/write-tests-run [level]`

**Purpose:** Write and run tests at specified level(s).

**Levels:**
| Level | Tests | Focus |
|-------|-------|-------|
| `unit` | `*.spec.ts` | Isolated functions with mocked dependencies |
| `integration` | `*.integration.spec.ts` | Component + service interactions |
| `e2e` | `*.e2e.spec.ts` | Full browser/API flows |
| `all` | All of the above | Complete test coverage |

**Expert lens:** react-test, test-doubles, test-strategy, legacy

**Example:**
```
/write-tests-run unit
/write-tests-run integration
/write-tests-run e2e
/write-tests-run all
```

---

### `/generate-docs [path]`

**Purpose:** Generate documentation using Diátaxis framework.

**Output types:**
- **Tutorials** — Learning-oriented walkthroughs
- **How-to guides** — Task-oriented instructions
- **Reference** — Information-oriented API docs
- **Explanation** — Understanding-oriented context

**Expert lens:** docs, brevity, prose, editing

**Example:**
```
/generate-docs src/services/AuthService.ts
```

---

## Read-Only Scan Skills

### `/gemini-scan [path...]`

**Purpose:** External code review via Gemini without fixes.

**What it catches:**
- Bugs and edge cases
- Logic errors
- Performance problems
- Poor naming and unclear code
- AI-generated antipatterns

**Style:** Senior Google engineer—direct feedback, no false praise.

**Output:** Report with severity levels—no files edited.

**Example:**
```
/gemini-scan src/features/auth
```

---

### `/qodana-scan [path]`

**Purpose:** Run Qodana static analysis without making changes.

**Output:** Report with severity levels—no files edited.

**Example:**
```
/qodana-scan src/
```

---

### `/dedupe-scan [path]`

**Purpose:** Find duplicated code patterns across the codebase.

**Output:** Report only—no files edited.

**Example:**
```
/dedupe-scan src/services/
```

---

### `/refactor-scan [path]`

**Purpose:** Find refactoring opportunities without making changes.

**Output:** Report only—no files edited.

**Example:**
```
/refactor-scan src/services/
```

---

### `/ai-smell-scan [path]`

**Purpose:** Detect AI-generated code smells without making changes.

**What it finds:**
- Over-abstraction
- Defensive paranoia
- Comment spam
- Speculative features
- Enterprise patterns in simple code
- Generic wrapper abuse
- Verbose naming
- Excessive structure

**Output:** Report only—no files edited.

**Example:**
```
/ai-smell-scan src/services/
```

---

### `/naming-review [path]`

**Purpose:** Review names for clarity using Kernighan principles.

**What it checks:**
- Vague names (processData, handle, doStuff)
- Jargon and insider terms
- Inconsistent patterns (get vs fetch, create vs new)
- Wrong parts of speech
- Unnecessary abbreviations

**Output:** Report with suggestions—no files edited.

**Example:**
```
/naming-review src/app/
```

---

## Targeted Quality Skills

### `/phase-loop [path] [--rollback] [--dry-run]`

**Purpose:** Run 9-phase quality pipeline on any class, component, or directory.

**Flags:**
| Flag | Purpose |
|------|---------|
| `--dry-run` | Show what would change without modifying |
| `--rollback` | Restore from last phase-loop stash |

**The 9 Phases:**
| # | Skill | Purpose |
|---|-------|---------|
| 1 | create-plan | Analyze target, identify issues |
| 2 | structure-first | Map architecture, design improvements |
| 3 | implement-plan | Apply fixes and improvements |
| 4 | refactor-check-fix | Clean up, apply patterns |
| 5 | dedupe-fix | Consolidate duplicated code |
| 6 | gemini-fix | Gemini review, fix ALL issues |
| 7 | qodana-fix | Static analysis, fix ALL issues |
| 8 | adversarial-security-review | Security audit, fix vulnerabilities |
| 9 | write-tests-run | Write/update tests, all must pass |

**Skipped:** generate-docs (run separately if needed)

**Rollback:** Creates git stash before changes. Use `--rollback` to restore.

**Modifies Code:** Yes

**Example:**
```
/phase-loop src/components/Button.tsx
/phase-loop src/services/auth/
/phase-loop --rollback
```

---

### `/final-polish [path]`

**Purpose:** Final refinement pass that prepares code for senior review.

**Prerequisite:** Requires `/phase-loop` to have been run first on the target.

**What it checks:**
- AI antipatterns (over-abstraction, defensive paranoia, comment spam)
- Naming clarity — every name earns its place
- Remaining complexity that can be reduced
- Style and pattern consistency

**The Senior Review Question:** For every function, class, and file: "Would a senior engineer mass-delete this in review?" If yes → fix it now.

**Modifies Code:** Yes

**Example:**
```
/final-polish src/components/Button.tsx
```

---

## Utility Skills

### `/session-status`

**Purpose:** Show what Claude Code primitives are active in this session.

**Shows:**
- Active skills and their sources
- Auto-invoke rules from CLAUDE.md
- Available commands
- MCP servers
- Any issues detected

**Example:**
```
/session-status
```

---

### `/skill-usage-report`

**Purpose:** Generate a D3 visualization of skill invocations.

**What it creates:**
- `.claude/canon-masters.json` — Structured data
- `.claude/skill-usage-report.html` — Interactive D3 visualization

**Example:**
```
/skill-usage-report
```

---

### `/explain-skill [skill-name]`

**Purpose:** Explain what a skill does, when to use it, and its triggers.

**Example:**
```
/explain-skill gemini-fix
```

---

## Autonomous Mode

### `/ralph-loop [prd-file]`

**Purpose:** Autonomous implementation loop through all phases.

**Process:**
1. Parse PRD items
2. For each item: create-plan → structure-first → implement-plan → refactor-check-fix → dedupe-fix → gemini-fix → qodana-fix → write-tests-run → generate-docs
3. After all items: adversarial-security-review
4. Generate skill-usage-report

**Flags:**
| Flag | Effect |
|------|--------|
| `--max N` | Override max iterations (default: 50) |
| `--resume` | Continue from last incomplete item |
| `--external` | Enable Gemini + Qodana post-loop |
| `--dry-run` | Show what would be done |

**Example:**
```
/ralph-loop requirements.md
```

---

## Quick Reference

| Skill | When to Use | Modifies Code |
|-------|-------------|---------------|
| `/lens` | Start here — status and choices | No |
| `/create-plan` | Starting new feature | No |
| `/structure-first` | Before implementation | Yes |
| `/implement-plan` | Writing code | Yes |
| `/refactor-check-fix` | After implementation | Yes |
| `/ai-smell-fix` | Remove AI patterns | Yes |
| `/dedupe-fix` | Consolidate duplicates | Yes |
| `/gemini-fix` | Before PR | Yes |
| `/qodana-fix` | Before PR | Yes |
| `/adversarial-security-review` | Auth/data features | Yes |
| `/write-tests-run` | After code works | Yes |
| `/generate-docs` | After feature complete | Yes |
| `/phase-loop` | Improve single file/component | Yes |
| `/final-polish` | After phase-loop, before PR | Yes |
| `/gemini-scan` | Quick quality check | No |
| `/qodana-scan` | Quick static analysis | No |
| `/dedupe-scan` | Find duplicates | No |
| `/refactor-scan` | Find refactoring opportunities | No |
| `/ai-smell-scan` | Detect AI patterns | No |
| `/naming-review` | Check naming clarity | No |
| `/session-status` | Debug session | No |
| `/skill-usage-report` | Track skill usage | No |
| `/explain-skill` | Understand a skill | No |
| `/ralph-loop` | Full PRD implementation | Yes |

---

## Typical Session

```bash
# 1. Plan the work
/create-plan add user password reset

# 2. Design types first
/structure-first

# 3. Implement from plan
/implement-plan PasswordResetService
/implement-plan PasswordResetController

# 4. Clean up
/refactor-check-fix src/features/password-reset
/ai-smell-fix src/features/password-reset

# 5. External validation
/gemini-fix src/features/password-reset
/qodana-fix src/features/password-reset

# 6. Security check
/adversarial-security-review src/features/password-reset

# 7. Test at all levels
/write-tests-run unit
/write-tests-run integration
/write-tests-run e2e

# 8. Document
/generate-docs src/features/password-reset
```

---

## Scan vs Fix Skills

| Scan Skill | Fix Skill | Difference |
|------------|-----------|------------|
| `/gemini-scan` | `/gemini-fix` | Scan reports, fix modifies code |
| `/qodana-scan` | `/qodana-fix` | Scan reports, fix modifies code |
| `/dedupe-scan` | `/dedupe-fix` | Scan reports, fix consolidates |
| `/refactor-scan` | `/refactor-check-fix` | Scan reports, fix modifies code |
| `/ai-smell-scan` | `/ai-smell-fix` | Scan reports, fix removes patterns |
| `/naming-review` | (manual) | Reports only, user decides |

Use scan skills to assess code quality without changes. Use fix skills when you want issues automatically resolved.
