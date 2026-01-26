# Claude-Optimal: Quality Enforcement Flags

Flags that modify Claude's behavior to enforce structural quality standards.

---

## Canon-Driven Development

**Quality built in from the start, not forced by review when it's too late.**

### Dual Workflow Model

Choose your path based on whether code exists:

| New Code Flow | Legacy Code Flow |
|---------------|------------------|
| PRD / Feature Request | Existing Codebase |
| `--plan` → `--structure-first` → `--build-from-plan` | `--plan` → `--structure-first` → `--refactor-clean` |
| Canon: Bloch, Pike, Schneier, Evans, Gang of Four | Canon: Feathers, Fowler, Taleb, Evans, Liskov |

Both flows converge at shared review gates:
```
[implementation] → --test → --review-hard → (issues? → fix → re-review)
```

---

## Slash Commands

Some flags are also available as standalone slash commands for convenience:

| Flag | Slash Command | When to Prefer |
|------|---------------|----------------|
| `--refactor-clean` | `/refactor-clean` | Standalone cleanup tasks |
| `--review-hard` | `/review-hard` | Quick review of recent work |
| `--test [level]` | `/test [level]` | Standalone test writing |
| `--doc-code` | `/doc-code` | Standalone documentation generation |
| `--build-from-plan` | `/build-from-plan` | Build or resume from .plan.md |
| `--structure-first` | *(flag only)* | Always modifies a task |
| `--plan` | *(flag only)* | Always modifies a task |

**Use flags** when chaining: `Build X --structure-first --test all --review-hard`

**Use commands** when standalone: `/review-hard` or `/test unit src/services/`

---

## Flag Catalog

| Flag | When to Use | What It Does |
|------|-------------|--------------|
| `--structure-first` | New features, components | Inline plan, wait for approval |
| `--plan` | Complex features, architecture | Full plan mode with `.plan.md` file |
| `--build-from-plan` | Build or resume from plan | Implement from `.plan.md` |
| `--review-hard` | Before completion | Adversarial self-review |
| `--refactor-clean` | Tech debt, cleanup | Systematic decomposition |
| `--test [level]` | After writing code | Write tests at specified level(s) |
| `--doc-code` | After implementation | Generate documentation (Procida/Diátaxis) |

### Implementation Notes

Flags with dedicated skill files in `commands/`:
- `--build-from-plan` → `commands/build-from-plan/SKILL.md`
- `--doc-code` → `commands/doc-code/SKILL.md`

All other flags (`--plan`, `--structure-first`, `--test`, `--refactor-clean`, `--review-hard`) are behavior patterns defined in this document. They work through prompt engineering rather than separate skill files.

### --test Level Options

| Level | What It Tests | Angular | Java |
|-------|---------------|---------|------|
| `unit` | Business logic, pure functions | `*.spec.ts` with TestBed | JUnit + Mockito |
| `integration` | Component interactions, APIs | HttpClientTestingModule | Spring TestContext, MockMvc |
| `e2e` | User journeys, full stack | Playwright specs | (via Angular E2E) |
| `all` | Analyze and write all appropriate levels | All of above | All of above |

---

## --structure-first (Lightweight)

**Purpose**: Quick inline planning to prevent architectural drift. No files created.

**When to Use**:
- New features or components
- Moderate complexity implementations
- When you want planning without formality

**Behavior**:

Before writing implementation code:
1. List functions/components with single responsibility for each
2. Show data flow: input → transformations → output
3. Identify what's data-prep vs rendering/presentation
4. Wait for approval before implementing

After implementation:
5. Verify no function exceeds 30 lines
6. Verify separation of concerns maintained
7. Self-critique: "What would a hostile code reviewer flag?"

### Canon Integration

The --structure-first flag becomes more powerful with canon masters active:

| Master | How They Shape the Plan |
|--------|------------------------|
| **Kernighan** | Names reveal intent, functions do one thing |
| **Pike** | "A little copying is better than a little dependency" — prefer simple over clever |
| **Linus** | Data structures first — what shape does the data need? |
| **Thompson** | "When in doubt, use brute force" — don't over-engineer the initial plan |

**Without canon**: Claude plans based on general best practices.

