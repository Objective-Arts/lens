# /python-idioms Summary

> "There must be a better way."

## Core Transforms

| Instead Of | Use |
|------------|-----|
| `for i in range(len(x))` | `for i, item in enumerate(x)` |
| `if x in dict.keys()` | `if x in dict` |
| Manual counter dict | `Counter(items)` |
| Manual grouping dict | `defaultdict(list)` |
| Building string in loop | `''.join(parts)` |
| `lambda x: func(x)` | Just `func` |

## Essential Tools

```python
from collections import Counter, defaultdict, namedtuple
from itertools import chain, groupby, islice, combinations
from functools import wraps, lru_cache

# Count things
word_count = Counter(words)

# Group things
groups = defaultdict(list)
for item in items:
    groups[key(item)].append(item)

# Flatten nested
flat = list(chain.from_iterable(nested))

# Named data
Point = namedtuple('Point', ['x', 'y'])

# Memoize
@lru_cache(maxsize=128)
def expensive(n): ...
```

## Pythonic Patterns

```python
# Swap
a, b = b, a

# Unpack
first, *rest = items
first, *middle, last = items

# Comprehensions over loops
result = [transform(x) for x in items if condition(x)]

# Dictionary merge (3.9+)
merged = dict1 | dict2
```

## Load Full Skill When

- Designing descriptors for reusable validation
- Complex iteration patterns (groupby, product, permutations)
- Context manager implementation

## Concrete Checks (MUST ANSWER)

- [ ] Is every `for i in range(len(x))` replaced with `enumerate(x)` or a comprehension?
- [ ] Are `map()`/`filter()` calls replaced with list comprehensions or generator expressions?
- [ ] Is `pathlib.Path` used instead of `os.path.join`, `os.path.exists`, and other `os.path` calls?
- [ ] Is `Counter` used for counting and `defaultdict` for grouping instead of manual dict accumulation?
- [ ] Do all decorators use `@functools.wraps` to preserve the wrapped function's metadata?
