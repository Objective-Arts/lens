---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Skills Reference

Complete catalog of all skills organized by layer and domain.

---

## Baseline Brain (Always Active)

Six core skills that shape HOW you think about code:

| Skill | Source | Key Principle | Invoke |
|-------|--------|---------------|--------|
| **clarity** | Practice of Programming, Elements of Style | Simplicity, clarity, generality | `/clarity` |
| **pragmatism** | Unix, UTF-8, Go | "When in doubt, use brute force" | `/pragmatism` |
| **simplicity** | Notes on Programming in C, Go Proverbs | "A little copying is better than a little dependency" | `/simplicity` |
| **distributed** | BSD, vi, NFS | "Design for failure from the start" | `/distributed` |
| **data-first** | Linux kernel, Git | "Good programmers worry about data structures" | `/data-first` |
| **correctness** | EWDs, A Discipline of Programming | Correctness by construction | `/correctness` |

### Productive Tensions

```
pragmatism ←——————→ correctness
(get it working)    (rigor)

data-first ←——————→ simplicity
(direct)            (abstract)

clarity ←——————→ pragmatism
(clarity first)    (working first)
```

---

## Base Practices (Always Active)

### Security

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **security-mindset** | Security Engineering | Threat modeling, defense in depth, think like an attacker | `/security-mindset` |
| **owasp** | Top 10, Guidelines | Injection, XSS, CSRF, auth failures | `/owasp` |

### Testing

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **react-test** | Testing Library, Testing Trophy | Integration > Unit > E2E, test behavior not implementation | `/react-test` |
| **test-doubles** | xUnit Test Patterns | Test doubles (stub, spy, mock, fake), setup patterns | `/test-doubles` |
| **legacy** | Working Effectively with Legacy Code | Characterization tests, seams, safe refactoring | `/legacy` |

### Documentation

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **docs** | Diátaxis | Tutorials, how-tos, reference, explanation | `/docs` |

### Writing

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **prose** | On Writing Well | Clarity, simplicity, remove clutter | `/prose` |
| **brevity** | Elements of Style | Omit needless words, active voice, be specific | `/brevity` |
| **editing** | On Writing | Kill your darlings, cut 10%, honest writing | `/editing` |

### Engineering Philosophy

Five skills forming a complete philosophy of building:

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **failure** | To Engineer Is Human, Design Paradigms | Form follows failure, case study methodology, constraints drive innovation | `/failure` |
| **safety** | Engineering a Safer World, Safeware | System accidents, STAMP/STPA, safety constraints, humans not the problem | `/safety` |
| **resilience** | Antifragile, Black Swan, Skin in the Game | Antifragility, via negativa, optionality, bounded downside | `/resilience` |
| **composition** | Unix Philosophy | Do one thing well, pipelines, composition | `/composition` |
| **optimization** | .plan files, Game Engines | Performance discipline, ship it, pragmatic optimization | `/optimization` |

**The Engineering Pillars**:
- failure: Learn from past failures (historical lens)
- safety: Prevent future failures systematically (safety lens)
- resilience: Design systems that gain from failure (antifragility lens)
- composition: Compose small, focused tools (Unix philosophy)
- optimization: Ship working software, measure before optimizing (pragmatism)

---

## Domain Skills

### Python

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **python-idioms** | Transformative Python Talks | Pythonic idioms, generators, decorators | `/python-idioms` |
| **python-advanced** | Python Essential Reference | Deep internals, concurrency, metaprogramming | `/python-advanced` |
| **python-protocols** | Fluent Python | Data model, protocols, type hints | `/python-protocols` |
| **python-patterns** | Effective Python | 90 specific ways, practical patterns | `/python-patterns` |

### Java

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **java** | Effective Java | Static factories, immutability, defensive copies, ThreadLocal | `/java` |

### JavaScript

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **js-internals** | You Don't Know JS | Closures, this binding, async patterns, event loop | `/js-internals` |
| **typescript** | Programming TypeScript | Type-level programming, generics, inference | `/typescript` |
| **js-safety** | JavaScript: The Good Parts | Avoiding bad parts, disciplined subset | `/js-safety` |

