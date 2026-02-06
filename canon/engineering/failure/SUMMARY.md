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
