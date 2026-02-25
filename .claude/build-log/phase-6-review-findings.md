# Phase 6: Deduplicated Review Findings

Sources: Gemini (2-pass), Codex, Qodana, AI Smell
Deduplication: same file + line within 5 lines + similar description = one finding

---

## CANARIES (must remove — planted by quality gate)

1. [src/workflow/registry.ts:101-103] — CANARY:security — Command injection via `exec` with template literal interpolation; dead import of `exec` at line 1; `input` variable undefined in scope (Gemini CRITICAL + Codex Security + AI Smell + Qodana TS error)

2. [src/cli/commands/init.ts:229-230] — CANARY:types — Dead `export function load(config: any)` appended after function body; unused parameter, `any` type (Gemini MEDIUM + Codex Security + AI Smell + Qodana ESLint)

3. [src/cli/commands/trace.ts:27-28] — CANARY:naming — `export function process(d: any)` shadows global `process`; `any` type (Gemini MEDIUM + Codex Security + Qodana ESLint)

---

## CRITICAL

4. [src/profiles/apply-config.ts:195-197] — Cross-filesystem atomic write failure: temp file at `os.tmpdir()` (may be tmpfs) renamed to `claudeMdPath` on real filesystem — `fs.rename` throws EXDEV across filesystems; temp file leaked on failure (Gemini CRITICAL + Codex Reliability)

---

## HIGH

5. [src/utils/hash.ts:8-11] — `hashFileContents` does unbounded `fs.readFileSync(filePath)` with no size guard; `hashDirectoryContents` has MAX_HASH_FILE_SIZE but this function does not (Gemini HIGH)

6. [src/workflow/registry.ts:45-52] — `saveRegistry` writes non-atomically via `fs.writeFileSync` — registry file corrupted on crash (Gemini HIGH + Codex Reliability)

7. [src/canon/manifest.ts:38] — `writeManifest` writes non-atomically via `fs.writeFileSync` — canon-manifest.json corrupted on crash (Gemini HIGH + Codex Reliability)

8. [src/workflow/index.ts:115] — `saveWorkflowManifest` writes non-atomically via `fs.writeFileSync` — workflow-manifest.json corrupted on crash (Gemini HIGH + Codex Reliability)

9. [src/mcp/operations.ts:134] — `saveSettings` writes non-atomically via `fs.writeFileSync` — settings.json corrupted on crash (Gemini HIGH + Codex Reliability)

10. [src/scanner/index.ts:143-150] — `resolveSymlink` calls `fs.realpathSync(dirPath)` without validating resolved path stays within allowed root; symlink to `/etc/passwd` would be read into ConfigItem.content (Gemini HIGH x2 runs)

11. [src/profiles/loader.ts:146] — YAML parsed without `{ schema: 'core' }` restriction; profile files from user-writable `~/.claude/profiles/` could use merge keys or type tags for prototype pollution (Gemini HIGH + Codex Security)

12. [src/profiles/apply-mcp.ts:145-154] — Non-atomic write in MCP apply operations (Codex Reliability)

---

## MEDIUM

13. [src/profiles/loader.ts:116-119] — Circular extends detection bug: checks `visited.has(profile.name)` instead of the extends target — A→B→A causes infinite recursion instead of warning; only self-referential profiles caught (Gemini MEDIUM)

14. [src/profiles/apply.ts:98-99] — Skill source path from `findSkillSourcePath` not validated against canon root before `copyDirectoryAsync` — symlinks in canon directory could copy files from arbitrary locations (Gemini MEDIUM)

15. [src/mcp/registry.ts:116-124] — `checkRequiredEnv` iterates `server.requiredEnv` from user-writable YAML — allows enumeration of arbitrary environment variable presence (Gemini MEDIUM x2 runs)

16. [src/canon/manifest.ts:23-26] — `readManifest` does `JSON.parse(content) as CanonManifest` with no runtime type validation — malformed JSON causes null dereferences downstream (Gemini MEDIUM)

17. [src/workflow/index.ts:94-108] — `getWorkflowManifest` parses JSON without size limit — deeply nested or large manifest causes DoS (Gemini MEDIUM)

18. [src/parser/claude-md.ts:10-15] — Unbounded file read without size guard (Codex Reliability)

19. [src/cli/commands/profile.ts:127-144] — Errors reported without non-zero exit code; error emitted via stdout instead of stderr (Codex Operational)

20. [src/cli/commands/scan.ts:22-27] — Project path option used without validation or normalization (Codex Reliability)

21. [src/types.ts:122-143] + [src/profiles/apply.ts:254-281] — `ComposableProfile.settings` field defined but never applied anywhere — orphaned feature (Codex Architecture)

---

## LOW

22. [src/profiles/loader.ts:155-163] — Profile YAML file loaded without size check before parsing (Gemini LOW)

23. [src/cli/commands/dedupe.ts:148] — Non-null assertion used in production code (Codex Reliability)

24. [src/cli/commands/dedupe.ts:199-204] — Error swallowed without cause/context; lacks remediation guidance (Codex Reliability)

25. [src/cli/commands/dedupe.ts:213-220] — Double execution of `analyzeDuplications` in JSON mode — 2x runtime cost (Gemini LOW)

26. [src/workflow/index.ts:111] — Error message leaks internal filesystem path (Gemini LOW)

27. [src/scanner/index.ts:39-44] — Filter for claudeMd items by `.includes('claude')` is fragile — misses or incorrectly matches filenames (Gemini LOW)

28. [src/hooks/index.ts:18-19] — Hardcoded settings path without env override (Codex Reliability)

29. [src/hooks/index.ts:74-75] — Hardcoded marker command without env override (Codex Reliability)

30. [package.json:1] — No `engines` field pinning Node LTS/stable version (Codex Reliability)

---

## QODANA-ONLY (not duplicated above)

31. [src/mcp/registry.ts:172] — Unused function `getRegistryPath` (Qodana JSUnusedLocalSymbols)

32. [src/tools/index.ts:78] — Unused parameter `options` (Qodana JSUnusedLocalSymbols)

33. [src/cli/commands/workflow.ts:35] — Unused function `validatePath` (Qodana JSUnusedLocalSymbols)

34. [mcp-servers/qodana/src/qodana-client.ts:589] — Missing await for async function call (Qodana ES6MissingAwait)

---

Total: 34 deduplicated findings (3 canaries + 1 CRITICAL + 8 HIGH + 9 MEDIUM + 6 LOW + 4 Qodana-only + 3 unused code)
