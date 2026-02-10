# Skill Hierarchy Map v3

Complete map of Lens skill architecture: orchestrators, phases, canon skills, and their interconnections.

---

## System Overview

```
TIER 1: Workflow Orchestrators (user-invoked commands)
  |
  +---> TIER 2: Phase Skills (12 sequential phases per pipeline + 3 machine gates)
          |
          +---> TIER 3: Canon Skills (75 master-sourced expertise loaded by phases)
                  |
                  +---> Authorities: Books, frameworks, and masters behind each skill
```

---

## Tier 1: Workflow Orchestrators

Top-level commands. These are what users invoke directly.

### Heavy Workflows (12-phase pipelines)

| Command | Purpose |
|---------|---------|
| `/build` | Create new features from scratch |
| `/improve` | Refine existing code |

### Autonomous Loop

| Command | Purpose |
|---------|---------|
| `/ralph-loop` | PRD-driven implementation (6 phases per item, up to 50 iterations) |

### Light Workflows (no pipeline)

| Command | Purpose |
|---------|---------|
| `/quick-edit` | Add a field, rename, small fix |
| `/quick-clean` | Surface tidy post quick-edit (smells + naming) |
| `/final-polish` | Pre-review refinement |

### Read-Only Scans

| Command | Purpose |
|---------|---------|
| `/gemini-scan` | Gemini review (report only) |
| `/qodana-scan` | Static analysis (report only) |
| `/ai-smell-scan` | AI code patterns (report only) |
| `/refactor-scan` | Refactoring opportunities (report only) |
| `/dedupe-scan` | Duplicate code (report only) |
| `/naming-review` | Name clarity check |

### Utilities

| Command | Purpose |
|---------|---------|
| `/generate-docs` | Generate documentation |
| `/run-tests` | Execute tests |
| `/write-tests-run` | Write and run tests |
| `/explain-skill` | Explain what a skill does |
| `/session-status` | Show active primitives |
| `/skill-usage-report` | Report on skill usage |
| `/lens` | Home base, status and help |

---

## Tier 2: Phase Skills

The 12 phases that `/build` and `/improve` run in sequence. Each phase must pass its gate before the next begins. Machine gates run `npm run build && npm test` between phase groups.

| # | Phase Skill | Gate Marker | Purpose |
|---|-------------|-------------|---------|
| 1 | `create-plan` | PLAN_COMPLETE | Design approach, scope, files, risks |
| 2 | `structure-first` | STRUCTURE_COMPLETE | Define data structures and interfaces |
| 3 | `implement-plan` | IMPLEMENT_COMPLETE | Write the code |
| 3.5 | *machine-gate* | exit code 0 | `npm run build && npm test` |
| 4 | `refactor-check-fix` | REFACTOR_COMPLETE | Enforce constraints (30 lines/fn, 300 lines/file) |
| 5 | `dedupe-fix` | DEDUPE_COMPLETE | Consolidate duplicated code |
| 6 | `gemini-fix` | FIX_COMPLETE | External code review via Gemini MCP |
| 7 | `qodana-fix` | VERIFIED_CLEAN | Static analysis via Qodana MCP |
| 7.5 | *machine-gate* | exit code 0 | `npm run build && npm test` |
| 8 | `adversarial-security-review` | VERIFIED_CLEAN | Security audit (attacker mindset) |
| 9 | `write-tests-run` | TEST_COMPLETE | Write and run tests |
| 10 | `ai-smell-fix` | AI_SMELL_COMPLETE | Deep AI smell removal → writes lessons that train phases 1-5 |
| 11 | `codex-fix` | CODEX_CHECK_COMPLETE | Fast pattern scan + targeted fixes |
| 11.5 | *machine-gate* | exit code 0 | `npm run build && npm test` |
| 12 | `write-tests-run` | TEST_COMPLETE | Re-verify tests after cleanup |

---

## Tier 2 -> Tier 3: Which Canon Skills Each Phase Loads

### Base Brain (10 skills, loaded by phases 1-4)

Every planning and implementation phase loads these 10 as SUMMARY.md (compressed):

