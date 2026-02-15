# Lens: Teaching AI to Code Like a Senior Engineer

AI coding assistants write code that compiles. They satisfy the prompt, pass the obvious tests, and move on. But anyone who has shipped production software knows the gap between "it works" and "it ships" is where most of the cost lives. Review cycles, security audits, performance regressions, architectural debt that compounds over months — these problems don't come from code that fails. They come from code that works, but works badly.

The pattern is consistent enough to describe. Ask an AI to build a command-line tool with a keychain, and you'll get code that stores passwords, retrieves them, and handles the happy path. You probably won't get path traversal protection on user-supplied filenames — checking that a file path hasn't escaped its intended directory. You won't get a schema version in the persisted data format, so the tool can't migrate data when the format changes. You won't get interactive prompts for secrets that would otherwise leak to shell history. You'll get a `KeychainManager` class with methods that work, wrapped in try-catch blocks that swallow errors, documented with comments that restate the function name, and split across six files where three would do. It compiles. It passes the tests the AI wrote for it. And it would be torn apart in any serious code review.

Lens is a system that embeds domain expertise into Claude Code — Anthropic's command-line coding agent. It transforms Claude from a general-purpose code generator into something closer to a senior engineer who has internalized the principles of Kernighan's clarity, Liskov's substitution principle, the OWASP Top 10 web vulnerabilities, and dozens of other established bodies of knowledge. The expertise enters at write-time, not at review-time. By the time code reaches a reviewer — human or automated — it has already been shaped by the same principles that reviewer would enforce.

## The core idea: skills as lenses

Lens is built on a single observation. Claude has access to more programming knowledge than any human developer. It knows about single responsibility, separation of concerns, defensive coding, and framework idioms. The problem is not knowledge. The problem is perspective. A developer who has spent years working with a book like Effective Java doesn't just know the rules — they see code differently. They notice when a constructor should be a static factory method, when a mutable return value will cause a thread-safety bug, when an interface has too many methods. This isn't recall. It's a lens that filters every decision.

Lens makes this concrete. Each "canon skill" is a markdown file that captures one expert's approach to one domain: how they think, what they check for, what patterns they follow, when they break the rules. There are 75 of these skills across 29 categories. Some examples:

- **clarity** distills Brian Kernighan's principles: clear code above clever code, meaningful names, functions that do one thing.
- **security-mindset** teaches Claude to think like an attacker: what input can be abused, what state can be corrupted, where does trust cross a boundary.
- **react-state** captures Dan Abramov's mental models for React, a popular UI framework: component composition over inheritance, state colocation, derived state as a code smell.
- **d3** and **charts** encode Edward Tufte's principles of graphical integrity for data visualization: maximize the ratio of data to ink, use small multiples instead of complex single charts, eliminate decoration that doesn't convey information.
- **legacy** comes from Michael Feathers' Working Effectively with Legacy Code: find testable boundaries in untested code, write tests that characterize current behavior before changing it, transform behavior through safe refactoring.
- **abstraction** captures Barbara Liskov's substitution principle: any subtype must be safely usable wherever its parent type is expected.

Each skill includes concrete checks, not vague advice. The clarity skill doesn't just say "write clear code." It specifies: functions under 30 lines, no parameter named `data` or `result`, no file over 300 lines, no more than three levels of nesting. The security-mindset skill doesn't say "be careful with input." It says: resolve every user-supplied path to its real location and verify it stays within the allowed directory; never accept secrets as command-line arguments where they'd be visible in process listings; validate schema versions on every read of persisted data. These concrete checks are what make enforcement possible. Advice is ignorable. A checklist with file paths and line numbers is not.

The skills are organized into categories that mirror how engineers think about problems: `javascript/` holds eight skills covering TypeScript, safety, performance, internals, functional patterns, React state, React testing, and reactivity. `security/` holds five skills spanning the attacker mindset, OWASP vulnerability patterns, application security, threat modeling, and web security. `ui-ux/` holds thirteen skills covering components, usability, design systems, typography, motion, personas, and more. The taxonomy maps to the way expertise clusters in real engineering teams. A frontend specialist carries a different set of mental models than a security engineer, and their skills should compose without interference.

## Profiles: composable expertise for project types

Nobody needs all 75 skills at once. A React frontend project needs different expertise than a Python data pipeline or a C# enterprise backend. Lens solves this with 14 composable profiles that bundle the right skills for each project type.

Profiles stack with `+` syntax. Running `lens profile apply javascript+react+security` combines three profiles, merging their skill sets without duplication. The result is a `.claude/` directory in your project containing the skills, standards, anti-patterns, and auto-invoke rules that Claude will use for every interaction.

