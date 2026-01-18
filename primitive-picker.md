---
name: primitive-picker
description: Choosing the right Claude Code primitive (Skill, Hook, Command, SubAgent) for a task. Use when designing new skills, deciding where logic belongs, or architecting Claude Code extensions. Triggers: "should this be a skill or hook", "which primitive", "where does this belong", "skill vs subagent", "how should I structure this". Does NOT help with using existing skills (just invoke them) or general coding questions.
---

# Primitive Picker

**Intent**: Choose the right Claude Code primitive for the job.

## The Four Primitives

```
╔═══════════════╦═══════════════╦═══════════════╦═══════════════╗
║    SKILL      ║     HOOK      ║   COMMAND     ║   SUBAGENT    ║
╠═══════════════╬═══════════════╬═══════════════╬═══════════════╣
║ Encoded       ║ Reactive      ║ User          ║ Delegated     ║
║ wisdom        ║ gate          ║ ritual        ║ reasoning     ║
╠═══════════════╬═══════════════╬═══════════════╬═══════════════╣
║ Invoke on     ║ Auto-fires    ║ Multi-step    ║ Separate      ║
║ demand        ║ on events     ║ ceremony      ║ instance      ║
╚═══════════════╩═══════════════╩═══════════════╩═══════════════╝
```

## Quick Decision Tree

Answer these questions in order:

### Q1: How often do you do this?

```
FREQUENCY CHECK (from Boris Cherny):

Multiple times per day ("inner loop")?
├── YES → COMMAND (slash command)
│         Precompute context with inline bash
│         Save the prompting overhead
└── NO  → Continue to Q2
```

### Q2: Stable wisdom or dynamic reasoning?

```
Is this something where the "right answer" is known in advance?
Could you write the output template before seeing the input?

YES, stable/predictable → SKILL
NO, needs to figure it out → SUBAGENT
```

### Q3: When should it fire?

```
SKILL or SUBAGENT from Q2, now:

When I explicitly ask for it → Keep as SKILL
Automatically on events → HOOK
Automatically based on context → SKILL with triggers
```

### Q4: Should this ALWAYS happen?

```
Is bypassing unacceptable?
Should this never be forgotten?

YES → HOOK (auto-fire, enforce)
      Examples: Format on save, lint before commit
NO  → Keep current choice
```

### Q5: Does it need user checkpoints?

```
Should the user confirm before proceeding?
Are there multiple steps requiring decisions?
Is this high-stakes (production, data, irreversible)?

YES → COMMAND (ceremony pattern)
NO → Keep current choice
```

### Q6: Is this verification/specialized post-work?

```
Does this verify work after completion?
Is this a specialized task (simplify, review, test)?

YES → SUBAGENT
      Examples: code-simplifier, verify-app, end-to-end-test
NO  → Keep current choice
```

## The Core Test

> **Could you write the output template in advance, before seeing input?**
>
> YES → Skill
> NO → SubAgent

## Decision Matrix

| Characteristic | SKILL | HOOK | COMMAND | SUBAGENT |
|----------------|-------|------|---------|----------|
| When invoked | On demand | Auto on event | User triggers | Delegated |
| Output | Predictable | Pass/Fail | Guided flow | Variable |
| Reasoning | Applies known | Validates | Orchestrates | Discovers |
| State | Stateless | Stateless | Stateful | Stateful |

## Examples

```
Review code for Bloch patterns     → SKILL    (known checklist)
Figure out why test is failing     → SUBAGENT (must investigate)
Apply Kernighan clarity principles → SKILL    (fixed principles)
Research how auth works here       → SUBAGENT (must explore)
Validate before commit             → HOOK     (auto-fire, enforce)
Deploy to production               → COMMAND  (needs confirmations)
Recommend architecture             → SUBAGENT (reason trade-offs)
Format code on save                → HOOK     (auto-fire on event)
```

## Anti-Pattern Detection

