---
name: simplicity
description: "Go proverbs and simplicity"
allowed-tools: []
---

# Pike: Simplicity is Complicated

Rob Pike's core belief: **Simplicity is the ultimate sophistication.** The best code is the code that isn't there. When in doubt, leave it out.

## The Foundational Principle

> "Complexity is multiplicative: fixing a problem by making one part of the system more complex slowly but surely adds complexity to other parts."

Every added feature, abstraction, or clever trick has a cost. That cost compounds. The goal is not to build the most powerful system, but the simplest system that works.

---

## Pike's Rules of Programming

From "Notes on Programming in C":

### Rule 1: You Can't Tell Where a Program Will Spend Its Time

Bottlenecks occur in surprising places. Don't guess. Don't optimize without data.

**Not this:**
```go
// "I bet this loop is slow, let me optimize it"
// [spends 3 hours optimizing code that runs once at startup]
```

**This:**
```go
// Profile first
// pprof shows 80% of time in database calls
// Optimize database calls
```

### Rule 2: Measure

> "Measure. Don't tune for speed until you've measured, and even then don't unless one part of the code overwhelms the rest."

Intuition is unreliable. Profilers don't lie. Measure before you touch anything.

### Rule 3: Fancy Algorithms Are Slow When N Is Small

And N is usually small.

**Not this:**
```go
// Using red-black tree for 20 items
tree := redblack.New()
```

**This:**
```go
// Linear search is fine for 20 items
for _, item := range items {
    if item.ID == target {
        return item
    }
}
```

### Rule 4: Fancy Algorithms Are Buggier Than Simple Ones

They're harder to implement, harder to debug, and the constant factors are often large. Simple algorithms with simple data structures are easier to get right.

### Rule 5: Data Dominates

> "If you've chosen the right data structures and organized things well, the algorithms will almost always be self-evident."

Get the data structures right. The code follows.

---

## Go Proverbs

### Clear is Better Than Clever

The most important proverb. If someone has to puzzle over your code, you've failed.

**Not this:**
```go
// Clever one-liner
return a[i], a[j] = a[j], a[i], len(a) > i && len(a) > j
```

**This:**
```go
// Clear
if i >= len(a) || j >= len(a) {
    return false
}
a[i], a[j] = a[j], a[i]
return true
```

### The Bigger the Interface, the Weaker the Abstraction

Small interfaces are powerful. `io.Reader` has one method. It's used everywhere.

**Not this:**
```go
type DataStore interface {
    Get(key string) ([]byte, error)
    Put(key string, value []byte) error
    Delete(key string) error
    List(prefix string) ([]string, error)
    Watch(key string) (<-chan Event, error)
    Transaction(func(Txn) error) error
    Backup(path string) error
    Restore(path string) error
    // ... 15 more methods
}
```

**This:**
```go
type Reader interface {
    Read(key string) ([]byte, error)
}

type Writer interface {
    Write(key string, value []byte) error
}

// Compose when needed
type ReadWriter interface {
    Reader
    Writer
}
```

### Make the Zero Value Useful

A type's zero value should be immediately usable without initialization.

**Not this:**
```go
type Buffer struct {
    data []byte
}

func NewBuffer() *Buffer {
    return &Buffer{data: make([]byte, 0, 64)}
}
// User must remember to call NewBuffer()
```

**This:**
```go
type Buffer struct {
    data []byte
}

func (b *Buffer) Write(p []byte) {
    b.data = append(b.data, p...)  // Works even when b.data is nil
}
// var b Buffer; b.Write(data) just works
```

### Errors Are Values

Errors are not exceptions. They're values you program with.

**Not this:**
```go
// Just checking, not handling
if err != nil {
    return err
}
```

**This:**
```go
// Errors are values - you can work with them
type errWriter struct {
    w   io.Writer
    err error
}

func (ew *errWriter) write(buf []byte) {
    if ew.err != nil {
        return  // Skip if already errored
    }
    _, ew.err = ew.w.Write(buf)
}
```

