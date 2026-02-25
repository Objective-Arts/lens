# Eval Report — src

**Date:** 2026-02-24
**Evaluator:** Codex
**Iterations:** 3

## Scores

| Dimension | Initial | Final |
|-----------|---------|-------|
| Security | 4/10 | 6/10 |
| Structure | 6/10 | 6/10 |
| Error Handling | 4/10 | 6/10 |
| Naming | 7/10 | 5/10 |
| Complexity | 5/10 | 6/10 |
| Type Safety | 4/10 | 6/10 |
| Testability | 4/10 | 5/10 |
| **Total** | **34/70** | **40/70** |

## Fixes Applied (45)

| # | Dimension | File | Fix |
|---|-----------|------|-----|
| 1 | Security | cli/commands/profile.ts:104 | Added validateProjectPath() check before handleApply uses targetPath for destructive operations |
| 2 | Security | cli/commands/profile.ts:157 | Added validateProjectPath() check before handleClean uses targetPath for destructive removals |
| 3 | Security | cli/commands/init.ts:204 | Added validateProjectPath() check before handleInit runs setup actions on projectPath |
| 4 | Security | profiles/apply.ts:261 | Added validateProjectPath() and resolvedProjectPath throughout applyComposableProfile |
| 5 | Security | cli/commands/scan.ts:22 | Added resolveProjectPath() validation for all scan subcommands; exits with error on invalid paths |
| 6 | Security | scanner/index.ts:154 | Added readFileWithSizeCap() helper with 512 KB limit in findContentFile() and scanFile() |
| 7 | Security | parser/settings.ts:10 | Added MAX_SETTINGS_FILE_SIZE (256 KB) size check via statSync before readFileSync in parseSettings() |
| 8 | Error Handling | utils/git.ts:14 | Named catch param; uses isEnoent() to differentiate ENOENT vs unexpected errors; logs unexpected in DEBUG |
| 9 | Error Handling | utils/git.ts:30 | Same improvement for getGitRemote catch block |
| 10 | Error Handling | cli/commands/init.ts:136 | Replaced bare catch with isEnoent() guard; re-throws non-ENOENT errors with { cause } |
| 11 | Error Handling | cli/commands/init.ts:196 | Added DEBUG logging in safeAction so cause chain is preserved when DEBUG=1 |
| 12 | Error Handling | workflow/registry.test.ts:14 | Fixed pre-existing unused-import errors (renamed to _registerInstallation etc.) that blocked ESLint |
| 13 | Error Handling | scanner/index.ts:149 | Named catch param in resolveSymlink(); logs broken symlink path with cause in DEBUG mode |
| 14 | Error Handling | cli/commands/init.ts:223 | Named catch param in detectProjectStack(); logs cause in DEBUG mode before falling back to FALLBACK_STACK |
| 15 | Error Handling | profiles/apply.ts:195 | Replaced bare catch with cause-typed catch; distinguishes ENOENT from other errors recorded in applyResult.errors |
| 16 | Type Safety | profiles/combiner.ts:28 | Replaced combined.skills! non-null assertion with null guard (initialize if missing) |
| 17 | Type Safety | profiles/combiner.ts:38 | Replaced combined.claudeMd! non-null assertions with null guard (initialize if missing) |
| 18 | Type Safety | hooks/index.ts:181 | Replaced validated.hooksArr! and settings.hooks! with explicit null checks |
| 19 | Type Safety | mcp/operations.ts:143 | Replaced (settings.enabledMcpjsonServers as string[]) with isStringArray() type guard |
| 20 | Type Safety | mcp/operations.ts:335 | Replaced unsafe cast in enableServer with isStringArray() guard |
| 21 | Type Safety | mcp/operations.ts:364 | Replaced unsafe cast in disableServer with isStringArray() guard |
| 22 | Type Safety | scanner/analysis.ts:64 | Replaced nameMap.get(key)!.push() non-null assertion with explicit get+set pattern |
| 23 | Type Safety | scanner/analysis.ts:75 | Replaced type:string split+cast (type as ConfigItemType) with firstItem.type from Map directly |
| 24 | Type Safety | cli/stack-detector.ts:54 | Extracted isPlainObject() type guard; replaced (parsed as Record<string,unknown>) cast |
| 25 | Type Safety | parser/settings.ts:64 | Replaced (settings.env as Record<string,string>) cast with isStringValueRecord() type guard |
| 26 | Testability | mcp/registry.ts:1 | Added getRegistryDir() indirection + registryDir optional param to 6 functions; injectable via MCP_REGISTRY_DIR |
| 27 | Testability | mcp/operations.ts:147 | Extracted saveEnabledServers() helper to reduce duplication and improve isolation |
| 28 | Testability | scanner/index.ts:15 | Added globalClaudePath option to ScanOptions; scan() accepts injectable path instead of GLOBAL_CLAUDE_PATH constant |
| 29 | Testability | profiles/apply.ts:151 | Added ApplyOptions with injectable installWorkflowSkills function; tests substitute without filesystem globals |
| 30 | Complexity | cli/commands/profile.ts:99 | Extracted validateProfileNames() and runApplySteps() from handleApply; reduced to orchestration only |
| 31 | Complexity | cli/commands/profile.ts:218 | Extracted removeCleanTargets() from handleClean loop; added CleanTarget type |
| 32 | Complexity | cli/commands/init.ts:127 | Extracted printDetectionHeader(), detectProjectStack(), runInitSteps() from handleInit; under 30 lines |
| 33 | Complexity | profiles/apply.ts:151 | Extracted symlinkCanonSkill() and copyAndRecordCanonSkills() from applySkillsToProject() |
| 34 | Complexity | workflow/index.ts:64 | Extracted isSkillDirectory() and collectSkillsFromDir() from listWorkflowSkills() inner closure |
| 35 | Structure | mcp/operations.ts:147 | Extracted saveEnabledServers() to encapsulate settings persistence; disableServer uses getEnabledServers() |
| 36 | Structure | cli/commands/init.ts:26 | Separated display/detection/I/O into distinct helpers; handleInit is orchestration only |
| 37 | Structure | profiles/apply.ts:151 | Extracted symlink I/O into symlinkCanonSkill(); separated canon copy+record into copyAndRecordCanonSkills() |
| 38 | Naming | cli/commands/profile.ts:273 | Renamed forEach param s → skillName |
| 39 | Naming | cli/commands/profile.ts:281 | Renamed forEach param c → cmdName |
| 40 | Naming | cli/commands/profile.ts:288 | Renamed forEach param ai → rule |
| 41 | Naming | cli/commands/profile.ts:125 | Renamed deployResult.errors.forEach param e → deployError |
| 42 | Naming | scanner/analysis.ts:71 | Renamed map param i → conflictItem |
| 43 | Naming | scanner/analysis.ts:94 | Renamed map/filter params i → configItem |
| 44 | Naming | output/json-adapter.ts:187 | Renamed param raw → rawFindings in buildFindings() |
| 45 | Naming | profiles/combiner.ts:34 | Renamed src → incomingSkills and dst → existingSkills in mergeSkillsInto() loop |

## Lessons (3)

| # | Category | Description |
|---|----------|-------------|
| 1 | TYPE_SAFETY | Non-null assertion operators (!) bypass the type checker at runtime — replace with explicit null guards or Map get+set patterns |
| 2 | TYPE_SAFETY | Type assertions (as SomeType) without a preceding type guard are unsafe — extract a named type guard function (isStringArray, isRecord, isStringValueRecord) and call it before asserting |
| 3 | DESIGN | Functions that access global path constants (GLOBAL_CLAUDE_PATH, registry dir) should accept an optional injectable parameter — enables unit testing without filesystem setup |

## Proposals (0)

| # | Type | Description | Action |
|---|------|-------------|--------|

No proposals — all fixes were code pattern improvements with no pipeline/tool change implications.
