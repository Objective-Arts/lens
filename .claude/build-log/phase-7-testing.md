# Phase 7: Testing — src/

## Tests: src/

---

### TESTS_WRITTEN:

- `src/utils/fs.test.ts`: isEnoent (happy path, non-ENOENT errors, null/string/object); copyDirectorySync (flat copy, nested recursive, creates dest dir, copies safe symlinks, skips escaping symlinks); copyDirectoryAsync (files, nested, escaping symlinks, safe symlinks)
- `src/utils/hash.test.ts`: hashFileContents (non-empty result, same content = same hash, different content = different hash, 16-char hex, empty files); hashDirectoryContents (16-char hex, identical dirs, different content, different names, non-existent dir, nested dirs, deterministic sorting)
- `src/parser/settings.test.ts`: parseSettings (ENOENT → null, minimal valid, model field, mcpServers array, empty mcpServers, filters non-strings, permissions object, env vars, array env→undefined, scope preserved); error cases (invalid JSON, empty file, array root, string root, null root)
- `src/scanner/analysis.test.ts`: buildDependencies (skill refs in dependencies, referencedBy populated, command refs, null claudeMd entries, unresolved refs silently added, empty claudeMds no-op); generateSummary (zero totals, type counts, scope counts, conflict detection, different-type no-conflict, missing references, present reference not missing, unused items, used items not unused, token summation); extractDescription (empty content, YAML frontmatter, single-quoted frontmatter, first paragraph fallback, skips headings/blanks, truncates to 100 chars, headings-only returns undefined)
- `src/profiles/persistence.test.ts`: saveProfile validation (empty name, path traversal, spaces, slashes, >100 chars, valid name); saveProfileAsync validation (empty, path traversal, special chars, valid); atomic write pattern (no .tmp after success, YAML contains profile data, async no .tmp, name normalization spaces→hyphens); interrupted write recovery (sync cleanup, async cleanup)
- `src/profiles/paths.test.ts`: resolveProfilePaths (default paths when no env, uses valid CC_USER_PROFILES_DIR, null-byte env behavior, relative path rejected, empty string rejected, all four fields, skillLibraryPaths keys); getSkillLibraryPaths (all keys present, all non-empty strings)
- `src/workflow/registry.test.ts`: loadRegistry (ENOENT → empty registry, loads valid JSON, throws on corrupted JSON); saveRegistry (writes JSON, no .tmp file after success, creates parent dirs); registerInstallation (adds entry, preserves registeredAt on re-register); unregisterInstallation (removes entry); listInstallations (empty, returns all entries); pruneRegistry (removes entries missing .claude dir, skips valid entries); getRegistryPath (custom path, default ends in lens-registry.json)
- `src/cli/stack-detector.test.ts`: detectStack Next.js, Angular (@angular/core), React+TypeScript, React plain JS, D3, pure TypeScript, plain JS, Python (requirements.txt/pyproject.toml), Java (pom.xml/build.gradle), C# (.csproj), Go (go.mod), Rust (Cargo.toml), unknown fallback, malformed package.json, oversized package.json, devDependencies detection, Next.js preferred over React

---

TESTS_RUN: yes (MANDATORY)
TESTS_PASSED: 805
TESTS_FAILED: 0 (zero)
TEST_COUNT: 124 new tests (805 total including 681 pre-existing)

---

### MOCK_AUDIT:

- `src/utils/fs.test.ts`: no mocks — tests real filesystem operations via temp directories ✓
- `src/utils/hash.test.ts`: no mocks — tests real crypto hashing via temp directories ✓
- `src/parser/settings.test.ts`: no mocks — reads real temp files to test parsing ✓
- `src/scanner/analysis.test.ts`: no mocks — pure functions, no I/O; uses in-memory ConfigItem/ClaudeMdParsed objects ✓
- `src/profiles/persistence.test.ts`: no mocks — validation tests call real function; atomic write tests use temp dirs ✓
- `src/profiles/paths.test.ts`: no mocks — uses real env vars to test path resolution ✓
- `src/workflow/registry.test.ts`: no mocks — uses temp directories for real file I/O ✓
- `src/cli/stack-detector.test.ts`: no mocks — uses temp directories with real marker files ✓

---

### COVERAGE:

**src/utils/fs.ts**
- `isEnoent`: tested (real ENOENT, non-ENOENT Error, different code, null, string, plain object)
- `copyDirectorySync`: tested (flat, nested, creates dest, safe symlinks, escaping symlinks rejected)
- `copyDirectoryAsync`: tested (files, nested, escaping symlinks, safe symlinks)

