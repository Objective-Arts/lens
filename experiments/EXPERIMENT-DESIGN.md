# Claude-Optimal vs. Vanilla Claude: Experimental Design

## Overview

This document defines controlled experiments comparing code quality between:
- **Treatment A**: Claude with claude-optimal (canon loaded)
- **Treatment B**: Vanilla Claude (no canon, no CLAUDE.md guidance)

Both conditions receive **identical prompts** and write code **from scratch**. No rigged inputs.

## Experimental Principles

### 1. Fair Comparison
Both conditions start from the same requirements. No intentionally bad code. No leading prompts that favor one condition.

### 2. Identical Prompts
The exact same user message is given to both conditions. The only difference is system context.

### 3. Measurable Outcomes
Every experiment has objective metrics that can be verified by static analysis, linters, or security scanners.

### 4. Multiple Runs
Each experiment should be run 3-5 times per condition to account for LLM variance.

### 5. Blind Evaluation
Evaluators should not know which output came from which condition when scoring.

---

## Experiment 1: Healthcare API Controller

### Requirements (Identical for Both)

```
Build a JAX-RS REST controller for a healthcare application that manages
client records. The controller should handle:

1. Client CRUD operations (id, firstName, lastName, dateOfBirth, ssn, status)
2. Client enrollments (program, startDate, endDate, status)
3. Client diagnoses (code, description, diagnosedDate, provider)

Requirements:
- Use dependency injection for services
- Parse dates from string format "yyyy-MM-dd"
- Return appropriate HTTP status codes
- Handle errors gracefully

This is a HIPAA-regulated application.
```

### What We're Measuring

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Structure | How is code organized? | File count, lines per file, methods per class |
| Thread Safety | Is date parsing thread-safe? | Check for ThreadLocal or immutable DateTimeFormatter |
| PHI Protection | Is sensitive data logged? | grep for logger calls with client data |
| SRP | How many responsibilities per class? | Manual count of distinct concerns |
| Error Handling | Are errors informative but safe? | Check error messages for info leakage |

### Metrics Collection

```bash
# Count files
find output/ -name "*.java" | wc -l

# Check for thread safety issues
grep -r "SimpleDateFormat" output/  # Should be 0 or use ThreadLocal
grep -r "DateTimeFormatter" output/  # Modern approach

# Check for PHI in logs
grep -rE "logger\.(info|warn|debug).*get(FirstName|LastName|Ssn)" output/

# Count methods per file
# (manual or use a Java parser)
```

---

## Experiment 2: Password Reset Flow

### Requirements (Identical for Both)

```
Implement a password reset flow for a Node.js Express application.

Endpoints needed:
- POST /auth/forgot-password - Request reset (accepts email)
- POST /auth/reset-password - Complete reset (accepts token + new password)

Requirements:
- Tokens expire after 1 hour
- Password must be 8+ characters with mixed case and a number
- Use the existing User model (has email, passwordHash fields)
- Use the existing sendEmail(to, subject, body) function

Implement the route handlers and any utilities needed.
```

### What We're Measuring

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Token Generation | Is it cryptographically secure? | Check for crypto.randomBytes vs Math.random |
| Token Storage | Is the token hashed before storage? | Check database operations |
| Timing Attacks | Is comparison constant-time? | Check for crypto.timingSafeEqual |
| Error Messages | Do they leak user existence? | Compare error messages for existing vs non-existing users |
| Rate Limiting | Is the endpoint protected? | Check for rate limiting middleware |

### Metrics Collection

```bash
# Token generation method
grep -r "randomBytes\|crypto\." output/
grep -r "Math.random" output/  # Should be 0

# Token hashing
grep -r "bcrypt\|argon2\|hash" output/

# Error message analysis (manual)
# Look for: "User not found" vs "If account exists, email sent"

# Rate limiting
grep -r "rateLimit\|rate-limit" output/
```

---

## Experiment 3: React Data Table

### Requirements (Identical for Both)

```
Build a React component for a reusable data table with:

- Sortable columns (click header to sort)
- Pagination (client-side, 10 items per page)
- Row selection with checkboxes (multi-select)
- Loading, empty, and error states

The component should work with any data shape - the parent passes in
columns configuration and data array.

Use TypeScript and functional components with hooks.
```

