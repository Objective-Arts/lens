---
name: ai-smell-fix
description: Remove AI-generated code smells. Make code look human-written.
---

# /ai-smell-fix [path]

Hunt and remove AI-generated code patterns. Make code look like a skilled human wrote it.

> **No arguments?** Describe this skill and stop. Do not execute.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"ai-smell-fix","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## The AI Smell Checklist

### Over-Abstraction
- Factories/wrappers used exactly once → **inline them**
- `createUserService()` that just returns `new UserService()` → **delete factory**
- Abstract base class with one implementation → **flatten to concrete**

### Defensive Paranoia
- Null checks where null is impossible → **remove**
- `if (x !== undefined && x !== null && x)` → **just `if (x)`**
- Try/catch around infallible code → **remove**
- Validating internal function arguments → **trust your own code**

### Comment Spam
- `// increment counter` above `counter++` → **delete**
- `// loop through users` above `for (user of users)` → **delete**
- `// return the result` above `return result` → **delete**
- Comments that repeat the code → **delete all**

### Speculative Features
- Config options nobody uses → **remove**
- Parameters with only one value ever passed → **inline**
- `options?: { verbose?: boolean }` never set to true → **remove**
- Feature flags for features that shipped months ago → **remove**

### Enterprise Patterns in Simple Code
- Repository pattern for one entity → **inline queries**
- Event bus with one publisher and one subscriber → **direct call**
- Strategy pattern with one strategy → **just use the function**
- Builder pattern for object with 3 fields → **use object literal**

### Generic Wrapper Abuse
- `Result<T, E>` when you just throw → **throw**
- `Response<T>` that's always `{ data: T }` → **just return T**
- `Maybe<T>` when null works fine → **use null**
- Custom error types that add nothing → **use Error**

### Verbose Naming
- `userDataObjectInstance` → **`user`**
- `isCurrentlyProcessingRequest` → **`processing`**
- `getAllUsersFromDatabase` → **`getUsers`**
- Names longer than 25 chars → **shorten**

### Excessive Structure
- Single-method classes → **convert to function**
- `utils/helpers/formatters/stringFormatters.ts` → **flatten**
- Re-exporting everything through index files → **import directly**

### Architectural Bloat
- More than 1 file per clear concern → **consolidate** (e.g., crypto.ts + keystore-io.ts doing load/save/encrypt = 1 concern)
- Helper file with <5 functions all called from one place → **inline into caller**
- Type defined in separate file but used by only 1 module → **colocate with module**
- Data flows through >2 functions before doing work (A calls B calls C calls D) → **flatten call chain**
- Same value threaded through >3 function signatures → **restructure so it's available naturally**

## Process

1. **Scan** - Read all files in target
2. **Identify** - Find AI smell patterns
3. **Fix** - Remove/simplify each one
4. **Verify** - Run tests to ensure behavior preserved

## REQUIRED Output Format

```markdown
## AI Smell Removal: [target]

SMELLS_FOUND:
- [file:line] [smell type]: [description]

SMELLS_FIXED:
- [file:line] [smell type] → [what was done]

LINES_REMOVED: N
ABSTRACTIONS_INLINED: N
COMMENTS_DELETED: N

TESTS_PASS: yes

AI_SMELL_REVIEW_COMPLETE
```

## Final: Record Lessons Learned

After fixing all smells, record NEW findings so earlier phases stop generating them.

**Write to TWO files:**

### 1. Project-local: `.claude/lessons.md`

Append the specific finding with file paths and context:

```markdown
## {date} - {target path}
### AI Smell Review Found (ai-smell-fix)
- {CATEGORY}: {specific description with file:line} → {which earlier phase should catch this and how}
```

### 2. Universal: `.claude/universal-lessons.md`

Read this file first. If the **general pattern** is already listed, skip. If it's a NEW general pattern not already covered, append it to the appropriate section (AI_SMELL Patterns, CODE_QUALITY Patterns, or DESIGN Patterns). Write the general rule, not the project-specific instance:

```markdown
### {Pattern Name}
- {General description of the AI smell, not tied to specific files} → {how to avoid it}
```

**Categories and where they route:**
- Over-abstraction → DESIGN (plan, structure should avoid single-use wrappers)
- Defensive paranoia → CODE_QUALITY (implementation should trust typed inputs)
- Comment spam → CODE_QUALITY (implementation should not add comments restating code)
- Speculative features → DESIGN (plan should not design unused config/options)
- Dead code → CODE_QUALITY (implementation should verify exports have callers)
- Enterprise patterns → DESIGN (structure should pick simplest pattern that works)

Common AI smell findings that indicate earlier-phase gaps:
- Single-use helper functions → plan should not decompose below the natural abstraction level
- JSDoc restating function names → implementation should only comment non-obvious behavior
- Null checks on typed parameters → implementation should trust TypeScript's type system
- Unused types/interfaces → structure should not create types speculatively

If no new lessons were learned (already in both files), skip this step.

## Validation (Phase FAILS if violated)

- Smells found but not fixed
- Tests failing after changes
- No AI_SMELL_REVIEW_COMPLETE marker

## 🛑 MANDATORY STOP

After fixing smells:
- DO NOT proceed to next phase
- DO NOT continue with "let me also..."

**Your turn ends here.** Output AI_SMELL_REVIEW_COMPLETE and STOP.
