# Lens: Teaching AI to Code Like a Senior Engineer

AI coding assistants write code that compiles. They satisfy the prompt, pass the obvious tests, and move on. But anyone who has shipped production software knows the gap between "it works" and "it ships" is where most of the cost lives. Review cycles, security audits, performance regressions, architectural debt that compounds over months — these problems don't come from code that fails. They come from code that works, but works badly.

The pattern is consistent enough to describe. Ask an AI to build a command-line tool with a keychain, and you'll get code that stores passwords, retrieves them, and handles the happy path. You probably won't get path traversal protection on user-supplied filenames — checking that a file path hasn't escaped its intended directory. You won't get a schema version in the persisted data format, so the tool can't migrate data when the format changes. You won't get interactive prompts for secrets that would otherwise leak to shell history. You'll get a `KeychainManager` class with methods that work, wrapped in try-catch blocks that swallow errors, documented with comments that restate the function name, and split across six files where three would do. It compiles. It passes the tests the AI wrote for it. And it would be torn apart in any serious code review.

Lens is a system that embeds domain expertise into Claude Code — Anthropic's command-line coding agent. It transforms Claude from a general-purpose code generator into something closer to a senior engineer who has internalized the principles of Kernighan's clarity, Liskov's substitution principle, the OWASP Top 10 web vulnerabilities, and dozens of other established bodies of knowledge. The expertise enters at write-time, not at review-time. By the time code reaches a reviewer — human or automated — it has already been shaped by the same principles that reviewer would enforce.

## The core idea: skills as lenses

Lens is built on a single observation. Claude has access to more programming knowledge than any human developer. It knows about single responsibility, separation of concerns, defensive coding, and framework idioms. The problem is not knowledge. The problem is perspective. A developer who has spent years working with a book like Effective Java doesn't just know the rules — they see code differently. They notice when a constructor should be a static factory method, when a mutable return value will cause a thread-safety bug, when an interface has too many methods. This isn't recall. It's a lens that filters every decision.

Lens makes this concrete. Each "canon skill" is a markdown file that captures one expert's approach to one domain: how they think, what they check for, what patterns they follow, when they break the rules. There are 88 of these skills across 30 categories. Some examples:

- **clarity** distills Brian Kernighan's principles: clear code above clever code, meaningful names, functions that do one thing.
- **security-mindset** teaches Claude to think like an attacker: what input can be abused, what state can be corrupted, where does trust cross a boundary.
- **react-state** captures Dan Abramov's mental models for React: component composition over inheritance, state colocation, derived state as a code smell.
- **d3** and **charts** encode Edward Tufte's principles of graphical integrity for data visualization: maximize the ratio of data to ink, use small multiples instead of complex single charts, eliminate decoration that doesn't convey information.
- **legacy** comes from Michael Feathers' Working Effectively with Legacy Code: find testable boundaries in untested code, write tests that characterize current behavior before changing it, transform behavior through safe refactoring.
- **abstraction** captures Barbara Liskov's substitution principle: any subtype must be safely usable wherever its parent type is expected.
- **pitfalls** encodes recurring mistakes that AI generates: single-use wrapper classes, defensive null checks where null is impossible, speculative configuration, swallowed errors, TOCTOU races. This canon was distilled from hundreds of real code reviews and is the most impactful single skill — it prevents the patterns that waste the most review cycles.

Each skill includes concrete checks, not vague advice. The clarity skill doesn't just say "write clear code." It specifies: functions under 30 lines, no parameter named `data` or `result`, no file over 300 lines, no more than three levels of nesting. The security-mindset skill doesn't say "be careful with input." It says: resolve every user-supplied path to its real location and verify it stays within the allowed directory; never accept secrets as command-line arguments where they'd be visible in process listings; validate schema versions on every read of persisted data. These concrete checks are what make enforcement possible. Advice is ignorable. A checklist with file paths and line numbers is not.

## Profiles: composable expertise for project types

Nobody needs all 88 skills at once. A React frontend project needs different expertise than a Python data pipeline or a C# enterprise backend. Lens solves this with 15 composable profiles that bundle the right skills for each project type.

Profiles stack with `+` syntax. Running `lens init --profile javascript+react` combines two profiles, merging their skill sets without duplication. The result is a `.claude/` directory in your project containing canons as reference material, standards, anti-patterns, and auto-invoke rules that Claude will use for every interaction.

