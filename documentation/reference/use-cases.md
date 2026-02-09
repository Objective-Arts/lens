# Use Cases

Complete catalog of what Lens does, with the actual code that implements each capability.

---

## 1. Apply a Profile to a Project

Configure a project for a tech stack by composing profiles. Profiles bundle skills, commands, auto-invoke rules, and standards.

```bash
lens profile apply typescript-cli -p /path/to/project
lens profile apply javascript+react+security -p /path/to/project
```

### Profile Composition

The `+` syntax combines multiple profiles. Each is loaded from YAML files in `profiles/`, then merged:

```typescript
// src/profiles/combiner.ts

export function parseProfileString(profileString: string): string[] {
  return profileString.split('+').map(s => s.trim()).filter(Boolean);
}

export function combineProfiles(profileNames: string[]): ComposableProfile | null {
  const profiles = profileNames
    .map(name => getProfile(name))
    .filter((p): p is ComposableProfile => p !== null);

  if (profiles.length === 0) return null;
  if (profiles.length === 1) return profiles[0];

  const combined = createEmptyCombined(profileNames);

  for (const profile of profiles) {
    mergeSkillsInto(combined, profile.skills);
    if (profile.agents) combined.agents = mergeArrays(combined.agents ?? [], profile.agents);
    if (profile.commands) combined.commands = mergeArrays(combined.commands ?? [], profile.commands);
    mergeClaudeMdInto(combined, profile.claudeMd);
    mergeMcpServersInto(combined, profile.mcpServers);
    if (profile.ralph) combined.ralph = mergeRalphSkills(combined.ralph, profile.ralph);
    if (profile.hooks) combined.hooks = mergeHooks(combined.hooks, profile.hooks);
  }

  return combined;
}
```

### Profile Application

Once merged, the profile is applied to the project directory. This creates the `.claude/` structure, deploys skills, writes CLAUDE.md, and configures MCP servers:

```typescript
// src/profiles/apply.ts

export async function applyComposableProfile(
  profile: ComposableProfile, projectPath: string
): Promise<ApplyResult> {
  const result: ApplyResult = { created: [], linked: [], skipped: [], errors: [], warnings: [] };

  await fsPromises.mkdir(projectClaudePath, { recursive: true });
  await applySkillsToProject(profile, projectPath, result);

  const workflowResult = installAllWorkflowSkills(projectPath, { force: false });

  await applyCommandsToProject(profile, projectPath, result);
  await updateClaudeMdWithProfile(claudeMdPath, profile, projectPath);
  await generateRalphConfig(profile, projectPath, result);
  await copyPhaseConfigFiles(projectPath, result);
  await applyMcpToProject(profile, projectPath, result);
  await applyHooksToProject(profile, projectPath, result);

  return result;
}
```

### Skill Discovery

Skills are found by searching the canon directory tree. Each profile references skills by name; the apply step resolves them to source paths across subdirectories:

```typescript
// src/profiles/apply.ts

async function findSkillPathAsync(
  skillName: string, category: SkillCategory
): Promise<string | null> {
  const basePath = SKILL_LIBRARY_PATHS[category];

  if (category === 'canon') {
    for (const subdir of CANON_SUBDIRS) {
      const skillPath = path.join(basePath, subdir, skillName);
      try {
        await fsPromises.access(skillPath);
        return skillPath;
      } catch { /* continue */ }
    }
  }
  // ... similar for other categories
}
```

---

## 2. Scan Project Configuration

Discover everything Claude Code knows about: skills, commands, agents, settings, hooks, MCP servers. Works across global (`~/.claude/`) and project (`.claude/`) scopes.

```bash
lens scan              # Full discovery
lens list skill        # List skills only
lens tokens            # Token usage breakdown
lens audit             # Recommendations
lens deps              # Dependency graph
```

### Core Scanner

The scanner walks both scope directories, classifies each file by type, then builds metadata:

