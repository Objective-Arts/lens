# CLI Module Repair Plan

## Scope
`src/cli/` — 18 files, ~2,377 lines. Command handlers and display formatters.

## Findings

### Critical
1. **Shell injection in dedupe.ts** — `execSync` with template literal interpolation of `searchPath` parameter. User-controlled path passed directly into shell command. Replace with `execFileSync` or `spawn` with array args.

### Actionable
2. **TOCTOU in dedupe.ts** — `existsSync` before `analyzeDuplications` (line 177). Use try-catch pattern.
3. **Function > 30 lines** — `formatReport()` is 53 lines. Decompose into `formatResultEntries()` and `formatPriorityList()`.
4. **Dead export** — `runDedupe` exported but not part of public API (not in commands/index.ts). Remove `export`.

### Not actionable
- `handleApply` in profile.ts is 38 lines — sequential steps, decomposition would obscure flow
- Hardcoded skill arrays in audit.ts — config constants, appropriate for display module

## Changes

### dedupe.ts
1. Replace `execSync` shell command with `execFileSync('grep', [...args])` + pipe through Node.js filtering
2. Fix TOCTOU: wrap `analyzeDuplications` in try-catch, remove `existsSync` guard
3. Decompose `formatReport()`: extract `formatResultEntries()` and `formatPriorityList()`
4. Remove `export` from `runDedupe`
