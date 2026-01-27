# /dijkstra Summary

> "Testing shows the presence of bugs, not their absence."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Humble programmer** | Our brains are limited. Use discipline, not cleverness |
| **Simplicity is mandatory** | Complex programs cannot be understood or trusted |
| **Derive, don't write** | Programs should follow from specifications |
| **Prove correctness** | Don't trust intuition or testing alone |

## Structured Programming

**Only three constructs needed:**
1. Sequence (statements in order)
2. Selection (if/then/else)
3. Iteration (while loops)

**No goto. Ever.** One entry, one exit per block.

## Loop Invariants

To prove a loop correct:
```
// Invariant: sum = a[0] + ... + a[i-1]
sum := 0; i := 0
while i < n:
    sum := sum + a[i]
    i := i + 1
// Invariant + (i = n) proves: sum = a[0] + ... + a[n-1]
```

## Separation of Concerns

- Break problems into independent pieces
- Each layer complete, consistent, independent
- "The only available technique for ordering one's thoughts"

## Key Quotes

> "Simplicity is prerequisite for reliability."

> "Elegance is not a dispensable luxury but a quality that decides between success and failure."

> "If debugging is the process of removing bugs, then programming must be the process of putting them in."

## The Dijkstra Test

1. Is this simple enough to understand at once?
2. Is it structured? (one entry, one exit)
3. Could I prove this correct?
4. Have I separated concerns?
5. Am I being humble, or trusting my cleverness?

## When to Use

- Safety-critical systems (medical, aviation)
- Security-critical systems (crypto, auth)
- When cost of bugs exceeds cost of proof
- When testing cannot provide adequate confidence

## Checklist

- [ ] Code is structured (sequence, selection, iteration only)
- [ ] Each function has clear pre/postconditions
- [ ] Loops have identifiable invariants
- [ ] Complexity minimized (not just managed)
- [ ] Simple enough to hold in one's head
