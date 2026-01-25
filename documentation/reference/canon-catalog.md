# Canon Masters Reference

Complete catalog of all canon masters organized by layer and domain.

---

## Baseline Brain (Always Active)

Six masters that shape HOW you think about code:

| Master | Works | Key Principle | Invoke |
|--------|-------|---------------|--------|
| **Kernighan** | Practice of Programming, Elements of Style | Simplicity, clarity, generality | `/kernighan` |
| **Thompson** | Unix, UTF-8, Go | "When in doubt, use brute force" | `/thompson` |
| **Pike** | Notes on Programming in C, Go Proverbs | "A little copying is better than a little dependency" | `/pike` |
| **Joy** | BSD, vi, NFS | "Design for failure from the start" | `/joy` |
| **Linus** | Linux kernel, Git | "Good programmers worry about data structures" | `/linus` |
| **Dijkstra** | EWDs, A Discipline of Programming | Correctness by construction | `/dijkstra` |

### Productive Tensions

```
Thompson ←——————→ Dijkstra
(pragmatism)      (rigor)

Linus ←——————→ Pike
(direct)          (abstract)

Kernighan ←——————→ Thompson
(clarity first)    (working first)
```

---

## Base Practices (Always Active)

### Security

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Schneier** | Security Engineering | Threat modeling, defense in depth, think like an attacker | `/schneier` |
| **OWASP** | Top 10, Guidelines | Injection, XSS, CSRF, auth failures | `/owasp` |

### Testing

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Dodds** | Testing Library, Testing Trophy | Integration > Unit > E2E, test behavior not implementation | `/dodds` |
| **Meszaros** | xUnit Test Patterns | Test doubles (stub, spy, mock, fake), setup patterns | `/meszaros` |
| **Feathers** | Working Effectively with Legacy Code | Characterization tests, seams, safe refactoring | `/feathers` |

### Documentation

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Procida** | Diátaxis | Tutorials, how-tos, reference, explanation | `/procida` |

---

## Domain Canon

### Java

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Bloch** | Effective Java | Static factories, immutability, defensive copies, ThreadLocal | `/bloch` |

### JavaScript

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Simpson** | You Don't Know JS | Closures, this binding, async patterns, event loop | `/simpson` |
| **Cherny** | Programming TypeScript | Type-level programming, generics, inference | `/cherny` |
| **Crockford** | JavaScript: The Good Parts | Avoiding bad parts, disciplined subset | `/crockford` |

### C#

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Skeet** | C# in Depth | Value vs reference, nullable types, pattern matching, LINQ | `/skeet` |
| **Cleary** | Concurrency in C# | Async all the way, CancellationToken, ConfigureAwait | `/cleary` |
| **Hejlsberg** | C# Language Design | Progressive disclosure, language philosophy | `/hejlsberg` |

### React

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Abramov** | Redux, React Blog | Composition, hooks, unidirectional flow, mental models | `/abramov` |

### Angular

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Hevery** | Angular | Dependency injection, change detection, signals | `/hevery` |
| **Papa** | Style Guide | File structure, naming, patterns | `/papa` |

### D3/Visualization

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Bostock** | D3.js, Observable | Selections, data-joins, scales, transitions | `/bostock` |
| **Tufte** | Visual Display | Data-ink ratio, chartjunk, small multiples | `/tufte` |
| **Few** | Dashboard Design | Clarity, context, comparison | `/few` |
| **Knaflic** | Storytelling with Data | Data narrative, visual hierarchy | `/knaflic` |

### Go

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Pike** | Go Proverbs | Applied to Go idioms (also in Baseline Brain) | `/pike` |

---

## Business Canon

### Base

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Strunk & White** | Elements of Style | Brevity, clarity, omit needless words | `/strunk` |
| **Zinsser** | On Writing Well | Simplicity, humanity | `/zinsser` |
| **Grove** | High Output Management | Leverage, output orientation | `/grove` |

### Strategy

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Porter** | Competitive Advantage | Five Forces, value chains | `/porter` |
| **Rumelt** | Good Strategy Bad Strategy | Kernel of strategy, coherent actions | `/rumelt` |
| **Helmer** | 7 Powers | Scale, network effects, switching costs | `/helmer` |
| **Thompson** | Stratechery | Aggregation theory, platform dynamics | `/thompson-stratechery` |
| **Horowitz** | Hard Thing About Hard Things | Peacetime/wartime CEO | `/horowitz` |

---

## CS Foundations (Reference)

Available as reference for deeper work:

| Master | Works | Contribution | Invoke |
|--------|-------|--------------|--------|
| **Knuth** | TAOCP | Algorithms, literate programming | `/knuth` |
| **Liskov** | CLU, LSP | Abstraction, substitution | `/liskov` |
| **Carmack** | .plan files | Performance discipline | `/carmack` |
| **McIlroy** | Unix Philosophy | Do one thing well | `/mcilroy` |
