---
name: martin-fowler-refactoring
description: "Martin Fowler's Refactoring - code smells, refactoring patterns, improving design"
---

# Martin Fowler - Refactoring

Apply Martin Fowler's refactoring techniques to improve code design without changing behavior.

## Core Philosophy

### The Definition

> "Refactoring is a disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior."

**Key insight:** Small, behavior-preserving transformations. Never refactor and add features at the same time.

### The Two Hats

> "When you refactor, you wear the refactoring hat. When you add features, you wear the feature hat. Never wear both at once."

```
Refactoring Hat:          Feature Hat:
- No new tests needed     - Add new tests first
- Behavior unchanged      - Behavior changes
- Design improves         - Capabilities expand
- Small, verified steps   - May be larger changes
```

---

## Code Smells

Code smells are indicators that code might benefit from refactoring. They're not bugs—the code works—but suggest design problems.

### The Bloaters

**Long Method** - Method does too much
```java
// SMELL: Method > 20 lines, multiple responsibilities
void processOrder(Order order) {
    // validate order (10 lines)
    // calculate totals (15 lines)
    // apply discounts (20 lines)
    // save to database (10 lines)
    // send confirmation email (15 lines)
}

// REFACTOR: Extract Method
void processOrder(Order order) {
    validateOrder(order);
    calculateTotals(order);
    applyDiscounts(order);
    saveOrder(order);
    sendConfirmation(order);
}
```

**Large Class** - Class has too many responsibilities
```java
// SMELL: Class with 20+ methods, multiple concerns
class User {
    // user data
    // authentication
    // authorization
    // email handling
    // reporting
    // notifications
}

// REFACTOR: Extract Class
class User { /* core user data */ }
class Authenticator { /* auth logic */ }
class UserNotifier { /* notifications */ }
```

**Long Parameter List** - Too many parameters
```java
// SMELL: > 3-4 parameters
void createUser(String name, String email, String phone,
                String address, String city, String zip,
                String country, boolean newsletter) { }

// REFACTOR: Introduce Parameter Object
void createUser(UserRegistration registration) { }
```

**Data Clumps** - Same data appears together repeatedly
```java
// SMELL: Same parameters travel together
void schedule(Date startDate, Date endDate, String timezone) { }
void display(Date startDate, Date endDate, String timezone) { }
void validate(Date startDate, Date endDate, String timezone) { }

// REFACTOR: Extract class for the clump
class DateRange {
    Date start;
    Date end;
    String timezone;
}
```

### The Object-Orientation Abusers

**Switch Statements** - Type-based switching (often)
```java
// SMELL: Switch on type
double calculatePay(Employee e) {
    switch (e.type) {
        case ENGINEER: return e.salary;
        case MANAGER: return e.salary + e.bonus;
        case SALESPERSON: return e.salary + e.commission;
    }
}

// REFACTOR: Replace with polymorphism
abstract class Employee {
    abstract double calculatePay();
}
class Engineer extends Employee {
    double calculatePay() { return salary; }
}
```

**Refused Bequest** - Subclass doesn't use inherited methods
```java
// SMELL: Subclass ignores parent methods
class Stack extends ArrayList {
    // push, pop, but all ArrayList methods exposed
    // Stack shouldn't have get(index), etc.
}

// REFACTOR: Replace inheritance with delegation
class Stack {
    private List storage = new ArrayList();
    void push(Object o) { storage.add(o); }
    Object pop() { return storage.remove(storage.size()-1); }
}
```

### The Change Preventers

**Divergent Change** - One class changes for multiple reasons
```java
// SMELL: UserService changes for auth, DB, and email reasons
class UserService {
    void authenticate() { /* auth logic */ }
    void saveToDb() { /* db logic */ }
    void sendEmail() { /* email logic */ }
}

// REFACTOR: Split into cohesive classes
class AuthService { }
class UserRepository { }
class UserNotifier { }
```

