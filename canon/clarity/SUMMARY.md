# /clarity Summary

> "Debugging is twice as hard as writing the code. If you write code as cleverly as possible, you are, by definition, not smart enough to debug it."

## Core Principles

| Principle | Rule |
|-----------|------|
| **Clarity over cleverness** | If there's a straightforward way and a clever way, choose straightforward |
| **Write for readers** | Code is read far more than written. Future you is the reader |
| **Keep it simple** | Small functions, obvious control flow, no hidden side effects |
| **Meaningful names** | Names are documentation. A good name eliminates comments |
| **No magic values** | Every literal needs a name explaining its purpose |

## Quick Reference

```
INSTEAD OF                    DO
────────────────────────────────────────────────
data and data[0] or def  →   data[0] if data else default
proc(d, f)               →   filter_and_transform(items, fn)
if retry > 3:            →   if retry > MAX_RETRIES:
# increment counter      →   (delete comment, code is obvious)
```

## The Kernighan Test

Before committing, ask:
1. Can I explain this in one sentence?
2. Would I understand this at 3am during an outage?
3. Is there a more obvious way?
4. Am I being clever? (If yes, stop)

## Load Full Skill When

- Writing C/systems code (use data-first or simplicity instead)
- Performance-critical code (use optimization)
- Building CLI tools (use composition)

## Concrete Checks (MUST ANSWER)

1. **Single responsibility:** For each function, describe what it does without using "and." If you need "and," the function does two things — split it.
2. **Name sufficiency:** Read every function and variable name without reading the body/value. Does each name tell you what it returns or holds? If you would need a comment to understand the name, rename it.
3. **Magic value audit:** Search the code for every string and number literal. Is each one either (a) assigned to a named constant, or (b) inherently obvious (0, 1, "", true/false)? If neither, extract a constant.
4. **Control flow linearity:** Does every function have a single level of nesting for its primary logic? (Guard clauses that return early don't count.) If any function has nested if/else inside a loop inside a conditional, flatten it.
5. **Cleverness test:** For each non-trivial expression, can a junior developer understand it in under 10 seconds without looking anything up? If not, rewrite it as straightforward code.

## HARD GATES (mandatory before writing code)

- [ ] **No reimplemented stdlib:** List every function you plan to write. Does the language stdlib or a standard library already do this? If yes, use it.
- [ ] **Name test:** Read each function name aloud. Does it describe what the function does without reading the body? If not, rename it.
- [ ] **One-sentence test:** Can you describe each module's purpose in one sentence without "and"? If not, it does too many things — split it.
- [ ] **Magic-free:** Search your code for string/number literals. Each one either has a named constant or is self-evident (0, 1, "", true).
