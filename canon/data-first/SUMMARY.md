# /data-first Summary

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

## Concrete Checks (MUST ANSWER)

1. **Pure function extraction (CRITICAL):** For each function that modifies external state (filesystem, network, database, global variable): can the business logic be extracted into a pure function that takes data and returns data, with I/O pushed to callers? If yes, do it. If no, document why the coupling is unavoidable.
2. **Special-case branch audit:** List every if/else and switch branch. For each conditional that handles a "special case" (null check, empty collection, first/last element): can restructuring the data eliminate the branch entirely? Each eliminated branch is a class of bug that becomes impossible.
3. **Function length:** Does any function exceed 50 lines? If yes, the data structures are wrong — redesign the types so the code simplifies, rather than just splitting the function arbitrarily.
4. **Nesting depth:** Does any code block nest deeper than 3 levels of indentation? If yes, refactor: use early returns, extract helper functions, or restructure the data to flatten the logic.
5. **Data structure justification:** Before writing any algorithm, are the input and output types fully defined? If you started writing code before settling the types, stop and design the data structures first.

## HARD GATES (mandatory before writing code)

- [ ] **Pure core check (CRITICAL):** List every function that contains business logic. Does any of them directly call filesystem, network, or database operations? If yes, extract the logic into a pure function that takes data and returns data. Push I/O to the caller.
  - BAD: `addKey()` calls `loadStore()` and `saveStore()` internally
  - GOOD: `addKey(store, key)` returns new store; caller handles persistence
- [ ] **Data structure test:** Before writing any algorithm, define the data structures. If you're writing code and the types aren't settled, stop and design the types first.
- [ ] **Special case elimination:** List every if/else branch. Can any be eliminated by restructuring the data? Each eliminated branch is a bug that can't happen.
- [ ] **Function length:** No function exceeds 30 lines. If it does, the data structures are wrong — restructure them so the code simplifies.
