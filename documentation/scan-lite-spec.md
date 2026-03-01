# Lens Scan Lite — Specification

## Vision

A lightweight code-scanning CLI that gives any project instant access to Claude-native code review plus domain-specific canons for C#, Java, D3, and React. No external services. No MCP servers. Just Claude reading your code with sharp rubrics and opinionated standards — backed by a polyglot quality gate.

**What it is:** Canons + scans + gate + two lightweight action skills (`/change`, `/fix`). Run `lens-scan init`, get a CLAUDE.md with standards, rubrics, scan commands, a quality gate, and two ways to act on findings. No pipeline, no orchestrator, no external models.

**What it is not:** The full Lens pipeline. No `/build`, `/improve`. No MCP servers. No Gemini/Codex/Qodana. No lessons files. No build-log state machine. No bash orchestrator.

## Design Constraint: No External Dependencies

No MCP servers. No `.mcp.json`. No Codex CLI. No Gemini API. Every scan and action runs purely within Claude + the local quality gate. The package ships rubrics, canons, scan skills, action skills, and the gate script. Nothing else.

## Project Artifacts

**Deployed to target project on `init`:**
- `CLAUDE.md` — generated with standards, scan commands, action commands, quality gate reference
- `.claude/skills/` — symlinks to scan + action skills in the package
- `.claude/rubric/` — symlinked to rubrics in the package

**Not deployed:**
- `.mcp.json` — no MCP servers
- `.claude/lessons.md` or `.claude/universal-lessons.md` — no learning loop
- `.claude/build-log/` — no build state
- `.claude/plans/` — no plans directory

## Included Components

### From Lens (keep as-is)

| Component | Why |
|-----------|-----|
| `src/cli/` | CLI entry point, stack detection |
| `src/profiles/` | Loader, combiner, validation (composable profiles) |
| `src/types.ts` | Core types |
| `src/paths.ts` | Asset path resolution |
| `src/parser/settings.ts` | YAML parsing |
| `scripts/quality-gate.ts` | Polyglot quality gate |
| `scripts/quality-gate.test.ts` | Gate tests |

### Profiles to Ship

| Profile | Extends | Focus |
|---------|---------|-------|
| `software-base` | — | Universal canons (clarity, security, testing, etc.) |
| `javascript` | software-base | JS fundamentals |
| `typescript-cli` | javascript | TS + CLI patterns |
| `csharp` | software-base | C#/.NET idioms, async, LINQ |
| `java` | software-base | Effective Java, API design |
| `d3` | javascript | D3 selections, charts, dashboards, data-story |
| `react` | javascript | React state, hooks, composition |
| `frontend` | javascript | General frontend |

### Scan Skills (Claude-native, read-only)

| Skill | Description |
|-------|-------------|
| `code-scan` | 13-dimension built-in scanner |
| `ai-smell-scan` | AI code pattern detection |
| `deadcode-scan` | Unused code detection |
| `naming-scan` | Naming consistency |
| `refactor-scan` | Refactoring opportunities |
| `dedupe-scan` | Duplication detection |
| `canon-audit` | Audit against a canon's rules |
| `generate-docs` | Documentation generation |

### Action Skills (Claude-native, modify code)

| Skill | Description | Weight |
|-------|-------------|--------|
| `change` | Simple changes done right — make it, clean it, report it | Zero — pure prompt, no infrastructure |
| `fix` | Review against canons + gate, fix findings, verify — **rewritten Claude-native** | Zero — pure prompt, no infrastructure |

### Canon Skills (from `canon/`)

All canons referenced by the included profiles:
- **software-base:** clarity, pragmatism, simplicity, composition, distributed, data-first, correctness, algorithms, abstraction, optimization, design-patterns, security-mindset, owasp, failure, safety, resilience, docs, prose, brevity, editing, react-test, legacy, test-doubles, test-strategy, pitfalls
- **C#:** csharp-depth, async, type-systems, java
- **Java:** java
- **D3:** d3, charts, dashboards, data-story, ui-ux
- **React:** react-state

### Rubrics (deployed to `.claude/rubric/` via symlink)

Shipped in the package, symlinked into projects on init. New rubrics can be added to the package and will be available immediately via the symlink.

**Existing:**
- `AUTO-DETECT.md`, `base.md`, `product-quality.md`
- `typescript.md`, `java.md`, `d3.md`, `angular.md`
- `web-api.md`, `data-persistence.md`, `cli.md`
- `microservice.md`, `security.md`, `contracts.md`, `migration.md`

