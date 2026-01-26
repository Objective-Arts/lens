---
name: structure-first
description: Design data structures and interfaces before implementation. Use at project start or before complex features.
---

# /structure-first

Design data structures, types, and interfaces before writing implementation code.

## Why This Skill Exists

Without this skill, Claude jumps straight to writing functions. Data structures emerge ad-hoc, leading to inconsistent shapes, missing fields, and refactoring after code is written.

As Linus says: "Bad programmers worry about the code. Good programmers worry about data structures."

---

## ⚠️ ENFORCED PROCESS - THREE PHASES

You CANNOT skip phases. Each phase must complete before the next begins.

---

## PHASE 1: LOAD CANON (Required - No Code Until Complete)

### Step 1.1: Read the Canon Files

**You MUST use the Read tool to load these files. Do not proceed from memory.**

```
Required reads:
1. Read: CLAUDE.md (find Baseline Brain section)
2. Read: .claude/skills/[language-canon]/SKILL.md (based on detected language)
3. Read: .claude/skills/evans/SKILL.md (domain modeling)
4. Read: .claude/skills/linus/SKILL.md (data structures first)
```

Detect language from file extensions or project structure:
- `.java` → load `/bloch`
- `.ts`, `.tsx` → load `/cherny`
- `.py` → load `/ramalho`
- `.go` → load `/pike`
- `.cs` → load `/skeet`

### Step 1.2: Output Proof of Loading

**You MUST output this section before proceeding:**

```markdown
## Canon Loaded

### Baseline Brain (from CLAUDE.md)
- [ ] Kernighan: [quote or principle that applies]
- [ ] Thompson: [quote or principle that applies]
- [ ] Pike: [quote or principle that applies]
- [ ] Joy: [quote or principle that applies]
- [ ] Linus: [quote or principle that applies]
- [ ] Dijkstra: [quote or principle that applies]

### Domain Canon Loaded
- [ ] /evans - [X items loaded, key principle for this task]
- [ ] /linus - [X items loaded, key principle for this task]
- [ ] /[language] - [X items loaded, key principle for this task]

### How Canon Applies to This Task
| Principle | From | How It Shapes This Design |
|-----------|------|--------------------------|
| Data structures first | Linus | Will define types before any logic |
| Entities vs Value Objects | Evans | Will distinguish by identity needs |
| Immutability default | [lang canon] | All types immutable unless justified |
```

**If this section is empty or generic, STOP. You have not loaded canon.**

---

## PHASE 2: DESIGN STRUCTURES (Required - Show Before Code)

### Step 2.1: Apply Linus - Data Structures First

Before any implementation discussion, output the actual types:

```markdown
## Data Structures (Linus: "Good programmers worry about data structures")

### Core Types
```[language]
// [Explain WHY this structure, citing canon]
type PaymentResult =
  | { status: 'success'; chargeId: string; amount: Money }
  | { status: 'failed'; reason: FailureReason }
  | { status: 'pending'; retryAfter: Date }

// Value Object (Evans: no identity, compared by value)
type Money = {
  readonly amount: bigint;  // Dijkstra: never use float for money
  readonly currency: Currency;
}
```
```

### Step 2.2: Apply Evans - Entities vs Value Objects

```markdown
## Domain Model (Evans)

### Entities (have identity, tracked over time)
| Entity | Identity | Why Entity |
|--------|----------|------------|
| Payment | paymentId | Tracks through states, has lifecycle |
| Customer | customerId | Referenced across transactions |

### Value Objects (no identity, immutable, compared by value)
| Value Object | Why Value Object |
|--------------|------------------|
| Money | $100 is $100, no identity needed |
| Address | Compare by content, not identity |

### Aggregates (transactional boundaries)
| Aggregate Root | Contains | Invariant Protected |
|----------------|----------|---------------------|
| Order | LineItems, Payments | Total = sum of items |
```

### Step 2.3: Apply Language Canon

```markdown
## Language-Specific Design ([canon name])

| Decision | Canon Item | Applied |
|----------|------------|---------|
| Static factory | Bloch Item 1 | `Payment.create()` not constructor |
| Immutable | Bloch Item 17 | All fields readonly |
| Builder | Bloch Item 2 | For objects with many parameters |
```

### Step 2.4: Output Structure File

Write to `.claude/structures/[name].md`:

```markdown
# Structure: [feature/module]

## Canon Applied
- Linus: Data structures designed first
- Evans: [entities/value objects identified]
- [Language canon]: [specific items applied]

## Types
[all type definitions]

## Relationships
[entity relationships]

## Boundaries
[input/output at each layer]

## Implementation Order
1. [First type - why first]
2. [Second type - why second]
```

---

## PHASE 3: APPROVAL GATE (Required - Cannot Implement Without)

### Step 3.1: Present for Approval

```markdown
## Structure Ready for Review

**Feature**: [name]
**Types Defined**: [count]
**Canon Applied**: [list]

### Key Design Decisions
1. [Decision]: [Rationale citing canon]
2. [Decision]: [Rationale citing canon]

### Questions for Reviewer
- [Any ambiguities or trade-offs to discuss]

**Structure written to**: `.claude/structures/[name].md`

Ready to proceed to `/build-from-plan` or `/refactor-clean`?
```

### Step 3.2: Wait for Approval

**Do NOT proceed to implementation until user approves the structure.**

If user requests changes, return to Phase 2 and revise.

---

## Dual Workflow: Different Canon per Flow

| Flow | Primary Canon | Purpose |
|------|---------------|---------|
| **New Code** | `/evans`, `/linus`, `/bloch` | Design new structures from scratch |
| **Legacy Code** | `/evans`, `/feathers` | Document existing, find hidden domain |

### New Code Flow
Design types that don't exist yet. Focus on getting the model right before code.

### Legacy Code Flow
Document what exists. Find hidden aggregates buried in procedural code. Identify seams (Feathers) for safe changes.

---

## Anti-Patterns (Violations of This Process)

| If You Do This | You Violated |
|----------------|--------------|
| Start writing functions before types | Linus |
| Skip the "Canon Loaded" section | The entire skill |
| Use generic types without domain meaning | Evans |
| Output types without citing which canon informed them | Enforcement requirement |
| Proceed to implementation without approval | Phase 3 gate |