| # | Canon Skill | Master | Core Principle |
|---|-------------|--------|----------------|
| 1 | `clarity` | Brian Kernighan | Clear over clever; debugging is twice as hard as writing |
| 2 | `pragmatism` | Ken Thompson | Brute force first, simplest thing that works |
| 3 | `simplicity` | Rob Pike | Small interfaces, measure before optimizing |
| 4 | `composition` | Doug McIlroy | Do one thing well, compose with pipes |
| 5 | `distributed` | Bill Joy | Stateless, idempotent, handle failure explicitly |
| 6 | `data-first` | Linus Torvalds | Data structures first, algorithms follow |
| 7 | `correctness` | Edsger Dijkstra | Correctness by construction, loop invariants |
| 8 | `algorithms` | Donald Knuth | Algorithmic rigor, literate programming |
| 9 | `abstraction` | Barbara Liskov | Substitution principle, type contracts |
| 10 | `optimization` | John Carmack | Pure functions, measure before optimizing |

### Per-Phase Canon Loading

```
Phase 1: create-plan
  ALWAYS: Base Brain (10)
  IF auth/tokens/passwords/encryption:
    + security-mindset (SKILL.md)
    + owasp (SKILL.md)

Phase 2: structure-first
  ALWAYS: Base Brain (10)
  IF *.ts files:
    + typescript (SKILL.md)

Phase 3: implement-plan
  ALWAYS: Base Brain (10)
  IF *.ts files:
    + typescript (SKILL.md)
  IF auth/tokens/passwords/encryption:
    + security-mindset (SKILL.md)
    + owasp (SKILL.md)

Phase 4: refactor-check-fix
  ALWAYS: Base Brain (10)
  ALWAYS: + design-patterns (SUMMARY.md)
  ALWAYS: + refactoring (SUMMARY.md)

Phase 5: dedupe-fix
  ALWAYS: composition (SKILL.md)
  ALWAYS: clarity (SKILL.md)
  ALWAYS: simplicity (SKILL.md)

Phase 6: gemini-fix
  NO CANON (uses Gemini MCP tool for external review)

Phase 7: qodana-fix
  NO CANON (uses Qodana MCP tools for static analysis)

Phase 8: adversarial-security-review
  ALWAYS: security-mindset (SKILL.md)
  ALWAYS: owasp (SKILL.md)
  ALWAYS: web-security (SKILL.md)

Phase 9: write-tests-run
  ALWAYS: test-doubles (SKILL.md)
  ALWAYS: test-strategy (SKILL.md)
  IF auth/tokens/passwords/encryption:
    + security-mindset (SKILL.md)

Phase 10: ai-smell-fix
  NO CANON (algorithmic antipattern detection)

Phase 11: codex-fix
  NO CANON (pattern scan against quality-gate rules)

Phase 12: write-tests-run (re-verify)
  ALWAYS: test-doubles (SKILL.md)
  ALWAYS: test-strategy (SKILL.md)
```

### Light Workflow Canon Loading

```
/quick-edit
  ALWAYS: clarity, refactoring, style
  IF bug fix: + legacy
  IF validation: + owasp
  IF database: + sql
  IF *.ts/*.tsx: + typescript
  IF *.js/*.jsx: + js-safety
  IF *.spec.ts/*.test.ts: + react-test, test-doubles
  IF *.java: + java
  IF *Test.java: + test-doubles
  IF *.py: + python-idioms, python-patterns
  IF test_*.py: + test-doubles
  IF *.cs: + csharp-depth
  IF *.go: + simplicity

/quick-clean
  ALWAYS: clarity, refactoring, style

/final-polish
  NO CANON (manual review checklist)
```

### Ralph Loop Canon Loading

Per-item phases use `software-base.yaml` ralph skill mapping:

```
ralph-loop per-item phases:
  plan:    clarity, simplicity, correctness, composition, data-first, distributed
  build:   clarity, simplicity, java, abstraction, design-patterns, pragmatism, optimization
  refactor: clarity, legacy, design-patterns, distributed
  test:    test-doubles, test-strategy, legacy
  review:  security-mindset, owasp, failure, safety, resilience
  doc:     docs, brevity, prose, editing

ralph-loop auto-invoke (conditional):
  IF *.tsx/*.jsx/*.vue:   + components, visual, usability
  IF *.css/*.scss:        + design
  IF *.ts (non-UI):       + typescript
  IF React files:         + react-state
  IF form/input/validate: + mobile, usability
  IF animation/motion:    + motion
  IF mobile/responsive:   + mobile, interaction
  IF auth/login/password: + security-mindset, owasp
  IF test/spec:           + react-test
  IF chart/graph/viz:     + d3
  IF system design:       + resilience, failure
  IF design system:       + tokens
  IF typography:          + typography
```

