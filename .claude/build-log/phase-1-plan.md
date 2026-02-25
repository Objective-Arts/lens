# Plan: Improve src — Codex Production Readiness Scorecard 43/70

Addressing all violations from Codex scorecard across error handling, security, type safety, structure, testability, naming, and complexity.

## FILES:
- src/utils/validation.ts: Add `isRecord` type guard used by all JSON parsers
- src/hooks/index.ts: Fix readSettings — differentiate enoent from invalid JSON, add ClaudeSettings type guard
- src/mcp/operations.ts: Fix loadMcpJson — add type guard for parsed mcpServers; fix loadSettings — rename to differentiate from hooks/readSettings
- src/profiles/persistence.ts: Validate profile name before path.join; use atomic write (write-then-rename) for both sync and async
- src/cli/commands/profile.ts: Validate `profiles` input string in handleApply (each component name via isValidName)
- src/cli/commands/init.ts: Extract stack detection to src/cli/stack-detector.ts; pass projectPath explicitly instead of hard-coding process.cwd()
- src/cli/stack-detector.ts: New file — pure stack detection logic extracted from init.ts (detectStack, detectJsFramework, detectCSharp helpers)
- src/output/json-adapter.ts: Rename generic `record` variable in isValidProject/isValidRun to `candidate`; differentiate swallowed catch in ensureProject for unexpected errors
- src/workflow/registry.ts: Export `getDefaultRegistryPath` function (testability — replaces hard-coded homedir call at module level)
- src/workflow/index.ts: Export `getWorkflowEnvPath` that reads process.env, accepting optional env override param (testability)
- src/profiles/apply.ts: Rename `result` accumulator in applySkillsToProject/recordCopyResults params to `applyResult`

## FUNCTIONS:
- isRecord(value: unknown): value is Record<string, unknown> (5 lines) — shared type guard for all JSON.parse results; added to src/utils/validation.ts
- isClaudeSettings(value: unknown): value is ClaudeSettings (10 lines) — structural type guard; added to src/hooks/index.ts (or types.ts)
- isMcpServersMap(value: unknown): value is Record<string, MCPServerConfig> (8 lines) — validates parsed .mcp.json structure; added to src/mcp/operations.ts
- readSettings(): ClaudeSettings (updated, 15 lines) — distinguish enoent (return {}) from invalid JSON (throw CausedError); validate parsed value with isClaudeSettings
- loadMcpJson(projectPath?): Record<string, MCPServerConfig> (updated, 15 lines) — validate with isMcpServersMap before returning; non-enoent errors propagate
- saveProfile(profile: ComposableProfile): void (updated, 15 lines) — validate name via isValidName before path.join; atomic write via tmp+rename
- saveProfileAsync(profile: ComposableProfile): Promise<void> (updated, 15 lines) — same atomic write pattern async
- detectStack(projectPath: string): DetectedStack (moved, 20 lines) — extracted to src/cli/stack-detector.ts; pure function, no side effects
- getDefaultRegistryPath(): string (5 lines) — factory function in registry.ts replacing module-level `path.join(homedir(), ...)` constant; injectable for tests
- handleInit(options): Promise<void> (updated) — accept projectPath param without hard-coding process.cwd() at call sites; already correct in current code

## TYPES:
- No new types needed — existing types are sufficient. ClaudeSettings type guard validates existing interface shape.

## DEPENDENCIES:
- No new dependencies required. `isRecord` is < 5 lines; `zod` would add ~3 MB for 5 lines of validation logic — not justified.

## INVARIANTS:
- `readSettings()` in hooks: enoent → return `{}`; invalid JSON or non-object → throw CausedError; valid but structurally incorrect → return `{}` with console.warn
- `loadMcpJson()` in mcp: enoent → return `{}`; non-enoent I/O error → throw CausedError; JSON parses but fails type guard → throw CausedError
- `saveProfile()`: name must pass `isValidName()` before any path construction; write is atomic (tmp+rename)
- `isRecord(v)`: returns true only for non-null, non-array objects — the base check before any property access on unknown JSON
- Stack detection in `stack-detector.ts` is pure: no side effects, no I/O beyond what is passed to it; all file access is via injected `hasFile` callback pattern
- `getDefaultRegistryPath()` is a function, not a module-level constant, enabling test injection via module mock or param override

