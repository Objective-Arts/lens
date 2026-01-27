# /pike Summary

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

## Checklist

- [ ] No premature optimization (measured first?)
- [ ] Simplest algorithm that works
- [ ] Interfaces are small (1-3 methods)
- [ ] Zero values are useful
- [ ] Errors have context
- [ ] Clear over clever