---

## Tier 3: Complete Canon Skill Directory

All 75 canon skills organized by category, with their master authority and source.

### Computing Fundamentals (10 skills) — The Base Brain

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `clarity` | Brian Kernighan | *The Elements of Programming Style* | Clear over clever; debugging is twice as hard as writing code |
| `pragmatism` | Ken Thompson | Turing Award Lecture | Brute force first, simplest thing that works, fail fast |
| `simplicity` | Rob Pike | Go design philosophy | Small interfaces, measure before optimizing |
| `composition` | Doug McIlroy | Unix Philosophy | Do one thing well, write programs to work together |
| `correctness` | Edsger Dijkstra | *A Discipline of Programming* | Structured programming, loop invariants, proven correctness |
| `data-first` | Linus Torvalds | Linux Kernel Coding Standards | Data structures first; algorithms follow naturally |
| `algorithms` | Donald Knuth | *The Art of Computer Programming* | Programs as literature, algorithmic rigor |
| `abstraction` | Barbara Liskov | Liskov Substitution Principle | Subtypes must be substitutable, type contracts |
| `optimization` | John Carmack | Game engine optimization | Pure functions, data-oriented design, measure first |
| `design-patterns` | Gang of Four | *Design Patterns* | Factory, Strategy, Observer, Decorator |

### Refactoring (1 skill)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `refactoring` | Martin Fowler | *Refactoring* | Code smells and safe transformations that preserve behavior |

### Security (5 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `security-mindset` | (General) | Security principles | Think like an attacker; fail securely; defense in depth |
| `owasp` | OWASP Foundation | OWASP Top 10 | Top 10 web vulnerabilities and prevention patterns |
| `web-security` | Troy Hunt | Have I Been Pwned | Pragmatic password handling, HTTPS, headers, breach response |
| `appsec` | Tanya Janca | *Alice and Bob Learn Application Security* | Shift-left security, security champions, DevSecOps |
| `threat-model` | STRIDE framework | *Threat Modeling* | Threat modeling, attack trees, security review checklists |

### Testing (3 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `test-doubles` | Gerard Meszaros | *xUnit Test Patterns* | Dummy, stub, spy, mock, fake taxonomy |
| `test-strategy` | Mike Cohn | *Succeeding with Agile* | Test pyramid: 70% unit, 20% integration, 10% E2E |
| `legacy` | Michael Feathers | *Working Effectively with Legacy Code* | Characterization tests, seams, sprout method |

### Engineering & Safety (4 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `failure` | Henry Petroski | *Success Through Failure* | Form follows failure; learn from past mistakes |
| `resilience` | Nassim Taleb | *Antifragile* | Via negativa; systems that gain from disorder |
| `safety` | Nancy Leveson | *Engineering a Safer World* | STAMP framework; accidents emerge from system interactions |
| `style` | Google | Google Coding Standards | Optimize for reader clarity; consistency across languages |

### Documentation (1 skill)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `docs` | Daniele Procida | Diataxis framework | Split into tutorials, how-to, reference, explanation |

### Writing (3 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `brevity` | William Strunk Jr. | *The Elements of Style* | Omit needless words, active voice |
| `prose` | William Zinsser | *On Writing Well* | Strip to cleanest components, no clutter |
| `editing` | Stephen King | *On Writing* | Kill your darlings, show don't tell |

### JavaScript / TypeScript (8 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `typescript` | TypeScript team | TypeScript Handbook | Let inference work; discriminated unions; avoid `any` |
| `js-safety` | Douglas Crockford | *JavaScript: The Good Parts* | Use only the good parts; avoid eval, with, implied globals |
| `js-internals` | Kyle Simpson | *You Don't Know JS* | Scope, closures, `this` binding, types, coercion |
| `js-perf` | Web Performance WG | Web Vitals initiative | Core Web Vitals, loading strategy, bundle optimization |
| `functional` | Lodash/FP community | FP principles | Readable over clever; map/filter/reduce over loops |
| `react-state` | Dan Abramov | React documentation | UI = f(state); effects synchronize with external systems |
| `react-test` | Kent C. Dodds | Testing Library | Testing Trophy: integration-first; getByRole queries |
| `reactivity` | Rich Harris | Svelte/SolidJS philosophy | Compile-time over runtime; shift work to build step |