**Shotgun Surgery** - One change requires editing many classes
```java
// SMELL: Adding a field requires changes in 10 places
// Add 'middleName' to User, must update:
// UserDTO, UserForm, UserValidator, UserMapper,
// UserService, UserRepository, UserTest, ...

// REFACTOR: Reduce coupling, centralize knowledge
```

### The Dispensables

**Dead Code** - Code that's never executed
```java
// SMELL: Unreachable or unused code
if (false) { /* dead */ }
private void neverCalled() { }

// REFACTOR: Delete it. Version control remembers.
```

**Duplicate Code** - Same logic in multiple places
```java
// SMELL: Copy-pasted logic
class ReportA {
    void format() { /* same 20 lines */ }
}
class ReportB {
    void format() { /* same 20 lines */ }
}

// REFACTOR: Extract common method or class
class ReportFormatter {
    void format() { /* single source of truth */ }
}
```

**Speculative Generality** - Unused abstraction "for the future"
```java
// SMELL: Abstract class with only one subclass
abstract class ShapeFactory { }
class CircleFactory extends ShapeFactory { }
// No other shapes exist or are planned

// REFACTOR: Collapse hierarchy, remove when actually needed
class CircleFactory { }
```

### The Couplers

**Feature Envy** - Method uses another class more than its own
```java
// SMELL: Method obsessed with another object's data
class Order {
    double getDiscountedTotal() {
        Customer c = getCustomer();
        return total * (1 - c.getDiscountRate() * c.getLoyaltyMultiplier());
    }
}

// REFACTOR: Move Method to the envied class
class Customer {
    double applyDiscount(double amount) {
        return amount * (1 - discountRate * loyaltyMultiplier);
    }
}
```

**Inappropriate Intimacy** - Classes too involved with each other's internals
```java
// SMELL: Classes reaching into each other's private parts
class Order {
    void process() {
        customer.orders.add(this);
        customer.balance -= this.total;
    }
}

// REFACTOR: Move behavior, hide data
class Customer {
    void addOrder(Order o) {
        orders.add(o);
        balance -= o.getTotal();
    }
}
```

---

## Key Refactorings

### Extract Method

The most common refactoring. When code can be grouped and named.

```java
// Before
void printOwing() {
    printBanner();

    // print details
    System.out.println("name: " + name);
    System.out.println("amount: " + getOutstanding());
}

// After
void printOwing() {
    printBanner();
    printDetails();
}

void printDetails() {
    System.out.println("name: " + name);
    System.out.println("amount: " + getOutstanding());
}
```

**When to use:** Method is too long, code needs a comment, code is duplicated.

### Move Method

When a method uses more features of another class.

```java
// Before: Method in wrong class
class Order {
    double getDiscountedPrice() {
        return basePrice * customer.getDiscountMultiplier();
    }
}

// After: Move to the class it envies
class Customer {
    double getDiscountedPrice(double basePrice) {
        return basePrice * getDiscountMultiplier();
    }
}
```

### Replace Conditional with Polymorphism

When switching on type, use objects instead.

```java
// Before
double getSpeed() {
    switch (type) {
        case EUROPEAN: return baseSpeed;
        case AFRICAN: return baseSpeed - loadFactor * coconuts;
        case NORWEGIAN_BLUE: return isNailed ? 0 : baseSpeed;
    }
}

// After
abstract class Bird {
    abstract double getSpeed();
}
class European extends Bird {
    double getSpeed() { return baseSpeed; }
}
class African extends Bird {
    double getSpeed() { return baseSpeed - loadFactor * coconuts; }
}
```

### Introduce Parameter Object

When parameters travel together.

```java
// Before
void amountInvoiced(Date start, Date end) { }
void amountReceived(Date start, Date end) { }
void amountOverdue(Date start, Date end) { }

// After
class DateRange {
    Date start;
    Date end;
}
void amountInvoiced(DateRange range) { }
void amountReceived(DateRange range) { }
void amountOverdue(DateRange range) { }
```

