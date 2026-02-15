# /prose Summary

> "Clutter is the disease of American writing."

## Core Principle

Strip every sentence to its cleanest components. Every word that serves no function weakens the sentence.

## Clutter → Clean

| Cluttered | Clean |
|-----------|-------|
| "At this point in time" | "Now" |
| "Due to the fact that" | "Because" |
| "Has the ability to" | "Can" |
| "In order to" | "To" |
| "A large number of" | "Many" |

## The Rewriting Process

1. **First draft**: Write freely, get ideas down
2. **Second pass**: Cut ruthlessly - remove jargon, activate passive voice
3. **Third pass**: Read aloud - if you stumble, readers will too

## Clutter Detection

| Pattern | Action |
|---------|--------|
| Phrases with "of" | Simplify: "in the process of" → "while" |
| "-tion" words | Use verb: "implementation" → "implement" |
| "There is/are" | Rewrite: "There are three steps" → "Three steps:" |
| Hedge words | Cut: "basically", "essentially", "actually" |
| Empty intensifiers | Cut: "very", "really", "extremely" |

## In Practice

```javascript
// BEFORE (cluttered):
// This function is utilized in order to perform the operation
// of calculating the total sum of all values

// AFTER (Zinsser):
// Sum all values in the array
```

## The Final Test

1. Is every word doing useful work?
2. Can I say it more simply?
3. Would I want to read this?
4. Is there any word I can cut?

## When to Use

- Documentation and README files
- Error messages
- Commit messages
- Any technical prose

## Concrete Checks (MUST ANSWER)

- [ ] **First sentence hook?** Does the first sentence tell the reader what this is about and why they should care? If it starts with throat-clearing ("In this document, we will..."), rewrite it.
- [ ] **Active voice throughout?** Search for passive constructions ("is created", "was handled", "are processed"). Rewrite each in active voice with a named subject.
- [ ] **Concrete nouns test:** Does every key sentence contain a concrete noun (file, request, user, array) rather than only abstractions (process, implementation, solution)?
- [ ] **Clutter word scan:** Search for "very", "really", "extremely", "quite", "somewhat", "basically", "essentially". Remove or replace every instance.
- [ ] **"-tion" conversion:** Search for "-tion" nouns (implementation, configuration, validation). Can each one become a verb (implement, configure, validate)?
