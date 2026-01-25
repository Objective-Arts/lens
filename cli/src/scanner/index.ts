/**
 * Scanner module - discovers all Claude Code configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { homedir } from 'os';
import type { ConfigItem, ConfigScope, ConfigItemType, ScanResult, ScanSummary, ConfigConflict, MissingReference, ClaudeMdParsed, SettingsParsed } from '../types.js';
import { parseClaudeMd } from '../parser/claude-md.js';
import { parseSettings } from '../parser/settings.js';
import { estimateTokens } from '../utils/tokens.js';

const GLOBAL_CLAUDE_PATH = path.join(homedir(), '.claude');

/**
 * Options for scanning Claude Code configuration
 */
export interface ScanOptions {
  /** Project directory path to scan (in addition to global ~/.claude/) */
  projectPath?: string;
  /** Whether to include plugin configuration (default: true) */
  includePlugins?: boolean;
}

/**
 * Scan and discover all Claude Code configuration across global and project scopes.
 *
 * Discovers skills, commands, agents, settings, and CLAUDE.md files.
 * Builds a dependency graph and generates a summary with token counts.
 *
 * @param options - Scan configuration options
 * @returns Scan result with all discovered items, parsed files, and summary
 *
 * @example
 * ```typescript
 * // Scan global config only
 * const globalResult = await scan();
 *
 * // Scan project and global config
 * const projectResult = await scan({ projectPath: './myproject' });
 *
 * // Access results
 * console.log(`Found ${projectResult.items.length} items`);
 * console.log(`Total tokens: ${projectResult.summary.totalTokens}`);
 * console.log(`Conflicts: ${projectResult.summary.conflicts.length}`);
 * ```
 */
export async function scan(options: ScanOptions = {}): Promise<ScanResult> {
  const { projectPath, includePlugins = true } = options;

  const items: ConfigItem[] = [];

  // Scan global config
  const globalItems = await scanScope(GLOBAL_CLAUDE_PATH, 'global');
  items.push(...globalItems);

  // Scan project config if provided
  let projectClaudePath: string | undefined;
  if (projectPath) {
    projectClaudePath = path.join(projectPath, '.claude');
    if (fs.existsSync(projectClaudePath)) {
      const projectItems = await scanScope(projectClaudePath, 'project');
      items.push(...projectItems);
    }

    // Also check for CLAUDE.md at project root
    const rootClaudeMd = path.join(projectPath, 'CLAUDE.md');
    if (fs.existsSync(rootClaudeMd)) {
      const item = await scanFile(rootClaudeMd, 'project', 'memory');
      if (item) items.push(item);
    }

    const rootClaudeLocalMd = path.join(projectPath, 'CLAUDE.local.md');
    if (fs.existsSync(rootClaudeLocalMd)) {
      const item = await scanFile(rootClaudeLocalMd, 'project', 'memory');
      if (item) items.push(item);
    }
  }

  // Scan plugins if enabled
  if (includePlugins) {
    const pluginItems = await scanPlugins();
    items.push(...pluginItems);
  }

  // Parse CLAUDE.md files
  const claudeMds = await Promise.all(
    items
      .filter(item => item.type === 'memory' && item.name.toLowerCase().includes('claude'))
      .map(item => parseClaudeMd(item.path, item.scope))
  );

  // Parse settings files
  const settingsItems = items.filter(item => item.type === 'settings');
  const settings = await Promise.all(
    settingsItems.map(item => parseSettings(item.path, item.scope))
  );

  // Build dependency graph
  buildDependencies(items, claudeMds);

  // Generate summary
  const summary = generateSummary(items, claudeMds);

  return {
    timestamp: new Date(),
    globalPath: GLOBAL_CLAUDE_PATH,
    projectPath,
    items,
    claudeMds: claudeMds.filter((c): c is ClaudeMdParsed => c !== null),
    settings: settings.filter((s): s is SettingsParsed => s !== null),
    summary
  };
}

