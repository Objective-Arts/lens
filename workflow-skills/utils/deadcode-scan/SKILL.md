---
name: deadcode-scan
description: Detect dead and unused code. Read-only - does not fix or delete.
---

# /deadcode-scan [path]

**Read-only** scan for dead and unused code. Reports findings without making changes.

> **No arguments?** Describe this skill and stop. Do not execute.

## The Dead Code Index

Each category has a severity weight. The **Dead Code Index** is the weighted sum.

| Category | Weight | Why |
|----------|--------|-----|
| Orphaned files | 3 | Entire files of dead weight |
| Unreachable code | 3 | Logic errors, confuses readers |
| Unused exports | 2 | Public API pollution, maintenance drag |
| Dead branches | 2 | Always-true/false conditions hide bugs |
| Unused imports | 1 | Minor noise, easy to fix |
| Unused variables | 1 | Minor noise, compiler catches most |

**Index interpretation:**
- 0-5: Clean — minimal dead code
- 6-15: Minor — a few cobwebs
- 16-30: Moderate — accumulating cruft
- 31-50: Heavy — needs cleanup
- 51+: Severe — significant dead weight

## Detection Checklist

### Orphaned Files (weight: 3)
- `.ts`/`.js` files not imported by any other file in the project
- Test files for modules that no longer exist
- Config files for removed features
- Stale migration or seed files

### Unreachable Code (weight: 3)
- Code after `return`, `throw`, `break`, `continue`
- Functions defined but never called (internal, non-exported)
- Switch cases that can never match (covered by earlier cases)
- Catch blocks for exceptions that can't be thrown

### Unused Exports (weight: 2)
- Exported functions/classes/types not imported anywhere
- Re-exports in index.ts that nothing consumes
- Exported constants referenced only in their own file
- Public class methods never called externally

### Dead Branches (weight: 2)
- `if (false)` or `if (true)` equivalent conditions
- Feature flags that are always on or always off
- Environment checks for environments that don't exist
- Type narrowing branches for types not in the union

### Unused Imports (weight: 1)
- Imported symbols never referenced in the file
- Type-only imports used as values (or vice versa)
- Namespace imports where no member is accessed

### Unused Variables (weight: 1)
- Declared variables never read
- Function parameters never referenced
- Destructured properties never used
- Loop variables never accessed

## Process

### Step 1: Compiler Diagnostics

Run TypeScript compiler with strict unused checks:

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters 2>&1 | head -200
```

Parse `TS6133` (declared but never read) and `TS6196` (declared but never used) errors. Record each as `[file:line]`.

If `tsc` is unavailable or the project isn't TypeScript, skip to Step 2.

### Step 2: Dependency Graph

Build a file-level import graph:

1. List all source files (`.ts`, `.tsx`, `.js`, `.jsx`) excluding `node_modules`, `dist`, `build`
2. For each file, extract its import paths
3. Identify files that are never imported by any other file
4. Exclude entry points: files matching `index.*`, `main.*`, `cli.*`, `app.*`, `server.*`, files in `bin/`, and test files (`*.test.*`, `*.spec.*`)
5. Remaining unimported files are **orphaned file** candidates

### Step 3: Export Analysis

For each source file:

1. Extract all named exports (`export function`, `export const`, `export type`, `export interface`, `export class`)
2. Search the entire project for imports of each symbol
3. Exports with zero external imports are **unused export** candidates
4. Exclude: entry-point re-exports, CLI command handlers, test utilities

### Step 4: Code Path Analysis

Read each file and identify:

1. **Unreachable code** — statements after `return`/`throw`/`break`/`continue`
2. **Dead branches** — conditions that are always true or always false based on type narrowing or constant values
3. **Uncalled internal functions** — non-exported functions with zero call sites in the same file

### Step 5: Compile Report

Collect all findings. Do not fix anything.

## Output Format

```markdown
## Dead Code Scan: [target]

DEAD_CODE_FOUND:
- [file:line] [category]: [description]
- [file:line] [category]: [description]

SUMMARY:
| Category | Count | Weight | Score |
|----------|-------|--------|-------|
| Orphaned files | N | 3 | N*3 |
| Unreachable code | N | 3 | N*3 |
| Unused exports | N | 2 | N*2 |
| Dead branches | N | 2 | N*2 |
| Unused imports | N | 1 | N*1 |
| Unused variables | N | 1 | N*1 |

TOTAL_FINDINGS: N
DEAD_CODE_INDEX: N (interpretation)

RECOMMENDATION: Remove dead code to reduce maintenance burden
```

## Pipeline Integration

When called from `/build` or `/improve` orchestrators, output findings as:

```
[file:line] [category]: description
```

End with: `DEADCODE_SCAN_DONE`

## No Changes Made

This is a **read-only** scan. It does not delete, fix, or modify any files.

## When to Use

- Before refactoring — find what's already dead
- After a large merge — detect newly orphaned code
- Periodic codebase hygiene check
- Estimating technical debt

## Anti-Patterns (Don't Do)

- Making any edits to files
- Deleting dead code (report only)
- Flagging test utilities as unused
- Flagging CLI entry points as orphaned
- Marking framework lifecycle hooks as uncalled
