# Python Canon

4 masters providing idiomatic Python expertise.

## The Experts

| Master | Works | Focus | Skill |
|--------|-------|-------|-------|
| **Raymond Hettinger** | Core Python talks, itertools | Pythonic idioms, "There must be a better way" | `/hettinger` |
| **David Beazley** | Python Cookbook, Essential Reference | Generators, coroutines, metaprogramming | `/beazley` |
| **Luciano Ramalho** | Fluent Python | Data model, protocols, advanced features | `/ramalho` |
| **Brett Slatkin** | Effective Python | 90 specific best practices | `/slatkin` |

## When to Apply

| Context | Primary Expert |
|---------|----------------|
| Iterators, generators | Hettinger, Beazley |
| Decorators, descriptors | Hettinger |
| Concurrency, async | Beazley |
| Data model, protocols | Ramalho |
| Best practices checklist | Slatkin |
| Metaprogramming | Beazley, Ramalho |

## Core Principles

### From Hettinger
- "There must be a better way"
- Use itertools for iteration patterns
- Descriptors over boilerplate
- Named tuples for data classes

### From Beazley
- Generators are the foundation of async
- Understand the execution model
- Context managers for resource safety
- Metaprogramming for DRY

### From Ramalho
- Python's data model is the key
- Protocols over inheritance
- Dunder methods define behavior
- "Pythonic" means using the data model

### From Slatkin
- Know the difference between bytes and str
- Prefer enumerate over range(len())
- Use generators instead of returning lists
- Know when to use @property

## File Locations

```
canon/python/
├── README.md           (this file)
├── hettinger/SKILL.md
├── beazley/SKILL.md
├── ramalho/SKILL.md
└── slatkin/SKILL.md
```
