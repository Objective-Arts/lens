---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Claude-Optimal: Hooks

Hooks enforce quality gates automatically. Unlike flags (which are advisory), hooks block actions until requirements are met.

---

## Hook Types

| Hook Type | When It Runs | Purpose |
|-----------|--------------|---------|
| `PreToolUse` | Before a tool executes | Block/warn before action |
| `PostToolUse` | After a tool executes | Verify results |
| `PreCommit` | Before git commit | Enforce commit requirements |
| `UserPromptSubmit` | When user sends message | Session reminders |

---

## Test Verification Hook

### Purpose

Ensure that code changes have corresponding tests before commit.

### Configuration

Add to `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreCommit": [
      {
        "name": "test-verification",
        "description": "Verify tests exist for changed code",
        "command": "bash -c 'claude-optimal-test-check.sh'",
        "failureMessage": "Missing tests for modified files. Run with --test-complete flag."
      }
    ]
  }
}
```

### Implementation Script

Create `~/.claude/hooks/test-check.sh`:

```bash
#!/bin/bash
# Claude-Optimal Test Verification Hook
# Checks that modified source files have corresponding test files

set -e

# Get list of staged source files (excluding tests)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | \
  grep -E '\.(java|ts|tsx|js|jsx|py)$' | \
  grep -v -E '(test|spec|Test)\.' || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0  # No source files staged
fi

MISSING_TESTS=()

for file in $STAGED_FILES; do
  # Determine expected test file location
  dir=$(dirname "$file")
  base=$(basename "$file" | sed 's/\.[^.]*$//')
  ext="${file##*.}"

  # Check for test file variations
  found=false

  # Java: src/main → src/test
  if [[ "$file" == *"/src/main/"* ]]; then
    test_path="${file/src\/main/src\/test}"
    test_path="${test_path%.*}Test.${ext}"
    if [ -f "$test_path" ]; then found=true; fi
  fi

  # TypeScript/JavaScript: .ts → .test.ts or .spec.ts
  if [[ "$ext" == "ts" || "$ext" == "tsx" || "$ext" == "js" || "$ext" == "jsx" ]]; then
    for pattern in ".test.${ext}" ".spec.${ext}" "_test.${ext}"; do
      test_path="${dir}/${base}${pattern}"
      if [ -f "$test_path" ]; then found=true; break; fi
    done

    # Also check __tests__ directory
    test_path="${dir}/__tests__/${base}.test.${ext}"
    if [ -f "$test_path" ]; then found=true; fi
  fi

  # Python: module.py → test_module.py
  if [[ "$ext" == "py" ]]; then
    test_path="${dir}/test_${base}.py"
    if [ -f "$test_path" ]; then found=true; fi
    test_path="${dir}/tests/test_${base}.py"
    if [ -f "$test_path" ]; then found=true; fi
  fi

  if [ "$found" = false ]; then
    MISSING_TESTS+=("$file")
  fi
done

if [ ${#MISSING_TESTS[@]} -gt 0 ]; then
  echo "⚠️  Missing tests for:"
  printf '  - %s\n' "${MISSING_TESTS[@]}"
  echo ""
  echo "Options:"
  echo "  1. Write tests using --test-complete flag"
  echo "  2. Skip this check: git commit --no-verify"
  exit 1
fi

exit 0
```

### Installation

```bash
# Make executable
chmod +x ~/.claude/hooks/test-check.sh

# Or install as git hook
cp ~/.claude/hooks/test-check.sh .git/hooks/pre-commit
```

---

## Pre-Commit Hook Patterns

### Pattern 1: Warn But Allow

```json
{
  "hooks": {
    "PreCommit": [
      {
        "name": "test-warning",
        "command": "bash -c 'test-check.sh || echo \"Warning: Missing tests\"'",
        "blocking": false
      }
    ]
  }
}
```

### Pattern 2: Block Until Fixed

```json
{
  "hooks": {
    "PreCommit": [
      {
        "name": "test-required",
        "command": "bash -c 'test-check.sh'",
        "blocking": true,
        "failureMessage": "Tests required. Use --test-complete to generate."
      }
    ]
  }
}
```

### Pattern 3: Skip for Certain Files

```json
{
  "hooks": {
    "PreCommit": [
      {
        "name": "test-check",
        "command": "bash -c 'test-check.sh'",
        "exclude": ["*.md", "*.json", "*.yml", "*.config.*"]
      }
    ]
  }
}
```

---

## File Patterns by Language

### Java
```
Source:  src/main/java/com/example/Service.java
Test:    src/test/java/com/example/ServiceTest.java
```

### TypeScript/JavaScript
```
Source:  src/components/Button.tsx
Tests:   src/components/Button.test.tsx
         src/components/Button.spec.tsx
         src/components/__tests__/Button.test.tsx
```

### Python
```
Source:  mymodule/service.py
Tests:   mymodule/test_service.py
         tests/test_service.py
```

### Angular
```
Source:  src/app/components/user/user.component.ts
Test:    src/app/components/user/user.component.spec.ts
```

---

## Integration with --test-complete Flag

The hook and flag work together:

```
Developer writes code
        ↓
Runs --test-complete flag
        ↓
Claude writes appropriate tests
        ↓
Developer commits
        ↓
Hook verifies tests exist ✓
        ↓
Commit succeeds
```

**Without flag:**
```
Developer writes code
        ↓
Developer commits
        ↓
Hook finds missing tests ✗
        ↓
Commit blocked
        ↓
"Run --test-complete to generate tests"
```

---

## Other Useful Hooks

### HIPAA Check (Healthcare)

```json
{
  "hooks": {
    "PreCommit": [
      {
        "name": "hipaa-check",
        "command": "bash -c 'grep -r \"logger.info.*SSN\\|logger.info.*ssn\\|logger.info.*address\" --include=\"*.java\" && exit 1 || exit 0'",
        "failureMessage": "Potential PHI in logs detected"
      }
    ]
  }
}
```

### Lint Check

```json
{
  "hooks": {
    "PreCommit": [
      {
        "name": "lint",
        "command": "npm run lint",
        "failureMessage": "Lint errors found. Run 'npm run lint:fix'"
      }
    ]
  }
}
```

### Build Check

```json
{
  "hooks": {
    "PreCommit": [
      {
        "name": "build",
        "command": "npm run build",
        "failureMessage": "Build failed"
      }
    ]
  }
}
```

---

## Quick Reference

| Need | Hook |
|------|------|
| Tests exist for code | `test-check.sh` |
| No PHI in logs | `hipaa-check` |
| Code passes lint | `lint` |
| Code compiles | `build` |
| No secrets committed | `secrets-check` |

---

## Best Practices

1. **Start with warnings** - Let developers get used to it
2. **Block on critical checks** - Security, tests for critical paths
3. **Allow bypass** - `--no-verify` for emergencies
4. **Keep hooks fast** - < 10 seconds or developers will bypass
5. **Clear error messages** - Tell them HOW to fix, not just WHAT failed
