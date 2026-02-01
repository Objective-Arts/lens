---
name: ralph-loop
description: Execute PRD items with quality gates in an autonomous iteration loop. Inner loop for Ralph-style autonomous development.
---

# /ralph-loop [prd-file] [--max N] [--resume]

Autonomous iteration loop that implements PRD items with **bash-enforced quality gates**. Designed as the inner loop for Ralph-style autonomous development.

## When to Use

- Autonomous PRD implementation with quality enforcement
- Long-running development sessions with context preservation
- When you want "keep going until done" with "do it right each time"

## When NOT to Use

- Simple single-task requests
- Exploration or research tasks
- When PRD is not defined

## Architecture: Multi-Phase with Bash Enforcement

The `ralph` bash script orchestrates quality gates that Claude cannot skip:

```
┌─────────────────────────────────────────────────────────────┐
│                    BASH ORCHESTRATOR                         │
│                                                              │
│  Phase 1: IMPLEMENT                                          │
│    → Claude implements ONE item, writes tests                │
│    → Bash verifies: PHASE1_COMPLETE marker exists            │
│                                                              │
│  Phase 2: QODANA (bash runs directly - NOT Claude)           │
│    → Bash runs: qodana scan                                  │
│    → Bash checks results for critical/high issues            │
│    → If issues: Claude fixes, qodana re-runs                 │
│                                                              │
│  Phase 3: GEMINI REVIEW                                      │
│    → Claude runs mcp__gemini-reviewer__gemini_review         │
│    → Bash verifies: PHASE3_COMPLETE marker exists            │
│                                                              │
│  Phase 4: MARK COMPLETE (bash does this - NOT Claude)        │
│    → Only after ALL phases pass                              │
│    → Bash updates PRD checkbox                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| Bash runs qodana | Claude can't skip it - bash enforces |
| Bash marks PRD complete | Only happens after all phases pass |
| Short focused prompts | ~50 lines vs 300+ - Claude follows them |
| Separate Claude invocations | Fresh context per phase |
| Marker verification | Bash greps for PHASE1_COMPLETE, etc. |

### Trade-offs

| Pros | Cons |
|------|------|
| Quality gates enforced | More Claude invocations (higher cost) |
| Short prompts followed | Slower overall (sequential phases) |
| Qodana runs reliably | More complex bash script |
| Fresh context per phase | |

### 🚨 STOPPING RULES (the ONLY valid exit conditions):

1. **ALL PRD items marked `[x]`** → Generate canon-report → Exit
2. **Max iterations (50) reached** → Report status → Exit
3. **Idle detection (3 iterations, 0 commits)** → Report status → Exit
4. **Checkpoint trigger** (3 items, 10 iterations, or re-read) → Run /save-progress → Exit for session handoff

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

## Visual Output Format

Each workflow step has a **three-part output structure** with clear boundaries:

```
═══════════════════════════════════════════════════════════════
## IMPLEMENT: [Item Name]
═══════════════════════════════════════════════════════════════

┌─ CANON ─────────────────────────────────────────────────────┐
│ 📐 Clarity   🔧 Simplicity   🛡️ Security   📝 Types         │
└─────────────────────────────────────────────────────────────┘

┌─ SKILLS LOADED ─────────────────────────────────────────────┐
│ /owasp /cherny /frost                                       │
└─────────────────────────────────────────────────────────────┘

┌─ APPLICATION ───────────────────────────────────────────────┐
│ 📐K Renamed handleAuth → authenticateUser (Kernighan)       │
│ 🛡️S Added input sanitization (OWASP)                        │
│ 📝Ty Defined AuthResult type (Cherny)                       │
│ 🎨U Button → Card → Form structure (Frost)                  │
└─────────────────────────────────────────────────────────────┘