### What We're Measuring

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Composition | Is it one big component or composed? | File/component count |
| Props | Is there prop drilling or context/composition? | Depth of prop passing |
| Hooks | Is logic extracted to custom hooks? | Count of custom hooks |
| Types | Are types well-defined? | TypeScript strictness, any usage |
| Accessibility | Are ARIA attributes present? | grep for aria-* and role= |

### Metrics Collection

```bash
# Component count
grep -r "export.*function\|export.*const.*=" output/*.tsx | wc -l

# Custom hooks
grep -r "function use[A-Z]" output/

# Prop drilling depth (manual analysis)

# Type safety
grep -r ": any" output/  # Should be minimal

# Accessibility
grep -rE "aria-|role=" output/
```

---

## Experiment 4: Shopping Cart with Tests

### Requirements (Identical for Both)

```
Implement a ShoppingCart class in JavaScript with:

- addItem(product, quantity) - Add product to cart
- removeItem(productId) - Remove product from cart
- updateQuantity(productId, quantity) - Change quantity
- applyCoupon(coupon) - Apply discount coupon
- getTotal() - Calculate total with tax (8%)

Coupons can be percentage (e.g., 10% off) or fixed amount (e.g., $5 off).
Coupons have optional expiration dates and minimum purchase requirements.

Include comprehensive tests for the implementation.
```

### What We're Measuring

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Test Count | How many test cases? | Count test/it blocks |
| Test Names | Do names describe behavior? | Manual review |
| Edge Cases | Are boundaries tested? | Check for 0, negative, empty cases |
| Test Isolation | Is there shared state? | Check for beforeAll mutations |
| Behavior vs Implementation | Do tests check outcomes or internals? | Manual review |

### Metrics Collection

```bash
# Test count
grep -c "it(\|test(" output/*.test.js

# Test isolation issues
grep -r "beforeAll" output/  # Potentially shared state

# Edge cases (look for these scenarios)
grep -rE "empty|zero|0|negative|\-1|null|undefined" output/*.test.js
```

---

## Experiment 5: Go URL Shortener

### Requirements (Identical for Both)

```
Implement a Go URL shortener service with:

- POST /shorten - Create short URL (accepts {"url": "..."})
- GET /:code - Redirect to original URL
- GET /stats/:code - Return click count

Requirements:
- Short codes should be 6 alphanumeric characters
- URLs expire after 30 days
- Track click count per URL
- Use an interface for storage (so it can be swapped)

Include appropriate error handling.
```

### What We're Measuring

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Interface Design | How many methods per interface? | Count interface methods |
| Error Handling | Are errors returned or panicked? | grep for panic vs return err |
| Package Structure | Is code organized? | Directory structure |
| Concurrency | Is shared state protected? | Check for mutex/channels |
| Context | Is context propagated? | Check handler signatures |

### Metrics Collection

```bash
# Interface size
grep -A5 "type.*interface" output/*.go

# Error handling
grep -r "panic(" output/  # Should be minimal
grep -r "return.*err" output/  # Should be common

# Concurrency safety
grep -r "sync\.\|chan " output/

# Context usage
grep -r "context.Context" output/
```

---

## Experiment 6: API Documentation

### Requirements (Identical for Both)

```
Write documentation for this authentication API:

Endpoints:
- POST /auth/register - Create account (email, password)
- POST /auth/login - Get access token
- POST /auth/refresh - Refresh access token
- POST /auth/logout - Invalidate tokens
- GET /auth/me - Get current user

The API uses JWT tokens. Access tokens expire in 15 minutes.
Refresh tokens expire in 7 days and are stored in HTTP-only cookies.

Write documentation that helps developers integrate with this API.
```

### What We're Measuring

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Tutorial | Is there a getting-started guide? | Look for step-by-step |
| Reference | Are all endpoints documented? | Count endpoint docs |
| Examples | Are there code examples? | Count code blocks |
| Error Documentation | Are error responses documented? | Check for error sections |
| Conceptual | Is there explanation of JWT flow? | Look for "why" content |

### Diátaxis Quadrant Coverage

- [ ] Tutorial (learning-oriented)
- [ ] How-to (problem-oriented)
- [ ] Reference (information-oriented)
- [ ] Explanation (understanding-oriented)

---

## Experiment 7: D3 Visualization

### Requirements (Identical for Both)

