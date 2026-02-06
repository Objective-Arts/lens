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
 */
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

/** Scan global ~/.claude config. */
function scanGlobalItems(): ConfigItem[] {
  return scanScope(GLOBAL_CLAUDE_PATH, 'global');
}

/** Scan project .claude/ dir and root CLAUDE.md files. */
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

/** Scan a .claude/ directory for skills, commands, agents, settings, and CLAUDE.md. */
function scanScope(basePath: string, scope: ConfigScope): ConfigItem[] {
  if (!fs.existsSync(basePath)) return [];

  const items: ConfigItem[] = [];

  const subdirs: Array<[string, ConfigItemType]> = [
    ['skills', 'skill'],
    ['commands', 'command'],
    ['agents', 'agent'],
  ];

  for (const [dir, type] of subdirs) {
    const dirPath = path.join(basePath, dir);
    if (fs.existsSync(dirPath)) {
      items.push(...scanDirectory(dirPath, scope, type));
    }
  }

  for (const settingsFile of ['settings.json', 'settings.local.json']) {
    const item = scanFile(path.join(basePath, settingsFile), scope, 'settings');
    if (item) items.push(item);
  }

  const claudeItem = scanFile(path.join(basePath, 'CLAUDE.md'), scope, 'memory');
  if (claudeItem) items.push(claudeItem);

  return items;
}

/** Scan a directory for skill/command/agent entries. */
function scanDirectory(dirPath: string, scope: ConfigScope, type: ConfigItemType): ConfigItem[] {
  if (!fs.existsSync(dirPath)) return [];

  const items: ConfigItem[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory() || entry.isSymbolicLink()) {
      const item = scanSkillOrCommandDir(fullPath, scope, type);
      if (item) items.push(item);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const item = scanFile(fullPath, scope, type);
      if (item) items.push(item);
    }
  }

  return items;
}

/** Resolve symlink path, returning null if broken. */
function resolveSymlink(dirPath: string): { isSymlink: boolean; realPath: string; target?: string } | null {
  const stats = fs.lstatSync(dirPath);
  if (!stats.isSymbolicLink()) {
    return { isSymlink: false, realPath: dirPath };
  }
  try {
    return {
      isSymlink: true,
      realPath: fs.realpathSync(dirPath),
      target: fs.readlinkSync(dirPath),
    };
  } catch {
    return null; // Broken symlink
  }
}

/** Find content file in skill/command directory. TOCTOU-safe: try-catch, no existsSync. */
function findContentFile(realPath: string): { path?: string; content: string } {
  for (const file of ['SKILL.md', 'skill.md', 'index.md', 'README.md']) {
    const filePath = path.join(realPath, file);
    try {
      return { path: filePath, content: fs.readFileSync(filePath, 'utf-8') };
    } catch {
      // File doesn't exist, try next
    }
  }

  // Fallback: first .md file in directory
  try {
    const mdFiles = fs.readdirSync(realPath).filter(f => f.endsWith('.md'));
    if (mdFiles.length > 0) {
      const filePath = path.join(realPath, mdFiles[0]);
      return { path: filePath, content: fs.readFileSync(filePath, 'utf-8') };
    }
  } catch {
    // Directory not readable
  }
  return { content: '' };
}

/** Scan a skill or command directory. */
function scanSkillOrCommandDir(dirPath: string, scope: ConfigScope, type: ConfigItemType): ConfigItem | null {
  const resolved = resolveSymlink(dirPath);
  if (!resolved) return null;

  const { content } = findContentFile(resolved.realPath);

  return {
    type,
    name: path.basename(dirPath),
    scope,
    path: dirPath,
    isSymlink: resolved.isSymlink,
    symlinkTarget: resolved.target,
    tokens: estimateTokens(content),
    content,
    dependencies: [],
    referencedBy: [],
    metadata: { description: extractDescription(content) },
  };
}

/** Scan a single file. TOCTOU-safe: try-catch, no existsSync+readFileSync pair. */
function scanFile(filePath: string, scope: ConfigScope, type: ConfigItemType): ConfigItem | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      type,
      name: path.basename(filePath),
      scope,
      path: filePath,
      isSymlink: false,
      tokens: estimateTokens(content),
      content,
      dependencies: [],
      referencedBy: [],
      metadata: {
        description: type === 'settings' ? 'Settings file' : extractDescription(content)
      }
    };
  } catch {
    return null;
  }
}

