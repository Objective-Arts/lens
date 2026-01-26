---
name: pike
description: "Pike's simplicity and systems philosophy"
allowed-tools: []
---

# Pike: Simplicity is Complicated

Rob Pike's core belief: **Simplicity is the ultimate sophistication.** The best code is the code that isn't there. When in doubt, leave it out.

## The Foundational Principle

> "Complexity is multiplicative: fixing a problem by making one part of the system more complex slowly but surely adds complexity to other parts."

Every added feature, abstraction, or clever trick has a cost. That cost compounds. The goal is not to build the most powerful system, but the simplest system that works.

---

## Pike's Rules of Programming

From "Notes on Programming in C" (1989):

### Rule 1: You Can't Tell Where a Program Will Spend Its Time

Bottlenecks occur in surprising places. Don't guess. Don't optimize without data.

### Rule 2: Measure

> "Measure. Don't tune for speed until you've measured, and even then don't unless one part of the code overwhelms the rest."

Intuition is unreliable. Profilers don't lie. Measure before you touch anything.

### Rule 3: Fancy Algorithms Are Slow When N Is Small

And N is usually small. Linear search is fine for 20 items. Don't use a red-black tree when an array will do.

### Rule 4: Fancy Algorithms Are Buggier Than Simple Ones

They're harder to implement, harder to debug, and the constant factors are often large. Simple algorithms with simple data structures are easier to get right.

### Rule 5: Data Dominates

> "If you've chosen the right data structures and organized things well, the algorithms will almost always be self-evident."

Get the data structures right. The code follows.

---

## Core Principles

### The Bigger the Interface, the Weaker the Abstraction

Small interfaces are powerful. One or two methods. Not fifteen.

```python
# Not this: monolithic interface
class DataStore:
    def get(self, key): ...
    def put(self, key, value): ...
    def delete(self, key): ...
    def list(self, prefix): ...
    def watch(self, key): ...
    def transaction(self, func): ...
    def backup(self, path): ...
    # ... 15 more methods

# This: small, composable interfaces
class Reader:
    def read(self, key): ...

class Writer:
    def write(self, key, value): ...
```

### Composition Over Inheritance

Don't build monoliths. Build small pieces that compose.

### Clear is Better Than Clever

If someone has to puzzle over your code, you've failed. The clever one-liner that saves 3 lines costs hours of debugging.

### A Little Copying Is Better Than a Little Dependency

Don't import a library for one function. Copy the 10 lines you need.

---

## Simplicity is Complicated

From Pike's dotGo 2015 talk:

> "Simplicity is complicated because it requires hard work to achieve and education to appreciate."

Simplicity is not:
- Lack of features
- Primitive or limited
- Easy to design

Simplicity is:
- Hard-won clarity
- Careful removal of the unnecessary
- The result of saying "no" repeatedly

---

## The Pike Test

Before committing code, ask:

1. **Is this the simplest solution?** Could it be simpler?
2. **Is it clear?** Will someone understand it without explanation?
3. **Did I measure before optimizing?** Or am I guessing?
4. **Are my interfaces small?** One or two methods?
5. **Could I delete something?** Less code is better code.

---

## When Reviewing Code

- [ ] No premature optimization (measured first?)
- [ ] Simplest algorithm that works (not fanciest)
- [ ] Interfaces are small (1-3 methods)
- [ ] Clear over clever (no puzzles)
- [ ] Minimal dependencies (copied small utilities?)
- [ ] Composition over monoliths

---

## Relationship to Other Skills

For detailed guidance on specific topics, Pike defers to:

- **Debugging, Testing, Performance, Interfaces** → Use `kernighan` (full Practice of Programming coverage)
- **Linux kernel code** → Use `linus` (kernel coding style)
- **Distributed systems** → Use `bill-joy` (statelessness, idempotency)
- **CLI pipelines** → Use `mcilroy` (Unix philosophy)

Pike is for **systems thinking and simplicity philosophy**—the mindset, not the mechanics.

## Sources

- Pike, "Notes on Programming in C" (1989)
- Pike, "Simplicity is Complicated" (dotGo 2015)
- Kernighan & Pike, "The Practice of Programming" (1999)
- Kernighan & Pike, "The Unix Programming Environment" (1984)

---

*"Simplicity is complicated, but the clarity it provides is worth the effort."* — Rob Pike