## SECURITY:
- Validate `profile.name` with `isValidName()` in `saveProfile` and `saveProfileAsync` before calling `path.join(USER_PROFILES_DIR, filename)` — prevents path traversal via crafted profile names (e.g., `../../.bashrc`)
- Validate each component in the `+`-separated profiles string in `handleApply` via `isValidName()` before resolving — prevents injection via `profiles` CLI arg
- `isRecord` + structural type guard on all `JSON.parse` results prevents silent type confusion attacks where an adversary crafts a JSON file whose structure deviates from expected (e.g., `mcpServers` is an array instead of object, causing `[name]` access to return undefined silently)
- Atomic writes (tmp+rename) in `saveProfile`/`saveProfileAsync` prevent partial-write corruption if process is killed mid-write

## QUALITY_CONTRACTS:
| Boundary | Abstract Type | Contract | Construction Check |
|----------|--------------|----------|--------------------|
| readSettings() return path from JSON.parse | ExternalData + ValidatedInput | Parsed value validated with isClaudeSettings before returning; non-enoent errors re-thrown with cause | EXPORT_FUNCTION: readSettings IN src/hooks/index.ts |
| loadMcpJson() return path from JSON.parse | ExternalData + ValidatedInput | Parsed value validated with isMcpServersMap before returning as Record<string, MCPServerConfig> | EXPORT_FUNCTION: loadMcpJson IN src/mcp/operations.ts (note: not exported, but tested via installServer) |
| saveProfile(profile.name) → path.join | ValidatedInput + SafePath | isValidName() must return true before path.join; function throws with message if invalid | EXPORT_FUNCTION: saveProfile IN src/profiles/persistence.ts |
| saveProfileAsync(profile.name) → path.join | ValidatedInput + SafePath | Same constraint as saveProfile | EXPORT_FUNCTION: saveProfileAsync IN src/profiles/persistence.ts |
| handleApply profiles string (CLI arg) | ValidatedInput | Each + component validated with isValidName before resolveProfile call | EXPORT_FUNCTION: registerProfileCommands IN src/cli/commands/profile.ts |
| saveProfile file write | IdempotentAction + AtomicWrite | Write to tmp file then rename; tmp cleaned on failure | EXPORT_FUNCTION: saveProfile IN src/profiles/persistence.ts |
| getDefaultRegistryPath() | ExternalData | Function not module-level constant — injectable by tests | EXPORT_FUNCTION: getDefaultRegistryPath IN src/workflow/registry.ts |

## UX:
- Default config path: no change — profiles at `~/.claude/profiles/<name>.yaml`
- Error messages for invalid profile name: `Invalid profile name: must contain only letters, numbers, hyphens, and underscores`
- Error messages for invalid profiles arg: `Invalid profile name component "{name}": must contain only letters, numbers, hyphens, and underscores`
- readSettings non-enoent errors: thrown with cause chain so callers see actionable messages; hooks that call readSettings already catch at call site
- All existing user-facing messages preserved

## TESTS:
- readSettings: (1) returns {} when file missing; (2) throws CausedError when file exists but contains invalid JSON; (3) returns {} with structural fallback when JSON is valid but not ClaudeSettings shape; (4) returns parsed settings when file is valid
- loadMcpJson: (1) returns {} when file missing; (2) throws when file exists but invalid JSON; (3) throws when parsed object fails isMcpServersMap type guard; (4) returns mcpServers subkey when present
- saveProfile: (1) throws on path-traversal name `../../etc/passwd`; (2) throws on name with `/`; (3) succeeds for valid name and writes atomically (tmp+rename, not direct)
- isRecord: (1) false for null; (2) false for array; (3) false for primitive; (4) true for plain object; (5) true for empty object
- detectStack (extracted): (1) returns typescript/nextjs for package.json with `next`; (2) returns python for requirements.txt project; (3) returns fallback for unknown; (4) projectPath injected — no process.cwd() inside function
- handleApply validation: (1) rejects profiles string containing invalid name component via error log

