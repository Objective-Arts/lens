# Plan: src/canon repair

## FILES:
- src/canon/manifest.ts: fix TOCTOU in readManifest, delete dead code (removeSkillFromManifest, markSkillModified)
- src/canon/hash.ts: delete dead code (isSkillModified)
- src/canon/helpers.ts: existsSync before readdirSync is OK (directory existence, not file TOCTOU)
- src/canon/source.ts: fix TOCTOU in findSkillSourcePath (existsSync+readFileSync pattern)
- src/canon/operations.ts: fix TOCTOU in validateDiffPaths and diffSkill, add path traversal validation
- src/canon/deployment.ts: fix TOCTOU in deploySkill and compareSkillToSource, decompose verifySkillsMatch (48→2x25)
- src/canon/naming.ts: fix TOCTOU in loadNamingConfig
- src/canon/index.ts: clean, no changes
- src/canon/types.ts: clean, no changes

## FUNCTIONS (changes):

### manifest.ts
- readManifest: fix TOCTOU (existsSync+readFileSync → try-catch), return null on any error
- DELETE removeSkillFromManifest (dead code, never called)
- DELETE markSkillModified (dead code, never called)

### hash.ts
- DELETE isSkillModified (dead code, not exported or used)

### source.ts
- findSkillSourcePath: fix TOCTOU — existsSync checks on directories are OK (not file reads), but the existsSync+existsSync double-check for SKILL.md files should use try-catch

### operations.ts
- validateDiffPaths: fix TOCTOU (existsSync+readFileSync → try-catch)
- diffSkill: fix TOCTOU (existsSync+readFileSync → try-catch)
- Add path traversal validation on skill names in copySkill

### deployment.ts
- deploySkill: fix TOCTOU (existsSync before rmSync is OK for cleanup, but existsSync before read is not)
- compareSkillToSource: fix TOCTOU (existsSync+readFileSync → try-catch)
- verifySkillsMatch (48 lines): decompose — extract inner comparison loop

### naming.ts
- loadNamingConfig: fix TOCTOU (existsSync+readFileSync → try-catch)

## INVARIANTS:
- existsSync OK for directory existence checks (deciding whether to scan/create)
- existsSync+readFileSync pairs → try-catch (TOCTOU lesson)
- existsSync before readdirSync → OK (directory check, not file TOCTOU)
- existsSync before rmSync → OK (cleanup guard)
- Every function under 30 lines (target, not all will get there)
- No dead code — delete unused private functions
- Path traversal validation on user-controllable skill names

## SECURITY:
- Fix TOCTOU in file reads across 5 files
- Add path traversal validation in operations.ts copySkill
- No new attack surface

## TESTS:
- Existing canon.test.ts tests must continue to pass (most fail due to canon path issues — pre-existing)
- TOCTOU in test helpers is acceptable (test code, not production)

## CONSTRAINTS_APPLIED:
- TOCTOU lesson: no existsSync+readFileSync pairs in production code
- Path traversal lesson: validate skill names from user-controlled content
- Unbounded list lesson: not applicable (skill lists bounded by filesystem)

PLAN_COMPLETE
