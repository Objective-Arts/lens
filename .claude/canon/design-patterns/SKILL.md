---
name: design-patterns
description: "Classic design patterns"
allowed-tools: []
---

# Gang of Four: Design Patterns

The core belief: **Favor object composition over class inheritance.** Design to interfaces, not implementations. Find what varies and encapsulate it.

## When to Invoke This Skill

Use this skill when you encounter these situations:

```
SITUATION                              LIKELY PATTERN
---------------------------------------------------------------------------------------------------------
Need to create objects without         Factory Method, Abstract Factory, Builder
specifying exact classes

Object creation is complex with        Builder
many optional parameters

Need only one instance of a class      Singleton (use sparingly)

Want to add behavior without           Decorator
changing existing code

Need to simplify a complex             Facade
subsystem interface

Objects need to be notified            Observer
when state changes

Need to switch algorithms              Strategy
at runtime

Have conditional logic based           State
on object state

Want to traverse a collection          Iterator
without exposing internals

Need to undo/redo operations           Command, Memento

Incompatible interfaces need           Adapter
to work together

Want to treat individual objects       Composite
and compositions uniformly
```

---

## The 23 Patterns (Quick Reference)

### Creational Patterns
*How objects are created*

**Factory Method**
- Intent: Define interface for creating objects, let subclasses decide which class
- Use when: A class can't anticipate which objects it must create
- Structure: Creator declares factory method, ConcreteCreator overrides it

**Abstract Factory**
- Intent: Create families of related objects without specifying concrete classes
- Use when: System should be independent of how products are created
- Structure: AbstractFactory, ConcreteFactories, AbstractProducts, ConcreteProducts

**Builder**
- Intent: Separate construction from representation
- Use when: Complex object with many optional parts
- Structure: Director calls Builder steps, Builder assembles Product

**Prototype**
- Intent: Create objects by cloning a prototype
- Use when: Classes to instantiate are specified at runtime
- Structure: Prototype declares clone(), ConcretePrototypes implement it

**Singleton**
- Intent: Ensure class has only one instance, provide global access
- Use when: Exactly one instance needed (logging, config, thread pools)
- Warning: Often overused. Consider dependency injection instead.

---

### Structural Patterns
*How objects are composed*

**Adapter**
- Intent: Convert interface of a class into one clients expect
- Use when: You want to use existing class but interface doesn't match
- Structure: Adapter wraps Adaptee, implements Target interface

**Bridge**
- Intent: Decouple abstraction from implementation
- Use when: Want to vary both abstraction and implementation independently
- Structure: Abstraction holds reference to Implementor

**Composite**
- Intent: Compose objects into tree structures, treat uniformly
- Use when: Represent part-whole hierarchies
- Structure: Component, Leaf, Composite (contains Components)

**Decorator**
- Intent: Attach additional responsibilities dynamically
- Use when: Extension by subclassing is impractical
- Structure: Decorator wraps Component, adds behavior
- Example: BufferedInputStream decorates FileInputStream

**Facade**
- Intent: Provide unified interface to subsystem
- Use when: Want to simplify complex subsystem for clients
- Structure: Facade knows which subsystem classes handle requests

**Flyweight**
- Intent: Share objects to support large numbers efficiently
- Use when: Many similar objects, storage costs are high
- Structure: Flyweight stores intrinsic state, extrinsic passed in

**Proxy**
- Intent: Provide surrogate or placeholder for another object
- Use when: Need lazy loading, access control, or remote access
- Types: Virtual proxy, protection proxy, remote proxy

---

### Behavioral Patterns
*How objects interact*

**Chain of Responsibility**
- Intent: Avoid coupling sender to receiver by giving multiple objects a chance
- Use when: More than one object may handle request
- Structure: Handler has successor, either handles or forwards

**Command**
- Intent: Encapsulate request as object, enabling undo/queue/log
- Use when: Need to parameterize objects with operations
- Structure: Command has execute(), Invoker holds Command, Receiver does work

**Interpreter**
- Intent: Define grammar representation and interpreter
- Use when: Language to interpret, grammar is simple
- Structure: AbstractExpression, TerminalExpression, NonterminalExpression

**Iterator**
- Intent: Access elements sequentially without exposing representation
- Use when: Need uniform traversal of different collections
- Structure: Iterator has next(), hasNext(); Aggregate creates Iterator

**Mediator**
- Intent: Define object that encapsulates how objects interact
- Use when: Objects communicate in complex but well-defined ways
- Structure: Mediator knows Colleagues, Colleagues know Mediator

**Memento**
- Intent: Capture and externalize object's state for later restore
- Use when: Need undo, snapshots, or checkpoints
- Structure: Originator creates Memento, Caretaker keeps it

