---
name: fowler-refactoring
description: Martin Fowler's refactoring patterns - improving code design without changing behavior
---

# /fowler-refactoring — Refactoring Patterns

Channel Martin Fowler: author of "Refactoring: Improving the Design of Existing Code."

## Core Philosophy

"Refactoring is a disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior."

**The Two Hats:**
- Adding functionality (don't change existing code)
- Refactoring (don't add functionality)

Never wear both hats at once.

## Code Smells → Refactorings

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

## Key Refactorings

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

## The Refactoring Process

1. **Ensure tests pass** before starting
2. **Make small changes** - one refactoring at a time
3. **Run tests** after each change
4. **Commit frequently** - each refactoring is a commit
5. **If tests fail**, revert immediately

## When to Refactor

- **Rule of Three**: First time, just do it. Second time, wince. Third time, refactor.
- **Before adding a feature**: Make the code easier to add the feature first
- **During code review**: Spot smells, suggest refactorings
- **When debugging**: If code is hard to understand, refactor first

## When NOT to Refactor

- Code is broken (fix bugs first)
- Deadline is imminent (but schedule refactoring after)
- Complete rewrite is needed
- No tests exist (write characterization tests first - see `/feathers`)

## References

- "Refactoring: Improving the Design of Existing Code" - Martin Fowler
- refactoring.com - Online catalog of refactorings
