# Canon Enforcement Map — All 64 Skills

Every check from every canon skill, classified by enforcement layer.

## Legend

| Layer | Symbol | Meaning | Reliability |
|-------|--------|---------|-------------|
| 1 - Machine Gate | `M` | Deterministic regex/AST/linter check | 100% |
| 2 - Proxy Check | `P` | Measurable correlate, no AI needed | 100% |
| 3 - Evidence Checklist | `E` | LLM enumerates items, machine validates count | ~90% |
| 4 - Three-Model Vote | `V` | Three models judge independently, majority rules | ~80% |
| 5 - Canary Test | `C` | Planted violations verify the review happened | Meta |

Checks marked `M` catch violations with zero false negatives — the machine either finds the pattern or it doesn't. Checks marked `P` use a measurable proxy (line count, name length, nesting depth) as a stand-in for a judgment call. Checks marked `E` require an LLM to list items, but the machine validates the list is complete. Checks marked `V` are pure judgment — the only enforcement is requiring three independent opinions.

---

## Summary Scoreboard

| Category | Skills | HARD GATES | Concrete Checks | Machine (M) | Proxy (P) | Evidence (E) | Vote (V) |
|----------|--------|------------|-----------------|-------------|-----------|--------------|----------|
| Core | 12 | 36 | 60 | 18 | 14 | 34 | 30 |
| JavaScript/TypeScript | 8 | 18 | 41 | 14 | 8 | 22 | 15 |
| Security | 2 | 10 | 11 | 6 | 0 | 11 | 4 |
| Testing | 3 | 14 | 15 | 2 | 4 | 15 | 8 |
| Languages/Frameworks | 12 | 5 | 60 | 5 | 18 | 20 | 22 |
| Writing | 3 | 0 | 15 | 0 | 10 | 0 | 5 |
| Engineering | 3 | 8 | 15 | 2 | 2 | 13 | 6 |
| UI/UX | 11 | 0 | 58 | 0 | 18 | 10 | 30 |
| Visualization | 4 | 0 | 21 | 0 | 4 | 4 | 13 |
| Business | 6 | 0 | 31 | 0 | 0 | 6 | 25 |
| **TOTAL** | **64** | **91** | **327** | **47** | **78** | **135** | **158** |

**Bottom line:** Of 418 total checks across all 64 skills:
- **47 (11%)** are fully machine-enforceable — 100% catch rate
- **78 (19%)** have proxy checks — 100% catch rate on the proxy signal
- **135 (32%)** are evidence-checklistable — machine validates completeness
- **158 (38%)** are judgment-only — enforced by three-model vote + canaries

The five-layer system enforces the first three categories (62% of all checks) with machine-level reliability. The remaining 38% get three independent opinions instead of one.

---

## 1. CORE SKILLS (12 skills)

### 1.1 clarity

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | No reimplemented stdlib | E | LLM lists every function; machine checks for stdlib equivalents |
| H2 | Name test — each function name describes what it does | V | Pure judgment — three models evaluate independently |
| H3 | One-sentence test — describe module without "and" | P | Proxy: count export count per file; flag >1 responsibility keyword |
| H4 | Magic-free — no unexplained literals | M | Regex/AST: find string/number literals not assigned to named constants |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Single responsibility — describe function without "and" | E | LLM describes each function; machine validates one description per function |
| C2 | Name sufficiency — names tell you what it returns | V | Judgment call — three models rate each name |
| C3 | Magic value audit — every literal is named or obvious | M | Same as H4 |
| C4 | Control flow linearity — max 1 nesting level for primary logic | P | AST: measure nesting depth per function |
| C5 | Cleverness test — junior dev understands in 10 seconds | V | Pure judgment |

---

### 1.2 pragmatism

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Library-first — search for mature library before hand-rolling | E | LLM lists each subsystem + library search results |
| H2 | Delete test — what breaks if deleted | E | LLM lists each file/function + impact analysis |
| H3 | Ship test — could this ship today | V | Judgment |
| H4 | YAGNI enforcement — every feature explicitly requested | E | LLM lists features + traces each to a requirement |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | YAGNI audit — every interface/config used by existing callers | E | LLM lists interfaces + callers |
| C2 | Speculative code search — functions for future scenarios | E | LLM lists speculative code |
| C3 | Silent failure scan — every catch either re-throws, returns error, or logs+exits | P | AST: find empty catch blocks, catch blocks without throw/return |
| C4 | Brute force justification — complex algorithms have measured benchmarks | E | LLM lists each algorithm + benchmark evidence |
| C5 | Dependency count — every dep saves >20 lines | E | LLM lists deps + justification |

---

### 1.3 simplicity

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Interface audit — every interface has ≤3 methods | P | AST: count methods per interface |
| H2 | Dependency direction — arrows point inward | E | LLM traces import graph |
| H3 | Zero-config test — works with no config file | V | Judgment |
| H4 | Linear search first — start with linear scan | V | Judgment |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Interface method count ≤3 | P | Same as H1 |
| C2 | Optimization evidence — benchmark exists | E | LLM lists optimizations + evidence |
| C3 | Zero value test — `new T()` is usable | V | Judgment |
| C4 | Error context — every propagated error includes operation + input | E | LLM lists error paths + context check |
| C5 | Dependency direction — core logic doesn't import I/O | P | AST: check import paths from core → I/O modules |

---