```typescript
// src/scanner/index.ts

export async function scan(options: ScanOptions = {}): Promise<ScanResult> {
  const { projectPath, includePlugins = true } = options;

  const items: ConfigItem[] = [
    ...scanGlobalItems(),
    ...scanProjectItems(projectPath),
    ...(includePlugins ? await scanPlugins() : []),
  ];

  const claudeMds = await Promise.all(
    items
      .filter(item => item.type === 'memory' && item.name.toLowerCase().includes('claude'))
      .map(item => parseClaudeMd(item.path, item.scope))
  );

  const settings = await Promise.all(
    items.filter(item => item.type === 'settings')
      .map(item => parseSettings(item.path, item.scope))
  );

  buildDependencies(items, claudeMds);

  return {
    timestamp: new Date(),
    globalPath: GLOBAL_CLAUDE_PATH,
    projectPath,
    items,
    claudeMds: claudeMds.filter((c): c is ClaudeMdParsed => c !== null),
    settings: settings.filter((s): s is SettingsParsed => s !== null),
    summary: generateSummary(items, claudeMds),
  };
}
```

### Scope Discovery

Global and project scopes are scanned independently, then merged:

```typescript
// src/scanner/index.ts

function scanGlobalItems(): ConfigItem[] {
  return scanScope(GLOBAL_CLAUDE_PATH, 'global');
}

function scanProjectItems(projectPath?: string): ConfigItem[] {
  if (!projectPath) return [];
  const items: ConfigItem[] = [];
  const projectClaudePath = path.join(projectPath, '.claude');

  if (fs.existsSync(projectClaudePath)) {
    items.push(...scanScope(projectClaudePath, 'project'));
  }

  for (const filename of ['CLAUDE.md', 'CLAUDE.local.md']) {
    const item = scanFile(path.join(projectPath, filename), 'project', 'memory');
    if (item) items.push(item);
  }
  return items;
}
```

---

## 3. Manage Canon Skills

Canon skills are 75 expert lenses (clarity, security-mindset, etc.). Full lifecycle: list, deploy, verify integrity, check for updates, upgrade.

```bash
lens canon list                    # All available skills
lens canon deploy -p /project      # Install all to project
lens canon status -p /project      # Check installed vs source
lens canon verify -p /project      # Hash verification
lens canon upgrade -p /project     # Update outdated skills
lens canon diff clarity            # Show what changed
```

### Status Check (Hash Comparison)

Each installed skill is compared against the source using SHA-256 directory hashing:

```typescript
// src/canon/operations.ts

export function checkSkillStatus(projectPath: string): SkillStatusInfo[] {
  const manifest = readManifest(projectPath);
  const installedSkills = getInstalledSkills(projectPath);
  const canonPath = getCanonSourcePath();
  const sourceCommit = getGitCommit(canonPath);

  return installedSkills.map(skillName => {
    const installedPath = path.join(skillsDir, skillName);
    const manifestInfo = manifest?.skills[skillName];
    const sourcePath = findSkillSourcePath(skillName);
    const { status, sourceHash } = determineSkillStatus(
      installedPath, sourcePath, manifestInfo?.hash
    );

    return {
      name: skillName, status, installedHash: manifestInfo?.hash,
      sourceHash, installedCommit: manifestInfo?.installedCommit,
      sourceCommit, sourcePath: sourcePath ?? undefined
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}
```

### Directory Hashing

Integrity verification uses deterministic SHA-256 hashing. Entries are sorted for stable results across runs:

```typescript
// src/utils/hash.ts

export function hashDirectoryContents(dirPath: string): string {
  const hash = createHash('sha256');

  function processDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(dirPath, fullPath);

      if (entry.isDirectory()) {
        hash.update(`dir:${relativePath}\n`);
        processDir(fullPath);
      } else {
        const content = fs.readFileSync(fullPath);
        hash.update(`file:${relativePath}:${content.length}\n`);
        hash.update(content);
      }
    }
  }

  if (fs.existsSync(dirPath)) processDir(dirPath);
  return hash.digest('hex').slice(0, 16);
}
```

### Skill Deployment

Copies a skill from source to project, validates against path traversal, and records the install in the manifest:

