## Gemini Scan: src/cli

_Scanned 2026-02-05 via Gemini MCP (gemini-reviewer)_

### Summary

| Metric | Value |
|--------|-------|
| Files scanned | 19 |
| Total lines | 2,776 |
| Critical issues | 4 |
| High issues | 9 |
| Medium issues | 11 |
| Low issues | 8 |

### Critical Issues :red_circle:

Must fix before shipping:

1. **dedupe.ts:47-75** — Command injection via `spawnSync('grep', ...)`
   - Problem: `searchPath` is derived from user input (`targetPath`) and passed directly to `spawnSync('grep', ...)`. Shell metacharacters in the path could execute arbitrary commands.
   - Impact: Arbitrary code execution if a malicious path is provided.
   - Suggested fix: Replace `spawnSync('grep')` with in-process file reading + regex matching using `glob` and `fs.readFileSync`. Alternatively, validate/sanitize the path before use.

2. **scan.ts:24-31** — All async command handlers lack error handling
   - Problem: Every `action` in scan commands uses `async` but has no `try...catch`. If `scan()` or any print function throws, the unhandled rejection crashes the CLI.
   - Impact: CLI crashes on any scan failure with no user-friendly error message.
   - Suggested fix: Wrap all async action bodies in `try...catch` blocks that log the error with `chalk.red` and set `process.exitCode = 1`.

3. **profile.ts:107** — `deployAllSkills` hardcoded with `{ force: true }`
   - Problem: In `handleApply`, `deployAllSkills(targetPath, { force: true })` bypasses any safety checks unconditionally. The `--force` flag is not exposed to the user for this operation.
   - Impact: Skills are silently overwritten during profile apply with no user consent. Modified skills are destroyed.
   - Suggested fix: Use `{ force: false }` by default. Expose `--force` as a CLI option on the `profile apply` command and pass it through.

4. **dedupe.ts:190-204** — `runDedupe` + JSON path runs analysis twice
   - Problem: When `--json` is passed, `runDedupe(targetPath)` runs the full analysis, then `analyzeDuplications(path.resolve(targetPath))` runs it again. Double the work, double the I/O.
   - Impact: Performance penalty; inconsistent results if files change between runs.
   - Suggested fix: Run `analyzeDuplications` once and use the result for both text and JSON output.

### High Issues :orange_circle:

Should fix:

1. **canon.ts + workflow.ts** — Near-identical command modules (DRY violation)
   - Problem: `canon.ts` (182 lines) and `workflow.ts` (152 lines) are structurally identical: same `validatePath` helper, same `handleList/handleInstall/handleStatus/handleUpgrade/handleSource` pattern, same display logic. Even the inline status icons in `workflow.ts:112-117` duplicate the pattern from `display/canon.ts`.
   - Suggested fix: Extract shared skill-management command registration into a generic factory function parameterized by skill type (canon vs workflow).

2. **canon.ts:61-68 + workflow.ts:43-50** — `validatePath` function duplicated
   - Problem: Identical `validatePath` function exists in both files.
   - Suggested fix: Move to `src/utils/validation.ts` alongside the existing `validateProjectPath`.

3. **scan.ts** — Every subcommand calls `scan()` independently
   - Problem: `list`, `show`, `audit`, `tokens`, `deps` each call `await scan(...)` separately. If the user runs multiple commands in sequence (or if scan is expensive), this is wasteful.
   - Suggested fix: For the current architecture this is acceptable, but consider caching scan results if performance becomes an issue.

4. **audit.ts:14** — `WORKFLOW_SKILLS` is an empty array, `printWorkflowChecks` is dead code
   - Problem: `const WORKFLOW_SKILLS: string[] = []` with the comment "Workflow patterns removed." The `printWorkflowChecks` function filters against this empty array, always printing "sparse (0/5)."
   - Suggested fix: Remove `WORKFLOW_SKILLS`, `printWorkflowChecks`, and the call to it in `printAuditReport`.

