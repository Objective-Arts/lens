---
name: kernighan
description: "Kernighan's clarity and simplicity from The Practice of Programming"
allowed-tools: []
---

# Kernighan: Clarity Above All

Brian Kernighan's core belief: **code is read far more often than it is written.** Every decision should favor the reader over the writer.

## The Foundational Principle

> "Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it."

If you cannot debug it, you wrote it wrong. Cleverness is a cost, not a benefit.

---

## Chapter 1: Style

Style is not cosmetic. Good style makes bugs visible, code maintainable, and intent clear.

### Names

> "A name should be informative, concise, memorable, and pronounceable."

**Global variables:** Use descriptive names—they're used far from their declaration.
```python
# Good: clear at any distance
max_connection_retries = 3
user_session_timeout = 300
```

**Local variables:** Short names are fine—context makes meaning clear.
```python
# Good: short names in tight scope
for i, item in enumerate(items):
    if item.valid:
        results.append(item)
```

**Loop variables:** `i`, `j`, `k` for indices; `n`, `m` for counts; `p`, `q` for pointers.

**Functions:** Use active verbs for functions that do something, nouns for functions that return something.
```python
# Active verbs for actions
def compute_total(items): ...
def validate_input(data): ...
def send_notification(user): ...

# Nouns for accessors
def current_user(): ...
def connection_count(): ...
```

### Expressions and Statements

> "Write clearly—don't be too clever."

**Break up complex expressions:**
```python
# Not this
if ((status == OK && retries < max) || (status == RETRY && delay > 0)):

# This
can_proceed = status == OK and retries < max
should_retry = status == RETRY and delay > 0
if can_proceed or should_retry:
```

**Parenthesize to avoid ambiguity:**
```python
# Even if precedence is "obvious"
leap_year = ((year % 4) == 0 and (year % 100) != 0) or ((year % 400) == 0)
```

**Avoid side effects in expressions:**
```python
# Not this
array[i++] = array[--j]

# This
j -= 1
array[i] = array[j]
i += 1
```

### Consistency

> "Do the same thing the same way everywhere."

Pick conventions and stick to them:
- Indentation style (spaces vs tabs, amount)
- Brace placement
- Naming conventions (camelCase vs snake_case)
- Function organization

Consistency lets readers predict. Prediction enables speed.

### Comments

> "Don't comment bad code—rewrite it."

Comments should explain **why**, not **what**:
```python
# Bad: restates the code
i += 1  # increment i

# Good: explains non-obvious reason
i += 1  # skip header row in CSV

# Best: no comment needed because code is clear
row_index = 1  # skip header
```

**Comment functions at their definition, not every call:**
```python
def calculate_compound_interest(principal, rate, periods):
    """
    Calculate compound interest using the standard formula.
    Rate should be decimal (0.05 for 5%), periods in years.
    """
    return principal * ((1 + rate) ** periods)
```

---

## Chapter 2: Algorithms and Data Structures

> "Use a library or language feature whenever possible."

### Searching

- **Sequential search**: Simple, works on any collection. O(n).
- **Binary search**: Requires sorted data. O(log n). Get the boundary conditions right!

```python
# Binary search: the off-by-one errors are famous
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2  # Avoid overflow
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

### Sorting

> "Sorting algorithms are among the most studied in computer science. Use library sort."

Use the language's built-in sort. It's tested, optimized, and correct.

```python
# Just use the library
items.sort(key=lambda x: x.priority)
```

### Data Structures

**Choose the simplest structure that works:**

| Need | Structure |
|------|-----------|
| Sequential access | Array/List |
| Key-value lookup | Hash table/Dict |
| Ordered traversal | Balanced tree/Sorted list |
| LIFO | Stack |
| FIFO | Queue |

**Growing arrays**: When size is unknown, double the array when full. Amortized O(1) append.

```python
# Python lists do this automatically
# But understand why: doubling gives amortized constant time
```

### Big-O Matters (Sometimes)

> "Fancy algorithms are slow when n is small—and n is usually small."

Know your data size:
- n < 100: Anything works. Use the clearest code.
- n < 10,000: O(n²) is usually fine.
- n > 100,000: Algorithm choice matters.

---

## Chapter 3: Design and Implementation

### Start Simple

> "Start with something simple, get it working, and then enhance."

Don't design the perfect system. Design a working system, then improve it.

```python
# Version 1: Works
def process_file(filename):
    with open(filename) as f:
        for line in f:
            process_line(line)

# Version 2: Handle errors (only after v1 works)
def process_file(filename):
    try:
        with open(filename) as f:
            for line in f:
                process_line(line)
    except FileNotFoundError:
        log_error(f"File not found: {filename}")
```

### Program Structure

> "Each function should do one thing well."

Functions should be:
- **Short**: If it doesn't fit on a screen, split it.
- **Focused**: One purpose, clearly named.
- **Testable**: Inputs in, outputs out, minimal side effects.

```python
# Not this: does three things
def handle_request(request):
    # validate
    # process
    # format response
    pass

