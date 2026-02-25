# Lessons

Accumulated patterns from review phases (gemini-review, qodana-review) that earlier phases should catch.

Each entry records what a later phase found that an earlier phase missed. Over time, the earlier phases read this file and learn to prevent these patterns.

## Categories

- **DESIGN**: Architecture/abstraction issues (for plan, structure)
- **CODE_QUALITY**: Naming/complexity/style (for implementation, refactoring)
- **DUPLICATION**: Repeated patterns (for deduplication)
- **LOGIC**: Bugs/edge cases (for implementation)

---

<!-- Entries will be appended below by /build and /improve after review phases -->

## 2026-02-05 - src/utils
### Gemini Found (phase 6)
- LOGIC: `path.startsWith(root)` without path separator suffix causes prefix collision (e.g., `/home/user` matches `/home/username`) → implementation should enforce `startsWith(root + path.sep)` pattern for all path containment checks

## 2026-02-05 - src/trace
### Gemini Found (phase 6)
- LOGIC: TOCTOU race in file reading — `findFile` checks `existsSync` then separate `readFileSync` can fail if file is deleted between calls → implementation should wrap `readFileSync` in try-catch when preceded by `existsSync` check
### Security Found (phase 8)
- LOGIC: Profile names parsed from CLAUDE.md regex were passed directly to `path.join` without validation — path traversal via crafted profile names like `../../etc/passwd` → implementation should validate names from user-controlled content with `isValidName` before path construction

### Gemini Adversarial Found (phase 8 redo)
- LOGIC: `existsSync` before `readFileSync` is a TOCTOU race AND redundant code — just use try-catch around readFileSync directly → implementation should never pair existsSync+readFileSync, use try-catch instead
- DESIGN: Unbounded lists parsed from user-controlled files (CLAUDE.md profile names) → implementation should add max limits on lists parsed from config files

