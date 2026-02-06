# Plan: src/profiles repair

## FILES:
- src/profiles/apply.ts: decompose large functions, fix TOCTOU
- src/profiles/loader.ts: minor — sync/async duplication is intentional (Pike: "a little copying is better than a little dependency")
- src/profiles/validation.ts: clean, no changes
- src/profiles/paths.ts: clean, no changes
- src/profiles/combiner.ts: clean, no changes
- src/profiles/persistence.ts: clean, no changes
- src/profiles/index.ts: clean, no changes

## FUNCTIONS (apply.ts changes):
- applyHooksToProject: fix TOCTOU (existsSync+readFileSync → try-catch)
- applySkillsToProject (55 lines): split manifest creation into helper
- applyMcpServers (53 lines): split env-check into inline simplification
- createProjectMcpJson (47 lines): extract addMcpServerIfMissing helper
- updateClaudeMdWithProfile (41 lines): extract buildProfileSections helper
- getWorkflowCommandsDocs (35 lines): simplify — data-driven workflow table

## INVARIANTS:
- existsSync OK for directory existence checks (deciding whether to create/scan)
- existsSync+readFileSync pairs → try-catch (TOCTOU lesson)
- Every function under 30 lines (target, not all will get there)
- sync/async duplication in loader.ts is intentional — don't deduplicate
- apply.ts target: under 450 lines (from 556)

## SECURITY:
- Fix TOCTOU in applyHooksToProject (line 366-367)
- No new attack surface

## TESTS:
- Existing passing tests must continue to pass
- Many existing tests fail due to canon path issues (pre-existing, not our problem)

## CONSTRAINTS_APPLIED:
- TOCTOU lesson: no existsSync+readFileSync pairs
- Unbounded list lesson: not applicable (profile names from CLI, bounded by filesystem)

PLAN_COMPLETE
