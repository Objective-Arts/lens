---
name: ralph-loop
description: Execute PRD items with quality gates in an autonomous iteration loop. Inner loop for Ralph-style autonomous development.
---

# /ralph-loop [prd-file] [--max N] [--resume]

Autonomous iteration loop that implements PRD items with quality gates. Designed as the inner loop for Ralph-style autonomous development.

## When to Use

- Autonomous PRD implementation with quality enforcement
- Long-running development sessions with context preservation
- When you want "keep going until done" with "do it right each time"

## When NOT to Use

- Simple single-task requests
- Exploration or research tasks
- When PRD is not defined

## ⚠️ MANDATORY: Loop Until ALL Items Complete

```
┌─────────────────────────────────────────────────────────────────┐
│                    RALPH LOOP STATE MACHINE                      │
│                                                                  │
│  START → [Check PRD] → incomplete items exist?                   │
│                              │                                   │
│                    ┌────YES──┴──NO────┐                          │
│                    ▼                  ▼                          │
│              [Work on item]      [DONE - generate                │
│                    │              canon-report]                  │
│                    ▼                                             │
│              [Item complete]                                     │
│                    │                                             │
│                    ▼                                             │
│         ┌──── MORE ITEMS? ────┐                                  │
│         │                     │                                  │
│        YES                   NO                                  │
│         │                     │                                  │
│         ▼                     ▼                                  │
│    [IMMEDIATELY           [DONE - generate                       │
│     START NEXT             canon-report]                         │
│     ITEM - NO                                                    │
│     PAUSE]                                                       │
│         │                                                        │
│         └──────────────→ [Work on item] ←────────────────────────│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🚨 STOPPING RULES (the ONLY valid exit conditions):

1. **ALL PRD items marked `[x]`** → Generate canon-report → Exit
2. **Max iterations (50) reached** → Report status → Exit
3. **Idle detection (3 iterations, 0 commits)** → Report status → Exit

### ❌ INVALID STOPS (bugs if these happen):

- Stopping after item 1 when items 2-N exist
- Stopping after item 2 when items 3-N exist
- Stopping after ANY item when more incomplete items remain
- Asking "should I continue?" at any point
- Waiting for user input between items

### ✅ MANDATORY ACTION after completing each item:

```
if more_incomplete_items_exist():
    # THIS IS NOT OPTIONAL - YOU MUST DO THIS
    print("Item N complete. Starting item N+1...")
    immediately_begin_next_item()  # NO PAUSE, NO ASK
else:
    run_canon_report()
    print_final_summary()
```

### Example Correct Behavior:

```
Item 1: User authentication
  → implement → test → review → COMPLETE
  → "Item 1 complete. 3 items remain. Starting Item 2..."

Item 2: Session management
  → implement → test → review → COMPLETE
  → "Item 2 complete. 2 items remain. Starting Item 3..."

Item 3: Password hashing
  → implement → test → review → COMPLETE
  → "Item 3 complete. 1 item remains. Starting Item 4..."

Item 4: OAuth integration
  → implement → test → review → COMPLETE
  → "All 4 items complete. Generating canon-report..."
  → [runs /canon-report]
  → "Ralph Loop Complete ✓"
