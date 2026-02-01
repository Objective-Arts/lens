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

- Clarity over cleverness (Kernighan)
- Data structures first, algorithms follow (Linus)
- Small, composable interfaces (Pike)
- Do one thing and do it well (McIlroy)
- Handle failure explicitly (Joy)
- Correctness by construction (Dijkstra)
- Get it working first, then optimize (Thompson)
- Measure before optimizing (Carmack)
- Subtypes must be substitutable (Liskov)
- Think like an attacker (Schneier)
- Validate all input, encode all output (OWASP)
- Learn from failures (Petroski)
- Safety is a system property (Leveson)
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
- Violating Liskov substitution
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
| Writing any code | Apply Base Brain lens (kernighan, pike, mcilroy, linus, dijkstra) |
| Performance-critical code | INVOKE `/carmack` for optimization patterns |
| Algorithm design | INVOKE `/knuth` for algorithmic rigor |
| OOP design, inheritance, patterns | INVOKE `/liskov` then `/gang-of-four` |
| Security-sensitive code (auth, input, data) | INVOKE `/schneier` then `/owasp` |
| Writing tests | INVOKE `/meszaros` for test patterns |
| Working with legacy code | INVOKE `/feathers` for seams and characterization tests |
| Writing documentation | INVOKE `/procida` for Diataxis, `/zinsser` for clarity |
| Writing READMEs, comments, commit messages | INVOKE `/strunk-white` (omit needless words) and `/king` (kill darlings) |
| Analyzing failures or risks | INVOKE `/petroski` and `/leveson` |
| Complex JavaScript runtime, closures, this, scope | INVOKE `/kyle-simpson` |
| TypeScript types, generics, inference, utility types | INVOKE `/cherny` |
| JavaScript subset, safe patterns, avoiding pitfalls | INVOKE `/crockford` |
| React testing, Testing Library, Testing Trophy | INVOKE `/dodds` |
| Redux, React state, composition patterns | INVOKE `/abramov` |
| Functional JavaScript, lodash patterns | INVOKE `/ashkenas` |
| Svelte, reactive frameworks | INVOKE `/harris` |
| JavaScript design patterns, module patterns | INVOKE `/osmani` |
| Building UI components, React components, frontend | INVOKE `/frost` then `/ive` then `/norman` |
| Forms, inputs, validation UI | INVOKE `/wroblewski` then `/norman` |
| Animations, transitions, motion | INVOKE `/duarte` |
| Mobile design, responsive, touch | INVOKE `/wroblewski` then `/buxton` |
| Design system, tokens, theming | INVOKE `/curtis` |
| Typography, text styling, fonts | INVOKE `/kruzeniski` |
| CSS, styling, layouts | INVOKE `/rams` |
| Static analysis, linting, code style | INVOKE `/google-style` for universal formatting/clarity |
