# CLI Test Scenarios

End-to-end test scenarios for lens and ralph.

---

## CC-CONFIG: Profile Management

### Profile List
- [ ] `lens profile list` shows all available profiles
- [ ] Profiles grouped by type (software, business, etc.)
- [ ] Shows skill count for each profile
- [ ] Composable profiles marked appropriately

### Profile Show
- [ ] `lens profile show javascript` displays profile details
- [ ] Shows skills by category (canon, tech, security)
- [ ] Shows ralph stage-specific skills
- [ ] Shows claudeMd standards and antiPatterns
- [ ] Shows auto-invoke rules
- [ ] `lens profile show nonexistent` shows helpful error

### Profile Apply
- [ ] `lens profile apply javascript -p /path` creates .claude directory
- [ ] Copies canon skills to .claude/skills/
- [ ] Generates .claude/ralph-config.yaml with stage skills
- [ ] Updates/creates CLAUDE.md with profile info
- [ ] Adds auto-invoke rules to CLAUDE.md
- [ ] `lens profile apply javascript+react -p /path` combines profiles
- [ ] Combined profile merges skills (no duplicates)
- [ ] Combined profile merges ralph stage skills
- [ ] `lens profile apply javascript+security-hardened+ralph-integration` three-way combine works
- [ ] Re-applying profile with --force overwrites existing
- [ ] Without --force, skips existing skills

### Profile Composition
- [ ] Child profile overrides parent for conflicting settings
- [ ] Skills arrays merge (not replace)
- [ ] Ralph skills merge per stage
- [ ] claudeMd.standards merge
- [ ] claudeMd.antiPatterns merge
- [ ] claudeMd.autoInvoke merge

---

## CC-CONFIG: Canon Skills

### Canon List
- [ ] `lens canon list` shows all available skills
- [ ] Skills organized by category (javascript, security, testing, etc.)
- [ ] Shows source path for each skill

### Canon Copy
- [ ] `lens canon copy react-state -p /path` copies skill to project
- [ ] Creates .claude/skills/react-state/ directory structure
- [ ] Copies SKILL.md and SUMMARY.md
- [ ] Updates canon manifest with hash and timestamp
- [ ] `lens canon copy nonexistent` shows error
- [ ] Without --force, skips existing skill
- [ ] With --force, overwrites existing skill

### Canon Status
- [ ] `lens canon status -p /path` shows installed skills
- [ ] Identifies current/outdated/modified skills
- [ ] Shows source commit vs installed commit
- [ ] Handles missing source gracefully

### Canon Upgrade
- [ ] `lens canon upgrade -p /path` updates outdated skills
- [ ] Skips locally modified skills (without --force)
- [ ] With --force, overwrites modified skills
- [ ] Updates manifest after upgrade
- [ ] `lens canon upgrade react-state -p /path` upgrades specific skill

### Canon Verify
- [ ] `lens canon verify -p /path` compares installed vs source
- [ ] Reports matches, differences, missing, extra
- [ ] Returns non-zero exit code if differences found

### Canon Deploy All
- [ ] `lens canon deploy -p /path` copies all canon skills
- [ ] Respects --force flag
- [ ] Reports count of deployed/skipped/errors

---

## CC-CONFIG: Context Analysis

### Context Check
- [ ] `lens context -p /path` analyzes token usage
- [ ] Shows breakdown by scope (project, user, skill, memory)
- [ ] Shows top consumers
- [ ] Calculates total tokens
- [ ] Warns when approaching context limits

### Context Detail
- [ ] `lens context --detail -p /path` shows per-file breakdown
- [ ] Lists each skill with token count
- [ ] Shows percentage of total

---

## RALPH: Basic Operation

### Startup
- [ ] `ralph PRD.md` requires .claude/ralph-config.yaml
- [ ] Shows helpful error if config missing
- [ ] Displays project type detection (TypeScript, Python, etc.)
- [ ] Shows "Skills: from profile" indicator
- [ ] Counts incomplete PRD items correctly

