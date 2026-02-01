/**
 * Tools Management - Install companion CLI tools
 *
 * Manages installation of helper scripts like ralph (autonomous PRD loop runner).
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export interface ToolInfo {
  name: string;
  description: string;
  path?: string;
  installed: boolean;
}

export interface ToolInstallResult {
  success: boolean;
  message: string;
  path?: string;
}

// Default install location
const DEFAULT_BIN_DIR = path.join(homedir(), '.local', 'bin');

/**
 * Get the bin directory for tool installation.
 *
 * @returns Path to the bin directory (default: ~/.local/bin)
 */
export function getBinDir(): string {
  return process.env.CC_BIN_DIR || DEFAULT_BIN_DIR;
}

/**
 * The ralph script template - autonomous PRD implementation loop with quality gates
 */
const RALPH_SCRIPT = `#!/bin/bash
#
# ralph - Autonomous PRD implementation with quality gates
#
# Usage:
#   ralph PRD.md --yes           # Run autonomously
#   ralph PRD.md --resume        # Continue from checkpoint
#   ralph PRD.md --skip-scan     # Skip Qodana scan
#   ralph --create-baseline      # Create Qodana baseline
#

set -e

# Track spinner PID for cleanup
CURRENT_SPINNER_PID=""

# Cleanup function to kill orphan spinner on exit
cleanup() {
  [ -n "\$CURRENT_SPINNER_PID" ] && kill \$CURRENT_SPINNER_PID 2>/dev/null || true
}
trap cleanup EXIT

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
DIM='\\033[2m'
NC='\\033[0m'

# Arguments
PRD="\${1:-PRD.md}"
MAX=50
RESUME=false
YES=false
CREATE_BASELINE=false
SKIP_SCAN=false
LOG_DIR=".claude/ralph-logs"
SESSIONS_DIR=".claude/sessions"
BASELINE_FILE=".qodana/baseline.sarif.json"

for arg in "$@"; do
  case $arg in
    --resume) RESUME=true; YES=true ;;
    --yes|-y) YES=true ;;
    --max=*) MAX="\${arg#*=}" ;;
    --create-baseline) CREATE_BASELINE=true ;;
    --skip-scan|--skip-qodana) SKIP_SCAN=true ;;
  esac
done

# Handle --create-baseline
if [ "$CREATE_BASELINE" = true ]; then
  echo "Creating Qodana baseline..."
  mkdir -p .qodana
  if qodana scan --project-dir . --results-dir .qodana/results > /dev/null 2>&1; then
    if [ -f ".qodana/results/qodana.sarif.json" ]; then
      cp .qodana/results/qodana.sarif.json "$BASELINE_FILE"
      ISSUE_COUNT=$(grep -c '"level": "error"' "$BASELINE_FILE" 2>/dev/null || echo 0)
      echo -e "\${GREEN}✓\${NC} Baseline created ($ISSUE_COUNT existing issues baselined)"
    fi
  else
    echo -e "\${RED}✗\${NC} Failed to create baseline"
  fi
  exit 0
fi

mkdir -p .claude "$LOG_DIR" "$SESSIONS_DIR"

# Skill tracking file for session summary
SKILL_LOG="$LOG_DIR/skills-$(date +%Y%m%d-%H%M%S).txt"
touch "$SKILL_LOG"

# Run stage with spinner and skill invocation feedback
# Usage: run_stage SESSION_ID icon name prompt logfile [is_first]
run_stage() {
  local session_id=$1
  local icon=$2
  local name=$3
  local prompt=$4
  local logfile=$5
  local is_first=$6

  local start=$(date +%s)

  # Print stage header
  echo ""
  echo "════════════════════════════════════════════════════════"
  echo "  $icon $name"
  echo "════════════════════════════════════════════════════════"

  # Start spinner in background (disown to suppress termination message)
  local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local spin_pid
  (
    trap '' TERM
    while true; do
      for ((i=0; i<\${#spinstr}; i++)); do
        printf "\\r  \${DIM}\${spinstr:\$i:1} Working...\${NC}"
        sleep 0.15
      done
    done
  ) 2>/dev/null &
  spin_pid=$!
  CURRENT_SPINNER_PID=\$spin_pid
  disown \$spin_pid 2>/dev/null

  # Run claude with stream-json to capture skill invocations
  # < /dev/null prevents stdin blocking, || true prevents set -e from exiting on pipeline failures
  claude --dangerously-skip-permissions \\
    --output-format stream-json --verbose \\
    -p "$prompt" < /dev/null 2>&1 | \\
    tee "$logfile.json" | \\
    grep --line-buffered -o '"skill":"[^"]*"\\|"tool_use"' | \\
    while IFS= read -r match; do
      # Kill spinner on first output
      if kill -0 \$spin_pid 2>/dev/null; then
        kill \$spin_pid 2>/dev/null
        wait \$spin_pid 2>/dev/null
        printf "\\r\\033[K"  # Clear line completely
        sleep 0.05  # Brief pause to ensure line is cleared
      fi
      if [[ "$match" == *'"skill":'* ]]; then
        skill=$(echo "$match" | sed 's/"skill":"//;s/"//')
        printf "\\r\\033[K"  # Ensure clean line before skill
        desc=$(skill_desc "$skill")
        if [ -n "$desc" ]; then
          echo -e "  \${GREEN}⚡ /\$skill\${NC} \${DIM}(\$desc)\${NC}"
        else
          echo -e "  \${GREEN}⚡ /\$skill\${NC}"
        fi
        echo "\$skill" >> "$SKILL_LOG"
      else
        # Print a dot for each tool use to show progress
        printf "."
      fi
    done || true

  # Kill spinner if still running (no output case)
  if kill -0 \$spin_pid 2>/dev/null; then
    kill \$spin_pid 2>/dev/null
    wait \$spin_pid 2>/dev/null
    printf "\\r\\033[K"  # Clear line completely
  fi
  CURRENT_SPINNER_PID=""

  # Extract final result from stream-json output
  grep -o '"result":"[^"]*"' "$logfile.json" 2>/dev/null | tail -1 | sed 's/"result":"//;s/"$//' > "$logfile.raw" || true

  local elapsed=$(($(date +%s) - start))
  echo ""
  echo "  ✓ $name done ($(format_time $elapsed))"
}


# Helper functions
count_incomplete() {
  grep -cE "^[[:space:]]*[-*+][[:space:]]*\\[[[:space:]]\\]" "$PRD" 2>/dev/null | head -1 || echo 0
}

get_next_item() {
  grep -E "^[[:space:]]*[-*+][[:space:]]*\\[[[:space:]]\\]" "$PRD" | head -1 | sed 's/^[[:space:]]*[-*+][[:space:]]*\\[[[:space:]]\\][[:space:]]*//'
}

mark_complete() {
  # Find the line number of the first incomplete item and mark it complete
  local line_num=$(grep -nE "^[[:space:]]*[-*+][[:space:]]*\\[[[:space:]]\\]" "$PRD" | head -1 | cut -d: -f1)
  if [ -n "$line_num" ]; then
    # Replace [ ] with [x] on that specific line
    sed -i.bak "\${line_num}s/\\[[[:space:]]\\]/[x]/" "$PRD"
    rm -f "$PRD.bak"
  fi
}

format_time() {
  local secs=$1
  printf "%02d:%02d" $((secs / 60)) $((secs % 60))
}

# Brief description for each skill
skill_desc() {
  case "$1" in
    # Composite skills (chain to individuals)
    planning-masters) echo "→ kernighan, pike, dijkstra, bloch..." ;;
    security-canon) echo "→ schneier, owasp, tanya-janca..." ;;
    testing-experts) echo "→ dodds, meszaros, hevery..." ;;
    docs-masters) echo "→ procida, tufte, strunk-white..." ;;
    refactor-masters) echo "→ kernighan, feathers, gang-of-four..." ;;
    # Individual experts
    kernighan) echo "clarity" ;;
    pike) echo "simplicity" ;;
    thompson) echo "elegance" ;;
    mcilroy) echo "unix philosophy" ;;
    dijkstra) echo "correctness" ;;
    knuth) echo "algorithms" ;;
    linus) echo "taste" ;;
    bloch) echo "API design" ;;
    liskov) echo "contracts" ;;
    cherny) echo "type-driven" ;;
    crockford) echo "JS patterns" ;;
    hejlsberg) echo "type systems" ;;
    gang-of-four) echo "design patterns" ;;
    feathers) echo "refactoring" ;;
    schneier|bruce-schneier) echo "security mindset" ;;
    owasp) echo "secure coding" ;;
    tanya-janca) echo "appsec" ;;
    troy-hunt) echo "breach lessons" ;;
    leveson) echo "safety engineering" ;;
    dodds) echo "testing" ;;
    meszaros) echo "test patterns" ;;
    fowler-test) echo "test strategy" ;;
    hevery) echo "testable code" ;;
    procida) echo "diátaxis" ;;
    tufte) echo "information design" ;;
    strunk-white) echo "concise writing" ;;
    zinsser) echo "clarity in prose" ;;
    taleb) echo "antifragile" ;;
    petroski) echo "failure analysis" ;;
    *) echo "" ;;
  esac
}

# Ensure git repo exists
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  git init && git add -A && git commit -m "Initial commit"
fi

# Validate PRD
if [ ! -f "$PRD" ]; then
  echo -e "\${RED}Error:\${NC} PRD not found: $PRD"
  exit 1
fi

initial_incomplete=$(count_incomplete)
if [ "$initial_incomplete" -eq 0 ]; then
  echo -e "\${GREEN}✓\${NC} All items complete!"
  exit 0
fi

# Header
echo ""
echo -e "\${CYAN}Ralph\${NC} — $PRD"
echo -e "\${DIM}$initial_incomplete items remaining\${NC}"
echo ""

# Resume context
RESUME_CONTEXT=""
if [ "$RESUME" = true ]; then
  latest=$(ls -t "$SESSIONS_DIR"/progress-*.md 2>/dev/null | head -1)
  if [ -n "$latest" ]; then
    echo -e "\${DIM}Resuming from: $latest\${NC}"
    RESUME_CONTEXT=$(cat "$latest")
  fi
fi

[ "$YES" = false ] && { echo "Press Enter to start..."; read -r; }

# Stage prompts
read -r -d '' PLAN_PROMPT << 'EOF' || true
PLAN IMPLEMENTATION

CRITICAL: Do NOT modify __PRD__. Ralph manages the checklist. Only create the plan file.

Steps:
1. Invoke skills: Use Skill tool for each: "kernighan", "pike", "dijkstra"
__LANG_SKILLS_STEP__
3. Read __PRD__ and find next incomplete item marked '- [ ]'
4. Explore the codebase to understand current architecture
5. Identify files that need to be created or modified
6. Write plan to .claude/plans/[item-slug].md

Plan format:
## [Item Name]

### Approach
[1-2 sentences on implementation strategy]

### Files to Change
- path/to/file.ts - [what changes]

### Security Considerations
- [any trust boundaries, atomicity needs, etc.]

### Tests Needed
- [test cases to write]

Output at end:
PLAN_FILE: [path to plan]
PLAN_COMPLETE

If blocked: PLAN_FAILED: [reason]
EOF

read -r -d '' BUILD_PROMPT << 'EOF' || true
BUILD FROM PLAN

CRITICAL: Do NOT modify the PRD file. Ralph manages the checklist.

Steps:
1. Invoke skills: Use Skill tool for each: "kernighan", "pike", "bloch"
__LANG_SKILLS_STEP__
3. Read the plan at __PLAN_FILE__
4. Implement each file change
5. Write tests as specified in plan
6. Run tests - must pass
7. Commit changes

Output at end:
BUILD_COMPLETE: [item name]
TESTS_PASSED: yes/no
COMMIT_SHA: [hash]

If blocked: BUILD_FAILED: [reason]
EOF

read -r -d '' CLEAN_PROMPT << 'EOF' || true
CLEAN THE CODE

CRITICAL: Do NOT modify the PRD file. Ralph manages the checklist.

Steps:
1. Invoke skills: Use Skill tool for each: "feathers", "gang-of-four"
2. Get changed files: git diff HEAD~1 --name-only
3. For each file, apply structural improvements
4. Commit improvements

Output at end:
METHODS_EXTRACTED: [count]
NAMES_IMPROVED: [count]
CLEAN_COMPLETE

If nothing to clean: CLEAN_SKIPPED
EOF

read -r -d '' TEST_PROMPT << 'EOF' || true
RUN TESTS

CRITICAL: Do NOT modify the PRD file. Ralph manages the checklist.

Steps:
1. Invoke skills: Use Skill tool for each: "dodds", "meszaros"
2. Run: npm test (or project equivalent)
3. If failures, fix them
4. Re-run until green

Output at end:
TESTS_TOTAL: [count]
TESTS_PASSED: [count]
TEST_COMPLETE

If stuck: TEST_FAILED: [reason]
EOF

read -r -d '' REVIEW_PROMPT << 'EOF' || true
EXPERT REVIEW

CRITICAL: Do NOT modify the PRD file. Ralph manages the checklist.

Steps:
1. Invoke skills: Use Skill tool for each: "schneier", "owasp"
2. Get changed files: git diff HEAD~1 --name-only
3. Read each file through security lens
4. Call gemini_review MCP tool for each file
5. For critical issues: fix, commit, re-verify (max 3 attempts)

Output at end:
ISSUES_FOUND: [count]
ISSUES_FIXED: [count]
VERIFIED_CLEAN: yes/no
REVIEW_COMPLETE
EOF

read -r -d '' DOC_PROMPT << 'EOF' || true
DOCUMENTATION

CRITICAL: Do NOT modify the PRD file. Ralph manages the checklist.

Steps:
1. Invoke skills: Use Skill tool for each: "procida", "strunk-white"
__LANG_SKILLS_STEP__
3. Get changed files: git diff HEAD~1 --name-only

You MUST create or update these specific files:

1. Get changed files: git diff HEAD~1 --name-only

2. For EACH changed source file, you MUST:
   - Read the file
   - Add JSDoc/docstring to EVERY exported function
   - Include @param, @returns, @example for each
   - Write the updated file

3. Create/update docs/CHANGELOG.md:
   - Add entry for today's changes
   - Format: ## [date] - [item name]
   - List what was added/changed

4. Update README.md (create if missing):
   - Ensure Installation section exists
   - Ensure Usage section with example exists
   - Add any new CLI commands or APIs

5. Commit all documentation with message "docs: update for [item name]"

VERIFICATION: Before outputting DOC_COMPLETE, confirm:
- [ ] JSDoc added to all new functions
- [ ] CHANGELOG.md updated
- [ ] README.md has usage examples

Output at end:
JSDOC_ADDED: [count of functions documented]
CHANGELOG_UPDATED: yes/no
README_UPDATED: yes/no
DOC_COMPLETE

If no code files changed: DOC_SKIPPED
EOF

# Main loop
items_done=0
item_num=$((initial_incomplete - $(count_incomplete) + 1))

for iter in $(seq 1 $MAX); do
  LOG="$LOG_DIR/item\${item_num}_$(date +%H%M%S)"

  remaining=$(count_incomplete)
  [ "$remaining" -eq 0 ] && break

  CURRENT_ITEM=$(get_next_item)
  total_items=$initial_incomplete

  # Generate session ID for this item (reuse across all stages)
  SESSION_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

  # Item header
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "📋 \${CYAN}$CURRENT_ITEM\${NC} ($item_num of $total_items)"
  echo -e "\${DIM}Session: $SESSION_ID\${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # ═══════════════════════════════════════════════════════════
  # STAGE 1: PLAN
  # ═══════════════════════════════════════════════════════════
  ITEM_SLUG=$(echo "$CURRENT_ITEM" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
  PLAN_FILE=".claude/plans/\${ITEM_SLUG}.md"
  mkdir -p .claude/plans

  P0="\${PLAN_PROMPT/__PRD__/$PRD}"
  [ -n "$RESUME_CONTEXT" ] && [ "$iter" -eq 1 ] && P0="RESUME CONTEXT:\\n$RESUME_CONTEXT\\n\\n$P0"

  run_stage "$SESSION_ID" "📝" "Planning" "$P0" "$LOG.plan" "true"

  if grep -q "PLAN_COMPLETE" "$LOG.plan.raw" 2>/dev/null; then
    echo -e "  📝 \${GREEN}✓\${NC} Plan created: $(pwd)/$PLAN_FILE"
  else
    echo -e "  📝 \${RED}✗\${NC} Planning failed"
    sleep 2
    continue
  fi

  # ═══════════════════════════════════════════════════════════
  # STAGE 2: BUILD
  # ═══════════════════════════════════════════════════════════
  P1="\${BUILD_PROMPT/__PLAN_FILE__/$PLAN_FILE}"

  run_stage "$SESSION_ID" "🔨" "Building" "$P1" "$LOG.build"

  if grep -q "BUILD_COMPLETE" "$LOG.build.raw" 2>/dev/null; then
    TESTS=$(grep "TESTS_PASSED:" "$LOG.build.raw" 2>/dev/null | tail -1 | sed 's/.*: *//')
    echo -e "  🔨 \${GREEN}✓\${NC} Build complete (tests: \${TESTS:-unknown})"
  else
    echo -e "  🔨 \${RED}✗\${NC} Build failed"
    sleep 2
    continue
  fi

  # ═══════════════════════════════════════════════════════════
  # STAGE 3: REFACTOR OPPORTUNITY CHECK
  # ═══════════════════════════════════════════════════════════
  run_stage "$SESSION_ID" "🧹" "Refactor Opportunity Check" "$CLEAN_PROMPT" "$LOG.clean"

  if grep -q "CLEAN_COMPLETE" "$LOG.clean.raw" 2>/dev/null; then
    EXTRACTED=$(grep "METHODS_EXTRACTED:" "$LOG.clean.raw" 2>/dev/null | tail -1 | sed 's/.*: *//')
    RENAMED=$(grep "NAMES_IMPROVED:" "$LOG.clean.raw" 2>/dev/null | tail -1 | sed 's/.*: *//')
    echo -e "  🧹 \${GREEN}✓\${NC} Clean complete (\${EXTRACTED:-0} extracted, \${RENAMED:-0} renamed)"
  elif grep -q "CLEAN_SKIPPED" "$LOG.clean.raw" 2>/dev/null; then
    echo -e "  🧹 \${YELLOW}○\${NC} Nothing to refactor"
  else
    echo -e "  🧹 \${GREEN}✓\${NC} Clean complete"
  fi

  # ═══════════════════════════════════════════════════════════
  # STAGE 4: TEST
  # ═══════════════════════════════════════════════════════════
  run_stage "$SESSION_ID" "🧪" "Testing" "$TEST_PROMPT" "$LOG.test"

  if grep -q "TEST_COMPLETE" "$LOG.test.raw" 2>/dev/null; then
    PASSED=$(grep "TESTS_PASSED:" "$LOG.test.raw" 2>/dev/null | tail -1 | sed 's/.*: *//')
    TOTAL=$(grep "TESTS_TOTAL:" "$LOG.test.raw" 2>/dev/null | tail -1 | sed 's/.*: *//')
    echo -e "  🧪 \${GREEN}✓\${NC} Tests passed (\${PASSED:-all}/\${TOTAL:-all})"
  else
    echo -e "  🧪 \${RED}✗\${NC} Tests failed"
  fi

  # ═══════════════════════════════════════════════════════════
  # STAGE 5: EXTERNAL STATIC ANALYSIS (Qodana)
  # ═══════════════════════════════════════════════════════════
  if [ "$SKIP_SCAN" = true ]; then
    echo -e "  🔍 \${YELLOW}○\${NC} Code scan skipped (--skip-scan)"
  elif command -v qodana &>/dev/null; then
    echo -e "  🔍 \${CYAN}External Static Analysis...\${NC}"

    QODANA_CMD="qodana scan --within-docker=false --project-dir . --results-dir .qodana/results --commit HEAD~1"
    [ -f "$BASELINE_FILE" ] && QODANA_CMD="$QODANA_CMD --baseline $BASELINE_FILE"

    $QODANA_CMD > "$LOG.scan.log" 2>&1

    if [ -f ".qodana/results/qodana.sarif.json" ]; then
      CRIT=$(jq '[.runs[].results[] | select(.level == "error")] | length' .qodana/results/qodana.sarif.json 2>/dev/null || echo 0)
      if [ "$CRIT" -gt 0 ]; then
        echo -e "  🔍 \${YELLOW}Found $CRIT issues → fixing\${NC}"
        ISSUES=$(jq '.runs[].results[] | select(.level == "error")' .qodana/results/qodana.sarif.json 2>/dev/null | head -100)
        run_stage "$SESSION_ID" "🔧" "Fixing scan issues" "Fix these issues. Commit when done. Output SCAN_FIXED when complete:\\n$ISSUES" "$LOG.scan.fix"
        echo -e "  🔍 \${GREEN}✓\${NC} Scan issues fixed"
      else
        echo -e "  🔍 \${GREEN}✓\${NC} No issues found"
      fi
    else
      echo -e "  🔍 \${GREEN}✓\${NC} Scan complete"
    fi
  else
    echo -e "  🔍 \${YELLOW}○\${NC} Qodana not installed"
  fi

  # ═══════════════════════════════════════════════════════════
  # STAGE 6: ADVERSARIAL REVIEW (Gemini)
  # ═══════════════════════════════════════════════════════════
  run_stage "$SESSION_ID" "👁️" "Adversarial Review (Gemini)" "$REVIEW_PROMPT" "$LOG.review"

  # Extract review results from JSON log (more reliable than .raw)
  FOUND=$(grep -o 'ISSUES_FOUND:[[:space:]]*[0-9]*' "$LOG.review.json" 2>/dev/null | tail -1 | sed 's/.*:[[:space:]]*//')
  FIXED=$(grep -o 'ISSUES_FIXED:[[:space:]]*[0-9]*' "$LOG.review.json" 2>/dev/null | tail -1 | sed 's/.*:[[:space:]]*//')
  CLEAN=$(grep -o 'VERIFIED_CLEAN:[[:space:]]*[a-z]*' "$LOG.review.json" 2>/dev/null | tail -1 | sed 's/.*:[[:space:]]*//')

  if [ -n "$FOUND" ] || [ -n "$FIXED" ]; then
    if [ "$CLEAN" = "yes" ]; then
      echo -e "  👁️ \${GREEN}✓\${NC} Gemini: \${FOUND:-0} issues found, \${FIXED:-0} fixed, verified clean"
    else
      echo -e "  👁️ \${GREEN}✓\${NC} Gemini: \${FOUND:-0} issues found, \${FIXED:-0} fixed"
    fi
  else
    echo -e "  👁️ \${GREEN}✓\${NC} Gemini: no issues reported"
  fi

  # ═══════════════════════════════════════════════════════════
  # STAGE 7: DOCUMENTATION
  # ═══════════════════════════════════════════════════════════
  run_stage "$SESSION_ID" "📚" "Documentation" "$DOC_PROMPT" "$LOG.doc"

  if grep -q "DOC_COMPLETE" "$LOG.doc.raw" 2>/dev/null; then
    FILES_DOC=$(grep "FILES_DOCUMENTED:" "$LOG.doc.raw" 2>/dev/null | tail -1 | sed 's/.*: *//')
    README=$(grep "README_UPDATED:" "$LOG.doc.raw" 2>/dev/null | tail -1 | sed 's/.*: *//')
    echo -e "  📚 \${GREEN}✓\${NC} Documentation complete (\${FILES_DOC:-0} files, README: \${README:-no})"
  else
    echo -e "  📚 \${GREEN}✓\${NC} Documentation complete"
  fi

  # ═══════════════════════════════════════════════════════════
  # COMPLETE
  # ═══════════════════════════════════════════════════════════
  mark_complete "$CURRENT_ITEM"
  NEW_REM=$(count_incomplete)

  echo ""
  if [ "$NEW_REM" -eq 0 ]; then
    echo -e "✅ \${GREEN}Complete\${NC} — all items done!"
  else
    echo -e "✅ \${GREEN}Complete\${NC} → $NEW_REM items remaining"
  fi
  echo ""

  items_done=$((items_done + 1))
  item_num=$((item_num + 1))

  # Checkpoint every 3 items
  if [ $((items_done % 3)) -eq 0 ]; then
    ts=$(date +%Y-%m-%dT%H-%M-%S)
    PROG="$SESSIONS_DIR/progress-\${ts}.md"
    cat > "$PROG" << CHECKPOINT
# Ralph Progress - $ts
PRD: $PRD ($items_done items done, $NEW_REM remaining)
Last item: $CURRENT_ITEM
Resume: ralph $PRD --resume
CHECKPOINT
    git add "$PROG" && git commit -m "Checkpoint: $items_done items" 2>/dev/null || true
    echo -e "\${DIM}Checkpoint saved\${NC}"
  fi

  sleep 1
done

# Final report
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
remaining=$(count_incomplete)
done_count=$((initial_incomplete - remaining))
echo -e "📊 \${CYAN}Summary\${NC}: $done_count/$initial_incomplete complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "^[[:space:]]*[-*+][[:space:]]*\\[" "$PRD" | head -10

# Skill invocation summary
if [ -s "$SKILL_LOG" ]; then
  echo ""
  echo -e "\${CYAN}Skills Invoked:\${NC}"
  # Count and sort skills, display in columns
  sort "$SKILL_LOG" | uniq -c | sort -rn | while read count skill; do
    printf "  \${GREEN}%-20s\${NC} %d\\n" "/\$skill" "\$count"
  done
  total_skills=$(wc -l < "$SKILL_LOG" | tr -d ' ')
  unique_skills=$(sort "$SKILL_LOG" | uniq | wc -l | tr -d ' ')
  echo -e "\${DIM}  Total: \$total_skills invocations, \$unique_skills unique skills\${NC}"
fi

echo ""
echo -e "\${DIM}Logs: $LOG_DIR\${NC}"
`;

