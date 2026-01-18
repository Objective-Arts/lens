# Framework-Specific Standards Templates

Copy the relevant section to your project's CLAUDE.md. These extend the universal STRUCTURAL-STANDARDS.md with framework-specific rules.

---

## D3.js / Visualization Projects

**Copy this section to D3 project CLAUDE.md:**

```markdown
## D3 Structural Standards (Non-Negotiable)

### Gold Standard Reference

**File:** `src/js/[your best file].js`

All D3 code must match this file's patterns. When in doubt, look at how it does things.

### DOM Manipulation

- ALWAYS use `.selectAll().data().join()` for data-driven elements
- NEVER use innerHTML for anything data-bound
- Static chrome (headers, legends) can use innerHTML; data rows cannot

### Data Pipeline Pattern

All D3 views must follow this separation:

```
1. Fetch/receive raw data
2. Group: groupRecordsBy*(data) → grouped
3. Enrich: calculate*(grouped) → enriched
4. Sort: sortBy*(enriched) → sorted
5. Render: draw*(sorted) → DOM only
```

Render functions:
- Receive fully-prepared data
- Touch only the DOM
- No calculations, no grouping, no sorting inside
- Just bindings and element creation

### Event Handlers

- Attach in `.join()` enter phase
- NEVER re-attach on every render
- Use event delegation for dynamic lists

### Function Limits

- Max 30 lines per function
- Single responsibility per function
- Extract if doing multiple things

### Anti-Patterns (Claude Must Avoid)

❌ Building HTML strings with template literals for data rows
❌ Calculating derived values inside .map() during render
❌ .on('click', ...) after innerHTML assignment
❌ Functions that group AND sort AND render
❌ Functions over 30 lines
❌ Pie charts (use bars)
❌ Legends when direct labeling is possible
❌ Decorative gradients, 3D effects, chartjunk

### Color & Accessibility

- Design in grayscale first, add color only if it encodes data
- Never use color as the only differentiator
- Sequential data: single hue varying in lightness
- Diverging data: two hues with neutral midpoint
- Categorical: max 7 distinct colors
- SVG needs aria-label or aria-labelledby
- Color contrast ratio ≥ 4.5:1 for text
```

---

## Angular Projects

**Copy this section to Angular project CLAUDE.md:**

```markdown
## Angular Structural Standards (Non-Negotiable)

### Component Architecture

- **Smart/Dumb separation**:
  - Containers: fetch data, manage state, handle events
  - Presenters: receive data via @Input, emit via @Output, render only
- No business logic in templates
- Max 200 lines per component file — split if larger

### Services

- Single responsibility per service
- Inject dependencies, never instantiate them
- No UI concerns in services
- Stateless where possible; if stateful, document why

### Templates

- Async pipe over manual subscriptions (always)
- trackBy on ALL *ngFor (no exceptions)
- No function calls in template bindings (use pipes or pre-compute)

### RxJS Patterns

- Prefer declarative streams over imperative subscription management
- takeUntil(destroy$) or async pipe — no naked subscribes
- Combine related streams with combineLatest/forkJoin, not nested subscribes

### Anti-Patterns (Claude Must Avoid)

❌ subscribe() without cleanup strategy
❌ Business logic in ngOnInit
❌ *ngFor without trackBy
❌ Component that fetches AND transforms AND renders
❌ Services that import Components
❌ Manual subscription when async pipe works
❌ Nested subscribes
```

---

## React Projects

**Copy this section to React project CLAUDE.md:**

```markdown
## React Structural Standards (Non-Negotiable)

### Component Architecture

- **Container/Presenter split**:
  - Containers: data fetching, state management
  - Presenters: props in, JSX out, no side effects
- Custom hooks for reusable logic
- Max 150 lines per component file

### Hooks Rules

- Hooks at top level only (no conditionals)
- Custom hooks for shared stateful logic
- useCallback/useMemo only when measured need
- useEffect cleanup for subscriptions

### State Management

- Lift state only as high as needed
- Collocate state with usage
- Derived state computed, not stored
- Context for cross-cutting concerns only

### Data Flow

```
API call (in custom hook or container)
  → Transform data (in hook)
  → Pass to presenter (via props)
  → Render (pure function of props)
