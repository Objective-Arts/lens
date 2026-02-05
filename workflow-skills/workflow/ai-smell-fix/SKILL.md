---
name: ai-smell-fix
description: Remove AI-generated code smells. Make code look human-written.
---

# /ai-smell-fix [path]

Hunt and remove AI-generated code patterns. Make code look like a skilled human wrote it.

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

AI_SMELL_COMPLETE
```

## Validation (Phase FAILS if violated)

- Smells found but not fixed
- Tests failing after changes
- No AI_SMELL_COMPLETE marker

## 🛑 MANDATORY STOP

After fixing smells:
- DO NOT proceed to next phase
- DO NOT continue with "let me also..."

**Your turn ends here.** Output AI_SMELL_COMPLETE and STOP.