**New rubrics to create:**
- `csharp.md` — C#/.NET review criteria (nullable refs, async patterns, LINQ, Span<T>)
- `react.md` — React review criteria (hook rules, key props, memo usage, effect deps)

---

## `/fix` Rewrite — Claude-Native

The current `/fix` shells out to Codex for review and verification. The rewrite replaces Codex with the quality gate (deterministic) + Claude self-review (judgment), keeping the same review-fix-verify structure.

### New `/fix` Flow

```
/fix [path] [--dry-run]
  │
  ├─ Step 1: Detect canons + load rubrics (same as today)
  │
  ├─ Step 2: Quality gate (deterministic)
  │   └─ Run quality-gate.ts against target
  │   └─ Parse violations into findings list
  │
  ├─ Step 3: Claude review (judgment)
  │   └─ Read ALL target files with canons loaded
  │   └─ Review against canon anti-patterns + rubric criteria
  │   └─ Produce findings in same FINDING format
  │   └─ Merge with gate violations, dedup
  │
  │   --dry-run? → print findings report, stop
  │   All clean? → print clean report, stop
  │
  ├─ Step 4: Fix (same priority order as today)
  │   └─ CRITICAL → HIGH → MEDIUM → LOW
  │   └─ Same scope constraints (no new files in path mode)
  │
  ├─ Step 5: Verify
  │   └─ Run quality-gate.ts again — deterministic issues must be zero
  │   └─ Claude re-reads changed files — confirm subjective fixes landed
  │   └─ If regressions → fix them
  │   └─ If remaining CRITICAL/HIGH → one more pass, then stop
  │
  ├─ Step 6: Lint + test
  │
  └─ Step 7: Report (same format, "Codex" → "gate + review")
```

### What Changes from Current `/fix`

| Current | Rewrite |
|---------|---------|
| `codex exec` review call | `quality-gate.ts` + Claude reads code with canons |
| `codex exec` verify call | `quality-gate.ts` rerun + Claude re-reads |
| Temp files (`/tmp/lens-fix-*.md`) | No temp files — everything in conversation |
| Fallback to `review-bot.sh` | No fallback needed — gate is always available |
| PRD mode (build then review) | Drop — that's `/build` territory, out of scope for scan-lite |

### What Stays

- Canon detection and loading (step 2 in current)
- Severity-based priority fixing (CRITICAL → HIGH → MEDIUM → LOW)
- Scope constraints (no new files in path mode, no new deps)
- Report format
- `--dry-run` flag

---

## Quality Gate

The quality gate (`scripts/quality-gate.ts`) is kept and expanded. It runs locally, no external services. Current state and planned changes:

### Current Architecture

The gate has 3 layers:

| Layer | Scope | Checks |
|-------|-------|--------|
| **Universal** | All languages | Hardcoded secrets, empty error handling, TODO accumulation, hardcoded URLs |
| **JS/TS-specific** | `.ts`/`.js` only | Shell injection, path traversal, circular imports, raw error output |
| **Proxy checks** | TS only (`runProxyChecks`) | 23 checks: naming, composition, testing, design, magic values, TOCTOU, eval, comment spam, function length, etc. |

**The gap:** When C# is detected, it only gets the 4 universal checks. Java gets the same 4. The 23 proxy checks are hardcoded to TypeScript patterns.

### Changes: Remove Qodana Linting

The current gate falls back to Qodana for non-TS languages. Since Scan Lite has no MCP/external deps, remove the Qodana linting path entirely:

- Remove `QODANA_LINTERS` map
- Remove `runQodana()` function
- Remove `runLinter()` for non-TS (keep ESLint for TS if configured)
- Replace with expanded custom checks per language

### Changes: C#-Specific Checks (New)

Add a `runCSharpChecks()` function parallel to the existing TS checks. These catch the worst C# violations that correlate with the `csharp` profile standards:

#### Security Checks (C#)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| SQL injection | `SqlCommand`, raw string queries | String concatenation or interpolation in SQL command text |
| Insecure deserialization | `BinaryFormatter`, `JavaScriptSerializer` | Any usage (these are inherently unsafe) |
| Path traversal | `Path.Combine()` with user input | No prior validation of `..` segments |

