## Phase 8 Fixes

FIX_APPLIED: SECURITY | cli/commands/profile.ts:104 | Added validateProjectPath() check before handleApply uses targetPath for destructive operations
FIX_APPLIED: SECURITY | cli/commands/profile.ts:157 | Added validateProjectPath() check before handleClean uses targetPath for destructive removals
FIX_APPLIED: SECURITY | cli/commands/init.ts:204 | Added validateProjectPath() check before handleInit runs setup actions on projectPath
FIX_APPLIED: SECURITY | profiles/apply.ts:261 | Added validateProjectPath() and uses resolvedProjectPath throughout applyComposableProfile

FIX_APPLIED: ERROR_HANDLING | utils/git.ts:14 | Named catch param, uses isEnoent() to differentiate ENOENT vs unexpected errors; logs unexpected ones in DEBUG mode
FIX_APPLIED: ERROR_HANDLING | utils/git.ts:30 | Same improvement for getGitRemote catch block
FIX_APPLIED: ERROR_HANDLING | cli/commands/init.ts:136 | Replaced bare catch { /* new file */ } with isEnoent() guard; re-throws non-ENOENT errors with { cause }
FIX_APPLIED: ERROR_HANDLING | cli/commands/init.ts:196 | Added DEBUG logging in safeAction so cause chain is preserved when DEBUG=1
FIX_APPLIED: ERROR_HANDLING | workflow/registry.test.ts:14 | Fixed pre-existing unused-import errors (renamed to _registerInstallation etc.) that blocked ESLint

FIX_APPLIED: TYPE_SAFETY | profiles/combiner.ts:28 | Replaced combined.skills! non-null assertion with null guard (if (!combined.skills) initialize)
FIX_APPLIED: TYPE_SAFETY | profiles/combiner.ts:38 | Replaced combined.claudeMd! non-null assertions with null guard (if (!combined.claudeMd) initialize)
FIX_APPLIED: TYPE_SAFETY | hooks/index.ts:181 | Replaced validated.hooksArr! with validated.hooksArr; replaced settings.hooks! with settings.hooks null check
FIX_APPLIED: TYPE_SAFETY | mcp/operations.ts:143 | Replaced (settings.enabledMcpjsonServers as string[]) with isStringArray() type guard function
FIX_APPLIED: TYPE_SAFETY | mcp/operations.ts:335 | Replaced unsafe cast in enableServer with isStringArray() guard
FIX_APPLIED: TYPE_SAFETY | mcp/operations.ts:364 | Replaced unsafe cast in disableServer with isStringArray() guard

FIX_APPLIED: TESTABILITY | mcp/registry.ts:1 | Added getRegistryDir() indirection + registryDir optional param to loadRegistry, getServer, listServers, listCategories, addServerToRegistry, removeServerFromRegistry — tests can inject via MCP_REGISTRY_DIR env var or parameter
FIX_APPLIED: TESTABILITY | mcp/operations.ts:147 | Extracted saveEnabledServers() helper to reduce duplication and improve isolation

FIX_APPLIED: COMPLEXITY | cli/commands/profile.ts:99 | Extracted validateProfileNames() helper and runApplySteps() from handleApply; reduced function to orchestration only
FIX_APPLIED: COMPLEXITY | cli/commands/profile.ts:218 | Extracted removeCleanTargets() from handleClean loop; added CleanTarget type

FIX_APPLIED: STRUCTURE | mcp/operations.ts:147 | Extracted saveEnabledServers() to encapsulate settings persistence; disableServer now uses getEnabledServers() instead of duplicate loadSettings call

FIX_APPLIED: NAMING | cli/commands/profile.ts:273 | Renamed forEach param s → skillName
FIX_APPLIED: NAMING | cli/commands/profile.ts:281 | Renamed forEach param c → cmdName
FIX_APPLIED: NAMING | cli/commands/profile.ts:288 | Renamed forEach param ai → rule
FIX_APPLIED: NAMING | cli/commands/profile.ts:125 | Renamed deployResult.errors.forEach param e → deployError
FIX_APPLIED: NAMING | scanner/analysis.ts:71 | Renamed map param i → conflictItem
FIX_APPLIED: NAMING | scanner/analysis.ts:94 | Renamed map/filter params i → configItem