```
Create a D3.js bar chart component that:

- Displays monthly revenue data
- Updates smoothly when data changes
- Has labeled axes (months on X, dollars on Y)
- Handles window resize
- Shows value on hover

Data format: [{month: "Jan", revenue: 45000}, ...]

Use D3 v7 and vanilla JavaScript (no framework).
```

### What We're Measuring

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| D3 Patterns | Is enter-update-exit correct? | Manual code review |
| Reusability | Is it a closure-based reusable chart? | Check for configurable function pattern |
| Visual Design | Is there chartjunk? | Count decorative elements |
| Responsiveness | Does it handle resize? | Check for ResizeObserver or window.resize |
| Accessibility | Are there ARIA labels? | grep for aria-* |

---

## Experiment 8: Angular Dashboard Module

### Requirements (Identical for Both)

```
Build an Angular 17+ module for a dashboard with:

1. A DashboardComponent that displays widgets
2. A WidgetService that fetches widget data from an API
3. At least 3 widget components (stats card, recent activity list, chart placeholder)
4. A shared model for Widget { id, type, title, data }

Requirements:
- Use standalone components
- Use signals for state management
- Implement OnPush change detection
- Handle loading and error states
- Make the widgets configurable via inputs

The dashboard should be responsive and the widgets should be reorderable
(just the data structure, not drag-drop).
```

### What We're Measuring (Hevery/Papa/Kurata Principles)

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Standalone Components | Are components standalone? | Check for `standalone: true` |
| Signals | Is state managed with signals? | grep for `signal(`, `computed(` |
| Change Detection | Is OnPush used? | Check for `changeDetection: ChangeDetectionStrategy.OnPush` |
| Injection | Is inject() used over constructor DI? | Count `inject()` vs constructor params |
| Smart/Dumb Split | Are there container vs presentational components? | Analyze component responsibilities |
| Reactive Patterns | Are observables handled properly? | Check for async pipe, takeUntilDestroyed |

### Metrics Collection

```bash
# Standalone components
grep -r "standalone: true" output/

# Signals usage
grep -rE "signal\(|computed\(|effect\(" output/

# OnPush change detection
grep -r "ChangeDetectionStrategy.OnPush" output/

# Modern injection
grep -r "inject(" output/
grep -r "constructor(" output/*.ts

# Async pipe (proper observable handling)
grep -r "| async" output/*.html

# takeUntilDestroyed (proper cleanup)
grep -r "takeUntilDestroyed" output/

# Component count
find output/ -name "*.component.ts" | wc -l
```

### Angular-Specific Evaluation

| Criterion | Points | What to Look For |
|-----------|--------|------------------|
| Signals over BehaviorSubject | 15 | Modern state management |
| OnPush everywhere | 10 | Performance best practice |
| Smart/dumb component split | 15 | Container fetches, presentational displays |
| Proper DI with inject() | 10 | Modern injection pattern |
| Reactive cleanup | 10 | No memory leaks |
| Input/Output typing | 10 | Strong typing on component API |
| Standalone modules | 10 | No NgModule declarations |
| Error boundaries | 10 | Graceful error handling |
| Loading states | 10 | UX consideration |

---

## Experiment 9: Java Domain Model

### Requirements (Identical for Both)

```
Design and implement a Java domain model for an e-commerce order system:

Classes needed:
- Order (id, customerId, items, status, createdAt, total)
- OrderItem (product reference, quantity, unitPrice, lineTotal)
- Money (amount, currency) - for prices
- OrderStatus enum (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)

Requirements:
- Orders can have items added/removed while PENDING
- Calculate order total from line items
- Orders cannot be modified after CONFIRMED
- Support multiple currencies
- Validate that quantity > 0 and prices are non-negative

Implement the domain model with appropriate methods for state transitions.
```

### What We're Measuring (Bloch Principles)

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Immutability | Are value objects immutable? | Check for final fields, no setters |
| Static Factories | Are there static factory methods? | Look for `of()`, `from()`, `create()` |
| Builder Pattern | Are builders used for complex construction? | Check for Builder inner classes |
| Defensive Copies | Are collections copied on get/set? | Check for `List.copyOf()`, `new ArrayList<>()` |
| Validation | Is validation in constructors? | Check constructor logic |
| Null Handling | Is Optional used appropriately? | grep for Optional usage |
| Enums | Are enums rich (with behavior)? | Check enum methods |
| Equals/HashCode | Are they properly implemented? | Check for @Override equals/hashCode |

