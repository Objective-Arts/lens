# Ralph Module Repair Plan

## Target
`src/ralph/` — 42 files, 6,583 lines

## Scope Decision
This is the largest module. Phase class `execute()` methods are intentionally long (they orchestrate multi-step LLM workflows). I will NOT decompose those — they're the right abstraction for their job. Focus on:

1. TOCTOU fixes (high-value, proven pattern)
2. Dead code removal (6 unused exported functions)
3. Dead private function removal (1 instance)

## Findings

### TOCTOU (5 actionable instances)
1. `config/loader.ts:31-38` — existsSync + readFileSync
2. `skills/loader.ts:28-32` — existsSync + readFileSync
3. `phases/structure.ts:73-77` — existsSync + readFileSync
4. `phases/implement.ts:83-87` — existsSync + readFileSync
5. `summary/generator.ts:27-32` — existsSync + readFileSync

Note: `runner/context.ts:116-122` existsSync + statSync is a validation function that SHOULD throw — acceptable pattern.

### Dead Code (7 items)
1. `prd/updater.ts:43-62` — `markItemIncomplete()` — was exported, now private, never called
2. `process/claude.ts:189-197` — `getClaudeVersion()` — private, never called
3. `skills/loader.ts:76-100` — `loadSkillsWithSources()` — private, never called
4. `skills/loader.ts:105-116` — `listSkills()` — private, never called
5. `skills/loader.ts:121-124` — `hasSkill()` — private, never called
6. `skills/loader.ts:130-144` — `extractGuidance()` — private, never called
7. `skills/loader.ts:150-162` — `buildSkillGuidance()` — private, never called
8. `config/loader.ts:68-70` — `getConfigPath()` — private, never called

### Summary generator verification read (minor)
- `summary/generator.ts:52-55` — writeFileSync then readFileSync to "verify" is redundant and a TOCTOU race

## Plan

### 1. Fix TOCTOU in config/loader.ts
Replace existsSync+readFileSync with try-catch. Keep the clear error message.

### 2. Fix TOCTOU in skills/loader.ts
Replace existsSync+readFileSync in loadSkill with try-catch.

### 3. Fix TOCTOU in phases/structure.ts and implement.ts
Replace existsSync+readFileSync with try-catch for plan file loading.

### 4. Fix TOCTOU in summary/generator.ts
Replace existsSync+readFileSync with try-catch. Remove redundant verification read.

### 5. Remove dead code
- Delete `markItemIncomplete` from prd/updater.ts
- Delete `getClaudeVersion` from process/claude.ts
- Delete `loadSkillsWithSources`, `listSkills`, `hasSkill`, `extractGuidance`, `buildSkillGuidance` from skills/loader.ts
- Delete `getConfigPath` from config/loader.ts

## Order
1 → 2 → 3 → 4 → 5
