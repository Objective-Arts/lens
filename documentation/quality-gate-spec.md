# Quality Gate Spec: Code Pattern Checks & Evidence Checklists

## Context

Canon skills contain judgment-based checks that machines can't evaluate directly. Two strategies close the gap:

1. **Code pattern checks** — measurable patterns that correlate with canon violations. Machines run them. No LLM involved.
2. **Evidence checklists** — structured output that phases produce during review. Machines validate completeness, not correctness.

Both go into `scripts/quality-gate.ts`. Both exit non-zero on failure.

---

## Part 1: Code Pattern Checks

Each check traces to a canon SUMMARY.md. The check catches the worst violations of that canon principle. It won't catch subtle violations — that stays with evidence checklists and model review.

All checks skip `*.test.ts`, `node_modules/`, `dist/`, `.claude/`.

### Naming Checks

Canon source: `canon/clarity/SUMMARY.md` check #2 (name sufficiency)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Banned parameter names | Exported function parameters | Any parameter named `data`, `info`, `result`, `item`, `obj`, `val`, `tmp`, `temp`, `ret`, `res` (single word, not part of compound like `resultSet`) |
| Single-letter params | Exported function parameters | Any single-letter parameter except `_`, `i`, `j`, `k` in loops, or `e` in catch blocks |
| Short function names | Exported functions | Any exported function name under 4 characters |
| Banned file names | Source file names | Any file named `utils.ts`, `helpers.ts`, `misc.ts`, `common.ts`, `shared.ts` (top-level only — `src/utils/` as a directory is fine, `src/utils.ts` as a file is not) |
| Abbreviated names | Exported symbols | Any exported name containing `mgr`, `impl`, `proc`, `svc`, `repo` unless the full word is used (`manager`, `implementation`, etc.) |

### Composition Checks

Canon source: `canon/composition/SUMMARY.md` (do one thing), `canon/simplicity/SUMMARY.md` (minimal coupling)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Export count per file | Count `export` statements per file | Any non-index file with more than 10 exports |
| Parameter count | Function declarations | Any function with more than 4 parameters (destructured object counts as 1) |
| Import fan-in | Count `import` lines per file | Any file importing from more than 8 other project files (excludes node_modules) |
| File length | Line count | Any file over 300 lines (grandfathered files get warn, not error) |
| Function length | Function body line count | Any function over 30 lines (excluding blanks and comments) |

### Testing Checks

Canon source: `canon/testing/test-strategy/SUMMARY.md`, `canon/testing/test-doubles/SUMMARY.md`

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Test file coverage | For each `src/**/*.ts` (non-test, non-index, non-types) | No corresponding `.test.ts` file exists |
| Empty tests | Test files | Any `it()` or `test()` block with no `expect()` call inside |
| Test importing test | Import statements in test files | Any `.test.ts` file importing from another `.test.ts` file |

### Security Checks

Canon source: `canon/security/owasp/SUMMARY.md`, `canon/security/security-mindset/SUMMARY.md`

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Shell injection | `exec()` or `execSync()` | Argument is a template literal or string concatenation |
| Hardcoded secrets | String literals | Matches patterns: `password\s*=\s*["']`, `api[_-]?key\s*=\s*["']`, `token\s*=\s*["']`, `secret\s*=\s*["']`, strings starting with `sk-`, `pk-`, `ghp_`, `gho_`, `AKIA` |
| Path traversal | `path.join()`, `path.resolve()` | Any argument is a variable that traces to user input (CLI arg, env var, HTTP param) without prior validation |
| Empty catch | `catch` blocks | Any catch block with zero statements (empty body) |
| Raw error exposure | `console.error()` | Argument is a raw error variable from a catch block (e.g., `console.error(err)` not `console.error(err.message)`) |
| Unguarded JSON.parse | `JSON.parse()` | Not wrapped in try/catch |
| Circular imports | Import graph | DFS cycle detection on project import graph |

### Design Checks

Canon source: `canon/abstraction/SUMMARY.md`, `canon/data-first/SUMMARY.md`, `canon/design-patterns/SUMMARY.md`

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Class method count | Class declarations | Any class with more than 10 methods |
| Inheritance depth | Class declarations | Any class with inheritance depth > 2 (`A extends B extends C`) |
| Types before functions | File structure | Any file where the first function declaration appears before the first type/interface declaration (files with no types are exempt) |

### Magic Value Checks

