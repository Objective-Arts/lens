## Profiles Applied

`javascript + ralph-integration`

## Available Commands

| Command | Description |
|---------|-------------|
| `/ralph-loop [prd-file] [--max N] [--resume] [--external]` | Autonomous PRD implementation loop |
| `/implement [task]` | Implement a feature with quality gates |
| `/review-hard [--scope file|function]` | Rigorous code review with canon lens |
| `/test [--coverage] [--watch]` | Run tests with Testing Trophy strategy |
| `/plan [task]` | Create implementation plan before coding |
| `/structure-first [feature]` | Design data structures before implementation |
| `/refactor-check [target]` | Systematic code cleanup |
| `/build-from-plan [plan-file]` | Execute approved plan |

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
- Check git log at start of each iteration to understand completed work
- Pick next incomplete PRD item (marked [ ]) before implementing
- Commit after each meaningful progress, not just at item completion
- Mark PRD items complete [x] only after tests AND review pass
- Run tests after implementing each feature
- Run /review-hard before marking any item complete
- Fix all critical issues before moving to next item
- If stuck on same issue for 3+ attempts, log blocker and move on
- Maximum 5 iterations per PRD item before escalation
- Exit loop if 3 consecutive iterations produce no commits

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
- Marking items complete without running tests
- Skipping review on 'simple' changes
- Implementing features not in PRD
- Perfectionism loops (good enough > perfect)
- Ignoring test failures to 'move faster'

## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Writing any code | INVOKE `/kernighan` `/pike` `/mcilroy` `/linus` `/dijkstra` `/thompson` `/bill-joy` for core principles |
| Performance-critical code | INVOKE `/carmack` for optimization patterns |
| Algorithm design | INVOKE `/knuth` for algorithmic rigor |
| OOP design, inheritance, patterns | INVOKE `/liskov` then `/gang-of-four` |
| Security-sensitive code (auth, input, data) | INVOKE `/schneier` then `/owasp` |
| Authentication, authorization, sessions | INVOKE `/bruce-schneier` then `/troy-hunt` |
| Input validation, output encoding | INVOKE `/owasp` then `/tanya-janca` |
| Security review, threat modeling | INVOKE `/security-mindset` then `/schneier` |
| Writing tests | INVOKE `/meszaros` for test patterns |
| Test strategy, test pyramid, choosing test types | INVOKE `/fowler-test` for testing strategy |
| Working with legacy code | INVOKE `/feathers` for seams and characterization tests |
| Building robust systems, handling uncertainty, failure modes | INVOKE `/taleb` for antifragility principles |
| Writing documentation | INVOKE `/procida` for Diataxis |
| Writing READMEs, comments, commit messages | INVOKE `/strunk-white` (omit needless words) |
| Analyzing failures or risks | INVOKE `/petroski` and `/leveson` |
| Production deployment, database migration, irreversible operation | INVOKE `/ceremony` for checkpoint-based execution |
| Validating critical code, comprehensive checks, bulletproof validation | INVOKE `/defense-in-depth` for multi-layer validation |
| Bug fix with unknown complexity, troubleshooting, trying obvious fix first | INVOKE `/escalate` - start simple, investigate only if simple fails |
| Fixing failing tests, iterating until validation passes | INVOKE `/generate-validate` loop until green |
| Unfamiliar codebase, exploring how something works, investigating before changes | INVOKE `/understand-first` - research before modifying |
| Comprehensive code review, architectural trade-offs, multiple perspectives needed | INVOKE `/specialist-swarm` for multi-expert analysis |
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
| Design-dev handoff, collaboration, prototyping workflow | INVOKE `/mall` for hot potato collaboration |
| Starting a new PRD item implementation | Read git log, identify related previous work |
| Feature implementation complete | INVOKE `/test` then `/review-hard` |
| Review finds critical issues | Fix immediately before continuing |
| Stuck on same error multiple iterations | Log blocker, consider moving to next item |