#### Async/Await Checks (C#)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Async void | Method declarations | `async void` except in event handler signatures (`sender, EventArgs`) |
| Sync-over-async | `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` | Blocking call on a Task (outside of `Main` or test setup) |
| Missing ConfigureAwait | `await` in library code | `await` without `ConfigureAwait(false)` in files not under a web/UI project root |
| Missing CancellationToken | `async Task` methods | Public async method with no `CancellationToken` parameter |

#### Disposal & Resource Checks (C#)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Missing using/dispose | `new HttpClient()`, `new SqlConnection()`, `new StreamReader()` | IDisposable instantiation without `using` statement or block |
| Multiple HttpClient | `new HttpClient()` | More than one instantiation per file (should use IHttpClientFactory or singleton) |

#### Null Safety Checks (C#)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Null reference | Dereference after nullable | `x.Property` without prior null check when `x` is typed as nullable (`?`) |
| Empty catch swallowing | `catch { }` or `catch (Exception) { }` | Already covered by universal check — extend to catch C# `when` clauses |

#### Design Checks (C#)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Mutable public fields | `public` field declarations | `public` fields that aren't `readonly`, `const`, or in a `record` |
| Large structs | `struct` declarations | Struct with > 4 fields or estimated > 16 bytes |
| Unsealed classes | `class` declarations | Public non-abstract class without `sealed` modifier (catches accidental inheritance) |

#### LINQ & Collections (C#)

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Multiple enumeration | `IEnumerable<T>` parameters | Same IEnumerable variable used in multiple LINQ chains or `foreach` without `ToList()` |
| LINQ in loops | `for`/`foreach` containing `.Where()`, `.Select()`, etc. | LINQ query re-evaluated on each iteration |

### Changes: Expand Proxy Checks to C#

Many existing proxy checks are conceptually polyglot. Expand these to also parse `.cs` files:

| Existing Check | C# Adaptation |
|----------------|---------------|
| `checkFunctionLength` | Match C# method signatures (`public`, `private`, `async`, etc.) |
| `checkFileLength` | Works as-is (line counting is universal) |
| `checkParameterCount` | Match C# method parameter lists |
| `checkClassMethodCount` | Match C# `class` declarations and count methods |
| `checkInheritanceDepth` | Match C# `:` inheritance syntax |
| `checkMagicNumbers` | Works as-is (numeric literal detection is universal) |
| `checkMagicStrings` | Works as-is (string comparison detection is universal) |
| `checkCommentSpam` | Adapt to match `///` XML doc comments restating method names |
| `checkBannedParamNames` | Match C# `public`/`internal` method parameters |
| `checkExportCount` | Map to `public` member count per file |
| `checkEmptyErrorHandling` | Already covers `catch {}` — verify C# `when` clause support |
| `checkHardcodedSecrets` | Already polyglot — verify `.cs` extension included |

### Changes: Java-Specific Checks (Lightweight)

Smaller set — Java is well-covered by the universal + expanded proxy checks:

| Check | Pattern | Fail condition |
|-------|---------|----------------|
| Raw type usage | Generic types | `List`, `Map`, `Set` without type parameters |
| String concat in loops | `for`/`while` with `+` on String | String concatenation instead of StringBuilder |
| Mutable public fields | `public` field declarations | `public` non-`final` fields |

### Gate Integration

Update `runGate()` to call language-specific checks:

```typescript
if (languages.includes('csharp')) {
  const csFiles = collectSourceFiles(projectDir, SOURCE_EXTENSIONS.csharp);
  violations.push(
    ...runCSharpChecks(csFiles, projectDir),       // new C#-specific checks
    ...runPolyglotProxyChecks(csFiles, projectDir), // expanded proxy checks
  );
}

if (languages.includes('java')) {
  const javaFiles = collectSourceFiles(projectDir, SOURCE_EXTENSIONS.java);
  violations.push(
    ...runJavaChecks(javaFiles, projectDir),
    ...runPolyglotProxyChecks(javaFiles, projectDir),
  );
}
```

### Generated CLAUDE.md Quality Gate Section

```markdown
## Quality Gate

Run the quality gate against your project:

    tsx node_modules/lens-scan-lite/scripts/quality-gate.ts .

Checks by language:
- **All languages:** secrets, empty catch, TODO accumulation, hardcoded URLs
- **JS/TS:** shell injection, path traversal, circular imports, raw error output, 23 proxy checks
- **C#:** async void, sync-over-async, SQL injection, missing dispose, mutable fields, large structs + polyglot proxy checks
- **Java:** raw types, string concat in loops, mutable fields + polyglot proxy checks
```

