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
        3. AUTO-INVOKE domain masters based on context:
           - UI work? → /frost, /ive, /norman, etc.
           - React? → /abramov
           - TypeScript? → /cherny
           - Tests? → /dodds
        4. Implement (with canon lens active)
        5. ADD DOCUMENTATION:
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

Report final status
```

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
| Documentation | Inline docs + `/doc-code` if public API | JSDoc/XML present |

**Important**: Inside the loop, use self-review only (no `--full`). Gemini and Qodana run as post-loop validation to prevent nested fix cycles.

## Auto-Invoke Canon Masters

When implementing PRD items, automatically invoke domain experts:

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

When loop exits:

```markdown
## Ralph Loop Complete

**Iterations**: N
**Exit Reason**: all_complete | max_iterations | idle_detected

### PRD Status
- [x] Item 1: User authentication
- [x] Item 2: Session management
- [x] Item 3: Password hashing
- [ ] Item 4: OAuth integration (blocked: need API keys)

### Quality Summary
- Tests: 100% passing
- Review: No critical issues
- Security: Audited

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
