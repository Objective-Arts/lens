---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Workflow Skills

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

**Purpose:** Lens home base. Shows quick status (profile, skills, MCP servers, issues), presents guided choices (check status, apply profile, view skills, quick start, fix issues), and guides you to the right workflow.

**Modifies Code:** No

**Example:**
```
/lens
```

---

## The Development Loop

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│ /create-plan → /structure-first → /implement-plan → [machine-gate]       │
│                                                                          │
│ → /refactor-check-fix → /dedupe-fix → /gemini-fix → /codex-fix         │
│                                                                          │
│ → [machine-gate] → /adversarial-security-review → /ai-smell-fix         │
│                                                                          │
│ → /final-eval-check → [machine-gate] → /write-tests-run → [machine-gate] │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## The Base Brain

All core workflow skills load the **Base Brain** — 10 foundational skills via SUMMARY.md:

| # | Skill | Focus |
|---|-------|-------|
| 1 | clarity | No cleverness, obvious code |
| 2 | pragmatism | Get it working first |
| 3 | simplicity | Small interfaces, delete code |
| 4 | composition | Unix philosophy, pipelines |
| 5 | distributed | Failure handling |
| 6 | data-first | Data structures before algorithms |
| 7 | correctness | Formal discipline |
| 8 | algorithms | Algorithmic rigor |
| 9 | abstraction | Substitution principle |
| 10 | optimization | Measure before optimizing |

**Context cost:** ~4,200 tokens (~2% of context window)

See [How Skills Get Loaded](explanation/how-skills-load.md) for details.

---

## Core Workflow Skills

### `/create-plan [task]`

**Purpose:** Design approach before writing code. Creates a plan file (`.claude/plans/{feature}.md`), defines scope, files to create/modify, risks, and requires user approval before implementation.

**Expert lens:** Base Brain (all 10) + abstraction

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

**Expert lens:** Base Brain (all 10)

**Example:**
```
/structure-first src/services/auth/    # Map existing code
/structure-first                        # Create from plan
```

---

### `/implement-plan [target]`

**Purpose:** Write code from the approved plan. Loads expert skills for quality guidance, creates files/functions defined in the plan, enforces quality constraints (single responsibility, meaningful names, error handling), and verifies code compiles/lints.

**Expert lens:** Base Brain (all 10)

**Example:**
```
/implement-plan UserService
```

---

### `/refactor-check-fix [path]`

**Purpose:** Systematically clean up and simplify code.

**Checks:**
- Function length (< 30 lines)
- Single responsibility
- DRY violations
- Dead code
- Naming clarity

**Expert lens:** Base Brain (all 10) + design-patterns, refactoring

**Example:**
```
/refactor-check-fix src/app/features/client-admin
```

---

### `/ai-smell-fix [path]`

**Purpose:** Remove AI-generated code patterns. Make code look human-written.

**Catches:**
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

**Purpose:** Find duplicated code and consolidate it. Identifies duplicated code patterns, extracts shared functions/utilities, and updates all call sites.

**Example:**
```
/dedupe-fix src/services/
```

---

### `/gemini-fix [path]`

**Purpose:** Hard-ass code review via Gemini. ALL issues must be fixed.

**Catches:**
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

**Catches:**
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

**Catches:**
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

**Output:**
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

**Catches:**
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

**Purpose:** Detect AI-generated code smells without making changes. Calculates AI Smell Index.

**Finds:**
- Over-abstraction (weight: 3)
- Defensive paranoia (weight: 3)
- Speculative features (weight: 3)
- Enterprise patterns (weight: 3)
- Generic wrapper abuse (weight: 2)
- Excessive structure (weight: 2)
- Comment spam (weight: 1)
- Verbose naming (weight: 1)

**Output:** Report with AI_SMELL_INDEX score:
- 0-5: Clean (human-like)
- 6-15: Minor
- 16-30: Moderate
- 31-50: Heavy
- 51+: Severe

**Example:**
```
/ai-smell-scan src/services/
```

See [AI Smell Index Reference](reference/ai-smell-index.md) for full scoring details.

---

### `/naming-review [path]`

**Purpose:** Review names for clarity using clarity principles.

**Checks:**
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

## Heavy Workflows (10 Phases)

### `/build [path|description] [--rollback] [--dry-run]`

**Purpose:** Build a new feature from scratch with full 11-phase quality pipeline.

**When to use:**
- New feature from PRD
- New component, service, or module
- Greenfield code

**Flags:**
| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the 11 phases without executing |
| `--rollback` | Restore from last build stash |

**The 10 Phases:**
| # | Skill | Purpose |
|---|-------|---------|
| 1 | create-plan | Design feature scope and files |
| 2 | structure-first | Define data structures and interfaces |
| 3 | implement-plan | Write the code |
| 4 | refactor-check-fix | Clean up, apply patterns |
| 5 | dedupe-fix | Consolidate duplicated code |
| 6 | gemini-fix | Gemini review + product quality, fix ALL issues |
| 7 | codex-fix | Independent Codex review + targeted fixes |
| 8 | adversarial-security-review | Security audit, fix vulnerabilities |
| 9 | ai-smell-fix | Remove AI-generated antipatterns |
| 10 | final-eval-check | Score→fix→rescore loop (external evaluation) |
| 11 | write-tests-run | Write and run tests (final inspection — ALWAYS LAST) |