### PRD Parsing
- [ ] Recognizes `- [ ]` as incomplete item
- [ ] Recognizes `- [x]` as complete item
- [ ] Handles `* [ ]` bullet style
- [ ] Handles indented items
- [ ] Extracts item text correctly (strips checkbox)

### Item Completion
- [ ] Marks item `[x]` after all stages complete
- [ ] Decrements remaining count correctly
- [ ] Stops when all items complete
- [ ] Shows "All items complete!" message

---

## RALPH: Stage Execution

### Plan Stage
- [ ] Loads plan skills from ralph-config.yaml
- [ ] Displays canon skills in header
- [ ] Creates .claude/plans/{item-slug}.md
- [ ] Plan includes Approach, Files to Change, Security, Tests
- [ ] Outputs PLAN_COMPLETE on success
- [ ] Outputs PLAN_FAILED with reason on failure

### Build Stage
- [ ] Loads build skills from ralph-config.yaml
- [ ] Reads plan file from previous stage
- [ ] Implements file changes per plan
- [ ] Runs tests after implementation
- [ ] Commits changes with descriptive message
- [ ] Outputs BUILD_COMPLETE with test status
- [ ] Outputs BUILD_FAILED with reason on failure

### Clean Stage
- [ ] Loads clean skills from ralph-config.yaml
- [ ] Gets changed files from git diff
- [ ] Applies structural improvements
- [ ] Commits improvements separately
- [ ] Outputs CLEAN_COMPLETE with metrics
- [ ] Outputs CLEAN_SKIPPED if nothing to clean

### Test Stage
- [ ] Loads test skills from ralph-config.yaml
- [ ] Runs project test command (npm test, pytest, etc.)
- [ ] Fixes failing tests
- [ ] Re-runs until green
- [ ] Outputs TEST_COMPLETE with pass/total counts
- [ ] Outputs TEST_FAILED if stuck

