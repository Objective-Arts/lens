---
name: structure-first
description: Design data structures and interfaces before implementation. Use at project start or before complex features.
---

# /structure-first

Design data structures, types, and interfaces before writing implementation code.

## When to Use

- Starting a new feature or module
- Before implementing complex logic
- When requirements are ambiguous
- Refactoring existing code

## Process

1. **Identify entities** - What are the core domain objects?
2. **Define types/interfaces** - What shape does the data have?
3. **Establish relationships** - How do entities relate to each other?
4. **Define boundaries** - What are the inputs/outputs at each layer?
5. **Validate with examples** - Do concrete examples fit the structure?

## Output Format

```markdown
## Structure Design: [feature/module]

### Entities
- `Entity1` - [purpose]
- `Entity2` - [purpose]

### Types/Interfaces

```typescript
interface Entity1 {
  id: string;
  // ... fields with comments explaining purpose
}

interface Entity2 {
  // ...
}
```

### Relationships
```
Entity1 --has many--> Entity2
Entity2 --belongs to--> Entity1
```

### Boundaries

**Input boundary** (what comes in):
- [input type/source]

**Output boundary** (what goes out):
- [output type/destination]

### Example Data

```json
{
  "entity1": { ... },
  "entity2": { ... }
}
```

### Implementation Order
1. [First type to implement]
2. [Second type to implement]
3. ...
```

## Rules

- Types before functions
- Interfaces before implementations
- Data shapes before algorithms
- Validate with concrete examples before coding
- Keep types minimal - add fields as needed, not speculatively

## Anti-Patterns to Avoid

- Starting with implementation details
- Designing types around UI layout
- Adding fields "just in case"
- Circular dependencies between types
- Mixing data types with behavior

## Canon Reference

- **Bloch**: "Design interfaces before classes"
- **Fowler**: "Domain model first"
- **Evans**: "Ubiquitous language in types"
