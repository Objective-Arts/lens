## Structure: src

MODE: map

---

## CURRENT_STATE

```
src/
├── cli/
│   ├── commands/
│   │   ├── init.ts         ← stack detection logic MIXED with CLI command handler
│   │   │                     detectStack(), detectJsFramework(), detectCSharp(),
│   │   │                     isPythonProject(), isJavaProject(), fileExistsAt(),
│   │   │                     readJsonFile() all live alongside Commander action handlers
│   │   └── profile.ts      ← handleApply accepts `profiles` CLI string without per-component isValidName() validation
│   │                         handleCreate does inline path-traversal check but not isValidName()
├── hooks/
│   └── index.ts            ← readSettings(): JSON.parse result cast directly as ClaudeSettings
│                             (JSON.parse(content) as ClaudeSettings) — no structural type guard;
│                             catch-all returns {} silently for BOTH enoent AND invalid JSON
├── mcp/
│   └── operations.ts       ← loadMcpJson(): parsed.mcpServers || parsed returns unvalidated object;
│                             no isMcpServersMap type guard; also loadSettings() uses JSON.parse
│                             without isRecord validation
├── output/
│   └── json-adapter.ts     ← isValidProject() and isValidRun() use local variable named `record`
│                             (naming: misleading — represents a "candidate" being validated)
│                             buildRun is already pure; ensureProject mixed IO + logic is OK
├── profiles/
│   ├── apply.ts            ← applySkillsToProject/recordCopyResults: accumulator param `result`
│   │                         is too generic; should be `applyResult`
│   └── persistence.ts      ← saveProfile/saveProfileAsync: profile.name used in path.join
│                             WITHOUT isValidName() validation → path traversal risk;
│                             writes are non-atomic (direct writeFileSync)
├── utils/
│   └── validation.ts       ← isRecord() helper MISSING — needed by all JSON.parse boundaries
├── workflow/
│   ├── index.ts            ← getWorkflowSourcePath() reads process.env directly (not injectable)
│   └── registry.ts         ← DEFAULT_REGISTRY_PATH is a module-level constant (evaluated at load time)
│                             — not injectable for tests
```

**Dependency diagram (current):**

```
                   ┌─────────────────────────────┐
                   │  cli/commands/init.ts        │
                   │                              │
                   │  handleInit()                │
                   │  + detectStack()             │  ← mixed concerns
                   │  + detectJsFramework()       │
                   │  + detectCSharp()            │
                   │  + isPythonProject()         │
                   │  + isJavaProject()           │
                   │  + fileExistsAt()            │
                   │  + readJsonFile()            │
                   └─────────────┬───────────────┘
                                 │ process.cwd() hard-coded at call site

          ┌──────────────────────────────────────┐
          │  hooks/index.ts: readSettings()      │
          │  JSON.parse(content) as ClaudeSettings│  ← no type guard
          │  catch { return {} }                 │  ← swallows invalid JSON
          └──────────────────────────────────────┘

          ┌──────────────────────────────────────┐
          │  mcp/operations.ts: loadMcpJson()    │
          │  parsed.mcpServers || parsed         │  ← unvalidated
          └──────────────────────────────────────┘

          ┌──────────────────────────────────────┐
          │  profiles/persistence.ts             │
          │  saveProfile(profile)                │
          │    path.join(USER_PROFILES_DIR,      │
          │      profile.name.toLowerCase()...)  │  ← no isValidName() guard
          │    writeFileSync(filepath, content)  │  ← non-atomic write
          └──────────────────────────────────────┘

          ┌──────────────────────────────────────┐
          │  workflow/registry.ts                │
          │  const DEFAULT_REGISTRY_PATH =       │
          │    path.join(homedir(), ...)         │  ← module-level, evaluated at load time
          └──────────────────────────────────────┘
```

---

## PURITY_CHECK

