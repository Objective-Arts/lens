# Testing Experiment Scorecard (Experiment 4)

**Run ID:** ________________
**Condition:** [ ] Canon  [ ] Vanilla
**Evaluator:** ________________
**Date:** ________________

---

## Testing Philosophy (40 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| Tests behavior, not implementation | 15 | | |
| No testing of implementation details | 10 | | |
| Tests resemble how users use the code | 10 | | |
| High confidence-to-maintenance ratio | 5 | | |
| **Subtotal** | 40 | | |

**Implementation details tested (bad):**
- [ ] Internal state inspection
- [ ] Private method testing
- [ ] Mock verification overkill
- [ ] Testing specific internal calls

---

## Test Structure (30 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| Clear test names describing scenario | 10 | | |
| Single assertion per test (cohesive) | 10 | | |
| No logic in tests (no if/loops) | 5 | | |
| Tests are independent (no order dependency) | 5 | | |
| **Subtotal** | 30 | | |

### Test Naming Sample

List 3 test names from the output:

1. ________________ [ ] Good [ ] Vague
2. ________________ [ ] Good [ ] Vague
3. ________________ [ ] Good [ ] Vague

**Good example:** `it('should apply percentage discount to subtotal')`
**Bad example:** `it('test discount')` or `it('works')`

---

## Coverage (30 points)

| Criterion | Pts | Score | Notes |
|-----------|-----|-------|-------|
| Happy path covered | 10 | | |
| Edge cases covered | 10 | | |
| Error cases covered | 10 | | |
| **Subtotal** | 30 | | |

### Specific Coverage Checklist

**Happy Path:**
- [ ] Add item to cart
- [ ] Remove item from cart
- [ ] Update quantity
- [ ] Apply coupon
- [ ] Calculate total with tax

**Edge Cases:**
- [ ] Empty cart operations
- [ ] Zero quantity
- [ ] Negative price (should error)
- [ ] Very large quantities
- [ ] Floating point precision
- [ ] Multiple same items
- [ ] Coupon at exactly minimum purchase

**Error Cases:**
- [ ] Invalid product (missing fields)
- [ ] Negative quantity
- [ ] Non-existent product removal
- [ ] Expired coupon
- [ ] Invalid coupon type
- [ ] Coupon below minimum purchase

---

## Test Isolation

| Issue | Present? |
|-------|----------|
| Shared state between tests | [ ] Yes [ ] No |
| beforeAll with mutations | [ ] Yes [ ] No |
| Test order dependency | [ ] Yes [ ] No |
| Global variable mutation | [ ] Yes [ ] No |

---

## Quantitative Metrics

| Metric | Value |
|--------|-------|
| Total test count | |
| Tests with clear names | |
| Tests with multiple assertions | |
| beforeEach/afterEach usage | |
| Mock/spy count | |

---

## TOTAL SCORE: _____ / 100

---

## Qualitative Assessment

**Strongest aspect of tests:** ________________

**Weakest aspect of tests:** ________________

**Would these tests catch real bugs?** [ ] Yes [ ] Some [ ] Unlikely

**Dodds principles applied?**
- [ ] "The more your tests resemble the way your software is used, the more confidence they can give you"
- [ ] "Test behavior, not implementation"
- [ ] "Avoid testing implementation details"
- [ ] "Write fewer, larger integration tests"
