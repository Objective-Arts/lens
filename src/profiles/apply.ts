/**
 * Profile application to projects.
 *
 * Apply skills, commands, MCP servers, and configuration to a project.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import { stringify as stringifyYaml } from 'yaml';
import type { ComposableProfile, SkillCategory, MCPServerCategory } from '../types.js';
import { copyDirectoryAsync } from '../utils/fs.js';
import {
  findSkillSourcePath,
  readManifest,
  writeManifest,
  createManifest,
  updateSkillInManifest,
  getGitCommit,
  getGitRemote,
  hashSkillDirectory,
  getCanonSourcePath
} from '../canon/index.js';
import {
  getServer,
  isServerInstalled,
  installAndEnableServer,
  enableServer,
  disableServer,
  listServers,
  checkRequiredEnv
} from '../mcp/index.js';
import { installAllWorkflowSkills } from '../workflow/index.js';
import {
  CLAUDE_DIR_NAME,
  MANIFEST_VERSION,
  MCP_SERVERS_DIR,
  PHASE_CONFIG_SOURCE_DIR,
  SKILL_LIBRARY_PATHS,
  CANON_SUBDIRS,
  DEBUG
} from './paths.js';
import { SKILL_CATEGORIES } from './validation.js';

export interface ApplyResult {
  created: string[];
  linked: string[];
  skipped: string[];
  errors: string[];
  warnings: string[];
}

/** Result of copying a single skill */
interface SkillCopyResult {
  skillName: string;
  status: 'copied' | 'skipped' | 'error';
  message: string;
  sourcePath?: string;
}

/** Find skill path (async) */
async function findSkillPathAsync(skillName: string, category: SkillCategory): Promise<string | null> {
  const basePath = SKILL_LIBRARY_PATHS[category];

  if (category === 'canon') {
    for (const subdir of CANON_SUBDIRS) {
      const skillPath = path.join(basePath, subdir, skillName);
      try {
        await fsPromises.access(skillPath);
        return skillPath;
      } catch { /* continue */ }
    }
    const rootPath = path.join(basePath, skillName);
    try {
      await fsPromises.access(rootPath);
      return rootPath;
    } catch {
      if (DEBUG) console.debug(`Skill not found in canon: ${skillName}`);
      return null;
    }
  }

  const skillPath = path.join(basePath, skillName);
  try {
    await fsPromises.access(skillPath);
    return skillPath;
  } catch {
    if (DEBUG) console.debug(`Skill not found: ${skillName} in ${category}`);
    return null;
  }
}

/** Reject skill names with path traversal characters */
function isValidSkillName(name: string): boolean {
  return !name.includes('/') && !name.includes('\\') && !name.includes('..');
}

/** Copy a single skill to the project */
async function copySkillToProject(
  skillName: string,
  category: SkillCategory,
  skillsDir: string
): Promise<SkillCopyResult> {
  if (!isValidSkillName(skillName)) {
    return { skillName, status: 'error', message: `Invalid skill name (path traversal): ${skillName}` };
  }

  let sourcePath = findSkillSourcePath(skillName);
  if (!sourcePath) {
    sourcePath = await findSkillPathAsync(skillName, category);
  }

  if (!sourcePath) {
    return { skillName, status: 'error', message: `Skill not found: ${skillName} (${category})` };
  }

  const targetPath = path.join(skillsDir, skillName);
  if (fs.existsSync(targetPath)) {
    return { skillName, status: 'skipped', message: `${skillName} (already exists)` };
  }

  try {
    await copyDirectoryAsync(sourcePath, targetPath);
    return { skillName, status: 'copied', message: `${skillName} (copied from ${sourcePath})`, sourcePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { skillName, status: 'error', message: `Failed to copy skill ${skillName}: ${message}` };
  }
}

/** Get or create canon manifest for project */
function getOrCreateManifest(projectPath: string, canonPath: string) {
  const manifest = readManifest(projectPath);
  if (manifest) return manifest;
  return createManifest({
    type: 'local',
    path: canonPath,
    gitRemote: getGitRemote(canonPath),
    version: MANIFEST_VERSION
  });
}

/** Record copy results in manifest and apply result */
function recordCopyResults(
  copyResults: SkillCopyResult[],
  manifest: ReturnType<typeof createManifest>,
  skillsDir: string,
  canonPath: string,
  sourceCommit: string | undefined,
  result: ApplyResult
): void {
  for (const cr of copyResults) {
    if (cr.status === 'copied') {
      result.linked.push(cr.message);
      if (cr.sourcePath) {
        updateSkillInManifest(manifest, cr.skillName, {
          installedCommit: sourceCommit,
          installedAt: new Date().toISOString(),
          sourceFile: path.relative(canonPath, cr.sourcePath) || cr.skillName,
          hash: hashSkillDirectory(path.join(skillsDir, cr.skillName)),
          modified: false
        });
      }
    } else if (cr.status === 'skipped') {
      result.skipped.push(cr.message);
    } else {
      result.errors.push(cr.message);
    }
  }
}

/** Apply skills from profile to project */
async function applySkillsToProject(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  if (!profile.skills) return;

  const skillsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'skills');
  await fsPromises.mkdir(skillsDir, { recursive: true });

  const canonPath = getCanonSourcePath();
  const manifest = getOrCreateManifest(projectPath, canonPath);

  const copyPromises: Promise<SkillCopyResult>[] = [];
  for (const category of SKILL_CATEGORIES) {
    const skills = profile.skills[category as SkillCategory] ?? [];
    for (const skillName of skills) {
      copyPromises.push(copySkillToProject(skillName, category as SkillCategory, skillsDir));
    }
  }

  const copyResults = await Promise.all(copyPromises);
  recordCopyResults(copyResults, manifest, skillsDir, canonPath, getGitCommit(canonPath), result);
  writeManifest(projectPath, manifest);
  result.created.push(`${CLAUDE_DIR_NAME}/canon-manifest.json`);
}

