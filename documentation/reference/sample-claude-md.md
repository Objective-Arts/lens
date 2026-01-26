# Sample CLAUDE.md

This is a reference example showing how Baseline Brain and Auto-Invoke Canon work together.

---

```markdown
# Project: Payment Service (C#/.NET)

## Baseline Brain (Always Active)

These six masters create productive tensions that shape every decision.

### Kernighan — Clarity Above All

> "Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it."

**Apply to this project:**
- Method names are complete sentences: `ChargeCustomerCard`, not `Process` or `DoPayment`
- No abbreviations except industry-standard (`API`, `HTTP`, `JSON`)
- Comments explain WHY, never WHAT (the code shows what)
- If a method needs a comment to explain what it does, rename the method
- One concept per function. `ValidateAndCharge()` → `Validate()` then `Charge()`

### Thompson — Pragmatic Simplicity

> "When in doubt, use brute force."

**Apply to this project:**
- Don't create abstractions until the third concrete use
- A 20-line switch statement is better than a clever polymorphic hierarchy you'll use once
- Optimize for reading, not writing. You write code once; you read it hundreds of times
- If the simple solution works and performs adequately, ship it
- "We might need this later" is not a reason to build it now

### Pike — Minimal Interfaces

> "A little copying is better than a little dependency."

**Apply to this project:**
- Public interfaces expose the minimum necessary. Start with nothing; add only what's demanded
- Prefer composition over inheritance. Inherit for "is-a"; compose for everything else
- Don't share code between services just to avoid duplication—shared code creates coupling
- Each package/namespace does ONE thing. If you need "and" to describe it, split it
- Data flows in one direction. No circular dependencies between modules

### Joy — Design for Failure

> "Software eventually fails. Hardware eventually fails. Humans are eventually unavailable."

**Apply to this project:**
- Every external call (Stripe, database, message queue) WILL fail. Handle it explicitly
- Timeouts on everything: HTTP calls (30s), database queries (5s), locks (100ms)
- Retry with exponential backoff: 100ms, 200ms, 400ms, then fail
- Circuit breakers prevent cascade failures. If Stripe is down, fail fast—don't queue up requests
- Log enough to diagnose failures without exposing sensitive data
- Every error path is tested. If you haven't tested the failure case, it doesn't work

### Linus — Data Structures First

> "Bad programmers worry about the code. Good programmers worry about data structures and their relationships."

**Apply to this project:**
- Design the data structure BEFORE writing algorithms. The right structure makes algorithms obvious
- `PaymentResult` with `Success/Failed/Pending` status eliminates null checks throughout the codebase
- Value objects (`Money`, `Currency`, `CardToken`) prevent primitive obsession
- If you have special cases, your data structure is wrong. Redesign until edge cases disappear
- Immutable by default. Mutation is a code smell requiring justification

### Dijkstra — Correctness by Construction

> "Program testing can be used to show the presence of bugs, but never to show their absence."

**Apply to this project:**
- State invariants explicitly: "Amount is always positive", "Currency is always valid ISO 4217"
- Make illegal states unrepresentable. A `ChargedPayment` type cannot exist without a `ChargeId`
- Money uses `decimal`, never `float` or `double`. This is non-negotiable
- Idempotency keys ensure exactly-once processing. Retries are safe by design
- If the compiler can catch it, don't rely on tests. Use the type system

### Productive Tensions

These masters sometimes disagree. Resolve tensions explicitly:

| Tension | Resolution for This Project |
|---------|----------------------------|
| Thompson (simple) vs Dijkstra (correct) | For payment logic: Dijkstra wins. Correctness over simplicity. For internal tooling: Thompson wins. |
| Pike (minimal) vs Joy (resilient) | Resilience is part of the minimal interface. A payment API that doesn't handle failures isn't minimal—it's incomplete. |
| Kernighan (clear) vs Linus (data-first) | They agree. Good data structures make code clearer. If your data structure requires complex code, redesign the structure. |

---

## Base Practices (Always Active)

### Security — Think Like an Attacker (Schneier + OWASP)

> "Security is a process, not a product."

**Every input is hostile until validated:**
- Card numbers: Luhn check + format validation before touching Stripe
- Amounts: Positive, within limits, correct decimal places for currency
- Currency codes: Whitelist of supported ISO 4217 codes, not blacklist
- Webhook payloads: Verify Stripe signature BEFORE parsing JSON

**OWASP Top 10 applied:**
- SQL injection: Parameterized queries only. No string concatenation. Ever.
- XSS: Not applicable (API only), but sanitize any data that might reach a frontend
- Sensitive data exposure: PCI compliance. No card numbers in logs. Mask in error messages
- Broken auth: API keys in environment variables, never in code. Rotate quarterly

**Secrets management:**
- No secrets in source control. Use environment variables or vault
- Different keys for dev/staging/prod
- Log when secrets are accessed (audit trail)

### Testing — The Testing Trophy (Dodds + Meszaros)

> "Write tests. Not too many. Mostly integration."

**Test distribution for this project:**
```
        ┌───────────┐
        │   E2E     │  Few: Critical payment flows only
        │   (10%)   │  - Successful charge end-to-end
        ├───────────┤  - Refund end-to-end
        │           │
        │Integration│  Most: Real service interactions
        │   (60%)   │  - Stripe API (test mode)
        │           │  - Database transactions
        ├───────────┤  - Message queue publishing
        │   Unit    │
        │   (30%)   │  Some: Pure business logic
        │           │  - Money calculations
        └───────────┘  - Validation rules
