# Java Rubric

Loaded when Java signals detected. Covers Effective Java patterns, immutability, null safety, and API design.

## Review Criteria

1. **Immutability** — Classes immutable unless mutation required. Fields `private final`. No setters that expose internal state. Defensive copies on construction and in getters for mutable types.
2. **Static Factories** — Named factory methods (`from`, `of`, `valueOf`, `getInstance`, `create`) over public constructors. Enables caching, subtype flexibility, and self-documenting call sites.
3. **Composition Over Inheritance** — Delegation and forwarding over extending concrete classes. Inheritance documented (`@implSpec`) or prohibited (`final`). No calling overridable methods from constructors.
4. **Program to Interfaces** — Parameters and return types declared as interfaces (`List`, `Set`, `Map`), not implementations (`ArrayList`, `LinkedHashSet`). Concrete types only where implementation matters.
5. **Null Safety** — Return empty collections, not null. `Optional` only for return values that might legitimately be absent — never for fields, parameters, or collection elements. `Objects.requireNonNull()` at entry points.
6. **Fail Fast** — Parameter validation at method entry. `IllegalArgumentException` for bad args, `IllegalStateException` for bad state, `NullPointerException` via `requireNonNull`. Errors detected close to cause.
7. **equals/hashCode Contract** — Override both together or neither. Satisfy: reflexive, symmetric, transitive, consistent, null-safe. Consider records or `@Value` for data classes.
8. **Builder Pattern** — Use for 3+ constructor parameters or optional parameters. Builder validates in `build()`, not after construction.
9. **Resource Management** — Try-with-resources for all `AutoCloseable` resources. No manual `close()` in finally blocks. Suppress secondary exceptions correctly.
10. **Exception Discipline** — Checked exceptions for recoverable conditions. Runtime exceptions for programming errors. Preserve cause chains. No empty catch blocks. No `throws Exception`.

## Planning Checklist

| Concern | What the plan must address |
|---------|---------------------------|
| Immutability | Final fields. Defensive copies. No mutable leaks. |
| Factories | Static factory methods where constructors are insufficient. |
| Composition | Delegation over inheritance. Final or documented for extension. |
| Interfaces | Parameter/return types as interfaces. |
| Null Safety | Empty collections. Optional for returns only. requireNonNull at boundaries. |
| Fail Fast | Validation at entry. Correct exception types. |
| Resources | Try-with-resources. No manual close. |
| Exceptions | Checked vs runtime. Cause chains. No empty catch. |
