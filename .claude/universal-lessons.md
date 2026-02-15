# Lessons (Universal)

Cross-project patterns accumulated from review phases (ai-smell-review, gemini-review, qodana-review, security-review).
Planning and implementation phases read this file to proactively avoid known mistakes.

This file ships with workflow-skills/ and applies to ALL projects.
Project-specific lessons go in `.claude/lessons.md` (local to each project).

## Categories

- **DESIGN**: Architecture/abstraction issues (for plan, structure)
- **CODE_QUALITY**: Naming/complexity/style (for implementation, refactoring)
- **DUPLICATION**: Repeated patterns (for deduplication)
- **LOGIC**: Bugs/edge cases (for implementation)
- **AI_SMELL**: AI-generated antipatterns (for implementation, plan, structure)

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

### Symlink Bypass in Path Validation
- `startsWith` checks on resolved paths are bypassed by symlinks pointing outside the allowed directory
- Always resolve with `realpath` (or equivalent) AND then verify with `path.relative()` that the result doesn't start with `..`
- Pattern: `const rel = path.relative(allowed, await realpath(target)); if (rel.startsWith('..')) reject;`

### Secrets in CLI Arguments
- Never accept secrets (API keys, passwords, tokens) as positional CLI arguments — they leak to `ps aux` and shell history
- Accept secrets via `--value-file <path>`, stdin pipe, env var, or interactive prompt
- Named flags like `--password` are marginally better (still in `ps aux`) but acceptable with documented risk

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

### Mass Assignment on Entity Objects
- Never accept entire entity objects (Product, User, Order) from user input and bind them directly to database models
- User can manipulate internal fields like Id, CreatedAt, IsDeleted, Roles by crafting malicious JSON payloads
- Pattern: Create new entity instances with only explicitly assigned safe properties from input
- Alternative: Use separate DTO/request models with only user-editable fields, map to entity manually

### Information Disclosure in Validation Errors
- Validation error messages that echo back product IDs, stock quantities, or user-provided input reveal system state to attackers
- Use generic messages: "Product not found" instead of "Product 123 not found", "Insufficient stock" instead of "requested 50, available 10"
- Only reveal specific details in server logs, never in API responses

### Decimal Overflow in Financial Calculations
- Multiplying decimal Price * int Quantity can exceed decimal max value if Quantity approaches int.MaxValue
- Always check result magnitude before assignment: `if (subtotal > MAX_REASONABLE_VALUE) throw`
- Pattern applies to any currency calculation with user-controlled multipliers

### Context-Appropriate Encoding (HTML vs Attribute)
- `escapeHtml()` produces HTML entities (`&amp;`, `&lt;`) which are correct for text content but wrong for HTML attribute values like `id` and `class`
- Entity-encoded strings in `id` attributes don't match subsequent `document.querySelector('#id')` calls
- Use `sanitizeAttr()` (strip non-alphanumeric) for IDs and class names; use `escapeHtml()` only for text content

### CSS-Wide Keyword Injection
- Color sanitizers that accept named CSS colors must block CSS-wide keywords: `inherit`, `initial`, `unset`, `revert`, `revert-layer`
- These keywords change style inheritance rather than setting a color, enabling layout manipulation attacks
- Pattern: maintain a blocklist Set and check `trimmed.toLowerCase()` against it before accepting named colors

### Client-Side API Key Exposure
- NEVER use framework-specific client-exposed env var prefixes (VITE_, NEXT_PUBLIC_, REACT_APP_) for API keys or secrets
- These prefixes exist to intentionally expose values to the browser bundle; secrets must stay server-side
- Inject credentials via server-side proxy headers, middleware, or backend API routes -- never in client-shipped JavaScript
- Pattern: rename `VITE_API_KEY` to `API_KEY` (no prefix) and read it in `vite.config.js` proxy config via `process.env`

### LLM Tool Input Validation
- When an LLM calls tools via tool_use, all input parameters come from the model and must be validated as untrusted input
- Whitelist valid values for enums (columns, tabs, statuses); cap numeric inputs (limits, page sizes)
- Validate string IDs for type and length; never interpolate into selectors or queries without validation
- The LLM can be manipulated via prompt injection to pass malicious tool inputs

### Async Mutation Rollback Scope
- When mutating shared state (arrays, objects) across multiple async steps, wrap the entire sequence in a single try/catch with rollback
- Partial rollback (only on one failure point) leaves state inconsistent when later steps fail
- Pattern: save rollback index before mutations, restore on any error within the full sequence

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

### Data Format Versioning
- Any persisted data format (config files, keystores, databases) must include a schema version field
- Without a version field, v2 code cannot distinguish v1 data from corrupted data
- Plan migration paths: version field in format, validation on read, clear error for unsupported versions

### Non-Happy-Path Test Coverage
- Tests that only cover success paths miss corrupted files, lock contention, interrupted writes, and resource exhaustion
- Require at least one test per failure category that applies: corrupted data, lock contention, interrupted writes, symlink escape, resource exhaustion
- Skip categories that don't apply but document the skip

