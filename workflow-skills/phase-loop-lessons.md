# Phase Loop Lessons (Universal)

Cross-project patterns accumulated from phases 6-8 (gemini-fix, qodana-fix, adversarial-security-review).
Phases 1-5 read this file at Step 0b to proactively avoid known mistakes.

This file ships with workflow-skills/ and applies to ALL projects.
Project-specific lessons go in `.claude/phase-loop-lessons.md` (local to each project).

## Categories

- **DESIGN**: Architecture/abstraction issues (for create-plan, structure-first)
- **CODE_QUALITY**: Naming/complexity/style (for implement-plan, refactor-check-fix)
- **DUPLICATION**: Repeated patterns (for dedupe-fix)
- **LOGIC**: Bugs/edge cases (for implement-plan)

---

## LOGIC Patterns

### TOCTOU (Time-of-Check-to-Time-of-Use)
- Never pair `existsSync` + `readFileSync` — the file can be deleted between the two calls. Use try-catch around `readFileSync` directly.
- This is the single most common bug pattern across codebases. Found in 10+ files across 6 modules in one project.

### Shell Injection
- NEVER use `execSync` with template literals containing variables: `` execSync(`grep "${pattern}" "${path}"`) ``
- Always use `execFileSync` with an args array: `execFileSync('grep', ['-rn', pattern, path])`
- `shell: false` (default for `execFile`/`spawn`) prevents injection even with untrusted content

### Path Traversal
- Any name from user input (CLI args, config files, regex-parsed content) must be validated before `path.join`: reject `/`, `\`, `..`
- Validate at the boundary where user input enters — not deep in library functions
- Pattern: `if (name.includes('/') || name.includes('\\') || name.includes('..'))` → reject

### Path Prefix Collision
- `path.startsWith(root)` without trailing separator matches too broadly: `/home/user` matches `/home/username`
- Always use `startsWith(root + path.sep)` or `startsWith(root + '/')` for path containment checks

### XSS in Embedded JSON
- `JSON.stringify` inside `<script type="application/json">` is vulnerable if data contains `</script>`
- Always escape: `.replace(/<\//g, '<\\/')`

### String-Matching Fragility
- Don't match against human-readable strings to detect state: `result.message.includes('already installed')`
- Check actual filesystem/application state directly instead

## DESIGN Patterns

### Unbounded User-Controlled Lists
- Lists parsed from user-controlled files (config, markdown, env) should have max limits
- Without limits, a malicious config can cause memory exhaustion

### Function Size
- Functions over 30 lines should be decomposed by extracting validation, categorization, and recording steps into named helpers
- Common offenders: install/upgrade/status functions that mix validation + action + reporting

## CODE_QUALITY Patterns

### Dead Exports
- Verify exports are actually imported somewhere before creating them
- Don't write functions speculatively — wait until there's a caller

### Unused Imports
- Don't import symbols "just in case" — only import what you use
- After refactoring, check if imports became unused

### Redundant Verification Reads
- Don't `readFileSync` after `writeFileSync` to "verify" the write — trust the write, this is both TOCTOU and wasted I/O

### Dead Constants/Functions
- Same-name constants in different files → dedupe-fix should catch these
- Grep for callers before keeping any function — if zero callers, delete it

## DUPLICATION Patterns

### Same-Name Constants
- Watch for the same constant defined in multiple files (e.g., `PHASE_ORDER` in both `types.ts` and `phases/index.ts`)
- Keep one canonical location, import everywhere else

## Gemini False Positive Patterns

These are patterns Gemini consistently flags but are NOT applicable in certain contexts:

- **"Missing rate limiting"** — not applicable to local CLI tools
- **"Allowed base directory" restrictions** — not applicable when the user explicitly chooses their project directory
- **"Environment variable injection"** via `process.env` propagation — not applicable when the user controls their own terminal
- **"Transaction/rollback for multi-step operations"** — disproportionate for dev tools where re-running is trivial
- **`--dangerously-skip-permissions` flag** — intentional for autonomous pipelines, not a vulnerability
- **"Command injection" with `shell: false`** — `execFile`/`spawn` with `shell: false` is safe by design