**Observer**
- Intent: When one object changes, dependents are notified automatically
- Use when: Change to one object requires changing others (unknown which)
- Structure: Subject has attach/detach/notify, Observer has update()

**State**
- Intent: Allow object to alter behavior when internal state changes
- Use when: Object behavior depends on state, many conditionals on state
- Structure: Context delegates to State, ConcreteStates implement behavior

**Strategy**
- Intent: Define family of algorithms, make them interchangeable
- Use when: Many related classes differ only in behavior
- Structure: Strategy interface, ConcreteStrategies, Context uses Strategy

**Template Method**
- Intent: Define skeleton of algorithm, let subclasses fill in steps
- Use when: Subclasses should extend specific steps, not whole algorithm
- Structure: AbstractClass has templateMethod() calling abstract steps

**Visitor**
- Intent: Define new operation without changing classes it operates on
- Use when: Many distinct operations on object structure
- Structure: Visitor has visit() per element type, Element has accept(Visitor)

---

## The Gang of Four Test

Before implementing a pattern, ask:

1. **Is this solving a real problem?** Don't pattern for pattern's sake.
2. **Is this the simplest pattern that works?** Prefer simpler patterns.
3. **Have I considered composition over inheritance?** The GoF mantra.
4. **Does this add flexibility I actually need?** YAGNI still applies.
5. **Can others understand this?** Pattern should clarify, not obscure.

---

## Pattern Selection Guide

```
PROBLEM                                   PATTERN TO CONSIDER
---------------------------------------------------------------------------------------------------------
"I need to create objects but don't      Factory Method
 know exact types until runtime"

"I need families of related objects      Abstract Factory
 that must be used together"

"Construction is complex with many       Builder
 optional parameters"

"I want to add features to objects       Decorator
 without inheritance explosion"

"External library has wrong interface"   Adapter

"I have nested structures like           Composite
 files/folders or UI components"

"Too many classes depend on each         Mediator
 other directly"

"Actions need to be undoable"            Command + Memento

"Object behavior changes based on        State (if states are objects)
 internal state"                         Strategy (if algorithms are swapped)

"Many objects need to react when         Observer
 something changes"

"Algorithm should be selected            Strategy
 at runtime"

"Common algorithm with varying steps"    Template Method
```

---

## Anti-Patterns (Pattern Misuse)

**Singleton Abuse**
- Using Singleton when simple dependency injection works
- Making everything global "because Singleton"
- Fix: Ask "does this really need global access?"

**Pattern Obsession**
- Applying patterns to simple problems
- Adding layers of abstraction for no benefit
- Fix: Start simple, add patterns when pain emerges

**Decorator Christmas Tree**
- Wrapping decorators too deep, losing track
- Fix: Consider if a different pattern (Strategy?) is cleaner

**Observer Memory Leaks**
- Forgetting to unsubscribe, holding references
- Fix: Weak references or explicit lifecycle management

**Inheritance Addiction**
- Using Template Method when Strategy would be simpler
- Deep inheritance hierarchies
- Fix: "Favor composition over inheritance"

---

## Modern Considerations

The GoF patterns were written for C++ and Smalltalk in 1994. Modern adjustments:

**Singleton**: Use dependency injection frameworks instead. If you must, ensure thread safety.

**Observer**: Consider reactive streams (RxJS, Reactor) or event buses.

**Iterator**: Most languages have built-in iteration. Use native constructs.

**Strategy**: Lambdas and first-class functions often replace the need for Strategy classes.

**Factory**: Consider static factory methods (java) as lighter alternative.

**Command**: Consider functional approaches for simple cases.

---

## When Reviewing Code

Apply these checks:

- [ ] Pattern is solving a real problem, not added speculatively
- [ ] Simplest applicable pattern was chosen
- [ ] Composition preferred over inheritance where possible
- [ ] Pattern implementation matches intent (not cargo-culted)
- [ ] Code is clearer with the pattern than without
- [ ] No pattern obsession (simple code left simple)

---

## When NOT to Use This Skill

Use a different skill when:
- **Writing Java/Kotlin idioms** → Use `java` (Effective Java patterns)
- **Designing algorithms** → Use `algorithms` (algorithmic rigor, complexity)
- **Proving correctness** → Use `correctness` (formal methods, invariants)
- **Writing functional code** → Use `optimization` (functional core, purity)
- **General code clarity** → Use `clarity` (readability, simplicity)

Gang of Four is the **OO design patterns skill**—use it when you need a specific pattern from the classic 23.

## Sources

- Gamma, Helm, Johnson, Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software" (1994)
- Often called "the GoF book" after its four authors (Gang of Four)

---

*"Program to an interface, not an implementation."* — Gang of Four