---

## Excluded Components

| Component | Why |
|-----------|-----|
| `scripts/pipeline.sh` | Build/improve orchestrator — all pipeline weight |
| `workflow-skills/workflow/build/` | Full pipeline build — needs orchestrator |
| `workflow-skills/workflow/improve/` | Full pipeline improve — needs orchestrator |
| `workflow-skills/workflow/plan/` | Pipeline phase |
| `workflow-skills/workflow/structure/` | Pipeline phase |
| `workflow-skills/workflow/implementation/` | Pipeline phase |
| `workflow-skills/workflow/refactoring/` | Pipeline phase |
| `workflow-skills/workflow/deduplication/` | Pipeline phase |
| `workflow-skills/workflow/evaluation/` | Pipeline phase — AI scoring |
| `workflow-skills/workflow/testing/` | Pipeline phase |
| `workflow-skills/workflow/gemini-review/` | Requires Gemini MCP |
| `workflow-skills/workflow/codex-review/` | Requires Codex CLI |
| `workflow-skills/workflow/qodana-review/` | Requires Qodana MCP |
| `workflow-skills/workflow/security-review/` | Pipeline phase |
| `workflow-skills/utils/ai-smell-review/` | Writes fixes — hybrid, not scan-only |
| `workflow-skills/utils/gemini-scan/` | Requires Gemini MCP server |
| `workflow-skills/utils/codex-scan/` | Requires Codex MCP server |
| `workflow-skills/utils/qodana-scan/` | Requires Qodana MCP server |
| `workflow-skills/utils/session-status/` | Pipeline session tracking |
| `workflow-skills/utils/skill-usage-report/` | Pipeline analytics |
| `workflow-skills/utils/run-tests/` | Test runner — out of scope |
| `workflow-skills/utils/explain-skill/` | Meta-skill |
| `workflow-skills/utils/lens/` | Full Lens home base — replaced with lite version |
| `src/profiles/apply-mcp.ts` | MCP server setup — no MCP |
| `mcp-servers/` | MCP server definitions — not needed |
| Learning loop (lessons.md) | No cross-session learning |
| Build-log state machine | No pipeline state |
| Plans directory | No planning phase |

## CLI Surface

```
lens-scan init [--profile name] [--force]   # Set up project
lens-scan profiles                           # List available profiles
lens-scan scan                               # Show workspace config
lens-scan gate [path]                        # Run quality gate
```

### Generated CLAUDE.md Commands Section

```markdown
## Available Commands

**Actions:**

| Command | Description |
|---------|-------------|
| `/change [description]` | Simple changes done right — make it, clean it, report it |
| `/fix [path] [--dry-run]` | Review against canons + gate, fix findings, verify |

**Scans (read-only):**

| Command | Description |
|---------|-------------|
| `/code-scan [path]` | 13-dimension quality analysis |
| `/ai-smell-scan [path]` | AI code patterns |
| `/deadcode-scan [path]` | Unused code detection |
| `/naming-scan [path]` | Naming consistency |
| `/refactor-scan [path]` | Refactoring opportunities |
| `/dedupe-scan [path]` | Duplication detection |
| `/canon-audit <canon> [path]` | Audit against a canon's rules |
| `/generate-docs [path]` | Generate documentation |
```

## Changes Required

### 1. Slim `init.ts`

- Remove `setupMcpServers()` call — no MCP
- Keep `setupProjectStructure()` for rubric symlink only (remove plans dir creation)
- Keep skill symlink logic — link scan skills + action skills (`change`, `fix`) + canon skills
- Keep CLAUDE.md generation but use scan-lite command table + quality gate section

### 2. Slim `init-display.ts`

- Remove `/build`, `/improve` and all pipeline workflow commands
- Remove `/gemini-scan`, `/codex-scan`, `/qodana-scan`
- Remove pipeline flags section (--rollback, --from, --dry-run for pipeline)
- Remove pipeline bash orchestrator section
- Add `/change` and `/fix` to command table under "Actions"
- Add quality gate section to generated CLAUDE.md

### 3. Remove MCP code

- Delete `src/profiles/apply-mcp.ts` or gut it
- Remove MCP-related fields from profile types if not needed
- Remove `mcp-servers/` from package files

