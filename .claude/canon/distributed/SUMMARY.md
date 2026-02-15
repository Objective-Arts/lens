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

## Concrete Checks (MUST ANSWER)

1. **Stateless verification:** Does the server/service store any data in process memory between requests (in-memory caches, session objects, counters)? If yes, what happens when the process restarts? Move to external persistent storage or accept explicit data loss.
2. **Idempotency test:** List every write operation (create, update, delete). If the same request is sent twice due to a network retry, does each operation produce the same result? If not, add idempotency keys, upsert patterns, or unique constraints.
3. **Network failure handling:** For every external call (HTTP request, database query, filesystem operation), what happens when it (a) times out, (b) returns an error, (c) returns malformed data? If any of these three cases is unhandled, add explicit handling.
4. **Concurrent safety:** If two instances of this code run simultaneously against the same data, does anything corrupt, duplicate, or lose data? If yes, add locking, atomic operations, or conflict resolution.
5. **Retry safety:** Does every retried operation use exponential backoff with jitter? Does it cap the number of retries? Unbounded or fixed-interval retries cause cascading failures.

## HARD GATES (mandatory before writing code)

- [ ] **Idempotency check:** List every write operation. Can each one be safely retried? If not, make it idempotent (use upsert patterns, unique constraints, or idempotency keys).
- [ ] **Failure mode audit:** For every external call (filesystem, network, database), document: what happens when it fails? What happens when it's slow? What happens when it returns garbage?
- [ ] **Stateless check:** Does your server/service store any state in memory between requests? If yes, what happens when the process restarts? Move state to a persistent store.
- [ ] **Concurrent access:** If two processes run your code simultaneously on the same data, what breaks? If anything, add locking or use atomic operations.