| Symptom | Current | Should Be |
|---------|---------|-----------|
| Keep forgetting to invoke Skill | SKILL | HOOK |
| Hook fires constantly, ignored | HOOK | SKILL |
| Skill full of "if/then" logic | SKILL | SUBAGENT |
| SubAgent output always same | SUBAGENT | SKILL |
| Command has no decision points | COMMAND | SKILL |
| Skill keeps asking questions | SKILL | COMMAND |

## Composition Patterns

Primitives often work together:

```
GATE-THEN-APPLY
    Hook (validate) ──► Skill (apply)

GENERATE-VALIDATE-LOOP
    Skill (generate) ──► Hook (check) ──► loop

RESEARCH-THEN-APPLY
    SubAgent (explore) ──► Skill (apply principles)

FULL ORCHESTRATION
    Command ──► SubAgent ──► Skill ──► Hook
```

## Placement: Global vs Project

```
GLOBAL (~/.claude/)          PROJECT (.claude/)
─────────────────────────    ─────────────────────────
Universal wisdom (canon)     Domain-specific knowledge
Personal standards           Team standards
Your secret edge             Shared with team (committed)
Follows you everywhere       Follows the repo
```

**Override rule**: Project overrides Global. More specific wins.

## The Meta-Rule

```
Start with SKILL (simplest)
       │
       ├── Do it 2+ times daily? ─► COMMAND
       │
       ├── Forget to invoke? ─────► HOOK
       │
       ├── Needs user decisions? ─► COMMAND
       │
       ├── Needs to think? ───────► SUBAGENT
       │
       └── Verification after? ───► SUBAGENT
```

## Verification (Critical)

From Boris Cherny: "One of the most important things for getting great results is giving Claude a way to verify its own work. With this feedback loop, output quality can improve 2-3x."

```
Every task needs verification. Choose by domain:

Code change     → Run tests
UI change       → Test in browser
Script          → Execute it
API             → Hit the endpoint
Configuration   → Apply and verify behavior

NO VERIFICATION = TRUST WITHOUT EVIDENCE
```

Verification can be:
- **HOOK**: Auto-verify after tool use (formatting, linting)
- **SUBAGENT**: Detailed verification (verify-app, end-to-end test)
- **Part of COMMAND**: Built into the workflow

## Mistake Recording (CLAUDE.md)

```
Claude made a mistake?
├── One-off error → Just fix it
└── Pattern of error → Record in CLAUDE.md

When Claude makes a mistake, record it so it won't repeat:
  - What went wrong
  - What to do instead
  - Team shares and updates CLAUDE.md
```

This is "Compounding Engineering" - mistakes become system improvements.

## Parallel Sessions

```
Task characteristics determine session strategy:

Needs frequent input    → Single focused session
Long-running            → Background session (use &)
Multiple workstreams    → Multiple parallel Claudes
Fire and forget         → Web session, check later
```

## Conflict Resolution

```
Hook rejects Skill output  →  Hook wins (objective > subjective)
Two Skills conflict        →  More specific wins
SubAgents disagree         →  Surface both, escalate to user
```

## Quick Reference

**Use SKILL when:**
- You can write the template in advance
- Output is predictable
- Applying known principles

**Use HOOK when:**
- Should auto-fire on events
- Must enforce (block on failure)
- Validation that can't be forgotten
- Post-processing (formatting, linting)

**Use COMMAND when:**
- You do it 2+ times daily (inner loop)
- Multi-step with user decisions
- Ceremony required for safety
- Orchestrating multiple primitives

**Use SUBAGENT when:**
- Must investigate/discover
- Output varies by situation
- Reasoning about context required
- Verification after completion
- Specialized post-work (simplify, review)

## Plan Mode Decision

```
Goal is a PR or significant change?
├── YES → Start in Plan mode (shift+tab twice)
│         Iterate on plan until satisfied
│         Then auto-accept, complete in one go
└── NO  → Direct mode is fine
```

## The Rule

> **Move based on friction. Where it breaks tells you where it belongs. Frequency determines formality—daily tasks deserve commands.**