/**
 * Canon report generator script
 */
const CANON_REPORT_SCRIPT = `#!/bin/bash
#
# canon-report - Generate D3 visualization of canon master skill usage
#
# Parses Claude session logs and generates an interactive HTML report
# showing which expert skills were invoked and how they interacted.
#
# Usage:
#   canon-report [log-file]
#   canon-report                    # Uses .claude/ralph-log.txt or finds recent sessions
#   canon-report session.log        # Parse specific log file
#

set -e

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
NC='\\033[0m'

# Output files
mkdir -p .claude
CANON_LOG=".claude/canon-masters.json"
CANON_REPORT=".claude/canon-report.html"

# Find log source
LOG_SOURCE="\${1:-}"
if [ -z "$LOG_SOURCE" ]; then
  if [ -f ".claude/ralph-log.txt" ]; then
    LOG_SOURCE=".claude/ralph-log.txt"
  else
    # Try to find recent Claude session logs
    CLAUDE_DIR=~/.claude/projects
    if [ -d "$CLAUDE_DIR" ]; then
      LOG_SOURCE=$(find "$CLAUDE_DIR" -name "*.jsonl" -mtime -1 2>/dev/null | head -1)
    fi
  fi
fi

echo ""
echo -e "\${CYAN}╔═══════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${CYAN}║           Canon Masters Report Generator                  ║\${NC}"
echo -e "\${CYAN}╚═══════════════════════════════════════════════════════════╝\${NC}"
echo ""

if [ -z "$LOG_SOURCE" ] || [ ! -f "$LOG_SOURCE" ]; then
  echo -e "\${YELLOW}No log file found. Creating report from common skill patterns.\${NC}"
  LOG_SOURCE=""
fi

if [ -n "$LOG_SOURCE" ]; then
  echo -e "  \${BLUE}Log Source:\${NC} $LOG_SOURCE"
fi
echo -e "  \${BLUE}Output:\${NC}     $CANON_REPORT"
echo ""

# Extract skill invocations
echo -e "\${CYAN}Extracting skill invocations...\${NC}"

if [ -n "$LOG_SOURCE" ]; then
  skills_raw=$(grep -oE '/[a-z]+-?[a-z]*' "$LOG_SOURCE" 2>/dev/null | sort | uniq -c | sort -rn)
else
  skills_raw=""
fi

# Build JSON
cat > "$CANON_LOG" << 'CANON_JSON_START'
{
  "session": {
CANON_JSON_START

echo "    \\"timestamp\\": \\"$(date -Iseconds)\\"," >> "$CANON_LOG"
echo "    \\"source\\": \\"$LOG_SOURCE\\"" >> "$CANON_LOG"
echo "  }," >> "$CANON_LOG"

# Extract skills with counts
echo '  "skills": [' >> "$CANON_LOG"
first=true
skill_count=0
total_invocations=0

while read -r count skill; do
  [ -z "$skill" ] && continue
  # Skip non-skill patterns
  case "$skill" in
    /dev|/dev/*|/api/*|/etc/*|/tmp/*|/usr/*|/bin/*|/var/*) continue ;;
  esac
  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$CANON_LOG"
  fi
  # Categorize by domain
  case "$skill" in
    /frost|/ive|/norman|/wroblewski|/duarte|/buxton|/curtis|/kruzeniski|/rams)
      domain="ui-ux" ;;
    /dodds|/crockford|/simpson|/bloch|/pike|/cleary)
      domain="testing-quality" ;;
    /taleb|/petroski)
      domain="architecture" ;;
    /abramov|/cherny)
      domain="code-quality" ;;
    /procida)
      domain="documentation" ;;
    /plan|/adversarial-review)
      domain="workflow" ;;
    *)
      domain="other" ;;
  esac
  printf '    {"name": "%s", "count": %d, "domain": "%s"}' "$skill" "$count" "$domain" >> "$CANON_LOG"
  skill_count=$((skill_count + 1))
  total_invocations=$((total_invocations + count))
done <<< "$skills_raw"

echo "" >> "$CANON_LOG"
echo "  ]," >> "$CANON_LOG"

# Extract co-occurrences
echo '  "connections": [' >> "$CANON_LOG"
if [ -n "$LOG_SOURCE" ]; then
  grep -E "SKILLS INVOKED:" "$LOG_SOURCE" 2>/dev/null | while read -r line; do
    skills_in_line=$(echo "$line" | grep -oE '/[a-z]+-?[a-z]*' | sort -u)
    echo "$skills_in_line" | while read -r s1; do
      echo "$skills_in_line" | while read -r s2; do
        [ "$s1" \\< "$s2" ] && echo "$s1 $s2"
      done
    done
  done | sort | uniq -c | sort -rn | head -50 | while read -r cnt s1 s2; do
    [ -z "$s1" ] && continue
    echo "    {\\"source\\": \\"$s1\\", \\"target\\": \\"$s2\\", \\"weight\\": $cnt},"
  done >> "$CANON_LOG"
fi
sed -i.bak '$ s/,$//' "$CANON_LOG" 2>/dev/null || true
rm -f "$CANON_LOG.bak"
echo "  ]" >> "$CANON_LOG"
echo "}" >> "$CANON_LOG"

# Generate HTML report
cat > "$CANON_REPORT" << 'HTML_END'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canon Masters Report</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #eee;
      min-height: 100vh;
    }
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    h1 { text-align: center; margin-bottom: 0.5rem; color: #00d9ff; }
    .subtitle { text-align: center; color: #888; margin-bottom: 2rem; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .stat-value { font-size: 2.5rem; font-weight: bold; color: #00d9ff; }
    .stat-label { color: #888; margin-top: 0.5rem; }
    .graph-container {
      background: rgba(0,0,0,0.3);
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 2rem;
      min-height: 500px;
    }
    .legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; }
    .legend-dot { width: 12px; height: 12px; border-radius: 50%; }
    .skills-table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      overflow: hidden;
    }
    .skills-table th, .skills-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .skills-table th { background: rgba(0,217,255,0.1); color: #00d9ff; }
    .skills-table tr:hover { background: rgba(255,255,255,0.05); }
    .domain-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
    }
    .domain-ui-ux { background: #e91e63; }
    .domain-testing-quality { background: #4caf50; }
    .domain-architecture { background: #ff9800; }
    .domain-code-quality { background: #2196f3; }
    .domain-documentation { background: #9c27b0; }
    .domain-workflow { background: #607d8b; }
    .domain-other { background: #795548; }
    .empty-state { text-align: center; padding: 3rem; color: #888; }
    svg text { font-size: 11px; fill: #fff; }
    .link { stroke: rgba(255,255,255,0.3); }
  </style>
</head>
<body>
  <div class="container">
    <h1>Canon Masters Report</h1>
    <p class="subtitle">Expert Skill Usage Analysis</p>
    <div class="stats" id="stats"></div>
    <div class="legend" id="legend"></div>
    <div class="graph-container" id="graph-container">
      <svg id="graph" width="100%" height="500"></svg>
    </div>
    <h2 style="margin-bottom: 1rem;">Skills Invoked</h2>
    <table class="skills-table">
      <thead><tr><th>Skill</th><th>Domain</th><th>Count</th></tr></thead>
      <tbody id="skills-body"></tbody>
    </table>
  </div>
  <script>
HTML_END

# Inject JSON data
echo "const data = " >> "$CANON_REPORT"
cat "$CANON_LOG" >> "$CANON_REPORT"
echo ";" >> "$CANON_REPORT"

cat >> "$CANON_REPORT" << 'HTML_SCRIPT'
    const domainColors = {
      'ui-ux': '#e91e63',
      'testing-quality': '#4caf50',
      'architecture': '#ff9800',
      'code-quality': '#2196f3',
      'documentation': '#9c27b0',
      'workflow': '#607d8b',
      'other': '#795548'
    };
    const domainLabels = {
      'ui-ux': 'UI/UX Design',
      'testing-quality': 'Testing & Quality',
      'architecture': 'Architecture',
      'code-quality': 'Code Quality',
      'documentation': 'Documentation',
      'workflow': 'Workflow',
      'other': 'Other'
    };

    if (data.skills.length === 0) {
      document.getElementById('stats').innerHTML = '<div class="empty-state">No skills found in logs. Run a session with canon masters first.</div>';
      document.getElementById('graph-container').style.display = 'none';
      document.getElementById('skills-body').innerHTML = '<tr><td colspan="3" style="text-align:center;color:#888;">No data</td></tr>';
    } else {
      // Stats
      document.getElementById('stats').innerHTML = \`
        <div class="stat-card">
          <div class="stat-value">\${data.skills.length}</div>
          <div class="stat-label">Canon Masters</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">\${data.skills.reduce((a,b) => a + b.count, 0)}</div>
          <div class="stat-label">Total Invocations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">\${[...new Set(data.skills.map(s => s.domain))].length}</div>
          <div class="stat-label">Domains</div>
        </div>
      \`;

      // Legend
      const domains = [...new Set(data.skills.map(s => s.domain))];
      document.getElementById('legend').innerHTML = domains.map(d => \`
        <div class="legend-item">
          <div class="legend-dot" style="background: \${domainColors[d]}"></div>
          <span>\${domainLabels[d] || d}</span>
        </div>
      \`).join('');

      // Table
      document.getElementById('skills-body').innerHTML = data.skills.map(s => \`
        <tr>
          <td><strong>\${s.name}</strong></td>
          <td><span class="domain-badge domain-\${s.domain}">\${domainLabels[s.domain] || s.domain}</span></td>
          <td>\${s.count}</td>
        </tr>
      \`).join('');

      // D3 Graph
      const svg = d3.select('#graph');
      const width = svg.node().getBoundingClientRect().width || 800;
      const height = 500;
      const nodes = data.skills.map(s => ({ id: s.name, count: s.count, domain: s.domain }));
      const links = (data.connections || []).filter(l =>
        nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target)
      );

      if (nodes.length > 0) {
        const simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink(links).id(d => d.id).distance(100))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.count) * 10 + 20));

        const link = svg.append('g').selectAll('line').data(links).join('line')
          .attr('class', 'link').attr('stroke-width', d => Math.sqrt(d.weight || 1) * 2);

        const node = svg.append('g').selectAll('g').data(nodes).join('g')
          .call(d3.drag()
            .on('start', (e,d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag', (e,d) => { d.fx = e.x; d.fy = e.y; })
            .on('end', (e,d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

        node.append('circle')
          .attr('r', d => Math.sqrt(d.count) * 8 + 10)
          .attr('fill', d => domainColors[d.domain] || '#888')
          .attr('stroke', '#fff').attr('stroke-width', 2);

        node.append('text').text(d => d.id).attr('text-anchor', 'middle').attr('dy', 4);

        simulation.on('tick', () => {
          link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
              .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
          node.attr('transform', d => \\\`translate(\\\${d.x},\\\${d.y})\\\`);
        });
      }
    }
  </script>
</body>
</html>
HTML_SCRIPT

echo ""
echo -e "\${GREEN}═══════════════════════════════════════════════════════════\${NC}"
echo -e "\${GREEN}  Canon Masters Report Generated\${NC}"
echo -e "\${GREEN}═══════════════════════════════════════════════════════════\${NC}"
echo ""
echo -e "  \${BLUE}Skills Found:\${NC}      $skill_count"
echo -e "  \${BLUE}Total Invocations:\${NC} $total_invocations"
echo ""
echo -e "  \${BLUE}JSON Data:\${NC}  $CANON_LOG"
echo -e "  \${BLUE}HTML Report:\${NC} $CANON_REPORT"
echo ""
echo -e "  Open report: \${CYAN}open $CANON_REPORT\${NC}"
echo ""
`;

