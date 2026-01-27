# /carmack Summary

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