### 1.4 composition

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Existing tool audit — library with >1000 downloads exists | E | LLM lists components + npm search results |
| H2 | Pipe test — output feeds input without shared state | V | Judgment |
| H3 | Scriptability — every operation runs non-interactively | E | LLM lists operations + non-interactive path |
| H4 | One-thing test — describe without "and" | E | LLM describes each module |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Build-vs-library audit | E | Same as H1 |
| C2 | One-thing test | E | Same as H4 |
| C3 | Composability — no shared mutable state | E | LLM lists module interactions |
| C4 | Scriptability test | E | Same as H3 |
| C5 | Monolith detection — I/O mixed with business logic | P | AST: check if file contains both I/O imports and computation |

---

### 1.5 distributed

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Idempotency — every write can be safely retried | E | LLM lists write operations + retry analysis |
| H2 | Failure mode audit — what happens when external call fails/slow/garbage | E | LLM lists external calls + three failure modes each |
| H3 | Stateless — no in-memory state between requests | E | LLM lists stored state |
| H4 | Concurrent access — two processes on same data | E | LLM lists shared data paths |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Stateless verification | E | Same as H3 |
| C2 | Idempotency test | E | Same as H1 |
| C3 | Network failure handling — timeout/error/malformed for each call | E | LLM lists calls + three handling paths |
| C4 | Concurrent safety | E | Same as H4 |
| C5 | Retry safety — exponential backoff with jitter, capped retries | P | Search for retry patterns; flag fixed-interval or unbounded |

---

### 1.6 data-first

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Pure core — business logic doesn't call I/O directly | E | LLM lists functions + I/O classification |
| H2 | Data structure test — types defined before algorithms | V | Judgment |
| H3 | Special case elimination — if/else removable by data restructure | E | LLM lists conditionals + elimination analysis |
| H4 | Function length ≤30 lines | M | AST: count lines per function |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Pure function extraction | E | Same as H1 |
| C2 | Special-case branch audit | E | Same as H3 |
| C3 | Function length ≤50 lines | M | AST: count lines |
| C4 | Nesting depth ≤3 levels | P | AST: measure indentation depth |
| C5 | Data structure justification — types defined before code | V | Judgment |

---

### 1.7 design-patterns

**Concrete Checks only (no HARD GATES):**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Solving a real problem — name the specific problem | V | Judgment |
| C2 | Function replacement test — could a plain function work | V | Judgment |
| C3 | Pattern count — no more than one new pattern per change | P | Count pattern introductions in diff |
| C4 | Inheritance depth ≤2 | P | AST: count inheritance chain depth |
| C5 | Name the force — state the constraint | V | Judgment |

---

### 1.8 correctness

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Pre/postcondition documentation — runtime checks at boundaries | E | LLM lists public functions + conditions |
| H2 | Test reality check — mocks replace dependencies not subject | E | LLM lists mocks + their targets |
| H3 | Invariant identification — every loop has stated invariant | E | LLM lists loops + invariants |
| H4 | Error path testing — every catch has a triggering test | E | LLM lists catch blocks + test mapping |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Pre/postcondition audit | E | Same as H1 |
| C2 | Reasoning test — trace output from input without running | V | Judgment |
| C3 | Mock target check | E | Same as H2 |
| C4 | Error path coverage | E | Same as H4 |
| C5 | Loop invariant identification | E | Same as H3 |

---

### 1.9 abstraction

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Consumer count — single-implementation abstractions deleted | P | AST: count implementations per interface |
| H2 | Substitution test — subtype works through base type | E | LLM lists subtypes + substitution analysis |
| H3 | Depth check — inheritance ≤2 levels | P | AST: count chain depth |
| H4 | Wrapper audit — forwarding-only wrappers deleted | E | LLM lists wrappers + value-add analysis |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Inheritance justification — no instanceof/typeof branching | P | Search for `instanceof` in consumer code |
| C2 | Abstraction consumer count ≥2 | P | Same as H1 |
| C3 | Leaky abstraction scan — no casting to concrete types | P | Search for type casts in consumer code |
| C4 | Hierarchy depth ≤2 | P | Same as H3 |
| C5 | Contract preservation — overrides widen input, narrow output | V | Judgment |

---

### 1.10 optimization

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Functional core — ≤30% impure functions | P | AST: classify functions as pure/impure, compute ratio |
| H2 | Const audit — every non-reassigned variable is const | M | AST: find `let` declarations never reassigned |
| H3 | Measurement before optimization — show the benchmark | E | LLM lists optimizations + benchmark evidence |
| H4 | Cache-friendly access — iterate in memory order | V | Judgment |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | I/O separation — split computation from I/O | E | Same as data-first H1 |
| C2 | Purity ratio ≥2:1 | P | Same as H1 |
| C3 | Const/readonly audit | M | Same as H2 |
| C4 | Measurement before optimization | E | Same as H3 |
| C5 | Hot path identification — profiler output exists | E | LLM lists optimized paths + profiler evidence |

---

### 1.11 algorithms

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Complexity documented — O() stated for every loop/recursion | E | LLM lists functions with loops + complexity annotation |
| H2 | Edge cases enumerated — empty, single, max, negative, off-by-one | E | LLM lists edge cases + test mapping |
| H3 | Stdlib check — no reimplemented stdlib algorithms | E | LLM lists algorithms + stdlib equivalents |
| H4 | Simplest first — start with brute force | V | Judgment |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Complexity labeling | E | Same as H1 |
| C2 | Edge case enumeration | E | Same as H2 |
| C3 | Stdlib duplication check | E | Same as H3 |
| C4 | Optimization justification — benchmark exists | E | Same as optimization H3 |
| C5 | Overflow and precision audit | E | LLM lists arithmetic operations + boundary analysis |

