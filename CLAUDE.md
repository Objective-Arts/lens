## Profiles Applied

`typescript-cli`

## Available Commands

| Command | Description |
|---------|-------------|
| `/ralph-loop [prd-file] [--max N] [--resume]` | Autonomous PRD implementation loop |
| `/build [path] [--rollback] [--dry-run]` | Build new feature with 11-phase quality pipeline |
| `/improve [path] [--rollback] [--dry-run]` | Improve existing code with 11-phase quality pipeline |
| `/quick-edit [description]` | Simple changes (add field, rename, small fix) |
| `/quick-clean [path]` | Fast AI smell cleanup before commit |
| `/create-plan [task]` | Create implementation plan before coding |
| `/structure-first [path]` | Map architecture or design data structures |
| `/implement-plan [target]` | Implement code from plan |
| `/refactor-check-fix [target]` | Systematic code cleanup |
| `/ai-smell-fix [path]` | Remove AI-generated code patterns |
| `/dedupe-fix [path]` | Consolidate duplicated code |
| `/gemini-fix [path]` | Gemini review + fix all issues |
| `/qodana-fix [path]` | Static analysis + fix all issues |
| `/adversarial-security-review [path]` | Security audit - think like an attacker |
| `/write-tests-run [level]` | Write and run tests |
| `/generate-docs [path]` | Generate documentation |
| `/final-polish [path]` | Final refinement for senior review |

**Read-only scans:**

| Command | Description |
|---------|-------------|
| `/gemini-scan [path]` | Gemini review (report only) |
| `/qodana-scan [path]` | Static analysis (report only) |
| `/refactor-scan [path]` | Refactoring opportunities (report only) |
| `/ai-smell-scan [path]` | AI code patterns (report only) |
| `/dedupe-scan [path]` | Duplicate code (report only) |
| `/naming-review [path]` | Name clarity check |

**Utilities:**

| Command | Description |
|---------|-------------|
| `/lens` | Home base - status and help |
| `/session-status` | Show active primitives |
| `/explain-skill [name]` | Explain what a skill does |

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
- Use const by default, let when reassignment needed
- Prefer arrow functions for callbacks
- Use async/await over raw promises
- Destructure objects and arrays
- Use template literals for string interpolation
- Prefer named exports over default exports
- Use TypeScript strict mode
- Avoid any type - prefer unknown when type is uncertain

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
- var declarations (use const/let)
- Implicit type coercion (use === and !==)
- Global variables
- Callback hell (use async/await)
- Mutating function parameters
- Using any type without justification
- Ignoring promise rejections

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
| Complex JavaScript runtime, closures, this, scope | INVOKE `/js-internals` |
| TypeScript types, generics, inference, utility types | INVOKE `/typescript` |
| JavaScript subset, safe patterns, avoiding pitfalls | INVOKE `/js-safety` |
| Functional JavaScript, lodash patterns | INVOKE `/functional` |
| Static analysis, linting, code style | INVOKE `/style` for universal formatting/cla |
