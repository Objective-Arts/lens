# Lessons (Universal)

Cross-project patterns accumulated from review phases (ai-smell-fix, gemini-fix, qodana-fix, adversarial-security-review).
Planning and implementation phases read this file to proactively avoid known mistakes.

This file ships with workflow-skills/ and applies to ALL projects.
Project-specific lessons go in `.claude/lessons.md` (local to each project).

## Categories

- **DESIGN**: Architecture/abstraction issues (for create-plan, structure-first)
- **CODE_QUALITY**: Naming/complexity/style (for implement-plan, refactor-check-fix)
- **DUPLICATION**: Repeated patterns (for dedupe-fix)
- **LOGIC**: Bugs/edge cases (for implement-plan)
- **AI_SMELL**: AI-generated antipatterns (for implement-plan, create-plan, structure-first)

---

## LOGIC Patterns

### TOCTOU (Time-of-Check-to-Time-of-Use)
- Never pair `existsSync` + `readFileSync` — the file can be deleted between the two calls. Use try-catch around `readFileSync` directly.
- This is the single most common bug pattern across codebases. Found in 10+ files across 6 modules in one project.

### Shell Injection
- NEVER use `execSync` with template literals containing variables: `` execSync(`grep "${pattern}" "${path}"`) ``
- Always use `execFileSync` with an args array: `execFileSync('grep', ['-rn', pattern, path])`
- `shell: false` (default for `execFile`/`spawn`) prevents injection even with untrusted content

