---
name: bloch
description: "Complete Effective Java - all 90 items from Josh Bloch"
allowed-tools: []
---

# Bloch: Effective Java (Complete)

Josh Bloch's core belief: **APIs should be easy to use correctly and hard to use incorrectly.**

This skill covers ALL 90 items from Effective Java, 3rd Edition (2018).

---

## Chapter 2: Creating and Destroying Objects

### Item 1: Static factory methods over constructors
- Have names (`BigInteger.probablePrime` vs `new BigInteger(...)`)
- Don't require new object each call (can cache)
- Can return subtypes
- Naming: `from`, `of`, `valueOf`, `instance`, `create`, `getType`, `newType`

### Item 2: Builders for many constructor parameters
```java
NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8)
    .calories(100).sodium(35).build();
```
- Simulates named optional parameters
- Can enforce invariants in `build()`
- Works well with class hierarchies (covariant return types)

### Item 3: Singleton with private constructor or enum
```java
public enum Elvis { INSTANCE; }  // Preferred
```
- Enum is serialization-safe and prevents reflection attacks
- Private constructor + static field for non-enum approach

### Item 4: Private constructor for noninstantiability
```java
public class UtilityClass {
    private UtilityClass() { throw new AssertionError(); }
}
```

### Item 5: Dependency injection over hardwiring resources
```java
// Not this
public class SpellChecker {
    private final Lexicon dictionary = new EnglishLexicon();
}
// This
public class SpellChecker {
    private final Lexicon dictionary;
    public SpellChecker(Lexicon dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary);
    }
}
```

### Item 6: Avoid creating unnecessary objects
- Reuse immutable objects: `String s = "bikini";` not `new String("bikini")`
- Cache expensive objects (Pattern, DateFormat)
- Prefer primitives to boxed primitives
- Watch for autoboxing in loops

### Item 7: Eliminate obsolete object references
- Null out references when managing own memory (stacks, caches)
- Use WeakHashMap for caches
- Use listeners/callbacks with weak references

### Item 8: Avoid finalizers and cleaners
- Unpredictable timing, performance penalty, security issues
- Use try-with-resources and AutoCloseable instead
- Cleaners only as safety net, never for critical actions

### Item 9: try-with-resources over try-finally
```java
try (InputStream in = new FileInputStream(src);
     OutputStream out = new FileOutputStream(dst)) {
    // ...
}
```

---

## Chapter 3: Methods Common to All Objects

### Item 10: equals contract
- Reflexive: `x.equals(x)` true
- Symmetric: `x.equals(y)` iff `y.equals(x)`
- Transitive: x=y, y=z implies x=z
- Consistent: multiple calls same result
- Non-null: `x.equals(null)` false
- Use `@Override`, check type with `instanceof`

### Item 11: Always override hashCode when overriding equals
- Equal objects must have equal hash codes
- Use `Objects.hash()` or compute from significant fields
- Cache hash if immutable and expensive

