# /cooper Summary

> "Users don't want to use software - they want to accomplish goals."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **Goal-Directed Design** | Design for the goal, not the task |
| **Perpetual intermediates** | Most users know basics, want efficiency |
| **Polite software** | Remembers preferences, doesn't ask twice |

## Eliminate Excise

| Type | Example | Fix |
|------|---------|-----|
| Navigation | 5 clicks for one thing | Flatten, direct access |
| Input | Re-entering known data | Auto-fill, remember |
| Confirmation | "Are you sure?" | Undo instead |

## Undo Over Confirmation

```
BAD:  "Are you sure?" [Yes] [No]
GOOD: *deletes immediately* [Undo] (5 seconds)

Why: Confirmation trains users to click "Yes" without reading
```

## Dialog Rules

1. Clear title stating the action
2. Minimal text - users don't read dialogs
3. Primary action on the right
4. No "OK" - use verbs ("Save", "Delete", "Send")
5. Cancel always available

## Progressive Disclosure

```
Level 1: Essential controls (always visible)
Level 2: Common options (one click)
Level 3: Advanced options (settings)
Level 4: Power user (keyboard shortcuts)

80% of users use 20% of features
```

## Smart Defaults

- Date picker: today's date
- Country: detected from browser
- Quantity: 1
- Never blank required fields when you could guess

## When to Use

- Interaction design decisions
- Reducing user friction
- Form and dialog design