/**
 * List of available tools with their metadata
 */
const AVAILABLE_TOOLS: Record<string, { description: string; script: string }> = {
  ralph: {
    description: 'Autonomous PRD implementation loop - wraps Claude Code for continuous development',
    script: RALPH_SCRIPT
  },
  'canon-report': {
    description: 'Generate D3 visualization of canon master skill usage from session logs',
    script: CANON_REPORT_SCRIPT
  }
};

/**
 * List all available tools.
 *
 * @returns Array of tool info including installation status
 *
 * @example
 * ```typescript
 * const tools = listTools();
 * tools.forEach(tool => {
 *   console.log(`${tool.name}: ${tool.installed ? 'installed' : 'not installed'}`);
 * });
 * ```
 */
export function listTools(): ToolInfo[] {
  const binDir = getBinDir();

  return Object.entries(AVAILABLE_TOOLS).map(([name, info]) => {
    const toolPath = path.join(binDir, name);
    const installed = fs.existsSync(toolPath);

    return {
      name,
      description: info.description,
      path: installed ? toolPath : undefined,
      installed
    };
  });
}

/**
 * Check if a specific tool is installed.
 *
 * @param name - Tool name
 * @returns True if installed
 */
export function isToolInstalled(name: string): boolean {
  const binDir = getBinDir();
  return fs.existsSync(path.join(binDir, name));
}