The `software-base` profile is always included. It provides 24 skills: the 10 "Base Brain" skills that shape how Claude thinks (clarity, simplicity, correctness, pragmatism, composition, data-first, distributed, algorithms, abstraction, optimization), plus security fundamentals, testing strategy, documentation standards, and engineering philosophy. These create productive tensions — pragmatism says "get it working" while correctness says "prove it works" — and Claude resolves the tension based on context. Prototyping? Lean pragmatism. Production authentication? Lean correctness. The tensions are intentional. A system that only optimizes for one value produces brittle output. A system that balances competing values produces engineering judgment.

Domain profiles add targeted expertise. The `frontend` profile adds 12 UI/UX skills covering atomic design, usability heuristics, typography, motion design, and accessibility. The `python` profile adds four Python-specific skills covering generators, protocols, the data model, and idiomatic patterns. The `security` profile adds threat modeling, OWASP vulnerability patterns, application security, and web security. Each profile was designed so that the skills within it reinforce each other rather than conflict.

The pipeline also auto-detects which skills to load at each phase. If the target directory contains TypeScript files, TypeScript and JavaScript skills load automatically. If the project uses Angular, Angular architecture skills load. If React is a dependency, React state management and testing skills load. Java, Python, C#, database, visualization, and security skills all trigger from the same detection table. This means the pipeline works correctly on a Java monorepo, a React frontend, or a mixed TypeScript-and-Python project without the developer specifying which languages are involved.

When a profile is applied, skills install as real files in the project's `.claude/skills/` directory. They're versioned, diffable, and upgradeable. If a skill is updated in the Lens canon, you can see the diff and choose whether to upgrade. Local modifications are preserved. This is deliberate: expertise should be inspectable and ownable, not a black box.

## The pipeline: systematic quality at scale

Skills shape how Claude writes code in a single interaction. But real development involves sequences of decisions — architecture, implementation, testing, review, cleanup — where the output of each phase feeds the next. Lens addresses this with a build/improve pipeline, invoked with `/build` (for new features) or `/improve` (for existing code).

The pipeline has eight phases — **plan**, **structure**, **implementation**, **refactoring**, **deduplication**, **review**, **testing**, **evaluation** — with a **Learn** loop that feeds late-phase findings back to early phases. Six mechanisms recur throughout:

- **Plan-approval** — the plan phase output must contain specific sections (files, functions, types, dependencies, invariants, security, tests, work items) or it is rejected.
- **Quality-gate** — a mechanical pass/fail check at phase boundaries. No AI, no judgment, no override. Compilation, test suite, live-start verification.
- **Implementation-loop** — retry with specifics until all work items complete or max attempts reached.
- **Gate-retry** — if a phase fails its quality gate, a fix agent applies corrections and the gate reruns.
- **Rollback** — a snapshot taken at the start; `--rollback` restores the codebase to that point.
- **Learning** — late-phase findings written to lesson files; early phases read them on future runs, preventing the same defect class from recurring.

**Plan and structure.** `plan` designs the approach, identifying scope, files, risks, and decision points. The plan must include specific sections — files, functions with size estimates, types, dependencies, invariants, security measures, test cases, and concrete work items — or the phase fails validation. `structure` then defines data structures and interfaces before any implementation, so quality is designed in, not bolted on.

**Implementation.** `implementation` writes the code one unit at a time. For each unit, it rereads the most relevant skill, writes the code, then runs the type checker before starting the next unit. This catches cascading type errors at the source instead of discovering them three files later. An **implementation-loop** retries until all work items complete. Then a **quality-gate** verifies compilation and existing tests, and a live test confirms the application actually starts and serves responses.

**Refactoring and deduplication.** `refactoring` enforces structural constraints: functions under 30 lines, files under 300 lines, low branching complexity, clear naming, single responsibility. It produces evidence — every exported function evaluated for name clarity, every function for single responsibility, every literal for unexplained magic values — with pass/fail verdicts. The machine validates completeness: if the file has 14 exported functions and the review only covers 9, the review is rejected. `deduplication` consolidates duplicated code, searching for identical logic across files and extracting it to shared utilities.

