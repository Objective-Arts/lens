---
name: pike
description: "Pike's simplicity, Go proverbs, and The Practice of Programming"
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

## From The Practice of Programming

### Chapter 4: Interfaces

> "Hide implementation details."

Pike's emphasis: interfaces should be **small** and **orthogonal**.

#### Design Principles

**Choose a small orthogonal set of primitives:**

```go
// Not this: monolithic interface with many modes
type Processor interface {
    Process(data []byte, mode int, format string, validate bool) ([]byte, error)
}

// This: small, composable primitives
type Validator interface {
    Validate(data []byte) error
}

type Transformer interface {
    Transform(data []byte) ([]byte, error)
}

type Formatter interface {
    Format(data []byte, format string) ([]byte, error)
}
```

**Don't reach behind an abstraction:**

```go
// Not this: accessing internals
if queue.items[0].priority > 5 {  // Breaks encapsulation

// This: use the interface
if queue.Peek().Priority() > 5 {  // Respects the abstraction
```

**Do the same thing the same way everywhere:**

Consistency matters. If you check errors one way, check them that way everywhere. If you name things one way, name them that way always.

#### Resource Management

> "Free a resource in the same layer that allocated it."

```go
// Good: same function opens and closes
func processFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()  // Same layer that opened
    return process(f)
}

// Bad: caller opens, callee closes
func processFile(f *os.File) error {
    defer f.Close()  // Who opened this? Confusing ownership
    return process(f)
}
```

#### Error Handling

> "Detect errors at a low level, handle them at a high level."

Low-level code knows what went wrong. High-level code knows what to do about it.

```go
// Low level: detect and report with detail
func readConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("reading config %s: %w", path, err)
    }
    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("parsing config %s: %w", path, err)
    }
    return &cfg, nil
}

// High level: decide policy
func startApp() error {
    cfg, err := readConfig("app.json")
    if err != nil {
        log.Printf("warning: %v, using defaults", err)
        cfg = defaultConfig()
    }
    return run(cfg)
}
```

> "Use exceptions only for exceptional situations."

In Go, this means: errors are values, not exceptions. Handle them explicitly.

---

### Chapter 5: Debugging

> "Good programmers know that they spend as much time debugging as writing."

#### Debugging Strategy

**Look for familiar patterns:**
- Off-by-one errors (the most common bug)
- Failure to initialize
- Null pointer dereference
- Running off the end of an array
- Resource leaks (files, memory, goroutines)

**Examine the most recent change:**

```bash
# What changed since it last worked?
git diff HEAD~1
git log --oneline -10
```

The bug is almost always in code you just wrote, not in code that's been working for months.

**Make the bug reproducible:**

```go
// Log inputs so you can reproduce
func process(data []byte) error {
    log.Printf("process called with %d bytes: %x", len(data), data[:min(len(data), 32)])
    // ...
}
```

**Divide and conquer:**

```go
// Binary search for the bug
func complexOperation(data []byte) error {
    result1 := stepOne(data)
    log.Printf("after step 1: %v", result1)  // OK here?

    result2 := stepTwo(result1)
    log.Printf("after step 2: %v", result2)  // Still OK?

    return stepThree(result2)
}
```

**Explain your code to someone (or something):**

The act of explaining often reveals the bug. Rubber duck debugging works because articulating your assumptions exposes them.

#### Debugging Techniques

**Read the error message:**

```
panic: runtime error: index out of range [5] with length 3
```

Error messages tell you exactly what happened. Read them carefully.

**Study the numerology of failures:**

- Fails at 256? Byte overflow
- Fails at 1024 but not 1023? Power of two boundary
- Works 9 times, fails on 10th? Off-by-one
- Fails after exactly 5 minutes? Timeout

**Write self-checking code:**

```go
func transfer(from, to *Account, amount int) error {
    totalBefore := from.Balance + to.Balance

    from.Balance -= amount
    to.Balance += amount

    totalAfter := from.Balance + to.Balance
    if totalBefore != totalAfter {
        panic("money created or destroyed")  // Invariant violated
    }
    return nil
}
```

**Keep records:**

When debugging a hard bug, write down what you've tried and what you've learned. Pattern recognition across attempts often reveals the answer.

---

### Chapter 6: Testing

> "Test code at its boundaries."

#### Boundary Testing

Test the edges where bugs hide:

```go
func TestSort(t *testing.T) {
    // Empty
    assertSorted(t, sort([]int{}))

    // Single element
    assertSorted(t, sort([]int{1}))

    // Already sorted
    assertSorted(t, sort([]int{1, 2, 3}))

    // Reverse sorted
    assertSorted(t, sort([]int{3, 2, 1}))

    // Duplicates
    assertSorted(t, sort([]int{2, 1, 2, 1}))

    // Large
    assertSorted(t, sort(randomInts(10000)))
}
```

#### Systematic Testing

**Test incrementally:**

Write tests as you write code, not after. Each function gets tested immediately.

```go
func parseHeader(line string) (Header, error) {
    // Implementation
}

func TestParseHeader(t *testing.T) {
    tests := []struct {
        input string
        want  Header
        err   bool
    }{
        {"Name: value", Header{"Name", "value"}, false},
        {"Name:", Header{"Name", ""}, false},
        {"invalid", Header{}, true},
        {"", Header{}, true},
    }
    for _, tt := range tests {
        got, err := parseHeader(tt.input)
        // assertions...
    }
}
```

**Test simple parts first:**

If a complex function fails, verify its components work first.

**Know what output to expect:**

