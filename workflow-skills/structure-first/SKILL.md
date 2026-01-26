---
name: structure-first
description: Design data structures and interfaces before implementation. Use at project start or before complex features.
---

# /structure-first

Design data structures, types, and interfaces before writing implementation code. Creates a structure file for reference during implementation.

## Why This Skill Exists

Without this skill, Claude jumps straight to writing functions and logic. The data structures emerge ad-hoc, leading to:

- Inconsistent shapes across the codebase
- Missing fields discovered mid-implementation
- Refactoring types after code is written
- No shared reference for what the data looks like

**This skill creates a persistent file** at `.claude/structures/[name].md` that:
- Documents the data model before code exists
- Serves as reference during `/build-from-plan`
- Can be reviewed and refined before implementation
- Captures relationships and boundaries explicitly

As Linus says: "Bad programmers worry about the code. Good programmers worry about data structures."

## When to Use

- Starting a new feature or module
- Before implementing complex logic
- When requirements are ambiguous
- Refactoring existing code
- After `/plan` has defined WHAT to do, before defining the SHAPE

## When NOT to Use

- Simple changes to existing structures
- Bug fixes that don't change data shape
- When types are already well-defined

## Process

1. **Identify entities** - What are the core domain objects?
2. **Invoke Canon** - Apply domain-specific expertise (see below)
3. **Define types/interfaces** - What shape does the data have?
4. **Establish relationships** - How do entities relate to each other?
5. **Define boundaries** - What are the inputs/outputs at each layer?
6. **Validate with examples** - Do concrete examples fit the structure?
7. **Document** - Write structure to `.claude/structures/` file

## Invoke Canon Skills

Before defining types, invoke domain-specific canon skills:

| Concern | Canon Skills | What They Inform |
|---------|--------------|------------------|
| Data structures | `/linus` | Data structures first, algorithms follow |
| Domain modeling | `/evans` | Entities, value objects, aggregates, bounded contexts |
| API design | `/bloch` | Interfaces before classes, immutability |
| Type systems | `/cherny`, `/hejlsberg` | TypeScript/C# type design |
| Python data model | `/ramalho` | Data model, protocols |
| Composition | `/pike` | Small interfaces, composition over inheritance |
| Patterns | `/gang-of-four` | When to use which structural pattern |

**Example**: Designing types for a payment system:
1. Invoke `/evans` - identify entities (Order) vs value objects (Money)
2. Invoke `/linus` - think data structures first
3. Invoke `/bloch` - design immutable value objects, defensive copies
4. Invoke `/gang-of-four` - consider Strategy for payment methods

## Structure File Location

Structures are stored in `.claude/structures/`:
- `.claude/structures/payment-types.md`
- `.claude/structures/user-domain.md`
- `.claude/structures/[feature-name].md`

## Structure File Format

```markdown
# Structure: [feature/module]

## Entities
- `Entity1` - [purpose]
- `Entity2` - [purpose]

## Types/Interfaces

```typescript
interface Entity1 {
  id: string;
  // ... fields with comments explaining purpose
}

interface Entity2 {
  // ...
}
```

## Relationships
```
Entity1 --has many--> Entity2
Entity2 --belongs to--> Entity1
```

## Boundaries

**Input boundary** (what comes in):
- [input type/source]

**Output boundary** (what goes out):
- [output type/destination]

## Example Data

```json
{
  "entity1": { ... },
  "entity2": { ... }
}
```

## Implementation Order
1. [First type to implement]
2. [Second type to implement]
3. ...
```

## Output

After designing, present summary:

```markdown
## Structure Ready

**Feature**: [name]
**Entities**: [count] types defined
**Relationships**: [brief description]

Structure written to: `.claude/structures/[name].md`

Ready for implementation.
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

## Dual Workflow: Different Purpose per Flow

`/structure-first` serves different purposes in each workflow:

```
NEW CODE FLOW:
/plan → /structure-first → /build-from-plan → [review gates]
              │
              └─► DESIGN new types before they exist

LEGACY CODE FLOW:
/plan → /structure-first → /refactor-clean → [review gates]
              │
              └─► DOCUMENT existing types, find hidden domain objects
```

### New Code: Design Phase

When building new features, `/structure-first`:
- Designs types/interfaces from scratch
- Applies Evans DDD to identify entities vs value objects
- Creates a blueprint for implementation

### Legacy Code: Analysis Phase

When modernizing existing code, `/structure-first`:
- Documents the current data model
- Identifies hidden aggregates and bounded contexts
- Finds domain objects buried in procedural code
- Creates a map for refactoring

### Canon Focus by Flow

| Flow | Canon to Invoke |
|------|-----------------|
| New Code | `/evans`, `/linus`, `/bloch` (design new structures) |
| Legacy | `/evans`, `/feathers` (find hidden domain, identify seams) |

`/structure-first` bridges planning and implementation - after deciding WHAT to do, before deciding HOW to code it.