**With canon**: Claude plans through specific lenses:
- Kernighan asks: "Is this function name clear to someone who didn't write it?"
- Pike asks: "Is this interface as small as it can be?"
- Linus asks: "Can I eliminate this special case through better data structure?"
- Thompson asks: "Could brute force solve this simpler?"

The plan becomes a **design review** before code exists.

**Example Prompt**:
```
> Build the placement timeline view --structure-first
```

**Claude Response Pattern**:
```markdown
## Structure Plan

### Functions (each single responsibility):
1. `fetchPlacements()` - API call only
2. `groupByMonth(data)` - grouping only
3. `enrichWithMetrics(grouped)` - calculations only
4. `sortByStartDate(enriched)` - sorting only
5. `renderTimeline(sorted)` - DOM only

### Data Flow:
raw placements → group by month → calculate metrics → sort → render

### Separation:
- Data prep: steps 1-4 (pure, testable)
- Rendering: step 5 (DOM only, receives complete data)

Ready to implement? [Awaiting approval]
```

---

## --plan (Full Plan Mode)

**Purpose**: Rigorous planning using Claude Code's built-in plan mode. Creates persistent `.plan.md` file and enforces read-only exploration until approved.

**When to Use**:
- Complex features spanning multiple files
- Architectural decisions with multiple valid approaches
- When you need to explore the codebase before committing to an approach
- Code changes that affect existing behavior or structure
- When stronger guarantees against premature implementation are needed

**Behavior**:

1. **Enter plan mode** via `EnterPlanMode` tool
2. **Explore codebase** - read-only (Glob, Grep, Read tools only)
3. **Write plan** to `.plan.md` file with:
   - Architecture decisions and rationale
   - Files to create/modify
   - Function signatures and responsibilities
   - Data flow diagrams
   - Risks and alternatives considered
4. **Request permissions** for bash commands needed during implementation
5. **Exit plan mode** via `ExitPlanMode` - requires user approval
6. **Implement** per approved plan

**Key Differences from --structure-first**:

| Aspect | --structure-first | --plan |
|--------|-------------------|--------|
| Output | Inline markdown | `.plan.md` file |
| Exploration | Can read files | Enforced read-only mode |
| Persistence | Lost after session | File persists |
| Formality | Low | High |
| Skip risk | Easy to override | Hard to bypass |
| Best for | Quick features | Complex architecture |

**Example Prompt**:
```
> Build the user authentication system --plan
```

**Claude Behavior**:
```
1. Enters plan mode (EnterPlanMode tool)
2. Explores: auth patterns in codebase, existing user models, session handling
3. Writes .plan.md:

   # Authentication System Plan

   ## Approach
   JWT-based auth with refresh tokens, matching existing session patterns.

   ## Files to Create
   - src/auth/authService.ts - token management
   - src/auth/authMiddleware.ts - route protection
   - src/auth/authController.ts - login/logout endpoints

   ## Files to Modify
   - src/routes/index.ts - add auth routes
   - src/models/user.ts - add password hash field

   ## Data Flow
   login request → validate credentials → generate JWT → store refresh token → return tokens

   ## Risks
   - Existing sessions use cookies; JWT adds complexity
   - Alternative: extend cookie sessions (simpler but less flexible)

4. Exits plan mode (ExitPlanMode tool)
5. User reviews and approves
6. Implements per plan
```

### Canon Integration

The --plan flag leverages the full Baseline Brain during exploration:

| Master | Role in Planning |
|--------|-----------------|
| **Dijkstra** | "What are the invariants? What must always be true?" |
| **Joy** | "What happens when this fails? Design for failure from the start." |
| **Pike** | "How small can these interfaces be? What's the minimal API?" |
| **Kernighan** | "Is this architecture clear to someone who didn't design it?" |
| **Linus** | "What data structures eliminate special cases?" |
| **Thompson** | "Is there a simpler brute-force approach that works?" |

**The Productive Tension**:

During planning, Thompson and Dijkstra create useful friction:
- Thompson says: "Get something working first, optimize later"
- Dijkstra says: "Prove this is correct by construction"

The plan must resolve this tension explicitly:
- For prototypes → lean Thompson (speed over rigor)
- For auth/payments → lean Dijkstra (correctness over speed)
- Document which approach and why

