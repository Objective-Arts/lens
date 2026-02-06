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
