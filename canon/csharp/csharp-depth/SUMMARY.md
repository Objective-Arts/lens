# /csharp-depth Summary

> "The more you understand C#, the simpler your code can be."

## Fundamentals

### Value vs Reference
```csharp
// Value: copied
int b = a;  // Independent copy

// Reference: shared
var list2 = list1;  // Same object
```

### Nullable References
```csharp
#nullable enable
string name = "safe";    // Non-null
string? maybe = null;    // Nullable
```

## Pattern Matching

```csharp
// Old
if (obj is string) { string s = (string)obj; }

// New
if (obj is string s) { /* use s */ }

// Switch expressions
var desc = shape switch
{
    Circle { Radius: var r } => $"Circle {r}",
    Rectangle r => $"Rect {r.Width}x{r.Height}",
    _ => "Unknown"
};
```

## Records

```csharp
public record Person(string Name, int Age);

var older = person with { Age = 31 };
person == new Person("Alice", 30); // Value equality
```

## LINQ Execution

```csharp
// DEFERRED: Nothing happens
var query = numbers.Where(n => n > 5);

// IMMEDIATE: Executes now
var list = numbers.Where(n => n > 5).ToList();
```

## Common Pitfalls

### Closure Capture
```csharp
// BUG: All print 5
for (int i = 0; i < 5; i++)
    actions.Add(() => Console.WriteLine(i));

// FIX: Capture copy
for (int i = 0; i < 5; i++) {
    int captured = i;
    actions.Add(() => Console.WriteLine(captured));
}
```

### Mutable Structs
Make structs immutable. Mutation causes subtle bugs.

## When to Use

- C# language edge cases
- Generics and variance
- LINQ optimization
- Nullable reference types

## Concrete Checks (MUST ANSWER)

- [ ] Is `#nullable enable` present at the project or file level?
- [ ] Are collection operations using LINQ instead of manual for/foreach loops with accumulators?
- [ ] Is `await` used instead of `.Result` or `.Wait()` on every Task?
- [ ] Are all structs immutable (no settable fields or properties)?
- [ ] Do closures in loops capture a local copy of the loop variable, not the loop variable itself?