## 2026-02-05 - src/canon
### Security Found (phase 8)
- LOGIC: `diffSkill` accepted skill names directly into `path.join` without validation — path traversal via `../../etc/passwd` as skill name → implementation should validate any name from user-controlled content with `isValidSkillName` (reject `/`, `\`, `..`) before path construction
- LOGIC: Same pattern in `copySkill` — any function that constructs paths from names needs validation at the boundary

## 2026-02-05 - src/workflow
### Qodana Found (phase 7)
- CODE_QUALITY: Dead exported function `getInstalledWorkflowSkills` never called — implementation should verify exports are actually used before creating them
### Phase 3 Found (plan)
- LOGIC: TOCTOU in `getWorkflowManifest` — `existsSync` guard before `readFileSync`. Same pattern as trace module → implementation: never pair existsSync+readFileSync
- LOGIC: TOCTOU in `listWorkflowSkills` — `existsSync` before reading SKILL.md files. Extracted `readSkillDescription` with try-catch as the fix pattern
- LOGIC: String-matching fragility — `result.message.includes('already installed')` to detect state instead of checking filesystem directly → implementation should check actual state, not match against human-readable strings
- DESIGN: Functions over 30 lines (`installWorkflowSkill`, `checkWorkflowStatus`, `upgradeWorkflowSkills`) — decompose by extracting validation, categorization, and recording steps into named helpers

## 2026-02-05 - src/ralph
### Phase 3 Found (plan)
- LOGIC: TOCTOU in 5 files (config/loader, skills/loader, phases/structure, phases/implement, summary/generator) — all the same `existsSync`+`readFileSync` pattern → this is the most common bug pattern in the codebase
- CODE_QUALITY: `summary/generator.ts` had a redundant verification read (writeFileSync then readFileSync to "verify") — this is a TOCTOU AND wasted I/O → implementation should trust writeFileSync, not re-read to verify
### Qodana Found (phase 7)
- CODE_QUALITY: 5 unused imports across ralph modules — implementation should not import symbols "just in case"
- CODE_QUALITY: 3 dead private functions (`executePhase`, `parseTestResults`, `printStageHeaderLegacy`) — refactoring should grep for callers before keeping functions
- CODE_QUALITY: Dead unexported constant `PHASE_ORDER` in types.ts duplicated the exported one in phases/index.ts — deduplication should catch same-name constants in different files
### Security Found (phase 8)
- LOGIC: XSS in `generateSummaryHtml` — `JSON.stringify` embedded in `<script type="application/json">` without escaping `</` sequences. If any string in the data contains `</script>`, it breaks out of the script tag → implementation should always escape `</` to `<\/` when embedding JSON in HTML script tags
### Gemini Found (phase 6)
- LOGIC: `--dangerously-skip-permissions` in `spawnClaudeProcess` is by design for autonomous pipelines, but Gemini flags it every time → gemini-review should know this is intentional and not a finding
- LOGIC: `shell: false` in spawn prevents command injection even with untrusted prompt content — Gemini incorrectly flags prompt content as command injection risk when shell is disabled → gemini-review should understand execFile/spawn with shell:false is safe

## 2026-02-05 - src/cli
### Phase 3 Found (plan)
- LOGIC: **Shell injection** in `dedupe.ts` — `execSync` with template literal interpolation of `searchPath` parameter: `` `grep -rn "${pattern}" ... "${searchPath}"` ``. User-controlled path passed directly into shell command → implementation should NEVER use `execSync` with template literals containing variables. Use `execFileSync` with args array instead
- LOGIC: This is the most severe bug found across all 8 modules — actual command injection, not just a race condition
### Qodana Found (phase 7)
- CODE_QUALITY: Dead function `validatePath` in workflow.ts — defined but never called, along with 2 unused imports it pulled in → implementation should not write functions speculatively
### Security Found (phase 8)
- LOGIC: Path traversal in `handleCreate` — profile `name` from CLI arg passed to `saveProfile` which does `path.join(USER_PROFILES_DIR, name + '.yaml')` without validation → implementation should validate names at CLI input boundaries, not just in library functions
### Gemini False Positive Patterns (phase 6 + 8)
- Gemini consistently flags CLI tools for "missing rate limiting" — not applicable to local CLI tools
- Gemini consistently suggests "allowed base directory" restrictions for `validateProjectPath` — not applicable when the user explicitly chooses their project directory
- Gemini consistently flags `process.env` propagation to child processes as "environment variable injection" — not applicable when the user controls their own terminal environment
- Gemini consistently recommends transaction/rollback for multi-step CLI operations — disproportionate for a dev tool where re-running is trivial

## 2026-02-24 - src (phase 8 eval)

### CODE_QUALITY Found (phase 8)
- CODE_QUALITY: Use `cause` as the catch parameter name when re-wrapping errors — signals intent and aligns with JS `Error.cause` convention (e.g., `catch (cause) { throw new Error('msg', { cause }) }`) → implementation should name catch params `cause` when wrapping
- CODE_QUALITY: Abbreviated parameter names (`opts`, `pkg`, `name`, `info`) hide intent — use full descriptive names that reveal what the argument represents (`stackInfo`, `packageJson`, `depName`, `installedInfo`) → implementation should reject one-word generic param names when a more descriptive alternative exists

### LOGIC Found (phase 8)
- LOGIC: Always check file size via `fs.stat` before reading any user-controlled or external file — prevents memory exhaustion from unexpectedly large inputs; use a 1 MB (or domain-appropriate) limit before calling `readFile` or `readFileSync`

### TYPE_SAFETY Found (phase 8)
- LOGIC: After JSON.parse, always assign to `unknown` and validate structure before casting — never cast `JSON.parse` result directly to a typed interface. Pattern: `const parsed: unknown = JSON.parse(raw); if (!isRecord(parsed)) throw ...; return parsed as unknown as T;`

### DESIGN Found (phase 8)
- DESIGN: Module-level singletons that cache computed state must export a reset function for testability — without it, tests that change environment variables or mode flags cannot isolate scenarios. Pattern: `export function resetXCache() { _cached = undefined; }`

## 2026-02-24 - src (phase 8 fix eval)

### TYPE_SAFETY Found (phase 8)
- TYPE_SAFETY: Non-null assertion operators (!) bypass the type checker at runtime — replace with explicit null guards (`if (!obj.field) obj.field = init()`) or Map get+set patterns (`const existing = map.get(k); if (!existing) { const v = init(); map.set(k, v); existing = v; }`)
- TYPE_SAFETY: Type assertions (`value as string[]`, `result as SomeInterface`) without a preceding runtime type guard are unsafe — extract a named guard function (`isStringArray`, `isRecord`, `isStringValueRecord`) and call it before asserting; if the guard fails, throw or return early

### DESIGN Found (phase 8)
- DESIGN: Functions that access global path constants (e.g., GLOBAL_CLAUDE_PATH, registry directory derived from HOME) should accept an optional injectable parameter with the constant as its default — without this seam, unit tests must set up real filesystem state for every test scenario. Pattern: `function loadRegistry(dir = getRegistryDir()) { ... }`