### Review Stage (Gemini)
- [ ] Loads review skills from ralph-config.yaml
- [ ] Calls gemini_review MCP tool for each changed file
- [ ] Uses focus="security" for adversarial review
- [ ] Counts all Gemini issues (doesn't dismiss)
- [ ] Fixes Critical/High issues
- [ ] Re-verifies after fixes
- [ ] Outputs GEMINI_ISSUES, CRITICAL_HIGH, ISSUES_FIXED
- [ ] Outputs VERIFIED_CLEAN yes/no
- [ ] Parses markdown-formatted output (**GEMINI_ISSUES:**)

### Review Stage (Qodana)
- [ ] Runs `qodana scan` in Docker
- [ ] Uses baseline file if exists
- [ ] Parses SARIF output for issues
- [ ] Displays critical and warning counts
- [ ] Shows issue list (file:line - ruleId)
- [ ] Fixes critical issues
- [ ] Re-runs Qodana to verify
- [ ] Reports fixed count and remaining issues

### Doc Stage
- [ ] Loads doc skills from ralph-config.yaml
- [ ] Adds JSDoc/docstrings to exported functions
- [ ] Creates/updates docs/CHANGELOG.md
- [ ] Updates README.md with usage
- [ ] Commits documentation changes
- [ ] Outputs DOC_COMPLETE with metrics
- [ ] Outputs DOC_SKIPPED if no code files changed

---

## RALPH: Skill Loading

### Profile Skills
- [ ] Reads skills from .claude/ralph-config.yaml
- [ ] Loads different skills per stage
- [ ] Merges base profile skills with tech profile skills
- [ ] Skills displayed in stage header

### Dynamic Skill Detection
- [ ] Detects UI keywords → adds components, visual, usability, etc.
- [ ] Detects API keywords → adds java
- [ ] Detects security keywords → adds security-mindset, owasp, appsec, web-security
- [ ] Detects database keywords → adds security skills for review
- [ ] Detects testing keywords → adds test-doubles, test-strategy
- [ ] Detects performance keywords → adds optimization, algorithms
- [ ] Detects CLI keywords → adds composition, simplicity, clarity
- [ ] Dynamic skills merge with profile skills (no duplicates)

### Skill Content Loading
- [ ] Loads SKILL.md from .claude/skills/{name}/
- [ ] Falls back to embedded content if file missing
- [ ] Extracts condensed guidance from skill file
- [ ] Builds combined guidance for stage prompt

---

## RALPH: Quality Gates

### Test Infrastructure
- [ ] Detects missing test infrastructure before main loop
- [ ] Runs scaffold stage to set up testing
- [ ] Installs appropriate framework (vitest, jest, pytest)
- [ ] Creates placeholder test file
- [ ] Verifies test command works

### Iteration Limits
- [ ] Respects max_iterations from config
- [ ] Respects max_iterations_per_item from config
- [ ] Exits on idle commits (exit_on_idle_commits)

### Checkpoints
- [ ] Creates checkpoint every 3 items
- [ ] Saves progress to .claude/sessions/progress-{timestamp}.md
- [ ] Commits checkpoint file

---

## RALPH: Resume & Recovery

### Resume Mode
- [ ] `ralph PRD.md --resume` loads latest checkpoint
- [ ] Continues from last incomplete item
- [ ] Preserves session context

### Skip Scan
- [ ] `ralph PRD.md --skip-scan` skips Qodana
- [ ] Shows "Code scan skipped" message

### Create Baseline
- [ ] `ralph --create-baseline` runs Qodana scan
- [ ] Creates .qodana/baseline.sarif.json
- [ ] Reports baselined issue count

### Process Cleanup
- [ ] Ctrl+C terminates ralph cleanly
- [ ] Kills spinner process
- [ ] Kills claude process
- [ ] No zombie processes left

---

## RALPH: Output & Display

### Stage Headers
- [ ] Wide section lines (88 chars)
- [ ] Shows stage icon and name
- [ ] Shows "Canon:" with skill list
- [ ] Skills displayed with green checkmarks

### Progress Indicators
- [ ] Spinner while stage running
- [ ] Dots for tool use activity
- [ ] Skill invocation display (⚡ /skill-name)
- [ ] Elapsed time per stage

### Item Summary
- [ ] Item counter shows "X of Y"
- [ ] Session ID displayed
- [ ] Remaining count after completion

### Final Report
- [ ] Shows completion summary
- [ ] Lists PRD item status
- [ ] Shows skills invoked with counts
- [ ] Shows log directory path

---

## Error Handling

### Missing Dependencies
- [ ] Missing yq shows install instructions
- [ ] Missing qodana shows "not installed" (not error)
- [ ] Missing git initializes repo

### Invalid Input
- [ ] Missing PRD file shows error
- [ ] Empty PRD (no incomplete items) shows "All items complete"
- [ ] Invalid profile name shows error with suggestions

### Stage Failures
- [ ] Failed stage shows error message
- [ ] Continues to next item (doesn't crash)
- [ ] Logs failure details to log file

---

## Integration Scenarios

### Fresh Project Setup
1. [ ] Create new directory
2. [ ] Create PRD.md with items
3. [ ] Run `lens profile apply javascript+security-hardened+ralph-integration -p .`
4. [ ] Verify .claude/skills/ populated
5. [ ] Verify .claude/ralph-config.yaml created
6. [ ] Verify CLAUDE.md updated
7. [ ] Run `ralph PRD.md --yes`
8. [ ] All items completed
9. [ ] Tests passing
10. [ ] No critical security issues

### Security-Focused Project
1. [ ] Apply security-hardened profile
2. [ ] PRD has auth/password items
3. [ ] Ralph detects security keywords
4. [ ] Loads security-mindset, owasp, appsec, web-security dynamically
5. [ ] Gemini review runs with security focus
6. [ ] Critical issues fixed before completion

### Multi-Language Project
1. [ ] Apply javascript+python profiles
2. [ ] Skills from both languages available
3. [ ] Appropriate skills loaded per file type

### Resume After Interruption
1. [ ] Start ralph, complete 2 items
2. [ ] Kill process (Ctrl+C)
3. [ ] Run `ralph PRD.md --resume`
4. [ ] Continues from item 3
5. [ ] Completes remaining items