The `software-base` profile is always included for software projects. It provides 18 foundational skills: the 10 "Base Brain" skills that shape how Claude thinks (clarity, simplicity, correctness, pragmatism, composition, data-first, distributed, algorithms, abstraction, optimization), plus security fundamentals, testing strategy, documentation standards, and engineering philosophy. These create productive tensions — pragmatism says "get it working" while correctness says "prove it works" — and Claude resolves the tension based on context. Prototyping? Lean pragmatism. Production authentication? Lean correctness. The tensions are intentional. A system that only optimizes for one value produces brittle output. A system that balances competing values produces engineering judgment.

Domain profiles add targeted expertise. The `react` profile adds React hooks, server components, performance, and TypeScript-React patterns. The `csharp` profile adds .NET core, async patterns, LINQ, data access, dependency injection, and testing. The `frontend` profile adds 12 UI/UX skills covering atomic design, usability heuristics, typography, motion design, and accessibility. Each profile was designed so that the skills within it reinforce each other rather than conflict.

When a profile is applied, canons install as real files in the project's `.claude/canon/` directory — reference material that `/fix` and `/canon-audit` read. They're versioned, diffable, and upgradeable. Workflow skills (the slash commands like `/fix`, `/change`, `/code-scan`) install separately in `.claude/skills/`. This separation keeps Claude's skill menu clean — about 10 actionable commands instead of 50+ entries mixing actions with reference material.

Auto-invoke rules in `CLAUDE.md` connect canons to contexts automatically. When Claude encounters React hooks, the profile tells it to read the `react-hooks` canon. When it writes SQL, the SQL canon loads. The developer doesn't need to remember which expertise applies — the profile handles routing.

## Two workflows: `/change` and `/fix`

Lens provides two action commands that cover most development work.

**`/change [description]`** is for small, focused changes. Describe what you want, Claude makes it, cleans up after itself, reports what happened. No infrastructure, no external tools. Fast and cheap.

**`/fix [path]`** is for targeted review and cleanup. It loads the relevant canons and rubrics for the code's domain, runs the quality gate for deterministic violations, then Claude reviews the code against canon principles and rubric criteria. Findings are prioritized by severity (CRITICAL → HIGH → MEDIUM → LOW), fixed, and verified. The quality gate runs again to confirm deterministic issues are resolved. `--dry-run` shows what would be found without changing anything.

Both commands are Claude-native — no external model calls, no MCP servers, no API keys beyond Claude itself. They work immediately after `lens init`.

## Read-only scans

Eight scan commands analyze code without modifying it:

| Command | What it does |
|---------|-------------|
| `/code-scan [path]` | 13-dimension quality analysis with rubric-backed scoring |
| `/ai-smell-scan [path]` | Detect AI-generated code patterns (single-use helpers, comment spam, defensive paranoia) |
| `/deadcode-scan [path]` | Find unused exports, unreachable branches, dead files |
| `/naming-scan [path]` | Check naming clarity and consistency |
| `/refactor-scan [path]` | Find refactoring opportunities (long functions, deep nesting, mixed concerns) |
| `/dedupe-scan [path]` | Find duplicated logic across files |
| `/canon-audit <canon> [path]` | Audit code against a specific canon's rules |
| `/generate-docs [path]` | Generate documentation for public APIs |

All scans are Claude-native. They produce reports without touching the code. Use them to understand a codebase, prioritize cleanup, or verify that changes improved quality.

## The quality gate: deterministic enforcement

The quality gate (`quality-gate.ts`) is a polyglot static analyzer — about 1,400 lines of deterministic regex-based checks with 150+ tests. No AI involved. Same code always gets the same result. It runs on `/fix`, and can be run standalone with `tsx .claude/scripts/quality-gate.ts .`

The gate checks three categories by language:

**All languages:** hardcoded secrets (passwords, API keys, tokens, private keys), empty catch blocks, TODO accumulation (>3 markers), hardcoded URLs.

**JavaScript/TypeScript:** shell injection (exec with template literals), path traversal (user input in path.join without validation), TOCTOU races (existsSync then readFileSync), circular imports (DFS cycle detection), dangerous eval/innerHTML, falsy numeric guards, comment spam (JSDoc restating function name), function length (>30 lines), file length (>300 lines), vague parameter names, too many exports, magic numbers, verification reads.