**Domain Canon Adds Specificity**:

With domain masters active, the plan includes framework-specific guidance:
- **Abramov** (React): "Is state lifted to the right level? Should this be a hook?"
- **Bloch** (Java): "Should this be an immutable value object?"
- **Dodds** (Testing): "How will this be tested? Integration or unit?"

**What Makes --plan Effective in This Workflow**:

1. **Canon shapes exploration** — Claude reads code through master lenses
2. **Tensions surface decisions** — Thompson vs Dijkstra forces explicit trade-offs
3. **Domain expertise applies early** — Framework patterns inform architecture
4. **Security reviews during planning** — Schneier/OWASP catch issues before code exists
5. **Plan becomes living document** — Referenced during implementation and review

**When to Choose Which**:

```
Is this a quick feature with obvious structure?
├── Yes → --structure-first (lightweight)
└── No → Does it span multiple files or require exploration?
    ├── Yes → --plan (full plan mode)
    └── No → --structure-first is probably fine
```

---

## --build-from-plan

**Purpose**: Resume implementation from an existing `.plan.md` file. Use when returning to a session with an approved plan, or when plan was created in plan mode but implementation was deferred.

**When to Use**:
- Returning to work after creating a plan in a previous session
- Plan was approved but implementation didn't happen
- Splitting planning and implementation across sessions
- Team member picking up a task from another's plan

**Behavior**:

1. **Read the plan file** (`.plan.md` in project root)
2. **Parse the plan structure**:
   - Files to create/modify
   - Function signatures and responsibilities
   - Data flow requirements
   - Any permissions or bash commands specified
3. **Confirm plan is still current**:
   - Check if referenced files still exist as expected
   - Flag if plan references outdated code
4. **Implement according to plan**:
   - Follow the documented structure exactly
   - Create files in order specified
   - Implement functions with signatures from plan
5. **Mark sections complete** as implemented

**Example Prompt**:
```
> --build-from-plan
```

**Or with specific plan file**:
```
> --build-from-plan auth-system.plan.md
```

**Claude Behavior**:
```
1. Reads .plan.md (or specified plan file)
2. Summarizes what the plan contains:

   Found plan: Authentication System
   - 3 files to create
   - 2 files to modify
   - 4 functions defined

   Last modified: 2024-01-15
   Status: Approved, not yet implemented

   Proceeding with implementation...

3. Implements each section, checking off as complete
4. Updates plan file with implementation status
5. Reports completion:

   Plan implemented:
   - [x] src/auth/authService.ts (created)
   - [x] src/auth/authMiddleware.ts (created)
   - [x] src/auth/authController.ts (created)
   - [x] src/routes/index.ts (modified)
   - [x] src/models/user.ts (modified)

   All 4 functions implemented per signatures in plan.
```

**Plan File Format Expected**:

```markdown
# [Feature Name] Plan

## Status
Approved | In Progress | Complete

## Files to Create
- path/to/file.ts - description

## Files to Modify
- path/to/existing.ts - what changes

## Function Signatures
```typescript
functionName(param: Type): ReturnType
```

## Data Flow
[Diagram or description]

## Implementation Notes
[Any context needed for implementation]
```

**Key Difference from Starting Fresh**:

| Fresh Start | --build-from-plan |
|-------------|-------------------|
| Explores codebase | Trusts plan's analysis |
| Asks questions | Uses plan's decisions |
| May propose alternatives | Follows plan exactly |
| Creates its own structure | Uses plan's structure |

**Error Handling**:

```
Plan file not found:
> No .plan.md found. Did you mean to use --plan first?

Plan references missing files:
> Plan references src/auth/legacy.ts which no longer exists.
> Should I update the plan or proceed with modified approach?

Plan is stale:
> Plan was created 30+ days ago. Files may have changed.
> Recommend reviewing plan before implementing. Proceed anyway?
```

---

## --review-hard

**Purpose**: Catch structural issues before external reviewers (Gemini, Qodana) do.

**When to Use**:
- Before presenting code as complete
- Before commit/PR
- When quality matters

**Behavior**:

