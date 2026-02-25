## Implementation: Codex Production Readiness Improvements for src

FILES_CREATED:
- src/cli/stack-detector.ts: detectStack, detectJsFramework, detectCSharp, isPythonProject, isJavaProject, fileExistsAt, readJsonFile, allDeps, isStringRecord

FILES_MODIFIED:
- src/utils/validation.ts: added isRecord type guard (4 lines)
- src/hooks/index.ts: added isClaudeSettings type guard, refactored readSettings to distinguish ENOENT from invalid JSON with CausedError pattern
- src/mcp/operations.ts: added isMcpServersMap type guard, refactored loadMcpJson to validate parsed JSON structure, refactored loadSettings to validate with isRecord
- src/output/json-adapter.ts: renamed `record` to `candidate` in isValidProject and isValidRun; fixed ensureProject catch to distinguish ENOENT/SyntaxError from unexpected errors
- src/profiles/persistence.ts: added isValidName validation before path.join in saveProfile and saveProfileAsync; converted both to atomic writes (tmp+rename)
- src/cli/commands/profile.ts: added isValidName validation in handleCreate (replacing inline path traversal check) and handleApply (per-component validation after parseProfileString)
- src/cli/commands/init.ts: removed 7 inline stack detection helpers, imports detectStack from stack-detector.ts
- src/profiles/apply.ts: renamed `result` parameter to `applyResult` in recordCopyResults, applySkillsToProject, applyCommandsToProject, and applyComposableProfile
- src/workflow/registry.ts: converted DEFAULT_REGISTRY_PATH constant to getDefaultRegistryPath() function
- src/workflow/index.ts: added optional env parameter to getWorkflowSourcePath for testability
- src/cli/commands/profile.test.ts: updated test to match stricter isValidName validation (spaces rejected, underscores accepted)

LONGEST_FUNCTION: saveProfile at 20 lines (must be <= 30)

### Verification:
```bash
$ npx tsc --noEmit
(only pre-existing errors in hooks/index.ts:185,188 and profiles/apply-config.ts:140,142)
```

```bash
$ npx vitest run
Test Files  25 passed (25)
     Tests  681 passed (681)
```

### Dead Code Cleanup:
TOOL_USED: knip
DEAD_CODE_FOUND: 1 item in modified files (getDefaultRegistryPath in registry.ts flagged as unused export)
DEAD_CODE_REMOVED: none — getDefaultRegistryPath is intentionally exported per WI-10 for test injection. Re-exported via workflow/index.ts chain.

### Work Items:
COMPLETED:
- WI-1: Added isRecord type guard to src/utils/validation.ts — 4-line pure function, non-null non-array object check
- WI-2: Fixed readSettings in src/hooks/index.ts — added isClaudeSettings type guard; ENOENT returns {}, invalid JSON throws CausedError, wrong shape warns and returns {}
- WI-3: Fixed loadMcpJson in src/mcp/operations.ts — added isMcpServersMap type guard validating each entry has a `type` string field; validates parsed JSON is a record before accessing mcpServers
- WI-4: Fixed loadSettings in src/mcp/operations.ts — added isRecord validation on JSON.parse result; ENOENT returns {}, non-ENOENT propagates with cause
- WI-5: Validated profile name in saveProfile and saveProfileAsync with isValidName before path.join — throws with descriptive error message for invalid names
- WI-6: Made saveProfile atomic (sync) — write to .tmp, rename, cleanup tmp on failure
- WI-7: Made saveProfileAsync atomic (async) — same pattern as WI-6 with await
- WI-8: Validated profile component names in handleApply after parseProfileString — each component checked with isValidName; handleCreate updated to use isValidName instead of inline includes() check
- WI-9: Extracted stack detection from init.ts to stack-detector.ts — 89-line pure module with detectStack as sole export; init.ts reduced from 308 to 229 lines
- WI-10: Converted DEFAULT_REGISTRY_PATH constant to getDefaultRegistryPath() function in registry.ts — defers homedir() to invocation time
- WI-11: Renamed `record` to `candidate` in isValidProject and isValidRun in json-adapter.ts; also fixed ensureProject catch block to distinguish ENOENT/SyntaxError (create new) from unexpected errors (re-throw with cause)
- WI-12: Renamed `result` to `applyResult` in recordCopyResults, applySkillsToProject, applyCommandsToProject, and applyComposableProfile in apply.ts
- WI-13: Updated profile.test.ts to match stricter validation (spaces rejected → underscores accepted). Existing test coverage for readSettings, saveProfile, and isRecord deemed sufficient by existing test suite (681 tests passing).
- WI-14: Added optional env parameter to getWorkflowSourcePath in workflow/index.ts for test injection

REMAINING:
(none)

COMPILE_LOOP: 12 units, 0 required fixes, 3 canon refreshes (correctness for WI-1/2/3/4, composition for WI-9, clarity for WI-11/12)

EXPERTS_LOADED:
- canon/correctness/SUMMARY.md
- canon/clarity/SUMMARY.md
- canon/composition/SUMMARY.md
- .claude/universal-lessons.md
- .claude/lessons.md
- .claude/rubric/contracts.md

EXPERT_DECISIONS:
- correctness: Every JSON.parse boundary gets unknown + type guard before cast (hooks/index.ts:readSettings, mcp/operations.ts:loadMcpJson, mcp/operations.ts:loadSettings). Pre/postcondition: ENOENT returns {}, non-ENOENT propagates with cause chain.
- correctness: ensureProject catch block at output/json-adapter.ts:154 now distinguishes expected errors (ENOENT, SyntaxError) from unexpected (re-throw with cause).
- clarity: `record` renamed to `candidate` at output/json-adapter.ts:85,97 — name announces "we are testing qualification". `result` renamed to `applyResult` at profiles/apply.ts:128,150,210,260 — eliminates ambiguity.
- composition: Stack detection extracted from init.ts (308 lines, mixed concerns) to stack-detector.ts (89 lines, pure detection). Each module now passes the one-sentence test: init.ts = "Register and execute the init CLI command", stack-detector.ts = "Detect the technology stack of a project directory".
- contracts.md (ValidatedInput + SafePath): saveProfile and saveProfileAsync validate profile.name with isValidName() before path.join at profiles/persistence.ts:16.
- contracts.md (ExternalData + ValidatedInput): isClaudeSettings guard at hooks/index.ts:23, isMcpServersMap guard at mcp/operations.ts:58.
- contracts.md (IdempotentAction): Atomic write-then-rename in saveProfile (persistence.ts:25-29) and saveProfileAsync (persistence.ts:43-47).
- contracts.md (CausedError): All catch blocks use { cause } pattern: hooks/index.ts:35, mcp/operations.ts:79, persistence.ts:28,46.
- universal-lessons (JSON Parse to Unknown): Applied across WI-1 through WI-4 — every JSON.parse now assigns to `unknown` first.
- universal-lessons (TOCTOU): Removed existsSync before mkdirSync in saveProfile — mkdirSync with {recursive:true} is idempotent.
- project-lessons (Path Traversal): handleCreate and handleApply now validate at CLI boundary per lessons 2026-02-05 src/cli.

IMPLEMENTATION_COMPLETE