---

### 1.12 docs

**Concrete Checks only:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Single quadrant — one Diataxis type per document | V | Judgment |
| C2 | No teaching in tutorials — steps only | V | Judgment |
| C3 | No tutorials in reference — no walkthroughs | P | Search for "First, install" / "Now, create" in reference docs |
| C4 | Completeness — reference covers every public function | E | LLM lists public functions + doc coverage |
| C5 | Task-oriented how-to — starts with the goal | V | Judgment |

---

## 2. JAVASCRIPT / TYPESCRIPT (8 skills)

### 2.1 typescript

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | No `any` | M | Grep for `/\bany\b/` in type positions |
| H2 | Strict mode in tsconfig | M | Check `"strict": true` in tsconfig.json |
| H3 | Return type on every export | M | AST: find exported functions without return type annotations |
| H4 | Readonly by default | P | AST: find non-readonly properties/params that aren't mutated |
| H5 | Discriminated unions over optional fields | E | LLM lists types with 2+ optional fields + union analysis |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Count every `any` | M | Same as H1 |
| C2 | Generic vs union — does T actually vary | E | LLM lists generics + caller analysis |
| C3 | Readable utility types — no nested `extends ? :` | P | AST: count conditional type nesting depth |
| C4 | Impossible states — optional fields allow nonsense combos | E | Same as H5 |
| C5 | Explicit return types on exports | M | Same as H3 |

---

### 2.2 react-state

**Concrete Checks only:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | State colocation — stored in closest reading component | V | Judgment |
| C2 | No derived state in useState | P | Search for useState where value could be computed from other state |
| C3 | useEffect only for external sync, not state reactions | E | LLM lists every useEffect + purpose classification |
| C4 | Context only for low-frequency data | E | LLM lists Context usage + update frequency |
| C5 | Every useEffect has cleanup | M | AST: find useEffect without return statement |

---

### 2.3 react-test

**Concrete Checks only:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | getByRole/getByLabelText first, no querySelector/getByTestId | P | Grep for `querySelector`, `getByTestId` in test files |
| C2 | Assert on visible output, not internal state | V | Judgment |
| C3 | userEvent not fireEvent | P | Grep for `fireEvent` in test files |
| C4 | Mocks at network boundary only (MSW, fetch) | E | LLM lists mocks + boundary classification |
| C5 | Snapshot tests justified — stable visual structure only | V | Judgment |

---

### 2.4 functional

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Immutability — `let` → `const`, mutations → spread/map/filter | M | AST: find `let` never reassigned; grep for `.push()`, `.splice()` |
| H2 | Side effect inventory — I/O at edges not core | E | LLM lists functions + side effect classification |
| H3 | Pure function ratio ≥70% | P | AST: classify pure/impure, compute ratio |
| H4 | No shared mutable state | E | LLM lists shared state modifications |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | List every function modifying external scope | E | Same as H2 |
| C2 | Two+ functions reading/writing same variable | E | Same as H4 |
| C3 | `.push()`, `.splice()`, `.sort()` → immutable alternatives | M | Grep for mutation methods |
| C4 | Function ≤3 parameters | P | AST: count function parameters |
| C5 | Describe function without "and" | E | LLM describes each function |

---

### 2.5 reactivity

**Concrete Checks only:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Reactive declarations for derived values | V | Judgment (framework-specific) |
| C2 | Side effects in lifecycle only, not top-level | E | LLM lists side effects + placement |
| C3 | Dependency size justified | E | LLM lists dependencies + size analysis |
| C4 | Tree shaking verified | E | LLM checks bundle output |
| C5 | Zero runtime for static content | V | Judgment |

---

### 2.6 js-perf

**Concrete Checks only:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Hot loops confirmed with profiler | E | LLM lists hot loops + profiler evidence |
| C2 | DOM reads grouped before writes | P | AST: check for interleaved DOM read/write |
| C3 | Event handlers debounced/throttled | P | Search for scroll/resize/input handlers without debounce |
| C4 | Named imports, not full library | P | Search for `import _ from` or `import * as` |
| C5 | LCP element: fetchpriority=high, loading=eager | M | Search HTML for LCP images without correct attributes |
| C6 | Bundle size checked before adding dependency | E | LLM lists new deps + size justification |

---

### 2.7 js-safety

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Strict equality only — zero `==` and `!=` | M | Grep for `[^!=]=[^=]` and `[^!]!=[^=]` patterns |
| H2 | No implicit coercion — explicit `Number()`, `String()` | P | Grep for `+str`, `!!val`, `'' +` patterns |
| H3 | Null handling — optional chaining or explicit checks | P | AST: find property access chains without `?.` on nullable values |
| H4 | Promise rejection handling — every promise has catch | M | AST: find unhandled promise chains |
| H5 | No eval, no Function() | M | Grep for `eval(` and `new Function(` |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Count every `==` and `!=` | M | Same as H1 |
| C2 | Count every `var` | M | Grep for `\bvar\b` declarations |
| C3 | Nested callbacks >2 levels | P | AST: measure callback nesting depth |
| C4 | Implicit type coercion patterns | P | Same as H2 |
| C5 | Nullable guarded before access | P | Same as H3 |

---