### C# (3 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `csharp-depth` | Microsoft C# team | *C# in Depth* | Value vs reference, pattern matching, LINQ execution |
| `async` | Stephen Cleary | C# async best practices | Async all the way down; never block on async code |
| `type-systems` | Anders Hejlsberg | C# language design | Progressive complexity, opt-in features, safe by default |

### Java (1 skill)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `java` | Joshua Bloch | *Effective Java* | API design for correct usage and defensive programming |

### Python (4 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `python-idioms` | Python community | *Effective Python* | enumerate, zip, Counter, defaultdict, comprehensions |
| `python-patterns` | Python community | Python best practices | Mutable defaults, generators over lists, keyword-only args |
| `python-advanced` | Guido van Rossum | *Fluent Python* | Generators, lazy evaluation, context managers |
| `python-protocols` | David Beazley | *Python Cookbook* | Data model, special methods, duck typing |

### Angular (4 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `angular-core` | Misko Hevery | Angular design philosophy | DI is architecture; constructors do assignment only |
| `angular-perf` | Minko Gechev | Angular performance | Lazy loading, OnPush change detection, bundle budgets |
| `angular-arch` | Angular team | Angular Style Guide | Organize by feature, LIFT principle |
| `rxjs` | RxJS maintainers | RxJS documentation | Streams not single values; higher-order operators |

### Database (2 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `sql` | Joe Celko | *SQL for Smarties* | Think in sets, not procedures; no cursors |
| `sql-perf` | Markus Winand | *SQL Performance Explained* | Indexes and B-trees; understand how databases find data |

### UI/UX (12 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `design` | Dieter Rams | 10 Design Principles | Less but better; form follows function |
| `usability` | Don Norman | *The Design of Everyday Things* | Affordances, signifiers, feedback <100ms |
| `personas` | Alan Cooper | *About Face* | Goal-directed design, eliminate excise |
| `visual` | Material Design | Google Material Design | Shadow system, color discipline, minimalism |
| `typography` | Typography experts | Typography principles | Type-first hierarchy, scale, line length |
| `frontend-design` | Design thinking | Frontend best practices | Bold aesthetic direction, production-grade interfaces |
| `motion` | Animation principles | Animation best practices | Motion communicates meaning; easing and stagger |
| `interaction` | Don Norman | *The Design of Everyday Things* | Touch constraints, Fitts's Law, thumb zones |
| `mobile` | Mobile-first design | Mobile best practices | Mobile first, forms as conversations |
| `components` | Brad Frost | *Atomic Design* | Atoms, molecules, organisms; BEM naming |
| `tokens` | Design systems | Design systems practice | Token hierarchy, semantic versioning, governance |
| `handoff` | Design-dev collaboration | Design systems practice | Hot potato process, component checklists |

### Visualization (4 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `charts` | Edward Tufte | *The Visual Display of Quantitative Information* | Data-ink ratio, lie factor, eliminate chartjunk |
| `d3` | Mike Bostock | D3.js documentation | Data joins, reusable chart pattern |
| `dashboards` | Stephen Few | *Information Dashboard Design* | Single screen, at a glance, sparse color |
| `data-story` | Cole Nussbaumer Knaflic | *Storytelling with Data* | Story structure, eliminate clutter, audience context |

### Business (6 skills)

| Skill | Master | Source | One-Liner |
|-------|--------|--------|-----------|
| `competition` | Michael Porter | *Competitive Strategy* | Five Forces, generic strategies |
| `leadership` | Ben Horowitz | *The Hard Thing About Hard Things* | Wartime vs peacetime, the struggle |
| `management` | Andy Grove | *High Output Management* | OKRs, one-on-ones, managerial leverage |
| `moats` | Hamilton Helmer | *7 Powers* | Durable competitive advantages |
| `strategy` | Richard Rumelt | *Good Strategy, Bad Strategy* | Diagnosis, guiding policy, coherent action |
| `platforms` | Ben Thompson | Stratechery | Aggregation theory, demand aggregation |

### Utility Canon (3 skills)

| Skill | Purpose |
|-------|---------|
| `code-scan` | Read-only quality analysis |
| `deadcode` | Dead code detection across polyglot projects |
| `implement` | Implementation patterns from plans |

---

## Tier 1 -> Tier 3: Full Invocation Trees

### `/build` and `/improve`