Summary: 📐K×2 🔧P×1 🛡️S×3 📝Ty×1 🎨U×1
═══════════════════════════════════════════════════════════════
```

### Output Order (DO NOT REPEAT)

1. **CANON** - Show which core principles apply (emoji + name)
2. **SKILLS LOADED** - List skills being invoked (once only)
3. **APPLICATION** - Show how each principle was applied with tag
4. **Summary** - Compact count of tags used

### Tag Reference

| Emoji | Code | Domain |
|-------|------|--------|
| 📐 | K | Kernighan (clarity) |
| 🔧 | P | Pike (simplicity) |
| 🧩 | M | McIlroy (composability) |
| 📊 | L | Linus (data structures) |
| ✓ | D | Dijkstra (correctness) |
| 🎯 | T | Thompson (pragmatism) |
| ⚡ | C | Carmack (performance) |
| 🛡️ | S | Security (OWASP, Schneier) |
| 🧪 | Te | Testing (Dodds, Meszaros) |
| 📝 | Ty | Types (Cherny, Hejlsberg) |
| 🏛️ | A | Architecture (Taleb, Petroski) |
| 🎨 | U | UI/UX (Frost, Ive, Norman) |

### Rules

1. **Skills appear ONCE** in "SKILLS LOADED" section only
2. **Application tags** show skill name in parentheses
3. **No duplication** - don't list skills twice
4. **Log to session** - Append to `session-log.json`

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

        3. OUTPUT step header with visual boundary:
           ═══════════════════════════════════════════════════
           ## IMPLEMENT: [Item Name]
           ═══════════════════════════════════════════════════

        4. OUTPUT CANON section (which principles apply):
           ┌─ CANON ──────────────────────────────────────────┐
           │ 📐 Clarity   🛡️ Security   📝 Types              │
           └──────────────────────────────────────────────────┘

        5. Detect domain, OUTPUT SKILLS LOADED (once only):
           ┌─ SKILLS LOADED ──────────────────────────────────┐
           │ /owasp /cherny /frost                            │
           └──────────────────────────────────────────────────┘

        6. Implement with canon lens, OUTPUT APPLICATION:
           ┌─ APPLICATION ────────────────────────────────────┐
           │ 📐K Renamed handleClick → submitPaymentForm      │
           │ 🛡️S Added CSRF token validation (OWASP)          │
           │ 📝Ty Strict return type: Promise<User | null>    │
           └──────────────────────────────────────────────────┘

        7. ADD DOCUMENTATION:
           - JS/TS: JSDoc with @param, @returns, @example
           - C#: XML comments with <summary>, <param>, <example>
           - Python: Google-style docstrings
           - Java: Javadoc
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
    items_completed_this_session++

    # ⚠️ CONTEXT CHECK (execute EVERY iteration - HARD TRIGGERS)
    checkpoint_needed = (
        items_completed_this_session >= 3 OR      # Every 3 items
        iteration >= 10 OR                         # Every 10 iterations
        any_file_read_twice_this_session()        # Sign of forgetting
    )

    if checkpoint_needed:
        print("⚠️ Checkpoint trigger reached. Saving progress...")
        commit_current_work()                      # Even if WIP
        run_save_progress()                        # Externalize state to disk
        commit_progress_file()
        print("Session saved to .claude/sessions/progress-{timestamp}.md")
        print("Run `/ralph-loop --resume` in new session to continue.")
        exit_for_handoff()                         # Clean exit, NOT a failure

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
| E2E Tests | `npm run test:e2e` (web projects) | 100% pass |
| Docs | README.md exists for new modules | Required |
| Inline Docs | JSDoc/XML comments on public APIs | Present |
| Review | `/review-hard` (self-review only) | No critical issues |
| Security | Auto-invoked for auth/data code | No vulnerabilities |

**E2E Requirement**: For web projects (React, Next.js, Vue, etc.), E2E tests using Playwright or Cypress are MANDATORY for user-facing features.

**Gate Enforcement**: Do NOT mark a PRD item complete until ALL gates pass. If a gate fails, fix and re-run.

**Important**: Inside the loop, use self-review only (no `--full`). Gemini and Qodana run as post-loop validation to prevent nested fix cycles.

## ⚠️ MANDATORY: Auto-Invoke Canon Masters

**These are NOT optional. You MUST invoke the relevant skills before implementing.**

When implementing PRD items, automatically invoke domain experts:

### Architecture/Engineering (system design, resilience, refactoring)

| Context | Masters to Invoke |
|---------|-------------------|
| System design, new architecture | `/taleb` (antifragility, via negativa) then `/petroski` |
| Major refactoring | `/petroski` (form follows failure) then `/taleb` |
| Building for resilience | `/taleb` (bounded downside, optionality) |
| Learning from past failures | `/petroski` (case study methodology) |

### UI/UX Work (components, layouts, forms, animations)

| Context | Masters to Invoke |
|---------|-------------------|
| Building UI components | `/frost` (Atomic Design) then `/ive` (visual polish) |
| Designing forms | `/wroblewski` (forms expert) then `/norman` (affordances) |
| Adding animations | `/duarte` (meaningful motion) |
| Mobile/responsive design | `/wroblewski` then `/buxton` (input fundamentals) |
| Design system work | `/curtis` (governance, tokens) |
| Typography decisions | `/kruzeniski` (type hierarchy) |
| Simplicity check | `/rams` (10 principles) |

### Code Quality

| Context | Masters to Invoke |
|---------|-------------------|
| React/JSX/TSX | `/abramov` |
| JavaScript patterns | `/crockford` or `/simpson` |
| TypeScript types | `/cherny` |
| Testing | `/dodds` (Testing Trophy) |
| Data visualization | `/bostock` |
| Performance | `/osmani` |

## Documentation Requirements

Each implementation MUST include appropriate documentation:

### JavaScript/TypeScript - JSDoc

```typescript
/**
 * Authenticates a user with email and password.
 *
 * @param credentials - User login credentials
 * @param credentials.email - User's email address
 * @param credentials.password - User's password
 * @returns Promise resolving to auth tokens
 * @throws {AuthError} If credentials are invalid
 *
 * @example
 * ```typescript
 * const tokens = await authenticate({
 *   email: 'user@example.com',
 *   password: 'secret123'
 * });
 * ```
 */
