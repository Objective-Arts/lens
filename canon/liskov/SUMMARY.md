# /liskov Summary

> "Subtypes must be substitutable for their base types without breaking program correctness."

## Liskov Substitution Principle (LSP)

Before `class S extends T`, ask:
1. Can S be used everywhere T is expected?
2. Does S preserve all of T's invariants?
3. Does S honor all of T's method contracts?
4. Would a client using T be surprised by S's behavior?

**If ANY answer is "no" or "maybe" - don't inherit.**

## Classic Violation

```java
// WRONG: Square breaks Rectangle's contract
class Square extends Rectangle {
    void setWidth(int w) { width = height = w; }  // Surprise!
}

// RIGHT: Separate types, shared interface
interface Shape { int area(); }
class Rectangle implements Shape { ... }
class Square implements Shape { ... }
```

## Data Abstraction Rules

| Rule | Meaning |
|------|---------|
| **Hide representation** | Fields private, operations public |
| **Define by operations** | ADT = what you can do, not how it's stored |
| **Preserve invariants** | Class state always valid between method calls |
| **Defensive copies** | Don't leak mutable internal state |

## Contract Elements

```java
/**
 * @param arr (PRECONDITION: arr != null)
 * @return index or -1 (POSTCONDITION: result == -1 || arr[result] == target)
 */
int indexOf(int[] arr, int target)
```

- **Preconditions**: What must be true before calling
- **Postconditions**: What will be true after calling
- **Invariants**: What's always true (between calls)

## Load Full Skill When

- Designing inheritance hierarchies
- Defining interfaces and contracts
- Reviewing OO design for substitutability
- Creating abstract data types

## Checklist

- [ ] Can subtype replace supertype everywhere?
- [ ] Subtypes preserve supertype invariants?
- [ ] Method contracts (pre/post) honored?
- [ ] Representation hidden (private fields)?
- [ ] Could implementation change without breaking clients?
