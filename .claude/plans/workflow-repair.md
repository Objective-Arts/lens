# Workflow Module Repair Plan

## Target
`src/workflow/` — 2 files, 450 lines (types.ts: 61, index.ts: 389)

## Findings

### TOCTOU (5 instances)
1. `getWorkflowManifest` L126-131: existsSync + readFileSync → just try-catch
2. `listWorkflowSkills` L103-105: existsSync + readFileSync → try-catch
3. `installWorkflowSkill` L179,184: existsSync validation checks (acceptable for UX - these are directory existence checks for early return, not read guards)
4. `installWorkflowSkill` L190-197: existsSync + rmSync before copy (acceptable - rmSync guard)
5. `checkWorkflowStatus` L280,292: existsSync before hashing (acceptable - these guard against hashing non-existent dirs)

**Actionable TOCTOU:** #1 and #2 only

### Functions Over 30 Lines (4 functions)
1. `listWorkflowSkills` L85-118 (34 lines) — extract frontmatter description parsing
2. `installWorkflowSkill` L171-220 (50 lines) — extract validation + manifest update
3. `checkWorkflowStatus` L266-328 (63 lines) — extract status determination logic
4. `upgradeWorkflowSkills` L333-376 (44 lines) — extract categorization logic

### Dead Code
- `getInstalledWorkflowSkills` L381-387 — private, never called

### Path Traversal
- `installWorkflowSkill` — no validation on `skillName` parameter (user-controlled from CLI)

### String Matching Fragility
- `installAllWorkflowSkills` L253: `result.message.includes('already installed')` — fragile

## Plan

### 1. Fix TOCTOU in getWorkflowManifest
Remove existsSync, just try-catch readFileSync+JSON.parse (already has try-catch, just remove the guard).

### 2. Fix TOCTOU in listWorkflowSkills
Replace existsSync+readFileSync with try-catch for SKILL.md reading.

### 3. Add path traversal validation to installWorkflowSkill
Add `isValidSkillName` (same pattern as canon/operations.ts).

### 4. Decompose installWorkflowSkill (50 → ~15 + helpers)
- Extract `validateSkillSource(skillName, sourcePath)` — checks source exists, has SKILL.md
- Extract `updateWorkflowManifest(projectPath, skillName, ...)` — manifest read/create/update/write

### 5. Decompose checkWorkflowStatus (63 → ~20 + helper)
- Extract `determineWorkflowSkillStatus(info, installedPath, sourceSkillPath, sourceInfo)` — the status determination logic from the loop body

### 6. Decompose upgradeWorkflowSkills (44 → ~25 + helper)
- Extract `categorizeForUpgrade(status, force)` — the skip/upgrade/error categorization

### 7. Remove dead code
- Delete `getInstalledWorkflowSkills`

### 8. Fix string matching fragility
- In `installAllWorkflowSkills`, use structured check instead of string matching on error message

## Order
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
