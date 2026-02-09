# Quality Gate Spec: Proxy Checks & Evidence Checklists

## Context

Canon skills contain judgment-based checks that machines can't evaluate directly. Two strategies close the gap:

1. **Proxy checks** — measurable patterns that correlate with canon violations. Machines run them. No LLM involved.
2. **Evidence checklists** — structured output that LLMs must produce during review phases. Machines validate completeness, not correctness.

Both go into `scripts/quality-gate.ts`. Both exit non-zero on failure.

---

## Part 1: Proxy Checks

Each proxy check traces to a canon SUMMARY.md. The check catches the worst violations of that canon principle. It won't catch subtle violations — that stays with evidence checklists and model review.

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

1. Each review phase writes a structured checklist to `.claude/evidence/{phase-name}.md`
2. The machine counts items in the codebase (exported functions, error messages, input boundaries, etc.)
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

#### Phase 4: refactor-check-fix

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
- Validation: row count must equal literal count from proxy check

#### Phase 6: gemini-fix

Produces 2 checklists:

**Checklist 6a: Error message audit**

Canon: `security-mindset/SUMMARY.md` hard gate #1

- Machine counts: all `console.error`, `console.log`, `throw new Error`, `reject(` calls
- Gemini lists: every error/log statement, what it exposes, whether it leaks internals
- Validation: row count must equal error/log statement count

**Checklist 6b: Input boundary check**

Canon: `security-mindset/SUMMARY.md` hard gate #3

- Machine counts: CLI arg reads (`process.argv`, commander `.argument()`, `.option()`), `fs.readFile`, `env` access
- Gemini lists: every input boundary, what validation runs before business logic
- Validation: row count must equal input boundary count

#### Phase 7: codex-check

Produces 1 checklist:

**Checklist 7a: Auth and failure path review**

Canon: `security-mindset/SUMMARY.md` checks #3, #4, #5

- Machine counts: all `catch` blocks + all `if` blocks that check permissions/auth
- Codex lists: every catch block — does it fail open or closed? Every auth check — is there a bypass path?
- Validation: row count must equal catch block count

#### Phase 9: adversarial-security-review

Produces 1 checklist:

**Checklist 9a: Attack surface inventory**

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

### Pipeline Integration

In `build/SKILL.md` and `improve/SKILL.md`:

```
Phase 4: refactor-check-fix
  → writes .claude/evidence/refactor-4a.md, refactor-4b.md, refactor-4c.md

Gate 4.5: npm run quality-gate validate-evidence refactor
  → checks all 3 checklists for completeness
  → if incomplete: bounce back to Phase 4 with "you missed N items"
  → max 2 retries, then halt

Phase 6: gemini-fix
  → writes .claude/evidence/gemini-6a.md, gemini-6b.md

Gate 6.5: npm run quality-gate validate-evidence gemini
  → same validation

Phase 7: codex-check
  → writes .claude/evidence/codex-7a.md

Gate 7.5: npm run quality-gate validate-evidence codex
  → same validation
```

### Cleanup

Evidence files are ephemeral. After a successful build:

```bash
rm -rf .claude/evidence/
```

They're proof of work, not documentation. Once the build passes, they're not needed.

---

## Part 3: Canary Tests

### Purpose

Evidence checklists prove the reviewer looked at every item. Canary tests prove the reviewer was actually paying attention. A reviewer can list every function and mark them all PASS without genuinely evaluating. Canaries catch that.

### How It Works

1. Before a review phase runs, the machine inserts 3-5 known violations into random source files
2. The machine records what was inserted and where (in a manifest file the reviewer cannot see)
3. The reviewer runs its normal review
4. After the review, the machine checks: did the reviewer's evidence checklist flag the canary locations?
5. Canaries are removed from source regardless of outcome
6. If any canary was missed, the review is invalidated and rerun (max 1 retry)

### Canary Categories

Each canary run plants one violation from each category to test breadth of review:

| Category | Canon source | What gets planted | Example |
|----------|-------------|-------------------|---------|
| Naming | clarity check #2 | Vague exported function name | `export function process(d: any) { return d; }` |
| Security | owasp check #1 | Shell injection | `` exec(`echo ${input}`) `` |
| Secrets | security-mindset gate #5 | Hardcoded credential | `const apiKey = "sk-canary-test-00000";` |
| Types | typescript gate #1 | Explicit any | `export function load(config: any): void {}` |
| Complexity | clarity check #4 | Deeply nested logic | `if (a) { if (b) { if (c) { if (d) { ... } } } }` |

The machine picks 3-5 of these per run. Never all 5 — the reviewer shouldn't be able to guess the pattern.

