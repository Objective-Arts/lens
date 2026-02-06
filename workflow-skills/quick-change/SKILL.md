---
name: quick-change
description: Simple changes done right. Add field, rename, small fix - with checklist to avoid sloppiness.
---

# /quick-change [description]

For simple changes that don't warrant full planning but still need care.

## When to Use

- Add a field to a model/DTO
- Rename something
- Add a parameter
- Small bug fix
- Add a button/link
- Update a constant

**If the change touches 5+ files or has design decisions → use `/create-plan` instead.**

## Canon Skills (Auto-Invoke)

### Always Active (Language-Agnostic)

| Skill | Why |
|-------|-----|
| `/clarity` | Kernighan - naming, simplicity |
| `/refactoring` | Fowler - safe small changes |
| `/style` | Google - match existing patterns |

### By Change Type (Language-Agnostic)

| Change Type | Invoke | Why |
|-------------|--------|-----|
| Rename | `/clarity` | Kernighan naming principles |
| Bug fix | `/legacy` | Feathers' characterization before change |
| Validation | `/owasp` | Input validation is security |
| Database | `/sql` | Celko's column design |

### By Language

**TypeScript/JavaScript:**
| Pattern | Invoke |
|---------|--------|
| `*.ts`, `*.tsx` | `/typescript`, `/cherny` |
| `*.js`, `*.jsx` | `/js-safety`, `/crockford` |
| `*.spec.ts`, `*.test.ts` | `/dodds`, `/test-doubles` |

**Java:**
| Pattern | Invoke |
|---------|--------|
| `*.java` | `/java` (Bloch's field/API design) |
| `*Test.java` | `/test-doubles` |

**Python:**
| Pattern | Invoke |
|---------|--------|
| `*.py` | `/python-idioms`, `/python-patterns` |
| `test_*.py` | `/test-doubles` |

**C#:**
| Pattern | Invoke |
|---------|--------|
| `*.cs` | `/csharp-depth` |

**Go:**
| Pattern | Invoke |
|---------|--------|
| `*.go` | `/simplicity` (Pike's Go proverbs) |

---

## Craft Standards (Still Apply)

Even simple changes must look human-crafted:

- **Names reveal intent** - Not `field1`, `newField`, `data2`
- **Consistent with surroundings** - Match existing naming patterns
- **No speculative additions** - Only what's requested, nothing "while I'm here"
- **Complete the circuit** - If you add a field, update everywhere it matters

## The Checklist (MANDATORY)

Before marking complete, verify ALL that apply:

### For Adding a Field/Property

- [ ] Added to model/entity
- [ ] Added to DTO (if separate)
- [ ] Added to API request/response
- [ ] Added to UI form (if user-facing)
- [ ] Added to UI display (if displayed)
- [ ] Added to validation
- [ ] Added to tests
- [ ] Added to any mappings/transformers
- [ ] Database migration (if persisted)

### For Renaming

- [ ] Renamed in definition
- [ ] Renamed in ALL usages (grep to verify)
- [ ] Renamed in tests
- [ ] Renamed in comments/docs
- [ ] API backwards compatibility considered

### For Adding a Parameter

- [ ] Added to function signature
- [ ] Updated all call sites
- [ ] Updated tests
- [ ] Updated docs/JSDoc
- [ ] Default value if appropriate

### For Bug Fix

- [ ] Root cause identified (not just symptom)
- [ ] Fix is minimal (not refactoring in disguise)
- [ ] Test added to prevent regression
- [ ] Related code checked for same bug

## Process

1. **Understand** - Read the existing code around the change
2. **Check patterns** - How are similar things done nearby?
3. **Make the change** - Following existing patterns
4. **Complete the circuit** - Update all related places
5. **Verify** - Build passes, tests pass
6. **Report** - List what was changed

## Output Format

```markdown
## Quick Change: [description]

CHANGE_TYPE: [add-field | rename | add-param | bug-fix | other]

CHANGED:
- path/to/file.ts: [what changed]
- path/to/other.ts: [what changed]

CHECKLIST:
- [x] Model updated
- [x] DTO updated
- [x] Tests updated
- [ ] N/A: No UI for this field

BUILD: pass
TESTS: pass

QUICK_CHANGE_COMPLETE
```

## Common Mistakes to Avoid

| Mistake | Example | Do This Instead |
|---------|---------|-----------------|
| Incomplete circuit | Added field to model, forgot DTO | Grep for the type name, update all |
| Inconsistent naming | `user_name` in DB, `userName` in code, `name` in UI | Match existing pattern exactly |
| Speculative additions | "Added createdAt while I was there" | Only what was requested |
| Missing validation | Added `email` field with no format check | Add validation if the field has constraints |
| No test | "It's just a field" | Add test, especially for validation |

## Quick Grep Checks

Before marking complete:

```bash
# Find all references to the type/class you modified
grep -r "TypeName" --include="*.ts" | grep -v node_modules

# Find all files that might need updating
grep -r "existingField" --include="*.ts" | grep -v node_modules
# (replace existingField with a sibling field to find related code)
```

## When to Escalate

Use `/create-plan` instead if:
- You're touching 5+ files
- There are design decisions to make
- You're unsure about the right approach
- The "simple" change is revealing complexity