### Metrics Collection

```bash
# Immutability indicators
grep -r "private final" output/
grep -r "public void set" output/  # Should be minimal/none for value objects

# Static factory methods
grep -rE "public static .* (of|from|create|valueOf)\(" output/

# Builder pattern
grep -r "public static class.*Builder" output/
grep -r "\.builder()" output/

# Defensive copies
grep -rE "List\.copyOf|Collections\.unmodifiable|new ArrayList<>\(" output/

# Validation
grep -rE "if \(.*null|IllegalArgumentException|Objects\.requireNonNull" output/

# Optional usage
grep -r "Optional<" output/

# Enum with methods
grep -A10 "public enum" output/  # Look for methods in enum

# Equals/hashCode
grep -r "@Override" output/ | grep -E "equals|hashCode"
```

### Bloch-Specific Evaluation

| Item | Points | What to Look For |
|------|--------|------------------|
| Item 1: Static factories over constructors | 10 | `Money.of(100, USD)` not `new Money(100, USD)` |
| Item 2: Builder for many params | 10 | Order.builder().customerId().build() |
| Item 10: Override equals properly | 5 | Correct implementation |
| Item 11: Override hashCode with equals | 5 | Consistent with equals |
| Item 15: Minimize mutability | 15 | Value objects are immutable |
| Item 17: Design for inheritance or prohibit | 5 | Final classes or documented extension |
| Item 50: Defensive copies | 10 | getItems() returns copy |
| Item 49: Check parameters | 10 | Validate in constructors |
| Item 54: Return empty collections, not null | 10 | Never return null for collections |
| Item 64: Refer to objects by interfaces | 10 | List not ArrayList in APIs |
| Rich domain model | 10 | Behavior in domain objects, not anemic |

---

## Experiment 10: Legacy Code Testing (Python)

### Requirements (Identical for Both)

```
We have an existing Python data processor that:
- Reads JSON files from a directory
- Validates required fields
- Transforms and normalizes data
- Saves to SQLite database
- Sends email notifications on errors

Current code works but has no tests. We need to:
1. Add tests without changing external behavior
2. Make minimal changes to enable testing

The processor handles: file I/O, validation, transformation,
database writes, and email sending - all in one function.

Provide a testing strategy and implement it.
```

### What We're Measuring

| Aspect | Question | How to Measure |
|--------|----------|----------------|
| Seams Created | How many injection points? | Count interfaces/protocols |
| Characterization Tests | Does it test current behavior first? | Look for "characterization" tests |
| Dependency Injection | Are dependencies injectable? | Check constructors |
| Test Isolation | Can tests run without real I/O? | Check for mocks |
| Behavior Preservation | Is refactoring verified? | Check test assertions match original |

---

## Running the Experiments

### Setup: Two Completely Isolated Environments

**CRITICAL: The vanilla baseline must have ZERO access to claude-optimal.**

**Environment A (Canon):**
```
~/experiment-canon/
├── .claude/
│   ├── CLAUDE.md         # Full canon stack + auto-invoke rules
│   └── skills/           # All canon skills copied here
└── src/
```

Use `cc-config profile apply` to set up, or manually copy:
- CLAUDE.md with canon stack and auto-invoke rules
- Skills from claude-optimal/canon/

**Environment B (Vanilla) - COMPLETELY CLEAN:**
```
~/experiment-vanilla/
└── src/                  # Empty project, NO .claude directory
```

**Vanilla setup checklist:**
- [ ] NO `~/.claude/CLAUDE.md` (rename/move if exists)
- [ ] NO `~/.claude/skills/` (rename/move if exists)
- [ ] NO project `.claude/` directory
- [ ] NO project `CLAUDE.md`
- [ ] Fresh Claude Code session with no prior context

**How to create a clean vanilla environment:**

**Option A: Use CLI flags (RECOMMENDED - no file moves needed)**
```bash
mkdir -p ~/experiment-vanilla
cd ~/experiment-vanilla

# Start Claude with no skills and no user config
claude --disable-slash-commands --setting-sources local
```

