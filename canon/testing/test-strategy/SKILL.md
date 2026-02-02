---
name: test-strategy
description: "Test pyramid, testing strategy, and when to use which test type"
---

# Martin Fowler - Testing Strategy

Apply Martin Fowler's testing philosophy for balanced, effective test suites.

## Core Philosophy

### The Test Pyramid

```
         /\
        /  \        E2E / UI Tests
       /    \       (few, slow, brittle)
      /──────\
     /        \     Integration Tests
    /          \    (some, moderate speed)
   /────────────\
  /              \  Unit Tests
 /                \ (many, fast, stable)
/──────────────────\
```

**Key Insight:** More tests at the bottom, fewer at the top.

### Why a Pyramid?

| Level | Speed | Cost to Write | Cost to Maintain | Confidence |
|-------|-------|---------------|------------------|------------|
| Unit | Fast (ms) | Low | Low | Component works |
| Integration | Medium (s) | Medium | Medium | Components work together |
| E2E | Slow (min) | High | High | System works for user |

### The Anti-Pattern: Ice Cream Cone

```
     ──────────────
    /              \   Manual Testing
   /────────────────\
  /                  \ E2E Tests
 /────────────────────\
/                      \ Integration
──────────────────────── Unit (few)
```

**Problem:** Slow feedback, high maintenance, flaky tests.

---

## Test Types Defined

### Unit Tests

Test a single unit (class, function) in isolation.

```java
// Unit test - no external dependencies
@Test
void calculateDiscount_goldCustomer_returns15Percent() {
    DiscountCalculator calc = new DiscountCalculator();

    double discount = calc.calculate(100.0, CustomerType.GOLD);

    assertEquals(15.0, discount, 0.01);
}
```

**Characteristics:**
- Fast (milliseconds)
- No I/O (database, network, filesystem)
- Test one thing
- Use test doubles for dependencies

### Integration Tests

Test how components work together.

```java
// Integration test - tests real database interaction
@Test
void userRepository_savesAndRetrieves() {
    UserRepository repo = new UserRepository(testDatabase);
    User user = new User("alice@test.com");

    repo.save(user);
    User found = repo.findByEmail("alice@test.com");

    assertEquals("alice@test.com", found.getEmail());
}
```

**Characteristics:**
- Slower (seconds)
- Tests real interactions
- May use test containers or in-memory databases
- Tests component boundaries

### E2E Tests

Test complete user journeys through the system.

```java
// E2E test - tests full user flow
@Test
void userCanCompleteCheckout() {
    browser.navigateTo("/products");
    browser.click("#add-to-cart-widget-1");
    browser.click("#checkout");
    browser.fillForm("#payment-form", validCard);
    browser.click("#submit-order");

    assertThat(browser.getCurrentUrl()).contains("/order-confirmation");
    assertThat(browser.getText("#confirmation")).contains("Order placed");
}
```

**Characteristics:**
- Slow (minutes)
- Tests real user scenarios
- Most likely to be flaky
- Catches integration issues unit tests miss

---

## When to Use Which

### Use Unit Tests For

- **Business logic** - calculations, validations, transformations
- **Edge cases** - null handling, boundary conditions
- **Algorithms** - sorting, searching, parsing
- **Fast feedback** - run on every save

```java
// Good unit test candidates
class PriceCalculator { /* pure logic */ }
class EmailValidator { /* validation rules */ }
class DateFormatter { /* transformations */ }
```

### Use Integration Tests For

- **Database access** - repositories, queries
- **External services** - APIs, message queues
- **Component interactions** - service layer calling repository
- **Configuration** - Spring wiring, dependency injection

```java
// Good integration test candidates
class UserRepository { /* database access */ }
class PaymentGateway { /* external API */ }
class OrderService { /* orchestrates multiple components */ }
```

### Use E2E Tests For

- **Critical user journeys** - checkout, login, signup
- **Smoke tests** - "does the app start?"
- **Contract verification** - does the UI match the API?
- **Regression for complex flows** - multi-step wizards

```java
// Good E2E test candidates
- Complete checkout flow
- User registration and login
- Search and filter results
- Critical business workflows
```

---

## Practical Guidelines

### The 70/20/10 Rule (approximate)

- **70% Unit Tests** - Fast, focused, many
- **20% Integration Tests** - Key boundaries
- **10% E2E Tests** - Critical paths only

### Test at the Right Level