/** Apply commands from profile to project */
async function applyCommandsToProject(
  profile: ComposableProfile,
  projectPath: string,
  result: ApplyResult
): Promise<void> {
  if (!profile.commands || profile.commands.length === 0) return;

  const commandsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'commands');
  const globalClaudePath = path.join(homedir(), CLAUDE_DIR_NAME);
  await fsPromises.mkdir(commandsDir, { recursive: true });

  const linkPromises = profile.commands.map(async (cmdPattern) => {
    const [cmdName] = cmdPattern.split('/');
    const globalCmdPath = path.join(globalClaudePath, 'commands', cmdName);
    const targetPath = path.join(commandsDir, cmdName);

    if (!fs.existsSync(globalCmdPath)) {
      return { type: 'warning' as const, message: `Global command not found: ${cmdName}` };
    }
    if (fs.existsSync(targetPath)) {
      return { type: 'skipped' as const, message: `command:${cmdName} (already exists)` };
    }

    try {
      await fsPromises.symlink(globalCmdPath, targetPath);
      return { type: 'linked' as const, message: `command:${cmdName} → ${globalCmdPath}` };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { type: 'error' as const, message: `Failed to link command ${cmdName}: ${message}` };
    }
  });

  const linkResults = await Promise.all(linkPromises);
  for (const r of linkResults) {
    switch (r.type) {
      case 'linked': result.linked.push(r.message); break;
      case 'skipped': result.skipped.push(r.message); break;
      case 'warning': result.warnings.push(r.message); break;
      case 'error': result.errors.push(r.message); break;
    }
  }
}

/** Enable or install a single MCP server, recording results */
function enableMcpServer(
  serverName: string,
  requireAll: boolean,
  result: { created: string[]; skipped: string[]; errors: string[] }
): void {
  const serverDef = getServer(serverName);
  if (!serverDef) {
    const msg = `MCP server ${serverName} not in registry`;
    result[requireAll ? 'errors' : 'skipped'].push(requireAll ? msg : `${msg} (skipping)`);
    return;
  }

  if (serverDef.requiredEnv?.length) {
    const envCheck = checkRequiredEnv(serverDef);
    if (!envCheck.ok) {
      const msg = `MCP server ${serverName} requires: ${envCheck.missing.join(', ')}`;
      result[requireAll ? 'errors' : 'skipped'].push(requireAll ? msg : `${msg} - set env vars to enable`);
      return;
    }
  }

  if (isServerInstalled(serverName)) {
    const r = enableServer(serverName);
    result[r.success ? 'created' : 'skipped'].push(`MCP server ${serverName}: ${r.success ? 'enabled' : r.message}`);
  } else {
    const r = installAndEnableServer(serverName);
    result[r.success ? 'created' : 'errors'].push(`MCP server ${serverName}: ${r.success ? 'installed and enabled' : r.message}`);
  }
}