| Module | Pure/Impure | Notes |
|--------|-------------|-------|
| `cli/commands/init.ts` — `detectStack` | Impure (reads filesystem via `fileExistsAt`) | Business logic (stack detection) is entangled with I/O. CAN be extracted: pass `hasFile` and `readJson` callbacks to make it pure. |
| `cli/commands/init.ts` — `handleInit` | Impure — correct | CLI orchestrator; I/O expected here. |
| `hooks/index.ts` — `readSettings` | Impure — correct | Reads file; but catch-all is wrong. |
| `mcp/operations.ts` — `loadMcpJson` | Impure — correct | File read; but parse is unvalidated. |
| `profiles/persistence.ts` — `saveProfile` | Impure — correct | File write; but missing name validation and atomic write. |
| `output/json-adapter.ts` — `buildRun` | Pure ✓ | Already extracted. The `record`→`candidate` rename is cosmetic. |
| `workflow/registry.ts` — module init | Impure ✗ | `DEFAULT_REGISTRY_PATH` evaluated at module load via `homedir()` — untestable. |
| `workflow/index.ts` — `getWorkflowSourcePath` | Impure ✗ | Reads `process.env` directly — untestable without env mutation. |

---

## ISSUES_FOUND

1. **stack detection mixed with CLI handler** (`init.ts`): `detectStack`, `detectJsFramework`, `detectCSharp`, `isPythonProject`, `isJavaProject`, `fileExistsAt`, `readJsonFile` are all defined inline in the same file as Commander action handlers. `init.ts` does two things (one-sentence test fails). Testability: to test stack detection, a test must import the entire init command including Commander setup.

2. **No `isRecord` type guard** (`utils/validation.ts`): Every JSON.parse boundary in the codebase performs direct casts (`as ClaudeSettings`, `as Record<string, unknown>` without guarding). The universal lessons mandate: "Always assign to `unknown`, validate structure, then cast." `isRecord` is the base primitive needed by WI-1 through WI-4.

3. **`readSettings` swallows all errors** (`hooks/index.ts`): `catch { return {} }` handles both `ENOENT` (valid: missing file) and invalid JSON (invalid: should surface as error). Callers cannot distinguish "no settings file" from "corrupt settings file."

4. **`loadMcpJson` unvalidated parse** (`mcp/operations.ts`): `parsed.mcpServers || parsed` — `parsed` is typed `any` from `JSON.parse`. No `isRecord` check, no `isMcpServersMap` shape check. A malformed .mcp.json (e.g., `{ "mcpServers": "string" }`) passes through silently.

5. **`loadSettings` unvalidated parse** (`mcp/operations.ts`): `return JSON.parse(content)` without isRecord guard. Same pattern as loadMcpJson.