Perform adversarial self-review:
1. Check against project CLAUDE.md standards
2. Ask: "What would Gemini or Qodana flag?"
3. Look for:
   - Mixed concerns (data processing in render logic)
   - Long functions (>30 lines)
   - Inconsistent patterns (mixing innerHTML and data-join)
   - Re-attached event handlers
   - Implicit responsibilities
4. Fix all issues before presenting
5. List what you fixed

**Example Prompt**:
```
> That looks done. --review-hard
```

**Claude Response Pattern**:
```markdown
## Review Findings

### Fixed:
- Extracted `calculateMetrics()` from 147-line function (was doing 8 things)
- Moved grouping logic out of render function
- Unified DOM manipulation to data-join pattern (was mixing innerHTML)
- Moved event handlers to .join() enter phase

### Verified:
- [x] No function exceeds 30 lines
- [x] Data prep separate from rendering
- [x] Consistent patterns throughout
- [x] Event handlers attached once

Code is now review-ready.
```

---

## --refactor-clean

**Purpose**: Systematically clean up messy code with clear before/after.

**When to Use**:
- Tech debt sessions
- Cleaning up discovered code smells
- Before adding features to messy code

**Behavior**:

Refactor target code following these priorities:
1. Decompose functions >30 lines into single-responsibility units
2. Separate data preparation from rendering/presentation
3. Unify inconsistent patterns (pick one approach, apply everywhere)
4. Extract inline calculations into named pure functions
5. Show before/after structure summary

**Example Prompt**:
```
> --refactor-clean src/views/renderUserView.js
```

**Claude Response Pattern**:
```markdown
## Refactoring: renderUserView.js

### Before (1 function, 147 lines, 8 responsibilities):
```
renderUserView()
├── fetch data
├── group by category
├── calculate totals
├── sort by date
├── build HTML string
├── attach event handlers
├── update DOM
└── handle errors
```

### After (8 functions, max 25 lines each, 1 responsibility each):
```
fetchUserData()        → API call
groupByCategory(data)  → grouping
calculateTotals(grouped) → calculations
sortByDate(enriched)   → sorting
renderUserList(sorted) → DOM via data-join
attachHandlers()       → events (once)
updateView()           → orchestration
handleError(err)       → error handling
```

### Changes Made:
- Decomposed monolithic function into pipeline
- Extracted calculations to pure functions
- Unified DOM updates to D3 data-join
- Moved event handlers to dedicated attachment
```

---

## --test [level]

**Purpose**: Write tests at specified level(s) using testing canon patterns. Works for any language.

**Levels**:
- `--test unit` - Unit tests only
- `--test integration` - Integration tests only
- `--test e2e` - E2E tests only
- `--test all` - Analyze and write at all appropriate levels (default)

**When to Use**:
- After implementing a feature
- After fixing a bug
- After refactoring code
- When tests are explicitly required

---

### Core Behavior (All Languages)

Activate testing canon and write tests:

1. **Detect language/framework** from file extensions and project structure
2. **Apply canon patterns** (universal):
   - **Dodds**: Testing Trophy - integration tests are the sweet spot
   - **Fowler**: Test pyramid - right level for the concern
   - **Meszaros**: Test doubles (stub/spy/mock/fake as appropriate)
   - **Feathers**: Characterization tests for legacy code
3. **Use idiomatic test tools** for the detected language
4. **Write tests** at the specified level(s)
5. **Verify** tests pass and cover changed code

---

### Test Level Decision Tree (Universal)

```
Is it pure logic (no I/O)?
├── Yes → Unit test (Meszaros patterns)
└── No → Does it access database/external service?
    ├── Yes → Integration test (Fowler pyramid middle)
    └── No → Does it cross system boundaries?
        ├── Yes → Integration test
        └── No → Is it a critical user journey?
            ├── Yes → E2E test (Dodds: sparingly)
            └── No → Unit or integration based on complexity
```

### Legacy Code (Feathers patterns)

```
Is the code untested legacy?
├── Yes → Write characterization tests first
│         (capture current behavior before changing)
└── Then → Add focused tests for new behavior
```

---

### Language-Specific Tools