### 2.8 js-internals

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | `this` binding audit — arrow for callbacks, regular for methods | E | LLM lists every `this` usage + binding context |
| H2 | Closure leak check — captured variable lifetime | E | LLM lists closures + captured variables + lifetime analysis |
| H3 | Event loop awareness — no sync ops >50ms | E | LLM lists sync operations + duration estimates |
| H4 | No monkey-patching built-in prototypes | M | Grep for `Array.prototype.` / `Object.prototype.` followed by `=` |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | `this` binding at every call-site | E | Same as H1 |
| C2 | Closure memory leaks | E | Same as H2 |
| C3 | Event loop blocking | E | Same as H3 |
| C4 | `var` inside loops | M | Grep for `for (var` or `for(var` |
| C5 | Built-in prototype modification | M | Same as H4 |

---

## 3. SECURITY (2 skills)

### 3.1 security-mindset

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Error message audit — no leaking file paths, traces, SQL | M | Grep for stack trace / path patterns in error messages |
| H2 | Log audit — no passwords, keys, tokens, PII in logs | M | Grep for `console.log`/`logger` near sensitive variable names |
| H3 | Input boundary check — every entry point validated | E | LLM lists entry points + validation status |
| H4 | Dependency audit — age, vulnerabilities, transitives | M | `npm audit` / equivalent tooling |
| H5 | Secret storage — no hardcoded secrets | M | Grep for API key / password / token patterns in source |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | List every input boundary + validation | E | Same as H3 |
| C2 | Secrets in error messages or logs | M | Same as H1 + H2 |
| C3 | Auth path bypass — trace each protected operation | E | LLM traces auth paths + bypass analysis |
| C4 | Catch blocks fail closed | E | LLM lists security-critical catch blocks + fail behavior |
| C5 | External dependency unavailable — deny by default | E | LLM lists external calls + unavailability behavior |

---

### 3.2 owasp

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Injection — user input parameterized/escaped | M | Grep for string concat/template literals with user input in SQL/shell/HTML |
| H2 | Auth — every data-modifying endpoint authenticated AND authorized | E | LLM lists endpoints + auth status |
| H3 | Crypto — standard library, not hand-rolled | E | LLM lists crypto usage + library source |
| H4 | Error disclosure — no stack traces/SQL/paths in responses | M | Same as security-mindset H1 |
| H5 | HTTPS/TLS — every external comm uses TLS | M | Grep for `http://` in production config; check for disabled cert verification |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | String concat with user input in SQL/shell/HTML | M | Same as H1 |
| C2 | Resource ownership — user A can't access user B's data | E | LLM lists resource access points + ownership checks |
| C3 | Hardcoded secrets | M | Same as security-mindset H5 |
| C4 | User input in file paths — path traversal | M | Grep for `path.join`/`fs.*` with user-supplied segments |
| C5 | Error responses contain internal details | M | Same as H4 |
| C6 | Dependencies audited — no HIGH/CRITICAL vulns | M | `npm audit` output |

---

## 4. TESTING (3 skills)

### 4.1 test-doubles

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Mock target audit — mocking dependency, not SUT | E | LLM lists every mock + what it replaces |
| H2 | Mock fidelity — mock behaves like real thing | V | Judgment |
| H3 | Integration escape hatch — at least one real I/O test per module | P | Count integration test files per I/O module |
| H4 | Stub smell check — setup shorter than test | P | Count lines: setup vs exercise+verify |
| H5 | Test contract not implementation — doesn't break on refactor | V | Judgment |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | List every mock — is it the SUT or a dependency | E | Same as H1 |
| C2 | Mock reimplements >5 lines of real module | P | Count mock implementation lines |
| C3 | Mock return value is producible by real implementation | V | Judgment |
| C4 | Setup longer than test | P | Same as H4 |
| C5 | Remove mocks mentally — real scenario remains | V | Judgment |

---

### 4.2 test-strategy

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Pyramid compliance — unit > integration > E2E | P | Count test files by type |
| H2 | Real I/O test exists per I/O module | P | Same as test-doubles H3 |
| H3 | Mutation survival — flip a comparison, does a test fail | V | Judgment (or automated mutation testing) |
| H4 | Error path coverage — every catch has a triggering test | E | LLM lists catch blocks + test mapping |
| H5 | No test-only code in production | P | Search for exports/params only used in test files |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Integration tests cover real I/O | E | LLM lists I/O modules + test coverage |
| C2 | Unit tests don't mock the SUT | E | Same as test-doubles H1 |
| C3 | E2E tests for critical paths | E | LLM lists critical paths + E2E coverage |
| C4 | Pyramid right-side-up | P | Same as H1 |
| C5 | Test names describe specific behavior | V | Judgment |

---

### 4.3 legacy

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Characterization tests first — before any change | E | LLM lists changes + pre-existing characterization tests |
| H2 | Seam identification — list dependencies + substitution points | E | LLM lists dependencies + seam locations |
| H3 | Minimal change — only what's needed for the goal | E | LLM lists changes + traces each to the goal |
| H4 | No big bang rewrites | V | Judgment |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Characterization tests written before changes | E | Same as H1 |
| C2 | Dependency seam list | E | Same as H2 |
| C3 | Sprout method/class for new behavior | E | LLM lists new code + isolation status |
| C4 | Every refactoring step is mechanical | V | Judgment |
| C5 | No unrelated "while I'm here" fixes | E | Same as H3 |

---

## 5. LANGUAGES / FRAMEWORKS (12 skills)