FIX_APPLIED: SECURITY | cli/commands/scan.ts:22 | Added resolveProjectPath() validation for all scan subcommands (scan, list, show, audit, tokens, deps); exits with error on invalid paths
FIX_APPLIED: SECURITY | scanner/index.ts:154 | Added readFileWithSizeCap() helper with 512 KB limit; used in findContentFile() and scanFile() to prevent unbounded reads
FIX_APPLIED: SECURITY | parser/settings.ts:10 | Added MAX_SETTINGS_FILE_SIZE (256 KB) size check via statSync before readFileSync in parseSettings()

FIX_APPLIED: ERROR_HANDLING | scanner/index.ts:149 | Named catch param in resolveSymlink(); logs broken symlink path with cause in DEBUG mode instead of silently returning null
FIX_APPLIED: ERROR_HANDLING | cli/commands/init.ts:223 | Named catch param in detectProjectStack(); logs cause in DEBUG mode before falling back to FALLBACK_STACK
FIX_APPLIED: ERROR_HANDLING | profiles/apply.ts:195 | Replaced bare catch with cause-typed catch; distinguishes ENOENT (expected) from other errors which are recorded in applyResult.errors

FIX_APPLIED: COMPLEXITY | cli/commands/init.ts:127 | Extracted printDetectionHeader(), detectProjectStack(), runInitSteps() from handleInit; handleInit is now pure orchestration under 30 lines
FIX_APPLIED: COMPLEXITY | profiles/apply.ts:151 | Extracted symlinkCanonSkill() and copyAndRecordCanonSkills() from applySkillsToProject(); each function is now focused and under 30 lines
FIX_APPLIED: COMPLEXITY | workflow/index.ts:64 | Extracted isSkillDirectory() and collectSkillsFromDir() from listWorkflowSkills() inner closure; top-level named helpers replace embedded recursive function

FIX_APPLIED: TYPE_SAFETY | scanner/analysis.ts:64 | Replaced nameMap.get(key)!.push() non-null assertion with explicit get+set pattern (no ! operator)
FIX_APPLIED: TYPE_SAFETY | scanner/analysis.ts:75 | Replaced type:string split+cast (type as ConfigItemType) with firstItem.type from the Map directly
FIX_APPLIED: TYPE_SAFETY | cli/stack-detector.ts:54 | Extracted isPlainObject() type guard; replaced (parsed as Record<string,unknown>) cast with guarded return
FIX_APPLIED: TYPE_SAFETY | parser/settings.ts:64 | Replaced (settings.env as Record<string,string>) cast with isStringValueRecord() type guard that validates all values are strings

FIX_APPLIED: STRUCTURE | cli/commands/init.ts:26 | Separated display (printDetectionHeader), detection (detectProjectStack), and I/O steps (runInitSteps) into distinct helpers; handleInit is orchestration only
FIX_APPLIED: STRUCTURE | profiles/apply.ts:151 | Extracted symlink I/O into symlinkCanonSkill(); separated canon copy+record logic into copyAndRecordCanonSkills()

FIX_APPLIED: TESTABILITY | scanner/index.ts:15 | Added globalClaudePath option to ScanOptions; scan() accepts injectable path instead of always using GLOBAL_CLAUDE_PATH constant
FIX_APPLIED: TESTABILITY | profiles/apply.ts:151 | Added ApplyOptions with injectable installWorkflowSkills function; tests can substitute without touching filesystem globals

FIX_APPLIED: NAMING | output/json-adapter.ts:187 | Renamed param raw → rawFindings in buildFindings() for intent clarity
FIX_APPLIED: NAMING | profiles/combiner.ts:34 | Renamed src → incomingSkills and dst → existingSkills in mergeSkillsInto() loop