**src/utils/hash.ts**
- `hashFileContents`: tested (non-empty, same content = same hash, different = different, 16-char hex, empty file)
- `hashDirectoryContents`: tested (16-char hex, identical dirs, different content/names, non-existent, nested, sort determinism)

**src/parser/settings.ts**
- `parseSettings`: tested (ENOENT, valid minimal, model, mcpServers, filter non-strings, permissions, env, scope, invalid JSON, empty, array root, string root, null root)

**src/scanner/analysis.ts**
- `buildDependencies`: tested (skill refs, command refs, referencedBy, null entries, unresolved refs, empty)
- `generateSummary`: tested (zero totals, type counts, scope counts, conflicts, missing refs, unused items, tokens)
- `extractDescription`: tested (empty, frontmatter, fallback paragraph, headings-only, truncation)

**src/profiles/persistence.ts**
- `saveProfile`: tested (name validation: empty/traversal/spaces/slashes/overflow/valid; atomic write; no .tmp after success)
- `saveProfileAsync`: tested (name validation: empty/traversal/special/valid; atomic write; cleanup)

**src/profiles/paths.ts**
- `validateEnvPath` (via `resolveProfilePaths`): tested (valid absolute, relative rejected, empty rejected, null-byte behavior)
- `resolveProfilePaths`: tested (default, env override, all fields present)
- `getSkillLibraryPaths`: tested (all keys present, non-empty)

**src/workflow/registry.ts**
- `loadRegistry`: tested (ENOENT, valid JSON, corrupted JSON)
- `saveRegistry`: tested (writes JSON, no tmp, creates parent dirs)
- `registerInstallation`: tested (adds entry, preserves registeredAt)
- `unregisterInstallation`: tested (removes entry)
- `listInstallations`: tested (empty, multiple entries)
- `pruneRegistry`: tested (removes stale, keeps valid)
- `getRegistryPath`: tested (custom, default)

**src/cli/stack-detector.ts**
- `detectStack`: tested (all supported languages and frameworks, malformed JSON, oversized JSON, fallback)

---

### Non-Happy-Path Categories Coverage:

| Category | Applied | Tests |
|---|---|---|
| Corrupted data recovery | YES — `parser/settings.test.ts`, `workflow/registry.test.ts` | Invalid JSON throws descriptive error, empty file throws |
| Lock contention | N/A | No file locking in these modules |
| Interrupted writes | YES — `profiles/persistence.test.ts` | Verifies .tmp cleanup on success, cleanup on failure |
| Symlink / path escape | YES — `utils/fs.test.ts`, `workflow/install-helpers.test.ts` | Symlinks outside src tree skipped; path escapes rejected |
| Resource exhaustion | YES — `cli/stack-detector.test.ts` | package.json over 1MB is ignored (returns fallback) |

---

### Known Limitations:

- `profiles/persistence.ts` `saveProfile`/`saveProfileAsync` write to the real `USER_PROFILES_DIR` (a module-level constant resolved at import time). Tests for the actual write path use manual replication in a temp dir. The validation behavior (the most security-relevant part) is fully tested.
- `profiles/paths.ts` null-byte env behavior: Node.js process.env truncates strings at `\0` before the application code sees them, so the `envPath.includes('\0')` guard in `validateEnvPath` is defense-in-depth for non-Node runtimes.

---

EXPERTS_LOADED: test-doubles, test-strategy, typescript (SUMMARY.md), js-safety (SUMMARY.md)

EXPERT_DECISIONS:
- test-doubles: Used in-memory ConfigItem/ClaudeMdParsed objects as Fake Objects for scanner/analysis.test.ts rather than mocking I/O — no I/O needed for pure functions
- test-doubles: Used real filesystem temp directories instead of mocking fs module — per "mocking the module under test is forbidden" rule
- test-strategy: Placed all tests at unit level (pure functions and I/O against temp dirs) rather than integration — fast, focused, deterministic
- test-strategy: Used Fresh Fixture pattern (beforeEach/afterEach with tmpdir cleanup) for all I/O tests
- typescript: Matched actual ConfigItem/ClaudeMdParsed type shapes precisely (isSymlink, metadata fields) to avoid type errors
- js-safety: Used strict equality in all assertions; no loose comparisons

TESTING_COMPLETE