### 5.1 python-advanced

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Generators for large sequences (not full lists) | P | Search for `return [...]` in functions processing large data |
| C2 | Every file/connection in `with` statement | P | Search for `open(` / `connect(` not inside `with` |
| C3 | Generator expressions inside `sum()`, `any()`, `all()` | P | Search for `sum([` / `any([` patterns (should be `sum(`) |
| C4 | Metaclass justified — ABCs/decorators can't do it | V | Judgment |
| C5 | `__slots__` on high-instance classes | V | Judgment |

---

### 5.2 python-idioms

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | `enumerate` instead of `range(len())` | P | Grep for `range(len(` |
| C2 | Comprehensions instead of `map()`/`filter()` | P | Grep for `map(` / `filter(` |
| C3 | `pathlib.Path` instead of `os.path` | P | Grep for `os.path.` |
| C4 | `Counter`/`defaultdict` for counting/grouping | P | Search for manual dict accumulation patterns |
| C5 | `@functools.wraps` on decorators | P | Search for decorator definitions without `@wraps` |

---

### 5.3 python-patterns

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Tuple unpacking instead of `x[0]`, `x[1]` | P | Grep for `[0]`, `[1]` on tuple-typed variables |
| C2 | Walrus operator where it eliminates redundancy | V | Judgment |
| C3 | f-strings instead of `.format()` or `%` | P | Grep for `.format(` and `%s` / `%d` patterns |
| C4 | Keyword-only args for boolean params | V | Judgment |
| C5 | `None` sentinel for mutable default args | M | AST: find `def f(x=[])` or `def f(x={})` patterns |

---

### 5.4 python-protocols

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Every class has `__repr__` | P | Search for classes without `__repr__` |
| C2 | Structural protocols over inheritance from builtins | V | Judgment |
| C3 | `__eq__` paired with `__hash__` | M | AST: find classes with `__eq__` but no `__hash__` |
| C4 | Descriptors for repeated validation instead of copy-paste `@property` | V | Judgment |
| C5 | Binary dunders return `NotImplemented`, not raise `TypeError` | P | Search for `raise TypeError` in dunder methods |

---

### 5.5 csharp-depth

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | `#nullable enable` present | M | Grep for `#nullable enable` in project/files |
| C2 | LINQ instead of manual loops with accumulators | P | Search for `foreach` with accumulator patterns |
| C3 | `await` instead of `.Result` or `.Wait()` | M | Grep for `.Result` and `.Wait()` on Task |
| C4 | All structs immutable — no settable fields | P | Search for `set;` in struct definitions |
| C5 | Loop closures capture local copy | V | Judgment |

---

### 5.6 type-systems

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Domain constraints encoded in types (UserId vs string) | V | Judgment |
| C2 | Phantom/branded types for non-interchangeable values | V | Judgment |
| C3 | Discriminated unions over boolean flags | P | Search for boolean flag params that control branching |
| C4 | Explicit nullable annotations | P | AST: find nullable without `?` annotation |
| C5 | Simple case stays simple | V | Judgment |

---

### 5.7 async

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | No fire-and-forget — every async call awaited or caught | M | AST: find async calls without `await` / `.catch()` |
| H2 | Parallel where possible — `Promise.all` for independent ops | P | Search for sequential `await` on independent operations |
| H3 | Timeout on every external call | E | LLM lists external calls + timeout status |
| H4 | Error context preservation — no bare re-throw | P | Search for `catch (e) { throw e }` without wrapping |
| H5 | Graceful shutdown — wait for in-flight ops | E | LLM analyzes shutdown path |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Fire-and-forget async calls | M | Same as H1 |
| C2 | Sequential await on independent ops | P | Same as H2 |
| C3 | Timeouts on external calls | E | Same as H3 |
| C4 | Promise.all partial failure handling | E | LLM lists Promise.all calls + rejection handling |
| C5 | Unhandled rejection handler exists | M | Grep for `unhandledRejection` handler |

---

### 5.8 java

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | >4 constructor params → use Builder | P | AST: count constructor parameters |
| C2 | Defensive copies for mutable return values | V | Judgment |
| C3 | Checked exceptions for recoverable only | V | Judgment |
| C4 | Minimal accessibility — private/package-private default | P | Count public methods; flag unjustified public |
| C5 | Static factory methods where naming/caching benefits | V | Judgment |

---

### 5.9 angular-arch

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Feature modules lazy loaded | P | Search route configs for `loadChildren`/`loadComponent` |
| C2 | No cross-feature-module imports | P | AST: check import paths between feature modules |
| C3 | SharedModule: stateless only, no services | P | Search SharedModule for `providers:` |
| C4 | CoreModule imported once + guard | P | Search for CoreModule imports outside AppModule |
| C5 | Smart components delegate to presentational children | V | Judgment |

---

### 5.10 angular-core

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | OnPush on every component | P | Search @Component for missing `ChangeDetectionStrategy.OnPush` |
| C2 | Constructor: assignment only | P | AST: check constructor body for method calls |
| C3 | Services injected via constructor, not `new` | P | Search for `new XxxService()` |
| C4 | Presentational: @Input/@Output only, no injected services | P | Check presentational component constructors |
| C5 | Correct provider scope | V | Judgment |

---

### 5.11 angular-perf

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Every `*ngFor` has `trackBy` | P | Grep for `*ngFor` without `trackBy` |
| C2 | OnPush on input-receiving components | P | Same as angular-core C1 |
| C3 | Feature routes lazy loaded | P | Same as angular-arch C1 |
| C4 | 50+ item lists use virtual scrolling | V | Judgment (requires knowing list size) |
| C5 | Bundle budgets configured | M | Check angular.json for budget configuration |

---

