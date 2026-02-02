## Profiles Applied

`javascript`

## Available Commands

| Command | Description |
|---------|-------------|
| `/ralph-loop [prd-file] [--max N] [--resume]` | Autonomous PRD implementation loop |
| `/plan [task]` | Create implementation plan before coding |
| `/structure-first [feature]` | Design data structures before implementation |
| `/implement [target]` | Implement code from plan |
| `/refactor-check [target]` | Systematic code cleanup |
| `/independent-review [path]` | Code review via Gemini (bugs, edge cases, quality) |
| `/static-analysis [path]` | Run Qodana and fix issues |
| `/test [level]` | Write and run tests |
| `/doc-code [path]` | Generate documentation |
| `/security-review [path]` | Adversarial security review - think like an attacker |
| `/production-readiness [path]` | Final production readiness check and fixes |

**Flags for /ralph-loop:**
- `--max N` — Override max iterations (default: 50)
- `--resume` — Continue from last incomplete PRD item
- `--external` — Enable Gemini + Qodana post-loop validation
- `--dry-run` — Show what would be done without executing

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
| React testing, Testing Library, Testing Trophy | INVOKE `/react-test` |
| Redux, React state, composition patterns | INVOKE `/react-state` |
| Functional JavaScript, lodash patterns | INVOKE `/functional` |
| Svelte, reactive frameworks | INVOKE `/reactivity` |
| JavaScript design patterns, module patterns | INVOKE `/js-perf` |
| Building UI components, React components, frontend | INVOKE `/components` then `/visual` then `/usability` |
| Forms, inputs, validation UI | INVOKE `/mobile` then `/usability` |
| Animations, transitions, motion | INVOKE `/motion` |
| Mobile design, responsive, touch | INVOKE `/mobile` then `/interaction` |
| Design system, tokens, theming | INVOKE `/tokens` |
| Typography, text styling, fonts | INVOKE `/typography` |
| CSS, styling, layouts | INVOKE `/design` |
| Static analysis, linting, code style | INVOKE `/style` for universal formatting/clarity |
| SQL queries, database design | INVOKE `/sql` then `/sql-perf` |
