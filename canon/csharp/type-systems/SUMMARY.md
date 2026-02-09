# /type-systems Summary

> "Make the easy things easy, and the hard things possible."

## Design Philosophy

| Principle | Meaning |
|-----------|---------|
| **Progressive complexity** | Simple case simple; power available when needed |
| **Opt-in features** | Advanced features don't complicate basic code |
| **Backward compatible** | Existing code always works |
| **Compiler as partner** | Catches mistakes at compile time |

## Type System Evolution

```csharp
// C# 1: Explicit everywhere
List<string> names = new List<string>();

// C# 3: var inference
var names = new List<string>();

// C# 9: Target-typed new
List<string> names = new();

// C# 12: Collection expressions
List<string> names = ["Alice", "Bob"];
```

## Null Safety (Opt-in)

```csharp
#nullable enable
string name = "safe";      // Non-null guaranteed
string? nullable = null;   // Explicit nullable
```

## Pattern Matching

```csharp
var result = shape switch
{
    Circle { Radius: 0 } => "Point",
    Circle { Radius: var r } => $"Circle: {r}",
    Rectangle r when r.Width == r.Height => "Square",
    _ => "Unknown"
};
```

## Records (Immutable Data)

```csharp
public record Person(string Name, int Age);

var older = person with { Age = 31 };  // Copy with change
```

## The Hejlsberg Test

1. Is the simple case simple?
2. Is complexity opt-in?
3. Is it composable?
4. Is it explicit (no hidden magic)?
5. Is it safe by default?

## When to Use

- API design decisions
- Choosing language features
- Understanding C# idioms

## Concrete Checks (MUST ANSWER)

- [ ] Does the type system encode domain constraints (e.g., `UserId` vs raw `string`, `PositiveInt` vs `int`) so invalid states are unrepresentable?
- [ ] Are phantom types or branded types used where two values share a runtime type but must not be interchangeable (e.g., `Meters` vs `Feet`)?
- [ ] Are union/discriminated-union types used instead of boolean flags to represent mutually exclusive states?
- [ ] Does every nullable type have an explicit annotation (`?`, `Option`, `Maybe`) rather than relying on implicit null?
- [ ] Is the simple case still simple -- does the added type safety not require users to understand generics/advanced features for basic usage?