export async function authenticate(credentials: Credentials): Promise<Tokens>
```

### C# - XML Documentation Comments

```csharp
/// <summary>
/// Authenticates a user with email and password.
/// </summary>
/// <param name="credentials">User login credentials containing email and password.</param>
/// <returns>A task that resolves to authentication tokens.</returns>
/// <exception cref="AuthException">Thrown when credentials are invalid.</exception>
/// <example>
/// <code>
/// var tokens = await authService.AuthenticateAsync(new Credentials
/// {
///     Email = "user@example.com",
///     Password = "secret123"
/// });
/// </code>
/// </example>
public async Task<Tokens> AuthenticateAsync(Credentials credentials)
```

### Python - Docstrings (Google style)

```python
def authenticate(credentials: Credentials) -> Tokens:
    """Authenticates a user with email and password.

    Args:
        credentials: User login credentials with email and password.

    Returns:
        Authentication tokens for the session.

    Raises:
        AuthError: If credentials are invalid.

    Example:
        >>> tokens = authenticate(Credentials(
        ...     email="user@example.com",
        ...     password="secret123"
        ... ))
    """
```

### Java - Javadoc

```java
/**
 * Authenticates a user with email and password.
 *
 * @param credentials the user's login credentials
 * @return authentication tokens for the session
 * @throws AuthException if credentials are invalid
 *
 * <pre>{@code
 * Tokens tokens = authService.authenticate(
 *     new Credentials("user@example.com", "secret123")
 * );
 * }</pre>
 */
public Tokens authenticate(Credentials credentials) throws AuthException
```

### Documentation Gate

After implementing each PRD item:

1. **All public functions/methods** must have inline documentation
2. **For new features**, run `/doc-code` to generate:
   - How-to guide (if user-facing)
   - API reference updates
3. **Verify**: Examples in docs are runnable (copy-paste should work)

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

## Context Management

### Philosophy: Clear and Document (NOT Compact)

Ralph loops use **disk as memory**, not LLM context. This prevents "context rot" where quality degrades as context fills.

```
❌ WRONG: Let context fill → compact → degraded attention → errors
✅ RIGHT: Monitor context → checkpoint to disk → fresh session → consistent quality
```

### Why This Matters

| Approach | Behavior | Result |
|----------|----------|--------|
| Let Claude Compact | Context summarized, details lost | Quality degrades over time |
| Clear and Document | State externalized to files | Consistent quality for hours |

### State Externalization

Between iterations, state is preserved via **disk**, not context:

| State Type | Storage Location | How Retrieved |
|------------|------------------|---------------|
| Completed work | Git commits | `git log --oneline` |
| Progress tracking | PRD checkboxes | Read PRD file |
| Decisions made | `.claude/sessions/progress-*.md` | /save-progress output |
| Files explored | `.claude/sessions/progress-*.md` | /save-progress output |
| Standards | CLAUDE.md | Always loaded |
| Expert perspectives | Skills directory | Invoked as needed |

### Context Monitoring

**Checkpoint triggers (check EVERY iteration):**

```
MANDATORY CHECKPOINT after ANY of these:
1. Every 3 completed PRD items (hard rule)
2. Every 10 iterations regardless of completion
3. Any file read twice in same session (sign of forgetting)
4. User says "save progress" or "checkpoint"