### Item 12: Always override toString
- Return all interesting information
- Document format (or explicitly state it's unspecified)

### Item 13: Override clone judiciously
- Implement Cloneable, call `super.clone()`
- Deep copy mutable fields
- **Better**: copy constructor or static factory
```java
public Yum(Yum yum) { ... }  // Copy constructor
public static Yum newInstance(Yum yum) { ... }  // Static factory
```

### Item 14: Consider implementing Comparable
- Consistent with equals preferred
- Use comparator construction methods in Java 8+:
```java
Comparator.comparingInt(PhoneNumber::getAreaCode)
    .thenComparingInt(PhoneNumber::getPrefix)
```

---

## Chapter 4: Classes and Interfaces

### Item 15: Minimize accessibility
- Make each class/member as inaccessible as possible
- Public classes should have no public fields (except constants)
- Package-private is default, use it

### Item 16: Use accessor methods in public classes
- Public fields expose implementation
- Package-private or private nested classes: fields OK

### Item 17: Minimize mutability
- Don't provide mutators
- Make class final
- Make all fields final and private
- Ensure exclusive access to mutable components (defensive copies)
- Functional approach: return new instances

### Item 18: Composition over inheritance
```java
// Wrapper class - uses composition
public class InstrumentedSet<E> extends ForwardingSet<E> {
    private int addCount = 0;
    public InstrumentedSet(Set<E> s) { super(s); }
    @Override public boolean add(E e) {
        addCount++;
        return super.add(e);
    }
}
```
- Inheritance breaks encapsulation
- Subclass depends on superclass implementation

### Item 19: Design for inheritance or prohibit it
- Document self-use of overridable methods
- Never call overridable methods from constructors
- When in doubt, make it final

### Item 20: Interfaces over abstract classes
- Existing classes can implement new interfaces
- Interfaces enable mixins
- Interfaces enable nonhierarchical frameworks
- Combine with skeletal implementation (AbstractInterface)

### Item 21: Design interfaces for posterity
- Default methods can break existing implementations
- Test default methods against multiple implementations

### Item 22: Interfaces only for defining types
- No constant interfaces (antipattern)
- Use utility class or enum for constants

### Item 23: Class hierarchies over tagged classes
```java
// Tagged class - bad
class Figure {
    enum Shape { RECTANGLE, CIRCLE };
    final Shape shape;
    double length, width, radius;
}
// Class hierarchy - good
abstract class Figure { abstract double area(); }
class Circle extends Figure { ... }
class Rectangle extends Figure { ... }
```

### Item 24: Favor static member classes
- Nonstatic: each instance has enclosing instance (memory leak risk)
- Static: no enclosing instance, can be instantiated independently
- Anonymous: at point of use, keep short
- Local: inside method, rarely used

### Item 25: One top-level class per file
- Never put multiple top-level classes in one file

---

## Chapter 5: Generics

### Item 26: Don't use raw types
```java
// Raw type - bad
List names = new ArrayList();
// Parameterized - good
List<String> names = new ArrayList<>();
```
- `List<Object>` is OK (explicit heterogeneous)
- `List<?>` for unknown type

### Item 27: Eliminate unchecked warnings
- Fix every warning you can
- Use `@SuppressWarnings("unchecked")` only when safe
- Minimize scope, document why it's safe

### Item 28: Lists over arrays
- Arrays are covariant, generics are invariant
- Arrays reify types at runtime, generics erase
- Prefer `List<E>` to `E[]`

### Item 29: Favor generic types
```java
public class Stack<E> {
    private E[] elements;
    public void push(E e) { ... }
    public E pop() { ... }
}
```

### Item 30: Favor generic methods
```java
public static <E> Set<E> union(Set<E> s1, Set<E> s2) { ... }
```
- Type inference makes calls clean
- Generic singleton factory for immutable objects

### Item 31: Bounded wildcards for flexibility (PECS)
- **Producer Extends**: `Collection<? extends E>` to read
- **Consumer Super**: `Collection<? super E>` to write
```java
public void pushAll(Iterable<? extends E> src) { ... }
public void popAll(Collection<? super E> dst) { ... }
```

### Item 32: Combine generics and varargs judiciously
- Varargs create array, arrays don't mix with generics
- `@SafeVarargs` only when method is truly safe
- Safe: doesn't store into varargs array, doesn't expose reference

### Item 33: Typesafe heterogeneous containers
```java
public class Favorites {
    private Map<Class<?>, Object> favorites = new HashMap<>();
    public <T> void put(Class<T> type, T instance) {
        favorites.put(Objects.requireNonNull(type), type.cast(instance));
    }
    public <T> T get(Class<T> type) {
        return type.cast(favorites.get(type));
    }
}
```

---

## Chapter 6: Enums and Annotations

### Item 34: Enums over int constants
```java
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS(4.869e+24, 6.0518e6);
    private final double mass, radius;
    Planet(double mass, double radius) {
        this.mass = mass; this.radius = radius;
    }
}
```
- Type-safe, namespace, can have methods/fields

### Item 35: Instance fields over ordinals
```java
// Bad
public int numberOfMusicians() { return ordinal() + 1; }
// Good
private final int numberOfMusicians;
```

### Item 36: EnumSet over bit fields
```java
text.applyStyles(EnumSet.of(Style.BOLD, Style.ITALIC));
```

### Item 37: EnumMap over ordinal indexing
```java
Map<Plant.LifeCycle, Set<Plant>> plantsByLifeCycle =
    new EnumMap<>(Plant.LifeCycle.class);
```

### Item 38: Emulate extensible enums with interfaces
```java
public interface Operation { double apply(double x, double y); }
public enum BasicOperation implements Operation { ... }
public enum ExtendedOperation implements Operation { ... }
```

### Item 39: Annotations over naming patterns
- JUnit 4+ @Test over JUnit 3 testXxx naming
- Annotations are checked at compile time

### Item 40: Always use @Override
- Catches errors at compile time
- Use on every method intended to override

### Item 41: Marker interfaces for types
- Marker interface defines a type, marker annotation doesn't
- Use interface if you want compile-time type checking

---

## Chapter 7: Lambdas and Streams

### Item 42: Lambdas over anonymous classes
```java
Collections.sort(words, (s1, s2) -> Integer.compare(s1.length(), s2.length()));
// Or better:
words.sort(comparingInt(String::length));
```
- Keep lambdas short (1-3 lines)
- If longer, extract to method and use method reference

### Item 43: Method references over lambdas
| Type | Example | Lambda equivalent |
|------|---------|-------------------|
| Static | `Integer::parseInt` | `s -> Integer.parseInt(s)` |
| Bound | `Instant.now()::isAfter` | `t -> then.isAfter(t)` |
| Unbound | `String::toLowerCase` | `s -> s.toLowerCase()` |
| Constructor | `TreeMap<K,V>::new` | `() -> new TreeMap<K,V>()` |

### Item 44: Use standard functional interfaces
- `UnaryOperator<T>`: `T apply(T t)`
- `BinaryOperator<T>`: `T apply(T t1, T t2)`
- `Predicate<T>`: `boolean test(T t)`
- `Function<T,R>`: `R apply(T t)`
- `Supplier<T>`: `T get()`
- `Consumer<T>`: `void accept(T t)`

### Item 45: Use streams judiciously
- Good for: transform, filter, combine, accumulate, search
- Bad for: access corresponding elements from multiple stages
- Prefer loops when readability suffers

### Item 46: Prefer side-effect-free functions
```java
// Bad - mutates external state
words.forEach(word -> freq.merge(word, 1L, Long::sum));
// Good - pure function
Map<String, Long> freq = words.stream()
    .collect(groupingBy(String::toLowerCase, counting()));
```

### Item 47: Collection over Stream as return type
- If caller needs stream and collection, return Collection
- Collection has stream() and iteration
- Don't store large sequence just to return as collection

### Item 48: Use caution with parallel streams
- Don't parallelize indiscriminately (often slower)
- Good sources: arrays, ArrayList, HashMap, HashSet, ranges
- Bad: Stream.iterate, limit()
- Best speedup: reduce, min, max, count, anyMatch

---

## Chapter 8: Methods

### Item 49: Check parameters for validity
```java
public void setAge(int age) {
    if (age < 0) throw new IllegalArgumentException("age < 0: " + age);
    this.age = age;
}
```
- Document restrictions in Javadoc
- Use `Objects.requireNonNull()` for null checks
- Use assertion for nonpublic methods

### Item 50: Make defensive copies when needed
```java
public Period(Date start, Date end) {
    this.start = new Date(start.getTime());  // Copy before validation
    this.end = new Date(end.getTime());
    if (this.start.compareTo(this.end) > 0)
        throw new IllegalArgumentException();
}
public Date getStart() {
    return new Date(start.getTime());  // Copy on return
}
```
- Copy before validation (TOCTOU attack)
- Don't use clone() for parameters (attacker could override)

### Item 51: Design method signatures carefully
- Choose method names carefully
- Don't go overboard with convenience methods
- Avoid long parameter lists (4 or fewer)
- Prefer interfaces to classes for parameter types
- Prefer enums to boolean parameters

### Item 52: Use overloading judiciously
- Overloading: compile-time selection
- Overriding: runtime selection
- Don't overload with same number of parameters
- If you must, ensure same behavior for identical inputs

### Item 53: Use varargs judiciously
```java
// Require at least one argument
static int min(int firstArg, int... remainingArgs) {
    int min = firstArg;
    for (int arg : remainingArgs) if (arg < min) min = arg;
    return min;
}
```
- Performance: provide overloads for common cases

### Item 54: Return empty collections/arrays, not null
```java
public List<Cheese> getCheeses() {
    return cheeses.isEmpty() ? Collections.emptyList()
                             : new ArrayList<>(cheeses);
}
```

### Item 55: Return optionals judiciously
- For return values that might be absent
- Never use for: fields, collection elements, map values, arrays
- Never return `Optional.of(null)`
- Consider performance (allocation cost)

### Item 56: Write doc comments for exposed API
- Every public class, interface, method, field
- First sentence = summary description
- `@param`, `@return`, `@throws` for methods
- `{@code}` for code, `{@literal}` for special chars
- `{@index}` for searchable terms (Java 9+)

---

## Chapter 9: General Programming

### Item 57: Minimize scope of local variables
- Declare where first used
- Prefer for-each or traditional for over while
- Keep methods small and focused

### Item 58: Prefer for-each to traditional for
```java
for (Element e : elements) { ... }
```
- Can't use for-each: destructive filtering, transforming, parallel iteration

### Item 59: Know and use the libraries
- java.lang, java.util, java.io, java.util.concurrent
- Don't reinvent: Random → ThreadLocalRandom
- Read release notes for new features

### Item 60: Avoid float and double for exact answers
```java
// Bad
System.out.println(1.03 - 0.42);  // 0.6100000000000001
// Good
BigDecimal price = new BigDecimal("1.03");
```
- Use BigDecimal, int, or long for monetary calculations

### Item 61: Prefer primitive types to boxed
- Primitives: faster, less memory
- Boxed: can be null (NPE), identity comparison issues
- Watch for unintentional autoboxing

### Item 62: Avoid strings where other types are appropriate
- Strings are poor substitutes for: enums, aggregates, capabilities

### Item 63: Beware string concatenation performance
- Use StringBuilder in loops
- Single expression concatenation is fine

### Item 64: Refer to objects by interfaces
```java
// Good
Set<Son> sonSet = new LinkedHashSet<>();
// Bad
LinkedHashSet<Son> sonSet = new LinkedHashSet<>();
```

### Item 65: Prefer interfaces to reflection
- Reflection: lose compile-time checking, verbose, slow
- If needed: create instance reflectively, access via interface

### Item 66: Use native methods judiciously
- Rarely needed since Java has matured
- Security risks, platform-dependent, hard to debug

### Item 67: Optimize judiciously
- Don't optimize prematurely
- Strive for good design first
- Measure before and after
- Avoid designs that limit performance (mutable public fields, inheritance over composition)

### Item 68: Adhere to naming conventions
| Type | Convention | Example |
|------|------------|---------|
| Package | lowercase, dots | com.google.common |
| Class/Interface | UpperCamelCase | BigInteger |
| Method/Field | lowerCamelCase | compareTo |
| Constant | UPPER_SNAKE | MAX_VALUE |
| Type Parameter | single letter | T, E, K, V, R |

---

## Chapter 10: Exceptions

### Item 69: Exceptions for exceptional conditions only
- Never use for control flow
- Well-designed API should not force exceptions for normal control

### Item 70: Checked exceptions for recoverable conditions
- Checked: caller can reasonably recover
- Unchecked (runtime): programming errors
- Provide methods to query state to avoid forcing exceptions

### Item 71: Avoid unnecessary checked exceptions
- If no recovery possible, use unchecked
- If single checked exception, consider state-testing method instead

### Item 72: Use standard exceptions
| Exception | Use |
|-----------|-----|
| IllegalArgumentException | Inappropriate parameter value |
| IllegalStateException | Object state inappropriate for method |
| NullPointerException | Null where prohibited |
| IndexOutOfBoundsException | Index out of range |
| ConcurrentModificationException | Concurrent modification detected |
| UnsupportedOperationException | Object doesn't support method |

### Item 73: Throw exceptions appropriate to abstraction
```java
// Exception translation
try {
    // Lower-level abstraction
} catch (LowerLevelException e) {
    throw new HigherLevelException(e);  // Chaining
}
```

### Item 74: Document all exceptions thrown
- `@throws` for checked exceptions
- `@throws` for notable unchecked exceptions
- Don't use `throws` clause for unchecked

### Item 75: Include failure-capture information
```java
public IndexOutOfBoundsException(int lowerBound, int upperBound, int index) {
    super(String.format("Lower bound: %d, Upper bound: %d, Index: %d",
        lowerBound, upperBound, index));
}
```

### Item 76: Strive for failure atomicity
- Failed method should leave object in prior state
- Check parameters before modifying object
- Order operations so failures occur before modifications
- Perform operation on copy, replace on success

### Item 77: Don't ignore exceptions
```java
// Never do this
try { ... } catch (SomeException e) { }
// If you must ignore, document why
catch (SomeException ignored) {
    // This exception is safe to ignore because...
}
```

---

## Chapter 11: Concurrency

### Item 78: Synchronize access to shared mutable data
- Synchronization for atomicity AND visibility
- `volatile` for visibility only (single variable)
- Best: share immutable data or don't share

### Item 79: Avoid excessive synchronization
- Never call alien method from synchronized block
- Do minimal work in synchronized blocks
- CopyOnWriteArrayList for rarely modified, frequently traversed lists

### Item 80: Prefer executors, tasks, and streams
```java
ExecutorService exec = Executors.newSingleThreadExecutor();
exec.execute(runnable);
exec.shutdown();
```
- Don't work directly with threads
- Choose executor based on workload (fixed, cached, scheduled)

### Item 81: Prefer concurrency utilities to wait/notify
- ConcurrentHashMap, BlockingQueue, CountDownLatch
- Use `ConcurrentHashMap.compute()` for atomic updates
- For timing, use `System.nanoTime()` not `currentTimeMillis()`

### Item 82: Document thread safety
| Level | Description |
|-------|-------------|
| Immutable | No external sync needed (String) |
| Unconditionally thread-safe | Mutable but internal sync (AtomicLong) |
| Conditionally thread-safe | Some methods need external sync |
| Not thread-safe | External sync required (ArrayList) |
| Thread-hostile | Unsafe even with external sync |

### Item 83: Use lazy initialization judiciously
- Most fields should be initialized normally
- For instance field: double-check idiom
```java
private volatile FieldType field;
FieldType getField() {
    FieldType result = field;
    if (result == null) {
        synchronized(this) {
            if (field == null) field = result = computeFieldValue();
        }
    }
    return result;
}
```
- For static field: holder class idiom
```java
private static class FieldHolder {
    static final FieldType field = computeFieldValue();
}
static FieldType getField() { return FieldHolder.field; }
```

### Item 84: Don't depend on thread scheduler
- Program shouldn't depend on number of threads
- Avoid Thread.yield() and thread priorities
- Busy-waiting is bad

---

## Chapter 12: Serialization

### Item 85: Prefer alternatives to Java serialization
- Cross-platform: JSON, Protocol Buffers
- Never deserialize untrusted data
- If you must use serialization, use object deserialization filtering

### Item 86: Implement Serializable with great caution
- Decreases flexibility (locks in implementation)
- Increases security risks
- Increases testing burden
- Not for classes designed for inheritance

### Item 87: Consider custom serialized form
- Default serialized form only if logical equals physical
- Use transient for derived fields
- Provide readObject to maintain invariants

### Item 88: Write readObject defensively
- Don't assume byte stream is valid
- Make defensive copies of mutable fields
- Don't invoke overridable methods
- Check invariants after deserialization

### Item 89: For instance control, prefer enum over readResolve
```java
public enum Elvis { INSTANCE; }  // Best
```
- readResolve is fragile
- All fields must be transient for readResolve to work

### Item 90: Consider serialization proxies
```java
private Object writeReplace() {
    return new SerializationProxy(this);
}
private void readObject(ObjectInputStream stream) throws InvalidObjectException {
    throw new InvalidObjectException("Proxy required");
}
```
- Most robust pattern for serialization

---

## The Bloch Test (Quick Reference)

Before committing any code, check:

1. **Easy to use correctly?** API obvious, pit of success
2. **Hard to use incorrectly?** Compile errors over runtime errors
3. **Mutability minimized?** Immutable by default
4. **Defensive copies?** Don't trust callers
5. **Fail fast?** Validate at entry
6. **Nulls handled?** Return empty collections, use Optional for return values
7. **Thread-safe?** Documented and implemented correctly
8. **Well documented?** Javadoc for public API

---

## Sources

- Bloch, "Effective Java" 3rd Edition (2018) - all 90 items
- Bloch, "How to Design a Good API and Why it Matters" (Google Tech Talk, 2007)

---

*"APIs should be easy to use correctly and hard to use incorrectly."* — Josh Bloch
