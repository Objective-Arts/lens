# Complete Auto-Invoke Rules

Copy this table into CLAUDE.md or integrate into profile generation.

## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Security, authentication, passwords, tokens, encryption, crypto | INVOKE `/security-mindset` then `/owasp` |
| Input validation, sanitization, SQL injection, XSS, CSRF | INVOKE `/owasp` |
| AppSec, SAST, DAST, security testing, vulnerability scanning | INVOKE `/appsec` |
| Security breaches, incident response, data exposure | INVOKE `/web-security` |
| Threat modeling, security architecture, trust boundaries | INVOKE `/threat-model` |
| Java code, JVM, Maven, Gradle, Spring | INVOKE `/java` |
| Java design patterns, factories, builders, immutability | INVOKE `/java` then `/design-patterns` |
| Python code, pythonic patterns, iterators, generators | INVOKE `/python-idioms` then `/python-protocols` |
| Python async, asyncio, concurrency | INVOKE `/python-advanced` |
| Python best practices, idioms | INVOKE `/python-patterns` |
| Go code, golang, goroutines, channels | INVOKE `/simplicity` |
| C# code, .NET, LINQ, async patterns | INVOKE `/csharp-depth` |
| TypeScript advanced types, generics, inference, utility types | INVOKE `/typescript` then `/type-systems` |
| TypeScript compiler, type system design | INVOKE `/type-systems` |
| Angular components, services, modules | INVOKE `/angular-core` then `/angular-arch` |
| Angular performance, change detection, lazy loading | INVOKE `/angular-perf` |
| Angular forms, routing, state management | INVOKE `/angular-arch` |
| React components, hooks, state, composition | INVOKE `/react-state` |
| React testing, Testing Library, user events | INVOKE `/react-test` |
| Redux, state management, actions, reducers | INVOKE `/react-state` |
| RxJS, observables, operators, streams | INVOKE `/rxjs` then `/async` |
| Async patterns, promises, event loops | INVOKE `/async` |
| Svelte, reactive frameworks, stores | INVOKE `/reactivity` |
| JavaScript fundamentals, closures, this, scope, prototypes | INVOKE `/js-internals` |
| JavaScript safe subset, avoiding pitfalls, lint rules | INVOKE `/js-safety` |
| JavaScript design patterns, module patterns, namespacing | INVOKE `/js-perf` |
| Functional JavaScript, lodash, underscore, FP patterns | INVOKE `/functional` |
| D3.js, SVG, data binding, selections, transitions | INVOKE `/d3` |
| Data visualization, charts, graphs, dashboards | INVOKE `/d3` then `/charts` |
| Data-ink ratio, chartjunk, visual clarity | INVOKE `/charts` |
| Storytelling with data, presentations, annotations | INVOKE `/data-story` |
| Dashboard design, small multiples, sparklines | INVOKE `/dashboards` |
| Unit testing, test doubles, mocks, stubs, fakes | INVOKE `/test-doubles` |
| Testing strategy, test pyramid, integration tests | INVOKE `/test-strategy` |
| Testing Trophy, what to test, testing confidence | INVOKE `/react-test` |
| Legacy code, characterization tests, seams, dependency breaking | INVOKE `/legacy` |
| TDD, test-driven development, red-green-refactor | INVOKE `/test-doubles` then `/test-strategy` |
| Design patterns, creational, structural, behavioral | INVOKE `/design-patterns` |
| SOLID principles, LSP, dependency inversion | INVOKE `/abstraction` |
| Algorithms, complexity, optimization, data structures | INVOKE `/algorithms` then `/correctness` |
| Distributed systems, concurrency, correctness proofs | INVOKE `/correctness` |
| API documentation, reference docs, technical writing | INVOKE `/docs` |
| Tutorials, how-to guides, explanations, Diataxis | INVOKE `/docs` |
| README, getting started, onboarding docs | INVOKE `/docs` then `/brevity` |
| Writing clarity, conciseness, style | INVOKE `/brevity` then `/prose` |
| Non-fiction writing, drafting, revising | INVOKE `/prose` |
| Storytelling, narrative, communication | INVOKE `/editing` |
| Unix philosophy, pipes, small tools, composition | INVOKE `/composition` then `/clarity` |
| Shell scripting, command line, text processing | INVOKE `/clarity` |
| Systems programming, C, memory management | INVOKE `/clarity` then `/pragmatism` |
| Kernel development, low-level optimization | INVOKE `/data-first` |
| Game development, performance optimization, 3D graphics | INVOKE `/optimization` |
| UI components, component libraries, atomic design | INVOKE `/components` |
| Interaction design, affordances, feedback | INVOKE `/personas` then `/usability` |
| User experience, usability, cognitive load | INVOKE `/usability` |
| Industrial design, simplicity, form follows function | INVOKE `/design` then `/visual` |
| Visual design, aesthetics, Apple design language | INVOKE `/visual` |
| Mobile design, touch interfaces, responsive | INVOKE `/mobile` then `/interaction` |
| Gesture design, input devices, sketching | INVOKE `/interaction` |
| Forms, input design, inline validation | INVOKE `/mobile` |
| Design systems, tokens, theming, consistency | INVOKE `/tokens` |
| Typography, fonts, readability, hierarchy | INVOKE `/typography` |
| Presentation design, slides, visual communication | INVOKE `/motion` |
| Animations, transitions, motion design | INVOKE `/motion` |
| Safety-critical systems, fault tolerance, hazard analysis | INVOKE `/safety` |
| Risk management, antifragility, black swans | INVOKE `/resilience` |
| Engineering failures, learning from mistakes | INVOKE `/failure` |
| Business strategy, competitive advantage, positioning | INVOKE `/competition` |
| Good strategy, bad strategy, diagnosis, guiding policy | INVOKE `/strategy` |
| Management, OKRs, high-output management | INVOKE `/management` |
| Startup strategy, hard things, scaling | INVOKE `/leadership` |
| Technical communication, memos, proposals | INVOKE `/moats` then `/brevity` |
| Product discovery, user research, customer development | INVOKE `/handoff` |
| SQL queries, database design, schemas | INVOKE `/sql` |
| SQL performance, query optimization, indexes | INVOKE `/sql-perf` |

## Workflow Auto-Invoke (Always Include)

| Context | Action |
|---------|--------|
| Starting implementation of a feature or task | INVOKE `/plan` first |
| Feature implementation complete | INVOKE `/test` then `/independent-review` |
| Before commit or PR | INVOKE `/independent-review` |
| Review finds critical issues | Fix immediately before continuing |
| Writing new code from scratch | INVOKE `/structure-first` then `/implement` |
| Refactoring existing code | INVOKE `/test` first, then refactor, then `/test` again |
| Adding documentation | INVOKE `/docs` for structure, `/doc-code` to generate |
