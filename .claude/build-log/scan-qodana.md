# Qodana Scan Results: src

## Summary

| Metric | Value |
|--------|-------|
| Files scanned | ~180 |
| Critical issues | 0 |
| High issues | 0 |
| Moderate issues | 34 |
| Low issues | 6 |
| Lint errors | 6 |
| Type errors | 4 |

## Qodana Findings

### Moderate Issues

src/cli/commands/workflow.ts:14 — Import can be shortened (ES6PreferShortImport)
src/ralph/runner.ts:14 — Import can be shortened (ES6PreferShortImport)
src/ralph/runner/phases.ts:11 — Import can be shortened (ES6PreferShortImport)
src/cli/index.ts:17 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/canon.ts:17 — Import can be shortened (ES6PreferShortImport)
src/profiles/apply.ts:33 — Import can be shortened (ES6PreferShortImport)
src/ralph/runner/phases.ts:9 — Import can be shortened (ES6PreferShortImport)
src/ralph/runner/phases.ts:7 — Import can be shortened (ES6PreferShortImport)
src/ralph/runner.ts:13 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/scan.ts:8 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/profile.ts:17 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/workflow.ts:13 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/canon.ts:16 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/mcp.ts:16 — Import can be shortened (ES6PreferShortImport)
src/ralph/runner/phases.ts:17 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/profile.ts:23 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/trace.ts:8 — Import can be shortened (ES6PreferShortImport)
src/ralph/skills/loader.ts:11 — Import can be shortened (ES6PreferShortImport)
src/ralph/phases/loader.ts:20 — Import can be shortened (ES6PreferShortImport)
src/cli/display/canon.ts:9 — Import can be shortened (ES6PreferShortImport)
src/profiles/apply.ts:24 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/profile.ts:16 — Import can be shortened (ES6PreferShortImport)
src/ralph/runner/context.ts:10 — Import can be shortened (ES6PreferShortImport)
src/ralph/runner/context.ts:14 — Import can be shortened (ES6PreferShortImport)
src/profiles/apply.ts:34 — Import can be shortened (ES6PreferShortImport)
src/trace/index.ts:13 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/scan.ts:16 — Import can be shortened (ES6PreferShortImport)
src/cli/commands/mcp.ts:15 — Import can be shortened (ES6PreferShortImport)
src/ralph/summary/collector.ts:14 — Unused import specifier TestSummary (ES6UnusedImports)
src/ui/index.html:650 — 'throw' of exception caught locally (ExceptionCaughtLocallyJS)
src/ui/index.html:635 — 'throw' of exception caught locally (ExceptionCaughtLocallyJS)
src/mcp/registry.ts:172 — Unused function getRegistryPath (JSUnusedLocalSymbols)
src/tools/index.ts:78 — Unused parameter options (JSUnusedLocalSymbols)
src/cli/commands/workflow.ts:35 — Unused function validatePath (JSUnusedLocalSymbols)

### Low Issues

mcp-servers/qodana/src/qodana-client.ts:589 — Missing await for an async function call (ES6MissingAwait)
src/ui/index.html:738 — Missing await for an async function call (ES6MissingAwait)
mcp-servers/gemini-reviewer/index.js:18 — Deprecated symbol used, consult docs for better alternative (JSDeprecatedSymbols)
mcp-servers/qodana/src/index.ts:260 — Deprecated symbol used, consult docs for better alternative (JSDeprecatedSymbols)
mcp-servers/qodana/src/index.ts:22 — Deprecated symbol used, consult docs for better alternative (JSDeprecatedSymbols)
mcp-servers/gemini-reviewer/index.js:3 — Deprecated symbol used, consult docs for better alternative (JSDeprecatedSymbols)

## TypeScript Compilation Errors

src/cli/commands/init.ts:230 — error TS1184: Modifiers cannot appear here
src/cli/commands/trace.ts:28 — error TS1184: Modifiers cannot appear here
src/workflow/registry.ts:102 — error TS1232: An import declaration can only be used at the top level of a namespace or module
src/workflow/registry.ts:103 — error TS2552: Cannot find name 'input'. Did you mean 'oninput'?

## ESLint Errors

src/cli/commands/init.ts:230 — 'config' is defined but never used (@typescript-eslint/no-unused-vars)
src/cli/commands/init.ts:230 — Unexpected any. Specify a different type (@typescript-eslint/no-explicit-any)
src/cli/commands/trace.ts:28 — Missing return type on function (@typescript-eslint/explicit-function-return-type)
src/cli/commands/trace.ts:28 — Unexpected any. Specify a different type (@typescript-eslint/no-explicit-any)
src/cli/display/profile.ts:64 — 'apiKey' is assigned a value but never used (@typescript-eslint/no-unused-vars)
src/workflow/registry.ts:1 — 'exec' is defined but never used (@typescript-eslint/no-unused-vars)

## ESLint Warnings (Selected High-Impact)

src/canon/deployment.ts:7 — Function 'deployAllSkills' has too many lines (33). Maximum allowed is 30
src/canon/deployment.ts:7 — Function 'deployAllSkills' has a complexity of 11. Maximum allowed is 10
src/canon/deployment.ts:46 — Function 'verifySkillsMatch' has too many lines (48). Maximum allowed is 30
src/canon/operations.ts:47 — Function 'copySkill' has too many lines (47). Maximum allowed is 30
src/canon/operations.ts:103 — Function 'upgradeSkills' has too many lines (35). Maximum allowed is 30
src/canon/operations.ts:103 — Function 'upgradeSkills' has a complexity of 11. Maximum allowed is 10
src/cli/commands/profile.ts:147 — Function 'handleClean' has a complexity of 15. Maximum allowed is 10
src/cli/display/deps.ts:9 — Function 'printDependencies' has a complexity of 12. Maximum allowed is 10
src/hooks/index.ts:238 — Function 'describeHook' has a complexity of 12. Maximum allowed is 10
src/mcp/operations.ts:438 — File has too many lines (302). Maximum allowed is 300
src/parser/claude-md.ts:33 — Function 'extractAutoInvokes' has too many lines (49). Maximum allowed is 30
src/profiles/apply.ts:150 — Async function 'applySkillsToProject' has a complexity of 11. Maximum allowed is 10
src/profiles/validation.ts:88 — Function 'validateProfileSchema' has a complexity of 13. Maximum allowed is 10
src/scanner/index.ts:240 — Blocks are nested too deeply (5). Maximum allowed is 4
src/trace/index.ts:48 — Function 'traceProfileSources' has a complexity of 12. Maximum allowed is 10
src/workflow/registry.ts:1 — (see errors above)

## Issues by Category

| Category | Count |
|----------|-------|
| Import Style | 28 |
| Unused Code | 4 |
| Code Complexity | 15 |
| Type Safety | 4 |
| Deprecated API | 4 |
| Exception Handling | 2 |
| Async/Await | 2 |

## Severity Distribution

| Severity | Qodana | ESLint | TypeScript | Total |
|----------|--------|--------|------------|-------|
| Critical | 0 | 0 | 0 | 0 |
| High | 0 | 0 | 0 | 0 |
| Moderate | 34 | 0 | 0 | 34 |
| Low | 6 | 25 | 4 | 35 |

---

QODANA_SCAN_ATTEMPTED: Scan ran out of memory at 36% completion, partial results retrieved
QODANA_RESULT: 40 issues (0 critical, 0 high, 34 moderate, 6 low)
LINT_RESULT: 6 errors, 25 warnings
TSC_RESULT: 4 errors
SCAN_ONLY: no fixes applied
