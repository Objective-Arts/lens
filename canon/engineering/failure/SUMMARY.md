# /failure Summary

> "Form follows failure, not function."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Form follows failure** | Design evolves from correcting past failures |
| **Success-failure paradox** | Success breeds complacency breeds failure |
| **Constraints drive innovation** | Constraints are features, not obstacles |
| **Evolution over revolution** | Incremental refinement beats rewrites |

## The Success-Failure Cycle

```
SUCCESS → "We've got this" → Reduced vigilance →
Ignored warnings → FAILURE → Deep investigation →
Improved design → SUCCESS (cycle repeats)
```

**Most dangerous time:** Right after a string of successes.

## Case Study Methodology

```
ABSTRACT (weak):
"Always validate input"

CASE STUDY (strong):
"The 2016 incident where unvalidated JSON crashed
production taught us this pattern. Here's the fix."
```

## Pre-Mortem Technique

Write the post-mortem BEFORE shipping:
- How could this fail silently?
- How could this fail catastrophically?
- What would we regret not checking?

## Anti-Patterns

| Pattern | Fix |
|---------|-----|
| "That won't happen to us" | Study similar failures |
| "We've never had that problem" | That's when it happens |
| "Let's remove that constraint" | Ask what you'd lose |
| "Clean slate redesign" | Incremental improvement |

## When to Use

- Learning from incidents
- Design reviews
- Understanding evolved designs

## HARD GATES (mandatory before writing code)

- [ ] **Failure mode enumeration:** For every external dependency (filesystem, network, database, third-party API), list: what if it's down? What if it's slow? What if it returns unexpected data? Document the behavior for each case.
- [ ] **Error propagation check:** Trace every error from origin to user. Does context survive the journey? If any catch block swallows the original error without preserving it (via `cause` or wrapping), fix it.
- [ ] **Timeout check:** Every external call (network, database, subprocess) has a timeout. No timeout = potential infinite hang.
- [ ] **Graceful degradation:** If a non-critical dependency fails, does the system still serve its primary function? Or does one failure cascade into total failure?

## Concrete Checks (MUST ANSWER)

- [ ] **Failure path enumeration:** For each external call (network, file, DB, subprocess), is there an explicit code path for failure? Not just a generic catch -- a specific handler that preserves context and takes a defined action.
- [ ] **Cascading failure test:** Trace each failure scenario: does one failing component cause a second component to fail, which causes a third? If yes, add isolation (timeouts, circuit breakers, bulkheads).
- [ ] **Silent failure scan:** Search for empty catch blocks, catch blocks that only log, and swallowed promise rejections. Each one must either recover or propagate with context.
- [ ] **Pre-mortem written?** Before shipping, have you written answers to: "How could this fail silently?" and "What would we regret not checking?" If not, write them now.
- [ ] **Error context preservation:** Does every re-thrown error include the original error as `cause`? Trace from origin to user-facing message -- is the chain intact?
