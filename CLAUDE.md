## Profiles Applied

`sql`

## Available Commands

| Command | Description |
|---------|-------------|
| `/cleanup [path] [--dry-run]` | Canon review + quality gate + fix + verify |
| `/build [description] [--dry-run] [--rollback]` | Plan + build new feature with quality gates |
| `/improve [path] [--dry-run] [--rollback]` | Plan + improve existing code with quality gates |
| `/change [description]` | Simple changes done right — make it, clean it, report it |
| `/ai-smell-fix [path]` | Deep AI smell removal |
| `/generate-docs [path]` | Generate documentation |

**Read-only scans:**

| Command | Description |
|---------|-------------|
| `/gemini-scan [path]` | Gemini review (report only) |
| `/ai-smell-scan [path]` | AI code patterns (report only) |
| `/canon-audit <canon> [path]` | Audit project against a canon's rules (report only) |

**Utilities:**

| Command | Description |
|---------|-------------|
| `/lens` | Home base - status and help |

**Flags for /build and /improve:**
- `--dry-run` — Show the plan without making changes
- `--rollback` — Restore from last stash

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
