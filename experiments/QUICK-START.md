# Running the Experiments: Quick Start

## Setup

### CRITICAL: Isolate Vanilla Environment

The vanilla baseline must have **ZERO** access to claude-optimal. This includes:
- No global `~/.claude/CLAUDE.md`
- No global `~/.claude/skills/`
- No project-level CLAUDE.md or skills

### 1. Create Canon Environment

```bash
# Canon-guided environment
mkdir -p ~/experiment-canon
cd ~/experiment-canon

# Option A: Use cc-config (if installed)
cc-config profile apply java -p .           # For Java experiment
cc-config profile apply angular-17 -p .     # For Angular experiment

# Option B: Manual setup
mkdir -p .claude/skills
cp -r /path/to/claude-optimal/canon/bloch .claude/skills/
cp /path/to/claude-optimal/profiles/java-CLAUDE.md ./CLAUDE.md
```

### 2. Create COMPLETELY CLEAN Vanilla Environment

**Option A: CLI flags (RECOMMENDED - no backup needed)**
```bash
mkdir -p ~/experiment-vanilla
cd ~/experiment-vanilla

# Start with skills disabled and user config ignored
claude --disable-slash-commands --setting-sources local
```

**Option B: Isolated HOME**
```bash
mkdir -p /tmp/vanilla-experiment
cd /tmp/vanilla-experiment
HOME=/tmp/vanilla-experiment claude
```

**Option C: Move config (if flags don't work)**
```bash
# Backup
mv ~/.claude ~/.claude-backup-for-experiment

# Run
mkdir -p ~/experiment-vanilla && cd ~/experiment-vanilla
claude

# Restore after
mv ~/.claude-backup-for-experiment ~/.claude
```

### 2. Randomize Run Order

Flip a coin or use:
```bash
echo $((RANDOM % 2))  # 0 = vanilla first, 1 = canon first
```

---

## Running an Experiment

### Protocol for Each Run

1. **Start fresh Claude Code session** in the appropriate directory
2. **Paste the exact prompt** from EXPERIMENT-DESIGN.md
3. **Do not intervene** - let Claude complete naturally
4. **Save all output** to a numbered folder
5. **Clear session** before next run

### Example: Experiment 2 (Password Reset)

```bash
# Run 1: Vanilla
cd ~/experiment-vanilla
claude  # start session
# paste prompt, wait for completion
# save outputs to experiments/outputs/exp2/run1/

# Run 2: Canon
cd ~/experiment-canon
claude  # start session
# paste prompt, wait for completion
# save outputs to experiments/outputs/exp2/run2/

# Continue alternating...
```

---

## The Prompts

Copy these exactly - do not modify:

### Experiment 1: Healthcare API

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

### Experiment 2: Password Reset

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

### Experiment 4: Shopping Cart with Tests

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

### Experiment 8: Angular Dashboard

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

### Experiment 9: Java Domain Model

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

See EXPERIMENT-DESIGN.md for all 10 prompts.

---

## Collecting Metrics

After all runs, use these commands:

### Experiment 1 (Healthcare API)

```bash
# File count
find run1/ -name "*.java" | wc -l

# Thread safety check
grep -r "SimpleDateFormat" run1/  # Bad if found as instance field
grep -r "DateTimeFormatter" run1/  # Good (immutable)

# PHI in logs
grep -rE "logger\.(info|warn).*get(Name|Ssn)" run1/
```

### Experiment 2 (Password Reset)

```bash
# Crypto usage
grep -r "crypto.randomBytes" run1/  # Good
grep -r "Math.random" run1/         # Bad

# Token hashing
grep -r "bcrypt\|argon2" run1/

# Rate limiting
grep -r "rateLimit" run1/
```

### Experiment 4 (Shopping Cart Tests)

```bash
# Test count
grep -c "it(\|test(" run1/*.test.js

# Test isolation issues
grep "beforeAll" run1/*.test.js
```

### Experiment 8 (Angular)

```bash
# Modern patterns
grep -r "standalone: true" run1/
grep -rE "signal\(|computed\(" run1/
grep -r "inject(" run1/
grep -r "ChangeDetectionStrategy.OnPush" run1/

# Reactive patterns
grep -r "| async" run1/*.html
grep -r "takeUntilDestroyed" run1/
grep -r ".subscribe(" run1/*.component.ts  # lower is better
```

### Experiment 9 (Java Bloch)

```bash
# Static factories
grep -rE "public static .* (of|from|create)\(" run1/

# Immutability
grep -r "private final" run1/
grep -r "public void set" run1/  # should be 0 for value objects

# Defensive copies
grep -rE "List\.copyOf|Collections\.unmodifiable" run1/

# Validation
grep -r "Objects.requireNonNull" run1/
grep -r "IllegalArgumentException" run1/

# Equals/hashCode
grep -B1 "public boolean equals" run1/
grep -B1 "public int hashCode" run1/
```

---

## Scoring with Gemini

Use Gemini (not Claude) as the evaluator to avoid self-evaluation bias.

### Via MCP Tool

```javascript
// Score Java code
const result = await mcp__gemini_reviewer__gemini_review({
  code: outputCode,
  context: "Score against Bloch's Effective Java: static factories (10 pts), immutability (15 pts), defensive copies (10 pts)...",
  focus: "general"
});
```

### Via Direct Prompt

See `experiments/scoring/gemini-prompts.md` for copy-paste prompts for each experiment type.

### Scoring Protocol

1. Blind the outputs (rename run1, run2, etc.)
2. Concatenate all code files for a run
3. Send to Gemini with experiment-specific rubric
4. Parse JSON scores
5. Record in spreadsheet
6. Reveal conditions after all scoring complete

---

## Automated Metrics

Run alongside Gemini scoring:

---

## Results Template

| Experiment | Run | Condition | Score | Notes |
|------------|-----|-----------|-------|-------|
| Exp 1 | 1 | ? | | |
| Exp 1 | 2 | ? | | |
| Exp 1 | 3 | ? | | |
| ... | | | | |

After revealing:

| Experiment | Canon Mean | Vanilla Mean | Δ | p-value |
|------------|------------|--------------|---|---------|
| Exp 1 | | | | |
| Exp 2 | | | | |
| ... | | | | |
