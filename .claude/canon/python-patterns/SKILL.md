---
name: python-patterns
description: "Effective Python - 90 specific ways to write better Python code"
---

# Brett Slatkin - Effective Python

Apply Brett Slatkin's best practices from "Effective Python: 90 Specific Ways to Write Better Python." Concrete, actionable guidance for professional Python code.

## Core Principles

### Know the Difference Between Bytes and Str

```python
# Python 3: str is Unicode, bytes is raw
def to_str(bytes_or_str):
    if isinstance(bytes_or_str, bytes):
        return bytes_or_str.decode('utf-8')
    return bytes_or_str

def to_bytes(bytes_or_str):
    if isinstance(bytes_or_str, str):
        return bytes_or_str.encode('utf-8')
    return bytes_or_str

# File I/O: be explicit
with open('data.txt', 'r', encoding='utf-8') as f:  # Text mode
    text = f.read()

with open('data.bin', 'rb') as f:  # Binary mode
    data = f.read()
```

### Prefer enumerate Over range(len())

```python
# BAD
for i in range(len(items)):
    print(f'{i}: {items[i]}')

# GOOD
for i, item in enumerate(items):
    print(f'{i}: {item}')

# Start at different index
for i, item in enumerate(items, start=1):
    print(f'{i}: {item}')
```

### Use zip to Process Iterators in Parallel

```python
names = ['Alice', 'Bob', 'Charlie']
ages = [25, 30, 35]

# BAD
for i in range(len(names)):
    print(f'{names[i]} is {ages[i]}')

# GOOD
for name, age in zip(names, ages):
    print(f'{name} is {age}')

# For unequal lengths, use itertools.zip_longest
from itertools import zip_longest
for name, age in zip_longest(names, ages, fillvalue='?'):
    print(f'{name} is {age}')
```

## Prescriptive Rules

### Prefer get Over in and KeyError

```python
# BAD: Multiple lookups
if key in counters:
    count = counters[key]
else:
    count = 0

# GOOD: Single lookup with default
count = counters.get(key, 0)

# For accumulation, use setdefault
votes = {}
votes.setdefault(name, []).append(vote)
```

### Use None and Docstrings for Dynamic Default Arguments

```python
# BAD: Mutable default
def append_to(element, to=[]):  # Bug! Same list shared
    to.append(element)
    return to

# GOOD: None sentinel
def append_to(element, to=None):
    """Append element to list.

    Args:
        element: Item to append
        to: Target list. If None, creates new list.

    Returns:
        List with element appended.
    """
    if to is None:
        to = []
    to.append(element)
    return to
```

### Know How Closures Interact with Variable Scope

```python
# Bug: closure captures variable, not value
def create_multipliers():
    return [lambda x: x * i for i in range(5)]

multipliers = create_multipliers()
multipliers[2](3)  # Returns 12, not 6!

# Fix: Capture value with default argument
def create_multipliers():
    return [lambda x, i=i: x * i for i in range(5)]
```

### Prefer Generators to Returning Lists

```python
# BAD: Returns full list
def read_lines(path):
    lines = []
    with open(path) as f:
        for line in f:
            lines.append(line.strip())
    return lines

# GOOD: Generator yields one at a time
def read_lines(path):
    with open(path) as f:
        for line in f:
            yield line.strip()

# Even better for simple cases
def read_lines(path):
    with open(path) as f:
        yield from (line.strip() for line in f)
```

### Know When to Use @property

```python
class Resistor:
    def __init__(self, ohms):
        self._ohms = ohms

    @property
    def ohms(self):
        return self._ohms

    @ohms.setter
    def ohms(self, value):
        if value < 0:
            raise ValueError('Must be >= 0')
        self._ohms = value

# Use property for:
# - Adding validation to existing attributes
# - Making attributes read-only
# - Computing derived attributes
# - Maintaining backward compatibility
```

### Prefer Public Attributes Over Private Ones

```python
# BAD: Using __name mangling unnecessarily
class MyClass:
    def __init__(self):
        self.__value = 0  # Name mangled to _MyClass__value

# GOOD: Single underscore for "internal"
class MyClass:
    def __init__(self):
        self._value = 0  # Convention: "please don't touch"

# Only use __ when you need to avoid name collisions in subclasses
```

### Use *args for Flexible Function Signatures

```python
def log(message, *values):
    if not values:
        print(message)
    else:
        print(f'{message}: {", ".join(str(v) for v in values)}')

log('Hi')                    # Hi
log('Values', 1, 2, 3)       # Values: 1, 2, 3

# Require keyword-only arguments with *
def safe_division(numerator, denominator, *, ignore_zero=False):
    if denominator == 0:
        if ignore_zero:
            return 0
        raise ValueError('Cannot divide by zero')
    return numerator / denominator

safe_division(10, 2, ignore_zero=True)  # Must use keyword
```

## Key Patterns

### List Comprehensions Over map/filter

```python
# OK: map and filter
result = map(lambda x: x ** 2, filter(lambda x: x % 2 == 0, numbers))

# BETTER: List comprehension
result = [x ** 2 for x in numbers if x % 2 == 0]

# Generator expression for large data
result = (x ** 2 for x in numbers if x % 2 == 0)
```

### Use Assignment Expressions (:=) Wisely

```python
# Python 3.8+
# BAD: Repeated computation
if len(data) > 10:
    print(f'Data has {len(data)} items')

# GOOD: Walrus operator
if (n := len(data)) > 10:
    print(f'Data has {n} items')

# Useful in while loops
while (line := file.readline()):
    process(line)
```

## Anti-Patterns

| Pattern | Slatkin Fix |
|---------|-------------|
| `range(len(x))` | `enumerate(x)` |
| `if key in dict: dict[key]` | `dict.get(key, default)` |
| Mutable default argument | `None` with `if None` check |
| Return full list | Yield with generator |
| `__private` attributes | `_protected` convention |
| Nested list comprehension (3+ levels) | Break into loops or functions |

## Review Checklist

- [ ] Using `enumerate` instead of `range(len())`?
- [ ] Using `zip` for parallel iteration?
- [ ] Using `.get()` with defaults?
- [ ] No mutable default arguments?
- [ ] Generators for large sequences?
- [ ] `@property` for computed/validated attributes?
- [ ] Single underscore for internal attributes?

## Key Insight

> "Python has a right way and a wrong way to do most things. Effective Python is about learning the right way—not through abstract principles, but through specific, practical techniques you can apply immediately."
