# Data Persistence Rubric

Load when target persists user data (database, files, config stores).

## Review Criteria

1. **Schema Versioning** — Every persisted data format (config files, keystores, databases) must include a schema version field. Validation on read. Clear error if version is unsupported.
2. **Migration Tooling** — Migration path must exist (EF migrations, Flyway, Alembic, manual scripts). Plan what happens when v2 reads a v1 file. No silent data corruption on format change. `EnsureCreated()`, `CREATE IF NOT EXISTS`, and auto-generated schemas are NOT migration strategies — they bypass versioning and break on schema changes.
3. **Backup/Restore** — User data stores must support export and import. At minimum: document the backup strategy. For critical data: provide CLI commands or API endpoints.
4. **Atomic Persistence** — Write to temp file, then rename. No partial writes on crash. For databases: use transactions. For multi-file updates: all-or-nothing semantics.
5. **Data Lifecycle** — Expiry, rotation, and cleanup for stored data. Plan what happens to stale entries. Document retention policy if applicable.
6. **Concurrency Control** — Business-critical writes (inventory, balances, reservations) must handle concurrent updates. Optimistic locking (row version, ETag, `WHERE version = @v`) or pessimistic locking (`SELECT FOR UPDATE`). Without concurrency control, concurrent requests cause lost updates, overselling, or double-spending.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Schema Versioning | Version field in format. Validation on read. Error on unsupported version. |
| Migration Tooling | Tool choice (EF, Flyway, scripts). v1→v2 migration path. |
| Backup/Restore | Export/import mechanism or documented backup strategy. |
| Atomic Persistence | Write-then-rename for files. Transactions for databases. |
| Data Lifecycle | Expiry, rotation, cleanup plan. |
| Concurrency Control | Which writes need protection. Locking strategy (optimistic/pessimistic). |

**Template:**
```
- Schema Versioning: [version field location, validation approach]
- Migration Tooling: [tool + v1→v2 strategy or "manual scripts"]
- Backup/Restore: [approach or "documented — {strategy}"]
- Atomic Persistence: [write-then-rename / transactions]
- Data Lifecycle: [expiry/cleanup plan or "N/A — immutable data"]
- Concurrency Control: [strategy per critical write or "N/A — read-only / single-writer"]
```
