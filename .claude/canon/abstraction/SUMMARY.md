# /abstraction Summary

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

## Concrete Checks (MUST ANSWER)

1. **Inheritance justification:** For every `extends`/`implements`/subclass relationship, can the subtype be used in every place the supertype is used without the caller needing to know which subtype it has? If any caller checks the concrete type (instanceof, typeof, discriminated unions used for branching), the substitution is broken — use composition instead.
2. **Abstraction consumer count:** For every interface or abstract class, list its concrete implementations. If there is only one implementation, delete the abstraction and use the concrete type directly. Abstractions with a single consumer are speculative complexity.
3. **Leaky abstraction scan:** Does any consumer of an abstraction access implementation details (casting to concrete types, relying on internal state shape, calling methods not on the interface)? If yes, the abstraction is leaking — either widen the interface or remove the abstraction.
4. **Hierarchy depth check:** Count the inheritance chain depth for every type. Is any chain deeper than 2 levels (A -> B -> C)? If yes, flatten it. Deep hierarchies create coupling that makes changes cascade unpredictably.
5. **Contract preservation:** For every overridden method, does the override accept the same or wider inputs (weakened preconditions) and return the same or narrower outputs (strengthened postconditions)? If an override throws new exceptions, rejects previously valid inputs, or returns unexpected types, it violates the contract.

## HARD GATES (mandatory before writing code)

- [ ] **Consumer count:** For every interface/abstract class you create, list its consumers. If there's only one implementation, delete the abstraction and use the concrete type. Abstractions earn their existence through multiple consumers.
- [ ] **Substitution test:** For every subtype, write a test that uses it through the base type's interface. If the test needs type-specific knowledge to pass, the substitution is broken.
- [ ] **Depth check:** Count your inheritance/composition depth. If any chain is >2 levels, flatten it. Deep hierarchies are never worth the complexity.
- [ ] **Wrapper audit:** List every wrapper/adapter/facade. Does each one add behavior, or does it just forward calls? Delete pure forwarding wrappers.
