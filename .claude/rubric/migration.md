# Migration Rubric

Loaded when migration/modernization signals detected. Catches the residue, shortcuts, and bad habits that contaminate migrated codebases.

## Review Criteria

1. **Foreign Idioms** — Code that follows the OLD framework's patterns, not the new one. jQuery-style DOM manipulation in Angular. Servlet patterns in Spring Boot. Class components in modern React. Flag anything that looks transplanted rather than rewritten.
2. **Dead Shims and Polyfills** — Compatibility layers, adapters, or wrappers that exist only to bridge old and new code. If the migration is complete for a module, the shim is dead weight. Flag shims with a single caller.
3. **Stale Imports** — Imports from the old framework still present. `import { Component } from '@angular/core'` next to GWT references. Old ORM imports alongside new ones. Mixed dependency generations.
4. **TODO/FIXME Graveyard** — Migration TODOs that were never completed. `// TODO: migrate this`, `// FIXME: still using old API`, `// HACK: temporary bridge`. If it's been there more than one sprint, it's not temporary.
5. **Copy-Paste Translation** — Code mechanically translated line-by-line rather than rewritten idiomatically. Signs: variable names from the old language's conventions, preserved comment blocks from the original, logic structure that doesn't match the new framework's patterns.
6. **Missing Error Handling** — Original code had error handling that was dropped during migration. Bare HTTP calls without catch blocks. Database operations without transaction boundaries. Event handlers that silently swallow failures.
7. **Orphaned Configuration** — Config files, environment variables, build scripts, or deployment artifacts from the old system still present. Old framework's config format sitting next to new one. Build targets that reference removed modules.
8. **Incomplete Type Coverage** — Migrated code using `any`, loose objects, or untyped maps where the old system had equivalent type safety. The new code should be at least as type-safe as the old code.
9. **Lost Business Logic** — Validation rules, edge cases, or business constraints from the original that didn't survive migration. Compare against original where available. Flag functions that are suspiciously simpler than their predecessors.
10. **Dual-Path Code** — Feature flags, if/else blocks, or routing that maintains both old and new implementations simultaneously. Acceptable during active migration, but flag it — each dual path is a maintenance liability and potential bug source.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Idiom Compliance | New code follows new framework's conventions, not old. |
| Shim Cleanup | Identify and remove completed migration bridges. |
| Import Hygiene | No old framework imports in migrated modules. |
| Error Parity | Error handling at least as robust as original. |
| Type Parity | Type safety at least as strong as original. |
| Logic Parity | Business rules preserved. Edge cases not lost. |
| Config Cleanup | Old config/build artifacts removed. |
| Dual-Path Tracking | Active migration paths documented with completion criteria. |