### Path Traversal
- Any name from user input (CLI args, config files, regex-parsed content) must be validated before `path.join`: reject `/`, `\`, `..`
- Validate at the boundary where user input enters — not deep in library functions
- Pattern: `if (name.includes('/') || name.includes('\\') || name.includes('..'))` → reject

### Path Prefix Collision
- `path.startsWith(root)` without trailing separator matches too broadly: `/home/user` matches `/home/username`
- Always use `startsWith(root + path.sep)` or `startsWith(root + '/')` for path containment checks

### XSS in Embedded JSON
- `JSON.stringify` inside `<script type="application/json">` is vulnerable if data contains `</script>`
- Always escape: `.replace(/<\//g, '<\\/')`

### Sorting Inside Nested Loops
- Never sort an array inside a loop that iterates over it repeatedly -- sort once before the loop, then scan linearly
- Common in carry-forward / last-known-value calculations where assessments are sorted per client per sample point
- Fix: pre-sort once into a parallel structure, then use linear scan or binary search inside the loop

### Null-as-Sentinel in Aggregation
- When aggregating records where null means "ongoing/open-ended", a naive reduce can overwrite null with a later non-null value
- Use a boolean flag (`hasOngoing`) to track whether any record had the sentinel, then apply it after the loop
- Applies to any aggregation where null carries semantic meaning (ongoing episodes, unbounded ranges, open intervals)

### D3 .html() with String Concatenation
- Never use D3's `.html()` with template literals to build dynamic content: `` tooltip.html(`<li>${escapeHtml(item)}</li>`) ``
- Use D3 DOM manipulation instead: `tooltip.append('li').text(item)` -- `.text()` escapes automatically
- The string-concat pattern is fragile: one forgotten `escapeHtml()` call in a future edit creates an XSS vector
- Make the secure path the default path by using `.append()` + `.text()`, which cannot produce XSS

### Unbounded While Loop on Date Ranges
- Any `while (current <= latest)` loop iterating over dates must guard against `earliest > latest` at the top of the function
- Without the guard, malformed or inverted date ranges cause infinite loops and CPU exhaustion
- Pattern: `if (!earliest || !latest || earliest > latest) return [];`

### Bracket-Access Without Fallback on Lookup Objects
- `COLORS[key]` returns `undefined` when key is missing, which silently produces broken DOM attributes (e.g., `fill="undefined"`)
- Wrap lookups in a helper with nullish coalescing: `COLORS[key] ?? FALLBACK_COLOR`
- Applies to any lookup object used in rendering: color maps, label maps, config maps

### String-Matching Fragility
- Don't match against human-readable strings to detect state: `result.message.includes('already installed')`
- Check actual filesystem/application state directly instead

### D3 Scale Domain Collapse
- `d3.extent(values)` returns `[x, x]` when all values are identical, producing a degenerate scale where all outputs are NaN
- Guard with: `yMin === yMax ? [yMin - 1, yMax + 1] : [yMin, yMax]`
- Applies to any d3 scale where the domain is computed from data extent

### Falsy-vs-Null on Optional Numeric Values
- `if (d.target)` treats 0 as falsy, skipping valid zero values
- Use `d.target !== null && d.target !== undefined` (or `d.target != null` in non-strict-equality codebases)
- Applies to any optional number where 0 is a meaningful value: targets, thresholds, indices, offsets

### DOM Dataset Values as Keys or Selectors
- `element.dataset.sort` or `element.dataset.tab` used in bracket access (`obj[dataset.sort]`) or selectors (`#panel-${dataset.tab}`) can be manipulated via DOM
- Always validate dataset values against an allowlist before using them as object keys, CSS selectors, or state values
- Without validation: prototype property access (`__proto__`, `constructor`) or CSS selector injection

### Context-Appropriate Encoding (HTML vs Attribute)
- `escapeHtml()` produces HTML entities (`&amp;`, `&lt;`) which are correct for text content but wrong for HTML attribute values like `id` and `class`
- Entity-encoded strings in `id` attributes don't match subsequent `document.querySelector('#id')` calls
- Use `sanitizeAttr()` (strip non-alphanumeric) for IDs and class names; use `escapeHtml()` only for text content

### CSS-Wide Keyword Injection
- Color sanitizers that accept named CSS colors must block CSS-wide keywords: `inherit`, `initial`, `unset`, `revert`, `revert-layer`
- These keywords change style inheritance rather than setting a color, enabling layout manipulation attacks
- Pattern: maintain a blocklist Set and check `trimmed.toLowerCase()` against it before accepting named colors

### Recursive Traversal Depth Limits
- Any recursive function traversing tree/graph data structures must have a max depth parameter
- Without it, circular references or maliciously deep structures cause stack overflow
- Pattern: `if (depth > MAX_DEPTH) return [];` at the top of the recursive function

## DESIGN Patterns

### Cleanup Symmetry (Resource Pairing)
- Every resource acquisition (event listener, subscription, interval, DOM element) must have a corresponding cleanup in the destroy/teardown path
- Common miss: registering `.on('change', handler)` in init but only removing resize listener in destroy --> audit all event registrations when writing destroy functions

### Unbounded User-Controlled Lists
- Lists parsed from user-controlled files (config, markdown, env) should have max limits
- Without limits, a malicious config can cause memory exhaustion

### Function Size
- Functions over 30 lines should be decomposed by extracting validation, categorization, and recording steps into named helpers
- Common offenders: install/upgrade/status functions that mix validation + action + reporting

## CODE_QUALITY Patterns

### Dead Exports
- Verify exports are actually imported somewhere before creating them
- Don't write functions speculatively — wait until there's a caller

### Unused Imports
- Don't import symbols "just in case" — only import what you use
- After refactoring, check if imports became unused

### Redundant Verification Reads
- Don't `readFileSync` after `writeFileSync` to "verify" the write — trust the write, this is both TOCTOU and wasted I/O

### Dead Constants/Functions
- Same-name constants in different files → dedupe-fix should catch these
- Grep for callers before keeping any function — if zero callers, delete it

### Unused Parameters Escaping Lint
- ESLint's `no-unused-vars` with default `args: 'after-used'` only flags unused params after the last used one — a leading unused param followed by a used one goes undetected
- After refactoring a function to pull data from a different source (e.g., switching from `client` to `headerData`), grep the function body for each parameter name to verify all are still referenced
- implement-plan should not pass arguments the callee does not use; if a param was needed earlier but a refactor consolidated its data into another param, remove it from both the signature and the call site

## DUPLICATION Patterns

### Same-Name Constants
- Watch for the same constant defined in multiple files (e.g., `PHASE_ORDER` in both `types.ts` and `phases/index.ts`)
- Keep one canonical location, import everywhere else

## AI_SMELL Patterns

### Single-Use Helper Functions
- Do not extract a helper function that is called exactly once — inline the logic at the call site. Only extract when there are 2+ callers.
- create-plan and structure-first should not decompose below the natural abstraction level.

### Comment Spam (JSDoc Restating Code)
- Do not add JSDoc that restates the function name: `/** Get the user */ function getUser()` — delete it.
- Only comment non-obvious behavior: unusual algorithms, why (not what), invariants, edge cases.
- File header comments restating the filename ("Shared filesystem utilities" in `utils/fs.ts`) are noise — omit them.

### Defensive Paranoia (Impossible Null Checks)
- Do not add null/undefined checks on typed parameters — trust TypeScript's type system.
- `if (!content) return 0` on a `string` param is dead code. `if (!claudeMd) continue` in a `ClaudeMdParsed[]` loop is dead code.
- Do not add `existsSync` checks after a function that already ensures the directory exists.

### Speculative Features
- Do not add version fields, config options, or parameters that have only one possible value.
- Do not create types/interfaces speculatively — wait until there's a second consumer.
- Do not add backward-compatibility re-exports (`export { X as OldName }`) on day one.

### Error Swallowing
- Empty `catch {}` blocks hide real errors. If swallowing is intentional, check the specific error condition (e.g., exit code 1 from grep means "no matches" — re-throw anything else).

### Over-Extracting Obvious Literals
- Do not extract universally known values into named constants: `MONTHS_IN_YEAR = 12`, `SECONDS_PER_MINUTE = 60`, `HTTP_OK = 200`.
- Do not extract single-use default parameter values: `DEFAULT_COUNT = 50` used only as `count = DEFAULT_COUNT` -- inline `count = 50`.
- Only extract a number when its meaning is non-obvious in context or when it appears in multiple places.

## Gemini False Positive Patterns

These are patterns Gemini consistently flags but are NOT applicable in certain contexts:

- **"Missing rate limiting"** — not applicable to local CLI tools
- **"Allowed base directory" restrictions** — not applicable when the user explicitly chooses their project directory
- **"Environment variable injection"** via `process.env` propagation — not applicable when the user controls their own terminal
- **"Transaction/rollback for multi-step operations"** — disproportionate for dev tools where re-running is trivial
- **`--dangerously-skip-permissions` flag** — intentional for autonomous pipelines, not a vulnerability
- **"Command injection" with `shell: false`** — `execFile`/`spawn` with `shell: false` is safe by design
- **"Rewrite module state as a class"** — module-level `let` variables are standard for single-instance D3 visualizations; class refactoring adds boilerplate without benefit when there's exactly one instance
- **"Use date-fns/moment.js for date arithmetic"** — vanilla `Date` with `.setDate()/.setMonth()/.getTime()` is sufficient for simple date offsets; adding a library dependency for `addMonths` is over-engineering
- **"Add input validation to every function"** — in a closed module where all callers are internal and data is self-generated (mock data), validating every parameter is defensive paranoia; validate at boundaries, not internally
- **"Split constants file into multiple domain files"** — for a single visualization module with ~15 related constants groups, one file is appropriate; splitting into 5 files adds import complexity without benefit
