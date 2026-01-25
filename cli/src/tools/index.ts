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
initial_incomplete=$(grep -cE "^- \\[ \\]" "$PRD" 2>/dev/null || echo "0")
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
  # Explicit about canon masters, testing, and documentation requirements
  # Includes verification checklist that must be completed before marking done
  claude --dangerously-skip-permissions \\
    "RALPH LOOP ITERATION $i - AUTONOMOUS PRD IMPLEMENTATION

Read $PRD and find the NEXT incomplete item (marked with '- [ ]').

## MANDATORY WORKFLOW - EACH STEP REQUIRED

### STEP 1: ANALYZE & INVOKE SKILLS
Determine work type and ACTUALLY INVOKE the skills (use the Skill tool):

**Architecture/System Design:**
- System design, resilience → invoke: /taleb (antifragility, via negativa)
- Learning from failures, refactoring → invoke: /petroski (form follows failure)

**UI/UX Work:**
- UI/Component work → invoke: /frost, /ive, /norman
- Forms → invoke: /wroblewski, /norman
- Animations → invoke: /duarte
- Mobile/responsive → invoke: /wroblewski, /buxton
- Design systems → invoke: /curtis (tokens, governance)
- Typography → invoke: /kruzeniski (type hierarchy)
- Simplicity check → invoke: /rams (10 principles)

**Code Quality:**
- React/JSX → invoke: /abramov
- TypeScript → invoke: /cherny

### STEP 2: IMPLEMENT
Write the code following the perspective from Step 1.

### STEP 3: DOCUMENT
Invoke /procida for Diátaxis documentation methodology, then:
- Add inline documentation (required for all public functions):
  - JS/TS: JSDoc with @param, @returns, @example
  - C#: XML comments with <summary>, <param>, <example>
  - Python: Google-style docstrings
- For new modules: Create README.md

### STEP 4: TEST (REQUIRED FOR JS/TS CODE)
For JavaScript/TypeScript code, you MUST:
1. Invoke /dodds skill first (Testing Trophy methodology)
2. Write actual test files following Testing Trophy:
   - Integration tests (most valuable)
   - Unit tests for complex logic
3. Run the tests with npm test or equivalent
4. Fix any failures before proceeding

**FOR WEB PROJECTS (React, Next.js, Vue, etc.):**
- E2E tests are MANDATORY for user-facing features
- Use Playwright or Cypress
- Run e2e tests: npm run test:e2e or npx playwright test
- E2E must pass before marking complete

ANTI-PATTERN: Never skip tests for 'simple' code - simple code breaks too!

### STEP 5: REVIEW
Run /review-hard and fix any critical issues.

### STEP 6: VERIFICATION CHECKLIST (ALL MUST PASS)
Before marking complete, verify ALL apply:
- [ ] Appropriate canon skills were invoked (list them in output)
- [ ] JSDoc added for JS/TS (show sample in output)
- [ ] XML comments added for C# (show sample in output)
- [ ] README.md exists for new modules
- [ ] Tests written and passing (for JS/TS code)
- [ ] E2E tests written and passing (for web projects)
- [ ] Review passed with no critical issues
- [ ] Changes committed

BLOCKING: Cannot mark complete without showing documentation samples in output!
BLOCKING: Web projects MUST have e2e tests passing!

ANTI-PATTERNS - NEVER DO:
- Marking items complete without documentation
- Skipping tests for 'simple' code
- Saying 'tests not needed here'

### STEP 7: MARK COMPLETE
Only after verification passes: Update PRD '- [ ]' to '- [x]'

## OUTPUT FORMAT (REQUIRED - Show your work)
\`\`\`
SKILLS INVOKED: /frost, /dodds, /procida, ...
DOCUMENTATION ADDED:
  - File: src/example.ts
  - Sample JSDoc:
    /**
     * @param x - description
     * @returns description
     */
  (For C#: Show XML /// comments with <summary>, <param>)
TESTS WRITTEN: path/to/test.ts
TEST RESULT: X passed, Y failed
E2E TESTS (web projects): path/to/e2e/test.spec.ts
E2E RESULT: X passed, Y failed (or N/A if not web project)
REVIEW: passed/issues found
MARKING COMPLETE: yes/no (reason if no)
\`\`\`

If DOCUMENTATION ADDED section is empty, you CANNOT mark complete.
If web project and E2E RESULT shows failures or missing, you CANNOT mark complete.

If blocked, note reason in PRD and move to next item.

START NOW." \\
    2>&1 | tee -a "$LOG_FILE"

  # Count remaining incomplete items
  remaining=$(grep -cE "^- \\[ \\]" "$PRD" 2>/dev/null || echo "0")
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
grep -E "^- \\[" "$PRD" | head -20
echo ""

remaining=$(grep -cE "^- \\[ \\]" "$PRD" 2>/dev/null || echo "0")
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
`;

/**
 * List of available tools with their metadata
 */
const AVAILABLE_TOOLS: Record<string, { description: string; script: string }> = {
  ralph: {
    description: 'Autonomous PRD implementation loop - wraps Claude Code for continuous development',
    script: RALPH_SCRIPT
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
