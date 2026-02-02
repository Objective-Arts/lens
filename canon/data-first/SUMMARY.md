# /linus Summary

> "Bad programmers worry about the code. Good programmers worry about data structures and their relationships."

## Essential Principles

| Principle | Apply When | Guidance |
|-----------|------------|----------|
| **Data Structures First** | Designing any feature | Get structures right, code follows naturally |
| **Eliminate Special Cases** | Code has if-statements for edge cases | Restructure so edges are handled by design |
| **No Deep Nesting** | >3 levels of indentation | Refactor - you're screwed anyway |
| **Short Functions** | Any function | One screen max (~48 lines) |
| **Comment the Why** | Adding comments | Never comment *what*, only *why* |
| **Direct Over Abstract** | Tempted to add layers | Every abstraction has a cost |

## The Good Taste Test

**Before (no taste):**
```c
if (!prev)
    head = entry->next;  // Special case
else
    prev->next = entry->next;
```

**After (good taste):**
```c
*indirect = entry->next;  // No special case - structure handles it
```

## Load Full Skill When

- Writing kernel-style C code
- Detailed Linux kernel coding style (tabs, braces, naming)
- Understanding Linus's views on C vs C++
- Need complete linked list example with explanation

## Quick Reference

```
QUESTION                              ANSWER
──────────────────────────────────────────────────────
Can I eliminate a special case?     → Restructure data
Is my code complicated?             → Wrong data structures
Do I need a debugger to understand? → Code too complex
Function scrolls off screen?        → Too long, split it
Need >3 indentation levels?         → Refactor immediately
```

## Code Review Checklist (Linus)

- [ ] No unnecessary special cases?
- [ ] Data structures match the problem?
- [ ] Functions <50 lines?
- [ ] Indentation ≤3 levels?
- [ ] Comments explain *why*, not *what*?
- [ ] Understandable without a debugger?