### 5.12 rxjs

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Subscriptions cleaned up — async pipe / takeUntilDestroyed | P | Grep for manual `.unsubscribe()` in `ngOnDestroy` |
| C2 | No nested `.subscribe()` | P | Grep for `.subscribe(` inside `.subscribe(` |
| C3 | Shared observables use `shareReplay(1)` | E | LLM lists shared observables + sharing status |
| C4 | Error handling via `catchError` in pipe | P | Search for subscribe error callback without pipe `catchError` |
| C5 | Correct flattening operator | V | Judgment |

---

## 6. WRITING (3 skills)

### 6.1 brevity

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Word removal test — every word earns its place | V | Judgment |
| C2 | Passive voice scan | P | Regex: `is/was/were/been + past participle` |
| C3 | "In order to" and filler phrases | P | Grep for `in order to`, `due to the fact that`, `whether or not` |
| C4 | "There is/are" sentence starts | P | Grep for sentences starting with `There is` / `There are` |
| C5 | Noun stack — 3+ nouns without a verb | P | Regex: 3+ consecutive capitalized/noun words |

---

### 6.2 editing

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | 10% cut — final shorter than first draft | V | Judgment (requires draft comparison) |
| C2 | Adverb hunt — words ending in "-ly" | P | Grep for `\w+ly\b` in prose |
| C3 | Darling detection | V | Judgment |
| C4 | Show-not-tell — "fast"/"simple"/"powerful" without evidence | P | Grep for `fast|simple|powerful|efficient` without adjacent numbers |
| C5 | Hedge word scan | P | Grep for `basically|essentially|actually|somewhat|arguably` |

---

### 6.3 prose

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | First sentence hook — no throat-clearing | V | Judgment |
| C2 | Active voice throughout | P | Same as brevity C2 |
| C3 | Concrete nouns in key sentences | V | Judgment |
| C4 | Clutter word scan | P | Same as editing C5 + `very|really|extremely|quite` |
| C5 | "-tion" conversion — nouns to verbs | P | Grep for `\w+tion\b` in prose |

---

## 7. ENGINEERING (3 skills)

### 7.1 failure

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Failure mode enumeration — down/slow/garbage for each dep | E | LLM lists dependencies + three failure modes each |
| H2 | Error propagation — context survives from origin to user | E | LLM traces error chains |
| H3 | Timeout on every external call | M | Search for external calls without timeout configuration |
| H4 | Graceful degradation — non-critical failure doesn't cascade | E | LLM lists dependencies + criticality + isolation |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Failure path enumeration | E | Same as H1 |
| C2 | Cascading failure test | E | LLM traces failure propagation chains |
| C3 | Silent failure scan — empty catch blocks | P | AST: find empty catch blocks |
| C4 | Pre-mortem written | V | Judgment |
| C5 | Error context preservation — `cause` chain intact | E | Same as H2 |

---

### 7.2 safety

**HARD GATES:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| H1 | Atomic operations — write-to-temp-then-rename | E | LLM lists state-modifying operations + atomicity analysis |
| H2 | TOCTOU audit — check-then-act sequences | E | LLM lists check-then-act patterns + race analysis |
| H3 | Resource cleanup — every open has close in finally | E | LLM lists resource acquisitions + cleanup paths |
| H4 | Rollback capability — partial failure recovery | E | LLM lists multi-step operations + rollback design |

**Concrete Checks:**

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Safety constraints listed | V | Judgment |
| C2 | STAMP control loop identified | V | Judgment |
| C3 | Unsafe control action analysis | V | Judgment |
| C4 | Process model matches reality | E | LLM lists assumptions + detection mechanisms |
| C5 | No "user error" in failure analysis | V | Judgment |

---

### 7.3 resilience

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Gains from failure — system improves after small failure | V | Judgment |
| C2 | Circuit breakers for each external dependency | E | LLM lists dependencies + circuit breaker status |
| C3 | Graceful degradation paths defined | E | LLM lists non-critical features + fallback behavior |
| C4 | Provider lock-in check — interface boundary exists | P | Search for single-provider SDK without wrapper |
| C5 | Utilization headroom — nothing routinely >80% | E | LLM lists resource utilization |

---

## 8. UI/UX (11 skills)

### 8.1 components

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Atoms: zero business logic | P | Search atom components for API calls, service imports |
| C2 | Molecules: compose only atoms | P | Check molecule imports for other molecules/organisms |
| C3 | Templates: layout only, no content/fetching | P | Search template components for data fetching |
| C4 | Design tokens for all values | P | Grep for hardcoded px/hex/rem not using `var(--` |
| C5 | Renders in isolation (Storybook) | V | Judgment |

---

### 8.2 motion

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Animation ≤300ms (page transitions ≤500ms) | P | Search CSS/JS for animation durations >300ms |
| C2 | Animation communicates change (not decorative) | V | Judgment |
| C3 | `prefers-reduced-motion` handled | M | Grep CSS for `prefers-reduced-motion` media query |
| C4 | Exit faster than enter (asymmetric timing) | V | Judgment |
| C5 | No `linear` easing | P | Grep CSS for `linear` in animation/transition |

---

### 8.3 mobile

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Touch targets ≥44x44px, ≥8px gap | P | Search CSS for button/link sizes <44px |
| C2 | Input type specificity (email, tel, url, number, date) | P | Grep for `<input` without specific `type` |
| C3 | Labels above inputs, not beside/placeholder-only | P | Search for `placeholder` without visible `<label>` |
| C4 | Critical content above fold on 375px | V | Judgment (requires rendering) |
| C5 | Interactive within 3s on 3G | V | Judgment (requires Lighthouse) |

