---
name: refactoring
description: Refactoring patterns - improving code design without changing behavior
---

# /refactoring — Refactoring Patterns

Channel Martin Fowler, Michael Feathers, and Joshua Kerievsky.

## Core Philosophy

"Refactoring is a disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior." — Fowler

**The Two Hats:**
- Adding functionality (don't change existing code)
- Refactoring (don't add functionality)

Never wear both hats at once.

**Smell-driven, not pattern-driven.** Identify a smell first. Pick the minimum refactoring to fix it. Never scan for opportunities to introduce patterns.

## Code Smells → Refactorings (Fowler)

### Bloaters

| Smell | Refactoring |
|-------|-------------|
| Long Method | Extract Method, Replace Temp with Query |
| Large Class | Extract Class, Extract Subclass |
| Long Parameter List | Introduce Parameter Object, Preserve Whole Object |
| Data Clumps | Extract Class, Introduce Parameter Object |
| Primitive Obsession | Replace Primitive with Object, Replace Type Code with Class |

### Object-Orientation Abusers

| Smell | Refactoring |
|-------|-------------|
| Switch Statements | Replace Conditional with Polymorphism |
| Parallel Inheritance | Move Method, Move Field |
| Lazy Class | Inline Class, Collapse Hierarchy |
| Speculative Generality | Collapse Hierarchy, Inline Class, Remove Parameter |
| Temporary Field | Extract Class, Introduce Null Object |

### Change Preventers

| Smell | Refactoring |
|-------|-------------|
| Divergent Change | Extract Class |
| Shotgun Surgery | Move Method, Move Field, Inline Class |
| Parallel Inheritance | Move Method, Move Field |

### Dispensables

| Smell | Refactoring |
|-------|-------------|
| Comments (as deodorant) | Extract Method, Rename Method |
| Duplicate Code | Extract Method, Pull Up Method, Form Template Method |
| Dead Code | Remove Dead Code |
| Lazy Class | Inline Class |
| Speculative Generality | Collapse Hierarchy, Remove Parameter |

### Couplers

| Smell | Refactoring |
|-------|-------------|
| Feature Envy | Move Method, Extract Method |
| Inappropriate Intimacy | Move Method, Move Field, Hide Delegate |
| Message Chains | Hide Delegate, Extract Method, Move Method |
| Middle Man | Remove Middle Man, Inline Method |

## Smell → Pattern Mappings (Kerievsky)

Apply patterns **only** when a smell justifies the destination. The smell is the trigger — the pattern is the minimum fix.

| Smell | Refactoring to Pattern | Justification Gate |
|-------|------------------------|-------------------|
| Repeated conditional on type | Replace Conditional with Strategy | 3+ branches on same discriminator |
| Constructor with many combos | Replace Constructors with Builder | 4+ optional parameters, callers use different subsets |
| Notification spaghetti | Replace Hard-Coded Notifications with Observer | 3+ listeners or listeners change at runtime |
| Embedded algorithm varies | Replace Algorithm with Strategy | 2+ variants exist or are imminent |
| Composite structure with type checks | Replace Implicit Tree with Composite | Recursive structure with uniform operations |
| Accumulating decorations | Replace Layered Behavior with Decorator | Behaviors compose independently |
| State-dependent conditionals | Replace State-Altering Conditionals with State | 3+ states with transition logic spread across methods |
| Complex object creation | Replace Constructor with Factory Method | Creation varies by context or subtype |

<never>
Do NOT apply these patterns speculatively. Each row requires the smell to be present AND the justification gate to be met. A single switch statement is not enough for Strategy. Two constructor parameters is not enough for Builder.
</never>

## Working with Untested Code (Feathers)

When code has no tests, you cannot safely refactor. Use these techniques to get tests in place first.

### Characterization Tests

Write tests that document **current behavior**, not intended behavior:

1. Write a test you expect to fail
2. Run it — observe the actual output
3. Change the test to assert the actual output
4. You now have a characterization test that locks existing behavior

Characterization tests are not aspirational. They describe what the code does, not what it should do.

### Finding Seams

A **seam** is a place where you can alter behavior without editing the source. Three types:

| Seam Type | How It Works | When to Use |
|-----------|-------------|-------------|
| **Object seam** | Override method in subclass or pass different implementation | Class with injectable dependency |
| **Link seam** | Swap module/import at build or test time | Module-level dependency |
| **Preprocessing seam** | Conditional compilation or feature flags | Build-time variation |

### Dependency-Breaking Techniques

Use these to get legacy code under test:

| Technique | What It Does |
|-----------|-------------|
| **Extract Interface** | Create interface from class to enable substitution |
| **Parameterize Constructor** | Pass dependency in instead of creating internally |
| **Subclass and Override Method** | Override the problematic method in a test subclass |
| **Extract and Override Call** | Move a hard-to-test call into its own method, override in test |
| **Replace Global Reference with Getter** | Wrap global access in a method you can override |
| **Introduce Instance Delegator** | Replace static method with instance method that delegates to it |

### The Legacy Code Dilemma

To refactor safely, you need tests. To add tests, you often need to refactor. Break the deadlock:

1. Identify the **change point** — where you need to make your change
2. Find the **seams** — places to inject test behavior
3. Break **one dependency** using the simplest technique above
4. Write **characterization tests** around the change point
5. Now refactor safely

## Key Refactorings (Mechanics)

### Extract Method
```javascript
// Before
function printOwing() {
  printBanner();
  // print details
  console.log("name: " + name);
  console.log("amount: " + getOutstanding());
}

// After
function printOwing() {
  printBanner();
  printDetails(getOutstanding());
}

function printDetails(outstanding) {
  console.log("name: " + name);
  console.log("amount: " + outstanding);
}
```

### Replace Conditional with Polymorphism
```javascript
// Before
function getSpeed() {
  switch (this.type) {
    case 'european': return getBaseSpeed();
    case 'african': return getBaseSpeed() - getLoadFactor() * numberOfCoconuts;
    case 'norwegian_blue': return isNailed ? 0 : getBaseSpeed();
  }
}

// After
class European extends Bird {
  getSpeed() { return this.getBaseSpeed(); }
}
class African extends Bird {
  getSpeed() { return this.getBaseSpeed() - this.getLoadFactor() * this.numberOfCoconuts; }
}
class NorwegianBlue extends Bird {
  getSpeed() { return this.isNailed ? 0 : this.getBaseSpeed(); }
}
```

### Introduce Parameter Object
```javascript
// Before
function amountInvoiced(startDate, endDate) { ... }
function amountReceived(startDate, endDate) { ... }
function amountOverdue(startDate, endDate) { ... }

// After
class DateRange {
  constructor(start, end) { this.start = start; this.end = end; }
}
function amountInvoiced(dateRange) { ... }
function amountReceived(dateRange) { ... }
function amountOverdue(dateRange) { ... }
```

### Slide Statements (Fowler, 2nd ed.)
```javascript
// Before — related code is scattered
const price = order.basePrice;
sendConfirmation(order);
const discount = calculateDiscount(price);

// After — related code is together
const price = order.basePrice;
const discount = calculateDiscount(price);
sendConfirmation(order);
```

### Replace Loop with Pipeline (Fowler, 2nd ed.)
```javascript
// Before
const result = [];
for (const person of people) {
  if (person.age > 18) {
    result.push(person.name);
  }
}

// After
const result = people
  .filter(p => p.age > 18)
  .map(p => p.name);
```

### Split Phase
```javascript
// Before — parsing and calculation interleaved
function priceOrder(product, quantity, shippingMethod) {
  const basePrice = product.basePrice * quantity;
  const discount = Math.max(quantity - 500, 0) * product.basePrice * 0.05;
  const shippingCost = calcShipping();
  return basePrice - discount + shippingCost;
}

// After — separated into pricing phase and shipping phase
function priceOrder(product, quantity, shippingMethod) {
  const priceData = calculatePricingData(product, quantity);
  return applyShipping(priceData, shippingMethod);
}
```

## The Refactoring Process

1. **Ensure tests pass** before starting
2. **If no tests exist**, write characterization tests first (Feathers)
3. **Make small changes** — one refactoring at a time
4. **Run tests** after each change
5. **Commit frequently** — each refactoring is a commit
6. **If tests fail**, revert immediately

## When to Refactor

- **Rule of Three**: First time, just do it. Second time, wince. Third time, refactor.
- **Before adding a feature**: Make the code easier to add the feature first (preparatory refactoring)
- **During code review**: Spot smells, suggest refactorings
- **When debugging**: If code is hard to understand, refactor first (comprehension refactoring)

## When NOT to Refactor

- Code is broken (fix bugs first)
- Deadline is imminent (but schedule refactoring after)
- Complete rewrite is needed
- No tests exist and you can't find seams (write characterization tests first)

## Concrete Checks

- [ ] **Smell identified?** Name the specific Fowler smell before choosing a refactoring
- [ ] **Minimum fix?** Is this the smallest refactoring that addresses the smell?
- [ ] **Tests green before?** Did you run tests before touching anything?
- [ ] **Tests green after?** Did you run tests after each individual change?
- [ ] **Pattern justified?** If introducing a GoF pattern, does the Kerievsky justification gate pass?
- [ ] **One hat?** Are you only refactoring, or are you sneaking in behavior changes?

## References

- "Refactoring: Improving the Design of Existing Code" (2nd ed.) — Martin Fowler
- "Working Effectively with Legacy Code" — Michael Feathers
- "Refactoring to Patterns" — Joshua Kerievsky
- refactoring.com — Online catalog of refactorings