### Replace Temp with Query

When a temporary variable holds an expression result.

```java
// Before
double calculateTotal() {
    double basePrice = quantity * itemPrice;
    if (basePrice > 1000) {
        return basePrice * 0.95;
    }
    return basePrice * 0.98;
}

// After
double calculateTotal() {
    if (basePrice() > 1000) {
        return basePrice() * 0.95;
    }
    return basePrice() * 0.98;
}

double basePrice() {
    return quantity * itemPrice;
}
```

---

## The Refactoring Process

### The Refactoring Cycle

```
1. Identify a smell
       ↓
2. Ensure tests exist
       ↓
3. Make small change
       ↓
4. Run tests
       ↓
5. Commit
       ↓
(repeat)
```

### Golden Rules

1. **Never refactor without tests** - You need a safety net
2. **Small steps** - Each change should be trivial
3. **Run tests after each step** - Catch breaks immediately
4. **Commit frequently** - Easy to revert if needed
5. **One refactoring at a time** - Don't mix changes

### When to Refactor

**Do refactor when:**
- Adding a feature is hard (prep refactoring)
- Understanding code is hard (comprehension refactoring)
- During code review (opportunistic refactoring)
- Fixing bugs (you're there anyway)

**Don't refactor when:**
- Code will be replaced/deleted
- No tests exist and adding them is too costly
- Deadline is tomorrow
- You're adding a feature (wear one hat!)

---

## Refactoring and Testing

### The Relationship

> "Refactoring without tests is not refactoring, it's changing stuff and hoping."

**Before refactoring:**
1. Do tests cover the code to be changed?
2. If not, add characterization tests first
3. Run tests - they must pass

**During refactoring:**
1. Make one small change
2. Run tests
3. If tests fail, revert immediately
4. If tests pass, commit

### Characterization Tests

When tests don't exist, capture current behavior:

```java
@Test
void characterize_currentBehavior() {
    // Call the code
    String result = legacyMethod(input);

    // Capture what it actually does
    assertEquals("unexpected output", result);  // Will fail first time

    // Update assertion with actual output
    assertEquals("actual output", result);  // Now documents behavior
}
```

---

## Code Review Checklist

When reviewing code, check for:

### Smells Present?
- [ ] Long methods (> 20 lines)?
- [ ] Long parameter lists (> 3)?
- [ ] Duplicate code?
- [ ] Feature envy (using other class more than own)?
- [ ] Switch on type (should be polymorphism)?
- [ ] Dead code or speculative generality?

### Refactoring Done Well?
- [ ] Tests existed before refactoring?
- [ ] Behavior unchanged (tests still pass)?
- [ ] Small, focused changes?
- [ ] Each commit is a complete refactoring?
- [ ] No feature changes mixed in?

---

## Quick Reference

| Smell | Common Refactoring |
|-------|-------------------|
| Long Method | Extract Method |
| Long Parameter List | Introduce Parameter Object |
| Duplicate Code | Extract Method/Class |
| Feature Envy | Move Method |
| Switch Statements | Replace with Polymorphism |
| Large Class | Extract Class |
| Data Clumps | Extract Class |
| Dead Code | Delete it |

---

## When NOT to Use This Skill

Use a different skill when:
- **Writing new code** - Don't over-architect upfront
- **Working with legacy code without tests** - Use `feathers` first to add tests
- **Performance optimization** - Use `carmack` for performance thinking
- **Test design** - Use `fowler-test` for testing strategy

Fowler Refactoring is for **improving existing, tested code** through disciplined transformation.

---

## Sources

- [Refactoring (2nd Edition)](https://martinfowler.com/books/refactoring.html) (2018)
- [Refactoring.com](https://refactoring.com/) - Catalog of refactorings
- [Code Smell](https://martinfowler.com/bliki/CodeSmell.html)
- [Refactoring Catalog](https://refactoring.com/catalog/)

---

*"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."* - Martin Fowler
