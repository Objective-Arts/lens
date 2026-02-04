---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# API Design Standards

Design principles for creating APIs as clean as the Java Collections API. These complement STRUCTURAL-STANDARDS.md - structure is about implementation quality, this is about interface quality.

---

## The Standard

> The Java Collections API is the benchmark. Every public interface you create should aspire to that level of clarity, consistency, and usability.

---

## Interface Design

### Program to Interfaces, Not Implementations

Expose abstractions, hide implementations.

```
WRONG                           RIGHT
-----                           -----
ArrayList<User> getUsers()      List<User> getUsers()
HashMap<String, Config> cache   Map<String, Config> cache
```

**Why**: Callers don't need to know (or care) about implementation. You can swap `ArrayList` for `LinkedList` without breaking anything.

### Minimal Complete Interfaces

Include only what's needed. Every method must earn its place.

```
WRONG (bloated)                 RIGHT (minimal)
---------------                 ----------------
interface UserService {         interface UserService {
  User getUser(id)                User getUser(id)
  User getUserByEmail(email)      User findUser(criteria)
  User getUserByName(name)        List<User> listUsers()
  User findUserByDept(dept)       void saveUser(user)
  List<User> getAllUsers()        void deleteUser(id)
  List<User> getActiveUsers()   }
  List<User> getUsersByRole()
  void saveUser(user)
  void updateUser(user)
  void deleteUser(id)
  void softDeleteUser(id)
}
```

**Test**: If you removed this method, would the interface still be complete?

### Orthogonal Design

Methods should not overlap in functionality.

```
WRONG (overlapping)             RIGHT (orthogonal)
-------------------             -------------------
save(user)                      save(user)
saveAndNotify(user)             // notification is a separate concern
saveIfValid(user)               // validation is a separate concern
```

---

## Immutability

### Prefer Immutable Objects

Objects that cannot change after construction are safer, simpler, and thread-safe.

```
WRONG (mutable)                 RIGHT (immutable)
---------------                 -----------------
class User {                    class User {
  private String name;            private final String name;
  public void setName(name) {
    this.name = name;             public User(String name) {
  }                                 this.name = name;
}                                 }

                                  public User withName(String name) {
                                    return new User(name);
                                  }
                                }
```

### Return Unmodifiable Collections

Never expose internal mutable state.

```
WRONG                           RIGHT
-----                           -----
return this.items;              return Collections.unmodifiableList(items);
                                return List.copyOf(items);
                                return items.stream().toList(); // Java 16+
```

### Defensive Copies

Copy mutable inputs and outputs.

```
WRONG                           RIGHT
-----                           -----
public void setDates(List<Date> dates) {
  this.dates = dates;           this.dates = new ArrayList<>(dates);
}

public List<Date> getDates() {
  return dates;                 return new ArrayList<>(dates);
}
```

---

## Null Safety

### Never Return Null for Collections

Return empty collections instead.

```
WRONG                           RIGHT
-----                           -----
if (noResults) {                if (noResults) {
  return null;                    return Collections.emptyList();
}                                 return List.of();
                                }
```

### Use Optional for Potentially Absent Values

```
WRONG                           RIGHT
-----                           -----
User findUser(id) {             Optional<User> findUser(id) {
  // returns null if not found    return Optional.ofNullable(/*...*/);
}                               }
```

### Validate Inputs Early

Fail fast with clear messages.

```
WRONG                           RIGHT
-----                           -----
void process(String name) {     void process(String name) {
  // NPE somewhere deep           Objects.requireNonNull(name, "name");
  // in the call stack            if (name.isBlank()) {
}                                   throw new IllegalArgumentException(
                                      "name cannot be blank");
                                  }
                                }
```

---

## Factory Methods

### Prefer Static Factory Methods Over Constructors

Factory methods have names, can return subtypes, and can cache.

```
WRONG                           RIGHT
-----                           -----
new ArrayList<>()               List.of()
new Boolean(true)               Boolean.valueOf(true)
new User("admin", Role.ADMIN)   User.createAdmin("admin")
```

**Benefits**:
- **Named**: `User.createAdmin()` vs `new User(name, role, true, null)`
- **Cached**: Can return same instance
- **Subtype**: Can return different implementation
- **Readable**: Intent is clear

### Common Factory Method Names

| Name | Use |
|------|-----|
| `of` | Aggregation: `List.of(a, b, c)` |
| `from` | Conversion: `Date.from(instant)` |
| `valueOf` | Same as `from`, older convention |
| `create` / `newInstance` | Fresh instance each time |
| `get[Type]` | Singleton or cached: `Runtime.getRuntime()` |

---

## Contracts

### Document Every Public Method

Every public method should document:
- What it does
- Preconditions (what must be true before calling)
- Postconditions (what will be true after calling)
- Side effects (if any)
- Exceptions thrown and when

