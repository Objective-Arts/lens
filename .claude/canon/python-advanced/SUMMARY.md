# /python-advanced Summary

> "Python's power comes from understanding its execution model."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Understand execution** | Know how Python actually runs, not just what it does |
| **Generators are foundation** | Everything async builds on generators |
| **Lazy evaluation** | Process one item at a time for memory efficiency |
| **Context managers** | Always use for resource safety |

## Generator Pipelines

```python
# Memory-efficient processing
def read_large_file(path):
    with open(path) as f:
        for line in f:
            yield line.strip()

def grep(pattern, lines):
    for line in lines:
        if pattern in line:
            yield line

# Compose (processes one line at a time)
lines = read_large_file('huge.log')
matches = grep('ERROR', lines)
```

## Generator Expressions Over Lists

```python
# BAD: Creates entire list in memory
total = sum([x * x for x in range(1000000)])

# GOOD: Generator expression, one at a time
total = sum(x * x for x in range(1000000))
```

## Context Managers

```python
from contextlib import contextmanager

@contextmanager
def managed_resource(name):
    resource = acquire(name)
    try:
        yield resource
    finally:
        resource.release()
```

## Memory Optimization

```python
# With __slots__: ~50 bytes per instance vs ~300+ without
class Point:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

## When to Use

- Large data processing
- Async/await patterns
- Memory-critical applications
- Resource management

## Concrete Checks (MUST ANSWER)

- [ ] Do functions processing large sequences yield items via generators instead of returning full lists?
- [ ] Is every file handle, database connection, and lock wrapped in a `with` statement or `@contextmanager`?
- [ ] Are generator expressions used instead of list comprehensions inside `sum()`, `any()`, `all()`, `min()`, `max()`?
- [ ] If metaclasses are used, is there a concrete reason ABCs, decorators, or `__init_subclass__` cannot achieve the same result?
- [ ] Do high-instance-count classes define `__slots__` to reduce memory overhead?
