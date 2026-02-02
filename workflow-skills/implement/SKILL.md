---
name: implement
description: Implement code from plan. Max 30 lines per function. No vague names.
---

# /implement [target]

Implement code from the approved plan. Strict constraints enforced.

## First: Activate Workflow

```bash
mkdir -p .claude && echo '{"skill":"implement","started":"'$(date -Iseconds)'"}' > .claude/active-workflow.json
```

## ⚠️ STRICT REQUIREMENTS - NO JUDGMENT CALLS

You MUST follow these constraints EXACTLY:

1. **MAX 30 LINES PER FUNCTION** - No function may exceed 30 lines. Split if needed.
2. **MAX 300 LINES PER FILE** - Split into modules if approaching limit.
3. **MAX COMPLEXITY 10** - Cyclomatic complexity ≤10 per function. Flatten with early returns, extract helpers.
4. **ONE FILE PER CONCERN** - No god files. Each file has one purpose.
5. **SEARCH BEFORE CREATE** - Before writing a utility function, search for existing implementations:
   - Check `utils/`, `lib/`, `helpers/`, `common/` directories
   - `grep -r "function copyDir" --include="*.ts"` (or similar)
   - If similar exists, import it. Don't recreate.
6. **FOLLOW THE PLAN** - Create exactly the files/functions listed in the plan. No extras.
7. **MEANINGFUL NAMES** - Variables/functions must describe what they do.
8. **NO HARDCODED VALUES** - Use constants or config for magic numbers/strings.
9. **HANDLE ALL ERRORS** - Every operation that can fail must have error handling.

## FORBIDDEN (Phase will FAIL if detected):

- Functions longer than 30 lines
- Files longer than 300 lines
- Cyclomatic complexity > 10 (too many branches/paths)
- Vague names: `data`, `result`, `temp`, `item`, `stuff`, `info`, `obj`
- Multiple concerns in one file
- Recreating utilities that already exist in the codebase
- Hardcoded configuration values
- Ignored error cases
- Features not in the plan

## Process

1. **Load Plan** - Read plan from `.claude/plans/` or context
2. **Check Structure** - Verify types/interfaces exist from `/structure-first`
3. **Implement** - Write code following the plan EXACTLY
4. **Verify** - Ensure code compiles/lints
5. **Dead Code Cleanup** - Remove any dead code introduced (see below)

## REQUIRED Output Format

```markdown
## Implementation: [feature]

FILES_CREATED:
- path/to/file.ts: [functions defined]

LONGEST_FUNCTION: [name] at [N] lines (must be ≤30)

### Verification:
```bash
$ npx tsc --noEmit
(no errors)
```

### Dead Code Cleanup:
TOOL_USED: [knip|qodana|vulture|deadcode|cargo-udeps]
DEAD_CODE_FOUND: [N] items
DEAD_CODE_REMOVED: [list or "none"]

APPLIED:
- [expert]: [decision]

IMPLEMENT_COMPLETE
```

## Dead Code Cleanup (MANDATORY)

After implementation, detect language and remove dead code:

| Language | Detection | Tool | Command |
|----------|-----------|------|---------|
| JS/TS | `package.json` | knip | `npx knip --reporter compact` |
| Java | `pom.xml` or `build.gradle` | Qodana | Use `mcp__qodana__qodana_scan` |
| Python | `pyproject.toml` or `*.py` | vulture | `uvx vulture . --min-confidence 80` |
| Go | `go.mod` | deadcode | `go run golang.org/x/tools/cmd/deadcode@latest ./...` |
| Rust | `Cargo.toml` | cargo-udeps | `cargo +nightly udeps` |
| C# | `*.csproj` | Qodana | Use `mcp__qodana__qodana_scan` |

**Process:**
1. Run the appropriate tool for the detected language
2. Parse output for unused exports, functions, imports, variables
3. Remove dead code directly (no confirmation needed for code YOU just wrote)
4. Re-run tool to verify cleanup

<critical>Only remove dead code in files YOU modified during this implementation. Never touch unrelated files.</critical>

Skip items marked with `@keep`, `// keep`, or `# keep`.

## Validation (Phase will FAIL if violated)

- Any function > 30 lines
- Any file > 300 lines
- Any function with cyclomatic complexity > 10
- Vague variable names detected
- Duplicated utility that exists elsewhere in codebase
- Files not in plan created without justification
- Dead code left behind in files you created/modified

## 🛑 MANDATORY STOP

After implementation:
- DO NOT proceed to next phase
- DO NOT continue with "let me also..."

**Your turn ends here.** Output IMPLEMENT_COMPLETE and STOP.
