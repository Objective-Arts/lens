---
name: legacy
description: "Legacy code testing patterns from Working Effectively with Legacy Code"
---

# Michael Feathers - Legacy Code Testing

Apply Michael Feathers' techniques for testing and refactoring legacy code.

## Core Philosophy

### The Definition of Legacy Code

> "Legacy code is code without tests."

It doesn't matter how old or how clean—if it lacks tests, it's legacy code.

### The Legacy Code Dilemma

> "When we change code, we should have tests in place. To put tests in place, we often have to change code."

**Solution:** Use safe, mechanical refactorings to create seams for testing.

---

## Characterization Tests

### Purpose

Characterization tests document **what the code actually does**, not what it should do.

### Pattern

```java
// 1. Write a test that calls the code
@Test
void characterize_calculateDiscount() {
    Order order = new Order();
    order.setTotal(100.0);
    order.setCustomerType("GOLD");

    double result = discountCalculator.calculate(order);

    // 2. Run it and let it fail
    // 3. Use the actual output as the expected value
    assertEquals(15.0, result, 0.001);
}
```

### When to Use

- Before refactoring legacy code
- When documentation is missing or wrong
- To understand what code actually does
- Before fixing a bug (capture current behavior first)

### The Rule

> "Preserve behavior first, then change it."

---

## Seams

A **seam** is a place where you can alter behavior without editing the code.

### Types of Seams

#### 1. Object Seam (most common)

```java
// BEFORE: Hard to test - creates its own dependency
public class OrderProcessor {
    public void process(Order order) {
        EmailService emailer = new EmailService();  // Untestable!
        emailer.send(order.getCustomerEmail(), "Order received");
    }
}

// AFTER: Object seam via constructor injection
public class OrderProcessor {
    private final EmailService emailer;

    public OrderProcessor(EmailService emailer) {
        this.emailer = emailer;
    }

    public void process(Order order) {
        emailer.send(order.getCustomerEmail(), "Order received");
    }
}

// Test with fake
@Test
void process_sendsEmail() {
    FakeEmailService fakeEmail = new FakeEmailService();
    OrderProcessor processor = new OrderProcessor(fakeEmail);

    processor.process(testOrder);

    assertTrue(fakeEmail.wasSentTo("customer@test.com"));
}
```

#### 2. Link Seam

Replace a dependency at link/build time.

```java
// Production: uses real database
// Test: link against in-memory database
```

#### 3. Preprocessing Seam

```c
// C/C++ - use preprocessor for test seams
#ifdef TESTING
    #define getCurrentTime() mockTime
#else
    #define getCurrentTime() time(NULL)
#endif
```

### The Seam Principle

> "Every seam has an enabling point—a place where you can make the decision to use one behavior or another."

---

## Breaking Dependencies

### Technique: Extract and Override

```java
// BEFORE: Untestable - uses system time
public class Scheduler {
    public boolean isOverdue(Task task) {
        Date now = new Date();  // Hard dependency
        return task.getDueDate().before(now);
    }
}

// AFTER: Extract to protected method, override in test
public class Scheduler {
    public boolean isOverdue(Task task) {
        Date now = getCurrentTime();
        return task.getDueDate().before(now);
    }

    protected Date getCurrentTime() {
        return new Date();
    }
}

// Test subclass
class TestableScheduler extends Scheduler {
    private Date fixedTime;

    public void setCurrentTime(Date time) {
        this.fixedTime = time;
    }

    @Override
    protected Date getCurrentTime() {
        return fixedTime;
    }
}
```

### Technique: Parameterize Constructor

```java
// BEFORE
public class Report {
    private Database db = Database.getInstance();  // Singleton!

    public List<Row> generate() {
        return db.query("SELECT * FROM data");
    }
}

// AFTER: Parameterize constructor
public class Report {
    private final Database db;

    public Report() {
        this(Database.getInstance());
    }

    public Report(Database db) {  // Seam!
        this.db = db;
    }

    public List<Row> generate() {
        return db.query("SELECT * FROM data");
    }
}
```

### Technique: Introduce Instance Delegator

