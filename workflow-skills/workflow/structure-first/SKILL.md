---
name: structure-first
description: Design data structures before implementation. Maps existing code or creates new types.
---

# /structure-first [path]

Design data structures and architecture. Context-aware: maps existing code or creates new types from plan.

> **No arguments?** Describe this skill and stop. Do not execute.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"structure-first","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Mode Detection

```
if path points to existing code:
    MODE = "map"      → Analyze and redesign
else if .claude/plans/ has active plan:
    MODE = "create"   → Create types from plan
else:
    ERROR: Need either existing code path or plan
```

---

## Step 0: Load Expert Guidance

Before starting either mode, read these canon skills and apply their principles throughout:

**Always load (base brain — all 10):**
1. `.claude/skills/clarity/SUMMARY.md`
2. `.claude/skills/pragmatism/SUMMARY.md`
3. `.claude/skills/simplicity/SUMMARY.md`
4. `.claude/skills/composition/SUMMARY.md`
5. `.claude/skills/distributed/SUMMARY.md`
6. `.claude/skills/data-first/SUMMARY.md`
7. `.claude/skills/correctness/SUMMARY.md`
8. `.claude/skills/algorithms/SUMMARY.md`
9. `.claude/skills/abstraction/SUMMARY.md`
10. `.claude/skills/optimization/SUMMARY.md`

**Load if applicable to target code:**
- TypeScript files (.ts) → also read `.claude/skills/typescript/SKILL.md`

If a skill file doesn't exist (not installed in this project), skip it and continue.
Reference loaded experts in your APPLIED output.

### Step 0b: Learn From Past Mistakes

Read both lessons files if they exist:
1. `workflow-skills/lessons.md` — universal patterns (ships with skills, applies to all projects)
2. `.claude/lessons.md` — project-specific patterns (accumulated from this project's runs)

Apply relevant lessons to your structural design:

- **DESIGN** entries → avoid these architectural mistakes in your target state
- **LOGIC** entries → design types/interfaces that make these bug patterns impossible (e.g., validated newtypes instead of raw strings for paths/names)
- **AI_SMELL** entries → do not create speculative types/interfaces without consumers; avoid over-decomposition

If a file doesn't exist, skip it and continue.

---

## MODE: Map (Existing Code)

Analyze existing code, diagram relationships, design improvements.

### Step 1: Map Current Architecture

Read all files in target. Output a diagram:

```
## Architecture: [target]

CURRENT_STATE:
┌─────────────┐     ┌─────────────┐
│ UserService │────▶│  AuthStore  │
│             │     │             │
│ - getUser() │     │ - token     │
│ - saveUser()│     │ - validate()│
└──────┬──────┘     └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   User      │     │   Session   │
│ (interface) │     │ (interface) │
└─────────────┘     └─────────────┘

DEPENDENCIES:
- UserService → AuthStore (tight coupling)
- UserService → User (data)
- AuthStore → Session (data)

ISSUES_FOUND:
- [issue]: [why it matters]
```

### Step 2: Apply Canon Wisdom

Review against principles from the masters:

| Principle | Check |
|-----------|-------|
| **Data-first** | Are data structures driving the design? |
| **Composition** | Inheritance depth > 2? Refactor to composition. |
| **Single responsibility** | Does each class do one thing? |
| **Interface segregation** | Are interfaces minimal? |
| **Dependency inversion** | Depend on abstractions, not concretions? |
| **Impossible states** | Can invalid states be represented? |

### Step 3: Design Target State

```
TARGET_STATE:
┌─────────────┐     ┌─────────────┐
│ UserService │     │ AuthService │
│             │     │ (new)       │
└──────┬──────┘     └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│         UserRepository          │
│         (extracted)             │
└─────────────────────────────────┘

CHANGES_NEEDED:
- Extract AuthService from AuthStore
- Create UserRepository interface
- Inject dependencies via constructor

APPLIED:
- [principle]: [decision made]
```

### Map Mode Output

```markdown
## Structure: [target]

MODE: map

CURRENT_STATE:
[diagram]

ISSUES_FOUND:
- [issue]: [description]

TARGET_STATE:
[diagram]

CHANGES_NEEDED:
- [change 1]
- [change 2]

APPLIED:
- [principle]: [decision]

STRUCTURE_COMPLETE
```

---

## MODE: Create (New Types from Plan)

Create actual type files from an approved plan.

### Requirements

1. **CREATE TYPE FILES** - Use Write tool to create actual .ts files
2. **EVERY TYPE FROM PLAN** - Create all types listed in plan's TYPES section
3. **NO PLACEHOLDER TYPES** - Every field must have a real type, not 'any' or 'unknown'
4. **INVARIANTS AS COMMENTS** - Document invariants as JSDoc comments

### Craft Standards

Types must look like they were designed by a skilled human engineer:

**Reject:**
- Over-engineered type hierarchies
- Generic wrappers when simple types work
- Speculative fields "in case we need them later"
- `Partial<T>` abuse creating unclear contracts

**Embrace:**
- Types that document the domain
- Minimal fields - only what's actually used
- Self-documenting names
- Impossible states made unrepresentable

### Elegance Principles

| Principle | Apply It |
|-----------|----------|
| **Minimal surface** | Only essential methods/fields |
| **Consistent naming** | Same operation = same name everywhere |
| **Orthogonal operations** | Operations compose cleanly |
| **Interface over implementation** | Return `List<T>` not `ArrayList<T>` |
| **Immutability by default** | Prefer readonly. Mutation is explicit. |
| **Fail-fast** | Validate at boundaries |

### Create Mode Output

```markdown
## Structure: [feature]

MODE: create

TYPES_CREATED:
- src/types/user.ts: User, UserPublic, CreateUserInput
- src/types/auth.ts: AuthToken, TokenPayload

INVARIANTS_DOCUMENTED:
- User: email must be unique, password_hash never exposed
- AuthToken: expires_at must be in future

APPLIED:
- [principle]: [decision]

STRUCTURE_COMPLETE
```

---

## FORBIDDEN (Phase FAILS if detected)

- Using 'any' or 'unknown' types
- TODO comments in types
- Describing without creating (create mode)
- Skipping diagram (map mode)
- No STRUCTURE_COMPLETE marker

## 🛑 MANDATORY STOP

After completing structure analysis/creation:
- DO NOT proceed to `/implement-plan`
- DO NOT start writing implementation code

**Your turn ends here.** Output STRUCTURE_COMPLETE and STOP.
