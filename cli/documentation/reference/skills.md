# Skills Reference

Complete catalog of available skills.

---

## Workflow Skills

Skills for the development workflow. These are procedural - they guide Claude through specific tasks.

| Skill | Description |
|-------|-------------|
| `plan` | Create implementation plan before coding. Plan file must exist with required sections. |
| `structure-first` | Design and CREATE data structures before implementation. Type files must exist. |
| `implement` | Implement code from plan. Max 30 lines per function, 300 lines per file, complexity ≤10. |
| `refactor-check` | Systematic code cleanup with MANDATORY verification. All issues must be fixed. |
| `test` | Write and run tests. Tests are REQUIRED. All must pass. |
| `doc-code` | Generate documentation. Public APIs must have JSDoc. |
| `dedupe` | Find and report duplicated code patterns across the codebase. |
| `static-analysis` | Run Qodana static analysis. ALL issues must be fixed. |
| `adversarial-review` | Hard-ass security review via Gemini. ALL issues must be fixed. |
| `ralph-loop` | Execute PRD items with quality gates in an autonomous iteration loop. |
| `status` | Show what Claude Code primitives are active in this session. |

---

## Code Quality Skills

Foundational principles for writing quality code.

| Skill | Description |
|-------|-------------|
| `clarity` | Kernighan's clarity and simplicity |
| `simplicity` | Pike's Go proverbs and simplicity |
| `composition` | McIlroy's Unix philosophy - small tools, pipelines |
| `correctness` | Dijkstra's formal methods and program correctness |
| `data-first` | Linus kernel style - data structures first |
| `pragmatism` | Ken Thompson's pragmatic systems philosophy |
| `abstraction` | Liskov's data abstraction and LSP |
| `algorithms` | Knuth's literate programming and algorithmic rigor |
| `optimization` | Carmack's performance optimization |
| `distributed` | Joy's distributed systems principles |

---

## Design & Architecture Skills

Patterns for system and API design.

| Skill | Description |
|-------|-------------|
| `design-patterns` | GoF 23 classic design patterns |
| `refactoring` | Fowler's refactoring patterns - improving design without changing behavior |
| `java` | Bloch's Effective Java patterns |
| `style` | Google Coding Standards - universal style principles |

---

## JavaScript/TypeScript Skills

| Skill | Description |
|-------|-------------|
| `typescript` | Cherny's advanced TypeScript patterns |
| `js-safety` | Crockford's JS Good Parts - safe subset |
| `js-internals` | Kyle Simpson's deep JS mechanics - closures, this, prototypes |
| `js-perf` | Osmani's JS performance patterns |
| `functional` | Ashkenas' functional JS elegance |
| `react-state` | Abramov's React mental models and state management |
| `react-test` | Dodds' React and testing patterns |
| `reactivity` | Harris' compile-time reactivity (Svelte) |

---

## Angular Skills

| Skill | Description |
|-------|-------------|
| `angular-core` | Hevery's Angular patterns and testable architecture |
| `angular-arch` | Kurata's Angular architecture and organization |
| `angular-perf` | Gechev's Angular performance and optimization |
| `rxjs` | Lesh's RxJS patterns for Angular |

---

## Python Skills

| Skill | Description |
|-------|-------------|
| `python-protocols` | Ramalho's Fluent Python - data model, protocols, dunder methods |
| `python-idioms` | Hettinger's Pythonic idioms - itertools, descriptors |
| `python-patterns` | Slatkin's Effective Python - 90 specific ways |
| `python-advanced` | Beazley's advanced Python - generators, coroutines, metaprogramming |

---

## C# Skills

| Skill | Description |
|-------|-------------|
| `csharp-depth` | Skeet's deep C# expertise from C# in Depth |
| `async` | Cleary's async/await and concurrency patterns |
| `type-systems` | Hejlsberg's language design philosophy |

---

## Database Skills

| Skill | Description |
|-------|-------------|
| `sql` | Celko's SQL patterns - thinking in sets, not procedures |
| `sql-perf` | Winand's SQL performance - indexing and query optimization |

---

## Testing Skills