Machine gates at 3.5 (build+test+construction), 7.5 (Qodana scan), 10.5 (post-eval), 11.5 (final tests).

**Rollback:** Creates git stash before changes. Use `--rollback` to restore.

**Modifies Code:** Yes

**Example:**
```
/build user authentication system
/build src/components/DatePicker
/build --rollback
```

---

### `/improve [path] [--rollback] [--dry-run]`

**Purpose:** Improve existing code with full 11-phase quality pipeline.

**When to use:**
- Refactoring a module
- Quality pass on a component
- Technical debt cleanup
- Pre-commit quality check

**Flags:**
| Flag | Purpose |
|------|---------|
| `--dry-run` | Show the 11 phases without executing |
| `--rollback` | Restore from last improve stash |

**The 11 Phases:** Same as `/build`, but focused on existing code analysis and improvement. Phase 7 (codex-fix) provides independent Codex review, Phase 10 (final-eval-check) runs a score→fix→rescore loop, then Phase 11 (write-tests-run) runs as the final inspection.

**Rollback:** Creates git stash before changes. Use `--rollback` to restore.

**Modifies Code:** Yes

**Example:**
```
/improve src/components/Button.tsx
/improve src/services/auth/
/improve --rollback
```

---

## Light Workflows (No Phases)

### `/quick-edit [description]`

**Purpose:** Simple changes done right. Add field, rename, small fix.

**When to use:**
- Add a field to a model/DTO
- Rename something
- Add a parameter
- Small bug fix
- Add a button/link

**If the change touches 5+ files or has design decisions → use `/build` or `/improve` instead.**

**Process:** Checklist-driven execution without planning phases.

**Modifies Code:** Yes

**Example:**
```
/quick-edit add email field to User model
/quick-edit rename processData to parseUserInput
```

---

### `/quick-clean [path]`

**Purpose:** Fast cleanup for AI smells and common problems.

**When to use:**
- After `/quick-edit` or any code change
- Before commit
- Quick sanity check

**Fixes:**
- Over-abstraction, defensive paranoia, comment spam
- Vague names, magic numbers, dead code
- Generic naming smells

**If you need thorough analysis → use `/improve` instead.**

**Modifies Code:** Yes

**Example:**
```
/quick-clean src/services/
/quick-clean
```

---

## Other Quality Skills

---

### `/final-polish [path]`

**Purpose:** Final refinement pass that prepares code for senior review.

**Prerequisite:** Requires `/build` or `/improve` to have been run first on the target.

**Checks:**
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

**Purpose:** Show what Claude Code primitives are active in this session (active skills and their sources, auto-invoke rules from CLAUDE.md, available commands, MCP servers, any issues detected).

**Example:**
```
/session-status
```

---

### `/skill-usage-report`

**Purpose:** Generate a D3 visualization of skill invocations. Creates `.claude/canon-masters.json` (structured data) and `.claude/skill-usage-report.html` (interactive D3 visualization).

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

**Steps:**
1. Parse PRD items
2. For each item: plan → build → refactor → test → review → doc
3. Each phase loads relevant canon skills from profile's `ralph.skills` mapping
4. Post-loop validation: Gemini review + Qodana scan (with `--external` flag)
5. Generate skill-usage-report

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
| `/build` | New feature from scratch (11 phases) | Yes |
| `/improve` | Refine existing code (11 phases) | Yes |
| `/quick-edit` | Add field, rename, small fix | Yes |
| `/quick-clean` | Fast AI smell cleanup | Yes |
| `/codex-fix` | Fast pattern scan + targeted fixes | Yes |
| `/create-plan` | Starting new feature | No |
| `/structure-first` | Before implementation | Yes |
| `/implement-plan` | Writing code | Yes |
| `/refactor-check-fix` | After implementation | Yes |
| `/ai-smell-fix` | Remove AI patterns | Yes |
| `/dedupe-fix` | Consolidate duplicates | Yes |
| `/gemini-fix` | Before PR | Yes |
| `/qodana-fix` | Before PR | Yes |
| `/adversarial-security-review` | Auth/data features | Yes |
| `/final-eval-check` | After code works | Yes |
| `/write-tests-run` | After code works | Yes |
| `/generate-docs` | After feature complete | Yes |
| `/final-polish` | After build/improve, before PR | Yes |
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

# 5. Consolidate duplication
/dedupe-fix src/features/password-reset

# 6. External validation
/gemini-fix src/features/password-reset

# 7. Independent Codex review
/codex-fix src/features/password-reset

# 8. Security check + AI smell removal
/adversarial-security-review src/features/password-reset
/ai-smell-fix src/features/password-reset

# 9. External evaluation
/final-eval-check src/features/password-reset

# 10. Test at all levels (final inspection — ALWAYS LAST)
/write-tests-run unit
/write-tests-run integration
/write-tests-run e2e

# 11. Document
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