```typescript
// src/canon/operations.ts

export function copySkill(
  skillName: string, projectPath: string, options: { force?: boolean } = {}
): { success: boolean; message: string } {
  if (!isValidSkillName(skillName)) {
    return { success: false, message: `Invalid skill name (path traversal): ${skillName}` };
  }

  const sourcePath = findSkillSourcePath(skillName);
  if (!sourcePath) {
    return { success: false, message: `Skill not found in source: ${skillName}` };
  }

  const targetPath = path.join(projectPath, '.claude', 'skills', skillName);
  if (fs.existsSync(targetPath) && !options.force) {
    return { success: false, message: `Skill already exists: ${skillName}. Use --force.` };
  }

  if (fs.existsSync(targetPath)) fs.rmSync(targetPath, { recursive: true });
  copyDirectorySync(sourcePath, targetPath);

  // Record in manifest with hash + commit for future status checks
  let manifest = readManifest(projectPath) ?? createManifest({ type: 'local', path: canonPath });
  updateSkillInManifest(manifest, skillName, {
    installedCommit: getGitCommit(canonPath),
    installedAt: new Date().toISOString(),
    hash: hashSkillDirectory(targetPath),
    modified: false
  });
  writeManifest(projectPath, manifest);

  return { success: true, message: `Copied skill: ${skillName}` };
}
```

### Skill Upgrade

Upgrades outdated skills while preserving locally modified ones (unless `--force`):

```typescript
// src/canon/operations.ts

export function upgradeSkills(
  projectPath: string, options: { force?: boolean; skills?: string[] } = {}
): CanonUpgradeResult {
  const result: CanonUpgradeResult = { upgraded: [], skipped: [], errors: [] };
  const statuses = checkSkillStatus(projectPath);

  for (const skillName of skillsToUpgrade) {
    const status = statuses.find(s => s.name === skillName);
    if (!status) { result.errors.push(`${skillName}: not installed`); continue; }
    if (status.status === 'current') { result.skipped.push(`${skillName}: already current`); continue; }
    if (status.status === 'modified' && !force) {
      result.skipped.push(`${skillName}: locally modified (use --force)`);
      continue;
    }

    const copyResult = copySkill(skillName, projectPath, { force: true });
    copyResult.success
      ? result.upgraded.push(skillName)
      : result.errors.push(`${skillName}: ${copyResult.message}`);
  }
  return result;
}
```

---

## 4. Manage Workflow Skills

Workflow skills are the interactive development commands (`/build`, `/improve`, `/quick-edit`, etc.). Same lifecycle as canon skills.

```bash
lens workflow list
lens workflow status
lens workflow upgrade
```

### Source Resolution

Workflow skills are found via a priority search path:

```typescript
// src/workflow/index.ts

const WORKFLOW_PATHS = [
  process.env.CC_WORKFLOW_SKILLS_PATH,
  DEFAULT_WORKFLOW_SOURCE,                              // relative to package
  path.resolve(process.env.HOME || '', '.claude/workflow-skills'),
  path.resolve(process.env.HOME || '', 'workflow-skills')
].filter((p): p is string => Boolean(p));

function getWorkflowSourcePath(): string {
  for (const p of WORKFLOW_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return DEFAULT_WORKFLOW_SOURCE;
}
```

### Recursive Skill Discovery

Skills are found by recursing into subdirectories, looking for `SKILL.md` files:

```typescript
// src/workflow/index.ts

export function listWorkflowSkills(): WorkflowSkillInfo[] {
  const sourcePath = getWorkflowSourcePath();
  if (!fs.existsSync(sourcePath)) return [];
  const skills: WorkflowSkillInfo[] = [];

  const scanDir = (dirPath: string): void => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const skillPath = path.join(dirPath, entry.name);
      const result = readSkillDescription(path.join(skillPath, 'SKILL.md'));
      if (result) {
        skills.push({ name: entry.name, path: skillPath, description: result.description });
      } else {
        scanDir(skillPath);  // Recurse into subdirectories
      }
    }
  };

  scanDir(sourcePath);
  return skills;
}
```

---

## 5. Trace Skill Loading

Debug how a skill gets loaded: which YAML configs contribute, which keywords trigger it, which phase activates it.

```bash
lens trace clarity                         # Show config stack
lens trace security-mindset -t "add auth"  # With keyword matching
```

