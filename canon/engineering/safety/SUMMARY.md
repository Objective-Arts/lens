# /safety Summary

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

## HARD GATES (mandatory before writing code)

- [ ] **Atomic operation check:** List every operation that modifies persistent state. Is each one atomic? If the process crashes mid-operation, is the state corrupted or consistent? Use write-to-temp-then-rename patterns for file operations.
- [ ] **TOCTOU audit:** List every check-then-act sequence (if file exists → read file, if key exists → use key). Can the state change between check and act? If yes, use atomic operations or locking.
- [ ] **Resource cleanup:** Every opened file, connection, or lock has a corresponding close/release in a finally block or equivalent. Resource leaks under error paths are the most common safety bug.
- [ ] **Rollback capability:** If an operation fails partway through, can the system return to its previous state? If not, design for it (transactions, snapshots, or idempotent retry).

## Concrete Checks (MUST ANSWER)

- [ ] **Safety constraints listed?** Can you point to an explicit list of safety constraints in the code or design doc? If no list exists, write one before proceeding.
- [ ] **STAMP control loop identified?** For each controller-process pair, have you identified: (1) what control actions it issues, (2) what feedback it receives, and (3) what process model it maintains? Missing feedback is the most common safety gap.
- [ ] **Unsafe control action analysis done?** For each control action, have you checked all four columns: not providing causes hazard? Providing causes hazard? Too early/late causes hazard? Wrong duration causes hazard?
- [ ] **Process model matches reality?** List every assumption the controller makes about system state (cache freshness, server health, file saved). For each one, what happens if the assumption is wrong? Is there a mechanism to detect the mismatch?
- [ ] **No "user error" in failure analysis?** If any failure explanation blames the user, redesign the control so that user action cannot cause the hazard.
