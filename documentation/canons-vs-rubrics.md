# Canons vs Rubrics

Lens has two types of knowledge files that serve different purposes at different stages of the development pipeline. They look similar (both are markdown files with coding guidance) but they do fundamentally different jobs.

## Canons: Domain Expertise

**What they are:** ~88 markdown files organized by domain (JavaScript, SQL, security, React, C#, etc.) that teach Claude *how to think* about a specific topic.

**Where they live:** `canon/` directory, organized into subdirectories by domain.

**What they contain:** Principles, patterns, anti-patterns, and mental models. A canon doesn't tell Claude what score to give — it tells Claude what good code looks like.

**Example (from the SQL canon):**
- Think in sets, not loops
- Index columns in WHERE clause
- Equality columns before range columns in indexes
- NULL is not a value — use IS NULL, not = NULL

**When they're used:** During the *writing* phases of the pipeline.
- Phase 1 (Plan) loads 10 base canons + auto-detected domain canons
- Phase 3 (Implementation) refreshes relevant canons before each work item
- Phase 4 (Refactoring) loads canons to know what "clean" looks like
- Phase 5 (Deduplication) loads composition/clarity canons

**How they get into a project:** Profiles specify which canons to install. When you run `lens init` on a JavaScript project, the `javascript` profile copies canons like `typescript`, `js-safety`, `js-perf`, `owasp`, `security-mindset`, etc. into `.claude/canon/`. They don't appear as slash commands — they're reference material read by `/fix` and `/canon-audit`.

**Who writes them:** You do, or they come from the canon library. Each is a distillation of a book, a framework's best practices, or hard-won domain knowledge.

## Rubrics: Scoring Criteria

**What they are:** 14 markdown files that give reviewers a specific, repeatable checklist to score code against.

**Where they live:** `.claude/rubric/` (symlinked to `workflow-skills/rubric/` in the package).

**What they contain:** Numbered criteria with clear pass/fail conditions. A rubric doesn't teach Claude how to write code — it tells Claude exactly what to check and how to score it.

**Example (from base.md):**
1. Input validation at every boundary
2. No injection vectors — parameterized queries, safe shell usage
3. No secrets in code, logs, error messages
4. Cause chains preserved in error handling
5. Atomic writes for config/state files
...up to 12-15 numbered criteria per rubric.

**When they're used:** During the *review* phases of the pipeline.
- Phase 6 (Review) — `/gemini-scan`, `/codex-scan`, `/code-scan` all load rubrics
- Phase 8 (Evaluation) — Codex scores against rubric dimensions
- Standalone scans — `/code-scan` uses rubrics for its 13-dimension scoring

**How they get into a project:** `lens init` symlinks the rubric directory. All projects share the same rubrics.

**Auto-detection:** `AUTO-DETECT.md` controls which rubrics load based on what's in the code:
- `base.md` and `product-quality.md` always load
- `web-api.md` loads if HTTP server code is detected
- `cli.md` loads if CLI patterns are detected
- `data-persistence.md` loads if database code is detected
- `security.md` loads if HTTP server or microservice patterns are found
- And so on for `angular.md`, `typescript.md`, `d3.md`, etc.

## How They Work Together

In the pipeline, canons and rubrics form a feedback loop:

```
Canons (phases 1-5)          Rubrics (phases 6-8)
────────────────────         ────────────────────
"Write code like this"  →    "Grade the code against this"
                        ←    Findings feed back into lessons
```

1. **Phases 1-5** load canons. Claude writes code informed by domain expertise.
2. **Phase 6** loads rubrics. External reviewers (Gemini, Codex, Qodana) score the code against specific criteria.
3. **Phase 8** loads rubrics again. Codex scores each dimension 1-10. Any dimension below 9 gets fixed and rescored.
4. **Lessons learned** from phases 6-8 get written to `.claude/lessons.md` and `.claude/universal-lessons.md`, which phases 1-5 read on the *next* pipeline run.

This is the self-learning loop: canons teach, rubrics judge, lessons bridge the gap.

## The Practical Difference

If you're adding a new domain (say, GraphQL):

- **Write a canon** (`canon/graphql/SKILL.md`) with principles like "design schema first," "use DataLoader for N+1," "prefer input types over raw arguments." This makes Claude write better GraphQL code.

- **Write a rubric** (`.claude/rubric/graphql.md`) with numbered criteria like "(1) No N+1 queries (2) Input validation on all mutations (3) Rate limiting on public queries." This makes reviewers catch GraphQL-specific issues.

- **Add detection** to `AUTO-DETECT.md` so the rubric loads when `.graphql` files or `apollo-server` dependencies are found.

You need both. A canon without a rubric means Claude writes good code but reviewers don't know what to check. A rubric without a canon means reviewers catch issues but Claude keeps making the same mistakes.

## File Counts

| Type | Count | Location |
|------|-------|----------|
| Canon skills | ~88 | `canon/` (30 subdirectories) |
| Rubrics | 14 | `workflow-skills/rubric/` |

## Rubric Files

| File | Domain | When Loaded |
|------|--------|-------------|
| `AUTO-DETECT.md` | Detection rules | Always (controls which others load) |
| `base.md` | Universal quality | Always |
| `product-quality.md` | UX and operational | Always |
| `cli.md` | CLI tools | CLI patterns detected |
| `web-api.md` | HTTP servers | HTTP server detected |
| `data-persistence.md` | Databases | SQL/ORM detected |
| `microservice.md` | Microservices | Microservice patterns detected |
| `security.md` | Security | HTTP server or microservice detected |
| `typescript.md` | TypeScript | .ts files detected |
| `angular.md` | Angular | Angular detected |
| `d3.md` | D3 visualization | D3 detected |
| `java.md` | Java | Java detected |
| `contracts.md` | Quality contracts | Referenced by structure phase |
| `migration.md` | Code migrations | Migration patterns detected |
