---
name: review-hard
description: Adversarial self-review to catch structural issues before external reviewers do. Use before completion, commit, or PR.
---

# /review-hard

Perform adversarial self-review on target code. Catch issues before external reviewers (Gemini, Qodana) do.

## Target

If a path argument is provided, review that file/directory.
If no argument, review the code most recently written or modified in this session.

## Process

1. **Check** against project CLAUDE.md standards (if present)
2. **Ask**: "What would Gemini or Qodana flag?"
3. **Look for**:
   - Mixed concerns (data processing in render logic)
   - Long functions (>30 lines)
   - Inconsistent patterns (mixing approaches)
   - Re-attached event handlers
   - Implicit responsibilities
   - Missing error handling
   - Security vulnerabilities (injection, XSS, auth issues)
4. **Fix** all issues found
5. **List** what was fixed

## Output Format

```markdown
## Review Findings

### Fixed:
- [specific fix 1]
- [specific fix 2]
- [specific fix N]

### Verified:
- [x] No function exceeds 30 lines
- [x] Data prep separate from rendering
- [x] Consistent patterns throughout
- [x] Event handlers attached once
- [x] No security vulnerabilities
- [x] Error handling appropriate

Code is now review-ready.
```

## If No Issues Found

```markdown
## Review Findings

### Verified:
- [x] All checks pass

Code is review-ready.
```

## Mindset

Be hostile. Assume external reviewers will scrutinize everything. Find issues before they do.
