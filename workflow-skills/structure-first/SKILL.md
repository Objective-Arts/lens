---
name: structure-first
description: Design and CREATE data structures before implementation. Type files must exist.
---

# /structure-first

Design and CREATE data structures and types. Not describe - CREATE actual files.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"structure-first","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## ⚠️ STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST actually CREATE the type files. Not describe them - WRITE them using Edit/Write tools.

1. **CREATE TYPE FILES** - Use Write tool to create actual .ts files with types
2. **EVERY TYPE FROM PLAN** - Create all types listed in the plan's TYPES section
3. **NO PLACEHOLDER TYPES** - Every field must have a real type, not 'any' or 'unknown'
4. **INVARIANTS AS COMMENTS** - Document invariants as JSDoc comments on types

## FORBIDDEN (Phase will FAIL if detected):

- Describing types without creating files
- Using 'any' or 'unknown' types
- Skipping types from the plan
- Saying "will be defined later"
- TODO comments in types
- Types not in the plan without justification

## Process

1. **Load Plan** - Read plan from `.claude/plans/`
2. **Create Type Files** - Use Write tool to create .ts files
3. **Apply Elegance Principles** - Review interfaces against criteria below
4. **Document Invariants** - Add JSDoc comments
5. **Output Summary** - List what was created

## Elegance Principles

Design interfaces with restraint and precision:

| Principle | Apply It |
|-----------|----------|
| **Minimal surface** | Only methods/fields that are essential. If in doubt, leave it out. |
| **Consistent naming** | Same operation = same name everywhere. `size()` not `length`/`count`/`size`. |
| **Orthogonal operations** | Operations compose cleanly. `add` + `remove` + `contains`, not `addIfNotExists`. |
| **Interface over implementation** | Return `List<T>` not `ArrayList<T>`. Don't leak internals. |
| **Clear contracts** | Document preconditions, postconditions, what throws. Contract > implementation detail. |
| **Immutability by default** | Prefer readonly/immutable. Mutation should be explicit choice. |
| **Factory over constructor** | `User.create()` over `new User()` when construction is complex. |
| **Fail-fast** | Detect misuse early. Validate at boundaries. |

**Test your design:** Can someone use this interface correctly by reading only the type signatures and JSDoc? If they need to read implementation, the contract is unclear.

## REQUIRED Output Format

```markdown
## Structure: [feature]

TYPES_CREATED:
- src/types/user.ts: User, UserPublic, CreateUserInput
- src/types/auth.ts: AuthToken, TokenPayload

INVARIANTS_DOCUMENTED:
- User: email must be unique, password_hash never exposed
- AuthToken: expires_at must be in future

APPLIED:
- [expert]: [decision]

STRUCTURE_COMPLETE
```

## Validation (Phase will FAIL if violated)

- No TYPES_CREATED section (types weren't actually created)
- Contains 'any' or 'unknown' types
- Contains TODO or "will be defined"

## 🛑 MANDATORY STOP

After creating structures:
- DO NOT proceed to `/implement`
- DO NOT start writing implementation code

**Your turn ends here.** Output STRUCTURE_COMPLETE and STOP.
