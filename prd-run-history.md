# PRD: Run History

## Problem

Ralph runs produce summaries (`RunSummary`) but they vanish when the process exits. There is no way to answer: "Did that last run find fewer issues than the one before?" or "Which PRD items keep failing?" Without persistent run data, users cannot measure whether their pipeline configuration changes are actually improving outcomes.

## Solution

Store each `RunSummary` to disk. Provide a CLI command to list and compare past runs.

## Scope

- New module: `src/ralph/history/`
- New CLI subcommand: `lens ralph history`
- Storage: JSON files in `.lens/runs/`, one per run, named by session ID
- No database. No network. File system only.

## Non-Goals

- Visualization (the existing `summary.html` handles that)
- Cloud sync or sharing
- Aggregation across multiple projects

---

## Items

- [ ] Define `RunRecord` type extending `RunSummary` with `version`, `schemaVersion`, and `configHash` fields in `src/ralph/history/types.ts`
- [ ] Implement `writeRun(dir, record)` and `readRun(dir, sessionId)` in `src/ralph/history/storage.ts` — validate input paths, handle missing directories, use atomic writes (write-then-rename)
- [ ] Implement `listRuns(dir, opts)` in `src/ralph/history/query.ts` — return runs sorted by start time descending, support `limit` and `since` filters, read only the fields needed (not full issue lists)
- [ ] Implement `diffRuns(a, b)` in `src/ralph/history/diff.ts` — compare two `RunRecord`s and return a structured delta: items added/removed/changed, issue count changes, duration change, pass/fail status changes
- [ ] Wire `writeRun` into the Ralph runner so every completed run persists automatically — call after summary generation, do not block on write failure (log and continue)
- [ ] Add `lens ralph history list` CLI command — show recent runs as a table (date, PRD, items completed, issues found, duration), support `--limit` and `--since` flags
- [ ] Add `lens ralph history diff <id-a> <id-b>` CLI command — display the structured delta in a readable format with color-coded improvements/regressions
- [ ] Write unit tests for storage (round-trip), query (sort/filter), and diff (all delta types) — minimum 15 test cases
