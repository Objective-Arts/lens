---
name: java
description: "Effective Java patterns"
allowed-tools: []
---

# Bloch: Defensive Design

Josh Bloch's core belief: **APIs should be easy to use correctly and hard to use incorrectly.** Every design decision should make the right thing easy and the wrong thing difficult or impossible.

## The Foundational Principle

> "When in doubt, leave it out."

If you're unsure whether a feature, parameter, or method belongs, it probably doesn't. You can always add later. You can never remove without breaking clients.

## Core Principles

### 1. Minimize Mutability

Immutable objects are simple, thread-safe, and can be shared freely.

**Make classes immutable unless there's a good reason not to:**
- Don't provide mutators (setters)
- Make all fields final and private
- Ensure exclusive access to mutable components (defensive copies)

**Not this:**
```java
public class Period {
    private Date start;
    private Date end;

    public void setStart(Date start) { this.start = start; }
    public Date getStart() { return start; }  // Leaks mutable reference
}
```

**This:**
```java
public final class Period {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = new Date(start.getTime());  // Defensive copy
        this.end = new Date(end.getTime());
        if (this.start.compareTo(this.end) > 0)
            throw new IllegalArgumentException("start after end");
    }

    public Date getStart() { return new Date(start.getTime()); }  // Defensive copy
}
```

### 2. Favor Static Factory Methods Over Constructors

Static factories have names, don't require new object creation, and can return subtypes.

**Not this:**
```java
Boolean flag = new Boolean(true);  // Always creates object
```

**This:**
```java
Boolean flag = Boolean.valueOf(true);  // Can return cached instance
```

**Name conventions:**
- `from` - type conversion: `Date.from(instant)`
- `of` - aggregation: `EnumSet.of(JACK, QUEEN, KING)`
- `valueOf` - verbose alternative to `of`
- `getInstance` / `instance` - returns instance (may be cached)
- `newInstance` / `create` - guarantees new instance
- `getType` / `newType` - factory in different class

### 3. Favor Composition Over Inheritance

Inheritance violates encapsulation. The subclass depends on implementation details of the superclass.

**Not this:**
```java
public class InstrumentedHashSet<E> extends HashSet<E> {
    private int addCount = 0;

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);  // What if HashSet.addAll calls add()?
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);  // Double counting!
    }
}
```

**This (composition with forwarding):**
```java
public class InstrumentedSet<E> implements Set<E> {
    private final Set<E> s;
    private int addCount = 0;

    public InstrumentedSet(Set<E> s) { this.s = s; }

    public boolean add(E e) {
        addCount++;
        return s.add(e);
    }

    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return s.addAll(c);
    }
    // ... delegate all other Set methods to s
}
```

### 4. Design and Document for Inheritance or Prohibit It

If you allow inheritance, document precisely what subclasses can rely on. If you don't want to make that commitment, make the class final.

- Document self-use patterns (which methods call which)
- Never call overridable methods from constructors
- When in doubt, make it final

### 5. Program to Interfaces, Not Implementations

Refer to objects by their interfaces. This allows flexibility to change implementations.

**Not this:**
```java
LinkedHashSet<String> names = new LinkedHashSet<>();
```

**This:**
```java
Set<String> names = new LinkedHashSet<>();
```

### 6. Return Empty Collections, Not Nulls

Never force callers to write null checks for collections.

**Not this:**
```java
public List<Item> getItems() {
    if (items.isEmpty()) return null;  // Forces null check
    return items;
}
```

**This:**
```java
public List<Item> getItems() {
    return items.isEmpty()
        ? Collections.emptyList()
        : new ArrayList<>(items);
}
```

### 7. Use Optionals Judiciously

Optionals are for return values that might legitimately be absent. Never use for fields, parameters, or collections.

**Appropriate:**
```java
public Optional<Item> findById(long id) {
    return Optional.ofNullable(cache.get(id));
}
```

**Never:**
```java
// Don't do any of these
private Optional<Item> item;  // Field
public void process(Optional<Item> item) { }  // Parameter
public Optional<List<Item>> getItems() { }  // Optional of collection
```

### 8. Fail Fast

Detect errors as early as possible. Validate parameters at the start of methods.

**Not this:**
```java
public void process(String input) {
    // ... 50 lines of code ...
    input.toLowerCase();  // NullPointerException here, far from cause
}
```

**This:**
```java
public void process(String input) {
    Objects.requireNonNull(input, "input must not be null");
    if (input.isEmpty()) {
        throw new IllegalArgumentException("input must not be empty");
    }
    // ... proceed with valid input ...
}
```

### 9. Override equals and hashCode Together

If you override equals, you must override hashCode. Objects that are equal must have equal hash codes.

**The equals contract:**
- Reflexive: `x.equals(x)` is true
- Symmetric: `x.equals(y)` iff `y.equals(x)`
- Transitive: if `x.equals(y)` and `y.equals(z)`, then `x.equals(z)`
- Consistent: multiple calls return same result
- `x.equals(null)` is false

### 10. Consider Builders for Many Parameters

When constructors have many parameters (especially optional ones), use the Builder pattern.

```java
NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8)
    .calories(100)
    .sodium(35)
    .carbohydrate(27)
    .build();
```

## The Bloch Test

Before committing any API or class design, ask:

1. **Is it easy to use correctly?** Obvious what to call, hard to get wrong?
2. **Is it hard to use incorrectly?** Impossible to pass bad data? Compile-time errors over runtime?
3. **Is mutability minimized?** Are things final that could be?
4. **Are defensive copies made?** Do you trust callers you shouldn't?
5. **Does it fail fast?** Are errors caught at the earliest point?
6. **Is the interface minimal?** Could anything be removed?

## When Reviewing Code

Apply these checks:

- [ ] Classes immutable unless mutation is required
- [ ] Fields private and final where possible
- [ ] Defensive copies on construction and access
- [ ] Static factory methods considered over constructors
- [ ] Composition over inheritance (unless explicitly designed for extension)
- [ ] Interfaces used for types, not implementations
- [ ] Empty collections returned, not null
- [ ] Parameters validated at method entry
- [ ] equals/hashCode overridden together
- [ ] toString provides useful representation

## When NOT to Use This Skill

Use a different skill when:
- **Writing Go code** → Use `simplicity` (Go Proverbs, small interfaces)
- **Applying classic design patterns** → Use `design-patterns` (23 patterns catalog)
- **Proving formal correctness** → Use `correctness` (invariants, weakest preconditions)
- **General code clarity** → Use `clarity` (readability, naming)
- **Performance optimization** → Use `optimization` (cache behavior, profiling)

Bloch is the **Java/Kotlin skill**—use it for defensive API design and robust object-oriented code.

## Sources

- Bloch, "Effective Java" (3rd Edition, 2018)
- Bloch, "How to Design a Good API and Why it Matters" (Google Tech Talk, 2007)
- Java Collections Framework (designed by Bloch)

---

*"APIs should be easy to use correctly and hard to use incorrectly."* — Josh Bloch