```
/build or /improve
├── Phase 1: create-plan
│   ├── clarity (Kernighan)
│   ├── pragmatism (Thompson)
│   ├── simplicity (Pike)
│   ├── composition (McIlroy)
│   ├── distributed (Joy)
│   ├── data-first (Torvalds)
│   ├── correctness (Dijkstra)
│   ├── algorithms (Knuth)
│   ├── abstraction (Liskov)
│   ├── optimization (Carmack)
│   ├── [if auth] security-mindset
│   └── [if auth] owasp
│
├── Phase 2: structure-first
│   ├── (Base Brain x10)
│   └── [if *.ts] typescript
│
├── Phase 3: implement-plan
│   ├── (Base Brain x10)
│   ├── [if *.ts] typescript
│   ├── [if auth] security-mindset
│   └── [if auth] owasp
│
├── Phase 3.5: machine-gate
│   └── npm run build && npm test
│
├── Phase 4: refactor-check-fix
│   ├── (Base Brain x10)
│   ├── design-patterns (Gang of Four)
│   └── refactoring (Fowler)
│
├── Phase 5: dedupe-fix
│   ├── composition (McIlroy)
│   ├── clarity (Kernighan)
│   └── simplicity (Pike)
│
├── Phase 6: gemini-fix
│   └── (Gemini MCP — no canon)
│
├── Phase 7: qodana-fix
│   └── (Qodana MCP — no canon)
│
├── Phase 7.5: machine-gate
│   └── npm run build && npm test
│
├── Phase 8: adversarial-security-review
│   ├── security-mindset
│   ├── owasp (OWASP Foundation)
│   └── web-security (Troy Hunt)
│
├── Phase 9: write-tests-run
│   ├── test-doubles (Meszaros)
│   ├── test-strategy (Cohn)
│   └── [if auth] security-mindset
│
├── Phase 10: ai-smell-fix
│   └── (no canon — algorithmic detection)
│
├── Phase 11: codex-fix
│   └── (no canon — pattern scan against quality-gate rules)
│
├── Phase 11.5: machine-gate
│   └── npm run build && npm test
│
└── Phase 12: write-tests-run (re-verify)
    ├── test-doubles (Meszaros)
    └── test-strategy (Cohn)
```

### `/ralph-loop`

```
/ralph-loop PRD.md
│
├── Per PRD Item (up to 50 iterations):
│   │
│   ├── Plan Phase
│   │   ├── clarity (Kernighan)
│   │   ├── simplicity (Pike)
│   │   ├── correctness (Dijkstra)
│   │   ├── composition (McIlroy)
│   │   ├── data-first (Torvalds)
│   │   └── distributed (Joy)
│   │
│   ├── Build Phase
│   │   ├── clarity (Kernighan)
│   │   ├── simplicity (Pike)
│   │   ├── java (Bloch)
│   │   ├── abstraction (Liskov)
│   │   ├── design-patterns (GoF)
│   │   ├── pragmatism (Thompson)
│   │   └── optimization (Carmack)
│   │
│   ├── Refactor Phase
│   │   ├── clarity (Kernighan)
│   │   ├── legacy (Feathers)
│   │   ├── design-patterns (GoF)
│   │   └── distributed (Joy)
│   │
│   ├── Test Phase
│   │   ├── test-doubles (Meszaros)
│   │   ├── test-strategy (Cohn)
│   │   └── legacy (Feathers)
│   │
│   ├── Review Phase
│   │   ├── security-mindset
│   │   ├── owasp (OWASP)
│   │   ├── failure (Petroski)
│   │   ├── safety (Leveson)
│   │   └── resilience (Taleb)
│   │
│   └── Doc Phase
│       ├── docs (Diataxis)
│       ├── brevity (Strunk)
│       ├── prose (Zinsser)
│       └── editing (King)
│
├── Conditional Auto-Invoke (file/keyword triggered):
│   ├── [*.tsx/jsx/vue] components, visual, usability
│   ├── [*.css/scss] design
│   ├── [*.ts non-UI] typescript
│   ├── [React files] react-state
│   ├── [forms] mobile, usability
│   ├── [animation] motion
│   ├── [mobile] mobile, interaction
│   ├── [auth] security-mindset, owasp
│   ├── [tests] react-test
│   ├── [charts] d3
│   ├── [system design] resilience, failure
│   ├── [design system] tokens
│   └── [typography] typography
│
└── Post-Loop Validation:
    ├── Gemini review (external)
    └── Qodana scan (external)
```