5. **audit.ts:49-53** — Security skills count shows `/5` but array has 4 items
   - Problem: `hasSecuritySkills.length >= 2` check prints "(N/5)" but `SECURITY_SKILLS` has 4 elements, not 5.
   - Suggested fix: Use `SECURITY_SKILLS.length` instead of hardcoded `5`.

6. **index.ts:50-53** — Version string hardcoded as `'0.2.0'`
   - Problem: The CLI version is a string literal. It will drift from `package.json` version.
   - Suggested fix: Read version from `package.json` at startup.

7. **mcp.ts:34-58** — `handleList` has tangled branching logic
   - Problem: The function handles 4 different modes (`--installed`, `--enabled`, `--category`, default) in a single function with nested conditionals. Hard to follow.
   - Suggested fix: Split into `handleListInstalled`, `handleListEnabled`, `handleListAll` or use a strategy pattern.

8. **tokens.ts:12-16** — `createBar` can produce negative `empty` count
   - Problem: If `value > max` (due to a bug upstream), `Math.round((value / max) * width)` exceeds `width`, making `empty` negative. `'░'.repeat(-1)` returns empty string but is semantically wrong.
   - Suggested fix: Clamp: `const filled = Math.min(width, Math.max(0, Math.round((value / max) * width)));`

9. **profile.ts:82** — `handleCreate` hardcodes path format `~/.claude/profiles/...`
   - Problem: The displayed edit path uses tilde and assumes Unix-style path. Not portable.
   - Suggested fix: Use `os.homedir()` and `path.join()` to construct the actual path.

### Medium Issues :yellow_circle:

Consider fixing:

1. **dedupe.ts:31-44** — Pattern matching is regex-on-strings, no AST awareness
   - Concern: Patterns like `function copy.*Directory` produce false positives. A comment mentioning "copy a Directory" would match. The tool is useful as a heuristic but should document its limitations.

2. **dedupe.ts:100-119** — `generateRecommendation` is a static lookup table pretending to be a function
   - Concern: The `findings` parameter is used only to count unique files for the fallback message. The rest is a hardcoded map. Inline the map or make it a simple constant.

3. **display/index.ts** — Barrel re-export module adds no value
   - Concern: Pure re-export file with no transformation or logic. Consumers could import directly from the source modules. Adds an indirection layer with no benefit.

4. **profile.ts:137-152** — `printSkillsByCategory` hardcodes category list
   - Concern: `const categories = ['security', 'tech', 'canon', 'global'] as const` — if a new category is added to profiles, this display code silently ignores it.

5. **scan.ts** — `--no-plugins` option naming creates confusing boolean
   - Concern: Commander's `--no-X` pattern makes `options.plugins` default to `true` and `--no-plugins` sets it to `false`. The intent is correct but the property name is confusing (double-negative).

6. **workflow.ts:109-110** — Hardcoded status display string `'lns workflow upgrade'`
   - Concern: The CLI is called `lens` but the help text says `lns`. Inconsistent branding.

7. **canon.ts display/canon.ts:90** — Upgrade hint says `lens canon upgrade`
   - Concern: Same branding issue — CLI is `lens`, hint says `lens`.

8. **audit.ts:28-33** — `fs.existsSync` used in display code
   - Concern: Display functions should be pure. Calling `fs.existsSync` from a "display" module breaks the stated contract of "pure display functions — no side effects except console output."

9. **mcp.ts:119** — `process.env[envVar]` checked for truthiness, not existence
   - Concern: An env var set to empty string `""` would report as "not set" even though it exists. Use `envVar in process.env` instead.

10. **items.ts:16-23** — `typeIcons` includes `hook` and `mcp` types not in `printScanSummary`
    - Concern: The `types` array in `scan.ts` lists `['skill', 'command', 'agent', 'memory', 'settings']` but `typeIcons` also has `'hook'` and `'mcp'`. If these types exist in scan results, they'll show icons in `printItemList` but won't appear in the type summary.

11. **cli.integration.test.ts:14-16** — Uses `new URL(import.meta.url).pathname` instead of `fileURLToPath`
    - Concern: Same Windows fragility issue fixed in src/canon. Use `fileURLToPath` from `node:url`.

