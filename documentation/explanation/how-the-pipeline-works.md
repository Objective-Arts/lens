# How the Pipeline Works

`/build` and `/improve` share the same hardening pipeline (phases 1-8). `/build` adds Phase 0 — a reference build where Opus builds the feature from the PRD before hardening begins. `/improve` skips Phase 0 because the code already exists.

## The Pipeline

```
PRD → Phase 0:reference (Opus raw build, /build only)
  → plan → structure → implementation
  → [lint + code checks]
  → refactoring → deduplication
  → review (4 parallel scans → dedupe → fix)
  → testing → evaluation (Codex only)
  → [lint + tests]
```

| # | Phase | Model | What happens |
|---|-------|-------|-------------|
| 0 | reference | Opus | `/build` only. Opus builds from PRD — feature-rich, complete. This is the control. |
| 1 | plan | Sonnet | Plan the hardening work against the reference. User approves before continuing. |
| 2 | structure | Sonnet | Improve the structure. Assign quality contract types to boundaries. |
| 3 | implementation | Opus | Fix what the plan identified. One work item at a time: read canon, write code, compile-check. Loops if partial (max 5). |
| 4 | refactoring | Sonnet | Systematic cleanup. Net-zero or net-negative complexity. |
| 5 | deduplication | Haiku | Consolidate duplicated code. Pattern-matching only. |
| 6 | review | Sonnet | 4 scan agents run in parallel (Gemini, Codex, Qodana, AI smell). Findings are deduped across all 4. One fix agent applies the unified list. |
| 7 | testing | Sonnet | Write and run tests. |
| 8 | evaluation | Sonnet | Codex scores 7 dimensions (1-10). Fix anything below 9. Re-score until all 9+ (max 3 iterations). Write lessons. |

After phase 3, `scripts/quality-gate.ts` runs lint and code pattern checks. If it fails, phase 3 gets another shot (max 2 retries).

After phase 8, `npm test` and the quality gate run again. If they fail, phase 7 fixes the tests (max 2 retries). Phase 8 does not re-run.

## Why Opus for Phases 0 and 3

Phase 0 needs Opus because it's building the entire feature from scratch — reasoning depth produces richer, more complete implementations. Phase 3 needs Opus because hardening requires the same depth — translating a structured plan into correct code with contract idioms, edge case handling, and language-specific patterns. Everything else runs on Sonnet (strong reasoning, lower cost) or Haiku (pattern-matching tasks like deduplication).

## How Review Works (Phase 6)

Four scan agents run at the same time against identical code:

- **Gemini** runs twice — once for general code quality, once with a security focus
- **Codex** runs its own independent review
- **Qodana** runs static analysis
- **AI smell scan** checks for AI-generated antipatterns

All four see the same code. The orchestrator dedupes their findings (same file + line within 5 lines + similar description = one finding, keep the most specific). Then a single fix agent applies the unified list.

This prevents cascade damage — no reviewer is "fixing" another reviewer's fixes.

## How Skills Get Loaded

Skills are expert guidance loaded into the LLM's context before work begins. They come from four layers, combined additively:

**Layer 1 — Base Brain (always on).** 10 foundational skills every project gets: clarity, pragmatism, simplicity, composition, distributed, data-first, correctness, algorithms, abstraction, optimization. Plus security, testing, and failure skills available in the pool.

**Layer 2 — Profile (set once per project).** Domain-specific skills. A TypeScript CLI project loads typescript, type-systems, js-safety, js-internals, js-perf. A React project loads react-state, react-test. Set when you run `lens profile apply`.