### `/quick-edit`

```
/quick-edit
├── ALWAYS:
│   ├── clarity (Kernighan)
│   ├── refactoring (Fowler)
│   └── style (Google)
│
├── By Change Type:
│   ├── [bug fix] legacy (Feathers)
│   ├── [validation] owasp (OWASP)
│   └── [database] sql (Celko)
│
└── By Language:
    ├── [TypeScript] typescript
    ├── [JavaScript] js-safety
    ├── [TS/JS tests] react-test, test-doubles
    ├── [Java] java
    ├── [Java tests] test-doubles
    ├── [Python] python-idioms, python-patterns
    ├── [Python tests] test-doubles
    ├── [C#] csharp-depth
    └── [Go] simplicity
```

---

## Profiles: How Canon Sets Are Composed

Profiles stack via composition. A project applies `software-base` + a tech profile + optional specialty profiles.

### software-base (always included)

Includes: Base Brain (10) + design-patterns + security-mindset + owasp + failure + safety + resilience + docs + prose + brevity + editing + react-test + legacy + test-doubles + test-strategy

**Total: 24 canon skills**

### Tech Profiles

| Profile | Canon Skills Added |
|---------|-------------------|
| `typescript-cli` | typescript, type-systems, js-safety, js-internals, js-perf, functional, async, composition, simplicity |
| `javascript` | js-internals, react-state, functional, typescript, js-safety, react-test, reactivity, js-perf, components, visual, usability, mobile, motion, interaction, tokens, typography, design |
| `react` | react-state (extends javascript) |
| `java` | java |
| `python` | python-idioms, python-patterns, python-advanced, python-protocols |
| `csharp` | csharp-depth, async, type-systems, java |
| `angular` | angular-core, angular-perf, angular-arch, rxjs (extends javascript) |
| `sql` | sql, sql-perf, java, security-mindset |
| `d3` | d3, charts, dashboards, data-story (extends javascript) |

### Specialty Profiles

| Profile | Canon Skills Added |
|---------|-------------------|
| `frontend` | frontend-design, design, usability, personas, visual, typography, motion, interaction, mobile, components, tokens, handoff |
| `security` | security-mindset, owasp, appsec, web-security, safety, resilience, failure |
| `business-base` | management, competition, strategy, leadership, moats |
| `ralph-integration` | (no canon — adds iteration discipline, quality gates, agents) |

---

## Counts

| Category | Count |
|----------|-------|
| Workflow orchestrators (Tier 1) | 6 (`build`, `improve`, `ralph-loop`, `quick-edit`, `quick-clean`, `final-polish`) |
| Phase skills (Tier 2) | 12 (+ 3 machine gates) |
| Read-only scan skills | 6 |
| Utility skills | 7 (`generate-docs`, `run-tests`, `write-tests-run`, `explain-skill`, `session-status`, `skill-usage-report`, `lens`) |
| Canon skills total | 75 |
| Profiles | 14 |
| Unique master authorities referenced | ~40 |

---

## Expert Attribution Model

Every phase that loads canon skills must make expert influence **visible in output**. Two mechanisms:

### Per-Finding Attribution

Fix/change phases tag each finding with the expert that drove it:

```
REFACTORED:
- src/api.ts:45 long-function - FIXED: split into 3 helpers (via refactoring)
- src/api.ts:12 vague-name - FIXED: renamed `data` → `requestPayload` (via clarity)

ISSUES_FIXED:
[HIGH] path traversal in profile create - FIXED (via security-mindset)
```

Applies to: `refactor-check-fix`, `adversarial-security-review`, `quick-clean`, `quick-edit`

### Per-Decision Attribution

Planning/creation phases list which expert drove each design decision:

```
EXPERTS_LOADED: clarity, simplicity, composition, data-first, correctness, typescript
EXPERT_DECISIONS:
- data-first: chose flat array over nested tree — profiles are always iterated linearly
- composition: split scanner into parse + validate + emit, each independently testable
- security-mindset: validate profile name before path.join to prevent traversal
```

Applies to: `create-plan`, `structure-first`, `implement-plan`, `write-tests-run`

### Summary

| Output Field | What It Shows | Where |
|---|---|---|
| `EXPERTS_LOADED` | Which skill files were actually read | All phases that load canon |
| `(via [expert])` | Which expert drove a specific fix | Fix phases |
| `EXPERT_DECISIONS` | Which expert drove a specific design choice | Plan/create phases |