### 4. Slim `init-setup.ts`

- Keep rubric symlink logic in `setupProjectStructure()`
- Remove plans directory creation

### 5. Rewrite `/fix` SKILL.md — Claude-native

- Strip all `codex exec` calls
- Replace review step: run `quality-gate.ts` + Claude reads code with canons/rubrics
- Replace verify step: rerun `quality-gate.ts` + Claude re-reads changed files
- Drop PRD mode (out of scope — no `/build`)
- Keep severity priority, scope constraints, `--dry-run`, report format
- Update references from "Codex" to "gate + review"

### 6. Keep `/change` SKILL.md as-is

- Already Claude-native, no external deps
- Only change: remove references to `/build`, `/improve` in the "When to Escalate" and "vs Other Workflows" sections (those don't exist in scan-lite)

### 7. Expand `quality-gate.ts`

- Remove `QODANA_LINTERS`, `runQodana()`, Qodana references
- Keep `runEslint()` for TS projects that have ESLint configured
- Add `runCSharpChecks()` — async void, sync-over-async, SQL injection, missing dispose, mutable fields, large structs, unsealed classes, multiple enumeration, LINQ in loops, missing CancellationToken, insecure deserialization, path traversal
- Add `runJavaChecks()` — raw types, string concat in loops, mutable fields
- Refactor `runProxyChecks()` → extract `runPolyglotProxyChecks()` that works with any language's files (function length, file length, parameter count, class method count, inheritance depth, magic numbers/strings, comment spam, banned params, export/public count)
- Keep TS-only checks in `runProxyChecks()` for TS-specific patterns (circular imports, TOCTOU, etc.)
- Update `runGate()` to dispatch C# and Java checks when those languages are detected
- Add `lens-scan gate [path]` CLI subcommand

### 8. Expand `quality-gate.test.ts`

- Add tests for every new C# check (async void, sync-over-async, SQL injection, etc.)
- Add tests for Java checks
- Add tests for polyglot proxy checks running on `.cs` and `.java` files
- Verify gate integration detects + runs correct checks per language

### 9. New `package.json`

```json
{
  "name": "lens-scan-lite",
  "bin": { "lens-scan": "./dist/cli/index.js" },
  "files": [
    "dist/",
    "canon/",
    "profiles/",
    "workflow-skills/rubric/",
    "workflow-skills/utils/",
    "workflow-skills/workflow/change/",
    "workflow-skills/workflow/fix/",
    "scripts/quality-gate.ts"
  ]
}
```

### 10. New rubrics

- `workflow-skills/rubric/csharp.md` — C# review criteria
- `workflow-skills/rubric/react.md` — React review criteria

### 11. Slim profile types

- Remove `commands` field
- Remove `mcpServers` field
- Remove MCP-related types

## Implementation Order

1. **Delete excluded code** — pipeline workflow skills, MCP code, pipeline script, learning loop refs
2. **Slim init** — scan-lite commands, rubric symlink only, no MCP, quality gate section in CLAUDE.md
3. **Rewrite `/fix`** — Claude-native, quality gate + canon review, no Codex
4. **Trim `/change`** — remove pipeline references
5. **Remove Qodana from quality gate** — strip external linter deps
6. **Add C# checks to quality gate** — `runCSharpChecks()` with all checks listed above
7. **Add Java checks to quality gate** — `runJavaChecks()` lightweight set
8. **Extract polyglot proxy checks** — refactor `runProxyChecks()` so naming/composition/design checks work on `.cs` and `.java`
9. **Update `runGate()`** — dispatch per language
10. **Write tests** — full coverage for new C# and Java checks
11. **Create new rubrics** — `csharp.md`, `react.md`
12. **Update package.json** — new name, slimmed files array
13. **Integration test** — `lens-scan init` + `lens-scan gate` + `/fix --dry-run` on sample C#, Java, TS projects

## Open Questions

1. **Package name?** `lens-scan-lite`, `lens-scan`, or something else?
2. **Monorepo or fork?** Keep on a branch of lens, or split to a separate repo?
3. **Additional rubrics?** Beyond `csharp.md` and `react.md`, any other gaps?
4. **ConfigureAwait check** — should this be a warning or error? Library code vs app code distinction is hard to detect statically.
5. **Unsealed classes check** — too noisy? Could limit to `public` classes in library projects only.