```

**NEVER output "complete" or stop until the last item is done.**

## Arguments

| Argument | Description |
|----------|-------------|
| `prd-file` | Path to PRD markdown file (default: `PRD.md` or `.claude/prd.md`) |
| `--max N` | Override max iterations (default: 50) |
| `--resume` | Continue from last incomplete item |
| `--dry-run` | Show what would be done without executing |

## Iteration Flow

```
while PRD has incomplete items AND iteration < max:
    item = next_incomplete_item(PRD)

    while not item_complete AND item_iterations < max_per_item:
        # INNER LOOP: Implement with quality

        1. Read item requirements from PRD
        2. Check git log for related previous work

        3. ⚠️ MANDATORY: Detect and invoke domain masters:

           # Frontend Detection (MUST check these patterns)
           if file matches *.tsx, *.jsx, *.vue, *.svelte:
               OUTPUT: "🎨 Frontend detected → Invoking /frost, /ive, /norman"
               INVOKE /frost   # Atomic Design structure
               INVOKE /ive     # Visual design principles
               INVOKE /norman  # Affordances, feedback

           if file matches *.css, *.scss, *.styled.*:
               OUTPUT: "🎨 CSS detected → Invoking /rams"
               INVOKE /rams    # Simplicity, 10 principles

           if PRD item mentions "form", "input", "validation":
               OUTPUT: "📝 Form detected → Invoking /wroblewski, /norman"
               INVOKE /wroblewski  # Forms expert
               INVOKE /norman      # Affordances

           if PRD item mentions "animation", "transition", "motion":
               OUTPUT: "✨ Animation detected → Invoking /duarte"
               INVOKE /duarte  # Meaningful motion

           if PRD item mentions "mobile", "responsive", "touch":
               OUTPUT: "📱 Mobile detected → Invoking /wroblewski, /buxton"
               INVOKE /wroblewski  # Mobile-first
               INVOKE /buxton      # Input fundamentals

           # Code Quality Detection
           if file matches *.tsx, *.jsx (React):
               OUTPUT: "⚛️ React detected → Invoking /abramov"
               INVOKE /abramov  # React mental models

           if file matches *.ts (TypeScript):
               OUTPUT: "📘 TypeScript detected → Invoking /cherny"
               INVOKE /cherny   # Type design

           # These skills provide the LENS for implementation
           # Read the skill, apply its principles, then implement

        4. Implement (with canon lens active)
        5. ADD DOCUMENTATION (JSDoc, XML comments, etc.)
        6. Commit (WIP commits allowed)

        if feature_functionally_complete:
            7. Run tests
            if tests_fail:
                log("Tests failed, fixing...")
                continue

            8. Verify documentation exists for public APIs
            if docs_missing:
                log("Missing docs, adding...")
                continue

            9. Run /review-hard
            if critical_issues:
                log("Review issues found, fixing...")
                continue

            10. If new feature, run /doc-code for external docs
            11. Mark item complete in PRD
            12. Commit completion marker

    iteration++

    # ⚠️ MANDATORY CONTINUATION CHECK (execute this EVERY time)
    remaining = count_incomplete_items(PRD)
    if remaining > 0:
        print(f"Item complete. {remaining} items remain. STARTING NEXT ITEM NOW...")
        # DO NOT EXIT - loop continues automatically to next iteration
        # The while loop condition handles this - just let it continue
    else:
        # ONLY exit when remaining == 0
        break

# Post-loop: ALL items complete (or max iterations)
Run /canon-report (generates D3 visualization)
Report final status
```

**⚠️ The `while` loop MUST continue until `PRD has incomplete items` is FALSE.**

## PRD Format

PRD files should use checkbox format for item tracking:

```markdown
# PRD: Feature Name

## Requirements

- [ ] Item 1: User authentication
- [ ] Item 2: Session management
- [x] Item 3: Password hashing (COMPLETE)
- [ ] Item 4: OAuth integration

## Acceptance Criteria

[Details...]
```

## Quality Gates

Each PRD item must pass ALL gates before marked complete:

| Gate | Check | Threshold |
|------|-------|-----------|
| Tests | `npm test` or equivalent | 100% pass |
| Review | `/review-hard` (self-review only) | No critical issues |
| Security | Auto-invoked for auth/data code | No vulnerabilities |

**Important**: Inside the loop, use self-review only (no `--full`). Gemini and Qodana run as post-loop validation to prevent nested fix cycles.

## Two-Tier Review Architecture

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

**Why this separation?**
- Gemini/Qodana findings may require judgment calls
- Fixes could introduce new issues (nested loops)
- External tools are slower (save for final pass)
- Human review point before merge

**Findings accumulate in** `.claude/ext-validation-findings.md` — review periodically and promote recurring patterns to CLAUDE.md.

## Context Preservation

Between iterations, context is preserved via:
- **Git history**: Previous commits show completed work
- **PRD checkboxes**: Track completion state
- **CLAUDE.md**: Canon standards persist
- **Skills directory**: Expert perspectives available

## Perfectionism Prevention

Built-in safeguards against infinite loops:

1. **Iteration cap per item**: Default 5 attempts per PRD item
2. **Review threshold**: "no_critical" not "perfect"
3. **Idle detection**: 3 iterations with no commits = exit
4. **Progress tracking**: If review score improving, continue; if flat, ship

## Output

Each iteration reports:

```markdown
## Iteration N Status

