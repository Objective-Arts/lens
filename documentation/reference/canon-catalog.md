---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Skills Reference

Complete catalog of all 75 canon skills organized by category.

---

## Base Brain (10 skills — Always Active)

The 10 computing fundamentals that shape HOW you think about code. Loaded as SUMMARY.md (compressed) into every planning and implementation phase.

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **clarity** | Brian Kernighan | *The Elements of Programming Style* | Clear over clever; debugging is twice as hard as writing code | `/clarity` |
| **pragmatism** | Ken Thompson | Turing Award Lecture | Brute force first, simplest thing that works, fail fast | `/pragmatism` |
| **simplicity** | Rob Pike | Go design philosophy | Small interfaces, measure before optimizing | `/simplicity` |
| **composition** | Doug McIlroy | Unix Philosophy | Do one thing well, write programs to work together | `/composition` |
| **distributed** | Bill Joy | BSD, NFS | Stateless, idempotent, handle failure explicitly | `/distributed` |
| **data-first** | Linus Torvalds | Linux Kernel | Data structures first; algorithms follow naturally | `/data-first` |
| **correctness** | Edsger Dijkstra | *A Discipline of Programming* | Correctness by construction, loop invariants | `/correctness` |
| **algorithms** | Donald Knuth | *The Art of Computer Programming* | Programs as literature, algorithmic rigor | `/algorithms` |
| **abstraction** | Barbara Liskov | Liskov Substitution Principle | Subtypes must be substitutable, type contracts | `/abstraction` |
| **optimization** | John Carmack | Game engine optimization | Pure functions, data-oriented design, measure first | `/optimization` |

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

## Design Patterns (1 skill)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **design-patterns** | Gang of Four | *Design Patterns* | Factory, Strategy, Observer, Decorator | `/design-patterns` |

---

## Refactoring (1 skill)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **refactoring** | Martin Fowler | *Refactoring* | Code smells and safe transformations that preserve behavior | `/refactoring` |

---

## Security (5 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **security-mindset** | (General) | Security Engineering | Think like an attacker; fail securely; defense in depth | `/security-mindset` |
| **owasp** | OWASP Foundation | OWASP Top 10 | Top 10 web vulnerabilities and prevention patterns | `/owasp` |
| **appsec** | Tanya Janca | *Alice and Bob Learn Application Security* | Shift-left security, security champions, DevSecOps | `/appsec` |
| **web-security** | Troy Hunt | Have I Been Pwned | Pragmatic password handling, HTTPS, headers, breach response | `/web-security` |
| **threat-model** | STRIDE framework | *Threat Modeling* | Threat modeling, attack trees, security review checklists | `/threat-model` |

---

## Testing (3 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **test-doubles** | Gerard Meszaros | *xUnit Test Patterns* | Dummy, stub, spy, mock, fake taxonomy | `/test-doubles` |
| **test-strategy** | Mike Cohn | *Succeeding with Agile* | Test pyramid: 70% unit, 20% integration, 10% E2E | `/test-strategy` |
| **legacy** | Michael Feathers | *Working Effectively with Legacy Code* | Characterization tests, seams, sprout method | `/legacy` |

---

## Engineering & Safety (4 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **failure** | Henry Petroski | *Success Through Failure* | Form follows failure; learn from past mistakes | `/failure` |
| **resilience** | Nassim Taleb | *Antifragile* | Via negativa; systems that gain from disorder | `/resilience` |
| **safety** | Nancy Leveson | *Engineering a Safer World* | STAMP framework; accidents emerge from system interactions | `/safety` |
| **style** | Google | Google Coding Standards | Optimize for reader clarity; consistency across languages | `/style` |

---

## Documentation (1 skill)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **docs** | Daniele Procida | Diataxis framework | Split into tutorials, how-to, reference, explanation | `/docs` |

---

## Writing (3 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **brevity** | William Strunk Jr. | *The Elements of Style* | Omit needless words, active voice | `/brevity` |
| **prose** | William Zinsser | *On Writing Well* | Strip to cleanest components, no clutter | `/prose` |
| **editing** | Stephen King | *On Writing* | Kill your darlings, show don't tell | `/editing` |

---

## JavaScript / TypeScript (8 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **typescript** | TypeScript team | TypeScript Handbook | Let inference work; discriminated unions; avoid `any` | `/typescript` |
| **js-safety** | Douglas Crockford | *JavaScript: The Good Parts* | Use only the good parts; avoid eval, with, implied globals | `/js-safety` |
| **js-internals** | Kyle Simpson | *You Don't Know JS* | Scope, closures, `this` binding, types, coercion | `/js-internals` |
| **js-perf** | Web Performance WG | Web Vitals initiative | Core Web Vitals, loading strategy, bundle optimization | `/js-perf` |
| **functional** | Lodash/FP community | FP principles | Readable over clever; map/filter/reduce over loops | `/functional` |
| **react-state** | Dan Abramov | React documentation | UI = f(state); effects synchronize with external systems | `/react-state` |
| **react-test** | Kent C. Dodds | Testing Library | Testing Trophy: integration-first; getByRole queries | `/react-test` |
| **reactivity** | Rich Harris | Svelte/SolidJS philosophy | Compile-time over runtime; shift work to build step | `/reactivity` |

---

## C# (3 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **csharp-depth** | Microsoft C# team | *C# in Depth* | Value vs reference, pattern matching, LINQ execution | `/csharp-depth` |
| **async** | Stephen Cleary | C# async best practices | Async all the way down; never block on async code | `/async` |
| **type-systems** | Anders Hejlsberg | C# language design | Progressive complexity, opt-in features, safe by default | `/type-systems` |