/**
 * Install a tool to the user's bin directory.
 *
 * Creates the script in ~/.local/bin (or CC_BIN_DIR) and makes it executable.
 *
 * @param name - Tool name to install (e.g., 'ralph')
 * @param options - Installation options
 * @param options.force - Overwrite existing installation
 * @returns Result with success status and message
 *
 * @example
 * ```typescript
 * const result = installTool('ralph');
 * if (result.success) {
 *   console.log(`Installed to ${result.path}`);
 * }
 *
 * // Force reinstall
 * installTool('ralph', { force: true });
 * ```
 */
export function installTool(
  name: string,
  options: { force?: boolean; projectDir?: string } = {}
): ToolInstallResult {
  const tool = AVAILABLE_TOOLS[name];

  if (!tool) {
    return {
      success: false,
      message: `Unknown tool: ${name}. Available: ${Object.keys(AVAILABLE_TOOLS).join(', ')}`
    };
  }

  const binDir = getBinDir();
  const toolPath = path.join(binDir, name);

  // Check if already installed
  if (fs.existsSync(toolPath) && !options.force) {
    return {
      success: false,
      message: `Tool already installed: ${toolPath}. Use --force to overwrite.`,
      path: toolPath
    };
  }

  // Ensure bin directory exists
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // For ralph, read from bin/ralph source file instead of embedded script
  let scriptContent = tool.script;
  if (name === 'ralph') {
    const currentFileUrl = new URL(import.meta.url);
    const currentDir = path.dirname(currentFileUrl.pathname);
    const binRalphPath = path.resolve(currentDir, '..', '..', 'bin', 'ralph');
    if (fs.existsSync(binRalphPath)) {
      scriptContent = fs.readFileSync(binRalphPath, 'utf-8');
      console.log(`  Using bin/ralph source`);
    }
  }

  // Write the script
  fs.writeFileSync(toolPath, scriptContent, { mode: 0o755 });

  // For ralph, also setup MCP servers in project .mcp.json
  if (name === 'ralph') {
    const projectDir = options.projectDir || process.cwd();
    const mcpPath = path.join(projectDir, '.mcp.json');
    let mcpConfig: { mcpServers?: Record<string, unknown> } = { mcpServers: {} };

    if (fs.existsSync(mcpPath)) {
      try {
        mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
        if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
      } catch {
        mcpConfig = { mcpServers: {} };
      }
    }

    // Get base path: dist/tools -> dist -> cli -> claude-optimal
    const currentFileUrl = new URL(import.meta.url);
    const currentDir = path.dirname(currentFileUrl.pathname);
    const baseDir = path.resolve(currentDir, '..', '..', '..');

    // Add gemini-reviewer MCP
    const geminiPath = path.join(baseDir, 'mcp-servers', 'gemini-reviewer', 'index.js');
    if (fs.existsSync(geminiPath)) {
      mcpConfig.mcpServers!['gemini-reviewer'] = {
        type: 'stdio',
        command: 'node',
        args: [geminiPath],
        env: { GEMINI_API_KEY: process.env.GEMINI_API_KEY || '' }
      };
      console.log(`  Added MCP: gemini-reviewer`);
    } else {
      console.log(`  Warning: gemini-reviewer not found at ${geminiPath}`);
    }

    // Add qodana MCP
    const qodanaPath = path.join(baseDir, 'mcp-servers', 'qodana', 'dist', 'index.js');
    if (fs.existsSync(qodanaPath)) {
      mcpConfig.mcpServers!['qodana'] = {
        type: 'stdio',
        command: 'node',
        args: [qodanaPath]
      };
      console.log(`  Added MCP: qodana`);
    } else {
      console.log(`  Warning: qodana not found at ${qodanaPath}`);
    }

    try {
      const content = JSON.stringify(mcpConfig, null, 2);
      console.log(`  Writing to: ${mcpPath}`);
      fs.writeFileSync(mcpPath, content);
      // Verify it was written
      if (fs.existsSync(mcpPath)) {
        console.log(`  ✓ Created: ${mcpPath}`);
      } else {
        console.log(`  ✗ FAILED: File not found after write!`);
      }
    } catch (err) {
      console.log(`  ✗ Write error: ${err}`);
    }
  }

  return {
    success: true,
    message: `Installed ${name} to ${toolPath}`,
    path: toolPath
  };
}

/**
 * Uninstall a tool from the user's bin directory.
 *
 * @param name - Tool name to uninstall
 * @returns Result with success status and message
 */
export function uninstallTool(name: string): ToolInstallResult {
  const binDir = getBinDir();
  const toolPath = path.join(binDir, name);

  if (!fs.existsSync(toolPath)) {
    return {
      success: false,
      message: `Tool not installed: ${name}`
    };
  }

  fs.unlinkSync(toolPath);

  return {
    success: true,
    message: `Uninstalled ${name} from ${toolPath}`
  };
}

/**
 * Get the path where a tool would be installed.
 *
 * @param name - Tool name
 * @returns Full path to the tool
 */
export function getToolPath(name: string): string {
  return path.join(getBinDir(), name);
}