**C#:** async void (except event handlers), sync-over-async (.Result, .Wait()), SQL injection (string concatenation in SqlCommand), missing dispose (IDisposable without using), mutable public fields, large structs (>4 fields), plus polyglot versions of the proxy checks (function length, parameter count, magic values, etc.).

**Java:** raw type usage (List without type parameters), string concatenation in loops, mutable public fields, plus polyglot proxy checks.

The gate is the pitfalls canon turned into automated enforcement. A match is a fail — no arguing, no "I think this one is safe." It catches real bugs that AI consistently produces: shell injection through string interpolation, TOCTOU races from existsSync-then-readFileSync, path traversal from unvalidated user input. These are the patterns that survive AI self-review but fail security audit.

## Rubrics: structured review criteria

14 rubric files give reviewers specific, numbered criteria to check against. Unlike canons (which teach how to think), rubrics tell reviewers what to score and how. They're loaded during `/fix`, `/code-scan`, and pipeline review phases.

Auto-detection controls which rubrics load based on what's in the code:
- `base.md` and `product-quality.md` always load
- `typescript.md` loads when `.ts` files are detected
- `web-api.md` loads when HTTP server code is found
- `data-persistence.md` loads when SQL/ORM patterns appear
- `security.md` loads when HTTP or microservice patterns are found
- `react.md` loads when React dependencies are detected
- `csharp.md` loads when C# files are detected

The rubrics complement the canons. A canon teaches Claude to write better React code. The rubric tells the reviewer exactly what to check: hook rules followed? Key props on lists? Memo usage justified? Effect dependencies correct? Together, canons prevent problems at write-time and rubrics catch what slips through at review-time.

## How it all fits together

```
lens init --profile react
    │
    ├── .claude/skills/     ~10 workflow commands (/fix, /change, /code-scan, ...)
    ├── .claude/canon/      Domain canons from profile (react-hooks, typescript, ...)
    ├── .claude/rubric/     14 scoring rubrics (auto-detected by domain)
    ├── .claude/scripts/    Quality gate (deterministic static analysis)
    └── CLAUDE.md           Standards, anti-patterns, auto-invoke rules
```

The flow during development:

1. **Write code.** Canons load automatically via auto-invoke rules in CLAUDE.md. Claude writes code informed by domain expertise from the start.
2. **Make changes.** `/change` for small focused work. Claude makes the change, runs the quality gate, cleans up.
3. **Review and fix.** `/fix` loads canons + rubrics, runs the quality gate, reviews against canon principles, fixes findings by severity, verifies with the gate again.
4. **Scan on demand.** `/code-scan`, `/ai-smell-scan`, `/canon-audit` etc. for deeper analysis when needed.

The quality gate is the objective checkpoint — deterministic, no AI, pass/fail. The canons are the subjective expertise — domain knowledge that shapes every line of code. The rubrics bridge the gap — turning subjective expertise into structured checklists that produce consistent reviews.

## What `lens init` actually does

One command sets up everything:

```bash
lens init                              # auto-detects stack
lens init --profile javascript+react   # or specify explicitly
```

It detects your project's language and framework, loads the matching profile, and creates the `.claude/` directory with:

- **Workflow skills** (~10 slash commands) in `.claude/skills/`
- **Canon skills** (domain expertise per profile) in `.claude/canon/`
- **Rubrics** (14 scoring criteria files) in `.claude/rubric/`
- **Quality gate** script in `.claude/scripts/`
- **CLAUDE.md** with standards, anti-patterns, and auto-invoke rules
- **Manifests** tracking what's installed and its version

Skills and canons are copied (not symlinked) for portability. To update after upgrading the package, run `lens init --force`.

## The fundamental bet

The bottleneck in AI-assisted development is not code generation. It's code quality. AI can write code faster than any human. But without the judgment that experienced engineers bring — judgment about architecture, security, maintainability, and the thousand small decisions that separate production code from prototype code — speed just means you produce technical debt faster.

Lens doesn't replace that judgment. It encodes it. Eighty-eight skills, each capturing one expert's hard-won perspective. A quality gate that catches the concrete violations AI consistently produces. Rubrics that turn subjective expertise into repeatable checklists. And a system simple enough that people actually use it — one command to set up, two commands to do real work.

The senior engineer who catches subtle design flaws might not exist at your company. They might not exist at most companies. Lens replaces the absence of that engineer — not with another AI opinion, but with a structured system that makes the AI's own knowledge actionable and verifiable.