---

## Java (1 skill)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **java** | Joshua Bloch | *Effective Java* | API design for correct usage and defensive programming | `/java` |

---

## Python (4 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **python-idioms** | Python community | *Effective Python* | enumerate, zip, Counter, defaultdict, comprehensions | `/python-idioms` |
| **python-patterns** | Python community | Python best practices | Mutable defaults, generators over lists, keyword-only args | `/python-patterns` |
| **python-advanced** | Guido van Rossum | *Fluent Python* | Generators, lazy evaluation, context managers | `/python-advanced` |
| **python-protocols** | David Beazley | *Python Cookbook* | Data model, special methods, duck typing | `/python-protocols` |

---

## Angular (4 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **angular-core** | Misko Hevery | Angular design philosophy | DI is architecture; constructors do assignment only | `/angular-core` |
| **angular-perf** | Minko Gechev | Angular performance | Lazy loading, OnPush change detection, bundle budgets | `/angular-perf` |
| **angular-arch** | Angular team | Angular Style Guide | Organize by feature, LIFT principle | `/angular-arch` |
| **rxjs** | RxJS maintainers | RxJS documentation | Streams not single values; higher-order operators | `/rxjs` |

---

## Database (2 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **sql** | Joe Celko | *SQL for Smarties* | Think in sets, not procedures; no cursors | `/sql` |
| **sql-perf** | Markus Winand | *SQL Performance Explained* | Indexes and B-trees; understand how databases find data | `/sql-perf` |

---

## UI/UX (12 skills)

### Philosophy & Psychology

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **design** | Dieter Rams | 10 Design Principles | Less but better; form follows function | `/design` |
| **usability** | Don Norman | *The Design of Everyday Things* | Affordances, signifiers, feedback <100ms | `/usability` |
| **personas** | Alan Cooper | *About Face* | Goal-directed design, eliminate excise | `/personas` |

### Visual & Typography

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **visual** | Material Design | Google Material Design | Shadow system, color discipline, minimalism | `/visual` |
| **typography** | Typography experts | Typography principles | Type-first hierarchy, scale, line length | `/typography` |
| **frontend-design** | Design thinking | Frontend best practices | Bold aesthetic direction, production-grade interfaces | `/frontend-design` |

### Motion & Interaction

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **motion** | Animation principles | Animation best practices | Motion communicates meaning; easing and stagger | `/motion` |
| **interaction** | Don Norman | *The Design of Everyday Things* | Touch constraints, Fitts's Law, thumb zones | `/interaction` |

### Patterns & Components

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **mobile** | Mobile-first design | Mobile best practices | Mobile first, forms as conversations | `/mobile` |
| **components** | Brad Frost | *Atomic Design* | Atoms, molecules, organisms; BEM naming | `/components` |

### Governance & Handoff

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **tokens** | Design systems | Design systems practice | Token hierarchy, semantic versioning, governance | `/tokens` |
| **handoff** | Design-dev collaboration | Design systems practice | Hot potato process, component checklists | `/handoff` |

---

## Visualization (4 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **charts** | Edward Tufte | *The Visual Display of Quantitative Information* | Data-ink ratio, lie factor, eliminate chartjunk | `/charts` |
| **d3** | Mike Bostock | D3.js documentation | Data joins, reusable chart pattern | `/d3` |
| **dashboards** | Stephen Few | *Information Dashboard Design* | Single screen, at a glance, sparse color | `/dashboards` |
| **data-story** | Cole Nussbaumer Knaflic | *Storytelling with Data* | Story structure, eliminate clutter, audience context | `/data-story` |

---

## Business (6 skills)

| Skill | Master | Source | Key Principle | Invoke |
|-------|--------|--------|---------------|--------|
| **competition** | Michael Porter | *Competitive Strategy* | Five Forces, generic strategies | `/competition` |
| **leadership** | Ben Horowitz | *The Hard Thing About Hard Things* | Wartime vs peacetime, the struggle | `/leadership` |
| **management** | Andy Grove | *High Output Management* | OKRs, one-on-ones, managerial leverage | `/management` |
| **moats** | Hamilton Helmer | *7 Powers* | Durable competitive advantages | `/moats` |
| **strategy** | Richard Rumelt | *Good Strategy, Bad Strategy* | Diagnosis, guiding policy, coherent action | `/strategy` |
| **platforms** | Ben Thompson | Stratechery | Aggregation theory, demand aggregation | `/platforms` |

---

## Utility Canon (3 skills)

| Skill | Purpose | Invoke |
|-------|---------|--------|
| **code-scan** | Read-only quality analysis | `/code-scan` |
| **deadcode** | Dead code detection across polyglot projects | `/deadcode` |
| **implement** | Implementation patterns from plans | `/implement` |

---

## Summary

| Category | Count |
|----------|-------|
| Base Brain | 10 |
| Design Patterns | 1 |
| Refactoring | 1 |
| Security | 5 |
| Testing | 3 |
| Engineering & Safety | 4 |
| Documentation | 1 |
| Writing | 3 |
| JavaScript/TypeScript | 8 |
| C# | 3 |
| Java | 1 |
| Python | 4 |
| Angular | 4 |
| Database | 2 |
| UI/UX | 12 |
| Visualization | 4 |
| Business | 6 |
| Utility | 3 |
| **Total** | **75** |