**Review.** `gemini-review` sends the code to Gemini for an external review of code and product quality. `codex-review` sends the code to Codex for a second independent review. Having three models (Claude, Gemini, Codex) review the same code catches blind spots. A **quality-gate** runs Qodana static analysis, then a live test re-verifies the application still starts. `security-review` examines the code from an attacker's perspective — injection points, trust boundary violations, path traversal, secrets in process listings, data integrity gaps. Every issue must be fixed; there is no escape hatch. `ai-smell-review` removes AI-generated antipatterns: single-use helpers, defensive null checks where null is impossible, speculative configuration, comment spam. All findings feed the **learning** system. A **quality-gate** runs the test suite.

**Testing and evaluation.** `testing` writes and executes tests covering happy paths, error cases, edge cases, and adversarial scenarios like corrupted data recovery, lock contention, interrupted writes, and path escape. Before running, it audits existing test mocks: any test that mocks the module under test — rather than its dependencies — is deleted and rewritten. `evaluation` — always last — runs Codex and Gemini as independent evaluators, scoring production readiness across five categories: deployability, reliability, security, test coverage, and operational hygiene. If the score is too low, a **gate-retry** spawns a fix agent, applies corrections, and rescores. Findings become lessons for future runs via the **learning** mechanism. A final **quality-gate** re-runs the full test suite.

**Learning.** The learning mechanism operates across runs. Late phases — review, testing, and evaluation — write lessons to files. Early phases — plan, structure, and implementation — read those lessons on future runs. A defect caught once is prevented forever.

Each phase must produce structured output before the next begins. If a phase reports three issues, it must list all three with severity, description, file, and line number. Phases that fail validation — missing sections, empty work items, vague language like "as needed" or "if applicable" — are rejected.

The pipeline can be run as a single command (`/build user authentication system`) or phase by phase for more control. Each phase is also available standalone (`/refactoring src/auth/`, `/gemini-review src/services/`). A `--dry-run` flag previews what will happen. A `--rollback` flag restores from the snapshot created at the start.

## Enforcement: giving the canon teeth

Having 75 skills full of good advice is worthless if the AI can ignore them. In a traditional team, code review and social pressure enforce standards. An AI has no social pressure. It needs structural enforcement.

The patterns compose into a trust spectrum. Each level catches what the previous levels miss:

**Gate.** Deterministic pattern and syntax-tree checks. No AI involved. These catch hardcoded secrets, unsafe type annotations in TypeScript, shell injection via string interpolation, functions over 30 lines, files over 300 lines. A match is a fail — no arguing, no "I think this one is safe." Forty-seven of the 418 canon checks fall into this category with a 100% catch rate. A variant — proxy checks — catches probabilistic signals: a parameter named `data` probably violates the clarity canon, a file with 15 exports probably violates the composition canon, a function with 7 parameters probably does too many things. These aren't proof of a violation, but they're strong enough signals to flag. Seventy-eight checks use proxy enforcement.

**Evidence.** This is where AI gets involved, but under machine supervision. The AI reviewer must enumerate every item — every exported function, every error message, every input boundary — with a file path, line number, verdict, and reasoning. The machine validates completeness: if the file has 14 exported functions and the checklist only covers 9, the review is rejected. The AI can still misjudge individual items, but it cannot skip any. A complete review with some wrong answers beats an incomplete review every time. One hundred thirty-five checks use Evidence.

**Vote.** For judgment calls that can't be reduced to patterns or checklists, three AI models review independently: Claude, Gemini, and Codex. Each fills out its own Evidence checklist. Disagreements are surfaced for human attention. One model missing something is common. Three models missing the same thing is rare. One hundred fifty-eight checks rely on Votes.

**Canary.** Known violations planted in the code before review phases. If the reviewer doesn't find them, the review is discarded and rerun. This is the only pattern that verifies the review actually happened. Without it, a rubber-stamp review is indistinguishable from a thorough one.

The patterns reinforce each other. **Gates** handle everything mechanical. **Evidence** ensures completeness. **Votes** catch blind spots across models. **Canaries** verify integrity. Each addresses a different failure mode. Gates can't judge design quality, but they never miss a 31-line function. AI reviewers can judge design quality, but they might skip items — which Evidence prevents. A single AI model might have blind spots — which Votes address. And any review might be superficial — which Canaries detect.

## Learning Loop: the system that improves itself

The learning mechanism operates across runs, not within them. Late phases — review, testing, and evaluation — write their findings to lesson files. Early phases — plan, structure, and implementation — read those lesson files on future runs.

The mechanism is concrete. When the adversarial security review finds a path traversal vulnerability — say, a user-supplied filename passed to a path function without validation — it fixes the code and writes a lesson: "validate user input before constructing file paths." When AI smell detection finds that Claude generated a `FileOperationHelper` class that wraps a single file-write call, it inlines the code and writes a lesson: "single-use wrapper class — write the call directly."