**Current Item**: [PRD item being worked on]
**Status**: implementing | testing | reviewing | complete

### Progress
- Commits this iteration: N
- Tests: pass/fail
- Review: clean/issues

### Next Action
[What happens next]
```

## Final Report

When loop exits, output depends on whether there's more work:

### If MORE PRD items remain (NOT done yet):

```markdown
## Ralph Loop Iteration Complete

**Item Completed**: [Name of completed item]
**PRD Progress**: 3/7 items complete

### CONTINUE SIGNAL
🔄 **ACTION REQUIRED**: More PRD items remain. DO NOT EXIT.
Continue to next incomplete item.

### Next Item
- [ ] Item 4: [Next incomplete item from PRD]
```

**CRITICAL**: Do NOT report "loop complete" or generate final reports until ALL items are done.

### If ALL PRD items complete (truly done):

```markdown
## Ralph Loop Complete ✓

**Iterations**: N
**Exit Reason**: all_complete

### PRD Status
- [x] Item 1: User authentication
- [x] Item 2: Session management
- [x] Item 3: Password hashing
- [x] Item 4: OAuth integration

### Quality Summary
- Tests: 100% passing
- Review: No critical issues
- Security: Audited

### Canon Report
Generated: .claude/canon-report.html
Open with: `open .claude/canon-report.html`

### Files Changed
- src/auth/* (new)
- src/middleware/session.ts (modified)
- tests/auth/* (new)

### Commits
- abc1234: Add user authentication
- def5678: Add session management
- ghi9012: Fix review issues in auth
```

## Configuration

### Profile Composition

Apply `ralph-integration` with your tech profile for full canon + quality gates:

```bash
# JavaScript/React
cc-config profile apply react+ralph-integration -p .

# Java
cc-config profile apply java+ralph-integration -p .

# Python
cc-config profile apply python+ralph-integration -p .
```

This gives you:
- Tech canon (Simpson, Bloch, etc.) from tech profile
- Quality gates + iteration discipline from ralph-integration
- All standards merged into CLAUDE.md

### Override Defaults

Customize in `.claude/settings.json` or project profile:

```yaml
ralph:
  max_iterations: 50
  max_iterations_per_item: 5
  quality_gates:
    tests_required: true
    review_threshold: no_critical
```

## Integration with Ralph (Outer Loop)

This skill is designed to be called by Ralph's autonomous iteration engine:

```
Ralph (outer): Re-feeds prompt until PRD complete
  └── /ralph-loop (inner): Quality-gated implementation per iteration
```

Ralph provides:
- Iteration engine (keeps going)
- Context persistence (git)
- PRD-driven task selection

Claude-Optimal provides:
- Quality standards
- Expert perspective (canon)
- Quality gates (tests, review)

## Example Session

```
> /ralph-loop PRD.md

## Starting Ralph Loop

**PRD**: PRD.md
**Items**: 4 incomplete, 0 complete
**Max iterations**: 50

---

## Iteration 1

**Item**: User authentication
**Action**: Implementing...

[Implementation happens with canon lens]

Commit: abc1234 - Add basic auth structure

**Tests**: Running...
**Tests**: 3 passed, 0 failed

**/review-hard**: Running...
**/review-hard**: 1 high issue (missing input validation)

**Status**: Fixing review issues...

---

## Iteration 2

**Item**: User authentication (continued)
**Action**: Fixing input validation...

[Fix implemented]

Commit: def5678 - Add input validation to auth

**Tests**: 4 passed, 0 failed
**/review-hard**: Clean

**Status**: COMPLETE - marking in PRD

---

## Iteration 3

**Item**: Session management
...
```

## Workflow Position

```
/plan -> /structure-first -> /ralph-loop -> /review-hard (final)
                                  |
                                  v
                        (internal: implement -> test -> review)
```

`/ralph-loop` incorporates testing and review internally, running them as quality gates for each PRD item.
