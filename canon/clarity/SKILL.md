---
name: clarity
description: "Clarity and simplicity"
allowed-tools: []
---

# Kernighan: Clarity Above All

Brian Kernighan's core belief: **code is read far more often than it is written.** Every decision should favor the reader over the writer.

## The Foundational Principle

> "Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it."

If you cannot debug it, you wrote it wrong. Cleverness is a cost, not a benefit.

## Core Principles

### 1. Say What You Mean, Simply and Directly

Write the clearest code that does the job. If there's a straightforward way and a clever way, choose straightforward.

**Not this:**
```python
result = data and data[0] or default
```

**This:**
```python
result = data[0] if data else default
```

### 2. Write for Readers, Not the Compiler

The compiler doesn't care about clarity. Your future self does. Your teammates do.

- Choose names that explain purpose, not implementation
- Structure code to reveal intent
- Don't compress logic to save lines

### 3. Clarity Over Cleverness, Always

Every clever trick is a future debugging session. Ask: "Will I understand this in six months? Will a new teammate?"

If the answer is uncertain, rewrite it simply.

### 4. Keep It Simple

> "Controlling complexity is the essence of computer programming." — Brian Kernighan

- Small functions that do one thing
- Obvious control flow
- No hidden side effects
- Explicit over implicit

### 5. Use Meaningful Names

Names are documentation. A well-chosen name eliminates the need for comments.

**Not this:**
```python
def proc(d, f):
    return [f(x) for x in d if x]
```

**This:**
```python
def filter_and_transform(items, transform_fn):
    return [transform_fn(item) for item in items if item]
```

### 6. Avoid Magic Numbers and Strings

Every literal value should have a name that explains its purpose.

**Not this:**
```python
if retry_count > 3:
    time.sleep(60)
```

**This:**
```python
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 60

if retry_count > MAX_RETRIES:
    time.sleep(RETRY_DELAY_SECONDS)
```

### 7. Let the Code Speak

Comments should explain *why*, not *what*. If you need a comment to explain what code does, the code is too complex.

**Not this:**
```python
# Increment counter by one
counter += 1
```

**This:**
```python
# Retry count tracks attempts for circuit breaker pattern
retry_count += 1
```

## The Kernighan Test

Before committing any code, ask:

1. **Can I explain this to a colleague in one sentence?** If not, simplify.
2. **Would I understand this at 3am during an outage?** If not, clarify.
3. **Is there a more obvious way?** If yes, use it.
4. **Am I being clever?** If yes, stop.

## When Reviewing Code

Apply these checks:

- [ ] Every function does one thing and its name says what
- [ ] No cleverness that requires explanation
- [ ] Names are self-documenting
- [ ] Control flow is obvious
- [ ] No magic numbers or strings
- [ ] Comments explain why, not what (or are absent because code is clear)

## When NOT to Use This Skill

Use a different skill when:
- **Writing C/systems code** → Use `data-first` (kernel style) or `simplicity` (Go/systems)
- **Performance is critical** → Use `optimization` (optimization, data-oriented design)
- **Designing class hierarchies** → Use `design-patterns` (design patterns) or `java` (defensive OO)
- **Building CLI tools** → Use `composition` (Unix philosophy, composition)
- **Proving correctness matters** → Use `correctness` (formal reasoning)

Kernighan is for **general application code clarity**—not specialized domains.

## Sources

- Kernighan & Pike, "The Practice of Programming" (1999)
- Kernighan & Plauger, "The Elements of Programming Style" (1978)
- Kernighan & Ritchie, "The C Programming Language" (1978)

---

*"The most effective debugging tool is still careful thought, coupled with judiciously placed print statements." — Brian Kernighan*
