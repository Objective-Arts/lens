# /kernighan Summary

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

- Writing C/systems code (use linus or pike instead)
- Performance-critical code (use carmack)
- Building CLI tools (use mcilroy)

## Checklist

- [ ] Every function does one thing, name says what
- [ ] No cleverness requiring explanation
- [ ] Names are self-documenting
- [ ] Control flow is obvious
- [ ] No magic numbers or strings
