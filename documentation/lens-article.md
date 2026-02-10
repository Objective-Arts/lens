# Lens: Teaching AI to Code Like a Senior Engineer

AI coding assistants write code that compiles. They satisfy the prompt, pass the obvious tests, and move on. But anyone who has shipped production software knows the gap between "it works" and "it ships" is where most of the cost lives. Review cycles, security audits, performance regressions, architectural debt that compounds over months — these problems don't come from code that fails. They come from code that works, but works badly.

Lens is a system that embeds domain expertise into Claude Code's development process. It transforms Claude from a general-purpose code generator into something closer to a senior engineer who has internalized the principles of Kernighan's clarity, Liskov's substitution principle, the OWASP Top 10, and dozens of other established bodies of knowledge. The expertise enters at write-time, not at review-time. By the time code reaches a reviewer — human or automated — it has already been shaped by the same principles that reviewer would enforce.

## The core idea: skills as lenses

Lens is built on a single observation. Claude has access to more programming knowledge than any human developer. It knows about single responsibility, separation of concerns, defensive coding, and framework idioms. The problem is not knowledge. The problem is perspective. A developer who has spent years working with Effective Java doesn't just know the rules — they see code differently. They notice when a constructor should be a static factory method, when a mutable return value will cause a thread-safety bug, when an interface has too many methods. This isn't recall. It's a lens that filters every decision.

Lens makes this concrete. Each "canon skill" is a markdown file that captures one expert's approach to one domain: how they think, what they check for, what patterns they follow, when they break the rules. There are 75 of these skills across 30 categories. Some examples:

- **clarity** distills Brian Kernighan's principles: clear code above clever code, meaningful names, functions that do one thing.
- **security-mindset** teaches Claude to think like an attacker: what input can be abused, what state can be corrupted, where does trust cross a boundary.
- **react-state** captures Dan Abramov's mental models for React: component composition over inheritance, state colocation, derived state as a code smell.
- **d3** and **charts** encode Edward Tufte's principles of graphical integrity: data-ink ratio, small multiples, no chartjunk.
- **legacy** comes from Michael Feathers' Working Effectively with Legacy Code: find seams, write characterization tests, change behavior through safe transformations.
- **abstraction** captures Barbara Liskov's substitution principle and behavioral subtyping.

Each skill includes concrete checks, not vague advice. The clarity skill doesn't just say "write clear code." It specifies: functions under 30 lines, no parameter named `data` or `result`, no file over 300 lines, no more than three levels of nesting. These concrete checks are what make enforcement possible.

## Profiles: composable expertise for project types

Nobody needs all 75 skills at once. A React frontend project needs different expertise than a Python data pipeline or a C# enterprise backend. Lens solves this with 14 composable profiles that bundle the right skills for each project type.

Profiles stack with `+` syntax. Running `lens profile apply javascript+react+security` combines three profiles, merging their skill sets without duplication. The result is a `.claude/` directory in your project containing the skills, standards, anti-patterns, and auto-invoke rules that Claude will use for every interaction.

The `software-base` profile is always included. It provides 24 skills: the 10 "Base Brain" skills that shape how Claude thinks (clarity, simplicity, correctness, pragmatism, composition, data-first, distributed, algorithms, abstraction, optimization), plus security fundamentals, testing strategy, documentation standards, and engineering philosophy. These create productive tensions — pragmatism says "get it working" while correctness says "prove it works" — and Claude resolves the tension based on context. Prototyping? Lean pragmatism. Production authentication? Lean correctness.

Domain profiles add targeted expertise. The `frontend` profile adds 12 UI/UX skills covering atomic design, usability heuristics, typography, motion design, and accessibility. The `python` profile adds four Python-specific skills covering generators, protocols, the data model, and idiomatic patterns. The `security` profile adds threat modeling, OWASP patterns, application security, and web security. Each profile was designed so that the skills within it reinforce each other rather than conflict.

