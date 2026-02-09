# /optimization Summary

> "If you want to do something really well, you have to understand it deeply."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Functional core** | Pure functions where possible, side effects at edges |
| **Const everything** | If it doesn't change, mark it const |
| **Understand hardware** | Cache behavior, branch prediction, memory access |
| **Measure first** | The bottleneck is never where you think |

## Pure Functions

```c
// BAD: Side effects everywhere
void processItem(Item* item) {
    item->value = compute(item->value);
    globalCounter++;  // Side effect
    log(item);        // Side effect
}

// GOOD: Pure core, effects at edges
Item processItem(Item item) {
    return (Item){ .value = compute(item.value) };
}
// Side effects in main()
```

## Data-Oriented Design

```c
// BAD: Array of Structures (cache misses)
struct Entity { Vector3 pos; Vector3 vel; int health; char name[32]; };
Entity entities[1000];

// GOOD: Structure of Arrays (cache-friendly)
struct Entities {
    Vector3 positions[1000];
    Vector3 velocities[1000];
    int health[1000];
};
```

## Static Analysis

Use every tool:
- Compiler warnings: `-Wall -Werror`
- Static analyzers: Coverity, PVS-Studio, clang-analyzer
- Sanitizers: ASan, UBSan, TSan

> "The cost of fixing a bug goes up by an order of magnitude at every stage."

## Code Style

- **Locality**: Keep related code together, even if long
- **No premature abstraction**: Wait for 3 concrete examples
- **Comment optimizations**: Explain *why*, especially non-obvious tricks

```c
// OPTIMIZATION: Integer math avoids FPU stall. 15% faster on Pentium 166.
int approxDist = (dx > dy) ? dx + (dy >> 1) : dy + (dx >> 1);
```

## The Carmack Test

1. Is this function pure? Can I make it pure?
2. Is const used everywhere possible?
3. Do I understand the hardware impact?
4. Have I measured before optimizing?
5. Would static analysis catch bugs?

## When to Use

- Performance-critical code (games, graphics, real-time)
- After profiling has identified bottlenecks
- When you need to understand the machine level

## Concrete Checks (MUST ANSWER)

1. **I/O separation (CRITICAL):** For every function, does it read or write external state (filesystem, network, database, global/module-level variable)? If yes, can the computation be split from the I/O into a pure function that takes data and returns data, with the I/O caller wrapping it? If the split is possible, do it.
2. **Purity ratio:** Classify every function as pure (deterministic, no side effects) or impure (performs I/O, mutates external state). Is the pure-to-impure ratio at least 2:1? If more than a third of functions are impure, extract pure logic from the impure functions.
3. **Const/readonly audit:** Is every variable that is never reassigned declared as `const` (or language equivalent)? Is every function parameter that is not modified marked `readonly`? Search for `let` declarations and verify each one is actually reassigned.
4. **Measurement before optimization:** For every optimization you are about to apply (caching, memoization, custom data structure, algorithm change), do you have a benchmark showing the current code is measurably too slow? If no benchmark exists, do not optimize.
5. **Hot path identification:** Have you profiled the code to identify which functions consume the most time? Are your optimizations targeted at those functions specifically? Optimizing cold paths is wasted effort — verify with profiler output.

## HARD GATES (mandatory before writing code)

- [ ] **Functional core enforcement (CRITICAL):** List every module. Classify each function as pure (takes data, returns data, no side effects) or impure (calls I/O, modifies external state). If >30% of functions are impure, refactor: extract pure logic, push I/O to edges.
  - Pure: `transformData(input) → output`
  - Impure: `saveToFile(data)`, `readFromDB()`
  - Architecture: impure shell calls pure core, never the reverse
- [ ] **Const audit:** Every variable that is never reassigned must be `const` (or equivalent). Every function parameter that isn't modified should be `readonly`.
- [ ] **Measurement before optimization:** If you're about to optimize something, show the benchmark that proves it's slow. No benchmark = no optimization.
- [ ] **Cache-friendly access:** If processing collections, are you iterating in memory order? Random access patterns on large datasets are a hidden performance killer.
