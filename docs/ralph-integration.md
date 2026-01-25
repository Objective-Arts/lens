# Claude-Optimal as Inner Loop in Ralph

This document describes how Claude-Optimal integrates with Ralph-style autonomous iteration loops.

## Quick Start

```bash
# Apply your tech profile + ralph-integration
cc-config profile apply javascript+react+ralph-integration -p .

# Or for other stacks:
cc-config profile apply java+ralph-integration -p .
cc-config profile apply python+ralph-integration -p .

# Run the autonomous loop
/ralph-loop PRD.md
```

**Key insight**: `ralph-integration` is a meta-profile that composes with any tech profile. It adds iteration discipline and quality gates while the tech profile provides domain expertise (Bloch for Java, Simpson for JS, etc.).

## The Conceptual Integration

**Ralph Loop** (Outer): Autonomous iteration that re-feeds prompts until PRD is complete
**Claude-Optimal** (Inner): Quality methodology that shapes how each iteration executes

```
┌─────────────────────────────────────────────────────────────┐
│                     RALPH LOOP (Outer)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  while PRD_incomplete && iteration < max:               │ │
│  │    ┌─────────────────────────────────────────────────┐  │ │
│  │    │         CLAUDE-OPTIMAL (Inner)                  │  │ │
│  │    │                                                 │  │ │
│  │    │  Canon lens (Kernighan, Bloch, Simpson...)      │  │ │
│  │    │  Standards enforcement (30-line, SRP...)        │  │ │
│  │    │  Auto-invoke (auth→/schneier, React→/abramov)   │  │ │
│  │    │  Quality gates (--test, --review-hard)          │  │ │
│  │    │                                                 │  │ │
│  │    │  → Pick task from PRD                           │  │ │
│  │    │  → Implement with expert perspective            │  │ │
│  │    │  → Run tests, pass gates                        │  │ │
│  │    │  → Commit                                       │  │ │
│  │    └─────────────────────────────────────────────────┘  │ │
│  │    iteration++                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│  Exit: All PRD items complete + quality gates pass           │
└─────────────────────────────────────────────────────────────┘
```

## Complementary Strengths

| Ralph Provides | Claude-Optimal Provides |
|----------------|------------------------|
| Autonomous iteration | Quality standards |
| Context persistence (git) | Expert perspective persistence (CLAUDE.md) |
| "Keep going until done" | "Do it right each time" |
| PRD-driven task selection | Canon-driven implementation |
| Iteration cap (safety) | Quality gates (correctness) |

## Natural Synergies

### Context Accumulation
- **Ralph**: Previous commits visible → Claude sees what was built
- **Claude-Optimal**: Canon standards persist → Expert lens stays consistent

### Self-Correction
- **Ralph**: Iteration allows fixing mistakes
- **Claude-Optimal**: --review-hard flags issues to fix
- **Combined**: Review finds problems → next iteration fixes them

### Quality Evolution
```
Iteration 1: Implement feature (with canon lens)
Iteration 2: Tests find edge case → fix
Iteration 3: Review-hard finds pattern violation → refactor
Iteration 4: All gates pass → commit as done
```

## Getting Started

### 1. Apply Profiles (Tech + Ralph)

The `ralph-integration` profile composes with any tech profile using `+` syntax:

```bash
# JavaScript/TypeScript project
cc-config profile apply javascript+ralph-integration -p .

# React project (includes JS canon)
cc-config profile apply react+ralph-integration -p .

# Java project
cc-config profile apply java+ralph-integration -p .

# Python project
cc-config profile apply python+ralph-integration -p .

# Full stack (Node + React)
cc-config profile apply fullstack+ralph-integration -p .
```

This gives you:
- **Tech profile**: Language canon (Simpson, Bloch, etc.) + language standards + auto-invoke rules
- **Ralph profile**: Iteration discipline + quality gates + `/ralph-loop` skill

### What Gets Merged

