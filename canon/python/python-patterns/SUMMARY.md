# /python-patterns Summary

> "Python has a right way and a wrong way to do most things."

## Essential Patterns

| Bad | Good |
|-----|------|
| `range(len(items))` | `enumerate(items)` |
| `for i in range(len(a)): ... a[i], b[i]` | `for x, y in zip(a, b)` |
| `if key in d: d[key]` | `d.get(key, default)` |
| Return full list | Yield with generator |
| `__private` | `_protected` |

## enumerate and zip

```python
# BAD
for i in range(len(items)):
    print(f'{i}: {items[i]}')

# GOOD
for i, item in enumerate(items):
    print(f'{i}: {item}')

# GOOD: Parallel iteration
for name, age in zip(names, ages):
    print(f'{name} is {age}')
```

## Mutable Default Arguments

```python
# BUG: Same list shared across calls
def append_to(element, to=[]):
    to.append(element)
    return to

# FIX: None sentinel
def append_to(element, to=None):
    if to is None:
        to = []
    to.append(element)
    return to
```

## Generators Over Lists

```python
# BAD: Full list in memory
def read_lines(path):
    lines = []
    with open(path) as f:
        for line in f:
            lines.append(line.strip())
    return lines

# GOOD: One at a time
def read_lines(path):
    with open(path) as f:
        for line in f:
            yield line.strip()
```

## Keyword-Only Arguments

```python
def safe_division(num, denom, *, ignore_zero=False):
    # * forces keyword-only after it
    ...

safe_division(10, 2, ignore_zero=True)  # Must use keyword
```

## When to Use

- Writing idiomatic Python
- Refactoring Python code
- Code review checklists

## Concrete Checks (MUST ANSWER)

- [ ] Is tuple unpacking used to extract values instead of indexing (`x[0]`, `x[1]`)?
- [ ] Is the walrus operator (`:=`) used where it eliminates a redundant computation or extra line in `while`/`if` conditions?
- [ ] Are f-strings used instead of `str.format()` or `%` formatting in all string interpolation?
- [ ] Do all functions with boolean-style optional parameters use keyword-only arguments (after `*`)?
- [ ] Does every function with a mutable default argument use `None` as the sentinel instead?
