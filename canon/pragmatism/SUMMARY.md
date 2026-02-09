# /pragmatism Summary

> "When in doubt, use brute force."

## Thompson's Rules

| Rule | Meaning |
|------|---------|
| **Brute force first** | Don't be clever when simple works |
| **Simplest thing that works** | Build for today, not hypothetical futures |
| **Delete mercilessly** | Every line is a liability. Best code is no code |
| **Fail fast and loud** | Silent failures are the worst failures |
| **Prototype fast** | Use whatever gets you working code fastest |

## Brute Force Example

```go
// CLEVER: Hash-based with bloom filter (50 lines, subtle bugs)
func dedupe(items []string) []string { ... }

// BRUTE FORCE: O(n²) but obviously correct
func dedupe(items []string) []string {
    var result []string
    for _, item := range items {
        found := false
        for _, r := range result {
            if r == item { found = true; break }
        }
        if !found { result = append(result, item) }
    }
    return result
}
// When n > 1000, THEN optimize
```

## Build for Today

```go
// BAD: Anticipating every future
type MessageBus interface {
    Publish, Subscribe, Unsubscribe, PublishAsync,
    SubscribeWithFilter, ... // 20 methods
}

// GOOD: What we need now
type Notifier struct { handlers []func(Event) }
func (n *Notifier) Notify(e Event) { for _, h := range n.handlers { h(e) } }
```

## Fail Loud

```go
// BAD: Silent skip
if err != nil { continue }

// GOOD: Fail loud
if err != nil { return nil, fmt.Errorf("item %d: %w", i, err) }
```

## Trusting Trust

From Thompson's Turing lecture:
- Minimize dependencies (each is trusted code)
- Simplicity aids security (complex code hides bugs)
- Defense in depth (don't trust any single layer)

## The Thompson Test

1. Could brute force work? If yes, use it until proven slow
2. Is this the simplest thing that works?
3. Could I delete this code?
4. Will this fail loudly?
5. Am I building for today or hypothetical future?

## Thompson vs Pike

| Thompson | Pike |
|----------|------|
| Get it working | Get it right |
| Brute force first | Clear over clever |
| Prototype fast, rewrite | Design carefully upfront |
| Delete aggressively | Simplify through design |

Use **Thompson** for: exploring, prototyping, uncertain requirements.

## Concrete Checks (MUST ANSWER)

1. **YAGNI audit:** List every interface, config option, and extension point in the code. Is each one used by existing callers today (not "might be needed later")? If not, delete it.
2. **Speculative code search:** Does the codebase contain any function, parameter, or branch that exists solely to handle a future scenario not yet requested? If yes, remove it.
3. **Silent failure scan:** For every catch/error handler, does it either (a) re-throw with context, (b) return an error value the caller must handle, or (c) log and exit? If any handler swallows the error and continues silently, fix it.
4. **Brute force justification:** For every algorithm more complex than linear scan or nested loop, is there a measured benchmark proving the simpler approach is too slow? If no measurement exists, revert to brute force.
5. **Dependency count:** List every third-party dependency. Does each one save more than 20 lines of trivial code? If not, inline the logic and drop the dependency.

## HARD GATES (mandatory before writing code)

- [ ] **Library-first:** For every subsystem you plan to implement (CLI parsing, HTTP routing, validation, date handling, file locking, etc.), search npm/pypi/crates.io for a mature library first. Only hand-roll if the library would be heavier than your entire project OR you need <20 lines of trivial logic.
- [ ] **Delete test:** For every file/function in your plan, ask: what breaks if I delete this? If nothing breaks, delete it.
- [ ] **Ship test:** Could this ship today as-is? If not, what's the minimum cut to make it shippable?
- [ ] **YAGNI enforcement:** List every feature/option/config in your plan. Is each one explicitly requested or provably needed? Remove anything speculative.