async function scanScope(basePath: string, scope: ConfigScope): Promise<ConfigItem[]> {
  const items: ConfigItem[] = [];

  if (!fs.existsSync(basePath)) {
    return items;
  }

  // Scan skills
  const skillsPath = path.join(basePath, 'skills');
  if (fs.existsSync(skillsPath)) {
    const skillItems = await scanDirectory(skillsPath, scope, 'skill');
    items.push(...skillItems);
  }

  // Scan commands
  const commandsPath = path.join(basePath, 'commands');
  if (fs.existsSync(commandsPath)) {
    const commandItems = await scanDirectory(commandsPath, scope, 'command');
    items.push(...commandItems);
  }

  // Scan agents
  const agentsPath = path.join(basePath, 'agents');
  if (fs.existsSync(agentsPath)) {
    const agentItems = await scanDirectory(agentsPath, scope, 'agent');
    items.push(...agentItems);
  }

  // Scan settings
  const settingsFiles = ['settings.json', 'settings.local.json'];
  for (const settingsFile of settingsFiles) {
    const settingsPath = path.join(basePath, settingsFile);
    if (fs.existsSync(settingsPath)) {
      const item = await scanFile(settingsPath, scope, 'settings');
      if (item) items.push(item);
    }
  }

  // Scan CLAUDE.md in .claude directory
  const claudeMdPath = path.join(basePath, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    const item = await scanFile(claudeMdPath, scope, 'memory');
    if (item) items.push(item);
  }

  return items;
}

async function scanDirectory(dirPath: string, scope: ConfigScope, type: ConfigItemType): Promise<ConfigItem[]> {
  const items: ConfigItem[] = [];

  if (!fs.existsSync(dirPath)) {
    return items;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory() || entry.isSymbolicLink()) {
      const item = await scanSkillOrCommandDir(fullPath, scope, type);
      if (item) items.push(item);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const item = await scanFile(fullPath, scope, type);
      if (item) items.push(item);
    }
  }

  return items;
}

async function scanSkillOrCommandDir(dirPath: string, scope: ConfigScope, type: ConfigItemType): Promise<ConfigItem | null> {
  const stats = fs.lstatSync(dirPath);
  const isSymlink = stats.isSymbolicLink();
  let symlinkTarget: string | undefined;
  let realPath = dirPath;

  if (isSymlink) {
    try {
      symlinkTarget = fs.readlinkSync(dirPath);
      realPath = fs.realpathSync(dirPath);
    } catch {
      // Broken symlink
      return null;
    }
  }

  // Find the main content file
  const possibleFiles = ['SKILL.md', 'skill.md', 'index.md', 'README.md'];
  let contentFile: string | undefined;
  let content = '';

  for (const file of possibleFiles) {
    const filePath = path.join(realPath, file);
    if (fs.existsSync(filePath)) {
      contentFile = filePath;
      content = fs.readFileSync(filePath, 'utf-8');
      break;
    }
  }

  // Also check for .md files directly in the directory
  if (!contentFile) {
    // Ensure realPath is a directory before trying to read it
    const realStats = fs.statSync(realPath);
    if (realStats.isDirectory()) {
      const mdFiles = fs.readdirSync(realPath).filter(f => f.endsWith('.md'));
      if (mdFiles.length > 0) {
        contentFile = path.join(realPath, mdFiles[0]);
        content = fs.readFileSync(contentFile, 'utf-8');
      }
    }
  }

  const name = path.basename(dirPath);
  const tokens = estimateTokens(content);

  return {
    type,
    name,
    scope,
    path: dirPath,
    isSymlink,
    symlinkTarget,
    tokens,
    content,
    dependencies: [],
    referencedBy: [],
    metadata: {
      description: extractDescription(content)
    }
  };
}

async function scanFile(filePath: string, scope: ConfigScope, type: ConfigItemType): Promise<ConfigItem | null> {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const name = path.basename(filePath);
  const tokens = estimateTokens(content);

  return {
    type,
    name,
    scope,
    path: filePath,
    isSymlink: false,
    tokens,
    content,
    dependencies: [],
    referencedBy: [],
    metadata: {
      description: type === 'settings' ? 'Settings file' : extractDescription(content)
    }
  };
}

async function scanPlugins(): Promise<ConfigItem[]> {
  const items: ConfigItem[] = [];
  const pluginsPath = path.join(GLOBAL_CLAUDE_PATH, 'plugins');

  if (!fs.existsSync(pluginsPath)) {
    return items;
  }

  // Scan plugin marketplaces and cache
  const pluginDirs = ['marketplaces', 'cache'];

  for (const pluginDir of pluginDirs) {
    const dirPath = path.join(pluginsPath, pluginDir);
    if (!fs.existsSync(dirPath)) continue;

    // Find all skill directories within plugins
    const skillPaths = await glob('**/skills/*', { cwd: dirPath, absolute: true });

    for (const skillPath of skillPaths) {
      if (fs.statSync(skillPath).isDirectory()) {
        const item = await scanSkillOrCommandDir(skillPath, 'plugin', 'skill');
        if (item) items.push(item);
      }
    }
  }

  return items;
}