## PRODUCTION_CHECKLIST:
- Input Validation: All user-visible inputs (profile name in `create`, profile components in `apply`) validated with `isValidName()` at CLI boundary. JSON reads validated with isRecord + structural type guards.
- Injection Prevention: `saveProfile` and `saveProfileAsync` guard name before `path.join`. All paths constructed only after validation. No shell commands in affected modules.
- Secret Management: N/A — no secrets handled in these modules.
- Auth Lifecycle: N/A — no auth.
- Error Handling: `readSettings` in hooks: enoent → return `{}`; other errors → throw with cause. `loadMcpJson` in mcp: enoent → return `{}`; other I/O errors → throw with cause; type guard failure → throw with cause. `saveProfile` atomic write: tmp cleaned on failure, error re-thrown with cause. `ensureProject` catch: non-enoent/parse errors surfaced via console.warn, not silently swallowed.
- Bounded Operations: N/A — no new loops or network calls introduced.
- Atomic Writes: `saveProfile`/`saveProfileAsync` use write-then-rename pattern. `saveMcpJson` already atomic. `writeSettings` in hooks already atomic.
- Config Externalization: `getDefaultRegistryPath()` function replaces module-level constant that baked in `homedir()` at load time — now overridable for testing.
- Structured Logging: No PII introduced. Warnings to stderr (console.warn) for structural mismatches.
- Error UX: Actionable messages for invalid profile names. Stack traces not exposed to users.
- AI Code Smells: `isRecord` is 3 lines — not a wrapper for the sake of wrapping. `isMcpServersMap` does real validation work. No speculative abstractions. `stack-detector.ts` extraction is justified by separation of concerns (testability + single responsibility).
- Architecture: stack detection separated from CLI command handler. No god files created.
- Runtime Version: LTS — Node 22 (per @types/node ^22.0.0 in package.json).
- Sensible Defaults: No change to defaults.
- Interactive Fallbacks: No change to interactive flows.
- Orphaned Features: No new fields added.
- Secrets Handling: N/A — no secrets involved.
- Exit Codes: init command already uses process.exitCode = 1 on error. No change needed.
- Signal Handling: N/A — no new signal handlers.
- stdin/stdout: N/A — existing discipline maintained.
- Schema Versioning: .mcp.json and settings.json use flat format without version field — out of scope for this improvement (no migration required).
- Atomic Persistence: saveProfile write-then-rename added (WI-6/WI-7). Existing atomic writes in mcp/hooks not changed.
- Concurrency Control: Single-writer CLI tool — N/A.

## CONSTRUCTION_CHECKS:
- EXPORT_FUNCTION: isRecord IN src/utils/validation.ts
- EXPORT_FUNCTION: readSettings IN src/hooks/index.ts
- EXPORT_FUNCTION: saveProfile IN src/profiles/persistence.ts
- EXPORT_FUNCTION: saveProfileAsync IN src/profiles/persistence.ts
- EXPORT_FUNCTION: getDefaultRegistryPath IN src/workflow/registry.ts
- EXPORT_FUNCTION: detectStack IN src/cli/stack-detector.ts
- FILE: src/cli/stack-detector.ts

## WORK_ITEMS:

- [ ] WI-1: Add `isRecord` type guard to src/utils/validation.ts [S]
  Constraint: [ExternalData + ValidatedInput] Every JSON.parse boundary needs `unknown` typed result validated before use (Lessons 2026-02-24). isRecord is the base guard.
  BAD:  `const parsed = JSON.parse(raw) as ClaudeSettings`
  GOOD: `const parsed: unknown = JSON.parse(raw); if (!isRecord(parsed)) throw ...; return parsed as unknown as ClaudeSettings`

- [ ] WI-2: Fix readSettings in src/hooks/index.ts — add isClaudeSettings type guard and distinguish enoent from other errors [S]
  Constraint: [ExternalData + CausedError] Current catch-all `return {}` swallows invalid JSON silently (Codex hooks/index.ts:23). Non-enoent errors must propagate with cause chain.
  BAD:  `try { return JSON.parse(content) as ClaudeSettings; } catch { return {}; }`
  GOOD: `try { ... validate; return validated; } catch (cause) { if (isEnoent(cause)) return {}; throw new Error('Failed to load settings.json', { cause }); }`

- [ ] WI-3: Fix loadMcpJson in src/mcp/operations.ts — add isMcpServersMap type guard [S]
  Constraint: [ExternalData + ValidatedInput] Codex mcp/operations.ts:60 — `parsed.mcpServers || parsed` returns untyped object with no shape validation. Type guard must confirm values are MCPServerConfig-shaped.
  BAD:  `const parsed = JSON.parse(content); return parsed.mcpServers || parsed;`
  GOOD: `const parsed: unknown = JSON.parse(content); if (!isRecord(parsed)) throw ...; const servers = parsed.mcpServers ?? parsed; if (!isMcpServersMap(servers)) throw ...; return servers as unknown as Record<string, MCPServerConfig>;`