### Low Issues :thought_balloon:

Minor improvements:

1. **Multiple files** — Magic number `50` and `60` for separator line widths
   - Used in `chalk.gray('─'.repeat(50))` across many files. Extract to a constant like `SEPARATOR_WIDTH`.

2. **dedupe.ts:66** — Magic number `80` for content truncation
   - `match[3].trim().slice(0, 80)` — extract to `MAX_CONTENT_LENGTH` constant.

3. **profile.ts:47-48** — Tip text references old CLI name `lens`
   - `lens profile apply base-tech+javascript+react` should say `lens`.

4. **display/profile.ts:43** — `printDeployedSkills` sorts the input array in place
   - `skillNames.sort()` mutates the caller's array. Use `[...skillNames].sort()`.

5. **audit.ts** — Comments attribute design to "Pike" and "Dijkstra"
   - These attributions add noise without value. The code speaks for itself.

6. **display/canon.ts:150** — `printVerifySummary` references `lens canon deploy --force`
   - Should say `lens canon deploy --force`.

7. **cli.integration.test.ts:219** — Unused loop variable `name` in manifest test
   - `for (const [name, info] of Object.entries(manifest.skills))` — `name` is unused. Use `for (const [, info] of ...)`

8. **index.ts:21-45** — Large inline DESCRIPTION string mixes presentation with logic
   - Consider loading from a separate file for easier maintenance.

### AI-Generated Antipatterns Detected

Patterns typical of AI-generated code that should be simplified:

- [x] Over-abstraction (factories/wrappers used once) — `display/index.ts` barrel re-export adds no value
- [ ] Features not requested
- [ ] Defensive checks for impossible cases
- [x] Reimplementing stdlib — `dedupe.ts` spawns grep instead of using Node.js built-in glob + regex
- [x] Copy-paste that should be extracted — `canon.ts` / `workflow.ts` are near-identical; `validatePath` duplicated
- [x] Over-commenting obvious code — "Pike", "Dijkstra", "Kernighan" attributions on routine code
- [ ] Unnecessary config options
- [ ] Over-engineered types

### Files Reviewed

| File | Lines | Issues |
|------|-------|--------|
| cli/index.ts | 65 | 1 :orange_circle:, 1 :thought_balloon: |
| cli/commands/index.ts | 13 | 0 |
| cli/commands/canon.ts | 182 | 1 :orange_circle: |
| cli/commands/scan.ts | 97 | 1 :red_circle:, 1 :yellow_circle: |
| cli/commands/profile.ts | 167 | 1 :red_circle:, 1 :orange_circle:, 1 :yellow_circle:, 1 :thought_balloon: |
| cli/commands/trace.ts | 29 | 0 |
| cli/commands/mcp.ts | 70 | 1 :orange_circle:, 1 :yellow_circle: |
| cli/commands/workflow.ts | 152 | 1 :orange_circle:, 1 :yellow_circle: |
| cli/commands/dedupe.ts | 205 | 2 :red_circle:, 1 :yellow_circle: |
| cli/display/index.ts | 31 | 1 :yellow_circle: |
| cli/display/scan.ts | 58 | 0 |
| cli/display/items.ts | 84 | 1 :yellow_circle: |
| cli/display/deps.ts | 58 | 0 |
| cli/display/profile.ts | 68 | 1 :thought_balloon: |
| cli/display/mcp.ts | 161 | 1 :yellow_circle: |
| cli/display/tokens.ts | 61 | 1 :orange_circle: |
| cli/display/audit.ts | 196 | 2 :orange_circle:, 1 :yellow_circle:, 1 :thought_balloon: |
| cli/display/canon.ts | 153 | 1 :yellow_circle:, 1 :thought_balloon: |
| cli/cli.integration.test.ts | 612 | 1 :yellow_circle:, 1 :thought_balloon: |

---
GEMINI_RESULT: called - 32 total issues
SCAN_ONLY: no fixes applied