DO NOT WAIT for "feeling" of context issues - use hard triggers above.
```

**Self-check (secondary indicators):**
```
Warning signs you may have missed a checkpoint:
- Asking about something discussed earlier
- Re-reading a file you already read
- Uncertainty about decisions already made
- Response latency noticeably increasing

If ANY of these occur → IMMEDIATE /save-progress
```

### /save-progress Integration

When checkpoint trigger fires (3 items, 10 iterations, or re-read detected), the loop:

1. **Commits current work** (even if WIP)
2. **Runs /save-progress** which writes to `.claude/sessions/progress-{timestamp}.md`:
   - Current PRD item being worked on
   - Decisions made this session
   - Files explored (even unchanged ones)
   - Approach being taken
   - Blockers or open questions
3. **Commits the progress file**
4. **Exits cleanly** with handoff instructions

### Session Handoff

**Output when checkpoint triggers:**

```markdown
## Ralph Loop: Context Checkpoint

**Reason**: [3 items completed | 10 iterations reached | re-read detected]
**This is NOT a failure** - this is how Ralph maintains quality.

### Current State
- **PRD Progress**: 3/7 items complete
- **Current Item**: Item 4 - OAuth integration (in progress)
- **Last Commit**: abc1234 - Add OAuth scaffold

### Saved To
`.claude/sessions/progress-2024-01-15T10-30-00.md`

### To Continue
Start a new session and run:
```
/ralph-loop PRD.md --resume
```

The new session will:
1. Read the progress file
2. Check git log for context
3. Continue from where you left off
```

### --resume Behavior

When `/ralph-loop --resume` is called:

```
1. Find latest progress file in .claude/sessions/
2. Read progress summary
3. Read PRD to find incomplete items
4. Read git log for recent commits
5. Output: "Resuming from: [last item]. Context restored from disk."
6. Continue loop from next incomplete item
```

### Manual Checkpoint

You can also checkpoint manually at any time:

```
User: "save progress"
Claude: [runs /save-progress]
        [commits progress file]
        "Progress saved. You can continue now or start fresh with --resume"
```

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

═══════════════════════════════════════════════════════════════
## IMPLEMENT: User authentication
═══════════════════════════════════════════════════════════════

┌─ CANON ─────────────────────────────────────────────────────┐
│ 📐 Clarity   🔧 Simplicity   🛡️ Security   📝 Types         │
└─────────────────────────────────────────────────────────────┘

┌─ SKILLS LOADED ─────────────────────────────────────────────┐
│ /owasp /cherny /schneier                                    │
└─────────────────────────────────────────────────────────────┘

┌─ APPLICATION ───────────────────────────────────────────────┐
│ 📐K Clear function name: authenticateUser (Kernighan)       │
│ 🛡️S Password hashing with bcrypt (Schneier)                 │
│ 📝Ty Defined AuthResult type (Cherny)                       │
│ 🔧P Single responsibility: split validate/authenticate      │
└─────────────────────────────────────────────────────────────┘

Commit: abc1234 - Add basic auth structure
Summary: 📐K×1 🔧P×1 🛡️S×1 📝Ty×1

───────────────────────────────────────────────────────────────
**Tests**: 3 passed, 0 failed
**/review-hard**: 1 high issue (missing input validation)
**Status**: Fixing...
───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
## FIX: Input validation
═══════════════════════════════════════════════════════════════

┌─ APPLICATION ───────────────────────────────────────────────┐
│ 🛡️S Input sanitization before processing (OWASP)            │
│ 🛡️S Email format validation (OWASP)                         │
└─────────────────────────────────────────────────────────────┘

Commit: def5678 - Add input validation to auth
Summary: 🛡️S×2

───────────────────────────────────────────────────────────────
**Tests**: 4 passed, 0 failed
**/review-hard**: Clean ✓
**Status**: COMPLETE - marking in PRD
───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
## IMPLEMENT: Session management
═══════════════════════════════════════════════════════════════

┌─ CANON ─────────────────────────────────────────────────────┐
│ 📐 Clarity   🛡️ Security   📊 Data structures               │
└─────────────────────────────────────────────────────────────┘

┌─ SKILLS LOADED ─────────────────────────────────────────────┐
│ /schneier /linus /cherny                                    │
└─────────────────────────────────────────────────────────────┘

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