/** Apply MCP servers */
async function applyMcpServers(mcpConfig: {
  enable?: string[];
  disable?: string[];
  categories?: MCPServerCategory[];
  requireAll?: boolean;
}): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const result = { created: [] as string[], skipped: [] as string[], errors: [] as string[] };
  const serversToEnable = new Set<string>(mcpConfig.enable ?? []);

  if (mcpConfig.categories) {
    for (const category of mcpConfig.categories) {
      for (const server of listServers({ category })) serversToEnable.add(server.name);
    }
  }

  for (const server of mcpConfig.disable ?? []) serversToEnable.delete(server);
  for (const serverName of serversToEnable) enableMcpServer(serverName, mcpConfig.requireAll ?? false, result);

  for (const serverName of mcpConfig.disable ?? []) {
    const r = disableServer(serverName);
    if (r.success && !r.warnings?.length) result.created.push(`MCP server ${serverName}: disabled`);
  }

  return result;
}

type McpJsonConfig = { mcpServers: Record<string, { type: string; command: string; args: string[]; env?: Record<string, string> }> };

/** Add an MCP server to config if not already present */
async function addMcpServerIfMissing(config: McpJsonConfig, name: string, serverPath: string, added: string[]): Promise<void> {
  if (config.mcpServers[name]) return;
  try {
    await fsPromises.access(serverPath);
    config.mcpServers[name] = { type: 'stdio', command: 'node', args: [serverPath] };
    added.push(name);
  } catch { /* server not found, skip */ }
}

/** Create or update project-level .mcp.json with required MCP servers */
async function createProjectMcpJson(projectPath: string): Promise<{ status: 'created' | 'skipped' | 'error'; warning?: string; error?: string; added?: string[] }> {
  const targetPath = path.join(projectPath, '.mcp.json');

  let mcpConfig: McpJsonConfig = { mcpServers: {} };
  try {
    mcpConfig = JSON.parse(await fsPromises.readFile(targetPath, 'utf-8'));
    if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {};
  } catch { /* file doesn't exist, use empty config */ }

  const added: string[] = [];
  await addMcpServerIfMissing(mcpConfig, 'gemini-reviewer', path.join(MCP_SERVERS_DIR, 'gemini-reviewer', 'index.js'), added);
  await addMcpServerIfMissing(mcpConfig, 'qodana', path.join(MCP_SERVERS_DIR, 'qodana', 'dist', 'index.js'), added);

  if (added.length === 0) return { status: 'skipped' };

  const warning = Object.keys(mcpConfig.mcpServers).length === 0 ? 'No MCP servers found' : undefined;
  try {
    await fsPromises.writeFile(targetPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    return { status: 'created', warning, added };
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : String(error) };
  }
}

/** Apply MCP configuration from profile */
async function applyMcpToProject(profile: ComposableProfile, projectPath: string, result: ApplyResult): Promise<void> {
  if (profile.mcpServers) {
    const mcpResult = await applyMcpServers(profile.mcpServers);
    result.created.push(...mcpResult.created);
    result.skipped.push(...mcpResult.skipped);
    result.errors.push(...mcpResult.errors);
  }

  if (profile.ralph || profile.name?.includes('ralph-integration')) {
    const mcpJsonResult = await createProjectMcpJson(projectPath);
    switch (mcpJsonResult.status) {
      case 'created':
        const addedServers = mcpJsonResult.added?.join(', ') || 'validation servers';
        result.created.push(`.mcp.json (added: ${addedServers})`);
        if (mcpJsonResult.warning) result.warnings.push(mcpJsonResult.warning);
        break;
      case 'skipped':
        result.skipped.push('.mcp.json (all required servers present)');
        break;
      case 'error':
        result.errors.push(`.mcp.json: ${mcpJsonResult.error}`);
        break;
    }
  }
}

/** Apply hooks to settings.json */
async function applyHooksToProject(profile: ComposableProfile, projectPath: string, result: ApplyResult): Promise<void> {
  if (!profile.hooks) return;

  const settingsPath = path.join(projectPath, CLAUDE_DIR_NAME, 'settings.json');
  let settings: Record<string, unknown> = {};

  try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')); }
  catch { /* file missing or invalid JSON — start fresh */ }

  const existingHooks = (settings.hooks as Record<string, unknown[]>) || {};
  for (const [eventType, hookItems] of Object.entries(profile.hooks as Record<string, unknown[]>)) {
    if (!existingHooks[eventType]) existingHooks[eventType] = [];
    existingHooks[eventType].push(...hookItems);
  }
  settings.hooks = existingHooks;

  await fsPromises.mkdir(path.dirname(settingsPath), { recursive: true });
  await fsPromises.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  result.created.push(`Hooks installed: ${Object.keys(profile.hooks).join(', ')}`);
}

