## Profiles Applied

`typescript-cli`

## Available Commands

| Command | Description |
|---------|-------------|
| `/build [path] [--rollback] [--dry-run]` | Build new feature with quality pipeline |
| `/improve [path] [--rollback] [--dry-run]` | Improve existing code with quality pipeline |
| `/quick-change [description]` | Simple changes done right — make it, clean it, report it |
| `/ai-smell-review [path]` | Deep AI smell removal |
| `/generate-docs [path]` | Generate documentation |

**Read-only scans:**

| Command | Description |
|---------|-------------|
| `/gemini-scan [path]` | Gemini review (report only) |
| `/ai-smell-scan [path]` | AI code patterns (report only) |
| `/codex-scan [path]` | Codex pattern scan (report only) |

**Utilities:**

| Command | Description |
|---------|-------------|
| `/lens` | Home base - status and help |

**Flags for /ralph-loop:**
- `--max N` — Override max iterations (default: 50)
- `--resume` — Continue from last incomplete PRD item
- `--external` — Enable Gemini + Qodana post-loop validation
- `--dry-run` — Show what would be done without executing

**Flags for /build and /improve:**
- `--rollback` — Restore from last stash
- `--dry-run` — Show what would change without modifying

## Standards

- Clarity over cleverness
- Data structures first, algorithms follow
- Small, composable interfaces
- Do one thing and do it well
- Handle failure explicitly
- Correctness by construction
- Get it working first, then optimize
- Measure before optimizing
- Subtypes must be substitutable
- Think like an attacker
- Validate all input, encode all output
- Learn from failures
- Safety is a system property
- Let TypeScript infer types - annotate sparingly
- Use discriminated unions for state machines
- Prefer unknown over any, narrow with type guards
- Use const assertions for literal types
- Understand the type system, don't fight it
- Avoid the bad parts - with, eval, implied globals
- Understand closures, this binding, scope chain
- Use strict mode always
- Prefer composition over inheritance
- Use async/await over raw promises
- Understand the event loop - never block it
- Handle promise rejections explicitly
- Use const by default, let when reassignment needed
- Prefer arrow functions for callbacks
- Destructure objects and arrays
- Use template literals for string interpolation
- Prefer named exports over default exports
- Use TypeScript strict mode
- Do one thing well, compose with pipes
- Exit codes matter - 0 for success, non-zero for failure
- Stderr for errors and diagnostics, stdout for output

## Anti-Patterns (Avoid)

- Clever code that requires comments to understand
- Deep inheritance hierarchies
- Ignoring error conditions
- Premature optimization without measurement
- Functions longer than 30 lines
- Trusting user input
- Security through obscurity
- Violating substitution principle
- God objects that do everything
- Over-annotating types TypeScript can infer
- Using any instead of unknown
- Ignoring strict mode warnings
- Type assertions (as) instead of type guards
- Blocking the event loop with sync operations
- Memory leaks from unclosed handles or listeners
- var declarations (use const/let)
- Implicit type coercion (use === and !==)
- Global variables
- Callback hell (use async/await)
- Mutating function parameters
- Ignoring promise rejections
- Mixing stdout and stderr incorrectly

## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Writing any code | Apply Base Brain lens (clarity, simplicity, composition, data-first, correctness) |
| Performance-critical code | INVOKE `/optimization` for optimization patterns |
| Algorithm design | INVOKE `/algorithms` for algorithmic rigor |
| OOP design, inheritance, patterns | INVOKE `/abstraction` then `/design-patterns` |
| Security-sensitive code (auth, input, data) | INVOKE `/security-mindset` then `/owasp` |
| Writing tests | INVOKE `/test-doubles` for test patterns |
| Working with legacy code | INVOKE `/legacy` for seams and characterization tests |
| Writing documentation | INVOKE `/docs` for Diataxis, `/prose` for clarity |
| Writing READMEs, comments, commit messages | INVOKE `/brevity` (omit needless words) and `/editing` (kill darlings) |
| Analyzing failures or risks | INVOKE `/failure` and `/safety` |
| TypeScript types, generics, inference, utility types | INVOKE /typescript |
| Type guards, discriminated unions, exhaustive checks | INVOKE /typescript |
| TypeScript compiler behavior, type system edge cases | INVOKE /type-systems |
| JavaScript closures, this, scope, prototypes | INVOKE /js-internals |
| JavaScript pitfalls, safe patterns | INVOKE /js-safety |
| Async/await, promises, event loop | INVOKE /async |
| Functional patterns, lodash-style operations | INVOKE /functional |
| Module patterns, design patterns in JS | INVOKE /js-perf |
| CLI argument parsing, stdin/stdout handling | INVOKE /composition and /simplicity |