| Language | Unit | Integration | E2E |
|----------|------|-------------|-----|
| **Java** | JUnit + Mockito | Spring TestContext, MockMvc | Selenium, REST Assured |
| **TypeScript/Angular** | Jasmine + TestBed | HttpClientTestingModule | Playwright, Cypress |
| **TypeScript/React** | Jest + RTL | MSW, Supertest | Playwright, Cypress |
| **Python** | pytest + unittest.mock | pytest + fixtures | pytest + Selenium |
| **Go** | testing + testify | httptest | chromedp |
| **Rust** | #[test] + mockall | integration tests | - |
| **C#/.NET** | xUnit + Moq | TestServer | Playwright |

---

### Example: Java (Spring)

**Unit** (`--test unit`):
```java
@ExtendWith(MockitoExtension.class)
class ClientServiceTest {
    @Mock private ClientRepository repo;
    @InjectMocks private ClientService service;

    @Test
    void getClient_returnsClient() {
        when(repo.findById(1L)).thenReturn(Optional.of(testClient));
        assertEquals(testClient, service.getClient(1L));
    }
}
```

**Integration** (`--test integration`):
```java
@SpringBootTest
@AutoConfigureMockMvc
class ClientControllerIT {
    @Autowired private MockMvc mockMvc;

    @Test
    void getClients_returnsPagedResults() throws Exception {
        mockMvc.perform(get("/api/clients"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }
}
```

---

### Example: Angular

**Unit** (`--test unit`):
```typescript
describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('fetches clients', () => {
    service.getClients().subscribe(c => expect(c.length).toBe(2));
    httpMock.expectOne('/api/clients').flush([{}, {}]);
  });
});
```

**E2E** (`--test e2e`):
```typescript
test('user searches clients', async ({ page }) => {
  await page.goto('/clients');
  await page.fill('[data-testid="search"]', 'Smith');
  await expect(page.locator('table tr')).toHaveCount(5);
});
```

---

### Example: Python

**Unit** (`--test unit`):
```python
def test_calculate_discount():
    service = DiscountService()
    assert service.calculate(100, "GOLD") == 15.0

def test_calculate_discount_new_customer():
    service = DiscountService()
    assert service.calculate(100, "NEW") == 0.0
```

**Integration** (`--test integration`):
```python
def test_get_clients(client):
    response = client.get("/api/clients")
    assert response.status_code == 200
    assert "content" in response.json()
```

---

### Example Prompts

```bash
# Test all changed code (auto-detect language)
> --test all

# Unit tests for specific path
> --test unit src/services/

# Integration tests for API layer
> --test integration src/controllers/

# E2E for critical flow
> --test e2e tests/e2e/checkout.spec.ts

# After implementing feature
> That's done. --test all
```

---

### Claude Response Pattern

```markdown
## Test Analysis

### Code Changed:
- `client_service.py` - business logic (Python)
- `ClientController.java` - REST endpoints (Java)
- `client.component.ts` - UI component (Angular)

### Test Plan by Level:

**Unit Tests**:
- Python: `test_client_service.py` (pytest)
- Java: `ClientControllerTest.java` (JUnit/Mockito)
- Angular: `client.component.spec.ts` (Jasmine/TestBed)

**Integration Tests**:
- Python: `test_api_clients.py` (pytest fixtures)
- Java: `ClientControllerIT.java` (MockMvc)

**E2E Tests**:
- `client-workflow.e2e.spec.ts` (Playwright)

### Tests Written:
- [x] 3 Python unit tests
- [x] 2 Java unit tests
- [x] 2 Angular unit tests
- [x] 1 Java integration test
- [x] 1 E2E test

All tests passing.
```

---

## --doc-code

**Purpose**: Generate documentation using Procida's Diátaxis framework. Creates the right type of documentation for what was built.

**When to Use**:
- After implementing a feature
- After creating a new API or public interface
- When complex code needs explanation
- Combined with other flags: `--structure-first --test all --doc-code`

**Also available as**: `/doc-code [target]` for standalone documentation

---

### Diátaxis Framework (Procida Canon)

The flag applies Procida's documentation taxonomy:

| Type | Purpose | Audience | Example |
|------|---------|----------|---------|
| **Tutorial** | Learning-oriented | Newcomers learning | "Build your first widget" |
| **How-to** | Task-oriented | Practitioners doing | "How to configure auth" |
| **Reference** | Information-oriented | Anyone looking up | API docs, config options |
| **Explanation** | Understanding-oriented | Anyone studying | "Why we use this pattern" |

