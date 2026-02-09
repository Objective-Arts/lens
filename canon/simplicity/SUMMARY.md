# /simplicity Summary

> "Simplicity is complicated, but the clarity it provides is worth the effort."

## Pike's Rules

| Rule | Meaning |
|------|---------|
| **Can't tell where time is spent** | Profile first. Bottlenecks are never where you think |
| **Measure before optimizing** | Intuition is unreliable. Profilers don't lie |
| **Fancy algorithms are slow when n is small** | And n is usually small. Linear search is fine for 20 items |
| **Fancy algorithms are buggier** | Simple algorithms with simple data are easier to get right |
| **Data dominates** | Get data structures right. Code follows |

## Go Proverbs

| Proverb | Example |
|---------|---------|
| **Clear > Clever** | No puzzles. If someone has to think, you failed |
| **Small interfaces** | `io.Reader` has one method. It's used everywhere |
| **Zero value useful** | `var b Buffer; b.Write(data)` should just work |
| **Errors are values** | Work with them, don't just check and pass up |
| **Little copying > little dependency** | Copy 10 lines instead of importing a library |
| **Channels over shared memory** | Don't communicate by sharing; share by communicating |

## Interface Design

```go
// BAD: Big interface (weak abstraction)
type DataStore interface {
    Get, Put, Delete, List, Watch, Transaction, Backup... // 15 methods
}

// GOOD: Small interfaces, compose as needed
type Reader interface { Read(key string) ([]byte, error) }
type Writer interface { Write(key string, value []byte) error }
type ReadWriter interface { Reader; Writer }
```

## Error Handling

```go
// BAD: Just passing up
return err

// GOOD: Add context
return fmt.Errorf("loading config from %s: %w", path, err)
```

## The Pike Test

1. Is this the simplest solution?
2. Is it clear without explanation?
3. Did I measure before optimizing?
4. Are my interfaces small (1-3 methods)?
5. Is the zero value useful?
6. Could I delete something?

## Concrete Checks (MUST ANSWER)

1. **Interface method count:** List every interface/type you define. Does each one have 3 or fewer methods? If any has more, split it into composable single-purpose interfaces.
2. **Optimization evidence:** For every non-trivial algorithm choice (hash map instead of array, caching layer, custom data structure), is there a benchmark showing the simpler alternative is measurably too slow for actual workload sizes? If no benchmark exists, use the simpler approach.
3. **Zero value test:** For every struct/class/type, does `new T()` or the language's zero value produce a usable instance without calling a setup method? If construction requires mandatory initialization steps, redesign so defaults work.
4. **Error context check:** For every error that propagates up, does it include what operation failed and what input caused it? Bare `throw err` or `return err` without wrapping fails this check.
5. **Dependency direction:** Draw or trace the import graph. Does any core logic module import an I/O module (filesystem, network, database)? If yes, the architecture is inverted — I/O should import core, not the reverse.

## HARD GATES (mandatory before writing code)

- [ ] **Interface audit:** List every interface/type you plan to create. Does each one have ≤3 methods? If more, split it.
- [ ] **Dependency direction:** Draw the dependency graph. Do all arrows point inward (toward core logic)? If core logic imports I/O modules, the architecture is inverted — fix it.
- [ ] **Zero-config test:** Does your tool/library work with zero configuration? If it requires a config file to start, you've over-engineered it.
- [ ] **Linear search first:** If you're implementing any search/lookup, start with linear scan. Only optimize after measuring with real data.
