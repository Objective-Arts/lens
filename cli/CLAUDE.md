## Profiles Applied

`javascript + ralph-integration`

## Available Commands

Standalone workflow commands:

| Command | Description |
|---------|-------------|
| `/plan [task]` | Create implementation plan |
| `/structure-first [feature]` | Design types/interfaces |
| `/implement [target]` | Implement code from plan |
| `/refactor-check [target]` | Systematic code cleanup |
| `/adversarial-review [path]` | Hard-ass code review via Gemini |
| `/static-analysis [path]` | Run Qodana, fix issues |
| `/test [level]` | Write and run tests |
| `/doc-code [path]` | Generate documentation |

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
- Run tests after implementing each feature
- Run /adversarial-review before marking any item complete
- Fix all critical issues before moving to next item

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
- Perfectionism loops (good enough > perfect)
- Ignoring test failures to 'move faster'