```java
/**
 * Returns the user with the specified ID.
 *
 * @param id the user ID, must not be null
 * @return the user, never null
 * @throws IllegalArgumentException if id is null
 * @throws UserNotFoundException if no user exists with this ID
 */
User getUser(String id);
```

### Consistent Behavior Across Implementations

If multiple classes implement an interface, they must behave identically.

```
// Both must behave the same way
List<String> arrayList = new ArrayList<>();
List<String> linkedList = new LinkedList<>();

arrayList.add("x");  // Same behavior
linkedList.add("x"); // Same behavior
```

---

## Error Handling

### Fail Fast

Detect errors as early as possible. Don't let bad state propagate.

```
WRONG                           RIGHT
-----                           -----
void transfer(from, to, amt) {  void transfer(from, to, amt) {
  // might fail deep in DB        validate(from, to, amt); // Fail HERE
  db.debit(from, amt);            db.debit(from, amt);
  db.credit(to, amt);             db.credit(to, amt);
}                               }
```

### Use Exceptions for Exceptional Conditions

Don't use exceptions for control flow.

```
WRONG                           RIGHT
-----                           -----
try {                           if (map.containsKey(key)) {
  return map.get(key);            return map.get(key);
} catch (NotFoundException e) { } else {
  return default;                 return default;
}                               }
```

### Throw Standard Exceptions

| Exception | When |
|-----------|------|
| `IllegalArgumentException` | Bad parameter value |
| `IllegalStateException` | Object in wrong state for operation |
| `NullPointerException` | Null where prohibited |
| `UnsupportedOperationException` | Operation not supported |
| `IndexOutOfBoundsException` | Index parameter out of range |

---

## Inheritance

### Design for Inheritance or Prohibit It

Classes should be either:
- **Designed for extension**: Document what subclasses can override
- **Final**: Cannot be extended

```
WRONG (accidental inheritance)  RIGHT (intentional)
------------------------------  --------------------
class UserService { }           final class UserService { }
                                // OR
                                class UserService {
                                  /** Subclasses may override to... */
                                  protected User createUser() { }
                                }
```

### Prefer Composition Over Inheritance

```
WRONG (inheritance)             RIGHT (composition)
-------------------             --------------------
class LoggingList<E>            class LoggingList<E> implements List<E> {
  extends ArrayList<E> { }        private final List<E> delegate;
                                  // Forward all calls to delegate
                                }
```

---

## Naming

### Method Names Should Be Verbs

```
WRONG                           RIGHT
-----                           -----
user()                          getUser()
active()                        isActive()
deletion()                      delete()
```

### Boolean Methods: is/has/can/should

```
WRONG                           RIGHT
-----                           -----
empty()                         isEmpty()
permission()                    hasPermission()
edit()                          canEdit()
notify()                        shouldNotify()
```

### Consistent Vocabulary

Pick one term and use it everywhere:

| Pick ONE | Not |
|----------|-----|
| `get` | `fetch`, `retrieve`, `obtain`, `find` |
| `create` | `make`, `build`, `new` |
| `delete` | `remove`, `destroy`, `kill` |
| `update` | `modify`, `change`, `set` |

---

## Pre-Completion Checklist

Before presenting any API as complete:

```markdown
### API Design Checklist

- [ ] Interfaces expose abstractions, not implementations
- [ ] Every method earns its place (minimal complete)
- [ ] Mutable state is protected (defensive copies)
- [ ] Collections returned are unmodifiable or copies
- [ ] Null is never returned for collections
- [ ] Optional used for potentially absent single values
- [ ] Inputs validated early with clear messages
- [ ] Factory methods used where appropriate
- [ ] Public methods document contracts
- [ ] Exceptions are standard and meaningful
- [ ] Classes are final or designed for inheritance
```

---

## The Principle

> **A great API is discovered, not invented.**
>
> The Java Collections API feels inevitable - like it couldn't have been designed any other way.
> That's not luck. It's the result of ruthless simplification and deep consistency.
> Every method name, every parameter order, every return type was chosen to minimize surprise.
> The best API is one where users guess correctly on the first try.

---

## Quick Reference

| Principle | One-liner |
|-----------|-----------|
| Interfaces over implementations | `List` not `ArrayList` |
| Immutability | `final` fields, return copies |
| No null collections | `List.of()` not `null` |
| Optional for maybe-values | `Optional<User>` not `User` or `null` |
| Fail fast | Validate at entry points |
| Factory methods | `User.of()` not `new User()` |
| Document contracts | Preconditions, postconditions, exceptions |
| Standard exceptions | `IllegalArgumentException`, etc. |
| Final or designed | No accidental inheritance |
| Composition over inheritance | Delegate, don't extend |
| Consistent naming | Pick one verb, use everywhere |
