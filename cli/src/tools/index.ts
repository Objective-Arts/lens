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
 * The ralph script template - autonomous PRD implementation loop
 */
const RALPH_SCRIPT = `#!/bin/bash
#
# ralph - Autonomous PRD implementation loop
#
# Wraps Claude Code to continuously implement PRD items until complete.
# Uses git for state persistence between iterations.
#
# Usage:
#   ralph [prd-file] [max-iterations]
#   ralph PRD.md 50
#   ralph docs/requirements.md
#

set -e

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
NC='\\033[0m' # No Color

# Spinner function - shows activity while Claude is working
spinner() {
  local pid=$1
  local delay=0.15
  local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local i=0
  local start_time=$(date +%s)

  while kill -0 "$pid" 2>/dev/null; do
    local now=$(date +%s)
    local elapsed=$((now - start_time))
    local mins=$((elapsed / 60))
    local secs=$((elapsed % 60))
    local char="\${spinstr:i++%\${#spinstr}:1}"
    printf "\\r\${CYAN}%s\${NC} Claude is working... \${BLUE}[%02d:%02d]\${NC}  " "$char" "$mins" "$secs"
    sleep $delay
  done
  printf "\\r\\033[K" # Clear the spinner line
}

# Arguments
PRD="\${1:-PRD.md}"
MAX="\${2:-50}"
LOG_FILE=".claude/ralph-log.txt"

# Ensure .claude directory exists
mkdir -p .claude

# Header
echo ""
echo -e "\${CYAN}╔═══════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${CYAN}║              RALPH - Autonomous PRD Loop                  ║\${NC}"
echo -e "\${CYAN}╚═══════════════════════════════════════════════════════════╝\${NC}"
echo ""
echo -e "  \${BLUE}PRD File:\${NC}        $PRD"
echo -e "  \${BLUE}Max Iterations:\${NC}  $MAX"
echo -e "  \${BLUE}Log File:\${NC}        $LOG_FILE"
echo ""

# Check PRD exists
if [ ! -f "$PRD" ]; then
  echo -e "\${RED}Error: PRD file not found: $PRD\${NC}"
  exit 1
fi

# Count initial incomplete items
initial_incomplete=$(grep -cE "^[[:space:]]*[-*+][[:space:]]*\\[[[:space:]]\\]" "$PRD" 2>/dev/null) || true
initial_incomplete=\${initial_incomplete:-0}
echo -e "  \${BLUE}Incomplete Items:\${NC} $initial_incomplete"
echo ""

if [ "$initial_incomplete" -eq 0 ]; then
  echo -e "\${GREEN}All PRD items already complete!\${NC}"
  exit 0
fi

# Confirm before starting
echo -e "\${YELLOW}This will run Claude autonomously with --dangerously-skip-permissions\${NC}"
echo -e "\${YELLOW}Press Enter to start, Ctrl+C to cancel...\${NC}"
read -r

# Log start
echo "=== Ralph Loop Started: $(date) ===" >> "$LOG_FILE"
echo "PRD: $PRD, Max: $MAX" >> "$LOG_FILE"

# Track iterations without progress for idle detection
idle_count=0
last_complete_count=$((initial_incomplete))

for i in $(seq 1 $MAX); do
  echo ""
  echo -e "\${CYAN}═══════════════════════════════════════════════════════════\${NC}"
  echo -e "\${CYAN}  ITERATION $i / $MAX\${NC}"
  echo -e "\${CYAN}═══════════════════════════════════════════════════════════\${NC}"
  echo ""

  # Log iteration
  echo "" >> "$LOG_FILE"
  echo "--- Iteration $i: $(date) ---" >> "$LOG_FILE"

  # Run Claude with detailed ralph-loop instructions
  # Using heredoc with quoted delimiter to prevent bash interpretation of backticks
  RALPH_PROMPT=$(cat <<'RALPH_PROMPT_END'
RALPH LOOP ITERATION __ITER__ - AUTONOMOUS PRD IMPLEMENTATION

## PRODUCTION READINESS REQUIRED

All code MUST be production-ready. This means:
- NO shortcuts, hacks, or "good enough" implementations
- NO TODO comments left behind
- NO skipped error handling
- NO hardcoded values that should be configurable
- FULL test coverage for critical paths
- PROPER security considerations
- CODE REVIEW must pass before marking complete

Read __PRD__ and find the NEXT incomplete item (marked with '- [ ]').

## MANDATORY WORKFLOW - EACH STEP REQUIRED

### STEP 0: PLAN (REQUIRED)
Create a plan file and continue. DO NOT use EnterPlanMode or ExitPlanMode tools.

1. Explore the codebase to understand current state
2. Design the implementation approach
3. Write the plan to .claude/plans/[item-slug].md using the Write tool
4. Plans are AUTO-APPROVED in autonomous mode - no approval needed
5. IMMEDIATELY continue to Step 1

⚠️ CRITICAL: Do NOT use EnterPlanMode or ExitPlanMode tools in autonomous mode.
These tools pause for user approval which breaks the autonomous loop.
Just write plan files directly and continue.

AUTONOMOUS MODE RULES (--dangerously-skip-permissions is active):
- ALL file operations are pre-approved: Write, Edit, create, delete
- ALL directory operations are pre-approved: mkdir, rmdir
- ALL Bash commands are pre-approved
- ALL MCP tools are pre-approved: mcp__gemini-reviewer__*, mcp__qodana__*, etc.
- ALL Skill invocations are pre-approved
- After ANY tool call, proceed IMMEDIATELY - no waiting
- Do NOT output "waiting for approval" or ask for confirmation
- Do NOT pause for user input at any point
- NEVER present options or ask the user to choose
- NEVER ask user to "process results" or "review output" - just process it yourself
- Just execute everything directly and move on
GEMINI REVIEW: Process results automatically. Fix issues found. Do not ask user to review.
QODANA SCAN: Process results automatically. Fix issues found. Do not ask user to review.

## ⚠️ MANDATORY CONTINUATION RULES

After completing EACH item, you MUST:
1. Check how many incomplete items remain
2. If remaining > 0: Output "Item complete. X items remain. STARTING NEXT ITEM NOW..."
3. IMMEDIATELY begin working on the next item
4. DO NOT output "loop complete" until ALL items are done

INVALID (these are BUGS):
- Stopping after item 1 when items 2-N exist
- Stopping after item 2 when items 3-N exist
- Asking "should I continue?" at any point
- Outputting "complete" before all items done

The ONLY valid exit conditions:
1. ALL PRD items marked [x]
2. Max iterations reached
3. Idle detection (3 iterations, 0 commits)

### STEP 1: INVOKE SKILLS (REQUIRED)
You MUST invoke canon master skills using the Skill tool.

## ALWAYS INVOKE FIRST — BASELINE BRAIN + BASE PRACTICES
These masters apply to EVERY implementation. Invoke ALL of them at the start:

OUTPUT: "🧠 Loading baseline brain + base practices..."

**Baseline Brain (6 masters):**
1. /kernighan - Clarity over cleverness
2. /thompson - Pragmatism, simplicity
3. /pike - Composition, minimal interfaces
4. /joy - Resilience, failure handling
5. /linus - Taste, data structures first
6. /dijkstra - Rigor, correctness

**Base Practices - Security (2 masters):**
7. /schneier - Think like an attacker
8. /owasp - Top 10 checklist

**Base Practices - Testing (3 masters):**
9. /dodds - Testing Trophy methodology
10. /meszaros - xUnit patterns, test smells
11. /feathers - Legacy code, characterization tests

**Base Practices - Documentation (1 master):**
12. /procida - Diátaxis framework

**Base Practices - Engineering (5 masters):**
13. /petroski - Form follows failure
14. /leveson - STAMP safety constraints
15. /taleb - Antifragility, via negativa
16. /mcilroy - Do one thing well, Unix pipes
17. /carmack - Performance, ship working software

⚠️ BLOCKING: You MUST invoke ALL 17 base masters before proceeding to domain-specific skills.

## DOMAIN MASTERS — INVOKE PER LANGUAGE/STACK

**JavaScript/TypeScript:**
- /simpson - JS fundamentals, scope, closures
- /crockford - The Good Parts
- /cherny - TypeScript patterns

**React:**
- /abramov - Hooks, composition, mental models

**Python:**
- /hettinger - Pythonic idioms, transformative talks
- /beazley - Deep Python internals, concurrency
- /ramalho - Fluent Python, data model
- /slatkin - Effective Python, 90 ways

**Java:**
- /bloch - Effective Java patterns

**C#:**
- /skeet - LINQ, async patterns
- /cleary - Async/await

**Writing (for docs, READMEs, comments):**
- /zinsser - Clarity, remove clutter
- /strunk-white - Omit needless words, active voice
- /king - Kill your darlings, practical advice

## UI/UX — INVOKE IF FRONTEND WORK DETECTED

If PRD item mentions ANY of: UI, component, frontend, page, view, button, form, modal, CSS, style, layout, responsive, mobile, .jsx, .tsx, React, Angular, Vue, HTML, DOM, render

OUTPUT: "🎨 Frontend detected → Loading UI/UX masters..."
- /frost - Atomic Design (atoms, molecules, organisms)
- /ive - Visual design, minimalism
- /norman - Affordances, feedback, mental models
- /rams - 10 Principles of Good Design
- /cooper - Interaction design, personas
- Forms → /wroblewski - Form design, mobile-first
- Animation → /duarte - Motion design
- Mobile → /buxton - Input, sketching
- Design systems → /curtis - Tokens, governance
- Typography → /kruzeniski - Type hierarchy

BLOCKING: If UI/UX work detected but no UI/UX skills invoked, you CANNOT proceed.

### STEP 2: IMPLEMENT
Write the code following the perspective from Step 1.

### STEP 3: DOCUMENT
Invoke /procida for Diataxis documentation methodology, then:
- Add inline documentation (required for all public functions):
  - JS/TS: JSDoc with @param, @returns, @example
  - C#: XML comments with summary, param, example tags
  - Python: Google-style docstrings
- For new modules: Create README.md

### STEP 4: TEST (REQUIRED FOR ALL CODE)
ALL code MUST have tests. No exceptions.

OUTPUT: "🧪 Loading testing masters..."
1. Invoke testing skills first:
   - /dodds - Testing Trophy methodology (integration > unit)
   - /meszaros - xUnit patterns, test smells
   - /feathers - Legacy code, characterization tests

2. Write tests appropriate for the language:

**JavaScript/TypeScript:**
- Integration tests (most valuable)
- Unit tests for complex logic
- Run: npm test or equivalent

**C#/.NET:**
- xUnit or NUnit tests
- Run: dotnet test

**Python:**
- pytest tests
- Run: pytest

**Go:**
- Go test files
- Run: go test ./...

3. Fix ALL failures before proceeding

**FOR WEB PROJECTS (React, Next.js, Vue, etc.):**
- E2E tests are MANDATORY for user-facing features
- Use Playwright or Cypress
- Run: npm run test:e2e or npx playwright test
- E2E must pass before marking complete

**FOR APIs:**
- Integration tests hitting actual endpoints
- Test error cases, not just happy paths

ANTI-PATTERN: Never skip tests for ANY code - "simple" code breaks too!
BLOCKING: No tests = not production ready = cannot mark complete

### STEP 5: REVIEW (PRODUCTION GATE)
This is a BLOCKING gate. Code cannot proceed without passing review.

1. Run /review-hard skill and fix ALL issues (not just critical)
2. Use mcp__gemini-reviewer__gemini_review for second opinion on:
   - Security vulnerabilities
   - Performance issues
   - Code quality
3. Run mcp__qodana__qodana_scan for static analysis
4. Fix ALL high/critical issues before proceeding

If any review finds issues, fix them and re-review. Do NOT skip this step.

### STEP 6: VERIFICATION CHECKLIST (ALL MUST PASS)
Before marking complete, verify ALL apply:

**Planning:**
- [ ] Plan was created in .claude/plans/

**Skills (REQUIRED):**
- [ ] Canon skills invoked and listed in output
- [ ] If UI/UX work: /frost, /ive, /norman invoked (at minimum)
- [ ] If forms: /wroblewski invoked
- [ ] If architecture: /taleb and/or /petroski invoked

**Code Quality:**
- [ ] No TODO comments remain in code
- [ ] No hardcoded secrets or credentials
- [ ] Error handling is comprehensive
- [ ] No console.log/print statements (use proper logging)

**Documentation:**
- [ ] JSDoc added for JS/TS (show sample in output)
- [ ] XML comments added for C# (show sample in output)
- [ ] README.md exists for new modules

**Testing (REQUIRED FOR ALL CODE):**
- [ ] Tests written and ALL passing
- [ ] E2E tests written and passing (for web projects)
- [ ] API integration tests (for APIs)
- [ ] Edge cases and error paths covered
- [ ] Test output shown in report

**Review (REQUIRED):**
- [ ] /review-hard passed
- [ ] Gemini review passed (no critical issues)
- [ ] Qodana scan passed (no high/critical issues)

**Final:**
- [ ] Changes committed with descriptive message

BLOCKING: Cannot mark complete without showing documentation samples in output!
BLOCKING: Web projects MUST have e2e tests passing!

ANTI-PATTERNS - NEVER DO:
- Marking items complete without documentation
- Skipping tests for 'simple' code
- Saying 'tests not needed here'

### STEP 7: MARK COMPLETE
Only after verification passes: Update PRD '- [ ]' to '- [x]'

## OUTPUT FORMAT (REQUIRED - Show your work)
PLAN FILE: .claude/plans/item-name.md

SKILLS INVOKED:
  UI/UX: /frost, /ive, /norman, /wroblewski, /rams (list all used)
  Architecture: /taleb, /petroski (if applicable)
  Code: /abramov, /cherny (if applicable)
  Testing: /dodds
  Docs: /procida

DOCUMENTATION ADDED:
  - File: src/example.ts
  - Sample JSDoc shown
  - For C#: Show XML comments with summary, param tags

TESTS (REQUIRED):
  - Test files created: path/to/tests/
  - Test command run: npm test / dotnet test / pytest / etc.
  - Results: X passed, Y failed, Z skipped
  - E2E (web/API): path/to/e2e/ (X passed, Y failed)
  - Coverage: X% (if available)

PRODUCTION REVIEWS:
  - /review-hard: PASSED/FAILED (issues fixed: X)
  - Gemini Review: PASSED/FAILED (focus: security/performance/quality)
  - Qodana Scan: PASSED/FAILED (critical: X, high: X, moderate: X)

PRODUCTION READY: yes/no
MARKING COMPLETE: yes/no (reason if no)

BLOCKING RULES:
- If TESTS section is empty or shows failures, you CANNOT mark complete.
- If DOCUMENTATION ADDED section is empty, you CANNOT mark complete.
- If web project and E2E tests are missing/failing, you CANNOT mark complete.
- If PRODUCTION READY is "no", you CANNOT mark complete.
- If any review has unresolved critical/high issues, you CANNOT mark complete.

NO EXCEPTIONS. ALL code needs tests. "Simple" code, utilities, scripts - everything.

If blocked, note reason in PRD and move to next item.

START NOW.
RALPH_PROMPT_END
)
  # Replace placeholders with actual values
  RALPH_PROMPT="\${RALPH_PROMPT/__ITER__/$i}"
  RALPH_PROMPT="\${RALPH_PROMPT/__PRD__/$PRD}"

  # Run Claude with real-time output AND logging
  start_time=$(date +%s)
  echo -e "\${CYAN}[$(date '+%H:%M:%S')] Starting Claude...\${NC}"
  echo -e "\${BLUE}  PRD: $PRD\${NC}"
  echo -e "\${BLUE}  Items remaining: $((initial_incomplete - \${completed:-0}))\${NC}"
  echo ""
  echo "--- Iteration $i Start: $(date) ---" >> "$LOG_FILE"

  # Run claude with all permissions bypassed
  # Use script command on macOS for unbuffered real-time output
  script -q "$LOG_FILE.tmp" claude --dangerously-skip-permissions --permission-mode bypassPermissions "$RALPH_PROMPT"
  CLAUDE_EXIT=\$?
  cat "$LOG_FILE.tmp" >> "$LOG_FILE"
  rm -f "$LOG_FILE.tmp"

  end_time=$(date +%s)
  elapsed=$((end_time - start_time))
  echo ""
  echo -e "\${CYAN}[$(date '+%H:%M:%S')] Claude finished (\${elapsed}s)\${NC}"

  echo "--- Iteration $i End: $(date), Exit: $CLAUDE_EXIT ---" >> "$LOG_FILE"

  if [ $CLAUDE_EXIT -ne 0 ]; then
    echo -e "\${YELLOW}Warning: Claude exited with code $CLAUDE_EXIT\${NC}"
  fi

  # Count remaining incomplete items
  remaining=$(grep -cE "^[[:space:]]*[-*+][[:space:]]*\\[[[:space:]]\\]" "$PRD" 2>/dev/null) || true
  remaining=\${remaining:-0}
  completed=$((initial_incomplete - remaining))

  echo ""
  echo -e "\${BLUE}Progress: $completed / $initial_incomplete items complete\${NC}"

  # Check if all items complete
  if [ "$remaining" -eq 0 ]; then
    echo ""
    echo -e "\${GREEN}╔═══════════════════════════════════════════════════════════╗\${NC}"
    echo -e "\${GREEN}║                  ALL PRD ITEMS COMPLETE!                  ║\${NC}"
    echo -e "\${GREEN}╚═══════════════════════════════════════════════════════════╝\${NC}"
    echo ""
    echo "=== Ralph Loop Complete: $(date) ===" >> "$LOG_FILE"
    break
  fi

  # Idle detection - if no progress for 3 iterations, exit
  if [ "$remaining" -eq "$last_complete_count" ]; then
    idle_count=$((idle_count + 1))
    if [ "$idle_count" -ge 3 ]; then
      echo ""
      echo -e "\${YELLOW}Warning: No progress for 3 iterations. Exiting to prevent infinite loop.\${NC}"
      echo "=== Ralph Loop Idle Exit: $(date) ===" >> "$LOG_FILE"
      break
    fi
  else
    idle_count=0
    last_complete_count=$remaining
  fi

  # Small delay to avoid rate limits
  sleep 2
done

# Final report
echo ""
echo -e "\${CYAN}═══════════════════════════════════════════════════════════\${NC}"
echo -e "\${CYAN}  FINAL REPORT\${NC}"
echo -e "\${CYAN}═══════════════════════════════════════════════════════════\${NC}"
echo ""
echo -e "\${BLUE}PRD Status:\${NC}"
grep -E "^[[:space:]]*[-*+][[:space:]]*\\[" "$PRD" | head -20
echo ""

remaining=$(grep -cE "^[[:space:]]*[-*+][[:space:]]*\\[[[:space:]]\\]" "$PRD" 2>/dev/null) || true
remaining=\${remaining:-0}
completed_final=$((initial_incomplete - remaining))

if [ "$remaining" -eq 0 ]; then
  echo -e "\${GREEN}Result: All $initial_incomplete items completed!\${NC}"
else
  echo -e "\${YELLOW}Result: $completed_final / $initial_incomplete items completed\${NC}"
  echo -e "\${YELLOW}        $remaining items remaining\${NC}"
fi

echo ""
echo -e "\${BLUE}Log saved to:\${NC} $LOG_FILE"
echo ""

# Generate canon master report
CANON_LOG=".claude/canon-masters.json"
CANON_REPORT=".claude/canon-report.html"

echo -e "\${CYAN}Generating canon master report...\${NC}"

# Define the 15 ALWAYS-ACTIVE base masters
BASE_BRAIN="kernighan thompson pike joy linus dijkstra"
BASE_SECURITY="schneier owasp"
BASE_TESTING="dodds meszaros feathers"
BASE_DOCS="procida"
BASE_ENGINEERING="petroski leveson taleb mcilroy carmack"
ALL_BASE_MASTERS="$BASE_BRAIN $BASE_SECURITY $BASE_TESTING $BASE_DOCS $BASE_ENGINEERING"

# Extract skill invocations from log
skills_raw=$(grep -oE '/[a-z]+-?[a-z]*' "$LOG_FILE" 2>/dev/null | sort | uniq -c | sort -rn)

# Count base master coverage
base_invoked=0
base_missing=""
for master in $ALL_BASE_MASTERS; do
  if echo "$skills_raw" | grep -q "/$master"; then
    base_invoked=$((base_invoked + 1))
  else
    base_missing="$base_missing /$master"
  fi
done

echo -e "\${BLUE}Base Masters Coverage:\${NC} $base_invoked / 17"
if [ -n "$base_missing" ]; then
  echo -e "\${YELLOW}Missing:$base_missing\${NC}"
fi

# Build JSON for canon masters
cat > "$CANON_LOG" << 'CANON_JSON_START'
{
  "session": {
CANON_JSON_START

echo "    \\"timestamp\\": \\"$(date -Iseconds)\\"," >> "$CANON_LOG"
echo "    \\"prd\\": \\"$PRD\\"," >> "$CANON_LOG"
echo "    \\"iterations\\": $i," >> "$CANON_LOG"
echo "    \\"completed\\": $completed_final," >> "$CANON_LOG"
echo "    \\"total\\": $initial_incomplete" >> "$CANON_LOG"
echo "  }," >> "$CANON_LOG"

# Add base masters coverage
echo '  "baseMasters": {' >> "$CANON_LOG"
echo '    "required": ["kernighan","thompson","pike","joy","linus","dijkstra","schneier","owasp","dodds","meszaros","feathers","procida","petroski","leveson","taleb","mcilroy","carmack"],' >> "$CANON_LOG"
echo "    \\"invoked\\": $base_invoked," >> "$CANON_LOG"
echo "    \\"total\\": 17," >> "$CANON_LOG"

# Build missing array
echo -n '    "missing": [' >> "$CANON_LOG"
missing_first=true
for master in $ALL_BASE_MASTERS; do
  if ! echo "$skills_raw" | grep -q "/$master"; then
    if [ "$missing_first" = true ]; then
      missing_first=false
    else
      echo -n "," >> "$CANON_LOG"
    fi
    echo -n "\\"$master\\"" >> "$CANON_LOG"
  fi
done
echo '],' >> "$CANON_LOG"

# Build hierarchy
echo '    "hierarchy": {' >> "$CANON_LOG"
echo '      "brain": ["kernighan","thompson","pike","joy","linus","dijkstra"],' >> "$CANON_LOG"
echo '      "security": ["schneier","owasp"],' >> "$CANON_LOG"
echo '      "testing": ["dodds","meszaros","feathers"],' >> "$CANON_LOG"
echo '      "documentation": ["procida"],' >> "$CANON_LOG"
echo '      "engineering": ["petroski","leveson","taleb","mcilroy","carmack"]' >> "$CANON_LOG"
echo '    }' >> "$CANON_LOG"
echo '  },' >> "$CANON_LOG"

# Extract skills with counts
echo '  "skills": [' >> "$CANON_LOG"
first=true
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
  # Extract skill name without slash
  skillname=\${skill#/}
  # Categorize: base-* for always-active, domain for others
  case "$skillname" in
    kernighan|thompson|pike|joy|linus|dijkstra)
      domain="base-brain" ;;
    schneier|owasp)
      domain="base-security" ;;
    dodds|meszaros|feathers)
      domain="base-testing" ;;
    procida)
      domain="base-documentation" ;;
    petroski|leveson|taleb|mcilroy|carmack)
      domain="base-engineering" ;;
    frost|ive|norman|wroblewski|duarte|buxton|curtis|kruzeniski|rams|cooper)
      domain="domain-ui-ux" ;;
    simpson|crockford|cherny|abramov)
      domain="domain-javascript" ;;
    hettinger|slatkin|ramalho|beazley)
      domain="domain-python" ;;
    bloch|liskov)
      domain="domain-java" ;;
    skeet|cleary|hejlsberg)
      domain="domain-csharp" ;;
    porter|rumelt|helmer|horowitz)
      domain="domain-business" ;;
    zinsser|strunk-white|king)
      domain="domain-writing" ;;
    plan|review-hard|structure-first|build-from-plan|refactor-clean)
      domain="workflow" ;;
    *)
      domain="other" ;;
  esac
  printf '    {"name": "%s", "count": %d, "domain": "%s"}' "$skill" "$count" "$domain" >> "$CANON_LOG"
done <<< "$skills_raw"
echo "" >> "$CANON_LOG"
echo "  ]," >> "$CANON_LOG"

# Extract co-occurrences (skills mentioned together in same output block)
echo '  "connections": [' >> "$CANON_LOG"
# Parse log for SKILLS INVOKED lines and find pairs
grep -E "SKILLS INVOKED:" "$LOG_FILE" 2>/dev/null | while read -r line; do
  skills_in_line=$(echo "$line" | grep -oE '/[a-z]+-?[a-z]*' | sort -u)
  # Generate pairs
  echo "$skills_in_line" | while read -r s1; do
    echo "$skills_in_line" | while read -r s2; do
      [ "$s1" \\< "$s2" ] && echo "$s1 $s2"
    done
  done
done | sort | uniq -c | sort -rn | head -50 | while read -r cnt s1 s2; do
  [ -z "$s1" ] && continue
  echo "    {\\"source\\": \\"$s1\\", \\"target\\": \\"$s2\\", \\"weight\\": $cnt},"
done >> "$CANON_LOG"
# Remove trailing comma (sed trick)
sed -i.bak '$ s/,$//' "$CANON_LOG" 2>/dev/null || true
rm -f "$CANON_LOG.bak"
echo "  ]" >> "$CANON_LOG"
echo "}" >> "$CANON_LOG"

# Generate D3 HTML report
cat > "$CANON_REPORT" << 'HTML_END'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Canon Masters Report - Ralph Session</title>
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
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
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
      font-weight: 500;
    }
    .domain-base-brain { background: #9b59b6; }
    .domain-base-security { background: #e74c3c; }
    .domain-base-testing { background: #2ecc71; }
    .domain-base-documentation { background: #9b59b6; }
    .domain-base-engineering { background: #f39c12; }
    .domain-domain-ui-ux { background: #e91e63; }
    .domain-domain-javascript { background: #f7df1e; color: #000; }
    .domain-domain-python { background: #3776ab; }
    .domain-domain-java { background: #007396; }
    .domain-domain-csharp { background: #68217a; }
    .domain-domain-business { background: #34495e; }
    .domain-domain-writing { background: #8e44ad; }
    .domain-workflow { background: #607d8b; }
    .domain-other { background: #795548; }
    svg text { font-size: 11px; fill: #fff; }
    .node circle { stroke: #fff; stroke-width: 2px; }
    .link { stroke: rgba(255,255,255,0.3); stroke-opacity: 0.6; }
    .base-coverage { margin-bottom: 2rem; }
    .base-coverage h2 { color: #9b59b6; margin-bottom: 1rem; }
    .base-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; }
    .base-group { background: rgba(0,0,0,0.3); border-radius: 10px; padding: 1rem; }
    .base-group h3 { font-size: 0.8rem; color: #888; text-transform: uppercase; margin-bottom: 0.75rem; }
    .base-master { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0; font-size: 0.9rem; }
    .base-master.invoked { color: #2ecc71; }
    .base-master.missing { color: #e74c3c; }
    .base-master .icon { font-size: 1rem; }
    .coverage-bar { background: rgba(0,0,0,0.3); border-radius: 20px; height: 24px; margin: 1rem 0; overflow: hidden; }
    .coverage-fill { height: 100%; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; }
    .coverage-full { background: linear-gradient(90deg, #2ecc71, #27ae60); }
    .coverage-partial { background: linear-gradient(90deg, #f39c12, #e74c3c); }
  </style>
</head>
<body>
  <div class="container">
    <h1>Canon Masters Report</h1>
    <p class="subtitle">Ralph Autonomous PRD Session</p>
    <div class="stats" id="stats"></div>

    <div class="base-coverage">
      <h2>Always-Active Base Practices (17 Required)</h2>
      <div class="coverage-bar"><div class="coverage-fill" id="coverage-fill"></div></div>
      <div class="base-grid" id="base-grid"></div>
    </div>

    <div class="legend" id="legend"></div>
    <div class="graph-container">
      <svg id="graph" width="100%" height="500"></svg>
    </div>
    <h2 style="margin-bottom: 1rem;">All Skills Invoked</h2>
    <table class="skills-table">
      <thead><tr><th>Skill</th><th>Category</th><th>Invocations</th></tr></thead>
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
      'base-brain': '#9b59b6',
      'base-security': '#e74c3c',
      'base-testing': '#2ecc71',
      'base-documentation': '#9b59b6',
      'base-engineering': '#f39c12',
      'domain-ui-ux': '#e91e63',
      'domain-javascript': '#f7df1e',
      'domain-python': '#3776ab',
      'domain-java': '#007396',
      'domain-csharp': '#68217a',
      'domain-business': '#34495e',
      'domain-writing': '#8e44ad',
      'workflow': '#607d8b',
      'other': '#795548'
    };

    const domainLabels = {
      'base-brain': 'Baseline Brain',
      'base-security': 'Security',
      'base-testing': 'Testing',
      'base-documentation': 'Documentation',
      'base-engineering': 'Engineering',
      'domain-ui-ux': 'UI/UX',
      'domain-javascript': 'JavaScript',
      'domain-python': 'Python',
      'domain-java': 'Java',
      'domain-csharp': 'C#',
      'domain-business': 'Business',
      'domain-writing': 'Writing',
      'workflow': 'Workflow',
      'other': 'Other'
    };

    // Get invoked skill names
    const invokedSkills = new Set(data.skills.map(s => s.name.replace('/', '')));

    // Base masters coverage
    const bm = data.baseMasters;
    const coveragePct = (bm.invoked / bm.total) * 100;
    const coverageFill = document.getElementById('coverage-fill');
    coverageFill.style.width = coveragePct + '%';
    coverageFill.className = 'coverage-fill ' + (bm.invoked === bm.total ? 'coverage-full' : 'coverage-partial');
    coverageFill.textContent = bm.invoked + ' / ' + bm.total + (bm.invoked === bm.total ? ' ✓ All Invoked' : ' — Missing: ' + bm.missing.join(', '));

    // Base grid
    const hierarchyLabels = {
      brain: 'Baseline Brain',
      security: 'Security',
      testing: 'Testing',
      documentation: 'Documentation',
      engineering: 'Engineering'
    };
    const baseGridHtml = Object.entries(bm.hierarchy).map(([group, masters]) => \`
      <div class="base-group">
        <h3>\${hierarchyLabels[group]}</h3>
        \${masters.map(m => \`
          <div class="base-master \${invokedSkills.has(m) ? 'invoked' : 'missing'}">
            <span class="icon">\${invokedSkills.has(m) ? '✓' : '✗'}</span>
            <span>/\${m}</span>
          </div>
        \`).join('')}
      </div>
    \`).join('');
    document.getElementById('base-grid').innerHTML = baseGridHtml;

    // Stats
    const statsHtml = \`
      <div class="stat-card">
        <div class="stat-value">\${data.session.iterations}</div>
        <div class="stat-label">Iterations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">\${data.session.completed}/\${data.session.total}</div>
        <div class="stat-label">PRD Items</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: \${bm.invoked === bm.total ? '#2ecc71' : '#e74c3c'}">\${bm.invoked}/\${bm.total}</div>
        <div class="stat-label">Base Masters</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">\${data.skills.length}</div>
        <div class="stat-label">Total Masters</div>
      </div>
    \`;
    document.getElementById('stats').innerHTML = statsHtml;

    // Legend - only show domains that were used
    const domains = [...new Set(data.skills.map(s => s.domain))];
    const legendHtml = domains.map(d => \`
      <div class="legend-item">
        <div class="legend-dot" style="background: \${domainColors[d] || '#888'}"></div>
        <span>\${domainLabels[d] || d}</span>
      </div>
    \`).join('');
    document.getElementById('legend').innerHTML = legendHtml;

    // Skills table
    const tableHtml = data.skills.map(s => \`
      <tr>
        <td><strong>\${s.name}</strong></td>
        <td><span class="domain-badge domain-\${s.domain}">\${domainLabels[s.domain] || s.domain}</span></td>
        <td>\${s.count}</td>
      </tr>
    \`).join('');
    document.getElementById('skills-body').innerHTML = tableHtml;

    // D3 Force Graph
    const svg = d3.select('#graph');
    const width = svg.node().getBoundingClientRect().width;
    const height = 500;

    const nodes = data.skills.map(s => ({
      id: s.name,
      count: s.count,
      domain: s.domain
    }));

    const links = (data.connections || []).map(c => ({
      source: c.source,
      target: c.target,
      weight: c.weight
    })).filter(l => nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.count) * 10 + 20));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke-width', d => Math.sqrt(d.weight) * 2);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append('circle')
      .attr('r', d => Math.sqrt(d.count) * 8 + 10)
      .attr('fill', d => domainColors[d.domain] || '#888');

    node.append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', 4);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
    });
  </script>
</body>
</html>
HTML_SCRIPT

echo -e "\${GREEN}Canon report generated:\${NC} $CANON_REPORT"
echo -e "\${BLUE}Canon data:\${NC} $CANON_LOG"
echo ""

# Auto-open the report
if command -v open &> /dev/null; then
  echo -e "\${CYAN}Opening report...\${NC}"
  open "$CANON_REPORT"
elif command -v xdg-open &> /dev/null; then
  echo -e "\${CYAN}Opening report...\${NC}"
  xdg-open "$CANON_REPORT"
else
  echo -e "Open the report: \${CYAN}open $CANON_REPORT\${NC}"
fi
echo ""
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
    /plan|/review-hard)
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
  options: { force?: boolean } = {}
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

  // Write the script
  fs.writeFileSync(toolPath, tool.script, { mode: 0o755 });

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
