# /distributed Summary

> "No matter who you are, most of the smartest people work for someone else."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Build what's missing** | Solve real pain points, not theoretical problems |
| **Pragmatism over purity** | Ship in 6 weeks, not 18 months of architecture |
| **Performance is a feature** | First make it work, then make it fast—but ship only when fast enough |
| **Joy's Law** | Leverage collective intelligence: open source, open protocols |

## Distributed Systems Principles (from NFS)

| Principle | Why |
|-----------|-----|
| **Stateless servers** | Server crashes don't lose client state |
| **Idempotent operations** | Safe to retry on timeout |
| **Handle failure explicitly** | Networks fail. Design for it |

```
READ file, offset=100, length=50
# Execute 10 times, get the same bytes
```

## Vi Philosophy (Composable Design)

```
d2w  - delete 2 words
3dd  - delete 3 lines
ciw  - change inner word

# Commands are a language: verb + count + motion
```

**Principle:** Small primitives that compose > many special commands

## The Joy Test

1. Does this solve a real problem people actually have?
2. Is it pragmatic? Will it ship?
3. What happens at 10x users, 100x data?
4. Stateless where possible?
5. Idempotent operations?
6. How does it fail—graceful or catastrophic?
7. Is it interoperable with other systems?

## When to Use

- Distributed systems spanning multiple machines
- Systems that must handle network failure
- Designing for scale and reliability
