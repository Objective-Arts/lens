# /gang-of-four Summary

> "Favor composition over inheritance. Design to interfaces. Encapsulate what varies."

## Essential Patterns (Most Commonly Applied)

| Pattern | Apply When | Structure |
|---------|------------|-----------|
| **Factory Method** | Object creation varies by context | Creator → ConcreteCreator → Product |
| **Builder** | Complex object with many optional parts | Director → Builder → Product |
| **Strategy** | Algorithm needs to vary at runtime | Context → Strategy interface → ConcreteStrategies |
| **Observer** | Objects need notification of state changes | Subject → Observer interface → ConcreteObservers |
| **Decorator** | Add behavior without modifying class | Component → Decorator wraps Component |
| **Facade** | Simplify complex subsystem | Facade provides simple interface to subsystem |
| **Adapter** | Interface doesn't match what client expects | Adapter wraps Adaptee, implements Target |
| **Composite** | Treat single objects and collections uniformly | Component → Leaf + Composite |

## Load Full Skill When

- Implementing a specific pattern in depth
- Choosing between similar patterns (State vs Strategy, Decorator vs Proxy)
- Refactoring to patterns (replacing conditionals with polymorphism)
- Explaining pattern trade-offs to team

## Quick Reference: Which Pattern?

```
PROBLEM                           PATTERN
─────────────────────────────────────────────────
Create without specifying class → Factory Method
Many optional constructor args  → Builder
Switch algorithm at runtime     → Strategy
React to state changes          → Observer
Add behavior dynamically        → Decorator
Simplify complex API            → Facade
Make incompatible things work   → Adapter
Tree structures, uniform access → Composite
Object state drives behavior    → State
Undo/redo, queue operations     → Command
```

## Anti-Patterns to Avoid

| Don't | Why | Instead |
|-------|-----|---------|
| Use Singleton for everything | Hidden dependencies, testing nightmare | Dependency injection |
| Inherit for code reuse | Tight coupling, fragile base class | Composition + delegation |
| Pattern for pattern's sake | Complexity without benefit | Simple code first |