| Skill | Description |
|-------|-------------|
| `test-doubles` | xUnit test patterns, test doubles, and test smells |
| `test-strategy` | Test pyramid, testing strategy, when to use which test |
| `legacy` | Legacy code testing patterns - seams, characterization tests |

---

## Security Skills

| Skill | Description |
|-------|-------------|
| `security-mindset` | Schneier's security mindset - think like an attacker |
| `threat-model` | Threat modeling and security architecture |
| `owasp` | OWASP Top 10 vulnerability patterns |
| `appsec` | AppSec integration, shift-left security, DevSecOps |
| `web-security` | Pragmatic web security - passwords, HTTPS, breach response |

---

## UI/UX Skills

| Skill | Description |
|-------|-------------|
| `design` | Rams' 10 Principles of Good Design - less but better |
| `usability` | Norman's design psychology - affordances, feedback, mental models |
| `personas` | Cooper's Goal-Directed Design - personas, polite software |
| `components` | Frost's Atomic Design - atoms, molecules, organisms |
| `visual` | Ive's visual design - minimalism, material honesty |
| `interaction` | Buxton's interaction design - input fundamentals |
| `mobile` | Wroblewski's mobile-first patterns - forms, thumb zones |
| `motion` | Duarte's motion design - meaningful animation |
| `typography` | Kruzeniski's typography-first design |
| `tokens` | Curtis' design system governance - versioning, tokens |
| `handoff` | Mall's design-dev collaboration |

---

## Data Visualization Skills

| Skill | Description |
|-------|-------------|
| `charts` | Tufte's graphical integrity and data-ink principles |
| `dashboards` | Few's dashboard design principles |
| `data-story` | Knaflic's data storytelling and presentation |
| `d3` | Bostock's D3 patterns and philosophy |

---

## Writing Skills

| Skill | Description |
|-------|-------------|
| `docs` | Procida's Diátaxis documentation framework |
| `prose` | Zinsser's On Writing Well - clarity and simplicity |
| `brevity` | Strunk & White's Elements of Style - omit needless words |
| `editing` | Stephen King's On Writing - kill your darlings |

---

## Engineering Skills

| Skill | Description |
|-------|-------------|
| `failure` | Petroski's engineering philosophy - form follows failure |
| `safety` | Leveson's system safety - STAMP/STPA |
| `resilience` | Taleb's antifragility - systems that gain from disorder |

---

## Business/Strategy Skills

| Skill | Description |
|-------|-------------|
| `strategy` | Rumelt's good strategy principles |
| `competition` | Porter's Five Forces |
| `moats` | Helmer's 7 Powers framework |
| `platforms` | Ben Thompson's Aggregation Theory |
| `management` | Grove's high-output management |
| `leadership` | Horowitz's crisis leadership |

---

## Utility Skills

| Skill | Description |
|-------|-------------|
| `deadcode` | Detect and remove dead code across polyglot projects |
| `code-scan` | Read-only quality scan, reports without changing |
| `gemini-scan` | Read-only Gemini review, reports without fixing |

---

## Using Skills

### Auto-Invoke (CLAUDE.md)

```markdown
## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Writing tests | INVOKE `/test-doubles` |
| React components | INVOKE `/react-state` then `/components` |
| Security-sensitive code | INVOKE `/security-mindset` then `/owasp` |
```

### Manual Invocation

```
/clarity
/design-patterns
/sql-perf
```

### Via Profiles

```bash
cc-config profile apply javascript  # Loads JS-related skills
cc-config profile apply python      # Loads Python-related skills
```

---

## Skill Stacking

Skills can be combined. Common combinations:

| Task | Skills |
|------|--------|
| TypeScript development | `clarity` + `typescript` + `style` |
| React UI | `react-state` + `components` + `usability` |
| API design | `abstraction` + `java` (Bloch patterns) + `style` |
| Database work | `sql` + `sql-perf` |
| Security review | `security-mindset` + `owasp` + `threat-model` |
| Documentation | `docs` + `prose` + `brevity` |

---

## Creating Custom Skills

See [Skills System](../explanation/skills-system.md) for how to create your own skills.