6. **Path traversal in `saveProfile`** (`profiles/persistence.ts`): `profile.name` used in `path.join(USER_PROFILES_DIR, filename)` without `isValidName()` check. A name like `../../.bashrc` (without `.yaml` extension it's less severe, but `../../foo` still escapes `USER_PROFILES_DIR`).

7. **Non-atomic writes in `saveProfile`/`saveProfileAsync`** (`profiles/persistence.ts`): `writeFileSync`/`writeFile` directly — if the process is killed mid-write, the YAML file is corrupt. `saveMcpJson` and `writeSettings` in hooks already use atomic write-then-rename. `saveProfile` is inconsistent.

8. **No per-component `isValidName` validation in `handleApply`** (`cli/commands/profile.ts`): `parseProfileString(profiles)` splits `+`-separated input but each component is not validated with `isValidName()` before `resolveProfile` → `getProfile` → `path` operations.

9. **`DEFAULT_REGISTRY_PATH` is a module-level constant** (`workflow/registry.ts`): `path.join(homedir(), '.claude', 'lens-registry.json')` is evaluated at module load time. Tests that want a different registry path must use filesystem fixtures or process-level hacks rather than a simple parameter override.

10. **`getWorkflowSourcePath` reads `process.env` directly** (`workflow/index.ts`): Not injectable. Tests must mutate `process.env` and risk contaminating other tests. A function that accepts `env?: NodeJS.ProcessEnv` makes it injectable.

11. **`record` naming in `isValidProject`/`isValidRun`** (`output/json-adapter.ts`): The variable `record` is semantically "a candidate being validated for conformance." Rename to `candidate` per WI-11 and lessons.

12. **`result` param name in `recordCopyResults`/`applySkillsToProject`** (`profiles/apply.ts`): Generic `result: ApplyResult` accumulator should be `applyResult: ApplyResult` per WI-12 and lessons.

---

## TARGET_STATE

```
src/
├── cli/
│   ├── commands/
│   │   ├── init.ts         ← thin CLI handler: calls detectStack(projectPath), nothing else
│   │   │                     removes inline detection helpers; imports from stack-detector.ts
│   │   └── profile.ts      ← handleApply validates each profileNames[i] with isValidName()
│   │                         handleCreate calls isValidName() (not inline path-traversal check)
│   └── stack-detector.ts   ← NEW: pure module (no Commander, no chalk dependency)
│                             exports: detectStack(projectPath: string): DetectedStack
│                             all helpers live here: detectJsFramework, detectCSharp,
│                             isPythonProject, isJavaProject, fileExistsAt, readJsonFile
│                             PURE CORE: detectJsFramework / isPythonProject / isJavaProject
│                             accept data (deps Record, hasFile fn) rather than reading filesystem
├── hooks/
│   └── index.ts            ← readSettings(): assign JSON.parse to unknown; validate with
│                             isClaudeSettings guard; distinguish ENOENT (return {}) from
│                             invalid JSON (throw CausedError); valid but wrong shape → return {}
│                             with console.warn
├── mcp/
│   └── operations.ts       ← loadMcpJson(): use isRecord + isMcpServersMap before returning;
│                             loadSettings(): use isRecord before returning
├── output/
│   └── json-adapter.ts     ← rename `record` → `candidate` in isValidProject + isValidRun
├── profiles/
│   ├── apply.ts            ← rename `result` → `applyResult` in recordCopyResults,
│   │                         applySkillsToProject, applyCommandsToProject params
│   └── persistence.ts      ← add isValidName() check before path.join in saveProfile
│                             and saveProfileAsync; make both atomic (tmp+rename)
├── utils/
│   └── validation.ts       ← ADD isRecord(value: unknown): value is Record<string, unknown>
│                             (3-line pure function; no new dependency)
└── workflow/
    ├── index.ts            ← refactor getWorkflowSourcePath() to accept env?: NodeJS.ProcessEnv
    │                         parameter defaulting to process.env
    └── registry.ts         ← convert DEFAULT_REGISTRY_PATH constant to
                              getDefaultRegistryPath(): string function; update getRegistryPath
```

**Dependency diagram (target):**

```
                   ┌─────────────────────────────┐
                   │  cli/commands/init.ts        │
                   │  handleInit()                │
                   │  ← pure CLI orchestrator     │
                   └─────────────┬───────────────┘
                                 │ imports
                   ┌─────────────▼───────────────┐
                   │  cli/stack-detector.ts       │
                   │  detectStack(projectPath)    │
                   │  detectJsFramework(deps)     │  ← pure (takes data)
                   │  isPythonProject(hasFile)    │  ← pure (takes fn)
                   │  isJavaProject(hasFile)      │  ← pure (takes fn)
                   │  detectCSharp(projectPath)   │
                   └─────────────────────────────┘

                   ┌──────────────────────────────┐
                   │  utils/validation.ts         │
                   │  + isRecord(v): v is Record  │  ← NEW (3 lines)
                   │  isValidName(name)           │
                   │  ...existing exports         │
                   └──────────┬───────────────────┘
                              │ used by all JSON parse boundaries
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    hooks/index.ts  mcp/operations.ts  profiles/persistence.ts
    readSettings()  loadMcpJson()      saveProfile()
    isClaudeSettings isMcpServersMap   isValidName() guard
    guard           guard              + atomic write

                   ┌──────────────────────────────┐
                   │  workflow/registry.ts         │
                   │  getDefaultRegistryPath():    │  ← function (was constant)
                   │    string                     │
                   │  getRegistryPath(override?)   │
                   └──────────────────────────────┘

                   ┌──────────────────────────────┐
                   │  workflow/index.ts            │
                   │  getWorkflowSourcePath(       │  ← injectable env param
                   │    env = process.env)         │
                   └──────────────────────────────┘
```

---

## CHANGES_NEEDED

1. **NEW FILE: `src/cli/stack-detector.ts`** — extract `detectStack`, `detectJsFramework`, `detectCSharp`, `isPythonProject`, `isJavaProject`, `fileExistsAt`, `readJsonFile` from `init.ts`; export `detectStack`; `DetectedStack` type import comes from `init-display.ts` (already exported there)

2. **MODIFY: `src/cli/commands/init.ts`** — remove the 7 inline helpers; import `detectStack` from `../stack-detector.js`

3. **MODIFY: `src/utils/validation.ts`** — add `export function isRecord(value: unknown): value is Record<string, unknown>` (3 lines)

4. **MODIFY: `src/hooks/index.ts`** — add `isClaudeSettings` type guard; refactor `readSettings` to: assign parse result to `unknown`, validate, distinguish ENOENT from JSON errors

5. **MODIFY: `src/mcp/operations.ts`** — add `isMcpServersMap` type guard; refactor `loadMcpJson` to use `isRecord` + `isMcpServersMap`; refactor `loadSettings` to use `isRecord`

6. **MODIFY: `src/profiles/persistence.ts`** — add `isValidName` import; add validation before `path.join` in both `saveProfile` and `saveProfileAsync`; make both writes atomic (tmp+rename)

7. **MODIFY: `src/cli/commands/profile.ts`** — in `handleApply`, add per-component `isValidName` check after `parseProfileString`; in `handleCreate`, replace inline `includes('/')` check with `isValidName()`

8. **MODIFY: `src/output/json-adapter.ts`** — rename `record` → `candidate` in `isValidProject` and `isValidRun`

9. **MODIFY: `src/profiles/apply.ts`** — rename `result` parameter → `applyResult` in `recordCopyResults`, `applySkillsToProject`, `applyCommandsToProject`

10. **MODIFY: `src/workflow/registry.ts`** — convert `DEFAULT_REGISTRY_PATH` constant to `export function getDefaultRegistryPath(): string`; update `getRegistryPath` to call it

11. **MODIFY: `src/workflow/index.ts`** — refactor `getWorkflowSourcePath` to accept `env?: NodeJS.ProcessEnv = process.env`

---

## QUALITY_CONTRACTS

| Boundary | Abstract Type | Contract | Construction Check |
|----------|--------------|----------|--------------------|
| `readSettings()` return — JSON.parse path | ExternalData + ValidatedInput | Parsed unknown value validated with isClaudeSettings before returning; ENOENT → return {}; non-enoent I/O errors → throw CausedError; valid JSON but wrong shape → return {} with console.warn | EXPORT_FUNCTION: readSettings IN src/hooks/index.ts |
| `loadMcpJson()` return — JSON.parse path | ExternalData + ValidatedInput | Parsed value: isRecord check, then isMcpServersMap check on mcpServers subkey; ENOENT → return {}; other errors → CausedError; shape failure → CausedError | EXPORT_FUNCTION: loadMcpJson IN src/mcp/operations.ts (tested via installServer) |
| `loadSettings()` in mcp — JSON.parse path | ExternalData + ValidatedInput | isRecord guard before returning Record<string, unknown>; ENOENT → return {} | INTERNAL FUNCTION loadSettings IN src/mcp/operations.ts |
| `saveProfile(profile.name)` → path.join | ValidatedInput + SafePath | isValidName() must return true before path.join; throws with message if invalid | EXPORT_FUNCTION: saveProfile IN src/profiles/persistence.ts |
| `saveProfileAsync(profile.name)` → path.join | ValidatedInput + SafePath | Same constraint as saveProfile (async variant) | EXPORT_FUNCTION: saveProfileAsync IN src/profiles/persistence.ts |
| `saveProfile` / `saveProfileAsync` file write | IdempotentAction | Write to tmp file then rename atomically; tmp cleaned on failure | EXPORT_FUNCTION: saveProfile IN src/profiles/persistence.ts |
| `handleApply` profiles CLI arg | ValidatedInput | Each + component validated with isValidName() before resolveProfile; process.exitCode = 1 on invalid | EXPORT_FUNCTION: registerProfileCommands IN src/cli/commands/profile.ts |
| `handleCreate` name CLI arg | ValidatedInput | isValidName() replaces inline includes() checks for consistency and completeness | EXPORT_FUNCTION: registerProfileCommands IN src/cli/commands/profile.ts |
| `getDefaultRegistryPath()` | ExternalData | Function replaces module-level constant — homedir() call deferred to invocation time, injectable by tests | EXPORT_FUNCTION: getDefaultRegistryPath IN src/workflow/registry.ts |
| `getWorkflowSourcePath(env?)` | ExternalData | Accepts optional env map; production passes nothing (defaults to process.env); tests pass plain object | INTERNAL FUNCTION getWorkflowSourcePath IN src/workflow/index.ts |
| `isRecord(value)` | ValidatedInput | Base type guard: non-null, non-array object; used at every JSON.parse boundary | EXPORT_FUNCTION: isRecord IN src/utils/validation.ts |

---

## CANON PRINCIPLE APPLICATIONS

### composition (McIlroy)
- `init.ts` currently fails the one-thing test: it handles CLI registration AND stack detection. Extracting to `stack-detector.ts` makes each module describe its purpose in one sentence:
  - `init.ts`: "Register and execute the init CLI command"
  - `stack-detector.ts`: "Detect the technology stack of a project directory"

### data-first (Torvalds)
- Pure core extraction: `detectJsFramework` takes `packageJson: Record<string, unknown>` and a `hasDep` closure — it does not need to read the filesystem itself. Kept pure in `stack-detector.ts`.
- `isRecord` is the data-first guard: structure is determined before any field access.

### correctness (Dijkstra)
- Every public boundary function gets a stated precondition (validateInput) and postcondition (return shape guaranteed by type guard). The `isRecord` + structural guard pattern makes this provable.
- Error paths for `readSettings` and `loadMcpJson` were untested because the catch-all swallowed them. WI-13 adds tests for each error path.

### clarity (Kernighan)
- `record` → `candidate`: the name `candidate` announces "we are testing whether this value qualifies" — no comment needed.
- `result` → `applyResult`: eliminates ambiguity about which "result" the accumulator represents.
- `DEFAULT_REGISTRY_PATH` as a function: the name `getDefaultRegistryPath()` announces it defers evaluation.

### pragmatism (Thompson)
- `isRecord` is 3 lines. No new dependency (`zod` etc.) justified — the function is simpler than any import.
- `getWorkflowSourcePath(env?)` adds one optional parameter. No class refactoring, no injection framework.

### typescript (type safety)
- `unknown` + type guard before cast is the canonical TypeScript pattern for external data. Each guard is explicit, not implicit widening.

### js-safety
- `catch (cause)` naming aligns with `Error.cause` convention throughout.
- No loose equality in any new code.

---

## FORBIDDEN CHECKS

- No `any` or `unknown` escape: all new type guards use proper narrowing
- No TODO comments in structure output
- Diagram present: yes
- STRUCTURE_COMPLETE marker: yes

---

## EXPERTS_LOADED
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

## EXPERT_DECISIONS
- composition: Drove extraction of stack-detector.ts — one module, one purpose, McIlroy's "do one thing" test.
- data-first: detectJsFramework and isPythonProject designed to take data (deps, hasFile) not to read filesystem — pure core principle.
- correctness: Every JSON.parse boundary gets a type guard with stated pre/postcondition. Error paths must be distinguishable and testable.
- clarity: `record` → `candidate`, `result` → `applyResult` — names should announce their role without needing a comment.
- pragmatism: isRecord is 3 lines of inline code; no library dependency added. getWorkflowSourcePath gets one optional param, not a class or DI container.
- typescript: `unknown` + type guard + double-assertion pattern for all JSON.parse boundaries. No `any` escape.
- js-safety: `catch (cause)` naming convention for all new error-wrapping catch blocks.
- optimization: `DEFAULT_REGISTRY_PATH` as function defers homedir() to invocation time — side-effect at call site not module load.

STRUCTURE_COMPLETE