When you apply `javascript+ralph-integration`, the profiles combine:

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMBINED PROFILE                               │
├─────────────────────────────────────────────────────────────────┤
│  FROM javascript:                                                │
│    Canon: kyle-simpson, cherny, crockford                       │
│    Standards: const/let, async/await, strict mode...            │
│    Auto-invoke: closures→/simpson, types→/cherny                │
├─────────────────────────────────────────────────────────────────┤
│  FROM software-base (via extends):                              │
│    Canon: kernighan, thompson, pike, dijkstra...                │
│    Security: schneier, owasp                                    │
│    Testing: dodds, feathers, meszaros                           │
├─────────────────────────────────────────────────────────────────┤
│  FROM ralph-integration:                                        │
│    Standards: check git log, pick PRD item, quality gates...    │
│    Anti-patterns: skip tests, perfectionism loops...            │
│    Agents: code-reviewer, test-engineer, security-auditor       │
│    Config: max_iterations, quality_gates, exit_criteria         │
└─────────────────────────────────────────────────────────────────┘
```

The result: **Full language expertise + iteration discipline + quality enforcement**.

### 2. Create a PRD

Create a PRD file with checkbox items:

```markdown
# PRD: My Feature

## Requirements

- [ ] User authentication with JWT
- [ ] Session management
- [ ] Password reset flow
- [ ] OAuth integration

## Acceptance Criteria

- All endpoints secured
- Tests for happy and error paths
- No critical security issues
```

### 3. Run the Loop

```bash
# In Claude Code
/ralph-loop PRD.md
```

Or with options:

```bash
/ralph-loop PRD.md --max 30    # Limit to 30 iterations
/ralph-loop PRD.md --resume    # Continue from last session
```

## Configuration

### Profile Settings

The `ralph-integration.yaml` profile provides defaults:

```yaml
ralph:
  max_iterations: 50
  max_iterations_per_item: 5
  exit_on_idle_commits: 3

  quality_gates:
    tests_required: true
    test_level: unit
    review_required: true
    review_threshold: no_critical
```

### Quality Thresholds

| Threshold | Meaning |
|-----------|---------|
| `no_critical` | No critical security/correctness issues |
| `no_high` | No critical or high severity issues |
| `clean` | No issues at any severity |

For autonomous loops, `no_critical` is recommended to prevent perfectionism.

### Exit Criteria

The loop exits when ALL conditions are met:

```yaml
exit_criteria:
  prd_items_complete: 100%
  tests_passing: 100%
  review_issues_critical: 0
```

## Preventing Perfectionism Loops

Built-in safeguards:

1. **Iteration cap per item** (default: 5)
   - If an item can't pass gates in 5 iterations, move on
   - Log the issue for manual review

2. **Review threshold** (`no_critical` not `clean`)
   - Minor style issues don't block progress
   - Focus on correctness and security

3. **Idle detection** (3 iterations no commits)
   - If nothing changes, assume stuck
   - Exit with status report

4. **Progress tracking**
   - If review score improving, continue
   - If flat, ship what you have

## PRD Item Quality Gates

Quality gates apply at the PRD item level, not every commit:

```
while PRD has incomplete items:
    item = next_incomplete_item(PRD)

    # Inner loop: implement with quality
    while not item_complete:
        implement(item)          # Canon lens active
        commit()                 # WIP commits allowed

        if feature_functionally_complete:
            run_tests(item)
            if tests_fail: continue

            review_hard(item)
            if critical_issues: continue

            mark_complete(item)  # Quality gate passed
```

This avoids:
- Perfectionism at every commit (too slow)
- Quality debt accumulation (final sweep finds too much)

And enables:
- WIP commits during development (context preservation)
- Quality enforcement at meaningful boundaries
- Iterative fix cycles within an item

## Workflow Integration

### Recommended Flow

```
/plan → /structure-first → /ralph-loop → (final review)
                               ↓
                    ┌──────────┴──────────┐
                    │  Per PRD item:      │
                    │  implement → test   │
                    │       ↓             │
                    │  review-hard        │
                    │       ↓             │
                    │  commit complete    │
                    └─────────────────────┘
```

### With External Tools

```bash
# Pre-loop: Plan the work
/plan feature-x

# Run loop with quality gates
/ralph-loop PRD.md

# Post-loop: Final sweep (optional)
/review-hard --full    # Include Gemini + Qodana
```

## Gemini and Qodana Integration

External reviewers (Gemini AI, Qodana static analysis) run **after** the loop, not inside it. This prevents nested fix cycles.

### The Problem with Inner-Loop External Review

```
Ralph iteration N:
  └── /review-hard --full
        └── Gemini finds issue A
        └── Fix A
        └── Did fix A introduce issue B?
        └── Need another review...
        └── Infinite loop risk
