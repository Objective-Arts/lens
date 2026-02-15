# /python-protocols Summary

> "Understanding special methods is the key to Pythonic code."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Data model is everything** | Dunder methods define how objects behave |
| **Protocols over inheritance** | Implement methods, not base classes |
| **Duck typing** | If it walks like a duck... |

## Make Objects Work with Python

```python
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):  # Always implement
        return f'Vector({self.x!r}, {self.y!r})'

    def __abs__(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

# Now works naturally: abs(v), v + v, print(v)
```

## Key Protocols

| Protocol | Methods | Enables |
|----------|---------|---------|
| Sequence | `__len__`, `__getitem__` | Indexing, slicing, iteration |
| Iterable | `__iter__` | for loops |
| Callable | `__call__` | `obj()` syntax |
| Context | `__enter__`, `__exit__` | `with` statement |

## The Sequence Protocol

```python
class Deck:
    def __len__(self):
        return len(self._cards)

    def __getitem__(self, position):
        return self._cards[position]

# Now supports: len(), indexing, slicing, in, iteration
```

## Rules

- Always implement `__repr__` (useful debugging)
- Use `@property` for computed/validated attributes
- Use `__slots__` when memory matters
- Implement protocols, don't inherit from builtins

## When to Use

- Designing Python classes
- Making objects Pythonic
- Understanding special methods

## Concrete Checks (MUST ANSWER)

- [ ] Does every custom class implement `__repr__` returning a string that could reconstruct the object?
- [ ] Are structural protocols (implementing `__len__`/`__getitem__`/`__iter__`) used instead of inheriting from `list`, `dict`, or ABCs?
- [ ] If a class defines `__eq__`, does it also define `__hash__` (or explicitly set `__hash__ = None` for mutable types)?
- [ ] Are descriptors used for validation/computed attributes that repeat across multiple classes, instead of copy-pasting `@property` definitions?
- [ ] Do `__add__`, `__mul__`, and other binary dunder methods return `NotImplemented` (not raise `TypeError`) for unsupported operand types?
