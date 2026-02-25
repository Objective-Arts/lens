#!/bin/bash
# seed.sh — Generate real .lens/ data from an existing project
#
# Usage:
#   ./scripts/seed.sh ~/projects/my-app
#   ./scripts/seed.sh ~/projects/my-app "My App"
#
# Creates:
#   <project>/.lens/project.json
#   <project>/.lens/runs/<timestamp>-scan.json
#
# The lens-ui reads from these files instead of sample data.

set -euo pipefail

TARGET="${1:-.}"
PROJECT_NAME="${2:-$(basename "$(cd "$TARGET" && pwd)")}"
LENS_DIR="$TARGET/.lens"
RUNS_DIR="$LENS_DIR/runs"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%S")
RUN_FILE="$RUNS_DIR/${TIMESTAMP}-scan.json"

mkdir -p "$RUNS_DIR"

# --- Detect language and framework ---
LANGUAGE="Unknown"
FRAMEWORK="Unknown"

if [ -f "$TARGET/tsconfig.json" ]; then
  LANGUAGE="TypeScript"
elif ls "$TARGET"/*.js "$TARGET"/src/*.js 2>/dev/null | head -1 > /dev/null 2>&1; then
  LANGUAGE="JavaScript"
elif [ -f "$TARGET/requirements.txt" ] || [ -f "$TARGET/pyproject.toml" ]; then
  LANGUAGE="Python"
fi

if [ -f "$TARGET/angular.json" ]; then
  FRAMEWORK="Angular"
elif [ -f "$TARGET/next.config.ts" ] || [ -f "$TARGET/next.config.js" ] || [ -f "$TARGET/next.config.mjs" ]; then
  FRAMEWORK="Next.js"
elif [ -f "$TARGET/package.json" ] && grep -q '"react"' "$TARGET/package.json" 2>/dev/null; then
  FRAMEWORK="React"
elif [ -f "$TARGET/package.json" ]; then
  FRAMEWORK="Node.js"
fi

# --- Count files ---
TOTAL_FILES=$(find "$TARGET" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" | wc -l | tr -d ' ')
TOTAL_LINES=$(find "$TARGET" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" \) \
  -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/dist/*" -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')

# --- Quick pattern scan for findings ---
FINDINGS="[]"
FINDING_ID=0

scan_pattern() {
  local severity="$1"
  local category="$2"
  local canon="$3"
  local pattern="$4"
  local description="$5"
  local fix="$6"

  while IFS=: read -r file line _match; do
    [ -z "$file" ] && continue
    FINDING_ID=$((FINDING_ID + 1))
    # Make path relative
    local rel_file="${file#$TARGET/}"
    FINDINGS=$(echo "$FINDINGS" | jq --arg id "f-$FINDING_ID" \
      --arg sev "$severity" --arg cat "$category" --arg canon "$canon" \
      --arg file "$rel_file" --argjson line "$line" \
      --arg desc "$description" --arg fix "$fix" \
      '. + [{
        id: $id, severity: $sev, category: $cat, canon: $canon,
        file: $file, line: $line, description: $desc,
        suggestedFix: $fix, status: "open"
      }]')
  done < <(grep -rn "$pattern" "$TARGET" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist \
    2>/dev/null | head -20)
}

echo "Scanning $TARGET..."

# Security patterns
scan_pattern "critical" "security" "security-mindset" \
  "eval(" "Use of eval() — arbitrary code execution risk" \
  "Replace eval with a safe alternative (JSON.parse, Function constructor with validation, or AST-based approach)"

scan_pattern "critical" "security" "owasp" \
  "innerHTML" "Direct innerHTML assignment — XSS vulnerability" \
  "Use textContent for plain text, or sanitize with DOMPurify before innerHTML"

scan_pattern "high" "security" "security-mindset" \
  "process\.env\.\w*SECRET\|process\.env\.\w*KEY\|process\.env\.\w*PASSWORD" \
  "Potential secret in code — verify not hardcoded" \
  "Ensure secrets come from environment variables, never committed to source"

# AI smell patterns
scan_pattern "medium" "ai-smell" "clarity" \
  "// This function\|// This method\|// This component\|// This class" \
  "Comment restates what code already says — AI-generated comment smell" \
  "Delete the comment. The code is self-documenting."

scan_pattern "medium" "ai-smell" "refactoring" \
  "TODO\|FIXME\|HACK\|XXX" \
  "TODO/FIXME marker left in code" \
  "Resolve the TODO or create a ticket and remove the marker"

# Complexity patterns
scan_pattern "medium" "complexity" "simplicity" \
  "catch.*{[[:space:]]*}" \
  "Empty catch block — swallowed error" \
  "Log the error, re-throw, or handle it explicitly"

scan_pattern "low" "style" "deadcode" \
  "^import.*from.*;\?$" \
  "Check for unused imports" \
  "Remove unused imports — run your linter to identify them"

# Next.js specific
if [ "$FRAMEWORK" = "Next.js" ]; then
  scan_pattern "high" "architecture" "nextjs" \
    "'use client'" \
    "Client component — verify this needs browser APIs or interactivity" \
    "Push the client boundary down to the smallest interactive leaf component"
fi

# Count by severity
CRITICAL=$(echo "$FINDINGS" | jq '[.[] | select(.severity == "critical")] | length')
HIGH=$(echo "$FINDINGS" | jq '[.[] | select(.severity == "high")] | length')
MEDIUM=$(echo "$FINDINGS" | jq '[.[] | select(.severity == "medium")] | length')
LOW=$(echo "$FINDINGS" | jq '[.[] | select(.severity == "low")] | length')
TOTAL_FINDINGS=$(echo "$FINDINGS" | jq 'length')

# --- Generate scores (heuristic based on findings) ---
sec_score=$(( 10 - CRITICAL * 3 - HIGH ))
[ $sec_score -lt 1 ] && sec_score=1
struct_score=$(( 8 - HIGH / 2 ))
[ $struct_score -lt 3 ] && struct_score=3
err_score=$(( 7 - MEDIUM / 3 ))
[ $err_score -lt 2 ] && err_score=2
name_score=7
complex_score=$(( 8 - MEDIUM / 4 ))
[ $complex_score -lt 3 ] && complex_score=3
type_score=8
test_score=6

TOTAL_SCORE=$(( sec_score + struct_score + err_score + name_score + complex_score + type_score + test_score ))

# --- Determine verdict ---
if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 2 ]; then
  VERDICT="needs-rework"
elif [ "$HIGH" -gt 0 ] || [ "$MEDIUM" -gt 5 ]; then
  VERDICT="needs-fixes"
else
  VERDICT="production-ready"
fi

# --- Write project.json ---
cat > "$LENS_DIR/project.json" << PROJ
{
  "id": "proj-$(echo "$PROJECT_NAME" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')",
  "name": "$PROJECT_NAME",
  "path": "$(cd "$TARGET" && pwd)",
  "language": "$LANGUAGE",
  "framework": "$FRAMEWORK",
  "files": $TOTAL_FILES,
  "lines": $TOTAL_LINES,
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
PROJ

# --- Write run result ---
START_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

cat > "$RUN_FILE" << EOF
{
  "id": "run-${TIMESTAMP}",
  "projectId": "proj-$(echo "$PROJECT_NAME" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')",
  "mode": "scan",
  "status": "completed",
  "startedAt": "$START_TIME",
  "completedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "target": ".",
  "findings": $FINDINGS,
  "scores": [
    {"dimension": "Security", "score": $sec_score, "maxScore": 10},
    {"dimension": "Structure", "score": $struct_score, "maxScore": 10},
    {"dimension": "Error Handling", "score": $err_score, "maxScore": 10},
    {"dimension": "Naming", "score": $name_score, "maxScore": 10},
    {"dimension": "Complexity", "score": $complex_score, "maxScore": 10},
    {"dimension": "Type Safety", "score": $type_score, "maxScore": 10},
    {"dimension": "Testability", "score": $test_score, "maxScore": 10}
  ],
  "totalScore": $TOTAL_SCORE,
  "maxScore": 70,
  "verdict": "$VERDICT",
  "fixesApplied": 0,
  "phases": [
    {"name": "File Detection", "status": "completed", "startedAt": "$START_TIME", "completedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "findingsCount": 0},
    {"name": "Pattern Scan", "status": "completed", "startedAt": "$START_TIME", "completedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "findingsCount": $TOTAL_FINDINGS}
  ]
}
EOF

echo ""
echo "Done. Results written to:"
echo "  $LENS_DIR/project.json"
echo "  $RUN_FILE"
echo ""
echo "  Project:  $PROJECT_NAME ($LANGUAGE / $FRAMEWORK)"
echo "  Files:    $TOTAL_FILES ($TOTAL_LINES lines)"
echo "  Score:    $TOTAL_SCORE/70 — $VERDICT"
echo "  Findings: $TOTAL_FINDINGS ($CRITICAL critical, $HIGH high, $MEDIUM medium, $LOW low)"
