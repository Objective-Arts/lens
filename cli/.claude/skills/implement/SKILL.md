---
name: implement
description: Enforced workflow with instrumentation. Session log proves the framework was actually executed.
---

# /implement [feature-name]

Execute the full canon workflow with mandatory checkpoints and instrumentation. **The session log proves you actually ran the framework** instead of claiming you did. If the log is incomplete, the D3 report exposes the gaps.

## When to Use

- Implementing a feature that requires disciplined execution
- When you need an auditable trail of decisions and quality checks
- Training sessions to internalize the workflow
- When quality evidence is required (not just "trust me, it works")

## When NOT to Use

- Quick fixes or typos
- Exploration or research tasks
- When you're explicitly told to skip quality gates

## Arguments

| Argument | Description |
|----------|-------------|
| `feature-name` | Name of the feature (used for session log and artifacts) |
| `--prd PATH` | Path to PRD file (default: `PRD.md` or `.claude/prd.md`) |
| `--resume` | Resume from last checkpoint |

## Core Principle

```
The session log proves you actually ran the framework.
If you skip steps, the D3 report exposes the gaps.
No more "I reviewed it" without evidence.
```

## Mandatory Sequence (Cannot Skip)

| Step | Skill | Canon Experts | What Gets Logged |
|------|-------|---------------|------------------|
| 1 | `/plan` | Kernighan (clarity), Pike (interfaces), Linus (data structures) | Decisions made, questions asked |
| 2 | `/structure-first` | Cherny (types), Dijkstra (invariants) | Interfaces defined, contracts |
| 3 | `/test` (write tests) | Dodds, Meszaros, Feathers | Test levels chosen, count by category |
| 3.5 | E2E Tests (web only) | Playwright | E2E test count, actual browser execution results |
| 4 | TDD Red | - | All tests fail (count) - MUST RUN TESTS |
| 5 | `/build-from-plan` | Domain experts per code type | Implementation decisions |
| 6 | TDD Green | - | Tests pass (count), iterations - MUST RUN TESTS |
| 7 | `/review-hard` (self) | Self-review | Issues by severity/flag |
| 8 | Gemini Review | External model | Issues found, different perspective |
| 9 | Static Analysis | ESLint (JS) or Qodana | Issues found, deterministic |
| 10 | Fix & Iterate | All applicable | Fixes applied, re-validation |
| 11 | Final Validation | - | All tests pass, no critical issues |
| 12 | `/sc:document` | Documentation | API docs, inline docs generated |

## Web Project Requirements

For projects with HTML/CSS/JS or frontend frameworks:

1. **Step 3.5 is MANDATORY** - Use Playwright to run actual browser tests
2. **Test execution proof required** - Session log must include actual pass/fail counts from test runner output
3. **E2E tests must cover** - Page load, user interactions, visual regressions (if applicable)

```bash
# Example: Running browser tests with Playwright
npx playwright test --reporter=json > test-results.json
```

## Canon Expert Proof Requirements

**Text claims are NOT sufficient.** Each canon expert contribution MUST include:

1. **Code reference** - File:line where the principle was applied
2. **Before/after** - What would have been done WITHOUT the expert's guidance vs WITH
3. **Verifiable artifact** - The code or config that proves application

### Example: Provable Canon Contribution

```json
{
  "name": "Pike",
  "contribution": "Minimal interface",
  "proof": {
    "file": "app.js:18-22",
    "code": "function formatTime(seconds) { ... }",
    "without": "Would have added locale, timezone, format options",
    "with": "Single pure function, one argument, one return"
  }
}
```

### BAD (Unprovable)
```json
{ "name": "Kernighan", "contribution": "Verified requirement clarity" }
```

