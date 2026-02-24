## Profiles Applied

`sql`

## Available Commands

| Command | Description |
|---------|-------------|
| `/fix [path] [--dry-run]` | Fast quality loop — Codex reviews, Claude fixes, Codex verifies |
| `/build [path] [--rollback] [--dry-run]` | Build new feature with quality pipeline |
| `/improve [path] [--rollback] [--dry-run]` | Improve existing code with quality pipeline |
| `/change [description]` | Simple changes done right — make it, clean it, report it |
| `/ai-smell-fix [path]` | Deep AI smell removal |
| `/generate-docs [path]` | Generate documentation |

**Read-only scans:**

| Command | Description |
|---------|-------------|
| `/gemini-scan [path]` | Gemini review (report only) |
| `/ai-smell-scan [path]` | AI code patterns (report only) |
| `/canon-audit <canon> [path]` | Audit project against a canon's rules (report only) |
| `/codex-scan [path]` | Codex pattern scan (report only) |

**Utilities:**

| Command | Description |
|---------|-------------|
| `/lens` | Home base - status and help |

**Flags for /build and /improve:**
- `--rollback` — Restore from last stash
- `--dry-run` — Show what would change without modifying
- `--from N|name` — Resume from a specific phase

**Bash pipeline orchestrator** (runs from any project):
```
pipeline build <target|"description"> [--prd FILE] [--desc "..."] [--fast] [--from N|name] [--rollback] [--dry-run]
pipeline improve <target|"description"> [--desc "..."] [--fast] [--from N|name] [--rollback] [--dry-run]
```
- `--fast` — Sonnet for phase 3, parallel phases 4+5
- `--prd FILE` — PRD document for phase 0 (build only)
- `--desc "..."` — Task description injected into all phases
- Pass a description string instead of a path to use current directory as target

## Standards

- Think in sets, not loops
- Index columns in WHERE clause
- Leftmost prefix rule for composite indexes
- Equality columns before range columns in indexes
- Use explicit JOIN syntax, never comma-separated tables
- Parameterized queries only, never string concatenation
- NULL is not a value - use IS NULL, not = NULL
- Avoid SELECT * - list columns explicitly
- Use EXPLAIN ANALYZE to verify query plans
- Prefer keyset pagination over OFFSET for large datasets

## Anti-Patterns (Avoid)

- Cursors and row-by-row processing
- SELECT * in production code
- Implicit joins (comma-separated tables)
- LIKE with leading wildcard (%term)
- Functions on indexed columns in WHERE
- String concatenation for SQL (injection risk)
- DISTINCT as a fix for duplicate rows
- ORDER BY ordinal position
- Entity-Attribute-Value tables (EAV)
- Too many single-column indexes

## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Writing SQL queries, database operations | INVOKE `/sql` for set-based thinking |
| Query performance, slow queries, indexes | INVOKE `/sql-perf` for optimization |
| User input in queries, dynamic SQL | INVOKE `/security-mindset` then `/owasp` for injection prevention |
