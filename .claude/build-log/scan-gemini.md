# Gemini Scan: src/

Scanned: 2026-02-24
Passes: 2 (general + security focus)
Files scanned: ~85 TypeScript source files

---

## Run 1: General Focus (Code Quality, Architecture, AI Smells)

### CRITICAL

[src/workflow/registry.ts:101-103] — Command injection canary code present in production file (CRITICAL)
- Problem: `exec(\`echo ${input}\`)` with unquoted template literal interpolation directly in source. The file also has a duplicate `import { exec } from "child_process"` at line 1 and inside the function body at line 102. The `input` variable is undefined in scope — this is a canary or accidental commit of dangerous code.
- Impact: Arbitrary OS command execution with user-level privileges if `input` is ever provided.
- Suggested fix: Remove the `// CANARY:security` block entirely. Never use `exec` with unquoted template strings.

[src/profiles/apply-config.ts:195-197] — Cross-filesystem atomic write failure (CRITICAL)
- Problem: `updateClaudeMdWithProfile` creates temp file at `os.tmpdir()` then renames to `claudeMdPath`. On Linux/macOS `os.tmpdir()` is often `/tmp` (tmpfs), while the project files are on a real filesystem. `fs.rename` across filesystems throws EXDEV.
- Impact: CLAUDE.md write silently fails or corrupts on systems where /tmp is a different device.
- Suggested fix: Use `path.join(path.dirname(claudeMdPath), \`.claude-md.tmp.${process.pid}\`)` so temp and target are on the same filesystem.

### HIGH

[src/utils/hash.ts:8-11] — Unbounded file read in hashFileContents (HIGH)
- Problem: `fs.readFileSync(filePath)` with no size guard. `hashDirectoryContents` has a `MAX_HASH_FILE_SIZE` guard but `hashFileContents` does not.
- Impact: OOM / DoS if a large file is passed (e.g., a multi-GB binary mistakenly in scope).
- Suggested fix: Add `fs.statSync(filePath).size > MAX_HASH_FILE_SIZE` check before reading; throw or skip.

[src/workflow/registry.ts:45-52] — saveRegistry writes non-atomically (HIGH)
- Problem: `fs.writeFileSync(filePath, ...)` directly, no temp+rename pattern.
- Impact: Registry file corrupted on crash mid-write; all tracked installations lost.
- Suggested fix: Write to `filePath + '.tmp'` then `fs.renameSync`.

[src/canon/manifest.ts:38] — writeManifest writes non-atomically (HIGH)
- Problem: `fs.writeFileSync(manifestPath, ...)` directly.
- Impact: canon-manifest.json corrupted on crash; skill tracking state lost.
- Suggested fix: Temp file + rename in same directory.

[src/workflow/index.ts:115] — saveWorkflowManifest writes non-atomically (HIGH)
- Problem: `fs.writeFileSync(path.join(claudeDir, 'workflow-manifest.json'), ...)` directly.
- Impact: Workflow manifest corrupted on crash.
- Suggested fix: Temp file + rename in same directory.

[src/mcp/operations.ts:134] — saveSettings writes non-atomically (HIGH)
- Problem: `fs.writeFileSync(settingsJsonPath, ...)` directly, no temp+rename.
- Impact: settings.json corrupted on crash; MCP configuration lost.
- Suggested fix: Temp file + rename in same directory.

[src/scanner/index.ts:143-150] — Symlink resolution without path-bound check (HIGH)
- Problem: `resolveSymlink` calls `fs.realpathSync(dirPath)` and returns the resolved path without validating it stays within the project/global `.claude` directory. `findContentFile` then reads from `realPath` unconditionally.
- Impact: A symlink pointing to `/etc/passwd` or `~/.ssh/id_rsa` would be resolved and its content read into `ConfigItem.content` and passed to downstream analysis.
- Suggested fix: After resolving, check `realPath.startsWith(allowedRoot)` and return `null` if it escapes.

[src/profiles/loader.ts:146] — YAML parsed without schema restriction (HIGH)
- Problem: `parseYaml(content)` called without `{ schema: 'core' }`. `src/mcp/registry.ts` correctly uses `schema: 'core'` but profile loading does not.
- Impact: Attacker-controlled profile files in `~/.claude/profiles/` could use YAML merge keys, anchors, or type tags to cause unexpected parse behavior or prototype-style pollution.
- Suggested fix: `parseYaml(content, { schema: 'core' })` in all profile loading paths.

### MEDIUM