```go
// Calculate expected independently
func TestSum(t *testing.T) {
    input := []int{1, 2, 3, 4, 5}
    expected := 15  // Calculated by hand
    if got := sum(input); got != expected {
        t.Errorf("sum(%v) = %d, want %d", input, got, expected)
    }
}
```

#### Automation

> "Automate regression testing."

```bash
# Run all tests with one command
go test ./...

# Run with race detector
go test -race ./...

# Run with coverage
go test -cover ./...
```

**Compare independent implementations:**

```go
// Test optimized version against reference
func TestOptimizedSearch(t *testing.T) {
    for i := 0; i < 1000; i++ {
        data := randomData()
        target := randomTarget()
        got := optimizedSearch(data, target)
        want := simpleSearch(data, target)
        if got != want {
            t.Errorf("mismatch for %v, %v", data, target)
        }
    }
}
```

#### Assertions

> "Use assertions liberally."

```go
func average(nums []float64) float64 {
    if len(nums) == 0 {
        panic("average of empty slice")  // Precondition
    }
    sum := 0.0
    for _, n := range nums {
        sum += n
    }
    return sum / float64(len(nums))
}
```

Assertions document invariants and catch violations immediately.

---

### Chapter 7: Performance

> "A fast program that gets the wrong answer isn't much use."

#### The Performance Hierarchy

1. **Don't optimize yet** — Get it working first
2. **Measure** — Profile to find actual bottlenecks
3. **Use a better algorithm** — O(n²) → O(n log n)
4. **Use a better data structure** — slice → map for lookups
5. **Enable compiler optimizations** — -O flags, escape analysis
6. **Tune hot spots** — Only after all the above

#### Measure First

```go
import "testing"

func BenchmarkProcess(b *testing.B) {
    data := setupTestData()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        process(data)
    }
}
```

```bash
go test -bench=. -cpuprofile=cpu.prof
go tool pprof cpu.prof
```

#### Common Optimizations

**Cache expensive computations:**

```go
var configCache sync.Map

func getConfig(id string) (*Config, error) {
    if cached, ok := configCache.Load(id); ok {
        return cached.(*Config), nil
    }
    cfg, err := loadConfig(id)
    if err != nil {
        return nil, err
    }
    configCache.Store(id, cfg)
    return cfg, nil
}
```

**Avoid allocation in hot paths:**

```go
// Not this: allocates every call
func format(items []Item) []string {
    result := make([]string, 0)  // Grows repeatedly
    for _, item := range items {
        result = append(result, item.String())
    }
    return result
}

// This: pre-allocate
func format(items []Item) []string {
    result := make([]string, 0, len(items))  // Right capacity
    for _, item := range items {
        result = append(result, item.String())
    }
    return result
}
```

**Use efficient data structures:**

```go
// O(n) lookup
for _, item := range items {
    if item.ID == target {
        return item
    }
}

// O(1) lookup
if item, ok := itemsByID[target]; ok {
    return item
}
```

---

### Chapter 8: Portability

> "Stick to the standard."

**Use standard library:**

```go
// Not this: platform-specific
path := "/home/user/data"

// This: portable
path := filepath.Join(os.Getenv("HOME"), "data")
```

**Handle variations:**

```go
// Byte order: use encoding/binary
binary.BigEndian.PutUint32(buf, value)

// Line endings: handled by bufio.Scanner
scanner := bufio.NewScanner(file)  // Handles \n, \r\n

// Encodings: be explicit
json.NewEncoder(w).Encode(data)  // UTF-8 by spec
```

---

### Chapter 9: Notation

> "Let the machine do the dirty work."

**Data-driven programming:**

```go
// Not this: code for each case
switch day {
case "Monday":
    return 0
case "Tuesday":
    return 1
// ... tedious
}

// This: data table
var dayIndex = map[string]int{
    "Monday": 0, "Tuesday": 1, "Wednesday": 2,
    "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6,
}
return dayIndex[day]
```

**Regular expressions for pattern matching:**

```go
var emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func isEmail(s string) bool {
    return emailRe.MatchString(s)
}
```

**Generate code when patterns repeat:**

```go
//go:generate stringer -type=Status

type Status int

const (
    StatusPending Status = iota
    StatusRunning
    StatusComplete
)
```

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
8. **Did I test at the boundaries?** Empty, one, many, min, max.
9. **Is the resource freed in the same layer that allocated it?**
10. **Am I detecting errors low and handling them high?**

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
- [ ] Resources freed in same layer as allocated
- [ ] Boundaries tested (empty, one, many)
- [ ] Self-checking code for invariants

---

## When NOT to Use This Skill

Use a different skill when:
- **Writing Linux kernel code** → Use `linus` (kernel coding style, 8-char tabs, specific conventions)
- **Optimizing for performance** → Use `carmack` (profiling, cache behavior, data-oriented design)
- **Writing high-level application code** → Use `kernighan` (general clarity principles)
- **Building distributed systems** → Use `bill-joy` (statelessness, idempotency, failure handling)
- **Designing CLI pipelines** → Use `mcilroy` (Unix philosophy, stdin/stdout composition)

Pike is the **Go-first skill** and for systems code emphasizing small interfaces and composition.

## Sources

- Pike, "Notes on Programming in C" (1989)
- Pike, "Go Proverbs" (Gopherfest 2015)
- Kernighan & Pike, "The Practice of Programming" (1999)
- Pike, "Simplicity is Complicated" (dotGo 2015)

---

*"Simplicity is complicated, but the clarity it provides is worth the effort."* — Rob Pike