---

### Behavior

When `--doc-code` is triggered:

1. **Analyze what was built**:
   - New public API? → Reference docs
   - New feature? → How-to guide
   - Complex system? → Explanation
   - New capability for users? → Tutorial

2. **Determine placement**:
   - Inline: JSDoc/JavaDoc for functions and classes
   - README: Feature overviews, quick starts
   - docs/: Detailed guides, architecture explanations
   - API reference: Auto-generated from code

3. **Generate documentation** following Procida patterns:
   - Clear purpose statement
   - Appropriate structure for doc type
   - Code examples where relevant
   - Links to related docs

4. **Verify completeness**:
   - All public APIs documented
   - Examples are runnable
   - No broken links

---

### Decision Tree

```
What was built?
│
├── New public function/class/API?
│   └── Reference documentation
│       - Parameters, return types, exceptions
│       - Usage examples
│       - Placed: Inline (JSDoc/JavaDoc) + docs/api/
│
├── New feature users will use?
│   └── How-to guide
│       - Prerequisites
│       - Step-by-step instructions
│       - Expected outcome
│       - Placed: docs/how-to/ or README section
│
├── Complex internal system?
│   └── Explanation document
│       - Why it exists
│       - How it works conceptually
│       - Design decisions
│       - Placed: docs/architecture/ or ARCHITECTURE.md
│
└── New capability to learn?
    └── Tutorial
        - Learning objectives
        - Guided walkthrough
        - Building something complete
        - Placed: docs/tutorials/
```

---

### Example Prompts

```bash
# After implementing a feature
> Build the notification system --structure-first --doc-code

# Standalone documentation for existing code
> /doc-code src/services/AuthService.ts

# Document an entire module
> /doc-code src/features/dashboard/

# Specific doc type
> /doc-code --type=how-to src/features/export/
```

---

### Claude Response Pattern

```markdown
## Documentation Generated

### Analysis:
- Built: AuthService with login/logout/refresh methods
- Type: Public API → Reference documentation
- Additional: Complex token flow → Explanation needed

### Documents Created:

**1. Reference (inline + docs/api/auth.md)**
```typescript
/**
 * Authenticates a user with email and password.
 *
 * @param credentials - User email and password
 * @returns Promise<AuthTokens> - Access and refresh tokens
 * @throws AuthError - If credentials are invalid
 *
 * @example
 * const tokens = await authService.login({
 *   email: 'user@example.com',
 *   password: 'secret'
 * });
 */
```

**2. Explanation (docs/architecture/auth-flow.md)**
- Why JWT over sessions
- Token refresh mechanism
- Security considerations

**3. How-to (docs/how-to/add-auth-to-routes.md)**
- Protecting routes with requireAuth middleware
- Optional auth for public routes
- Handling auth errors

### Verification:
- [x] All public methods have JSDoc
- [x] Examples are runnable
- [x] Links verified
```

---

### Integration with Canon

`--doc-code` activates the Procida lens from base canon:

| Procida Principle | Application |
|-------------------|-------------|
| **Separate concerns** | Don't mix tutorials with reference |
| **Serve the reader** | Right doc type for their need |
| **Show, don't tell** | Code examples over prose |
| **Keep it current** | Docs generated from actual code |

---

### Auto-Invoke Rules for --doc-code

Add to project CLAUDE.md to trigger documentation automatically:

```markdown
## Auto-Invoke Rules

| Context | Action |
|---------|--------|
| New public API (exported function/class) | INVOKE --doc-code (Reference) |
| New feature completed | INVOKE --doc-code (How-to) |
| Complex system or architecture | INVOKE --doc-code --type=explanation |
| After --test completes successfully | INVOKE --doc-code |
| New user-facing capability | INVOKE --doc-code (Tutorial if first-of-kind) |
```

**Trigger Patterns** (high confidence - always trigger):
```
- export function/class/interface (public API)
- New file in src/features/ or src/services/
- New route/endpoint added
- New component with >100 lines
- After successful test run on new code
```

**Trigger Patterns** (medium confidence - trigger if context supports):
```
- Significant refactoring (>50% of file changed)
- New configuration options added
- New error types defined
- Integration with external service
```

