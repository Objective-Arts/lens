---
name: structure-first
description: Design data structures and interfaces with mandatory verification. Type files must exist with required elements.
---

# /structure-first

Design data structures, types, and interfaces before writing implementation code.

## First: Activate Workflow

**Before any other action**, activate this workflow session:

```bash
mkdir -p .claude && echo '{"skill":"structure-first","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Step 0: Load Expert Context (MANDATORY)

Before designing types, read these expert skills:

```
Read: .claude/skills/bloch/SKILL.md       (effective API design)
Read: .claude/skills/liskov/SKILL.md      (substitution principle)
Read: .claude/skills/cherny/SKILL.md      (TypeScript types)
```

Apply these principles when defining types and interfaces. Skip if files don't exist.

## When to Use

- Starting a new feature or module
- Before implementing complex logic
- When requirements are ambiguous
- Refactoring existing code

## Process

1. **Identify entities** - What are the core domain objects?
2. **Define types/interfaces** - What shape does the data have?
3. **Establish relationships** - How do entities relate?
4. **Define boundaries** - What are the inputs/outputs?
5. **Validate with examples** - Do concrete examples fit?

## Rules

- Types before functions
- Interfaces before implementations
- Data shapes before algorithms
- Validate with concrete examples before coding
- Keep types minimal - add fields as needed, not speculatively

---

## VERIFICATION (MANDATORY - DO NOT SKIP)

**You MUST execute these commands and show output before claiming completion.**

### Step 1: Verify Type Files Exist

```bash
# Type files must exist
ls -la <type-files>

# Show file paths
find . -name "*.ts" | xargs grep -l "interface\|type " | head -10
```

### Step 2: Verify Types/Interfaces Defined

```bash
# List all interfaces and types created
grep -n "^interface\|^type\|^export interface\|^export type" <type-files>
```

**Expected: At least 2 types/interfaces defined.**

### Step 3: Show Type Definitions

```bash
# Show actual type content (not just names)
cat <type-file>
```

### Step 4: Verify Example Data

**You MUST provide a concrete JSON example that matches each interface:**

```typescript
// Example that validates against the interface
const example: MyInterface = {
  id: "123",
  name: "Example",
  // ... all required fields
};
```

### Completion Criteria (ALL must be TRUE)

| Criterion | Evidence Required | Pass? |
|-----------|-------------------|-------|
| Type file exists | `ls -la` shows type file | [ ] |
| ≥2 types/interfaces defined | grep shows definitions | [ ] |
| Types have properties | cat shows type content | [ ] |
| Example data provided | JSON example matches interface | [ ] |
| No `any` types | grep for `any` returns empty | [ ] |

**If ANY criterion fails: add missing types. Do not report complete.**

---

## Output Format

```markdown
## Structure Design: [feature/module]

### Type Files Created

```bash
$ ls -la src/types/
-rw-r--r--  1 user  staff  1234 Jan 15 10:30 feature.types.ts

$ grep -n "^export interface\|^export type" src/types/feature.types.ts
3:export interface User {
12:export interface UserSettings {
21:export type UserRole = 'admin' | 'user' | 'guest';
```

### Type Definitions

```typescript
// src/types/feature.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
}

export type UserRole = 'admin' | 'user' | 'guest';
```

### Example Data

```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "user",
  "settings": {
    "theme": "dark",
    "notifications": true
  }
}
```

### Verification

```bash
$ grep -c "any" src/types/feature.types.ts
0
```

### Relationships

```
User --has one--> UserSettings
User --has one--> UserRole
```

STRUCTURE_VERIFIED
```

**The marker `STRUCTURE_VERIFIED` may ONLY appear if all criteria pass.**

---

## Anti-Patterns (Immediate Failure)

- Claiming structure is ready without showing `ls -la` output
- No type/interface definitions (just descriptions)
- Using `any` type anywhere
- No example data that matches the interfaces
- Types with only optional properties (nothing required)
- Skipping the grep verification for type definitions