- [ ] WI-4: Fix loadSettings in src/mcp/operations.ts — add type validation on result [S]
  Constraint: [ExternalData + CausedError] Codex mcp/operations.ts:95 — `JSON.parse(content)` return is currently unvalidated. Parsed result must be validated as Record<string, unknown> before use.
  BAD:  `return JSON.parse(content);`
  GOOD: `const parsed: unknown = JSON.parse(content); if (!isRecord(parsed)) throw new Error('settings.json is not a JSON object', { cause: ... }); return parsed;`

- [ ] WI-5: Validate profile name in src/profiles/persistence.ts:saveProfile and saveProfileAsync [S]
  Constraint: [ValidatedInput + SafePath] Codex profiles/persistence.ts:19 — name is used in path.join without validation, allowing path traversal (Lessons 2026-02-05 src/cli Security phase).
  BAD:  `const filename = profile.name.toLowerCase() + '.yaml'; const filepath = path.join(USER_PROFILES_DIR, filename);`
  GOOD: `if (!isValidName(profile.name)) throw new Error('Invalid profile name: ' + getNameValidationError(profile.name, 'profile name')); const filepath = path.join(USER_PROFILES_DIR, ...)`

- [ ] WI-6: Make saveProfile in src/profiles/persistence.ts atomic (sync) [S]
  Constraint: [IdempotentAction + AtomicWrite] Codex profiles/persistence.ts:19 — non-atomic write. Write to tmp file then rename to prevent partial writes (base rubric: Atomic Writes).
  BAD:  `fs.writeFileSync(filepath, content, 'utf-8');`
  GOOD: `const tmp = filepath + '.tmp'; try { fs.writeFileSync(tmp, content); fs.renameSync(tmp, filepath); } catch (cause) { try { fs.unlinkSync(tmp); } catch {} throw new Error('Failed to save profile', { cause }); }`

- [ ] WI-7: Make saveProfileAsync in src/profiles/persistence.ts atomic (async) [S]
  Constraint: [IdempotentAction + AtomicWrite] Same pattern as WI-6 but async. Consistency between sync/async versions.
  BAD:  `await fsPromises.writeFile(filepath, content, 'utf-8');`
  GOOD: `const tmp = filepath + '.tmp'; try { await fsPromises.writeFile(tmp, content); await fsPromises.rename(tmp, filepath); } catch (cause) { await fsPromises.unlink(tmp).catch(() => {}); throw new Error('Failed to save profile', { cause }); }`

- [ ] WI-8: Validate profile component names in src/cli/commands/profile.ts:handleApply [S]
  Constraint: [ValidatedInput] Codex cli/commands/profile.ts:103 — user input `profiles` string split by `+` not individually validated. Each component passed to path operations via resolveProfile.
  BAD:  `const profileNames = parseProfileString(profiles);` (no validation before use)
  GOOD: `const profileNames = parseProfileString(profiles); for (const n of profileNames) { if (!isValidName(n)) { console.error(chalk.red('Invalid profile name: ' + n)); process.exitCode = 1; return; } }`

- [ ] WI-9: Extract stack detection from src/cli/commands/init.ts to src/cli/stack-detector.ts [M]
  Constraint: [Structure] Codex cli/commands/init.ts — stack detection mixed with CLI command handler. detectStack, detectJsFramework, detectCSharp, isPythonProject, isJavaProject, fileExistsAt belong in a separate module. init.ts imports and calls detectStack. Testability: stack-detector.ts has no dependency on commander or chalk.
  BAD:  Functions detectStack/detectJsFramework/detectCSharp defined inline in init.ts alongside Commander action handlers
  GOOD: `src/cli/stack-detector.ts` exports detectStack; init.ts imports and calls it; stack-detector.ts tested independently without Commander

- [ ] WI-10: Add `getDefaultRegistryPath` function to src/workflow/registry.ts replacing module-level homedir constant [S]
  Constraint: [Testability] Codex workflow/registry.ts:24 — `DEFAULT_REGISTRY_PATH = path.join(homedir(), ...)` is evaluated at module load time, making it impossible to override in tests without filesystem fixtures. A factory function can be intercepted.
  BAD:  `const DEFAULT_REGISTRY_PATH = path.join(homedir(), '.claude', 'lens-registry.json');`
  GOOD: `export function getDefaultRegistryPath(): string { return path.join(homedir(), '.claude', 'lens-registry.json'); }` and update `getRegistryPath` to call it.