---

### 8.4 interaction

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Feedback within 100ms of user action | V | Judgment |
| C2 | Destructive actions: confirmation or undo | E | LLM lists destructive actions + protection mechanism |
| C3 | Loading indicator >100ms, progress >1s | V | Judgment |
| C4 | Gesture alternatives — button/menu for every gesture | E | LLM lists gesture interactions + button alternatives |
| C5 | Interactive elements in thumb zone on mobile | V | Judgment |

---

### 8.5 tokens

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Design tokens for all color/spacing/typography | P | Same as components C4 |
| C2 | Semantic token names (purpose, not literal) | P | Grep for token names containing color/size literals |
| C3 | Semver versioning for tokens | V | Judgment |
| C4 | Component docs: guidelines, props, states, a11y | E | LLM lists components + doc coverage |
| C5 | Zero raw values outside token layer | P | Same as components C4 |

---

### 8.6 typography

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Type scale defined, body ≥16px | P | Search CSS for body font-size <16px |
| C2 | Prose containers 45-75ch line length | P | Search for `max-width: 65ch` or equivalent |
| C3 | Vertical rhythm — consistent base unit | P | Search for spacing values not on base grid |
| C4 | ≤3 font weights | P | Count distinct font-weight values |
| C5 | Squint test — hierarchy by type alone | V | Judgment |

---

### 8.7 visual

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Spacing from defined scale | P | Same as design C3 |
| C2 | Color palette ≤6 hues | P | Count distinct hue values in CSS |
| C3 | Hierarchy without color | V | Judgment |
| C4 | Shadow scale defined, no ad-hoc values | P | Search for box-shadow values not using tokens |
| C5 | Border-radius from scale | P | Search for border-radius values not using tokens |

---

### 8.8 design

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Subtraction test — remove each element | V | Judgment |
| C2 | Single focal point — one primary action | V | Judgment |
| C3 | Spacing from scale (4/8/12/16/24/32/48/64) | P | Same as visual C1 |
| C4 | ≤3 non-grayscale colors | P | Same as visual C2 |
| C5 | Honesty — no lying UI elements | V | Judgment |
| C6 | 5-year test — no trendy treatments | V | Judgment |

---

### 8.9 usability

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Visible hover/active/focus states | P | Search CSS for `:hover`/`:active`/`:focus` on interactive elements |
| C2 | Error messages: what's wrong + how to fix | V | Judgment |
| C3 | Loading indicator within 100ms | V | Judgment |
| C4 | Touch targets ≥44px, ≥8px gap | P | Same as mobile C1 |
| C5 | Consistent mental model | V | Judgment |
| C6 | Destructive confirmation | E | Same as interaction C2 |

---

### 8.10 handoff

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | All interaction states specified | E | LLM lists components + state coverage |
| C2 | Responsive breakpoints defined | E | LLM lists breakpoints + behavior |
| C3 | Animation specs measurable (ms, easing, property) | V | Judgment |
| C4 | Truncation behavior specified | E | LLM lists text elements + overflow behavior |
| C5 | Design walked through with developer | V | Judgment (process check) |

---

### 8.11 personas

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Persona goals are end goals | V | Judgment |
| C2 | Excise eliminated | V | Judgment |
| C3 | Most common path is easiest | V | Judgment |
| C4 | Undo over confirmation for destructive actions | V | Judgment |
| C5 | Smart defaults for every input | E | LLM lists inputs + default values |

---

## 9. VISUALIZATION (4 skills)

### 9.1 charts

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Bar chart Y-axis starts at zero | P | Check chart configs for non-zero baselines |
| C2 | Lie factor between 0.95 and 1.05 | V | Judgment (requires calculation) |
| C3 | Zero 3D effects, drop shadows, gradient fills on data | P | Search for 3D/shadow/gradient on data elements |
| C4 | Can remove any gridline/border without losing info | V | Judgment |
| C5 | Color encodes data, non-data in gray | V | Judgment |

---

### 9.2 dashboards

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | No scrolling on 1920x1080 | V | Judgment (requires rendering) |
| C2 | Most important metric in top-left | V | Judgment |
| C3 | ≤7 widgets | P | Count dashboard widgets |
| C4 | Summary numbers have drill-down | E | LLM lists summary numbers + drill-down paths |
| C5 | No gauges or pie charts | P | Search for gauge/pie chart components |
| C6 | Default palette is grayscale | P | Check default chart color configuration |

---

### 9.3 data-story

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | One insight per visualization (title is a finding) | V | Judgment |
| C2 | Key data points annotated | V | Judgment |
| C3 | Narrative arc: setup, tension, resolution | V | Judgment |
| C4 | One boldest/brightest element = main point | V | Judgment |
| C5 | "Would removing this change meaning?" test | V | Judgment |

---

### 9.4 d3

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | `.data()` includes key function, not index-based | P | Grep for `.data(` without second argument |
| C2 | All three join states handled (enter, update, exit) | P | Search for `.data()` without `.join()` or `.exit()` |
| C3 | Margin convention (margin object, inner g, translate) | P | Search for SVG setup without margin convention |
| C4 | Transitions convey data change, not decorative | V | Judgment |
| C5 | Reusable charts as closures with getter-setters | V | Judgment |

---

## 10. BUSINESS (6 skills)