# This: each function does one thing
def validate_request(request): ...
def process_request(request): ...
def format_response(result): ...
```

---

## Chapter 4: Interfaces

> "Hide implementation details."

### Design Principles

**Small orthogonal primitives:**
```python
# Not this: one function with many modes
def process(data, mode, format, validate, transform):
    pass

# This: composable primitives
def validate(data): ...
def transform(data): ...
def format(data): ...

# Compose as needed
result = format(transform(validate(data)))
```

**Don't reach behind an abstraction:**
```python
# Not this: accessing internals
if queue._items[0].priority > 5:

# This: use the interface
if queue.peek().priority > 5:
```

### Resource Management

> "Free a resource in the same layer that allocated it."

```python
# The layer that opens, closes
def process_file(filename):
    f = open(filename)
    try:
        return parse(f.read())
    finally:
        f.close()

# Even better: context manager handles it
def process_file(filename):
    with open(filename) as f:
        return parse(f.read())
```

### Error Handling

> "Detect errors at a low level, handle them at a high level."

Low-level code detects problems. High-level code decides what to do.

```python
# Low level: detect and report
def read_config(path):
    if not os.path.exists(path):
        raise ConfigError(f"Config file not found: {path}")
    return parse_config(path)

# High level: decide policy
def start_app():
    try:
        config = read_config("app.conf")
    except ConfigError:
        config = default_config()
        log_warning("Using default config")
```

---

## Chapter 5: Debugging

> "The most effective debugging tool is still careful thought, coupled with judiciously placed print statements."

### Strategies

**Look for familiar patterns:**
- Off-by-one errors
- Uninitialized variables
- Null/None references
- Integer overflow
- Resource leaks

**Examine the most recent change:**
```bash
# What changed since it last worked?
git diff HEAD~1
```

**Make the bug reproducible:**
```python
# Log inputs for failing cases
def process(data):
    logger.debug(f"process called with: {data!r}")
    # ... rest of function
```

**Divide and conquer:**
```python
# Narrow down where the bug occurs
def complex_operation(data):
    result1 = step_one(data)
    print(f"After step 1: {result1}")  # Good here?

    result2 = step_two(result1)
    print(f"After step 2: {result2}")  # Still good?

    return step_three(result2)
```

**Explain your code to someone else (rubber duck debugging):**
The act of explaining often reveals the bug. You don't even need a person—a rubber duck works.

### Debugging Techniques

**Read the error message carefully:**
```
IndexError: list index out of range
```
The error tells you exactly what happened. Read it.

**Check boundary conditions:**
```python
# First element, last element, empty collection
assert func([]) == expected_empty
assert func([single]) == expected_single
assert func(many) == expected_many
```

**Study the numerology of failures:**
- Fails on 1024 but not 1023? Power of two issue.
- Fails on 256th item? Byte overflow.
- Works 9 times, fails on 10th? Off-by-one.

**Write self-checking code:**
```python
def transfer(from_account, to_account, amount):
    total_before = from_account.balance + to_account.balance

    from_account.withdraw(amount)
    to_account.deposit(amount)

    total_after = from_account.balance + to_account.balance
    assert total_before == total_after, "Money created or destroyed!"
```

### Don'ts

- **Don't guess.** Understand the bug before fixing it.
- **Don't make the same mistake twice.** When you find a bug, look for similar ones.
- **Don't debug while tired.** Fresh eyes catch more.
- **Don't patch symptoms.** Find the root cause.

---

## Chapter 6: Testing

> "Test code at its boundaries."

### Boundary Testing

Test the edges:
- Empty input
- Single element
- Minimum and maximum values
- Just below and just above limits

```python
def test_sort():
    assert sort([]) == []              # Empty
    assert sort([1]) == [1]            # Single
    assert sort([1, 1, 1]) == [1, 1, 1]  # Duplicates
    assert sort([3, 2, 1]) == [1, 2, 3]  # Reversed
    assert sort([1, 2, 3]) == [1, 2, 3]  # Already sorted
```

### Systematic Testing

**Test incrementally:**
```python
# Test each function as you write it
def parse_line(line):
    pass

# Immediately:
def test_parse_line():
    assert parse_line("a,b,c") == ["a", "b", "c"]
    assert parse_line("") == []
    assert parse_line("single") == ["single"]
```

**Test simple parts first:**
If a complex function fails, first verify its component functions work.

**Know what output to expect:**
```python
# Calculate expected output independently
def test_sum():
    items = [1, 2, 3, 4, 5]
    expected = 15  # Calculated by hand
    assert sum(items) == expected
```

### Automation

> "Automate regression testing."

```python
# Run all tests with one command
# pytest, unittest, etc.
$ pytest tests/
```

**Compare independent implementations:**
```python
# Check your optimized version against a simple reference
def test_optimized_search():
    for _ in range(1000):
        data = random_data()
        target = random_target()
        assert optimized_search(data, target) == simple_search(data, target)