### GOOD (Provable)
```json
{
  "name": "Kernighan",
  "contribution": "Verified requirement clarity",
  "proof": {
    "file": "PRD.md:15-20",
    "before": "Timer should work well",
    "after": "Timer displays MM:SS, counts down from 25:00, plays 880Hz chime at zero"
  }
}

## Session Log

A `session-log.json` file is created in `.claude/` and updated at each checkpoint.

### Initialization

When `/implement feature-name` is invoked:

```json
{
  "meta": {
    "feature": "feature-name",
    "started": "2024-01-15T10:30:00Z",
    "canon_version": "1.0.0",
    "status": "in_progress"
  },
  "checkpoints": [],
  "testing": {
    "levels": {},
    "progression": []
  },
  "reviews": {},
  "issues": []
}
```

### Checkpoint Recording

At each step, append to `checkpoints`:

```json
{
  "step": 1,
  "skill": "/plan",
  "canon_experts": [
    {
      "name": "Kernighan",
      "contribution": "Verified requirement specificity",
      "proof": {
        "file": "PRD.md:8-12",
        "before": "Timer should display time remaining",
        "after": "Timer displays MM:SS format, updates every 1000ms"
      }
    },
    {
      "name": "Pike",
      "contribution": "Minimal interface design",
      "proof": {
        "file": "app.js:18-22",
        "code": "function formatTime(seconds) { const mins = Math.floor(seconds / 60); ... }",
        "without": "Would have parameters for locale, timezone, 12/24hr format",
        "with": "Single argument, single purpose, 4 lines"
      }
    }
  ],
  "decisions": ["Pure function", "No external dependencies"],
  "artifacts": [".claude/plans/feature-name.md"],
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### Testing Progression

Record test counts at each phase. **Counts must come from actual test execution, not estimates.**

```json
"testing": {
  "levels": {
    "unit": { "count": 35, "status": "passed" },
    "integration": { "count": 8, "status": "passed" },
    "e2e": { "count": 5, "status": "passed", "runner": "playwright" },
    "edge_case": { "count": 7, "status": "passed" }
  },
  "progression": [
    { "phase": "red", "passed": 0, "failed": 55, "runner_output": "55 tests failed" },
    { "phase": "green-1", "passed": 48, "failed": 7, "runner_output": "48 passed, 7 failed" },
    { "phase": "final", "passed": 55, "failed": 0, "runner_output": "55 passed" }
  ],
  "e2e_results": {
    "runner": "playwright",
    "executed": true,
    "report_path": "test-results.json",
    "summary": "5 tests passed in 3 browsers (chromium, firefox, webkit)"
  }
}
```

### Review Recording

Record each reviewer's findings:

```json
"reviews": {
  "self": {
    "issues": ["Long function at line 45", "Missing error handling"],
    "counts": { "p0": 0, "p1": 2, "p2": 1 }
  },
  "gemini": {
    "issues": ["Edge case not handled: empty input"],
    "model": "gemini-pro",
    "focus": "bugs"
  },
  "qodana": {
    "issues": ["Possible null dereference at api.ts:23"],
    "linter": "qodana-js",
    "counts": { "critical": 0, "high": 1, "moderate": 3 }
  }
}
```

### Issue Tracking

Track issues through resolution:

```json
"issues": [
  {
    "id": "ISSUE-001",
    "found_by": "self-review",
    "severity": "P1",
    "flags": ["SECURITY"],
    "title": "Missing input validation",
    "status": "fixed",
    "fixed_in_step": 10
  }
]
```

## Process

### Step 1: Initialize

```markdown
## /implement [feature-name]

Initializing session log...

**Feature**: [feature-name]
**Session ID**: [uuid]
**Log file**: .claude/session-log.json

Starting mandatory workflow sequence.
```

### Step 2-11: Execute Each Step

For each step:
1. Invoke the skill (e.g., `/plan`)
2. Capture canon expert contributions
3. Record decisions and artifacts
4. Update session log
5. Report progress

```markdown
## Step N: [skill-name]

**Canon Experts Consulted**:
- Kernighan: "Is this the clearest way to express this?"
- Pike: "What's the minimum interface needed?"

**Decisions Made**:
1. [decision 1]
2. [decision 2]

**Artifacts Created**:
- [file path]

✓ Checkpoint recorded
```

### Step 12: Generate Report

After final validation, generate the D3 report:

```markdown
## Implementation Complete

**Feature**: [feature-name]
**Duration**: [time]
**Checkpoints**: 11/11 complete

### Summary
- Tests: 43 total (35 unit, 5 contract, 3 edge)
- Reviews: 3 (self, Gemini, Qodana)
- Issues found: 5 (all resolved)

### Session Log
Review `.claude/session-log.json` for the full implementation audit.
```

## Enforcement Mechanism

The skill writes to session-log.json at each checkpoint. The D3 report visualizes this data.

**If you skip a step:**
- The checkpoint is missing from the log
- The D3 report shows a gap (red/empty section)
- The deliverable is visibly incomplete

**If you fake the data:**
- Timestamps won't be sequential
- Artifact files won't exist
- Test counts won't match actual test files
- Git commits won't corroborate claimed work

## Session Log Contents

The `.claude/session-log.json` tracks:

1. **Pipeline Flow** - Steps completed with timestamps
2. **Canon Experts** - Who was consulted, what they contributed
3. **Test Pyramid** - Levels executed, counts, pass/fail
4. **Issues Found** - By reviewer (self/Gemini/Qodana), by severity, by flag
5. **Fix Iterations** - Timeline of issues found → fixed → verified
6. **Final Status** - Pass/fail with evidence

## Workflow Position

```
/implement orchestrates:
  └── /plan
  └── /structure-first
  └── /test (write)
  └── TDD Red
  └── /build-from-plan
  └── TDD Green
  └── /review-hard
  └── Gemini Review
  └── Qodana Scan
  └── Fix Loop
  └── Final Validation
  └── D3 Report
```

## Example Session

```
> /implement password-validator

## /implement password-validator

Initializing session log...

**Feature**: password-validator
**Started**: 2024-01-15T10:30:00Z
**Log file**: .claude/session-log.json

---

## Step 1: /plan

**Canon Experts Consulted**:
- Kernighan: "Is the requirement clearly stated? What exactly makes a password valid?"
- Pike: "What's the interface? fn validate(password: string) -> ValidationResult?"
- Linus: "What's the data structure? Just a boolean, or detailed error messages?"

**Decisions Made**:
1. Pure function with no side effects
2. Returns array of specific validation failures, not just boolean
3. Configurable rules via options object

**Artifacts Created**:
- .claude/plans/password-validator.md

✓ Checkpoint 1/11 recorded

---

## Step 2: /structure-first

**Canon Experts Consulted**:
- Cherny: "Define the types first: PasswordRule, ValidationResult, ValidatorOptions"
- Dijkstra: "What invariants must hold? Non-empty password string, rules list non-empty"

**Decisions Made**:
1. Interface: ValidatorOptions with rules array
2. Type: ValidationResult = { valid: boolean, failures: string[] }

**Artifacts Created**:
- src/types/password-validator.ts

✓ Checkpoint 2/11 recorded

---

[... continues through all 11 steps ...]

---

## Implementation Complete

**Feature**: password-validator
**Duration**: 45 minutes
**Checkpoints**: 11/11 complete

### Summary
- Tests: 43 total (35 unit, 5 contract, 3 edge)
- Reviews: 3 (self, Gemini, Qodana)
- Issues found: 5 (all resolved)

### Session Log
Review .claude/session-log.json for audit trail
```

## MCP Requirements

This skill uses the following MCP tools:
- `gemini_review` - For external code review
- `qodana_scan` / `qodana_problems` - For static analysis

## Resume Capability

If the session is interrupted, use `--resume`:

```
> /implement password-validator --resume

Resuming from checkpoint 6 (TDD Green)...
```

The session log tracks completion state, allowing seamless resume.