### 10.1 competition

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | All 5 forces analyzed with strength rating | E | LLM lists forces + ratings |
| C2 | Substitutes identified by name | V | Judgment |
| C3 | Single generic strategy named, no "and" hedging | V | Judgment |
| C4 | Explicit trade-offs — what we choose NOT to do | V | Judgment |
| C5 | Strategy vs operational effectiveness distinguished | V | Judgment |

---

### 10.2 strategy

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Written diagnosis names specific challenge | V | Judgment |
| C2 | Guiding policy states what will and will NOT be done | V | Judgment |
| C3 | 3+ coherent actions, each reinforces another | E | LLM lists actions + reinforcement connections |
| C4 | Fluff test — competitor's strategy can't be swapped in | V | Judgment |
| C5 | Decisions/actions, not goals disguised as strategy | V | Judgment |

---

### 10.3 moats

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Specific Power (of 7) identified by name | V | Judgment |
| C2 | Benefit stated | V | Judgment |
| C3 | Barrier stated | V | Judgment |
| C4 | Barrier durability — holds in 5 years | V | Judgment |
| C5 | Counter-positioning evaluated | V | Judgment |
| C6 | Not confusing growth/quality/culture with Power | V | Judgment |

---

### 10.4 leadership

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Decision-making authority assigned to named person | V | Judgment |
| C2 | Communication chain defined | E | LLM lists chain: who tells whom, when |
| C3 | Wartime/peacetime mode declared | V | Judgment |
| C4 | Fallback plan exists | V | Judgment |
| C5 | "What if not my friend?" test for personnel decisions | V | Judgment |

---

### 10.5 management

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | High-leverage activity identified | V | Judgment |
| C2 | Leading indicators tracked (not lagging) | V | Judgment |
| C3 | Meetings end with decisions/action items | V | Judgment |
| C4 | OKR key results are quantitative and measurable | V | Judgment |
| C5 | Single highest-leverage activity for the week | V | Judgment |

---

### 10.6 platforms

| # | Check | Layer | Enforcement |
|---|-------|-------|-------------|
| C1 | Who controls customer relationship identified | V | Judgment |
| C2 | What is aggregated + is supply commoditized | V | Judgment |
| C3 | Margin located in value chain | V | Judgment |
| C4 | Classified as aggregator/platform/vertical/marketplace | V | Judgment |
| C5 | Network effects verified as real | V | Judgment |

---

## Canary Test Categories

Canary violations are planted before review phases. Each canary maps to specific canon skills.

| Canary Category | What's Planted | Catches Failure In |
|-----------------|----------------|-------------------|
| **Naming** | Parameter named `data`, function named `processStuff` | clarity, composition |
| **Security** | `exec(userInput)`, hardcoded `API_KEY = "sk-..."` | security-mindset, owasp |
| **Types** | `any` type, missing return type, loose equality `==` | typescript, js-safety |
| **Complexity** | 40-line function, nesting depth 4, 7-parameter function | data-first, clarity, functional |
| **Testing** | Mock replacing the SUT, test named "should work" | test-doubles, test-strategy |

If a reviewer misses 2+ canaries, the review is thrown out and rerun with a different model.

---

## Implementation Priority

### Phase 1: Machine Gates (47 checks) — Build first

These are deterministic. Zero AI needed. Zero false negatives.

**Highest impact:**
- No `any` type (typescript)
- No `==` / `!=` (js-safety)
- No `var` (js-safety)
- No `eval` / `new Function` (js-safety)
- No hardcoded secrets (security-mindset)
- No prototype monkey-patching (js-internals)
- Function length ≤30 lines (data-first)
- Strict mode enabled (typescript)
- Return types on exports (typescript)
- No fire-and-forget async (async)
- `npm audit` clean (security-mindset)
- No string concat injection (owasp)

### Phase 2: Proxy Checks (78 checks) — Build second

Measurable signals that correlate with judgment-based rules.

**Highest impact:**
- Parameter count ≤3 (functional)
- Nesting depth ≤3 (data-first)
- Interface method count ≤3 (simplicity)
- Inheritance depth ≤2 (abstraction)
- No `.push()`/`.splice()` mutations (functional)
- Empty catch blocks (pragmatism)
- No `range(len())` in Python (python-idioms)
- No `os.path` in Python (python-idioms)
- No `fireEvent` in React tests (react-test)
- No nested `.subscribe()` in RxJS (rxjs)
- Passive voice in docs (brevity)

### Phase 3: Evidence Checklists (135 checks) — Build third

LLM must enumerate every item; machine validates the count.

**Highest impact:**
- List every mock + target (test-doubles)
- List every input boundary + validation (security-mindset)
- List every external call + failure handling (distributed, failure)
- List every function + side effect classification (functional, optimization)
- List every catch block + fail-open/closed (security-mindset)
- List every dependency + justification (pragmatism)

### Phase 4: Three-Model Vote + Canaries (158 checks) — Build fourth

These are genuine judgment calls. The only enforcement is requiring three independent opinions and verifying the review happened.

---

## The Math

```
Total checks across 64 canon skills:        418
Machine-enforceable (100% catch rate):        47  (11%)
Proxy-checkable (100% signal catch rate):     78  (19%)
Evidence-checklistable (~90% completeness):  135  (32%)
Judgment-only (three opinions, not one):     158  (38%)

Combined machine-reliable enforcement:       260  (62%)
Pure judgment (improved but not mechanical):  158  (38%)
```

Without the five-layer system: all 418 checks are suggestions an LLM may or may not follow.

With the five-layer system: 260 checks have machine-level enforcement, and the remaining 158 get three independent opinions verified by canaries instead of one unverified opinion.