```java
// BEFORE: Static method - untestable
public class Validator {
    public static boolean isValid(String input) {
        return Pattern.matches("[A-Z]+", input);
    }
}

// AFTER: Keep static for compatibility, add instance method
public class Validator {
    public static boolean isValid(String input) {
        return new Validator().validate(input);
    }

    public boolean validate(String input) {  // Testable!
        return Pattern.matches("[A-Z]+", input);
    }
}
```

---

## Sprout and Wrap

### Sprout Method

When adding new functionality to legacy code:

```java
// BEFORE: Long method, need to add validation
public void processOrder(Order order) {
    // ... 100 lines of legacy code ...

    // NEW: Add validation here
    if (!isValidOrder(order)) {  // Sprout!
        throw new InvalidOrderException();
    }

    // ... more legacy code ...
}

// SPROUTED: New method is tested separately
@Test
void isValidOrder_rejectsEmptyItems() {
    Order order = new Order();
    assertFalse(isValidOrder(order));
}
```

### Sprout Class

When the new functionality deserves its own class:

```java
// Legacy code - huge class
public class OrderProcessor {
    // ... 2000 lines ...

    public void process(Order order) {
        // NEW: Sprout entire class for new feature
        OrderValidator validator = new OrderValidator();
        validator.validate(order);

        // ... legacy processing ...
    }
}

// New class - fully tested
public class OrderValidator {
    public void validate(Order order) {
        // Clean, tested code
    }
}
```

### Wrap Method

When you need to add behavior before/after existing code:

```java
// BEFORE
public void pay(Employee employee, Money amount) {
    employee.addToBalance(amount);
}

// AFTER: Wrap with logging
public void pay(Employee employee, Money amount) {
    logPayment(employee, amount);  // Before
    dispatchPay(employee, amount); // Renamed original
}

private void dispatchPay(Employee employee, Money amount) {
    employee.addToBalance(amount);
}

private void logPayment(Employee employee, Money amount) {
    // New, tested logging
}
```

---

## The Mikado Method

For large-scale legacy refactoring:

1. **Start with the goal** - what do you want to achieve?
2. **Try the naive approach** - just make the change
3. **When it breaks** - note what broke, revert
4. **Fix prerequisites first** - recursively
5. **Work backwards** - solve leaf problems first

```
Goal: Extract OrderValidator class
├── Need to inject dependencies
│   ├── OrderProcessor uses singleton → Parameterize constructor
│   └── Database uses static → Extract interface
└── Need to separate validation logic
    └── Validation mixed with persistence → Extract method first
```

---

## Code Review Checklist

When working with legacy code:

### Before Changing
- [ ] Characterization tests capture current behavior?
- [ ] Change points identified?
- [ ] Seams identified for testing?

### When Adding Features
- [ ] Using sprout method/class for new code?
- [ ] New code fully tested?
- [ ] Legacy code unchanged or minimally changed?

### When Refactoring
- [ ] Tests cover the area being changed?
- [ ] Using safe, mechanical refactorings?
- [ ] Running tests after each small change?

### Dependencies
- [ ] Hard dependencies broken via seams?
- [ ] Constructor injection used where possible?
- [ ] Static methods wrapped in instance methods?

---

## Quick Reference

| Situation | Technique |
|-----------|-----------|
| Don't know what code does | Characterization test |
| Need to test untestable code | Find/create seam |
| Adding new feature to legacy | Sprout method/class |
| Adding behavior to existing method | Wrap method |
| Hard-coded dependency | Parameterize constructor |
| Static method dependency | Introduce instance delegator |
| Large legacy refactoring | Mikado method |

---

## Key Quotes

> "Dependency is one of the most critical problems in software development."

> "Programming is the art of doing one thing at a time."

> "Legacy code is code without tests. Code without tests is bad code."

---

## Resources

- [Working Effectively with Legacy Code](https://www.oreilly.com/library/view/working-effectively-with/0131177052/) (2004)
- [The Mikado Method](https://www.manning.com/books/the-mikado-method)
- [Feathers' Blog](https://michaelfeathers.silvrback.com/)