### Don't Just Check Errors, Handle Them Gracefully

Add context. Make errors actionable. Help the person debugging at 3am.

**Not this:**
```go
return err
```

**This:**
```go
return fmt.Errorf("loading config from %s: %w", path, err)
```

### A Little Copying Is Better Than a Little Dependency

Don't import a library for one function. Copy the 10 lines you need.

**Not this:**
```go
import "github.com/somelib/utils"  // For one function

result := utils.Max(a, b)
```

**This:**
```go
// Just write it
func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}
```

### Don't Communicate by Sharing Memory; Share Memory by Communicating

Use channels to pass data between goroutines. Don't share state with mutexes unless you must.

**Not this:**
```go
var mu sync.Mutex
var data map[string]int

func update(key string, val int) {
    mu.Lock()
    data[key] = val
    mu.Unlock()
}
```

**This:**
```go
type update struct {
    key string
    val int
}

func worker(updates <-chan update, data map[string]int) {
    for u := range updates {
        data[u.key] = u.val
    }
}
```

### Concurrency Is Not Parallelism

Concurrency is about structure. Parallelism is about execution. You can have concurrency without parallelism (single core). Design for concurrency; parallelism may follow.

### Cgo Is Not Go

When you call C from Go, you leave Go's safe world. Memory safety, garbage collection, goroutine scheduling—all bets are off. Avoid cgo if possible.

### Reflection Is Never Clear

Reflection is powerful but obscure. It makes code harder to understand and slower to execute. Use it only when there's no other way.

---

## Design Principles

### Composition Over Everything

Don't build monoliths. Build small pieces that compose.

```go
// Small, focused types
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }
type Closer interface { Close() error }

// Compose as needed
type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}
```

### Orthogonality

Components should be independent. Changing one shouldn't require changing another.

### Accept Interfaces, Return Structs

Functions should accept the smallest interface they need and return concrete types.

```go
// Accept interface
func Process(r io.Reader) (*Result, error) {
    // Works with files, buffers, network connections...
}

// Return concrete
func NewProcessor() *Processor {
    return &Processor{}
}
```

---

## The Pike Test

Before committing code, ask:

1. **Is this the simplest solution?** Could it be simpler?
2. **Is it clear?** Will someone understand it without explanation?
3. **Did I measure before optimizing?** Or am I guessing?
4. **Are my interfaces small?** One or two methods?
5. **Is the zero value useful?** Or does it require initialization?
6. **Am I handling errors, not just checking them?**
7. **Could I delete something?** Less code is better code.

---

## When Reviewing Code

Apply these checks:

- [ ] No premature optimization (measured first?)
- [ ] Simplest algorithm that works (not fanciest)
- [ ] Interfaces are small (1-3 methods)
- [ ] Zero values are useful
- [ ] Errors have context, not just passed up
- [ ] Clear over clever (no puzzles)
- [ ] Minimal dependencies (copied small utilities?)
- [ ] Channels over shared memory (where appropriate)
- [ ] No unnecessary reflection
- [ ] No cgo unless absolutely required

---

## When NOT to Use This Skill

Use a different skill when:
- **Writing Linux kernel code** → Use `data-first` (kernel coding style, 8-char tabs, specific conventions)
- **Optimizing for performance** → Use `optimization` (profiling, cache behavior, data-oriented design)
- **Writing high-level application code** → Use `clarity` (general clarity principles)
- **Building distributed systems** → Use `distributed` (statelessness, idempotency, failure handling)
- **Designing CLI pipelines** → Use `composition` (Unix philosophy, stdin/stdout composition)

Pike is the **Go-first skill** and for systems code emphasizing small interfaces and composition.

## Sources

- Pike, "Notes on Programming in C" (1989)
- Pike, "Go Proverbs" (Gopherfest 2015)
- Kernighan & Pike, "The Practice of Programming" (1999)
- Pike, "Simplicity is Complicated" (dotGo 2015)

---

*"Simplicity is complicated, but the clarity it provides is worth the effort."* — Rob Pike
