---
name: dedupe
description: Find and report duplicated code patterns across the codebase
---

# /dedupe [path]

Scan codebase for duplicated code patterns and report consolidation opportunities.

## Process

1. **Search for common duplication patterns**
2. **Analyze each finding for true duplication**
3. **Report with consolidation recommendations**

## Patterns to Detect

Search for these function/pattern names appearing in multiple files:

```
PATTERN                         SEARCH
──────────────────────────────────────────────────────────────
Directory operations            function copy.*Directory
                                function.*Recursive
Hashing                         function hash
                                createHash
Git operations                  execSync.*git
                                getGitCommit
                                getGitRemote
File operations                 fs.readFileSync (repeated)
                                fs.writeFileSync (repeated)
                                fs.existsSync (repeated patterns)
Validation                      function validate
                                function is[A-Z].*\(
Path resolution                 path.join.*\.claude
                                homedir()
Error handling                  try.*catch (identical blocks)
```

## Search Commands

Run these searches in parallel:

```bash
# Function definitions appearing in multiple files
grep -r "function copy" --include="*.ts" | grep -v test | grep -v node_modules

# Hash functions
grep -r "function hash" --include="*.ts" | grep -v test | grep -v node_modules

# Git exec calls
grep -r "execSync.*git" --include="*.ts" | grep -v test | grep -v node_modules

# Repeated utility patterns
grep -r "createHash" --include="*.ts" | grep -v test | grep -v node_modules
```

## Analysis Criteria

A pattern is TRUE DUPLICATION if:
- Same logic in 2+ files
- Could be extracted to shared utility
- No semantic reason to keep separate

A pattern is FALSE POSITIVE if:
- Similar names but different logic
- Intentionally separate (different algorithms)
- Test files duplicating production code

## REQUIRED Output Format

```markdown
## Deduplication Report: [path]

DUPLICATIONS_FOUND: N

### 1. [Pattern Name]
FILES:
- [file1:line] - [brief description]
- [file2:line] - [brief description]

RECOMMENDATION: [Extract to utils/X.ts | Keep separate because Y]

### 2. [Pattern Name]
...

FALSE_POSITIVES_SKIPPED: N
- [pattern]: [reason kept separate]

CONSOLIDATION_PRIORITY:
1. [highest impact pattern]
2. [next pattern]
3. ...

DEDUPE_COMPLETE
```

## Example Output

```markdown
## Deduplication Report: src/

DUPLICATIONS_FOUND: 3

### 1. copyDirectoryRecursive
FILES:
- src/canon/helpers.ts:114 - sync recursive copy
- src/workflow/index.ts:223 - sync recursive copy
- src/profiles/apply.ts:94 - async recursive copy

RECOMMENDATION: Extract to utils/fs.ts with sync and async variants

### 2. hashDirectory
FILES:
- src/canon/hash.ts:21 - hashSkillDirectory
- src/workflow/index.ts:191 - hashDirectory

RECOMMENDATION: Keep separate - different algorithms for different manifest formats

FALSE_POSITIVES_SKIPPED: 1
- validateProfile: Different validation logic per module

CONSOLIDATION_PRIORITY:
1. copyDirectoryRecursive (3 files, identical logic)
2. git operations (2 files, execSync vs file read)

DEDUPE_COMPLETE
```

## After Analysis

Report findings. Do NOT automatically fix - user decides which to consolidate.
