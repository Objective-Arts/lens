# Java Domain Model Scorecard (Experiment 9)

**Run ID:** ________________ (blind)
**Evaluator:** ________________
**Date:** ________________

---

## Effective Java Items Applied

### Creating & Destroying Objects (20 points)

| Item | Pts | Score | Evidence |
|------|-----|-------|----------|
| Item 1: Static factories over constructors | 10 | | |
| Item 2: Builder for many parameters | 10 | | |
| **Subtotal** | 20 | | |

**Look for:**
- `Money.of(amount, currency)` not `new Money(amount, currency)`
- `Order.builder().customerId(x).build()`

**grep results:**
- Static factory methods (`of(`, `from(`, `create(`): ____
- Builder classes: ____
- Public constructors (fewer is often better): ____

---

### Classes and Interfaces (25 points)

| Item | Pts | Score | Evidence |
|------|-----|-------|----------|
| Item 15: Minimize mutability | 15 | | |
| Item 17: Design for inheritance or prohibit | 5 | | |
| Item 64: Refer to objects by interfaces | 5 | | |
| **Subtotal** | 25 | | |

**Immutability check for Money class:**
- [ ] All fields `private final`
- [ ] No setters
- [ ] Returns new instance on "modification"

**grep results:**
- `private final` count: ____
- `public void set` count: ____ (should be 0 for value objects)
- `final class` count: ____

---

### Methods (20 points)

| Item | Pts | Score | Evidence |
|------|-----|-------|----------|
| Item 49: Check parameters for validity | 10 | | |
| Item 50: Make defensive copies | 10 | | |
| **Subtotal** | 20 | | |

**Validation patterns:**
- [ ] `Objects.requireNonNull()` used
- [ ] `IllegalArgumentException` for invalid args
- [ ] Validation in constructors

**Defensive copies:**
- [ ] `getItems()` returns copy, not internal list
- [ ] Collections stored via copy, not reference

**grep results:**
- `Objects.requireNonNull`: ____
- `IllegalArgumentException`: ____
- `List.copyOf(` or `Collections.unmodifiable`: ____

---

### General Programming (20 points)

| Item | Pts | Score | Evidence |
|------|-----|-------|----------|
| Item 10: Override equals consistently | 5 | | |
| Item 11: Override hashCode with equals | 5 | | |
| Item 54: Return empty collections, not null | 5 | | |
| Item 55: Return optionals judiciously | 5 | | |
| **Subtotal** | 20 | | |

**grep results:**
- `@Override` + `equals`: ____
- `@Override` + `hashCode`: ____
- `Collections.emptyList()` or `List.of()`: ____
- `Optional<`: ____
- `return null` for collections: ____ (should be 0)

---

### Domain Richness (15 points)

| Criterion | Pts | Score | Evidence |
|-----------|-----|-------|----------|
| Rich enums (with behavior) | 5 | | |
| Behavior in domain objects | 5 | | |
| State transition validation | 5 | | |
| **Subtotal** | 15 | | |

**OrderStatus enum analysis:**
- [ ] Has methods beyond name()/ordinal()
- [ ] Validates allowed transitions
- [ ] Example: `canTransitionTo(OrderStatus next)`

**Order class behavior:**
- [ ] `addItem()` validates state
- [ ] `confirm()` changes state
- [ ] `calculateTotal()` is behavior, not just getter

---

## TOTAL SCORE: _____ / 100

---

## Code Inventory

| Class | Mutable? | Has Builder? | Static Factories? |
|-------|----------|--------------|-------------------|
| Order | | | |
| OrderItem | | | |
| Money | | | |
| OrderStatus | N/A (enum) | N/A | |

---

## Qualitative Notes

**Most Bloch-like aspect:**

_________________________________

**Least Bloch-like aspect:**

_________________________________

**Is this an anemic domain model?**
[ ] Yes (just getters/setters)
[ ] No (has real behavior)

---

## Post-Reveal

**Condition:** [ ] Canon [ ] Vanilla

**Were Bloch patterns explicitly mentioned in code/comments?** [ ] Yes [ ] No

**Specific items referenced:** ____________________