/** Scan plugin directories (async — glob is async). */
async function scanPlugins(): Promise<ConfigItem[]> {
  const pluginsPath = path.join(GLOBAL_CLAUDE_PATH, 'plugins');
  if (!fs.existsSync(pluginsPath)) return [];

  const items: ConfigItem[] = [];

  for (const pluginDir of ['marketplaces', 'cache']) {
    const dirPath = path.join(pluginsPath, pluginDir);
    if (!fs.existsSync(dirPath)) continue;

    let skillPaths: string[];
    try {
      skillPaths = await glob('**/skills/*', { cwd: dirPath, absolute: true });
    } catch {
      continue;
    }

    for (const skillPath of skillPaths) {
      try {
        if (fs.statSync(skillPath).isDirectory()) {
          const item = scanSkillOrCommandDir(skillPath, 'plugin', 'skill');
          if (item) items.push(item);
        }
      } catch {
        // Path no longer valid, skip
      }
    }
  }

  return items;
}

function buildDependencies(items: ConfigItem[], claudeMds: (Awaited<ReturnType<typeof parseClaudeMd>> | null)[]): void {
  const itemByName = new Map<string, ConfigItem>();
  const itemByPath = new Map<string, ConfigItem>();
  for (const item of items) {
    itemByName.set(item.name, item);
    itemByPath.set(item.path, item);
  }

  for (const claudeMd of claudeMds) {
    if (!claudeMd) continue;

    const claudeMdItem = itemByPath.get(claudeMd.path);
    if (!claudeMdItem) continue;

    for (const skillRef of claudeMd.skillReferences) {
      claudeMdItem.dependencies.push(skillRef);
      const skillItem = itemByName.get(skillRef);
      if (skillItem) {
        skillItem.referencedBy.push(claudeMdItem.name);
      }
    }

    for (const cmdRef of claudeMd.commandReferences) {
      claudeMdItem.dependencies.push(cmdRef);
      const cmdItem = itemByName.get(cmdRef);
      if (cmdItem) {
        cmdItem.referencedBy.push(claudeMdItem.name);
      }
    }
  }
}

/** Count items by type and scope. */
function countItems(items: ConfigItem[]): {
  byType: Record<ConfigItemType, number>;
  byScope: Record<ConfigScope, number>;
  tokensByScope: Record<ConfigScope, number>;
  totalTokens: number;
} {
  const byType: Record<ConfigItemType, number> = { skill: 0, command: 0, agent: 0, memory: 0, settings: 0, hook: 0, mcp: 0 };
  const byScope: Record<ConfigScope, number> = { global: 0, project: 0, plugin: 0 };
  const tokensByScope: Record<ConfigScope, number> = { global: 0, project: 0, plugin: 0 };
  let totalTokens = 0;

  for (const item of items) {
    byType[item.type]++;
    byScope[item.scope]++;
    totalTokens += item.tokens;
    tokensByScope[item.scope] += item.tokens;
  }
  return { byType, byScope, tokensByScope, totalTokens };
}

/** Find items with same name in multiple scopes. */
function findConflicts(items: ConfigItem[]): ConfigConflict[] {
  const nameMap = new Map<string, ConfigItem[]>();
  for (const item of items) {
    const key = `${item.type}:${item.name}`;
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)!.push(item);
  }

  return Array.from(nameMap.entries())
    .filter(([, itemsWithName]) => itemsWithName.length > 1)
    .map(([key, itemsWithName]) => {
      const [type, name] = key.split(':');
      return { name, type: type as ConfigItemType, locations: itemsWithName.map(i => i.path) };
    });
}

/** Find skill references that don't exist. */
function findMissingReferences(
  claudeMds: (Awaited<ReturnType<typeof parseClaudeMd>> | null)[],
  allItemNames: Set<string>
): MissingReference[] {
  const missing: MissingReference[] = [];
  for (const claudeMd of claudeMds) {
    if (!claudeMd) continue;
    for (const skillRef of claudeMd.skillReferences) {
      if (!allItemNames.has(skillRef)) {
        missing.push({ referencedName: skillRef, referencedIn: claudeMd.path, referenceType: 'skill' });
      }
    }
  }
  return missing;
}

function generateSummary(items: ConfigItem[], claudeMds: (Awaited<ReturnType<typeof parseClaudeMd>> | null)[]): ScanSummary {
  const counts = countItems(items);
  const conflicts = findConflicts(items);
  const allItemNames = new Set(items.map(i => i.name));
  const missingReferences = findMissingReferences(claudeMds, allItemNames);
  const unusedItems = items.filter(i => i.type === 'skill' && i.referencedBy.length === 0).map(i => i.name);

  return {
    totalItems: items.length,
    ...counts,
    conflicts,
    missingReferences,
    unusedItems,
  };
}

function extractDescription(content: string): string | undefined {
  const lines = content.split('\n');

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

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
      return trimmed.slice(0, 100);
    }
  }

  return undefined;
}

export { GLOBAL_CLAUDE_PATH };