Canon source: `canon/clarity/SUMMARY.md` check #3 (magic value audit)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Magic numbers | Numeric literals in logic (not in type positions, array indices, or const declarations) | Any number other than -1, 0, 1, 2 that isn't assigned to a named constant |
| Magic strings | String literals in conditionals or comparisons | Any string in an `if`, `switch`, `===`, `!==` that isn't assigned to a named constant (exempt: empty string `""`) |

---

## Part 2: Evidence Checklists

### How It Works

Phases that perform structured review produce evidence checklists as part of their own SKILL.md instructions. The machine validates completeness:

1. The phase writes a structured checklist to `.claude/evidence/{phase-name}.md`
2. The machine counts items in the codebase (exported functions, error messages, etc.)
3. The machine counts rows in the checklist
4. If rows < expected count, the checklist is incomplete — phase fails
5. The machine does NOT evaluate whether each verdict is correct — that's the LLM's job

### Checklist Format

Every checklist uses this format:

```
# Evidence: {check name}
Canon: {canon-file} {check number}
Scanned: {count} items in {count} files

| Location | Item | Verdict | Reasoning |
|----------|------|---------|-----------|
| src/crypto.ts:8 | encrypt | PASS | encrypts plaintext with AES-256-GCM |
| src/commands/add.ts:4 | handleAdd | FAIL | "handle" is meaningless — rename to addKey |
```

Rules:
- One row per item. No grouping, no "and 5 more like this."
- Location must be file:line.
- Verdict must be PASS or FAIL.
- Reasoning must be one sentence.
- FAIL rows must include what to do about it.

### Checklists by Phase

#### Phase 4: refactoring

Produces 3 checklists:

**Checklist 4a: Name sufficiency**

Canon: `clarity/SUMMARY.md` check #2

- Machine counts: all exported functions and exported constants
- Claude lists: every exported symbol, what it does in under 8 words
- Validation: row count must equal exported symbol count

**Checklist 4b: Single responsibility**

Canon: `clarity/SUMMARY.md` check #1

- Machine counts: all exported functions
- Claude lists: every exported function, one-sentence purpose WITHOUT using "and"
- Validation: row count must equal function count. Any row containing " and " in the reasoning column → auto-FAIL (the function does two things)

**Checklist 4c: Magic value audit**

Canon: `clarity/SUMMARY.md` check #3

- Machine counts: all numeric and string literals (non-trivial)
- Claude lists: every literal, why it's acceptable or what constant to extract
- Validation: row count must equal literal count from code pattern check

#### Phase 8: evaluation

Produces 1 checklist:

**Checklist 8a: Attack surface inventory**

Canon: `owasp/SUMMARY.md` checks #1-#5

- Machine counts: all entry points (exported CLI commands, HTTP handlers, file I/O with external paths)
- Claude lists: every entry point, what an attacker can send, what stops them
- Validation: row count must equal entry point count

### Machine Validation Script

Add to `scripts/quality-gate.ts`:

```
quality-gate validate-evidence [phase-name]
```

For each checklist in `.claude/evidence/`:

1. Parse the markdown table
2. Count rows with `src/` in the Location column
3. Run the corresponding counter (exported functions, catch blocks, etc.) against the codebase
4. Compare counts
5. Report: `Checklist 4a: 14/14 items reviewed ✓` or `Checklist 4a: 9/14 items reviewed ✗ INCOMPLETE`

Exit non-zero if any checklist is incomplete.

### Phase-Driven Evidence

Evidence checklists are produced by phases as part of their own SKILL.md instructions, not orchestrated by the build/improve pipeline. The quality gates check that evidence exists and is complete. This is simpler than the previous model where evidence gates were separate pipeline steps between each review phase.

### Cleanup

Evidence files are ephemeral. After a successful build:

```bash
rm -rf .claude/evidence/
```

They're proof of work, not documentation. Once the build passes, they're not needed.

---

## Summary

| Layer | What gets checked | Who checks | Reliability |
|-------|-------------------|------------|-------------|
| Machine gates (mechanical) | any, function length, secrets, shell injection | Machine | 100% |
| Code pattern checks (correlates) | bad names, too many params, empty catches, magic values | Machine | 100% for what it catches, misses subtle cases |
| Evidence checklists (completeness) | every exported function reviewed, every entry point audited | LLM judges, machine validates completeness | LLM judgment varies, but nothing gets skipped |
| Parallel review (coverage) | same code, three independent perspectives | 3 scan agents | reduces blind spots via deduplication |

Combined effect: ~10% fully machine-enforced → ~30% with pattern checks → remaining 70% has verified-complete LLM review with multi-model scan coverage.