### Canary Manifest

The machine writes a manifest before the review phase starts. The manifest is NOT visible to the reviewer.

File: `.claude/canary-manifest.json` (gitignored, deleted after validation)

```json
{
  "phase": "gemini-fix",
  "timestamp": "2026-02-08T18:00:00Z",
  "canaries": [
    {
      "id": "c1",
      "category": "secrets",
      "file": "src/crypto.ts",
      "line": 12,
      "inserted": "const apiKey = \"sk-canary-test-00000\";",
      "original": ""
    },
    {
      "id": "c2",
      "category": "naming",
      "file": "src/storage.ts",
      "line": 5,
      "inserted": "export function proc(d: any) { return d; }",
      "original": ""
    },
    {
      "id": "c3",
      "category": "security",
      "file": "src/commands/add.ts",
      "line": 8,
      "inserted": "exec(`rm ${userInput}`);",
      "original": ""
    }
  ]
}
```

The `original` field stores whatever was at that line before insertion, so the machine can restore the file exactly.

### Insertion Rules

- Insert at a random line inside a real function body, not at the top of the file (too obvious)
- Never insert into test files
- Never insert into `index.ts` barrel exports (would break compilation)
- The inserted code must compile — add necessary imports if needed (e.g., `import { exec } from 'child_process';`)
- Choose files that the review phase will scan (don't plant in files outside the target path)
- Rotate categories across runs — don't always plant the same 3

### Validation

After the review phase completes, run:

```
quality-gate validate-canaries {phase-name}
```

The validator:

1. Reads `.claude/canary-manifest.json`
2. Reads the reviewer's evidence checklist from `.claude/evidence/{phase-name}-*.md`
3. For each canary, checks: does any checklist row reference that file:line with a FAIL verdict?
4. Reports results:

```
Canary validation for gemini-fix:
  c1 (secrets)  src/crypto.ts:12    → DETECTED ✓
  c2 (naming)   src/storage.ts:5    → DETECTED ✓
  c3 (security) src/commands/add.ts:8 → MISSED ✗

Result: 2/3 detected. Review INVALID — rerun required.
```

5. Restores all canary lines to their original content
6. Deletes the manifest
7. If any canary was missed: exit non-zero

### Detection Threshold

- All canaries must be detected for the review to pass
- These are deliberately obvious violations — a hardcoded `sk-` key, an `exec` with a template literal. If the reviewer can't find these, it's not finding real issues either
- One retry allowed. If the reviewer misses canaries twice, the phase halts and reports failure

### Pipeline Integration

Canaries wrap the review phases. They do NOT apply to Claude's self-review (Phase 4) — only to external reviewers:

```
Phase 6: gemini-fix
  Pre:  quality-gate insert-canaries gemini (plants 3-5 violations, writes manifest)
  Run:  Gemini reviews and writes evidence checklist
  Post: quality-gate validate-canaries gemini (checks detection, restores files)
  → if missed: rerun Phase 6 once
  → if missed again: halt

Phase 7: codex-check
  Pre:  quality-gate insert-canaries codex (plants 3-5 violations, writes manifest)
  Run:  Codex reviews and writes evidence checklist
  Post: quality-gate validate-canaries codex (checks detection, restores files)
  → if missed: rerun Phase 7 once
  → if missed again: halt
```

### Why Not Canary Claude's Self-Review?

Claude wrote the code. It knows what it wrote. Planting canaries in its own output and asking it to find them tests memory, not judgment. The canaries are useful against reviewers who are seeing the code for the first time — they test whether the reviewer is actually reading.

### Cleanup

After validation (pass or fail):

```bash
rm -f .claude/canary-manifest.json
```

Source files are restored to their pre-canary state by the validator. If the process crashes mid-canary, a stale manifest on disk means `git checkout -- .` will restore clean state.

---

## Summary

| Layer | What gets checked | Who checks | Reliability |
|-------|-------------------|------------|-------------|
| Machine gates (mechanical) | any, function length, secrets, shell injection | Machine | 100% |
| Proxy checks (correlates) | bad names, too many params, empty catches, magic values | Machine | 100% for what it catches, misses subtle cases |
| Evidence checklists (completeness) | every exported function reviewed, every error message audited, every input boundary checked | LLM judges, machine validates completeness | LLM judgment varies, but nothing gets skipped |
| Three-model vote (disagreement) | same judgment checks, different perspectives | 3 LLMs | reduces blind spots |
| Canary tests (honesty) | known violations seeded before review | Machine validates detection | catches lazy reviews |

Combined effect: ~10% fully machine-enforced → ~30% with proxies → remaining 70% has verified-complete LLM review with three-model cross-check.
