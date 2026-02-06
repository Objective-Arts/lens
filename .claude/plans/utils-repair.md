# Plan: src/utils repair

## FILES:
- src/utils/validation.ts: fix null-byte logic, remove dead code, fix error message contradiction
- src/utils/tokens.ts: remove redundant inline comments
- src/utils/git.ts: replace magic number with readable expression
- src/canon/manifest.ts: remove re-export of git utils (consumers import directly)
- src/canon/helpers.ts: remove re-export alias of copyDirectorySync
- src/workflow/index.ts: import getGitCommit/getGitRemote from utils/git directly (not via canon)

## FUNCTIONS:
- validateProjectPath(projectPath, allowedRoot?): string | null (max 20 lines) - fix null-byte rejection to be unconditional, simplify redundant branch logic
- getPathValidationError(projectPath): string (max 10 lines) - align error message with actual validateProjectPath behavior

## TYPES:
- No type changes needed (existing types are adequate)

## INVARIANTS:
- Null bytes in paths are always rejected regardless of allowedRoot
- validateProjectPath and getPathValidationError agree on what's invalid
- No module re-exports utils through barrel files — consumers import utils directly

## SECURITY:
- Null byte rejection must happen before any path resolution (prevents null-byte path truncation attacks)
- Path traversal check must be consistent between validation and error reporting

## TESTS:
- validateProjectPath rejects null bytes unconditionally: [verifies null byte in path returns null even without allowedRoot]
- validateProjectPath allows .. when resolving within allowedRoot: [verifies legitimate relative paths work]
- validateProjectPath rejects .. when resolving outside allowedRoot: [verifies traversal attack blocked]
- getPathValidationError returns correct message for null-byte paths: [verifies error message matches behavior]
- Error path test: isValidName with empty string, overlength string, special characters

## CONSTRAINTS_APPLIED:
- Module boundaries: removing re-exports from canon/manifest.ts and canon/helpers.ts
- Single source of truth: utils/git is the only source for git functions
- No orphan code: removing dead isValidDirectory function

## APPLIED:
- security-mindset: null-byte rejection unconditional, before path.resolve
- brevity: removing redundant comments that repeat JSDoc

PLAN_COMPLETE