- [ ] WI-11: Rename `record` in isValidProject/isValidRun to `candidate` in src/output/json-adapter.ts [S]
  Constraint: [CODE_QUALITY] Codex output/json-adapter.ts:85 — `record` is generic and reveals nothing about what the variable represents. `candidate` conveys "we are checking whether this qualifies" (Lessons 2026-02-24 abbreviated params). Also rename `result` accumulator param in applySkillsToProject and recordCopyResults in profiles/apply.ts to `applyResult`.
  BAD:  `const record = value as Record<string, unknown>; return record.version === SCHEMA_VERSION ...`
  GOOD: `const candidate = value as Record<string, unknown>; return candidate.version === SCHEMA_VERSION ...`

- [ ] WI-12: Rename `result` to `applyResult` in applySkillsToProject, recordCopyResults, and applyCommandsToProject params in src/profiles/apply.ts [S]
  Constraint: [CODE_QUALITY] Codex profiles/apply.ts:260 — accumulator parameter named `result` is too generic; `applyResult` makes the mutation-by-accumulation pattern readable at a glance. This also matches the lesson: abbreviated param names hide intent.
  BAD:  `function recordCopyResults(copyResults, manifest, skillsDir, canonPath, sourceCommit, result: ApplyResult)`
  GOOD: `function recordCopyResults(copyResults, manifest, skillsDir, canonPath, sourceCommit, applyResult: ApplyResult)`

- [ ] WI-13: Add tests for readSettings (enoent vs invalid JSON), saveProfile (path traversal rejection + atomic write), and isRecord in src/hooks/hooks.test.ts, src/profiles/persistence.test.ts, src/utils/validation.test.ts [M]
  Constraint: [Correctness + ValidatedInput] New security boundary functions must have test coverage for both happy and rejection paths (Dijkstra: prove correctness).
  BAD:  Untested boundary functions that handle user input from disk
  GOOD: vitest tests with tmpdir fixtures that verify rejection of `../../etc/passwd`, verify tmp file cleanup on failure, verify enoent returns {}, verify invalid JSON throws

- [ ] WI-14: Add `isWorkflowEnvPath` / injectable env reader in src/workflow/index.ts for testability of process.env access [S]
  Constraint: [Testability] Codex workflow/index.ts:32 — `process.env.CC_WORKFLOW_SKILLS_PATH` read directly in `getWorkflowSourcePath` makes unit tests that want to set this value require process.env mutation. Extract to a function `resolveWorkflowSkillsPath(env?: NodeJS.ProcessEnv): string` that accepts an optional env map — tests pass a plain object, production passes nothing.
  BAD:  `const envPath = process.env.CC_WORKFLOW_SKILLS_PATH; ...`
  GOOD: `function resolveWorkflowSkillsPath(env: NodeJS.ProcessEnv = process.env): string { const envPath = env.CC_WORKFLOW_SKILLS_PATH; ... }`

## EXPERTS_LOADED:
- canon/clarity/SUMMARY.md
- canon/pragmatism/SUMMARY.md
- canon/simplicity/SUMMARY.md
- canon/composition/SUMMARY.md
- canon/distributed/SUMMARY.md
- canon/data-first/SUMMARY.md
- canon/correctness/SUMMARY.md
- canon/algorithms/SUMMARY.md
- canon/abstraction/SUMMARY.md
- canon/optimization/SUMMARY.md
- canon/javascript/typescript/SUMMARY.md
- canon/javascript/js-safety/SUMMARY.md
- canon/javascript/js-perf/SUMMARY.md
- canon/javascript/js-internals/SUMMARY.md
- canon/javascript/functional/SUMMARY.md

## EXPERT_DECISIONS:
- typescript: Use discriminated union / type guard pattern for all JSON.parse boundaries (WI-1, WI-2, WI-3, WI-4). `isRecord` idiom from TypeScript canon.
- js-safety: Explicit `=== ` comparisons only; catch parameter always named; no implicit type widening via unsafe cast. Drove explicit isRecord rather than duck-typing in JSON handlers.
- correctness: Every new function must be provably correct (type guard + test). Drove WI-13 test requirement.
- composition: Stack detection as separate pure module (WI-9). CLI command handler becomes an orchestrator, not a monolith.
- clarity: Rename `record` → `candidate` (WI-11), rename `result` → `applyResult` (WI-12). Names should announce purpose.
- pragmatism: No new library dependency for `isRecord` — 3 lines of inline code outperforms `zod` for this use case.
- data-first: The `isRecord` guard is the foundational data structure check that enables all subsequent typed access. Structure first, code follows.

## RUBRICS_LOADED: base, product-quality, cli, data-persistence, security, typescript

## EVAL_PROPOSALS_SURFACED: none

PLAN_COMPLETE