```

### The Solution: Two-Tier Review

```
┌─────────────────────────────────────────────────────────────┐
│                     RALPH LOOP                               │
│                                                              │
│  Per PRD item:                                               │
│      implement → test → /review-hard (self) → commit         │
│                                                              │
│  Self-review catches:                                        │
│      - Long functions, mixed concerns                        │
│      - Pattern violations, security basics                   │
│      - CLAUDE.md standard violations                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              POST-LOOP VALIDATION (once)                     │
│                                                              │
│  /review-hard --full                                         │
│      └── Gemini: Second opinion, edge cases                  │
│      └── Qodana: Static analysis, deep checks                │
│                                                              │
│  Output: Report with findings                                │
│  Action: Human decides to fix or ship                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Why This Works

| In Loop (Self-Review) | Post-Loop (External) |
|-----------------------|---------------------|
| Fast (no API calls) | Slower (external tools) |
| Catches 80% of issues | Catches edge cases |
| Immediate fix cycle | Human decision point |
| No nested loops | Single pass |

### Configuration

```yaml
ralph:
  quality_gates:
    review_mode: self           # self-review only in loop

  post_loop_validation:
    enabled: true
    gemini: true
    qodana: true
    action: report              # report | fail
    findings_file: .claude/ext-validation-findings.md
    promote_threshold: 3        # Suggest promotion after N occurrences
```

### Tiered Learning

Findings accumulate in `.claude/ext-validation-findings.md`, not CLAUDE.md directly:

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 1: Profile Standards (profiles/csharp.yaml)           │
│  Universal, curated - "avoid async void"                    │
│  → Promote here if pattern applies to all projects          │
└─────────────────────────────────────────────────────────────┘
                           ▲ promote if universal
┌─────────────────────────────────────────────────────────────┐
│  TIER 2: CLAUDE.md                                          │
│  Project-specific, small - "use repository pattern"         │
│  → Promote here if pattern recurs 3+ times                  │
└─────────────────────────────────────────────────────────────┘
                           ▲ promote if repeated
┌─────────────────────────────────────────────────────────────┐
│  TIER 3: .claude/ext-validation-findings.md                 │
│  Raw Gemini/Qodana findings, timestamped                    │
│  → Review periodically, prune noise                         │
└─────────────────────────────────────────────────────────────┘
```

This keeps CLAUDE.md lean while capturing institutional knowledge.

## Token Efficiency

Canon skills add overhead. For long-running loops:

1. **Use focused profiles** - Don't load all experts
2. **Auto-invoke only** - Load experts when relevant (auth→schneier)
3. **Budget tokens** - `cc-config tokens` to monitor usage

## Troubleshooting

### Loop exits early

Check exit reason in final report:
- `max_iterations`: Increase limit or simplify PRD
- `idle_detected`: Items may be blocked (missing deps, unclear requirements)
- `quality_gate_failed`: Check test/review output

### Perfectionism loop

If stuck on one item:
- Lower `review_threshold` to `no_critical`
- Reduce `max_iterations_per_item`
- Check if requirements are too vague

### Context drift

If implementation loses coherence:
- Ensure PRD is clear and complete
- Check that canon profile is loaded
- Review git log for trajectory

## Example: Full Session

```
> /ralph-loop PRD.md

## Starting Ralph Loop

PRD: PRD.md
Items: 4 incomplete
Max iterations: 50

---

## Iteration 1

Item: User authentication
Implementing with Kernighan clarity, Schneier security...

✓ Created src/auth/service.ts
✓ Created src/auth/middleware.ts
Commit: Add auth service structure

Tests: 2 passed
Review: 1 critical (SQL injection risk)

Status: Fixing critical issue...

---

## Iteration 2

Item: User authentication (fix)
Applying OWASP patterns...

✓ Fixed parameterized query
Commit: Fix SQL injection in auth

Tests: 3 passed
Review: Clean

Status: COMPLETE

---

## Iteration 3

Item: Session management
...

---

## Ralph Loop Complete

Iterations: 12
Exit: all_complete

PRD Status:
- [x] User authentication
- [x] Session management
- [x] Password reset flow
- [x] OAuth integration

Quality: All gates passed
Files: 15 created, 3 modified
Commits: 8
```

## References

- [Workflow Skills README](../workflow-skills/README.md)
- [Profile Configuration](../profiles/ralph-integration.yaml)
- [Review-Hard Skill](../workflow-skills/review-hard/SKILL.md)
- [Test Skill](../workflow-skills/test/SKILL.md)
