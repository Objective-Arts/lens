# Claude-Optimal: Quality Enforcement Flags

Flags that modify Claude's behavior to enforce structural quality standards.

---

## Flag Catalog

| Flag | When to Use | What It Does |
|------|-------------|--------------|
| `--structure-first` | New features, components | Inline plan, wait for approval |
| `--plan` | Complex features, architecture | Full plan mode with `.plan.md` file |
| `--review-hard` | Before completion | Adversarial self-review |
| `--refactor-clean` | Tech debt, cleanup | Systematic decomposition |
| `--test [level]` | After writing code | Write tests at specified level(s) |

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

**When to Choose Which**:

```
Is this a quick feature with obvious structure?
├── Yes → --structure-first (lightweight)
└── No → Does it span multiple files or require exploration?
    ├── Yes → --plan (full plan mode)
    └── No → --structure-first is probably fine
```

---

## --review-hard

**Purpose**: Catch structural issues before external reviewers (Codex, Gemini, Qodana) do.

**When to Use**:
- Before presenting code as complete
- Before commit/PR
- When quality matters

**Behavior**:

Perform adversarial self-review:
1. Check against project CLAUDE.md standards
2. Ask: "What would Codex, Gemini, or Qodana flag?"
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

## Combining Flags

Flags can be combined for maximum rigor:

```
> Build the timeline view --structure-first --test all --review-hard
```

**Execution Order**:
1. `--structure-first` or `--plan` → Plan shown/written, wait for approval
2. Implement per plan
3. `--test [level]` → Write tests at specified level(s)
4. `--review-hard` → Adversarial review before presenting

**Common Combinations**:
| Combination | When to Use |
|-------------|-------------|
| `--structure-first --test all` | New feature development |
| `--plan --test all` | Complex feature with exploration needed |
| `--plan --review-hard` | Architectural changes requiring rigor |
| `--refactor-clean --test unit` | Refactoring with unit coverage |
| `--test integration --review-hard` | Bug fixes with integration verification |
| `--test e2e` | Critical user journey verification |

**Note**: `--structure-first` and `--plan` are mutually exclusive. Use one or the other.

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

| Situation | Command | What Happens |
|-----------|---------|--------------|
| New feature | `--structure-first` | Inline plan → Approve → Implement |
| Complex feature | `--plan` | Plan mode → .plan.md → Approve → Implement |
| After coding | `--test all` | Analyze → Plan tests → Write tests (all levels) |
| Unit tests only | `--test unit` | Write unit tests with mocks |
| Integration only | `--test integration` | Write integration tests |
| E2E only | `--test e2e` | Write end-to-end tests |
| Any completion | `--review-hard` | Adversarial review → Fix → Present |
| Cleanup task | `--refactor-clean` | Decompose → Unify → Summarize |
| Quick bug fix | (no flag) | Standards still apply, less formality |
| Feature + tests | `--structure-first --test all` | Plan → Implement → Test |
| Complex + tests | `--plan --test all` | Full plan mode → Implement → Test |
| Maximum rigor | `--plan --test all --review-hard` | Full pipeline with plan file |

---

## Measuring Success

After 1 week of flag usage:
- [ ] External reviewers finding fewer structural issues?
- [ ] Less time spent on review passes?
- [ ] New code matching existing patterns?

If still catching issues, add them to project anti-patterns.