### Configuration Stack

The trace builds a layered stack of YAML sources, showing what each contributes:

```typescript
// src/trace/index.ts

export function traceSkillConfig(
  projectPath: string, skillName: string, taskText?: string
): TraceResult {
  const phase = skillToPhase(skillName);
  const appliedProfiles = getAppliedProfiles(projectPath);

  const yamlStack: YamlSource[] = [
    ...traceProfileSources(projectPath, appliedProfiles),
  ];

  const ralphSource = traceRalphConfig(projectPath, phase);
  if (ralphSource) yamlStack.push(ralphSource);

  const phaseSource = tracePhaseConfig(projectPath, phase);
  if (phaseSource) yamlStack.push(phaseSource);

  const keywordSource = traceKeywordConfig(projectPath, taskText);
  if (keywordSource) yamlStack.push(keywordSource);

  const resolvedConfig = phase
    ? resolveConfig(projectPath, phase, taskText ?? '')
    : { experts: [], tools: [], keywords: [] };

  return { skill: skillName, phase, yamlStack, resolvedConfig };
}
```

### Profile Extraction

Applied profiles are read from CLAUDE.md at runtime:

```typescript
// src/trace/index.ts

function getAppliedProfiles(projectPath: string): string[] {
  const claudeMd = findFile(projectPath, '.claude/CLAUDE.md', 'CLAUDE.md');
  if (!claudeMd) return [];
  try {
    const content = fs.readFileSync(claudeMd, 'utf-8');
    const match = content.match(/Profiles Applied[:\s]*\n+`([^`]+)`/i);
    return match ? match[1].split(/\s*\+\s*/).filter(isValidName).slice(0, MAX_PROFILES) : [];
  } catch {
    return [];
  }
}
```

### Keyword Detection

Task text is matched against patterns in `config/keyword-detection.yaml` to load additional experts:

```typescript
// src/trace/index.ts

function traceKeywordConfig(projectPath: string, taskText?: string): YamlSource | null {
  const keywordPath = findFile(projectPath, 'config/keyword-detection.yaml');
  if (!keywordPath || !taskText) return null;

  const rules = loadKeywordRules(projectPath);
  const contributed = rules
    .filter(rule => rule.pattern.test(taskText))
    .map(rule => `"${rule.category}" → ${rule.experts.join(', ')}`);

  return {
    file: keywordPath,
    purpose: 'Keyword detection',
    contributed: contributed.length ? contributed : ['(no keywords matched)'],
  };
}
```

---

## 6. Autonomous PRD Implementation (Ralph Loop)

Fully autonomous loop that takes a PRD file and implements every item through a 12-phase quality pipeline. No human intervention between items.

```
/ralph-loop requirements.md --max 30
```

### PRD Parsing

PRD files are standard markdown with `- [ ]` checkboxes. The parser extracts items with line numbers for later update:

```typescript
// src/ralph/prd/parser.ts

const CHECKBOX_PATTERN = /^(\s*)[-*]\s*\[([ x])\]\s*(.*)$/i;

export function parsePrd(filepath: string, content: string): Prd {
  const lines = content.split('\n');
  const items: PrdItem[] = [];

  lines.forEach((line, index) => {
    const match = line.match(CHECKBOX_PATTERN);
    if (match) {
      const [, , checkbox, text] = match;
      const status: ItemStatus = checkbox.toLowerCase() === 'x' ? 'complete' : 'pending';
      items.push({ lineNumber: index + 1, text: text.trim(), status });
    }
  });

  return { filepath, items, raw: content };
}

export function countIncomplete(prd: Prd): number {
  return prd.items.filter(item => item.status === 'pending').length;
}

export function getIncompleteItems(prd: Prd): PrdItem[] {
  return prd.items.filter(item => item.status === 'pending');
}

export function isAllComplete(prd: Prd): boolean {
  return prd.items.every(item => item.status === 'complete');
}
```

### Main Runner

The runner iterates over incomplete PRD items, running 12 phases per item, then post-loop validation:

```typescript
// src/ralph/runner.ts