---

## Self-Learning Feedback Loop

Phases 6-10 **write lessons** that phases 1-5 **read** on future runs. This creates a feedback loop where quality phases teach planning phases about recurring mistakes.

### Writers (late phases -> lesson files)

| Phase | Writes To | Categories |
|---|---|---|
| 6: `gemini-fix` | `.claude/lessons.md` + `workflow-skills/lessons.md` | LOGIC, DESIGN, CODE_QUALITY, DUPLICATION, AI_SMELL + false positives |
| 7: `qodana-fix` | `.claude/lessons.md` + `workflow-skills/lessons.md` | LOGIC, DESIGN, CODE_QUALITY, DUPLICATION |
| 8: `adversarial-security-review` | `.claude/lessons.md` + `workflow-skills/lessons.md` | LOGIC, DESIGN |
| 10: `ai-smell-fix` | `.claude/lessons.md` + `workflow-skills/lessons.md` | DESIGN, CODE_QUALITY, AI_SMELL |

### Readers (early phases <- lesson files)

| Phase | Reads | What It Learns |
|---|---|---|
| 1: `create-plan` | Both lesson files | LOGIC, DESIGN, CODE_QUALITY, DUPLICATION, AI_SMELL |
| 2: `structure-first` | Both lesson files | DESIGN, LOGIC, AI_SMELL |
| 3: `implement-plan` | Both lesson files | LOGIC, CODE_QUALITY, DESIGN, AI_SMELL (most impactful reader) |
| 4: `refactor-check-fix` | Both lesson files | CODE_QUALITY, LOGIC, AI_SMELL |
| 5: `dedupe-fix` | Both lesson files | DUPLICATION, LOGIC, AI_SMELL |

### Two-Tier Knowledge

| File | Scope | Travels With |
|---|---|---|
| `workflow-skills/lessons.md` | Universal patterns (e.g., "never use execSync with template literals") | Skills repo — applies to all projects |
| `.claude/lessons.md` | Project-specific instances (e.g., "src/scanner/dedupe.ts:45 had shell injection") | Project — stays local |

Late phases check the universal file first and only append NEW general patterns not already covered.

---

## Key Architectural Insights

1. **Base Brain is the foundation.** The 10 computing fundamentals skills (Kernighan, Thompson, Pike, McIlroy, Joy, Torvalds, Dijkstra, Knuth, Liskov, Carmack) load into every planning and implementation phase. They shape all generated code.

2. **Canon loads are context-sensitive.** Phases detect file types (*.ts, *.py, *.java) and content patterns (auth, passwords, encryption) to conditionally load relevant canon skills. This keeps context cost low while ensuring relevant expertise is available.

3. **SUMMARY.md vs SKILL.md loading.** Base Brain skills load as SUMMARY.md (compressed, ~200 tokens each). Domain-specific skills load as SKILL.md (full, ~800-1500 tokens) only when triggered. This is how the system manages context budgets.

4. **Phases 6-7 delegate to external tools.** Gemini and Qodana phases use MCP tools instead of canon skills. They bring external analysis that the LLM cannot replicate internally.

5. **Profiles compose additively.** `software-base` + `typescript-cli` + `security` stacks three profiles. Each adds its canon skills to the available set. No conflicts because skills are additive knowledge.

6. **Ralph loop maps skills to phases.** Unlike the `/build` pipeline which loads skills per-phase from SKILL.md instructions, ralph-loop uses the profile's `ralph.skills` mapping to assign specific canon skills to plan/build/refactor/test/review/doc phases.

7. **Light workflows load minimal canon.** `/quick-edit` loads only 3 base skills plus language-specific ones. `/quick-clean` loads 3. `/final-polish` loads none. This keeps fast operations fast.

8. **Expert attribution is mandatory.** Every phase must show which experts were loaded (`EXPERTS_LOADED`) and which expert drove each fix or decision (`via` tags or `EXPERT_DECISIONS`). No silent expert influence.

9. **Late phases teach early phases.** The self-learning feedback loop means phases 6-10 write lessons that phases 1-5 read. Over time, the system stops generating the same mistakes.

10. **Machine gates enforce correctness.** Three machine gates (after phases 3, 7, and 11) run `npm run build && npm test`, catching regressions that LLM-only review might miss. See `quality-gate-spec.md` for details.
