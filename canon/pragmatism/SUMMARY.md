# /thompson Summary

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
