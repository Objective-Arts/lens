# Complete Auto-Invoke Rules

Copy this table into CLAUDE.md or integrate into profile generation.

## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Security, authentication, passwords, tokens, encryption, crypto | INVOKE `/schneier` then `/owasp` |
| Input validation, sanitization, SQL injection, XSS, CSRF | INVOKE `/owasp` |
| AppSec, SAST, DAST, security testing, vulnerability scanning | INVOKE `/tanya-janca` |
| Security breaches, incident response, data exposure | INVOKE `/troy-hunt` |
| Threat modeling, security architecture, trust boundaries | INVOKE `/security-mindset` |
| Java code, JVM, Maven, Gradle, Spring | INVOKE `/bloch` |
| Java design patterns, factories, builders, immutability | INVOKE `/bloch` then `/gang-of-four` |
| Python code, pythonic patterns, iterators, generators | INVOKE `/hettinger` then `/ramalho` |
| Python async, asyncio, concurrency | INVOKE `/beazley` |
| Python best practices, idioms | INVOKE `/slatkin` |
| Go code, golang, goroutines, channels | INVOKE `/pike` |
| C# code, .NET, LINQ, async patterns | INVOKE `/skeet` |
| TypeScript advanced types, generics, inference, utility types | INVOKE `/cherny` then `/hejlsberg` |
| TypeScript compiler, type system design | INVOKE `/hejlsberg` |
| Angular components, services, modules | INVOKE `/hevery` then `/kurata` |
| Angular performance, change detection, lazy loading | INVOKE `/minko-gechev` |
| Angular forms, routing, state management | INVOKE `/kurata` |
| React components, hooks, state, composition | INVOKE `/abramov` |
| React testing, Testing Library, user events | INVOKE `/dodds` |
| Redux, state management, actions, reducers | INVOKE `/abramov` |
| RxJS, observables, operators, streams | INVOKE `/ben-lesh` then `/cleary` |
| Async patterns, promises, event loops | INVOKE `/cleary` |
| Svelte, reactive frameworks, stores | INVOKE `/harris` |
| JavaScript fundamentals, closures, this, scope, prototypes | INVOKE `/kyle-simpson` |
| JavaScript safe subset, avoiding pitfalls, lint rules | INVOKE `/crockford` |
| JavaScript design patterns, module patterns, namespacing | INVOKE `/osmani` |
| Functional JavaScript, lodash, underscore, FP patterns | INVOKE `/ashkenas` |
| D3.js, SVG, data binding, selections, transitions | INVOKE `/bostock` |
| Data visualization, charts, graphs, dashboards | INVOKE `/bostock` then `/tufte` |
| Data-ink ratio, chartjunk, visual clarity | INVOKE `/tufte` |
| Storytelling with data, presentations, annotations | INVOKE `/knaflic` |
| Dashboard design, small multiples, sparklines | INVOKE `/few` |
| Unit testing, test doubles, mocks, stubs, fakes | INVOKE `/meszaros` |
| Testing strategy, test pyramid, integration tests | INVOKE `/fowler-test` |
| Testing Trophy, what to test, testing confidence | INVOKE `/dodds` |
| Legacy code, characterization tests, seams, dependency breaking | INVOKE `/feathers` |
| TDD, test-driven development, red-green-refactor | INVOKE `/meszaros` then `/fowler-test` |
| Design patterns, creational, structural, behavioral | INVOKE `/gang-of-four` |
| SOLID principles, LSP, dependency inversion | INVOKE `/liskov` |
| Algorithms, complexity, optimization, data structures | INVOKE `/knuth` then `/dijkstra` |
| Distributed systems, concurrency, correctness proofs | INVOKE `/dijkstra` |
| API documentation, reference docs, technical writing | INVOKE `/procida` |
| Tutorials, how-to guides, explanations, Diátaxis | INVOKE `/procida` |
| README, getting started, onboarding docs | INVOKE `/procida` then `/strunk-white` |
| Writing clarity, conciseness, style | INVOKE `/strunk-white` then `/zinsser` |
| Non-fiction writing, drafting, revising | INVOKE `/zinsser` |
| Storytelling, narrative, communication | INVOKE `/king` |
| Unix philosophy, pipes, small tools, composition | INVOKE `/mcilroy` then `/kernighan` |
| Shell scripting, command line, text processing | INVOKE `/kernighan` |
| Systems programming, C, memory management | INVOKE `/kernighan` then `/thompson` |
| Kernel development, low-level optimization | INVOKE `/linus` |
| Game development, performance optimization, 3D graphics | INVOKE `/carmack` |
| UI components, component libraries, atomic design | INVOKE `/frost` |
| Interaction design, affordances, feedback | INVOKE `/cooper` then `/norman` |
| User experience, usability, cognitive load | INVOKE `/norman` |
| Industrial design, simplicity, form follows function | INVOKE `/rams` then `/ive` |
| Visual design, aesthetics, Apple design language | INVOKE `/ive` |
| Mobile design, touch interfaces, responsive | INVOKE `/wroblewski` then `/buxton` |
| Gesture design, input devices, sketching | INVOKE `/buxton` |
| Forms, input design, inline validation | INVOKE `/wroblewski` |
| Design systems, tokens, theming, consistency | INVOKE `/curtis` |
| Typography, fonts, readability, hierarchy | INVOKE `/kruzeniski` |
| Presentation design, slides, visual communication | INVOKE `/duarte` |
| Animations, transitions, motion design | INVOKE `/duarte` |
| Safety-critical systems, fault tolerance, hazard analysis | INVOKE `/leveson` |
| Risk management, antifragility, black swans | INVOKE `/taleb` |
| Engineering failures, learning from mistakes | INVOKE `/petroski` |
| Business strategy, competitive advantage, positioning | INVOKE `/porter` |
| Good strategy, bad strategy, diagnosis, guiding policy | INVOKE `/rumelt` |
| Management, OKRs, high-output management | INVOKE `/grove` |
| Startup strategy, hard things, scaling | INVOKE `/horowitz` |
| Technical communication, memos, proposals | INVOKE `/helmer` then `/strunk-white` |
| Product discovery, user research, customer development | INVOKE `/mall` |

## Workflow Auto-Invoke (Always Include)

| Context | Action |
|---------|--------|
| Starting implementation of a feature or task | INVOKE `/plan` first |
| Feature implementation complete | INVOKE `/test` then `/review-hard` |
| Before commit or PR | INVOKE `/review-hard` |
| Review finds critical issues | Fix immediately before continuing |
| Writing new code from scratch | INVOKE `/structure-first` then `/build-from-plan` |
| Refactoring existing code | INVOKE `/test` first, then refactor, then `/test` again |
| Adding documentation | INVOKE `/procida` for structure, `/doc-code` to generate |
