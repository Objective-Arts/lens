---
name: ceremony
description: "Guiding critical operations through user-confirmed checkpoints. Use for deployments, database migrations, breaking API changes, or irreversible operations requiring explicit confirmation before proceeding."
---

# THE CEREMONY Pattern

**Intent**: Wrap critical operations in user-confirmed rituals.

## The Pattern

```
    COMMAND
    /deploy (or critical operation)
       │
       ▼
   RESEARCH ────► "Check readiness"
       │
       ▼
   CONFIRM? ◄──── User reviews
       │ Yes
       ▼
   ANALYZE ─────► "Final analysis"
       │
       ▼
   CONFIRM? ◄──── User reviews report
       │ Yes
       ▼
   EXECUTE ─────► "Perform operation"
       │
       ▼
   COMPLETE
```

## When to Use

- Production deployments
- Database migrations
- Breaking API changes
- Irreversible operations
- Any operation where mistakes are costly

## The Ceremony Steps

### Step 1: ANNOUNCE Intent

```
═══════════════════════════════════════════
  CEREMONY: [Operation Name]
  Risk Level: [HIGH/CRITICAL]
  Reversible: [Yes/No/Partial]
═══════════════════════════════════════════
```

### Step 2: GATHER Context

Research and present the current state:

```
PRE-FLIGHT CHECK:
─────────────────────────────────────────
Current State:
  - [What exists now]
  - [What will change]
  - [What depends on this]

Risks Identified:
  - [Risk 1]: [Mitigation]
  - [Risk 2]: [Mitigation]

Prerequisites:
  - [ ] [Prerequisite 1] - [Status]
  - [ ] [Prerequisite 2] - [Status]
─────────────────────────────────────────
```

### Step 3: FIRST CONFIRMATION

Present findings and request explicit approval:

```
CHECKPOINT 1: Ready to proceed?
─────────────────────────────────────────
Summary: [What will happen]
Impact: [What will be affected]

⚠️  Awaiting your confirmation to continue...
─────────────────────────────────────────
```

**Wait for user confirmation before proceeding.**

### Step 4: FINAL ANALYSIS

Run comprehensive checks:

```
FINAL ANALYSIS:
─────────────────────────────────────────
Validation Results:
  - Tests: [Status]
  - Dependencies: [Status]
  - Environment: [Status]

Rollback Plan:
  - [Step 1 to rollback]
  - [Step 2 to rollback]
─────────────────────────────────────────
```

### Step 5: FINAL CONFIRMATION

```
CHECKPOINT 2: Execute operation?
─────────────────────────────────────────
This will: [Final summary of action]

⚠️  This action [is/is not] reversible.
⚠️  Awaiting final confirmation...
─────────────────────────────────────────
```

**Wait for user confirmation before executing.**

### Step 6: EXECUTE

Only after both confirmations:

```
EXECUTING:
─────────────────────────────────────────
[Step-by-step execution log]
─────────────────────────────────────────
```

### Step 7: VERIFY & REPORT

```
CEREMONY COMPLETE:
═══════════════════════════════════════════
Result: [SUCCESS/FAILURE]
Duration: [Time taken]
Changes Made:
  - [Change 1]
  - [Change 2]

Verification:
  - [Verification check 1]: [Status]
  - [Verification check 2]: [Status]

Next Steps:
  - [Any follow-up actions]
═══════════════════════════════════════════
```

## Anti-Patterns

```
❌ CEREMONY AVALANCHE
   Too many checkpoints → user rubber-stamps
   Fix: One "here's the picture, proceed?" moment

❌ CEREMONY WITHOUT SUBSTANCE
   Asking permission without providing information
   Fix: Each checkpoint must add value

❌ SKIPPING THE CEREMONY
   "I'll just do it quickly..."
   Fix: High-risk = ceremony required, no exceptions
```

## Ceremony Triggers

Use this pattern when:
- [ ] Operation affects production
- [ ] Operation is irreversible or costly to reverse
- [ ] Operation affects external users
- [ ] Operation touches sensitive data
- [ ] Failure would require incident response

## The Rule

> **Critical operations earn rituals. The ceremony protects against "oops."**