```
WRONG: E2E test for validation logic
────────────────────────────────────
browser.fillInput("#email", "invalid");
browser.click("#submit");
expect(browser.getText(".error")).toBe("Invalid email");
// Slow, brittle, overkill for simple validation

RIGHT: Unit test for validation logic
────────────────────────────────────
@Test
void validate_invalidEmail_returnsFalse() {
    assertFalse(EmailValidator.isValid("invalid"));
}
// Fast, focused, easy to maintain
```

### Don't Duplicate Coverage

```
If unit tests cover the logic ──► Don't repeat in integration
If integration tests cover the flow ──► Don't repeat in E2E
```

### The Sociable vs Solitary Unit Test

**Solitary (London School):** Mock all collaborators

```java
@Test
void orderService_appliesDiscount() {
    DiscountService mockDiscount = mock(DiscountService.class);
    when(mockDiscount.calculate(any())).thenReturn(10.0);

    OrderService orders = new OrderService(mockDiscount);
    Order order = orders.create(items);

    assertEquals(90.0, order.getTotal());
}
```

**Sociable (Detroit School):** Use real collaborators when simple

```java
@Test
void orderService_appliesDiscount() {
    DiscountService realDiscount = new DiscountService();  // Simple, no I/O

    OrderService orders = new OrderService(realDiscount);
    Order order = orders.create(items);

    assertEquals(90.0, order.getTotal());
}
```

**Fowler's View:** Both are valid. Use solitary when collaborators are complex or slow. Use sociable when collaborators are simple and fast.

---

## Test Isolation Strategies

### Database Tests

```java
// Option 1: In-memory database (fast)
@BeforeEach
void setUp() {
    database = new H2Database();  // In-memory
}

// Option 2: Test containers (realistic)
@Container
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>();

// Option 3: Transaction rollback
@Transactional
@Test
void test() {
    // Changes rolled back after test
}
```

### External Service Tests

```java
// Option 1: Mock the client
PaymentClient mockClient = mock(PaymentClient.class);

// Option 2: Fake server (WireMock, MockServer)
@BeforeEach
void setUp() {
    stubFor(post("/charge")
        .willReturn(ok().withBody("{\"status\":\"success\"}")));
}

// Option 3: Contract tests (Pact)
@Pact(consumer = "OrderService")
RequestResponsePact chargeCard(PactDslWithProvider builder) {
    return builder
        .given("valid card")
        .uponReceiving("charge request")
        .path("/charge")
        .method("POST")
        .willRespondWith()
        .status(200)
        .build();
}
```

---

## Continuous Integration Strategy

### Fast Feedback Loop

```
On every commit:
├── Unit tests (< 5 min)
└── Fast integration tests (< 10 min)

On PR/merge:
├── Full integration tests (< 30 min)
└── E2E smoke tests (< 15 min)

Nightly:
└── Full E2E suite (hours OK)
```

### Test Selection

```bash
# Quick feedback during development
mvn test -Dgroups=unit

# Before push
mvn test -Dgroups=unit,integration

# Full suite
mvn test
```

---

## Code Review Checklist

### Test Level
- [ ] Logic tested at unit level?
- [ ] Boundaries tested at integration level?
- [ ] Critical paths tested at E2E level?
- [ ] No duplicate coverage across levels?

### Test Quality
- [ ] Tests are fast enough for their level?
- [ ] Tests are deterministic (not flaky)?
- [ ] Tests are independent (no shared state)?
- [ ] Test names describe the behavior?

### Coverage
- [ ] Happy path covered?
- [ ] Error cases covered?
- [ ] Edge cases covered at unit level?
- [ ] Key user journeys covered at E2E level?

---

## Quick Reference

| Question | Answer |
|----------|--------|
| How to test business logic? | Unit test |
| How to test database queries? | Integration test |
| How to test API contracts? | Integration test with mocks |
| How to test user flows? | E2E test (sparingly) |
| How to test validation? | Unit test |
| How to test error handling? | Unit + integration |
| Tests too slow? | Move down the pyramid |
| Tests too brittle? | Move down the pyramid |
| Missing bugs in production? | Add integration tests |

---

## Key Principles

1. **Write tests at the lowest level that gives confidence**
2. **Unit tests for logic, integration tests for boundaries**
3. **E2E tests are expensive - use sparingly for critical paths**
4. **Fast tests run more often, catch bugs earlier**
5. **Flaky tests destroy trust - fix or delete them**

---

## Resources

- [TestPyramid](https://martinfowler.com/bliki/TestPyramid.html)
- [IntegrationTest](https://martinfowler.com/bliki/IntegrationTest.html)
- [UnitTest](https://martinfowler.com/bliki/UnitTest.html)
- [Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