```

### Anti-Patterns (Claude Must Avoid)

❌ Business logic in JSX (extract to functions)
❌ Inline object/array literals in JSX (causes re-renders)
❌ Missing dependency arrays in useEffect/useCallback
❌ State for derived values (compute instead)
❌ Prop drilling beyond 2 levels (use context or composition)
❌ Side effects outside useEffect
```

---

## Node.js / Express Projects

**Copy this section to Node.js project CLAUDE.md:**

```markdown
## Node.js Structural Standards (Non-Negotiable)

### Controller Layer

- Thin controllers: parse request, call service, send response
- No business logic in routes
- Max 20 lines per route handler

### Service Layer

- Business logic lives here
- Services don't know about HTTP (no req/res)
- Pure functions where possible
- Single responsibility per service

### Data Access Layer

- Repository pattern for database operations
- No SQL in controllers or services
- Transactions handled at service level

### Error Handling

- Custom error classes with status codes
- Central error handler middleware
- Never expose stack traces in production
- Async errors properly caught

### Anti-Patterns (Claude Must Avoid)

❌ SQL queries in route handlers
❌ try/catch in every function (use error middleware)
❌ Business logic in controllers
❌ req/res objects passed to services
❌ Callbacks when async/await available
❌ Unhandled promise rejections
```

---

## Go Projects

**Copy this section to Go project CLAUDE.md:**

```markdown
## Go Structural Standards (Non-Negotiable)

### Package Design

- Package by feature, not by layer
- Small, focused packages
- No circular dependencies

### Interface Design

- Accept interfaces, return structs
- Small interfaces (1-3 methods)
- Define interfaces where used, not implemented

### Error Handling

- Always check errors (no _ = err)
- Wrap errors with context
- Custom error types for domain errors
- Errors are values, handle them

### Concurrency

- Don't start goroutines you can't stop
- Use context for cancellation
- Channels for communication, mutexes for state
- Close channels from sender side only

### Anti-Patterns (Claude Must Avoid)

❌ Naked returns in functions >5 lines
❌ Empty error checks
❌ Goroutines without shutdown mechanism
❌ Package-level variables for non-constants
❌ Interface pollution (too many methods)
❌ Passing context as struct field
```

---

## Java Projects

**Copy this section to Java project CLAUDE.md:**

```markdown
## Java Structural Standards (Non-Negotiable)

### Class Design

- Favor composition over inheritance
- Minimize mutability (final fields, no setters)
- One concept per class
- Max 200 lines per class

### Method Design

- Max 20 lines per method
- Single level of abstraction
- No side effects in getters
- Return empty collections, not null

### API Design (Effective Java)

- Builder pattern for >3 constructor parameters
- Static factory methods over constructors when appropriate
- Defensive copies for mutable parameters
- Consider immutable objects first

### Exception Handling

- Checked for recoverable, unchecked for programming errors
- Don't catch generic Exception
- Throw early, catch late
- Include context in exception messages

### Anti-Patterns (Claude Must Avoid)

❌ God classes (>300 lines)
❌ Null returns for collections
❌ Mutable static fields
❌ Overuse of inheritance
❌ Checked exceptions for programming errors
❌ Empty catch blocks
```

---

## Usage

1. **Identify your project's framework(s)**
2. **Copy relevant section(s) to project CLAUDE.md**
3. **Add project-specific additions below the template**
4. **Reference gold standard file if you have one**

### Example Combined CLAUDE.md

```markdown
# CLAUDE.md

## Profiles Applied
`base-tech + javascript + react + node`

## Auto-Invoke Skills
[table from profiles]

## React Structural Standards (Non-Negotiable)
[copy from above]

## Node.js Structural Standards (Non-Negotiable)
[copy from above]

## Project-Specific Additions
- All API responses wrapped in ApiResponse<T>
- Feature flags via ConfigService only
- Dates stored as ISO strings, parsed at edge
```
