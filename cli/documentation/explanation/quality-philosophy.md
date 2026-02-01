# Quality Philosophy

Why quality is built in, not inspected at the end.

---

## The Core Insight

> "You cannot inspect quality into a product."
> — W. Edwards Deming

Traditional workflows write code first, then review and test at the end. This is expensive:

```
Write code → Find bugs → Fix bugs → Find more bugs → Fix again...
```

Each round of "find and fix" costs more than the last because:
- The code is already written
- Changing it risks breaking other things
- Developers have moved on mentally
- The original intent is forgotten

---

## Deming's Approach

Deming transformed manufacturing with a simple insight: **build quality in from the start**.

Instead of inspecting products at the end and rejecting defects, design the process so defects can't happen.

Applied to code:

| Traditional | Deming |
|-------------|--------|
| Write code | Plan first |
| Then test | Structure before implementing |
| Then review | Review during, not after |
| Then fix | Fix issues where they're caught |

---

## How Ralph Embodies This

Ralph's 10 phases implement quality-first development:

### 1. Plan

Before writing any code, understand:
- What exactly needs to be built
- Which files will change
- What functions are needed
- What invariants must hold

Bugs prevented: wrong feature, missing requirements, scope creep.

### 2. Structure-First

Define types and interfaces before implementation:
- Data structures are designed, not discovered
- Contracts between components are explicit
- Type errors caught at compile time

Bugs prevented: type mismatches, interface inconsistencies.

### 3. Implement

Write code with the plan and structure already defined:
- No designing while coding
- Focus on implementation, not architecture
- Expert skills guide style

Bugs prevented: architectural mistakes, inconsistent patterns.

### 4. Refactor-Check

Immediately clean up:
- Remove duplication
- Simplify complex logic
- Apply consistent style

Bugs prevented: maintenance nightmares, future confusion.

### 5. Adversarial Review

Gemini reviews with attacker mindset:
- Security vulnerabilities
- Edge cases
- Logic errors

Bugs prevented: security holes, unhandled cases.

### 6. Static Analysis

Qodana scans for:
- Code smells
- Potential bugs
- Style violations

Bugs prevented: known anti-patterns, common mistakes.

### 7. Test

Write tests for the implementation:
- Verify behavior matches intent
- Catch regressions
- Document expected behavior

Bugs prevented: behavior regressions, undocumented assumptions.

### 8. Doc-Code

Generate documentation:
- API docs from code
- Usage examples
- Architectural notes

Bugs prevented: misuse, misunderstanding, maintenance errors.

---

## Why This Order Matters

The phases are ordered to catch issues when they're cheapest to fix:

```
Cost to fix
     ▲
     │                                         ████ Production
     │                                   ████
     │                             ████
     │                       ████
     │                 ████
     │           ████
     │     ████
     │ ████
     └────────────────────────────────────────────► Time
       Plan  Structure  Implement  Review  Test  Production
```

A bug caught in planning costs minutes to fix.
The same bug caught in production costs days or weeks.

---

## Expert Skills as Guardrails

Each phase loads expert skills that encode best practices:

| Phase | Experts | What They Prevent |
|-------|---------|-------------------|
| Plan | dijkstra, liskov | Incorrect decomposition |
| Structure | cherny, bloch | Bad type design |
| Implement | kernighan, pike | Unclear code |
| Refactor | fowler | Code smells |
| Review | schneier, owasp | Security holes |
| Test | meszaros, dodds | Test anti-patterns |
| Doc | procida, strunk | Useless documentation |

Experts aren't just loaded—they're the lens through which Claude writes code.

---

## The Result

Code that comes out of ralph is:

**More reviewable**: Consistent style, clear structure, documented.

**More testable**: Designed for testing, not retrofitted.

**More secure**: Security considered from the start.

**Closer to production-ready**: Fewer rounds of "fix this, now fix that."

---

## Comparison

### Without Ralph

```
1. Write code (make it work)
2. Get PR review (find 10 issues)
3. Fix issues (introduce 2 new bugs)
4. Another review (find those bugs)
5. Fix again
6. Merge (hope nothing breaks)
7. Find bug in production
8. Hotfix
```

### With Ralph

```
1. Plan (catch requirement issues)
2. Structure (catch design issues)
3. Implement (with expert guidance)
4. Refactor (catch code smells)
5. Review (catch security issues)
6. Analyze (catch known anti-patterns)
7. Test (verify behavior)
8. Document (prevent misuse)
9. PR is clean, reviewable, ready
```

---

## This Is Not Slower

It feels like more steps, but:

1. **Each step is smaller** — no massive rewrites
2. **Issues are caught early** — when they're cheap
3. **Reviews are faster** — code is already clean
4. **Less back-and-forth** — fewer "please fix X" cycles
5. **Production is stabler** — fewer hotfixes

The total time from start to stable production is less, not more.

---

## Summary

Quality is generative, not corrective.

- **Generative**: Build it right from the start
- **Corrective**: Fix it after it's broken

Ralph's 10 phases make quality generative. Expert skills encode what "right" means. The result is code that's reviewable and production-ready, not code that needs endless rounds of fixes.