```

**Meszaros test patterns:**
- Arrange-Act-Assert structure for every test
- One assertion per test (conceptually—multiple asserts on same object OK)
- Test doubles: Use fakes for Stripe (test mode), stubs for config, mocks sparingly
- Test names describe behavior: `Charge_WithExpiredCard_ReturnsDeclined`

**What to test:**
- Happy path (charge succeeds)
- Each failure mode (card declined, network timeout, invalid currency)
- Edge cases (zero amount, maximum amount, currency with 0 decimal places like JPY)
- Idempotency (same request twice returns same result)

### Engineering Discipline — Learn from Failure (Petroski + Leveson + Taleb)

> "The most important engineering insights come from failure analysis."

**From Petroski (failure as teacher):**
- Every payment failure gets a post-mortem if it affected customers
- Near-misses are documented, not ignored
- "It worked" is not success criteria. "It worked AND we understand why" is

**From Leveson (systems thinking):**
- Payment failures are rarely single-cause. Look for contributing factors
- Human error is a symptom, not a root cause. What allowed the error?
- Defense in depth: Validation → Rate limiting → Idempotency → Monitoring → Alerting

**From Taleb (antifragility):**
- Small failures improve the system. Catch them in staging
- Chaos engineering: Randomly fail Stripe calls in test environment
- Don't just handle errors—benefit from them. Each failure improves retry logic, alerting, documentation

## Auto-Invoke Canon

Load these experts when context matches:

| Context | Action |
|---------|--------|
| C# generics, covariance, language edge cases | INVOKE `/skeet` |
| async/await, Task, CancellationToken, threading | INVOKE `/cleary` |
| API design, immutability, builders, factories | INVOKE `/bloch` |
| Domain modeling, aggregates, value objects | INVOKE `/evans` |
| Refactoring existing code, finding seams | INVOKE `/feathers` |
| Test doubles, fixtures, test organization | INVOKE `/meszaros` |

## Workflow

**New Code**: `/plan` → `/structure-first` → `/build-from-plan` → `/test` → `/review-hard`

**Legacy Code**: `/plan` → `/structure-first` → `/refactor-clean` → `/test` → `/review-hard`

## Anti-Patterns (NEVER DO)

| Anti-Pattern | Why |
|--------------|-----|
| `float` or `double` for money | Precision loss causes real financial errors |
| Catching generic `Exception` | Hides bugs, masks failures |
| Fire-and-forget async | Lost exceptions, silent failures |
| String concatenation for SQL | SQL injection vulnerability |

## Project Standards

- All public APIs have XML documentation
- Payment operations are idempotent (use idempotency keys)
- External service calls: 3 retries, exponential backoff, circuit breaker
- Logs include correlation ID for distributed tracing
```

---

## How This Works in Practice

### Baseline Brain (implicit, always)

When Claude writes code, it automatically asks:

```
Writing a method...
├── Kernighan: Is `ProcessPayment` clearer than `DoPayment`? ✓
├── Pike: Do I need this abstraction or is it premature?
├── Linus: Can my PaymentResult eliminate null checks?
├── Joy: What if Stripe is down? → Add fallback
├── Thompson: Is the simple approach good enough?
└── Dijkstra: What invariants must hold? Amount > 0, Currency valid
```

### Auto-Invoke Canon (explicit, on demand)

When Claude detects context:

```
Task: "Add retry logic to the payment client"

Context detected: async/await, Task, CancellationToken
→ Auto-invoke /cleary

Now Claude applies Stephen Cleary's patterns:
- Use ConfigureAwait(false) in library code
- Pass CancellationToken through the call chain
- Use Polly for retry policies
- Avoid async void except for event handlers
```

### The Combination

```
New payment method request
│
├── Baseline Brain (always active)
│   └── Joy asks: "What if this fails?"
│   └── Dijkstra asks: "What must always be true?"
│
├── Auto-invoke triggered
│   └── /cleary loaded (async patterns)
│   └── /bloch loaded (API design)
│
└── Code written with:
    - Cleary's async best practices
    - Bloch's API design principles
    - Joy's failure handling
    - Dijkstra's invariants
```
