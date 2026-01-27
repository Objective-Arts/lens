---
name: escalate
description: "Attempting simple fixes first, investigating deeper only if they fail. Use when fixing bugs that might be simple or troubleshooting with unknown complexity."
---

# ESCALATING-DEPTH Pattern

**Intent**: Start simple, escalate only if needed.

## The Pattern

```
    SKILL
  (Attempt)
      │
      ▼
    HOOK
 (Validate)
      │
 PASS │ FAIL
   │      │
   │      ▼
   │  SUBAGENT ────► Investigate why
   │  (Diagnose)
   │      │
   │      ▼
   │    SKILL ─────► Apply with diagnosis
   │  (Re-attempt)
   │      │
   └──────┘
      │
      ▼
   VERIFY
(Final check)
```

## When to Use

- Tasks that are usually simple but occasionally complex
- When you want to avoid over-engineering
- When investigation cost should be deferred
- "Try the easy thing first" scenarios

## Execution Steps

### Level 1: SIMPLE ATTEMPT

Start with the straightforward approach:

```
LEVEL 1: Simple Attempt
═══════════════════════════════════════════
Approach: [Direct, obvious solution]
Assumption: [Why this should work]
═══════════════════════════════════════════
```

Execute the simple solution.

### Level 2: VALIDATE

Check if the simple approach worked:

```
VALIDATION:
─────────────────────────────────────────
Result: [PASS/FAIL]
─────────────────────────────────────────
```

**If PASS**: Done. Simple was enough.

**If FAIL**: Escalate to Level 3.

### Level 3: DIAGNOSE

Investigate why simple failed:

```
LEVEL 3: Escalating - Diagnosis Required
═══════════════════════════════════════════
Simple approach failed because:
  - [Root cause 1]
  - [Root cause 2]

Investigation findings:
  - [What was discovered]
  - [Complexity that wasn't apparent]
  - [Hidden constraints/requirements]

Revised approach:
  - [New approach based on diagnosis]
═══════════════════════════════════════════
```

### Level 4: INFORMED RE-ATTEMPT

Apply solution with full understanding:

```
LEVEL 4: Informed Re-attempt
═══════════════════════════════════════════
Now applying: [Solution informed by diagnosis]
Addressing: [Specific issues found]
═══════════════════════════════════════════
```

### Level 5: FINAL VERIFICATION

```
FINAL VERIFICATION:
─────────────────────────────────────────
Result: [PASS/FAIL]
Escalation levels used: [1-4]
─────────────────────────────────────────
```

## Escalation Levels Reference

| Level | Action | When |
|-------|--------|------|
| 1 | Simple attempt | Always start here |
| 2 | Validate | Check if L1 worked |
| 3 | Diagnose | L1 failed, investigate |
| 4 | Informed retry | Apply diagnosis |
| 5 | Expert escalation | L4 failed, need help |

## Example Flow

```
Task: Fix failing test

Level 1: Read error, apply obvious fix
         → Test still fails

Level 2: Validation failed
         → Escalate

Level 3: Investigate
         → Discovered: test depends on external service
         → Discovered: service changed its API

Level 4: Informed fix
         → Update mock to match new API
         → Fix actual integration code

Level 5: Verify
         → All tests pass
         → Done at Level 4
```

## When to Skip Levels

Sometimes you know simple won't work:

```
SKIP TO LEVEL 3 WHEN:
- Previous similar task required investigation
- Error message indicates complex root cause
- Multiple interconnected failures
- Known technical debt in the area
```

But default to starting simple.

## Anti-Patterns

```
❌ ALWAYS ESCALATE
   "Let me do a deep investigation first..."
   Fix: Try simple first, it often works

❌ NEVER ESCALATE
   "Let me try the simple fix again..."
   Fix: After 2 simple failures, investigate

❌ ESCALATE WITHOUT LEARNING
   Repeating Level 1 without Level 3 insights
   Fix: Diagnosis must inform retry

❌ SKIP VALIDATION
   Assuming escalation was successful
   Fix: Always verify at each level
```

## Decision Points

```
After Level 1 fails:
  - Was it close? → Try variation at L1
  - Completely wrong? → Escalate to L3

After Level 4 fails:
  - Diagnosis incomplete? → Back to L3
  - Need different expertise? → Escalate to L5 (user/expert)
```

## The Rule

> **Simple first. Investigate only when simple fails. But when it fails, investigate properly.**