[src/cli/commands/init.ts:229-230] — Canary `any` type exported as public API (MEDIUM)
- Problem: `export function load(config: any): void {}` at end of `registerInitCommand` function body. This is dead code appended after the function closing brace — not reachable, but it compiles as a re-exported public symbol with `any`.
- Impact: Weakens TypeScript safety contract; suggests canary/test injection of code after function bodies.
- Suggested fix: Remove the `// CANARY:types` block entirely.

[src/cli/commands/trace.ts:27-28] — Canary code shadows built-in `process` (MEDIUM)
- Problem: `export function process(d: any) { return d; }` inside `registerTraceCommand` body. This shadows the global `process` within scope and uses `any`.
- Impact: If invoked, clobbers reference to Node.js `process` object; `any` type defeats type checking.
- Suggested fix: Remove the `// CANARY:naming` block entirely.

[src/profiles/apply.ts:98-99] — Skill source path not validated against canon root (MEDIUM)
- Problem: `findSkillSourcePath(skillName)` and `findSkillPathAsync(skillName, category)` return filesystem paths that are then passed directly to `copyDirectoryAsync(sourcePath, targetPath)` without verifying `sourcePath` is within the trusted canon directory.
- Impact: If a skill search path resolution returns a path outside the canon root (e.g., via a misconfigured environment variable or symlink in the source tree), files from arbitrary locations could be copied into the project.
- Suggested fix: After resolving `sourcePath`, assert `sourcePath.startsWith(canonRoot)` before copying.

[src/workflow/index.ts:41-43] — CC_WORKFLOW_SKILLS_PATH env override not bounded to safe root (MEDIUM)
- Problem: The env var is validated for null bytes, absolute path, and existence, but not constrained to a safe root directory. Any absolute path on the filesystem is accepted.
- Impact: A developer or compromised shell environment could point this to a malicious directory of fake skills.
- Suggested fix: Document that this is a developer-only override and add a warning; or restrict to paths under `~/.claude` or the package root.

[src/mcp/registry.ts:116-124] — Env var enumeration from YAML-controlled requiredEnv list (MEDIUM)
- Problem: `checkRequiredEnv` iterates `server.requiredEnv` from a user-writable YAML file and checks `process.env[envVar]`. Even though values are not printed, presence/absence of arbitrary env vars is detectable.
- Impact: An attacker who can write to `~/.claude/mcp-registry/*.yaml` can enumerate which secrets are present (e.g., `AWS_SECRET_ACCESS_KEY`, `DATABASE_PASSWORD`).
- Suggested fix: Maintain an allowlist of env var names the tool is permitted to check; reject any name not in the allowlist.

[src/profiles/loader.ts:116-119] — Circular extends detection checks child name not parent (MEDIUM)
- Problem: `resolveProfileExtends` checks `visited.has(profile.name)` then adds `profile.name` to `visited`. For a true cycle (A extends B, B extends A), when processing B the check is `visited.has('B')` which is false even though A→B→A is circular. The detection would only fire on a self-referential profile (A extends A).
- Impact: A→B→A circular extends causes infinite recursion and stack overflow instead of the expected warning.
- Suggested fix: Add the parent's name to `visited` before recursing: `visited.add(profile.extends)` or restructure the detection.

### LOW

[src/cli/commands/dedupe.ts:213-220] — Double execution of analyzeDuplications in JSON mode (LOW)
- Problem: When `--json` flag is set, `runDedupe` is called first (which calls `analyzeDuplications`), then `analyzeDuplications` is called again to produce JSON output.
- Impact: 2x runtime cost for JSON mode; grep runs twice.
- Suggested fix: Return the raw results from `runDedupe` alongside the formatted string, or restructure so analysis runs once.

[src/workflow/index.ts:111-118] — saveWorkflowManifest error message leaks internal path (LOW)
- Problem: Error message includes raw `cause.message` string from `JSON.stringify` or file write error, which may include internal filesystem paths.
- Impact: Minor information disclosure in error output.
- Suggested fix: Log cause separately; surface a generic message to the user.

[src/scanner/index.ts:39-44] — Filter for claudeMd items by name substring is fragile (LOW)
- Problem: `.filter(item => item.type === 'memory' && item.name.toLowerCase().includes('claude'))` relies on filename containing "claude". Files named differently (e.g., `PROJECT.md`) would be missed; files named `claude-notes.md` would be incorrectly included.
- Impact: Scanner may misidentify or miss CLAUDE.md files.
- Suggested fix: Match on the exact filename `CLAUDE.md` and `CLAUDE.local.md`.

---

## Run 2: Security Focus (Attacker Perspective)

