# Plan: src/trace repair

## FILES:
- src/trace/index.ts: break into smaller functions, dedupe mapping, remove redundant work

## FUNCTIONS:
- findFile(projectPath, ...candidates): string | null (5 lines) - unchanged
- getAppliedProfiles(projectPath): string[] (max 15 lines) - deduplicate file reading logic
- skillToPhase(skill): PhaseName | null (5 lines) - unchanged
- getPhaseConfigKey(phase): string | null (max 5 lines) - extracted from duplicate mapping
- traceProfileSources(projectPath, profiles): YamlSource[] (max 25 lines) - extracted from traceSkillConfig
- traceRalphConfig(projectPath, phase): YamlSource | null (max 20 lines) - extracted
- tracePhaseConfig(projectPath, phase): YamlSource | null (max 25 lines) - extracted
- traceKeywordConfig(projectPath, taskText): YamlSource | null (max 15 lines) - extracted
- resolveConfig(projectPath, phase, taskText): resolvedConfig (max 25 lines) - extracted, single loadConfig call
- traceSkillConfig(projectPath, skillName, taskText?): TraceResult (max 20 lines) - orchestrator only
- formatTrace(trace): string (max 30 lines) - unchanged
- printTrace(projectPath, skillName, taskText?): void (3 lines) - unchanged

## TYPES:
- YamlSource: unchanged
- TraceResult: unchanged
- No new types needed

## INVARIANTS:
- Phase-to-config-key mapping exists in exactly one place
- loadConfig called at most once per trace
- Every extracted function is under 30 lines

## SECURITY:
- No new security concerns (existing patterns preserved)

## TESTS:
- No tests for now (heavy dependency on ralph config modules makes unit testing complex; will test at integration level during src/ralph phase-loop)

## CONSTRAINTS_APPLIED:
- No duplicate modules: phase mapping extracted to single function
- No redundant work: loadConfig called once
- Module boundaries: trace stays self-contained

## APPLIED:
- brevity: break 185-line function into focused helpers
- data-first: extract mapping as data, not repeated code

PLAN_COMPLETE