**Skip documentation when**:
```
- Pure test files (*.spec.ts, *.test.ts)
- Internal utilities (<50 lines, not exported)
- Config changes only
- Comment/formatting changes
```

---

## Combining Flags

### Dual Workflow Execution

**New Code Flow** (building new features):
```
> Build the timeline view --plan --structure-first --build-from-plan --test all --review-hard
```

**Legacy Code Flow** (refactoring existing code):
```
> Clean up the user service --plan --structure-first --refactor-clean --test all --review-hard
```

### Execution Order by Flow

**New Code Flow**:
1. `--plan` → Explore codebase, write `.plan.md`, wait for approval
2. `--structure-first` → Design types and interfaces
3. `--build-from-plan` → Implement from approved plan
4. `--test [level]` → Write tests
5. `--review-hard` → Adversarial review (loop back if issues)

**Legacy Code Flow**:
1. `--plan` → Find seams, identify risks, write `.plan.md`
2. `--structure-first` → Document existing structures
3. `--refactor-clean` → Safe refactoring with seams
4. `--test [level]` → Write/update tests
5. `--review-hard` → Adversarial review (loop back if issues)

### Common Combinations by Flow

| Flow | Combination | When to Use |
|------|-------------|-------------|
| **New Code** | `--plan --structure-first --build-from-plan` | New feature, full pipeline |
| **New Code** | `--structure-first --build-from-plan --test all` | Quick feature with tests |
| **Legacy** | `--plan --structure-first --refactor-clean` | Major refactoring |
| **Legacy** | `--refactor-clean --test unit` | Quick cleanup with coverage |
| **Both** | `--test all --review-hard` | After implementation complete |
| **Both** | `--doc-code --review-hard` | Document and review |

**Note**: `--build-from-plan` is for New Code Flow, `--refactor-clean` is for Legacy Code Flow. Don't mix them.

---

## Default Behavior (No Flags)

Even without flags, structural standards from STRUCTURAL-STANDARDS.md always apply:
- Single responsibility per function
- Max 30 lines per function
- Data prep separate from rendering
- Consistent patterns throughout
- Event handlers attached once

Flags add *enforcement* and *visibility*, not new rules.

---

## Integration with CLAUDE.md

Add to project CLAUDE.md to make flags project defaults:

```markdown
## Quality Flags

Default flags for this project:
- All new features: `--structure-first`
- All completions: `--review-hard`

Override with explicit `--no-review` if truly not needed.
```

---

## Quick Reference

### By Workflow

| Flow | Full Pipeline |
|------|---------------|
| **New Code** | `--plan` → `--structure-first` → `--build-from-plan` → `--test` → `--review-hard` |
| **Legacy Code** | `--plan` → `--structure-first` → `--refactor-clean` → `--test` → `--review-hard` |

### By Situation

| Situation | Command | What Happens |
|-----------|---------|--------------|
| **New Code Flow** | | |
| New feature | `--plan --structure-first --build-from-plan` | Full new code pipeline |
| Quick feature | `--structure-first --build-from-plan` | Lightweight new code |
| **Legacy Code Flow** | | |
| Major refactor | `--plan --structure-first --refactor-clean` | Full legacy pipeline |
| Quick cleanup | `--refactor-clean` | Lightweight refactoring |
| **Shared Gates** | | |
| After coding | `--test all` or `/test all` | Write tests (all levels) |
| Unit tests only | `--test unit` | Write unit tests with mocks |
| Integration only | `--test integration` | Write integration tests |
| Any completion | `--review-hard` or `/review-hard` | Adversarial review → Fix → Re-review |
| Generate docs | `--doc-code` or `/doc-code` | Diátaxis documentation |
| **Maximum Rigor** | | |
| New code, full | `--plan --structure-first --build-from-plan --test all --doc-code --review-hard` |
| Legacy, full | `--plan --structure-first --refactor-clean --test all --doc-code --review-hard` |

---

## Measuring Success

After 1 week of flag usage:
- [ ] External reviewers finding fewer structural issues?
- [ ] Less time spent on review passes?
- [ ] New code matching existing patterns?

If still catching issues, add them to project anti-patterns.