```

### Assertions

> "Use assertions liberally."

```python
def calculate_average(numbers):
    assert len(numbers) > 0, "Cannot average empty list"
    assert all(isinstance(n, (int, float)) for n in numbers)
    return sum(numbers) / len(numbers)
```

Assertions are documentation that gets checked.

---

## Chapter 7: Performance

> "Don't optimize prematurely."

### Measure First

> "Automate timing measurements."

```python
import time

start = time.perf_counter()
result = expensive_operation()
elapsed = time.perf_counter() - start
print(f"Took {elapsed:.3f}s")
```

**Use a profiler:**
```bash
python -m cProfile -s cumtime program.py
```

### The Performance Hierarchy

1. **Use a better algorithm** (O(n²) → O(n log n))
2. **Use a better data structure** (list → hash table)
3. **Enable compiler optimizations** (-O2, -O3)
4. **Tune the code** (only after profiling)

### Don't Optimize What Doesn't Matter

If a function takes 0.1% of runtime, a 10x speedup saves 0.09%.

```python
# Profile shows 80% of time in database calls
# Don't optimize the string formatting
```

### Common Optimizations

**Cache expensive computations:**
```python
@functools.lru_cache(maxsize=128)
def expensive_lookup(key):
    return database.query(key)
```

**Avoid repeated work:**
```python
# Not this
for item in items:
    if len(items) > 100:  # Calculated every iteration
        pass

# This
item_count = len(items)
for item in items:
    if item_count > 100:
        pass
```

**Use efficient data structures:**
```python
# O(n) lookup
if item in large_list:

# O(1) lookup
if item in large_set:
```

---

## Chapter 8: Portability

> "Stick to the standard."

### Write Portable Code

- Use standard library functions
- Avoid platform-specific features when possible
- Isolate platform dependencies behind interfaces

```python
# Not this
if os.name == 'nt':
    path = 'C:\\Users\\data'
else:
    path = '/home/user/data'

# This
from pathlib import Path
path = Path.home() / 'data'
```

### Handle Variations

- **Byte order**: Use network byte order for data exchange
- **Integer sizes**: Don't assume int is 32 bits
- **Line endings**: Handle \n, \r\n, \r
- **Character encodings**: Use UTF-8, specify explicitly

```python
# Always specify encoding
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()
```

---

## Chapter 9: Notation

> "Let the machine do the dirty work."

### Use Tools

**Regular expressions** for pattern matching:
```python
import re
# Find all email addresses
emails = re.findall(r'\b[\w.-]+@[\w.-]+\.\w+\b', text)
```

**Format strings** for structured output:
```python
# Not this
print("Name: " + name + ", Age: " + str(age))

# This
print(f"Name: {name}, Age: {age}")
```

**Data-driven programming**: Express solutions in data, not code.
```python
# Not this
if day == "Monday":
    return 0
elif day == "Tuesday":
    return 1
# ... etc

# This
DAYS = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, ...}
return DAYS[day]
```

---

## The Kernighan Test

Before committing any code, ask:

1. **Can I explain this to a colleague in one sentence?** If not, simplify.
2. **Would I understand this at 3am during an outage?** If not, clarify.
3. **Is there a more obvious way?** If yes, use it.
4. **Am I being clever?** If yes, stop.
5. **Did I test the boundaries?** Empty, one, many, min, max.
6. **Did I measure before optimizing?** Profile, don't guess.

## When Reviewing Code

Apply these checks:

- [ ] Every function does one thing and its name says what
- [ ] No cleverness that requires explanation
- [ ] Names are self-documenting (globals descriptive, locals short)
- [ ] Control flow is obvious (no side effects in expressions)
- [ ] No magic numbers or strings
- [ ] Comments explain why, not what
- [ ] Errors detected low, handled high
- [ ] Resources freed in same layer as allocated
- [ ] Boundaries tested (empty, one, many)
- [ ] Consistency throughout (same thing same way)

## When NOT to Use This Skill

Use a different skill when:
- **Writing Go/systems code** → Use `pike` (Go proverbs, small interfaces)
- **Writing C/systems code** → Use `linus` (kernel style)
- **Performance is critical** → Use `carmack` (optimization, data-oriented design)
- **Designing class hierarchies** → Use `gang-of-four` or `bloch`
- **Building CLI tools** → Use `mcilroy` (Unix philosophy, composition)
- **Proving correctness matters** → Use `dijkstra` (formal reasoning)

Kernighan is for **general application code clarity**—not specialized domains.

## Sources

- Kernighan & Pike, "The Practice of Programming" (1999)
- Kernighan & Plauger, "The Elements of Programming Style" (1978)
- Kernighan & Ritchie, "The C Programming Language" (1978)

---

*"The most effective debugging tool is still careful thought, coupled with judiciously placed print statements." — Brian Kernighan*