On the next pipeline run, the implementation phase reads both lesson files before writing any code. It sees the path traversal lesson and adds validation. It sees the wrapper class lesson and writes the file call directly. The vulnerability and the antipattern never make it into the code in the first place.

Each lesson is categorized so it routes to the right early phase. Bug patterns — time-of-check/time-of-use races, shell injection, missing validation — go to implementation, which is the most impactful reader. Architectural problems like unbounded lists and missing schema versions go to plan and structure. Code quality issues like dead exports and unused imports go to refactoring. AI-generated antipatterns go to both plan and implementation.

The lessons are stored in two tiers. Universal patterns — things that apply across all projects, like "don't interpolate user input into shell commands" — travel with the skills repository and grow over time. Project-specific instances — with exact file paths and context — stay local to the project. Late phases check the universal file first and only append genuinely new patterns, avoiding duplication. The universal knowledge base grows across all projects that use Lens, while each project maintains its own specific history.

The evaluation phase adds a second feedback channel. External evaluators score production readiness independently. Their findings are classified: code patterns become lessons that feed early phases; pipeline and tooling suggestions become proposals that surface during the plan phase. Findings like missing health checks or absent `.gitignore` files automatically influence the next pipeline run without manual routing.

The result is measurable. The first run catches problems in late phases. The second run avoids generating many of those problems in early phases. Over multiple iterations, the late phases find fewer issues because the early phases have learned from previous feedback. The system converges toward code that passes every phase on the first attempt.

## Ralph Loop: autonomous implementation from requirements

All of these pieces come together in Ralph Loop, Lens's autonomous implementation system. Given a Product Requirements Document (PRD), Ralph iterates through each requirement, running the full plan-build-refactor-test-review cycle for each item.

Ralph doesn't simply call each pipeline phase in sequence. It manages context across requirements, tracking which files were created or modified, which tests cover which requirements, and which lessons were learned during earlier iterations. If requirement 3 introduces a database layer, the self-learning feedback from that iteration's security review informs how requirement 7's API endpoint handles database queries. The pipeline improves within a single Ralph run, not just across separate runs.

Ralph loads the relevant skills from the active profile at each phase. Plan and structure get architecture and design skills. Implementation gets language-specific and framework skills, auto-detected from the project's file types. Review gets security and quality skills. Testing gets testing strategy and testing pattern skills. Each phase receives the expertise it needs without the overhead of loading all 75 skills simultaneously.

A single command — `/ralph-loop requirements.md` — can implement an entire PRD. Ralph supports up to 50 iterations with quality gates between items, resume capability for interrupted runs, and an optional external validation pass using Gemini and Qodana after the loop completes. The resume capability matters for large PRDs: if a session is interrupted after completing 12 of 20 requirements, `/ralph-loop requirements.md --resume` picks up at requirement 13 with full context of what was already built.

## Current state and what it means

Lens ships as `@objective-arts/lens`, a Node.js command-line tool installable via npm. It has 75 canon skills across 29 categories, 14 composable profiles, 33 workflow skills, an eight-phase pipeline (plan → structure → implementation → refactoring → deduplication → review → testing → evaluation) with six mechanisms, and an autonomous implementation system.

The system was used to build itself. Every module in Lens — the CLI, the canon loader, the profile system, the scanner, the workflow orchestrator, Ralph Loop itself — went through the pipeline. The self-learning feedback loop accumulated lessons from each module's run, and later modules benefited from earlier modules' mistakes. By the final modules, the late phases were finding fewer issues because the early phases had absorbed the project's recurring patterns. This is the strongest evidence that the architecture works: it improved the quality of its own codebase over the course of its own development.

The fundamental bet Lens makes is this: the bottleneck in AI-assisted development is not code generation. It's code quality. AI can write code faster than any human. But without the judgment that experienced engineers bring — judgment about architecture, security, maintainability, and the thousand small decisions that separate production code from prototype code — speed just means you produce technical debt faster.

Lens doesn't replace that judgment. It encodes it. Seventy-five skills, each capturing one expert's hard-won perspective. Six mechanisms — plan-approval, quality-gate, implementation-loop, gate-retry, rollback, learning — ensuring the expertise is applied, not merely available. A pipeline that treats quality as a manufacturing process, not a hope. And a system that learns from its own mistakes.

The senior engineer who catches subtle design flaws might not exist at your company. They might not exist at most companies. Lens replaces the absence of that engineer — not with another AI opinion, but with a structured system that makes the AI's own knowledge actionable, verifiable, and improvable over time.
