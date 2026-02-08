# Lessons

Accumulated patterns from review phases (gemini-fix, qodana-fix) that earlier phases should catch.

Each entry records what a later phase found that an earlier phase missed. Over time, the earlier phases read this file and learn to prevent these patterns.

## Categories

- **DESIGN**: Architecture/abstraction issues (for create-plan, structure-first)
- **CODE_QUALITY**: Naming/complexity/style (for implement-plan, refactor-check-fix)
- **DUPLICATION**: Repeated patterns (for dedupe-fix)
- **LOGIC**: Bugs/edge cases (for implement-plan)

---

<!-- Entries will be appended below by /build and /improve after review phases -->

## 2026-02-05 - src/utils
### Gemini Found (phase 6)
- LOGIC: `path.startsWith(root)` without path separator suffix causes prefix collision (e.g., `/home/user` matches `/home/username`) → implement-plan should enforce `startsWith(root + path.sep)` pattern for all path containment checks

## 2026-02-05 - src/trace
### Gemini Found (phase 6)
- LOGIC: TOCTOU race in file reading — `findFile` checks `existsSync` then separate `readFileSync` can fail if file is deleted between calls → implement-plan should wrap `readFileSync` in try-catch when preceded by `existsSync` check
### Security Found (phase 8)
- LOGIC: Profile names parsed from CLAUDE.md regex were passed directly to `path.join` without validation — path traversal via crafted profile names like `../../etc/passwd` → implement-plan should validate names from user-controlled content with `isValidName` before path construction

### Gemini Adversarial Found (phase 8 redo)
- LOGIC: `existsSync` before `readFileSync` is a TOCTOU race AND redundant code — just use try-catch around readFileSync directly → implement-plan should never pair existsSync+readFileSync, use try-catch instead
- DESIGN: Unbounded lists parsed from user-controlled files (CLAUDE.md profile names) → implement-plan should add max limits on lists parsed from config files

## 2026-02-05 - src/canon
### Security Found (phase 8)
- LOGIC: `diffSkill` accepted skill names directly into `path.join` without validation — path traversal via `../../etc/passwd` as skill name → implement-plan should validate any name from user-controlled content with `isValidSkillName` (reject `/`, `\`, `..`) before path construction
- LOGIC: Same pattern in `copySkill` — any function that constructs paths from names needs validation at the boundary

## 2026-02-05 - src/workflow
### Qodana Found (phase 7)
- CODE_QUALITY: Dead exported function `getInstalledWorkflowSkills` never called — implement-plan should verify exports are actually used before creating them
### Phase 3 Found (create-plan)
- LOGIC: TOCTOU in `getWorkflowManifest` — `existsSync` guard before `readFileSync`. Same pattern as trace module → implement-plan: never pair existsSync+readFileSync
- LOGIC: TOCTOU in `listWorkflowSkills` — `existsSync` before reading SKILL.md files. Extracted `readSkillDescription` with try-catch as the fix pattern
- LOGIC: String-matching fragility — `result.message.includes('already installed')` to detect state instead of checking filesystem directly → implement-plan should check actual state, not match against human-readable strings
- DESIGN: Functions over 30 lines (`installWorkflowSkill`, `checkWorkflowStatus`, `upgradeWorkflowSkills`) — decompose by extracting validation, categorization, and recording steps into named helpers

## 2026-02-05 - src/ralph
### Phase 3 Found (create-plan)
- LOGIC: TOCTOU in 5 files (config/loader, skills/loader, phases/structure-first, phases/implement, summary/generator) — all the same `existsSync`+`readFileSync` pattern → this is the most common bug pattern in the codebase
- CODE_QUALITY: `summary/generator.ts` had a redundant verification read (writeFileSync then readFileSync to "verify") — this is a TOCTOU AND wasted I/O → implement-plan should trust writeFileSync, not re-read to verify
### Qodana Found (phase 7)
- CODE_QUALITY: 5 unused imports across ralph modules — implement-plan should not import symbols "just in case"
- CODE_QUALITY: 3 dead private functions (`executePhase`, `parseTestResults`, `printStageHeaderLegacy`) — refactor-check-fix should grep for callers before keeping functions
- CODE_QUALITY: Dead unexported constant `PHASE_ORDER` in types.ts duplicated the exported one in phases/index.ts — dedupe-fix should catch same-name constants in different files
### Security Found (phase 8)
- LOGIC: XSS in `generateSummaryHtml` — `JSON.stringify` embedded in `<script type="application/json">` without escaping `</` sequences. If any string in the data contains `</script>`, it breaks out of the script tag → implement-plan should always escape `</` to `<\/` when embedding JSON in HTML script tags
### Gemini Found (phase 6)
- LOGIC: `--dangerously-skip-permissions` in `spawnClaudeProcess` is by design for autonomous pipelines, but Gemini flags it every time → gemini-fix should know this is intentional and not a finding
- LOGIC: `shell: false` in spawn prevents command injection even with untrusted prompt content — Gemini incorrectly flags prompt content as command injection risk when shell is disabled → gemini-fix should understand execFile/spawn with shell:false is safe

## 2026-02-05 - src/cli
### Phase 3 Found (create-plan)
- LOGIC: **Shell injection** in `dedupe.ts` — `execSync` with template literal interpolation of `searchPath` parameter: `` `grep -rn "${pattern}" ... "${searchPath}"` ``. User-controlled path passed directly into shell command → implement-plan should NEVER use `execSync` with template literals containing variables. Use `execFileSync` with args array instead
- LOGIC: This is the most severe bug found across all 8 modules — actual command injection, not just a race condition
### Qodana Found (phase 7)
- CODE_QUALITY: Dead function `validatePath` in workflow.ts — defined but never called, along with 2 unused imports it pulled in → implement-plan should not write functions speculatively
### Security Found (phase 8)
- LOGIC: Path traversal in `handleCreate` — profile `name` from CLI arg passed to `saveProfile` which does `path.join(USER_PROFILES_DIR, name + '.yaml')` without validation → implement-plan should validate names at CLI input boundaries, not just in library functions
### Gemini False Positive Patterns (phase 6 + 8)
- Gemini consistently flags CLI tools for "missing rate limiting" — not applicable to local CLI tools
- Gemini consistently suggests "allowed base directory" restrictions for `validateProjectPath` — not applicable when the user explicitly chooses their project directory
- Gemini consistently flags `process.env` propagation to child processes as "environment variable injection" — not applicable when the user controls their own terminal environment
- Gemini consistently recommends transaction/rollback for multi-step CLI operations — disproportionate for a dev tool where re-running is trivial