export async function run(options: RunnerOptions): Promise<void> {
  const { prdPath, skipReview, verbose, trace, postOnly } = options;
  const projectPath = validateProjectPath(options.projectPath);
  const config = loadConfig(projectPath);
  const prd = parsePrd(prdPath, fs.readFileSync(prdPath, 'utf-8'));
  const session = createSession(prdPath, projectPath, prd.items.length,
    prd.items.length - countIncomplete(prd));
  const collector = new SummaryCollector(
    session.id, prdPath, detectProjectType(projectPath), prd.items.length
  );

  const ctx: RunContext = {
    prd, prdPath, projectPath, session, config,
    phases: createPhases(), collector, skipReview, verbose, trace
  };

  try {
    await processAllItems(ctx);
    if (ctx.collector.getCompletedCount() > 0) {
      await runPostLoopPhases(ctx);
    }
  } finally {
    await finalizeSummary(collector, session.logsDir);
  }
}
```

### Item Processing Loop

Each item is processed sequentially. Items that fail are skipped, not retried:

```typescript
// src/ralph/runner.ts

async function processAllItems(ctx: RunContext): Promise<void> {
  const attemptedItems = new Set<number>();
  let itemNum = 0;
  const maxIterations = ctx.config.settings?.maxIterations ?? 50;

  while (!isAllComplete(ctx.prd) && itemNum < maxIterations) {
    const item = getIncompleteItems(ctx.prd).find(i => !attemptedItems.has(i.lineNumber));
    if (!item) break;
    attemptedItems.add(item.lineNumber);
    itemNum++;
    await processItem(ctx, item, itemNum);
  }
}
```

### Single Item: Phase Execution

Each item runs through all 12 phases. On success, the PRD file is atomically updated:

```typescript
// src/ralph/runner.ts

async function processItem(ctx: RunContext, item: PrdItem, itemNum: number): Promise<boolean> {
  ctx.session.currentItem = itemNum;
  ctx.collector.startItem(itemNum, item.text);

  const phaseStatus = new Map<string, PhaseStatus>();
  ctx.phases.forEach(p => phaseStatus.set(p.name, 'pending'));

  const failed = await runItemPhases(
    ctx.phases, item, ctx.session, ctx.config, ctx.projectPath,
    ctx.skipReview, ctx.verbose, phaseStatus, ctx.collector, itemNum, ctx.trace
  );

  if (failed) {
    ctx.collector.completeItem('failed');
  } else {
    ctx.collector.completeItem('success');
    ctx.prd = updatePrdFile(ctx.prd, item, ctx.prdPath);
    ctx.session.completedItems++;
  }
  return failed;
}

function updatePrdFile(prd: Prd, item: PrdItem, prdPath: string): Prd {
  const updatedContent = markItemComplete(prd, item);
  const tempPath = prdPath + '.tmp';
  fs.writeFileSync(tempPath, updatedContent);
  fs.renameSync(tempPath, prdPath);  // Atomic rename
  return parsePrd(prdPath, updatedContent);
}
```

### Phase Execution with Retry and Timeout Recovery

Phases spawn Claude as a subprocess. Failed phases retry up to 3 times. Timed-out phases can recover if commits were made:

```typescript
// src/ralph/runner/phases.ts

async function canRecoverFromTimeout(
  error: string, projectPath: string, hash: string | null
): Promise<boolean> {
  if (!error.includes('timed out') || !hash) return false;
  return hasNewCommitsSince(projectPath, hash);
}
```

### Skill Loading for Phases

Each phase loads expert skills from the profile config, combining profile-assigned and keyword-detected experts:

```typescript
// src/ralph/skills/loader.ts

function extractChecklist(content: string): string[] {
  const items: string[] = [];
  const checklistPattern = /##\s+(?:[\w\s]*Checklist)[^\n]*\n([\s\S]*?)(?=\n##|\n---|\s*$)/gi;
  let match;
  while ((match = checklistPattern.exec(content)) !== null) {
    const lines = match[1].split('\n');
    for (const line of lines) {
      if (/^\s*-\s*\[[ x]\]/.test(line)) {
        const text = line.replace(/^\s*-\s*\[[ x]\]\s*/, '').trim();
        if (text) items.push(text);
      }
    }
  }
  return items;
}