/** Copy phase configuration files */
async function copyPhaseConfigFiles(projectPath: string, result: ApplyResult): Promise<void> {
  const targetDir = path.join(projectPath, CLAUDE_DIR_NAME, 'config');
  const files = ['workflow-phases.yaml', 'keyword-detection.yaml'];

  if (!fs.existsSync(PHASE_CONFIG_SOURCE_DIR)) {
    result.warnings.push(`Phase config source not found: ${PHASE_CONFIG_SOURCE_DIR}`);
    return;
  }

  await fsPromises.mkdir(targetDir, { recursive: true });

  for (const file of files) {
    const src = path.join(PHASE_CONFIG_SOURCE_DIR, file);
    const dest = path.join(targetDir, file);
    if (!fs.existsSync(src)) { result.warnings.push(`Phase config file not found: ${file}`); continue; }
    if (fs.existsSync(dest)) { result.skipped.push(`.claude/config/${file} (already exists)`); continue; }
    try { await fsPromises.copyFile(src, dest); result.created.push(`.claude/config/${file}`); }
    catch (e) { result.errors.push(`Failed to copy ${file}: ${e instanceof Error ? e.message : e}`); }
  }
}

/** Generate ralph-config.yaml */
async function generateRalphConfig(profile: ComposableProfile, projectPath: string, result: ApplyResult): Promise<void> {
  if (!profile.ralph) return;

  const configPath = path.join(projectPath, CLAUDE_DIR_NAME, 'ralph-config.yaml');
  const config: Record<string, unknown> = {
    _generated: `Auto-generated from profile: ${profile.name}`,
    _regenerate: 'cc-config profile apply',
  };

  if (profile.ralph.skills) {
    config.skills = {
      plan: profile.ralph.skills.plan ?? [],
      build: profile.ralph.skills.build ?? [],
      refactor: profile.ralph.skills.refactor ?? [],
      test: profile.ralph.skills.test ?? [],
      review: profile.ralph.skills.review ?? [],
      doc: profile.ralph.skills.doc ?? []
    };
  }

  if (profile.ralph.max_iterations) config.max_iterations = profile.ralph.max_iterations;
  if (profile.ralph.max_iterations_per_item) config.max_iterations_per_item = profile.ralph.max_iterations_per_item;
  if (profile.ralph.exit_on_idle_commits) config.exit_on_idle_commits = profile.ralph.exit_on_idle_commits;
  if (profile.ralph.quality_gates) config.quality_gates = profile.ralph.quality_gates;
  if (profile.ralph.post_loop_validation) config.post_loop_validation = profile.ralph.post_loop_validation;
  if (profile.ralph.exit_criteria) config.exit_criteria = profile.ralph.exit_criteria;

  try {
    await fsPromises.writeFile(configPath, stringifyYaml(config), 'utf-8');
    result.created.push('.claude/ralph-config.yaml');
  } catch (e) { result.errors.push(`Failed to generate ralph-config.yaml: ${e instanceof Error ? e.message : e}`); }
}

/** Get workflow commands documentation */
function getWorkflowCommandsDocs(projectPath: string): string {
  const skillsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'skills');
  if (!fs.existsSync(skillsDir)) return '';

  const workflowSkills = [
    { name: 'ralph-loop', cmd: '/ralph-loop [prd-file] [--max N] [--resume]', desc: 'Autonomous PRD implementation loop' },
    { name: 'plan', cmd: '/plan [task]', desc: 'Create implementation plan before coding' },
    { name: 'structure-first', cmd: '/structure-first [feature]', desc: 'Design data structures before implementation' },
    { name: 'implement', cmd: '/implement [target]', desc: 'Implement code from plan' },
    { name: 'refactor-check', cmd: '/refactor-check [target]', desc: 'Systematic code cleanup' },
    { name: 'independent-review', cmd: '/independent-review [path]', desc: 'Code review via Gemini (bugs, edge cases, quality)' },
    { name: 'static-analysis', cmd: '/static-analysis [path]', desc: 'Run Qodana and fix issues' },
    { name: 'test', cmd: '/test [level]', desc: 'Write and run tests' },
    { name: 'doc-code', cmd: '/doc-code [path]', desc: 'Generate documentation' },
    { name: 'security-review', cmd: '/security-review [path]', desc: 'Adversarial security review - think like an attacker' },
    { name: 'production-readiness', cmd: '/production-readiness [path]', desc: 'Final production readiness check and fixes' }
  ] as const;

  const installed = workflowSkills.filter(s => fs.existsSync(path.join(skillsDir, s.name)));
  if (installed.length === 0) return '';

  return `
## Available Commands

| Command | Description |
|---------|-------------|
${installed.map(s => `| \`${s.cmd}\` | ${s.desc} |`).join('\n')}

