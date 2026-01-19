# Claude-Optimal: Quality Enforcement Flags

Flags that modify Claude's behavior to enforce structural quality standards.

---

## Flag Catalog

| Flag | When to Use | What It Does |
|------|-------------|--------------|
| `--structure-first` | New features, components | Plan architecture before coding |
| `--review-hard` | Before completion | Adversarial self-review |
| `--refactor-clean` | Tech debt, cleanup | Systematic decomposition |
| `--test-complete` | After writing code | Write tests at appropriate levels |

---

## --structure-first

**Purpose**: Prevent architectural drift by planning before implementing.

**When to Use**:
- New features or components
- Complex implementations
- Code that will be reviewed later

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

## --test-complete

**Purpose**: Ensure code changes have appropriate test coverage at the right levels.

**When to Use**:
- After implementing a feature
- After fixing a bug
- Before marking work as complete
- When tests are explicitly required

**Behavior**:

Apply testing canon (Dodds, Fowler, Meszaros, Feathers) to write tests:

1. **Analyze the code** - What was added/changed?
2. **Determine test levels needed**:
   - Unit tests for business logic, calculations, validations
   - Integration tests for database access, API calls, component interactions
   - E2E tests for critical user journeys (only if applicable)
3. **Apply appropriate patterns**:
   - Dodds: Testing Trophy approach, test behavior not implementation
   - Fowler: Test pyramid, right level for the concern
   - Meszaros: Test doubles (stub/spy/mock/fake as appropriate)
   - Feathers: Characterization tests for legacy code
4. **Write the tests** - Following canon patterns
5. **Verify coverage** - Ensure changed code is tested

**Example Prompt**:
```
> --test-complete
```

**Claude Response Pattern**:
```markdown
## Test Analysis

### Code Changed:
- `OrderService.calculateDiscount()` - business logic
- `OrderRepository.findByCustomer()` - database access
- `CheckoutController.submit()` - API endpoint

### Test Plan:

**Unit Tests** (business logic):
```java
@Test void calculateDiscount_goldCustomer_returns15Percent()
@Test void calculateDiscount_newCustomer_returnsZero()
@Test void calculateDiscount_negativeAmount_throwsException()
```

**Integration Tests** (database + API):
```java
@Test void findByCustomer_returnsMatchingOrders()
@Test void submit_validOrder_returns201()
@Test void submit_invalidOrder_returns400()
```

**E2E Tests**: None needed (covered by existing checkout flow test)

### Tests Written:
- [x] 3 unit tests for calculateDiscount
- [x] 2 integration tests for repository
- [x] 2 integration tests for controller

All tests passing. Coverage: 94% of changed lines.
```

**Test Level Decision Tree**:
```
Is it pure logic (no I/O)?
├── Yes → Unit test
└── No → Does it access database/external service?
    ├── Yes → Integration test
    └── No → Does it cross system boundaries?
        ├── Yes → Integration test
        └── No → Is it a critical user journey?
            ├── Yes → E2E test (sparingly)
            └── No → Unit or integration based on complexity
```

**Legacy Code (Feathers patterns)**:
```
Is the code untested legacy?
├── Yes → Write characterization tests first
│         (capture current behavior before changing)
└── Then → Add focused tests for new behavior
```

---

## Combining Flags

Flags can be combined for maximum rigor:

```
> Build the timeline view --structure-first --review-hard --test-complete
```

**Execution Order**:
1. `--structure-first` → Plan shown, wait for approval
2. Implement per plan
3. `--test-complete` → Write tests for new code
4. `--review-hard` → Adversarial review before presenting

**Common Combinations**:
| Combination | When to Use |
|-------------|-------------|
| `--structure-first --test-complete` | New feature development |
| `--refactor-clean --test-complete` | Refactoring legacy code |
| `--test-complete --review-hard` | Bug fixes |
| All four flags | Maximum rigor |

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
| New feature | `--structure-first` | Plan → Approve → Implement |
| After coding | `--test-complete` | Analyze → Plan tests → Write tests |
| Any completion | `--review-hard` | Adversarial review → Fix → Present |
| Cleanup task | `--refactor-clean` | Decompose → Unify → Summarize |
| Quick bug fix | (no flag) | Standards still apply, less ceremony |
| Feature + tests | `--structure-first --test-complete` | Plan → Implement → Test |
| Maximum rigor | `--structure-first --test-complete --review-hard` | Full pipeline |

---

## Measuring Success

After 1 week of flag usage:
- [ ] External reviewers finding fewer structural issues?
- [ ] Less time spent on review passes?
- [ ] New code matching existing patterns?

If still catching issues, add them to project anti-patterns.