function loadSkill(projectPath: string, skillName: string): Skill | null {
  const resolvedName = resolveSkillName(skillName);
  const skillDir = path.join(projectPath, '.claude', 'skills', resolvedName);
  const skillPath = path.join(skillDir, 'SKILL.md');

  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    let summary = '';
    let checklist: string[] = [];

    const summaryPath = path.join(skillDir, 'SUMMARY.md');
    try {
      summary = fs.readFileSync(summaryPath, 'utf-8');
      checklist = extractChecklist(summary);
    } catch {
      checklist = extractChecklist(content);  // Fallback to SKILL.md
    }

    return { name: resolvedName, content, summary, checklist, source: 'profile' };
  } catch {
    return null;
  }
}

export function loadSkills(
  projectPath: string, skillNames: string[], verbose: boolean = false
): Skill[] {
  const skills: Skill[] = [];
  for (const name of skillNames) {
    const skill = loadSkill(projectPath, name);
    if (skill) skills.push(skill);
  }
  return skills;
}
```

### Claude Subprocess

Each phase spawns a Claude CLI process with streaming JSON output:

```typescript
// src/ralph/process/claude.ts

function buildClaudeArgs(prompt: string, allowedTools: string[]): string[] {
  const args = [
    '--output-format', 'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
    '-p', prompt,
  ];
  if (allowedTools.length > 0) {
    args.push('--allowedTools', allowedTools.join(','));
  }
  return args;
}

function spawnClaudeProcess(args: string[], projectPath: string) {
  return spawn('claude', args, {
    cwd: projectPath,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
  });
}

