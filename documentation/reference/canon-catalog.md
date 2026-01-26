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

### Writing

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Zinsser** | On Writing Well | Clarity, simplicity, remove clutter | `/zinsser` |
| **Strunk & White** | Elements of Style | Omit needless words, active voice, be specific | `/strunk-white` |
| **King** | On Writing | Kill your darlings, cut 10%, honest writing | `/king` |

### Engineering Philosophy

Five masters forming a complete philosophy of building:

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Petroski** | To Engineer Is Human, Design Paradigms | Form follows failure, case study methodology, constraints drive innovation | `/petroski` |
| **Leveson** | Engineering a Safer World, Safeware | System accidents, STAMP/STPA, safety constraints, humans not the problem | `/leveson` |
| **Taleb** | Antifragile, Black Swan, Skin in the Game | Antifragility, via negativa, optionality, bounded downside | `/taleb` |
| **McIlroy** | Unix Philosophy | Do one thing well, pipelines, composition | `/mcilroy` |
| **Carmack** | .plan files, Game Engines | Performance discipline, ship it, pragmatic optimization | `/carmack` |

**The Engineering Pillars**:
- Petroski: Learn from past failures (historical lens)
- Leveson: Prevent future failures systematically (safety lens)
- Taleb: Design systems that gain from failure (antifragility lens)
- McIlroy: Compose small, focused tools (Unix philosophy)
- Carmack: Ship working software, measure before optimizing (pragmatism)

---

## Domain Canon

### Python

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Hettinger** | Transformative Python Talks | Pythonic idioms, generators, decorators | `/hettinger` |
| **Beazley** | Python Essential Reference | Deep internals, concurrency, metaprogramming | `/beazley` |
| **Ramalho** | Fluent Python | Data model, protocols, type hints | `/ramalho` |
| **Slatkin** | Effective Python | 90 specific ways, practical patterns | `/slatkin` |

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

### Shared from Engineering Canon

| Master | Works | Business Application | Invoke |
|--------|-------|---------------------|--------|
| **Taleb** | Antifragile, Black Swan, Skin in the Game | Risk management, optionality, antifragile orgs | `/taleb` |
| **Petroski** | To Engineer Is Human, Design Paradigms | Learning from failures, constraints drive innovation | `/petroski` |

---

## UI/UX Canon

12 experts for building beautiful interfaces without being a designer.

### Philosophy & Psychology

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Rams** | 10 Principles of Good Design | Less but better, 3 colors max, 4px grid | `/rams` |
| **Norman** | Design of Everyday Things | Affordances, feedback, mental models | `/norman` |
| **Cooper** | About Face | Goal-directed design, eliminate excise, undo over confirmation | `/cooper` |

### Visual & Typography

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Ive** | Apple Design Language | Minimalism, material honesty, 4-level shadows | `/ive` |
| **Kruzeniski** | Microsoft Fluent | Type-first hierarchy, content over chrome | `/kruzeniski` |

### Motion & Interaction

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Duarte** | Material Design | Meaningful transitions, ease-out enter, 300ms max | `/duarte` |
| **Buxton** | Sketching User Experiences | Input fundamentals, chunking, two-handed input | `/buxton` |

### Patterns & Components

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Wroblewski** | Mobile First, Web Form Design | Thumb zones, 44px touch targets, inline validation | `/wroblewski` |
| **Frost** | Atomic Design | Atoms → Molecules → Organisms, design tokens | `/frost` |

### Governance & Handoff

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Curtis** | Modular Web Design | Versioning, documentation, design tokens | `/curtis` |
| **Mall** | Design System Handbook | Hot potato handoff, designer-dev collaboration | `/mall` |

### Data Visualization (shared with Visualization Canon)

| Master | Works | Key Principles | Invoke |
|--------|-------|----------------|--------|
| **Tufte** | Visual Display of Quantitative Information | Data-ink ratio, no chartjunk | `/tufte` |

---

## CS Foundations (Reference)

Available as reference for deeper work:

| Master | Works | Contribution | Invoke |
|--------|-------|--------------|--------|
| **Knuth** | TAOCP | Algorithms, literate programming | `/knuth` |
| **Liskov** | CLU, LSP | Abstraction, substitution | `/liskov` |
| **Gang of Four** | Design Patterns | Classic OOP patterns | `/gang-of-four` |