**Option B: Isolate HOME (most thorough)**
```bash
mkdir -p /tmp/vanilla-experiment
cd /tmp/vanilla-experiment
HOME=/tmp/vanilla-experiment claude
# Claude sees completely fresh environment
```

**Option C: Temporarily move config**
```bash
# 1. Backup global config
mv ~/.claude ~/.claude-backup-for-experiment

# 2. Run experiment
mkdir -p ~/experiment-vanilla && cd ~/experiment-vanilla
claude

# 3. Restore after
mv ~/.claude-backup-for-experiment ~/.claude
```

**Why this matters:**
- Claude reads `~/.claude/CLAUDE.md` automatically
- Global skills in `~/.claude/skills/` are available in all sessions
- Any canon exposure contaminates the baseline

### Protocol

1. Generate random run order (A-B-A-B or B-A-B-A)
2. For each run:
   - Start fresh session
   - Paste identical prompt
   - Let Claude complete without intervention
   - Save all output files
   - Clear session
3. Blind the outputs (rename folders to run1, run2, etc.)
4. **Score with Gemini** (see Scoring section below)
5. Collect automated metrics (grep, static analysis)
6. Reveal conditions and analyze

### Scoring with Gemini

Use Gemini as the evaluator to avoid "Claude judging Claude" bias.

**Scoring prompt template:**

```
Score this code against the following rubric. Return ONLY a JSON object
with scores and brief justifications.

RUBRIC:
[paste experiment-specific rubric]

CODE TO EVALUATE:
[paste output code]

Return format:
{
  "scores": {
    "criterion_name": { "score": N, "max": M, "reason": "brief reason" },
    ...
  },
  "total": N,
  "max_total": M,
  "summary": "one paragraph overall assessment"
}
```

**Using the MCP integration:**

```javascript
// Via gemini-reviewer MCP
const result = await mcp__gemini_reviewer__gemini_review({
  code: outputCode,
  context: `Score against Bloch's Effective Java principles:
    - Item 1: Static factories (10 pts)
    - Item 15: Immutability (15 pts)
    - Item 49: Parameter validation (10 pts)
    - Item 50: Defensive copies (10 pts)
    ...`,
  focus: "general"
});
```

**Why Gemini:**
- Independent model (no self-evaluation bias)
- Already integrated via MCP
- Can follow structured rubrics
- Provides consistent scoring across runs

### Sample Size

- Minimum: 3 runs per condition per experiment
- Recommended: 5 runs per condition per experiment
- Total: 10 experiments × 2 conditions × 5 runs = 100 runs

---

## Analysis

### Per-Experiment

For each experiment, calculate:
- Mean score per condition
- Standard deviation
- t-test for significance (p < 0.05)
- Effect size (Cohen's d)

### Aggregate

- Overall quality improvement percentage
- Categories with largest differences
- Consistency (variance within condition)

### Qualitative

- Expert review of sample outputs
- Pattern usage documentation
- Failure mode classification

---

## Hypothesis

We expect canon-guided Claude to show improvement in:

| Category | Expected Effect | Rationale |
|----------|-----------------|-----------|
| Security | Large | Schneier/OWASP provide explicit checklists |
| Java Domain Model | Large | Bloch's items are specific and measurable |
| Angular Patterns | Medium-Large | Hevery/Papa provide clear modern patterns |
| Structure | Medium-Large | Bloch/Liskov provide decomposition principles |
| Framework Idioms | Medium | Domain experts provide specific patterns |
| Testing | Medium | Dodds provides clear philosophy |
| Documentation | Medium | Procida/Diátaxis provides structure |

We do NOT expect canon to help with:
- Basic syntax correctness
- Simple CRUD operations
- Tasks with single obvious solution

### Experiment Summary

| Exp | Domain | Canon Tested |
|-----|--------|--------------|
| 1 | Healthcare API (Java) | Bloch, HIPAA awareness |
| 2 | Password Reset (Node) | Schneier, OWASP |
| 3 | React Data Table | Abramov |
| 4 | Shopping Cart + Tests | Dodds |
| 5 | Go URL Shortener | Pike |
| 6 | API Documentation | Procida |
| 7 | D3 Visualization | Bostock, Tufte |
| 8 | **Angular Dashboard** | **Hevery, Papa, Kurata** |
| 9 | **Java Domain Model** | **Bloch (direct)** |
| 10 | Legacy Python Testing | Feathers |