export async function runClaude(options: ClaudeOptions): Promise<ClaudeOutput> {
  const { prompt, projectPath, logDir, logPrefix,
    allowedTools = [], timeout = 1800000, stream } = options;
  ensureLogDir(logDir);

  const jsonPath = path.join(logDir, `${logPrefix}.json`);
  const rawPath = path.join(logDir, `${logPrefix}.raw`);
  const startTime = Date.now();
  const child = spawnClaudeProcess(buildClaudeArgs(prompt, allowedTools), projectPath);

  return new Promise((resolve, reject) => {
    let output = '';
    child.stdin?.end();

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Claude timed out after ${timeout}ms`));
    }, timeout);

    child.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      // Stream parsing for real-time tool call events
      if (stream) {
        lineBuffer += chunk;
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';
        for (const line of lines) parseStreamLine(line, stream);
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve(buildClaudeResult(output, code, jsonPath, rawPath, startTime));
    });
  });
}
```

---

## 7. Build/Improve Pipeline

Build a new feature or improve existing code through a 12-phase quality pipeline. Each phase is a workflow skill invoked as a Claude subagent.

```
/build src/notifications
/improve src/scanner
```

**Phases:** create-plan, structure-first, implement-plan, refactor-check-fix, dedupe-fix, gemini-fix, qodana-fix, adversarial-security-review, write-tests-run, ai-smell-fix, write-tests-run

Each phase is defined in `workflow-skills/workflow/<phase>/SKILL.md` and orchestrated by `workflow-skills/workflow/build/SKILL.md` or `workflow-skills/workflow/improve/SKILL.md`. The orchestrator creates a git stash rollback point, then spawns each phase sequentially. Each must emit a gate marker (PLAN_COMPLETE, STRUCTURE_COMPLETE, etc.) before the next begins.

The same phase execution machinery from ralph (section 6) runs each phase as a Claude subprocess.

---

## 8. Quality Fix Skills

Fix skills scan for issues AND fix them. They also record findings to lesson files that earlier phases read to prevent recurrence.

### Gemini Review + Fix

```
/gemini-fix src/ralph
```

Sends code to the Gemini API via MCP tool for external review. Every CRITICAL/HIGH issue must be fixed:

```typescript
// Used via MCP tool call in the skill:
mcp__gemini-reviewer__gemini_review({
  code: sourceCode,
  focus: "general",  // or "security", "performance", "bugs", "adversarial"
  context: "Senior engineer code review..."
})
```

### Static Analysis + Fix

```
/qodana-fix src/
```

Runs Qodana static analysis via MCP tool. Auto-detects project language:

```typescript
// Used via MCP tool call in the skill:
mcp__qodana__qodana_scan({ projectDir: "/path/to/project" })
mcp__qodana__qodana_problems({ projectDir: "/path/to/project", severity: "HIGH" })
```

### Adversarial Security Review

```
/adversarial-security-review src/
```

Security audit via Gemini with attacker mindset. Loads canon security skills first, then reviews with adversarial focus:

```typescript
// Used via MCP tool call in the skill:
mcp__gemini-reviewer__gemini_review({
  code: sourceCode,
  focus: "adversarial",
  context: "Think like an attacker. Find: security vulnerabilities, race conditions,
    edge cases that crash, input validation bypasses, resource exhaustion,
    privilege escalation."
})
```

### Self-Learning Feedback Loop

All fix skills write findings to two lesson files. Earlier planning/implementation phases read them:

```
Later phases (writers):          Earlier phases (readers):
  ai-smell-fix      ──┐           create-plan
  gemini-fix         ──┤ write →   structure-first
  qodana-fix         ──┤           implement-plan
  adversarial-review ──┘           refactor-check-fix
                                   dedupe-fix

Two-tier storage:
  workflow-skills/lessons.md  →  universal patterns (travels with skills repo)
  .claude/lessons.md          →  project-specific instances with file paths
```

Categories: DESIGN, CODE_QUALITY, DUPLICATION, LOGIC, AI_SMELL — each maps to specific earlier phases.

---

## 9. Read-Only Scans

Scan skills report issues without making changes. Same detection as fix skills, report-only output.

```
/gemini-scan src/ralph      # Gemini review (report only)
/qodana-scan src/           # Static analysis (report only)
/ai-smell-scan src/         # AI code patterns with weighted scoring
/dedupe-scan src/           # Duplicate code detection
/refactor-scan src/ralph    # Refactoring opportunities
/naming-review src/cli      # Name clarity check
```

Each scan skill lives in `workflow-skills/utils/<scan-name>/SKILL.md` and uses the same MCP tools as the fix skills but only outputs a report.

---

## 10. Input Validation and Security

All user-provided paths and names are validated at the boundary.

### Name Validation

Prevents path injection via names like `../../etc/passwd`:

```typescript
// src/utils/validation.ts

const VALID_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_NAME_LENGTH = 100;

export function isValidName(name: string): boolean {
  if (!name) return false;
  if (name.length > MAX_NAME_LENGTH) return false;
  return VALID_NAME_PATTERN.test(name);
}
```

### Path Validation

Prevents traversal attacks and null byte injection:

```typescript
// src/utils/validation.ts

export function validateProjectPath(
  projectPath: string, allowedRoot?: string
): string | null {
  if (!projectPath) return null;
  if (projectPath.includes('\0')) return null;  // Null byte truncation attack

  const absolutePath = path.resolve(projectPath);

  if (allowedRoot) {
    const absoluteRoot = path.resolve(allowedRoot);
    const rootPrefix = absoluteRoot.endsWith(path.sep)
      ? absoluteRoot : absoluteRoot + path.sep;
    if (absolutePath !== absoluteRoot && !absolutePath.startsWith(rootPrefix)) {
      return null;
    }
  }
  return absolutePath;
}
```

### Git Without Subprocess

Git operations read `.git/` files directly instead of spawning `git`, avoiding shell injection entirely:

```typescript
// src/utils/git.ts

export function getGitCommit(repoPath: string): string | undefined {
  try {
    const headContent = fs.readFileSync(
      path.join(repoPath, '.git', 'HEAD'), 'utf-8'
    ).trim();

    if (headContent.startsWith('ref: ')) {
      const refPath = headContent.slice(5);
      return fs.readFileSync(
        path.join(repoPath, '.git', refPath), 'utf-8'
      ).trim().slice(0, 7);
    }
    return headContent.slice(0, 7);  // Detached HEAD
  } catch {
    return undefined;
  }
}
```