### C#

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **csharp-depth** | C# in Depth | Value vs reference, nullable types, pattern matching, LINQ | `/csharp-depth` |
| **async** | Concurrency in C# | Async all the way, CancellationToken, ConfigureAwait | `/async` |
| **type-systems** | C# Language Design | Progressive disclosure, language philosophy | `/type-systems` |

### React

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **react-state** | Redux, React Blog | Composition, hooks, unidirectional flow, mental models | `/react-state` |

### Angular

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **angular-core** | Angular | Dependency injection, change detection, signals | `/angular-core` |
| **angular-arch** | Style Guide | File structure, naming, patterns | `/angular-arch` |

### D3/Visualization

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **d3** | D3.js, Observable | Selections, data-joins, scales, transitions | `/d3` |
| **charts** | Visual Display | Data-ink ratio, chartjunk, small multiples | `/charts` |
| **dashboards** | Dashboard Design | Clarity, context, comparison | `/dashboards` |
| **data-story** | Storytelling with Data | Data narrative, visual hierarchy | `/data-story` |

### Go

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **simplicity** | Go Proverbs | Applied to Go idioms (also in Baseline Brain) | `/simplicity` |

---

## Business Skills

### Base

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **brevity** | Elements of Style | Brevity, clarity, omit needless words | `/brevity` |
| **prose** | On Writing Well | Simplicity, humanity | `/prose` |
| **management** | High Output Management | Leverage, output orientation | `/management` |

### Strategy

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **competition** | Competitive Advantage | Five Forces, value chains | `/competition` |
| **strategy** | Good Strategy Bad Strategy | Kernel of strategy, coherent actions | `/strategy` |
| **moats** | 7 Powers | Scale, network effects, switching costs | `/moats` |
| **platforms** | Stratechery | Aggregation theory, platform dynamics | `/platforms` |
| **leadership** | Hard Thing About Hard Things | Peacetime/wartime CEO | `/leadership` |

### Shared from Engineering

| Skill | Source | Business Application | Invoke |
|-------|--------|---------------------|--------|
| **resilience** | Antifragile, Black Swan, Skin in the Game | Risk management, optionality, antifragile orgs | `/resilience` |
| **failure** | To Engineer Is Human, Design Paradigms | Learning from failures, constraints drive innovation | `/failure` |

---

## UI/UX Skills

12 skills for building beautiful interfaces without being a designer.

### Philosophy & Psychology

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **design** | 10 Principles of Good Design | Less but better, 3 colors max, 4px grid | `/design` |
| **usability** | Design of Everyday Things | Affordances, feedback, mental models | `/usability` |
| **personas** | About Face | Goal-directed design, eliminate excise, undo over confirmation | `/personas` |

### Visual & Typography

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **visual** | Apple Design Language | Minimalism, material honesty, 4-level shadows | `/visual` |
| **typography** | Microsoft Fluent | Type-first hierarchy, content over chrome | `/typography` |

### Motion & Interaction

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **motion** | Material Design | Meaningful transitions, ease-out enter, 300ms max | `/motion` |
| **interaction** | Sketching User Experiences | Input fundamentals, chunking, two-handed input | `/interaction` |

### Patterns & Components

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **mobile** | Mobile First, Web Form Design | Thumb zones, 44px touch targets, inline validation | `/mobile` |
| **components** | Atomic Design | Atoms → Molecules → Organisms, design tokens | `/components` |

### Governance & Handoff

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **tokens** | Modular Web Design | Versioning, documentation, design tokens | `/tokens` |
| **handoff** | Design System Handbook | Hot potato handoff, designer-dev collaboration | `/handoff` |

### Data Visualization (shared with Visualization)

| Skill | Source | Key Principles | Invoke |
|-------|--------|----------------|--------|
| **charts** | Visual Display of Quantitative Information | Data-ink ratio, no chartjunk | `/charts` |

---

## CS Foundations (Reference)

Available as reference for deeper work:

| Skill | Source | Contribution | Invoke |
|-------|--------|--------------|--------|
| **algorithms** | TAOCP | Algorithms, literate programming | `/algorithms` |
| **abstraction** | CLU, LSP | Abstraction, substitution | `/abstraction` |
| **design-patterns** | Design Patterns | Classic OOP patterns | `/design-patterns` |