### CRITICAL

[src/workflow/registry.ts:101-103] — Command injection: `exec(\`echo ${input}\`)` with uncontrolled variable (CRITICAL)
- Problem: Template literal interpolation into `exec` call. `input` is not declared in function scope; this code would throw a ReferenceError at runtime if reached, but the pattern itself is command injection. The dead import of `exec` at line 1 combined with the live import at line 102 suggests intentional or accidental security-sensitive code introduction.
- Impact: Arbitrary OS command execution.
- Attack vector: Any path that populates `input` with attacker-controlled content (e.g., a project path read from filesystem, env var).
- Suggested fix: Remove completely. Never use `exec` with template literals.

### HIGH

[src/scanner/index.ts:143-150] — Arbitrary file read via unsanitized symlink resolution (HIGH)
- Problem: `resolveSymlink` resolves symlinks to their real path via `fs.realpathSync` with no containment check. `findContentFile` then reads file content from `realPath`. The scanner processes `.claude/skills/` directories which are user-managed and can contain symlinks to anywhere.
- Impact: Reading `/etc/shadow`, `~/.ssh/id_rsa`, or any file the process has access to. Content ends up in `ConfigItem.content` in memory, potentially surfaced to display/log.
- Attack vector: Create `~/.claude/skills/evil -> /etc/passwd`; run `lens scan`.
- Suggested fix: After `realpathSync`, verify `realPath.startsWith(resolvedAllowedRoot + path.sep)`.

[src/profiles/apply.ts:88-109] — Skill sourcePath not bounded to canon root before directory copy (HIGH)
- Problem: `findSkillSourcePath` searches the canon directory tree for a skill path but the returned path is never validated against the canon root. If the canon directory contains symlinks, or if the search function returns an unexpected path, `copyDirectoryAsync(sourcePath, targetPath)` copies files from that arbitrary location.
- Impact: Arbitrary file copy from anywhere on filesystem into project's `.claude/canon/`.
- Attack vector: Symlink in canon directory pointing outside; skill name matching causes copy from malicious location.
- Suggested fix: Assert `sourcePath.startsWith(canonRoot)` before calling `copyDirectoryAsync`.

[src/profiles/loader.ts:146] — YAML parsed without schema: 'core' — prototype pollution risk (HIGH)
- Problem: Profile YAML loaded from `~/.claude/profiles/*.yaml` (user-writable) without schema restriction. The `yaml` library's default schema supports YAML merge keys (`<<:`) and other features that can mutate object prototypes or cause unexpected type coercions.
- Impact: Prototype pollution leading to property injection on parsed objects; unexpected behavior when profile data is used.
- Attack vector: Craft a `~/.claude/profiles/evil.yaml` with `__proto__` merge keys.
- Suggested fix: `parseYaml(content, { schema: 'core' })` in all profile loading functions.

[src/profiles/apply-config.ts:195-197] — Cross-filesystem rename fails silently or creates TOCTOU race (HIGH)
- Problem: Temp file at `os.tmpdir()` renamed to `claudeMdPath` on a potentially different filesystem. On Linux, `os.tmpdir()` is typically on tmpfs (ramdisk), while project files are on ext4/APFS. `fs.rename` across filesystems throws `EXDEV`; the error propagates up but the temp file is never cleaned up.
- Impact: CLAUDE.md write failure; temp file leak at `/tmp/.claude-md.tmp.<pid>`.
- Suggested fix: Temp file in `path.dirname(claudeMdPath)`.

### MEDIUM

[src/mcp/registry.ts:116-124] — Attacker-controlled YAML enumerates arbitrary environment variables (MEDIUM)
- Problem: `server.requiredEnv` is a string array from user-writable YAML at `~/.claude/mcp-registry/*.yaml`. `checkRequiredEnv` calls `process.env[envVar]` for each name. The presence/absence of the variable is returned in `EnvCheckResult.found`/`missing` arrays which are reported to the caller and potentially logged.
- Impact: Side-channel enumeration of which secrets are set in the environment (AWS_SECRET_ACCESS_KEY, DATABASE_URL, etc.).
- Attack vector: Place `requiredEnv: [AWS_SECRET_ACCESS_KEY, DATABASE_PASSWORD]` in a registry YAML.
- Suggested fix: Allowlist permitted env var names; reject any not in the allowlist.

