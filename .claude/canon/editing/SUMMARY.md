# /editing Summary

> "Kill your darlings, even when it breaks your egocentric little scribbler's heart."

## Core Rules

| Rule | Meaning |
|------|---------|
| **Kill your darlings** | The phrase you love most? Cut it |
| **Second draft = first - 10%** | Always cut at least 10% |
| **Avoid passive voice** | Active voice is stronger |
| **Avoid adverbs** | Find a stronger verb instead |
| **Simple words win** | Don't dress up vocabulary |

## Passive vs Active

```javascript
// PASSIVE (weak): "The error was handled by the catch block"
// ACTIVE (strong): "The catch block handles the error"
```

## Kill Adverbs

| Weak | Strong |
|------|--------|
| "ran quickly" | "sprinted" |
| "said loudly" | "shouted" |
| "very important" | "critical" |
| "totally broken" | "broken" |

## Kill Your Darlings in Code

```javascript
// YOUR DARLING (clever comment you love):
// Here be dragons! This function is a labyrinth of
// Minotaur-like complexity where many a brave developer...

// KILLED (serves the reader):
// Complex validation - see docs/validation.md
```

## Show, Don't Tell

```markdown
// TELL: "This function is very efficient and fast"
// SHOW: "Processes 1M records in <100ms"
```

## The Fear Test

Bad writing comes from fear:
- Fear of being unclear → overexplanation
- Fear of seeming dumb → jargon
- Fear of being wrong → hedge words

## When to Use

- Technical documentation
- Commit messages and comments
- Any written communication
- Editing and revising

## Concrete Checks (MUST ANSWER)

- [ ] **10% cut test:** Is the final draft at least 10% shorter than the first draft? Count the words. If not, keep cutting.
- [ ] **Adverb hunt:** Search for words ending in "-ly". Can each one be replaced by a stronger verb or removed entirely?
- [ ] **Darling detection:** Is there a phrase or sentence you are particularly proud of? Reread it critically -- does it serve the reader or your ego? If ego, cut it.
- [ ] **Show-not-tell check:** Does any sentence claim something is "fast", "simple", "powerful", or "efficient" without evidence? Replace the adjective with a measurement or example.
- [ ] **Hedge word scan:** Search for "basically", "essentially", "actually", "somewhat", "arguably". Remove every instance.