**Layer 3 — Phase (what you're doing).** Each pipeline phase loads different skills. The plan phase loads resilience, failure, safety. Implementation loads pragmatism, clarity, composition. Review phases load fewer skills because they need more context window for the code they're examining.

**Layer 4 — Detection (what you mentioned).** Keywords in your prompt trigger additional skills. "JWT" adds security-mindset and owasp. "performance" adds optimization.

```
Loaded Skills = Base + Profile + Phase + Detected Keywords
```

The context window is fixed. More skills means better decisions but less room for code. That's why phase 3 (one unit at a time) loads 15+ skills, while review (entire codebase in view) loads 2-3.

Config files: `profiles/software-base.yaml` (base), `profiles/{name}.yaml` (profile), `config/workflow-phases.yaml` (phase), `config/keyword-detection.yaml` (detection).

## Quality Contracts

Seven fixed types that mark trust boundaries in code — places where data crosses a trust level. Phase 2 identifies these boundaries and assigns types. Phase 3 implements them using language-specific idioms.

| Type | What it marks |
|------|-------------|
| ValidatedInput | Data that passed boundary validation (CLI args, API params) |
| SafePath | Path built through validation, not concatenation |
| CausedError | Error preserving original cause chain |
| Secret | Value that must never appear in logs/errors/responses |
| ExternalData | Untrusted data from outside (file reads, API responses, env vars) |
| BoundedOperation | Operation with timeout or size limit |
| IdempotentAction | Action safe to retry (write-then-rename, upsert) |

In TypeScript, ValidatedInput becomes a branded type. CausedError becomes `new Error(msg, { cause: e })`. Secret becomes an opaque type with redacted `toString()`. The types are abstract; the implementations are language-specific.

## The Learning Loop

Review phases write lessons. Construction phases read them on the next run.

```
Run N                              Run N+1
  Phase 6 finds issue ── write ──▶  Phases 1-5 read lessons
  Phase 8 finds issue ── write ──▶  Phase 3 prevents the defect
```

Two files:
- `.claude/universal-lessons.md` — general patterns (any project, any language)
- `.claude/lessons.md` — project-specific instances with file paths

Five categories route lessons to the right phase:

| Category | What it captures | Read by |
|----------|-----------------|---------|
| LOGIC | Bugs, races, injection, traversal | Phase 3 |
| DESIGN | Architecture mistakes, missing boundaries | Phases 1-2 |
| CODE_QUALITY | Dead code, naming, swallowed exceptions | Phase 4 |
| DUPLICATION | Repeated constants, copy-pasted logic | Phase 5 |
| AI_SMELL | Single-use helpers, comment spam, defensive paranoia | Phase 3 |

A defect caught once is prevented on every future run.

## Rubrics

Rubrics define what "production-ready" means. The base rubric always loads. Domain rubrics load automatically based on project signals:

| Signal | Rubric loaded |
|--------|--------------|
| Always | `base.md` + `product-quality.md` |
| Express, Fastify, Flask, etc. | `web-api.md` |
| Prisma, TypeORM, SQLite, raw SQL | `data-persistence.md` |
| `process.argv`, commander, yargs | `cli.md` |
| Dockerfile, docker-compose, K8s | `microservice.md` |

Multiple rubrics can stack. Phase 1 generates a production checklist from them. Phases 6 and 8 use them as review criteria.

## Orchestrator Behaviors

The orchestrator (the code that sequences the phases) has six behaviors:

1. **Plan approval** — Phase 1 output is shown to the user. Nothing proceeds until approved.
2. **Quality checks** — Lint + code patterns after phase 3. Lint + tests after phase 8. No AI cost.
3. **Implementation loop** — If phase 3 can't finish in one pass, it loops (max 5 iterations).
4. **Gate retry** — Each phase must emit a marker string. If missing, retry up to 3 times.
5. **Rollback** — Git stash before the pipeline starts. Restore with `--rollback`.
6. **Learning** — Phases 6 and 8 write lessons. Next run, phases 1-5 read them.

## Using the Pipeline

```
/build user authentication system      # new feature
/improve src/services/auth/             # improve existing code
/build --dry-run                        # show phases without running
/build --rollback                       # restore from last stash
```

You can also run any phase directly:

```
/plan add password reset feature
/structure src/services/
/implementation PasswordResetService
/refactoring src/features/auth
/deduplication src/services/
/testing unit
```

Or use read-only scans without making changes:

```
/gemini-scan src/features/auth
/codex-scan src/
/ai-smell-scan src/services/
```

## See Also

- [Quality Gate Spec](../quality-gate-spec.md) — what the quality checks actually test
- [Skill Enforcement Model](skill-enforcement-model.md) — how skills become hard gates
- [Two-Tier Review Architecture](two-tier-review.md) — self-review vs external validation
