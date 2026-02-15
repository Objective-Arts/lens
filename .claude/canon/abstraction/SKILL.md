---
name: abstraction
description: "Abstraction and LSP"
---

# Barbara Liskov Principles

Applying Barbara Liskov's foundational work on data abstraction and behavioral subtyping from CLU, Argus, and the Liskov Substitution Principle. The "L" in SOLID.

---

## Core Philosophy

### The Liskov Substitution Principle

> "If for each object o1 of type S there is an object o2 of type T such that for all programs P defined in terms of T, the behavior of P is unchanged when o1 is substituted for o2, then S is a subtype of T."

**In plain terms**: Subtypes must be substitutable for their base types without breaking program correctness.

```java
// VIOLATION: Square breaks Rectangle's contract
class Rectangle {
    protected int width, height;

    public void setWidth(int w) { width = w; }
    public void setHeight(int h) { height = h; }
    public int area() { return width * height; }
}

class Square extends Rectangle {
    // Violates LSP: changes behavior of setWidth/setHeight
    @Override
    public void setWidth(int w) { width = height = w; }
    @Override
    public void setHeight(int h) { width = height = h; }
}

// This test FAILS for Square but PASSES for Rectangle
void testRectangle(Rectangle r) {
    r.setWidth(5);
    r.setHeight(4);
    assert r.area() == 20; // Square returns 16!
}
```

```java
// CORRECT: Don't use inheritance for "is-a" that violates behavior
interface Shape {
    int area();
}

class Rectangle implements Shape {
    private final int width, height;
    public Rectangle(int w, int h) { width = w; height = h; }
    public int area() { return width * height; }
}

class Square implements Shape {
    private final int side;
    public Square(int s) { side = s; }
    public int area() { return side * side; }
}
```

### Behavioral Subtyping Rules

A subtype must satisfy:

1. **Signature Rule**: Method signatures compatible (covariant returns, contravariant parameters)
2. **Methods Rule**: Subtype methods preserve supertype behavior
3. **Properties Rule**: Subtype preserves supertype invariants

```java
// The contract includes MORE than just types
interface Stack<T> {
    void push(T item);  // Post: size increases by 1
    T pop();            // Pre: !isEmpty(). Post: size decreases by 1
    boolean isEmpty();
    int size();
}

// Any implementation MUST honor those contracts
class BoundedStack<T> implements Stack<T> {
    // Can ADD preconditions only if they're weaker
    // Can ADD postconditions only if they're stronger
    // Must preserve: push then pop returns same item
}
```

---

## Data Abstraction

### Abstract Data Types (ADTs)

From CLU: Define types by their operations, not their representation.

```python
# ADT: What operations exist, not how data is stored
class Set:
    """
    Abstract Data Type: Set of unique elements

    Operations:
        add(element) -> None      # Adds element if not present
        remove(element) -> None   # Removes element if present
        contains(element) -> bool # True if element in set
        size() -> int            # Number of elements

    Invariants:
        - No duplicates
        - size() >= 0
        - add(x) then contains(x) == True
        - remove(x) then contains(x) == False
    """

    def __init__(self):
        self._elements = []  # Implementation hidden

    def add(self, element):
        if element not in self._elements:
            self._elements.append(element)

    # Could change to hash table without changing interface
```

### Information Hiding

The representation is PRIVATE. Only operations are PUBLIC.

```java
// BAD: Exposes representation
public class Account {
    public double balance;  // Anyone can set to -1000000
}

// GOOD: Hides representation, exposes operations
public class Account {
    private double balance;

    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException();
        balance += amount;
    }

    public void withdraw(double amount) {
        if (amount <= 0 || amount > balance)
            throw new IllegalArgumentException();
        balance -= amount;
    }

    public double getBalance() { return balance; }
}
```

---

## Specification & Contracts

### Pre/Post Conditions

Every operation has a contract:

```java
/**
 * Finds the index of the first occurrence of target.
 *
 * @param arr the array to search (PRECONDITION: arr != null)
 * @param target the value to find
 * @return index of target, or -1 if not found
 *         (POSTCONDITION: result == -1 || arr[result] == target)
 */
public int indexOf(int[] arr, int target) {
    // Precondition check
    if (arr == null) throw new NullPointerException();

    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}
```