When a profile is applied, skills install as real files in the project's `.claude/skills/` directory. They're versioned, diffable, and upgradeable. If a skill is updated in the Lens canon, you can see the diff and choose whether to upgrade. Local modifications are preserved. This is deliberate: expertise should be inspectable and ownable, not a black box.

## The 12-phase pipeline: systematic quality at scale

Skills alone shape how Claude writes code in a single interaction. But real development involves sequences of decisions — architecture, implementation, testing, review, cleanup — where the output of each phase feeds the next. Lens addresses this with a 12-phase build/improve pipeline, invoked with `/build` or `/improve`.

The pipeline takes a feature description and processes it through twelve phases with three machine gates:

**Phases 1-3: Design and implement.** `create-plan` designs the approach, identifying scope, files, risks, and decision points. `structure-first` defines data structures and interfaces before any implementation — following the principle that getting the data right makes the algorithms obvious. `implement-plan` writes the code, guided by the active canon skills. A machine gate then runs `npm run build && npm test` to verify the implementation compiles and existing tests pass.

**Phases 4-7: Clean and review.** `refactor-check-fix` enforces structural constraints: functions under 30 lines, files under 300 lines, clear naming, single responsibility. `dedupe-fix` consolidates duplicated code. Then two external reviewers weigh in: `gemini-fix` sends the code to Google's Gemini model for an independent review, and `qodana-fix` runs JetBrains' static analysis engine. Another machine gate verifies the build after these changes.

**Phases 8-12: Harden and verify.** `adversarial-security-review` examines the code from an attacker's perspective — looking for injection points, trust boundary violations, and data exposure. `write-tests-run` writes and executes tests covering happy paths, error cases, edge cases, and non-happy-path categories like corrupted data recovery, lock contention, and path traversal. `ai-smell-fix` removes patterns that are characteristic of AI-generated code: single-use helper functions, defensive paranoia, speculative features, comment spam. `codex-fix` runs a fast pattern scan for remaining issues. A final machine gate and test re-run confirm everything still passes.

Each phase must produce structured output with specific markers before the next phase begins. There is no hand-waving. If a phase says "ISSUES_FOUND: 3," it must list all three with severity, description, file, and line number. If it says "VERIFIED_CLEAN: yes," the canary system may have planted known violations to verify that claim.

The pipeline can be run as a single command (`/build user authentication system`) or phase by phase for more control. Each phase is also available as a standalone skill (`/refactor-check-fix src/auth/`, `/gemini-fix src/services/`). A `--dry-run` flag previews what each phase will do. A `--rollback` flag restores from the git stash created at the start.

## Five layers of enforcement: giving the canon teeth

The most interesting architectural decision in Lens is how it enforces quality. Having 75 skills full of good advice is worthless if the AI can ignore them. In a traditional team, code review and social pressure enforce standards. An AI has no social pressure. It needs structural enforcement.

Lens uses five layers, each catching what the previous layers miss:

**Layer 1: Machine Gates.** Deterministic regex and AST checks. No AI involved. These catch hardcoded secrets, `any` types in TypeScript, shell injection via string interpolation in `exec()` calls, functions over 30 lines, files over 300 lines. A match is a fail — no arguing, no "I think this one is safe." Forty-seven of the 418 canon checks fall into this category with a 100% catch rate.

**Layer 2: Proxy Checks.** Measurable patterns that correlate with judgment-based violations. A parameter named `data` probably violates the clarity canon. A file with 15 exports probably violates the composition canon. A function with 7 parameters probably does too many things. These aren't proof of a violation, but they're strong enough signals to flag for review. Seventy-eight checks use proxy enforcement.

**Layer 3: Evidence Checklists.** This is where AI gets involved, but under machine supervision. The AI reviewer must enumerate every item — every exported function, every error message, every input boundary — with a file path, line number, verdict, and reasoning. The machine validates completeness: if the file has 14 exported functions and the checklist only covers 9, the review is rejected. The AI can still misjudge individual items, but it cannot skip any. A complete review with some wrong answers beats an incomplete review every time. One hundred thirty-five checks use evidence checklists.

