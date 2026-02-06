# Plan: src/scanner repair

## FILES:
- src/scanner/index.ts: fix TOCTOU, remove unnecessary async, decompose large functions

## FUNCTIONS:
- scan(options): ScanResult (max 25 lines) - orchestrator, delegates to helpers
- scanGlobalItems(): ConfigItem[] (max 10 lines) - extracted from scan
- scanProjectItems(projectPath): ConfigItem[] (max 20 lines) - extracted from scan
- scanScope(basePath, scope): ConfigItem[] (max 20 lines) - simplified, remove async
- scanDirectory(dirPath, scope, type): ConfigItem[] (max 25 lines) - remove async
- resolveSymlink(dirPath): result | null (unchanged)
- findContentFile(realPath): { path?, content } (max 15 lines) - fix TOCTOU
- scanSkillOrCommandDir(dirPath, scope, type): ConfigItem | null (max 20 lines) - remove async
- scanFile(filePath, scope, type): ConfigItem | null (max 15 lines) - fix TOCTOU, remove async
- scanPlugins(): ConfigItem[] (keep async - glob is async)
- buildDependencies(items, claudeMds): void (max 30 lines) - unchanged
- countItems(items): counts (unchanged)
- findConflicts(items): ConfigConflict[] (unchanged)
- findMissingReferences(claudeMds, names): MissingReference[] (unchanged)
- generateSummary(items, claudeMds): ScanSummary (unchanged)
- extractDescription(content): string | undefined (unchanged)

## TYPES:
- ScanOptions: unchanged
- No new types needed

## INVARIANTS:
- Only scanPlugins (uses glob) remains async; scan() stays async because it calls scanPlugins
- existsSync+readFileSync never paired — use try-catch for file reads
- existsSync OK for directory existence checks (deciding whether to scan, not racing)
- Every function under 30 lines

## SECURITY:
- Fix TOCTOU in file reads
- No new attack surface

## TESTS:
- Existing 10 tests must continue to pass
- Add tests for extractDescription edge cases

## CONSTRAINTS_APPLIED:
- TOCTOU lesson: no existsSync+readFileSync pairs
- Unbounded list lesson: not applicable (scanner reads filesystem, not user-controlled lists)

PLAN_COMPLETE
