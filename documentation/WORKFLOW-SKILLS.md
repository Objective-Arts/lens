---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Workflow Skills

> Interactive commands for improving code quality at each development phase.

These skills guide Claude through a structured development process. Each loads expert knowledge appropriate to the task.

---

## The Development Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   /plan ──► /structure-first ──► /implement ──► /refactor-check │
│                                                                 │
│                              │                                  │
│                              ▼                                  │
│                                                                 │
│   /test ◄── /static-analysis ◄── /independent-review            │
│                                                                 │
│                              │                                  │
│                              ▼                                  │
│                                                                 │
│            /security-review ──► /production-readiness           │
│                                                                 │
│                              │                                  │
│                              ▼                                  │
│                                                                 │
│                         /doc-code                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Workflow Skills

### `/plan [task]`

**Purpose:** Design approach before writing code.

**What it does:**
- Creates a plan file (`.claude/plans/{feature}.md`)
- Defines scope, files to create/modify, risks
- Requires user approval before implementation

**Expert lens:** clarity, simplicity, correctness, data-first

**Example:**
```
/plan user authentication system
```

---

### `/structure-first [feature]`

**Purpose:** Design data structures and types before implementation.

**What it does:**
- Creates TypeScript interfaces, Java DTOs, or language-appropriate types
- Defines API contracts between components
- Creates test factories for mock data

**Expert lens:** java, abstraction, typescript

**Example:**
```
/structure-first user-management
```

---

### `/implement [target]`

**Purpose:** Write code from the approved plan.

**What it does:**
- Loads expert skills for quality guidance
- Creates files/functions defined in the plan
- Enforces quality constraints (single responsibility, meaningful names, error handling)
- Runs dead code cleanup with language-specific tools (knip, vulture, Qodana)
- Verifies code compiles/lints

**Expert lens:** clarity, pragmatism, composition, design-patterns

**Example:**
```
/implement UserService
```

---

### `/refactor-check [path]`

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
/refactor-check src/app/features/client-admin
```

---

### `/test [level]`

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
/test unit
/test integration
/test e2e
/test all
```

---

## Validation Skills

### `/independent-review [path]`

**Purpose:** Hard-ass code review via Gemini.

**What it catches:**
- Bugs and edge cases
- Performance issues
- Readability problems
- Logic errors

**Style:** Senior Google engineer—no false praise, direct feedback.

**Example:**
```
/independent-review src/services/
```

---

### `/static-analysis [path]`

**Purpose:** Run Qodana and fix issues found.

**What it catches:**
- Code smells
- Potential bugs
- Style violations
- Security issues

**Process:** Runs scan, lists problems by severity, fixes automatically where possible.

**Example:**
```
/static-analysis src/
```

---

### `/security-review [path]`

**Purpose:** Adversarial security review via Gemini.

**What it catches:**
- Auth bypasses
- Injection flaws (SQL, XSS, command)
- Data exposure risks
- Missing input validation
- Insecure defaults

**Expert lens:** security-mindset, owasp

**Example:**
```
/security-review src/app/features/auth
```

---

### `/production-readiness [path]`

**Purpose:** Final check before deployment.

**Checklist:**
- [ ] Error handling complete (try/catch, logging, sanitized messages)
- [ ] Configuration externalized (no hardcoded secrets)
- [ ] Resilience (timeouts, retries, circuit breakers)
- [ ] Observability (logging, metrics, health checks)
- [ ] Dependencies locked (package-lock.json current)

**Example:**
```
/production-readiness src/
```

---

### `/doc-code [path]`

**Purpose:** Generate documentation using Diátaxis framework.

**Output types:**
- **Tutorials** — Learning-oriented walkthroughs
- **How-to guides** — Task-oriented instructions
- **Reference** — Information-oriented API docs
- **Explanation** — Understanding-oriented context

**Expert lens:** docs, brevity, prose, editing

**Example:**
```
/doc-code src/services/AuthService.ts
```

---

## Scan Skills (Read-Only)

### `/code-scan [path...]`

**Purpose:** Quality analysis without making changes.

**What it checks:**
- Structure (function length, file length, single responsibility)
- Clarity (naming, comments, patterns)
- Data design (domain fit, illegal states, immutability)
- Error handling (explicit paths, fail fast)
- Security (input validation, no secrets, parameterized queries)
- Framework idioms (based on detected project type)

**Expert lens:** software-base skills (clarity, simplicity, correctness, data-first, pragmatism, security-mindset, owasp) + domain profile skills

**Output:** Report only—no files edited.

**Example:**
```
/code-scan src/services/
/code-scan src/components/Header src/components/Footer
```

---

### `/gemini-scan [path...]`

**Purpose:** External code review via Gemini without fixes.

**What it catches:**
- Bugs and edge cases
- Logic errors
- Performance problems
- Poor naming and unclear code
- AI-generated antipatterns (over-abstraction, defensive checks for impossible cases, reimplementing stdlib)

**Style:** Senior Google engineer—direct feedback, no false praise.

**Output:** Report with severity levels—no files edited.

**Example:**
```
/gemini-scan src/features/auth
```

---

## Autonomous Mode

### `/ralph-loop [prd-file]`

**Purpose:** Autonomous implementation loop through all phases.

**Process:**
1. Parse PRD items
2. For each item: plan → structure → implement → refactor → review → test → document
3. After all items: security-review → production-readiness

**Flags:**
| Flag | Effect |
|------|--------|
| `--max N` | Override max iterations (default: 50) |
| `--resume` | Continue from last incomplete item |
| `--external` | Enable Gemini + Qodana validation |
| `--dry-run` | Show what would be done |

**Example:**
```
/ralph-loop requirements.md --external
```

---

## Quick Reference

| Skill | When to Use | Key Constraint |
|-------|-------------|----------------|
| `/plan` | Starting new feature | Must create plan file |
| `/structure-first` | Before implementation | Types before code |
| `/implement` | Writing code | Expert skills loaded automatically |
| `/refactor-check` | After implementation | Verify with metrics |
| `/test` | After code works | All levels eventually |
| `/code-scan` | Assess code quality | Read-only, no fixes |
| `/gemini-scan` | External quality check | Read-only, Gemini review |
| `/independent-review` | Before PR | External validation |
| `/static-analysis` | Before PR | Fix all critical/high |
| `/security-review` | Auth/data features | Think like attacker |
| `/production-readiness` | Before deploy | Checklist complete |
| `/doc-code` | After feature complete | Diátaxis framework |

---

## Typical Session

```bash
# 1. Plan the work
/plan add user password reset

# 2. Design types first
/structure-first

# 3. Implement from plan
/implement PasswordResetService
/implement PasswordResetController

# 4. Clean up
/refactor-check src/features/password-reset

# 5. Test at all levels
/test unit
/test integration
/test e2e

# 6. Validate
/independent-review src/features/password-reset
/static-analysis src/features/password-reset
/security-review src/features/password-reset

# 7. Final checks
/production-readiness src/features/password-reset

# 8. Document
/doc-code src/features/password-reset
```