**Layer 4: Three-Model Vote.** For judgment calls that can't be reduced to patterns or checklists, three AI models review independently: Claude, Gemini, and Codex. Each fills out its own evidence checklist. Disagreements are surfaced for human attention. One model missing something is common. Three models missing the same thing is rare. One hundred fifty-eight checks rely on multi-model voting.

**Layer 5: Canary Tests.** Known violations planted in the code before review phases. If the reviewer doesn't find them, the review is discarded and rerun. This is the only layer that verifies the review actually happened. Without it, a rubber-stamp review is indistinguishable from a thorough one.

The five layers work together. Machine gates handle everything mechanical. Proxy checks flag warning signs. Evidence checklists ensure completeness. Three-model voting catches blind spots. Canaries verify integrity. The only scenario where all five layers fail simultaneously is when three independent AI models all make the same incorrect judgment on a genuinely hard problem — and even then, the machine layers have already caught everything mechanical.

## Self-learning: the system that improves itself

The pipeline has a feedback loop built in. Late phases (6 through 10 — Gemini review, Qodana analysis, security audit, AI smell detection) write their findings to lesson files. Early phases (1 through 5 — planning, structuring, implementing, refactoring, deduplication) read those lesson files on future runs.

If Gemini finds a shell injection pattern in phase 6, that pattern gets recorded. On the next run, `implement-plan` in phase 3 reads the lesson and avoids generating the same vulnerability. If the AI smell detector in phase 10 finds that Claude keeps generating single-use wrapper functions, that pattern gets recorded. On the next run, the planning and implementation phases know to avoid that antipattern from the start.

The lessons are stored in two tiers. Universal patterns — things that apply across all projects, like "don't interpolate user input into shell commands" — travel with the skills repository and grow over time. Project-specific instances — with exact file paths and context — stay local to the project. Late phases check the universal file first and only append genuinely new patterns, avoiding duplication.

This means the system gets better with use. The first run through the pipeline catches problems in phases 6 through 10. The second run avoids generating many of those problems in phases 1 through 3. Over multiple iterations, the late phases find fewer issues because the early phases have learned from previous feedback.

## Ralph Loop: autonomous implementation from requirements

All of these pieces come together in Ralph Loop, Lens's autonomous implementation system. Given a Product Requirements Document, Ralph iterates through each requirement, running the full plan-build-refactor-test-review-document cycle for each item.

Ralph loads the relevant canon skills from the active profile at each phase. Planning phases get architecture and design skills. Implementation phases get language-specific and framework skills. Review phases get security and quality skills. Test phases get testing strategy and test doubles skills. Each phase receives the expertise it needs without the overhead of loading all 75 skills simultaneously.

A single command — `/ralph-loop requirements.md` — can implement an entire PRD. Ralph supports up to 50 iterations with quality gates between items, resume capability for interrupted runs, and an optional external validation pass using Gemini and Qodana after the loop completes.

## Current state and what it means

Lens ships as `@objective-arts/lens`, a Node.js CLI tool installable via npm. It has 75 canon skills, 14 profiles, 29 workflow skills, a 12-phase pipeline, five enforcement layers, a self-learning feedback loop, and an autonomous implementation system. The documentation follows the Diataxis framework across tutorials, how-to guides, reference material, and explanatory articles.

The fundamental bet Lens makes is this: the bottleneck in AI-assisted development is not code generation. It's code quality. AI can write code faster than any human. But without the judgment that experienced engineers bring — judgment about architecture, security, maintainability, and the thousand small decisions that separate production code from prototype code — speed just means you produce technical debt faster.

Lens doesn't replace that judgment. It encodes it. Seventy-five skills, each capturing one expert's hard-won perspective. Five enforcement layers, ensuring the expertise is applied, not merely available. A pipeline that treats quality as a manufacturing process, not a hope. And a feedback loop that means the system learns from its own mistakes.

The senior engineer who catches subtle design flaws might not exist at your company. They might not exist at most companies. Lens replaces the absence of that engineer — not with another AI opinion, but with a structured system that makes the AI's own knowledge actionable, verifiable, and improvable over time.