function buildDependencies(items: ConfigItem[], claudeMds: (Awaited<ReturnType<typeof parseClaudeMd>> | null)[]): void {
  // Build a map of item names to items
  const itemMap = new Map<string, ConfigItem>();
  for (const item of items) {
    itemMap.set(item.name, item);
  }

  // Extract references from CLAUDE.md files
  for (const claudeMd of claudeMds) {
    if (!claudeMd) continue;

    const claudeMdItem = items.find(i => i.path === claudeMd.path);
    if (!claudeMdItem) continue;

    // Add skill references as dependencies
    for (const skillRef of claudeMd.skillReferences) {
      claudeMdItem.dependencies.push(skillRef);
      const skillItem = itemMap.get(skillRef);
      if (skillItem) {
        skillItem.referencedBy.push(claudeMdItem.name);
      }
    }

    // Add command references
    for (const cmdRef of claudeMd.commandReferences) {
      claudeMdItem.dependencies.push(cmdRef);
      const cmdItem = itemMap.get(cmdRef);
      if (cmdItem) {
        cmdItem.referencedBy.push(claudeMdItem.name);
      }
    }
  }
}

function generateSummary(items: ConfigItem[], claudeMds: (Awaited<ReturnType<typeof parseClaudeMd>> | null)[]): ScanSummary {
  const byType: Record<ConfigItemType, number> = {
    skill: 0, command: 0, agent: 0, memory: 0, settings: 0, hook: 0, mcp: 0
  };
  const byScope: Record<ConfigScope, number> = {
    global: 0, project: 0, plugin: 0
  };
  const tokensByScope: Record<ConfigScope, number> = {
    global: 0, project: 0, plugin: 0
  };

  let totalTokens = 0;

  for (const item of items) {
    byType[item.type]++;
    byScope[item.scope]++;
    totalTokens += item.tokens;
    tokensByScope[item.scope] += item.tokens;
  }

  // Find conflicts (same name in multiple scopes)
  const conflicts: ConfigConflict[] = [];
  const nameMap = new Map<string, ConfigItem[]>();

  for (const item of items) {
    const key = `${item.type}:${item.name}`;
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key)!.push(item);
  }

  for (const [key, itemsWithName] of nameMap) {
    if (itemsWithName.length > 1) {
      const [type, name] = key.split(':');
      conflicts.push({
        name,
        type: type as ConfigItemType,
        locations: itemsWithName.map(i => i.path)
      });
    }
  }

  // Find missing references
  const missingReferences: MissingReference[] = [];
  const allItemNames = new Set(items.map(i => i.name));

  for (const claudeMd of claudeMds) {
    if (!claudeMd) continue;

    for (const skillRef of claudeMd.skillReferences) {
      if (!allItemNames.has(skillRef)) {
        missingReferences.push({
          referencedName: skillRef,
          referencedIn: claudeMd.path,
          referenceType: 'skill'
        });
      }
    }
  }

  // Find unused items (not referenced anywhere)
  const unusedItems = items
    .filter(i => i.type === 'skill' && i.referencedBy.length === 0)
    .map(i => i.name);

  return {
    totalItems: items.length,
    byType,
    byScope,
    totalTokens,
    tokensByScope,
    conflicts,
    missingReferences,
    unusedItems
  };
}

function extractDescription(content: string): string | undefined {
  // Try to extract description from frontmatter or first paragraph
  const lines = content.split('\n');

  // Check for YAML frontmatter description
  if (lines[0] === '---') {
    const endIndex = lines.slice(1).findIndex(l => l === '---');
    if (endIndex > 0) {
      const frontmatter = lines.slice(1, endIndex + 1).join('\n');
      const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m);
      if (descMatch) {
        return descMatch[1];
      }
    }
  }

  // Fall back to first non-empty, non-heading line
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
      return trimmed.slice(0, 100);
    }
  }

  return undefined;
}

export { GLOBAL_CLAUDE_PATH };