### Operational UX for Data Tools
- Tools that store user data need backup/restore, export/import, and lifecycle features (rotation, expiry)
- plan should explicitly plan or consciously omit these — don't leave them unmentioned

### Database Migrations Over EnsureCreated
- Never use `EnsureCreated()` (or equivalent) in production — always generate and apply migrations
- `EnsureCreated` skips migration history, making schema evolution impossible without dropping the database
- Review phases that switch from EnsureCreated to Migrate must also generate the initial migration file

### Health Check Endpoints
- Every web API needs a `/health` endpoint that returns 200 when the service is ready
- At minimum: confirms the process is listening and can reach its data store
- plan should include this in the work items for any API project

### Structured Logging
- Use structured logging with correlation IDs, not default console/debug logging
- Every request should carry a correlation ID through all log entries for traceability
- plan should specify the logging strategy (library, format, correlation ID propagation)

## CODE_QUALITY Patterns

### Dead Exports
- Verify exports are actually imported somewhere before creating them
- Don't write functions speculatively — wait until there's a caller

### Unused Imports
- Don't import symbols "just in case" — only import what you use
- After refactoring, check if imports became unused

### Unresolved JSDoc Type References
- Every `@typedef`, `@type`, or `@property` that references a named type must have that type defined (via `@typedef` or `import()`)
- Common miss: referencing a type name in a `@property` annotation that was never declared anywhere in the codebase
- Qodana catches these as `JSValidateJSDoc` — define the typedef before referencing it, or use `Object` if no formal type exists

### Redundant Verification Reads
- Don't `readFileSync` after `writeFileSync` to "verify" the write — trust the write, this is both TOCTOU and wasted I/O

### Dead Constants/Functions
- Same-name constants in different files → deduplication should catch these
- Grep for callers before keeping any function — if zero callers, delete it

### Unused Parameters Escaping Lint
- ESLint's `no-unused-vars` with default `args: 'after-used'` only flags unused params after the last used one — a leading unused param followed by a used one goes undetected
- After refactoring a function to pull data from a different source (e.g., switching from `client` to `headerData`), grep the function body for each parameter name to verify all are still referenced
- implementation should not pass arguments the callee does not use; if a param was needed earlier but a refactor consolidated its data into another param, remove it from both the signature and the call site

### Exception Caught Locally (Re-wrapping Pattern)
- Qodana flags `throw` statements inside a `try` block followed by `catch` that re-throws with wrapping as "exception caught locally"
- This pattern anti-establishes control flow: validation checks and synchronous business logic should live OUTSIDE the try block; only actual I/O and async operations should be wrapped
- Move validation checks before the try block or extract them into helper functions called outside try-catch
- Only wrap errors that originate from async/I/O operations (file system, crypto, network) in try-catch; let validation errors bubble naturally

## DUPLICATION Patterns

### Same-Name Constants
- Watch for the same constant defined in multiple files (e.g., `PHASE_ORDER` in both `types.ts` and `phases/index.ts`)
- Keep one canonical location, import everywhere else

## AI_SMELL Patterns

### Single-Use Helper Functions
- Do not extract a helper function that is called exactly once — inline the logic at the call site. Only extract when there are 2+ callers.
- plan and structure should not decompose below the natural abstraction level.
- Example: `SalesServiceHelper.ExtractProductIds()` was a one-liner called from two places in `SalesService` — inline the LINQ directly at call sites.

### Dependency Injection Violation (Service Instantiation Anti-Pattern)
- Do not create new instances of repository/service classes inside controller methods: `var productsRepository = new ProductRepository(database)`.
- Always inject dependencies via constructor. If multiple methods need the same service, inject it once and reuse the field.
- Controller should declare all dependencies in its constructor; methods use injected fields.

### Comment Spam (JSDoc Restating Code)
- Do not add JSDoc that restates the function name: `/** Get the user */ function getUser()` — delete it.
- Only comment non-obvious behavior: unusual algorithms, why (not what), invariants, edge cases.
- File header comments restating the filename ("Shared filesystem utilities" in `utils/fs.ts`) are noise — omit them.
- In C#, remove XML documentation summaries that only describe obvious behavior (e.g., "Returns all active products ordered by name" when the method name is `GetAllActiveAsync`).

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

### Speculative Retry Loops
- Do not add retry loops with hardcoded attempt counts (e.g., `for (int attempt = 0; attempt < 3; attempt++)`) for exceptions that are rare or handled by the framework
- EF Core concurrency conflicts are already rare in single-request operations; retrying adds 30 lines of code to handle an edge case that throws and lets the client retry naturally
- Trust the framework's exception handling — catch and fail fast, let the caller decide to retry

### Unused Named Constants for Zero Values
- Do not create named constants for literal zero values in simple contexts: `const int transactionCountNotAvailable = 0`
- When a DTO field must be initialized to zero, just use `0` directly in the property initializer
- Named constants add indirection without improving readability when the meaning is self-evident

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
