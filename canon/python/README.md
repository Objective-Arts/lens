# Python Canon

4 skills providing idiomatic Python expertise.

## The Experts

| Skill | Focus | Command |
|-------|-------|---------|
| **python-idioms** | Pythonic idioms, "There must be a better way" | `/python-idioms` |
| **python-advanced** | Generators, coroutines, metaprogramming | `/python-advanced` |
| **python-protocols** | Data model, protocols, advanced features | `/python-protocols` |
| **python-patterns** | 90 specific best practices | `/python-patterns` |

## When to Apply

| Context | Primary Skill |
|---------|---------------|
| Iterators, generators | python-idioms, python-advanced |
| Decorators, descriptors | python-idioms |
| Concurrency, async | python-advanced |
| Data model, protocols | python-protocols |
| Best practices checklist | python-patterns |
| Metaprogramming | python-advanced, python-protocols |

## Core Principles

### From python-idioms
- "There must be a better way"
- Use itertools for iteration patterns
- Descriptors over boilerplate
- Named tuples for data classes

### From python-advanced
- Generators are the foundation of async
- Understand the execution model
- Context managers for resource safety
- Metaprogramming for DRY

### From python-protocols
- Python's data model is the key
- Protocols over inheritance
- Dunder methods define behavior
- "Pythonic" means using the data model

### From python-patterns
- Know the difference between bytes and str
- Prefer enumerate over range(len())
- Use generators instead of returning lists
- Know when to use @property

## File Locations

```
canon/python/
├── README.md           (this file)
├── python-idioms/SKILL.md
├── python-advanced/SKILL.md
├── python-protocols/SKILL.md
└── python-patterns/SKILL.md
```