### Class Invariants

Properties that must ALWAYS be true (between method calls):

```java
public class SortedList<T extends Comparable<T>> {
    private List<T> elements = new ArrayList<>();

    // INVARIANT: elements is always sorted

    public void add(T item) {
        int pos = Collections.binarySearch(elements, item);
        if (pos < 0) pos = -(pos + 1);
        elements.add(pos, item);
        // Invariant preserved: still sorted
    }

    public T get(int index) {
        return elements.get(index);
        // Invariant preserved: read-only
    }

    // WRONG: Would break invariant
    // public List<T> getElements() { return elements; }

    // RIGHT: Defensive copy preserves invariant
    public List<T> getElements() {
        return new ArrayList<>(elements);
    }
}
```

---

## Inheritance Guidelines

### When to Use Inheritance

**YES**: True behavioral subtyping
```java
// InputStream defines contract, FileInputStream honors it
class FileInputStream extends InputStream {
    // All InputStream contracts preserved
}
```

**NO**: Implementation reuse without behavioral compatibility
```java
// DON'T: Stack is not a Vector (different contracts)
class Stack extends Vector { } // Java's mistake

// DO: Composition for implementation reuse
class Stack<T> {
    private List<T> items = new ArrayList<>();
    public void push(T item) { items.add(item); }
    public T pop() { return items.remove(items.size() - 1); }
}
```

### The Liskov Test

Before creating `class S extends T`, ask:

1. Can S be used everywhere T is expected?
2. Does S preserve all of T's invariants?
3. Does S honor all of T's method contracts?
4. Would a client using T be surprised by S's behavior?

If ANY answer is "no" or "maybe", **don't inherit**.

---

## CLU Innovations (Historical Context)

Liskov's CLU language (1974-1977) pioneered:

| CLU Feature | Modern Equivalent |
|-------------|-------------------|
| Clusters (ADTs) | Classes with private fields |
| Iterators | Python generators, Java Iterators |
| Exception handling | try/catch/throw |
| Parameterized types | Generics/Templates |
| Multiple return values | Tuples, destructuring |

```clu
% CLU cluster (abstract data type)
int_set = cluster is create, insert, member, size
    rep = array[int]

    create = proc() returns (cvt)
        return (rep$new())
    end create

    insert = proc(s: cvt, i: int)
        if ~member(up(s), i) then rep$addh(s, i) end
    end insert

    member = proc(s: cvt, i: int) returns (bool)
        for x: int in rep$elements(s) do
            if x = i then return (true) end
        end
        return (false)
    end member
end int_set
```

---

## Review Checklist

When reviewing type hierarchies:

### Substitutability
- [ ] Can subtype instances replace supertype in all contexts?
- [ ] Do subtypes preserve supertype invariants?
- [ ] Are method contracts (pre/post conditions) honored?
- [ ] No surprises: would users of supertype expect subtype behavior?

### Abstraction Quality
- [ ] Is representation hidden (private fields)?
- [ ] Are operations the only public interface?
- [ ] Could implementation change without breaking clients?
- [ ] Are invariants documented and enforced?

### Contract Clarity
- [ ] Preconditions documented and checked?
- [ ] Postconditions documented and tested?
- [ ] Invariants explicitly stated?
- [ ] Exception conditions specified?

---

## When to Apply

| Scenario | Apply Liskov |
|----------|--------------|
| Designing inheritance hierarchy | Yes - LSP is mandatory |
| Defining interfaces/contracts | Yes - specify behavior |
| Reviewing OO design | Yes - check substitutability |
| Creating ADTs | Yes - information hiding |
| Performance optimization | No - see optimization |
| Implementation patterns | Partially - see design-patterns |

---

## Source Material

- "A Behavioral Notion of Subtyping" (1994) - Liskov & Wing
- "Data Abstraction and Hierarchy" (1987) - OOPSLA keynote
- "Abstraction and Specification in Program Development" (1986) - Liskov & Guttag
- "CLU Reference Manual" (1981)
- Turing Award Lecture (2008)