**Flags for /ralph-loop:**
- \`--max N\` — Override max iterations (default: 50)
- \`--resume\` — Continue from last incomplete PRD item
- \`--external\` — Enable Gemini + Qodana post-loop validation
- \`--dry-run\` — Show what would be done without executing
`;
}

/** Build markdown sections from profile config */
function buildProfileSections(profile: ComposableProfile, projectPath?: string): string {
  let sections = `## Profiles Applied\n\n\`${profile.name}\`\n`;

  if (projectPath) {
    const cmdDocs = getWorkflowCommandsDocs(projectPath);
    if (cmdDocs) sections += cmdDocs;
  }

  const standards = profile.claudeMd?.standards ?? [];
  if (standards.length > 0) sections += `\n## Standards\n\n${standards.map(s => `- ${s}`).join('\n')}\n`;

  const antiPatterns = profile.claudeMd?.antiPatterns ?? [];
  if (antiPatterns.length > 0) sections += `\n## Anti-Patterns (Avoid)\n\n${antiPatterns.map(p => `- ${p}`).join('\n')}\n`;

  const autoInvoke = profile.claudeMd?.autoInvoke ?? [];
  if (autoInvoke.length > 0) {
    const table = autoInvoke.map(ai => `| ${ai.context} | ${ai.action} |`).join('\n');
    sections += `\n## Auto-Invoke Skills\n\n| Context | Action |\n|---------|--------|\n${table}\n`;
  }

  return sections;
}

/** Strip existing profile sections from CLAUDE.md content */
function stripProfileSections(content: string): string {
  return content
    .replace(/## Profiles Applied[\s\S]*?(?=\n## [^A]|\n# |$)/g, '')
    .replace(/## Available Commands[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Standards[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Anti-Patterns[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Auto-Invoke[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Update CLAUDE.md with profile info */
async function updateClaudeMdWithProfile(claudeMdPath: string, profile: ComposableProfile, projectPath?: string): Promise<void> {
  let content = '';
  try { content = await fsPromises.readFile(claudeMdPath, 'utf-8'); } catch { /* new file */ }

  const newSections = buildProfileSections(profile, projectPath);
  content = stripProfileSections(content);

  const firstHeadingMatch = content.match(/^#[^#].*\n/m);
  if (firstHeadingMatch) {
    const insertPos = (firstHeadingMatch.index ?? 0) + firstHeadingMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + newSections + '\n' + content.slice(insertPos).trim();
  } else {
    content = newSections + '\n' + content;
  }

  await fsPromises.writeFile(claudeMdPath, content.trim() + '\n', 'utf-8');
}

/**
 * Apply a composable profile to a project directory.
 */
export async function applyComposableProfile(
  profile: ComposableProfile,
  projectPath: string
): Promise<ApplyResult> {
  const result: ApplyResult = { created: [], linked: [], skipped: [], errors: [], warnings: [] };
  const projectClaudePath = path.join(projectPath, CLAUDE_DIR_NAME);

  await fsPromises.mkdir(projectClaudePath, { recursive: true });
  await applySkillsToProject(profile, projectPath, result);

  const workflowResult = installAllWorkflowSkills(projectPath, { force: false });
  if (workflowResult.installed.length > 0) result.created.push(`Workflow skills: ${workflowResult.installed.join(', ')}`);
  result.skipped.push(...workflowResult.skipped.filter(s => !s.includes('already installed')));
  result.errors.push(...workflowResult.errors);

  await applyCommandsToProject(profile, projectPath, result);

  if (profile.claudeMd?.autoInvoke) {
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    await updateClaudeMdWithProfile(claudeMdPath, profile, projectPath);
    result.created.push('Updated CLAUDE.md with profile info and auto-invoke rules');
  }

  await generateRalphConfig(profile, projectPath, result);

  if (profile.ralph || profile.name?.includes('ralph-integration')) {
    await copyPhaseConfigFiles(projectPath, result);
  }

  await applyMcpToProject(profile, projectPath, result);
  await applyHooksToProject(profile, projectPath, result);

  return result;
}
