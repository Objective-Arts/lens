---
name: dedupe-fix
description: Find duplicated code and consolidate into shared utilities. Fixes all duplicates.
---

# /dedupe-fix [path]

Find duplicated code patterns and consolidate them into shared utilities.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"dedupe-fix","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## Craft Standards (MANDATORY)

**Consolidate toward code a master craftsperson would be proud of.**

Duplication is a form of technical debt. The consolidated code must look like it was written by a skilled human engineer.

### AI Antipatterns When Consolidating

- Don't create over-abstracted "utility frameworks"
- Don't add unnecessary configuration to consolidated functions
- Don't create deep inheritance hierarchies to share code
- Don't wrap simple functions in classes for no reason

### Human Craft When Consolidating

- Create focused, single-purpose utility functions
- Use clear names that describe what the function does
- Keep the consolidated code SIMPLER than the duplicates
- If consolidation makes code harder to understand, reconsider

**Test:** Is the consolidated version clearer than having the code inline? If not, maybe duplication was acceptable.

---

## Process

### Step 1: Find Duplicates

Search for duplicated patterns:

```bash
# Function definitions appearing in multiple files
grep -rn "function copy\|function hash\|execSync.*git" --include="*.ts" | grep -v test | grep -v node_modules

# Repeated utility patterns
grep -rn "createHash\|getGitCommit\|getGitRemote" --include="*.ts" | grep -v test | grep -v node_modules
```

### Step 2: Analyze Each Duplicate

For each pattern found in 2+ files:
1. Read all instances
2. Compare logic - are they truly identical?
3. If identical or nearly identical → consolidate
4. If intentionally different → document why and skip

### Step 3: Consolidate (MANDATORY)

For each TRUE duplicate:

1. **Create shared utility** in appropriate location:
   - `src/utils/` for general utilities
   - `src/shared/` for cross-module code
   - Module's own `helpers.ts` for module-specific

2. **Extract the function** to shared location:
   ```typescript
   // src/utils/fs.ts
   export function copyDirectoryRecursive(src: string, dest: string): void {
     // consolidated implementation
   }
   ```

3. **Update all usages** to import from shared:
   ```typescript
   import { copyDirectoryRecursive } from '../utils/fs.js';
   ```

4. **Delete duplicate code** from original locations

5. **Verify** - run build/tests:
   ```bash
   npm run build
   npm test
   ```

### Step 4: Report

Document what was consolidated.

## Output Format

```markdown
## Deduplication Fix: [path]

### Summary

| Metric | Value |
|--------|-------|
| Duplicates found | N |
| Consolidated | N |
| Kept separate | N |

### Consolidated

1. **copyDirectoryRecursive**
   - Extracted to: `src/utils/fs.ts`
   - Removed from: `src/canon/helpers.ts`, `src/workflow/index.ts`
   - Usages updated: 5 files

2. **getGitCommit**
   - Extracted to: `src/utils/git.ts`
   - Removed from: `src/canon/index.ts`, `src/profiles/apply.ts`
   - Usages updated: 3 files

### Kept Separate (with reason)

1. **hashDirectory** - Different algorithms for different manifest formats

### Verification

- Build: ✅ Pass
- Tests: ✅ Pass

---
DUPLICATES_FOUND: N
CONSOLIDATED: N
KEPT_SEPARATE: N
DEDUPE_COMPLETE: yes
```

## Rules

- **MUST CONSOLIDATE** - If it's truly duplicated, extract it
- **VERIFY** - Build and test after each consolidation
- **DOCUMENT** - If keeping separate, explain why
- **SINGLE SOURCE** - Each piece of logic should exist once

## Kept Separate Criteria

Only keep duplicates separate if:
- Intentionally different algorithms
- Different dependencies that can't be unified
- Performance-critical paths needing specialization

"Might diverge in the future" is NOT a valid reason.

## Comparison

| Skill | Finds | Fixes |
|-------|-------|-------|
| `/dedupe-scan` | ✓ | ✗ (read-only) |
| `/dedupe-fix` | ✓ | ✓ (consolidates) |