[src/workflow/index.ts:41-43] — CC_WORKFLOW_SKILLS_PATH env var allows loading skills from arbitrary paths (MEDIUM)
- Problem: While null bytes and absoluteness are checked, no root directory constraint is applied. Any absolute path on the filesystem is accepted.
- Impact: An attacker controlling the shell environment can point this to a directory of malicious SKILL.md files that contain instructions that Claude Code will execute.
- Suggested fix: Restrict to paths under known safe roots or document as developer-only with explicit warning.

[src/canon/manifest.ts:23-26] — JSON.parse of manifest file without type validation (MEDIUM)
- Problem: `readManifest` does `JSON.parse(content) as CanonManifest` with a cast but no runtime type validation. Malformed or attacker-crafted manifest JSON could cause null dereferences or prototype pollution.
- Impact: If manifest file is replaced with malicious content, downstream code using `manifest.skills[skillName]` could behave unexpectedly.
- Suggested fix: Add runtime type guard validating shape before cast.

[src/workflow/index.ts:94-108] — getWorkflowManifest JSON parse without depth/size limit (MEDIUM)
- Problem: `JSON.parse(fileContent)` on the manifest file has no size limit and no recursion depth control. A crafted manifest with deeply nested objects could cause stack overflow during parsing.
- Impact: DoS via deeply nested JSON or large manifest file.
- Suggested fix: Check `fileContent.length` before parsing; consider capping at 1 MB.

### LOW

[src/profiles/loader.ts:155-163] — Profile YAML file loaded without size check (LOW)
- Problem: `fs.readFileSync(filePath, 'utf-8')` with no size limit before YAML parsing.
- Impact: Large profile YAML causes excessive memory use.
- Suggested fix: `fs.statSync(filePath).size` check before reading; cap at e.g. 512KB.

[src/mcp/operations.ts:134] — saveSettings non-atomic write (LOW)
- Problem: Direct `fs.writeFileSync` to settings.json without temp+rename.
- Impact: Corrupted settings.json on crash loses MCP server enable/disable state.
- Suggested fix: Temp file + rename pattern.

---

## AI-Generated Antipatterns Detected

- [x] Over-commenting obvious code — moderate; most comments are appropriate
- [ ] Over-abstraction (factories/wrappers used once) — not detected
- [ ] Features not requested — CANARY blocks suggest test scaffolding or injection detection code that leaked into production
- [x] Defensive checks for impossible cases — minor instances
- [ ] Reimplementing stdlib — not detected
- [ ] Copy-paste that should be extracted — multiple non-atomic write patterns repeated across 4+ files
- [ ] Unnecessary config options — not detected
- [ ] Over-engineered types — not detected

---

## Files Reviewed

| File | Lines | Issues |
|------|-------|--------|
| src/workflow/registry.ts | 104 | 1 CRITICAL, 1 HIGH |
| src/profiles/apply-config.ts | 199 | 1 CRITICAL, 1 HIGH |
| src/utils/hash.ts | 47 | 1 HIGH |
| src/canon/manifest.ts | 59 | 1 HIGH, 1 MEDIUM |
| src/workflow/index.ts | 334 | 1 HIGH, 2 MEDIUM, 1 LOW |
| src/mcp/operations.ts | 440 | 1 HIGH, 1 LOW |
| src/scanner/index.ts | 252 | 1 HIGH (x2 runs) |
| src/profiles/loader.ts | 248 | 1 HIGH, 2 MEDIUM, 1 LOW |
| src/cli/commands/init.ts | 231 | 1 MEDIUM |
| src/cli/commands/trace.ts | 29 | 1 MEDIUM |
| src/profiles/apply.ts | 283 | 1 MEDIUM (x2 runs) |
| src/mcp/registry.ts | 205 | 1 MEDIUM (x2 runs) |
| src/cli/commands/dedupe.ts | 223 | 1 LOW |
| src/types.ts | 233 | 0 |
| src/paths.ts | 175 | 0 |
| src/utils/fs.ts | 75 | 0 |
| src/utils/git.ts | 30 | 0 |
| src/utils/validation.ts | 97 | 0 |
| src/utils/tokens.ts | 27 | 0 |
| src/profiles/combiner.ts | 85 | 0 |
| src/profiles/persistence.ts | 56 | 0 |
| src/canon/operations.ts | 174 | 0 |
| src/canon/deployment.ts | 103 | 0 |
| src/canon/skill-loader.ts | 97 | 0 |
| src/workflow/install-helpers.ts | 190 | 0 |
| src/trace/index.ts | 113 | 0 |

---

GEMINI_RESULT: called - 18 total issues (2 CRITICAL, 7 HIGH, 7 MEDIUM, 4 LOW)
SCAN_ONLY: no fixes applied
