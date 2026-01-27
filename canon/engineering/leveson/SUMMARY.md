# /leveson Summary

> "Accidents are system failures, not component failures."

## Core Philosophy

| Principle | Meaning |
|-----------|---------|
| **System, not component** | Accidents emerge from interactions |
| **Safety as control** | Maintain control over hazards |
| **Humans are not the problem** | If humans can easily cause harm, design is wrong |

## STAMP Framework

```
Controller (algorithm + beliefs)
      ↓ Control Actions
Controlled Process
      ↑ Feedback
```

Accidents occur when:
- Control actions inadequate
- Process model doesn't match reality
- Feedback missing, delayed, or wrong

## Unsafe Control Action Analysis

For every control action, ask:

| Not Providing | Providing | Too Early/Late | Wrong Duration |
|---------------|-----------|----------------|----------------|
| Causes hazard? | Causes hazard? | Causes hazard? | Causes hazard? |

## Key Rules

### Safety Constraints Must Be Explicit
```javascript
// Document: SAFETY CONSTRAINT, HAZARD, CONTROL
await db.transaction(async (tx) => { ... });
```

### Process Model Must Match Reality
- Cache believes data current (it's stale)
- Load balancer believes server healthy (it's not)
- User believes file saved (it's not)

### Feedback Must Be Adequate
- Acknowledge every command
- Confirm every state change
- Report failures immediately and loudly

## Anti-Patterns

- "User error" post-mortems (blame system, not humans)
- Hidden safety assumptions (make explicit)
- Silent failures (must be loud)

## When to Use

- Safety-critical systems
- Incident analysis
- System design reviews
