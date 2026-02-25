/**
 * Scanner module - discovers all Claude Code configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { homedir } from 'os';
import type { ConfigItem, ConfigScope, ConfigItemType, ScanResult, ClaudeMdParsed, SettingsParsed } from '../types.js';
import { parseClaudeMd } from '../parser/claude-md.js';
import { parseSettings } from '../parser/settings.js';
import { estimateTokens } from '../utils/tokens.js';
import { buildDependencies, generateSummary, extractDescription } from './analysis.js';
import { isEnoent } from '../utils/fs.js';

const GLOBAL_CLAUDE_PATH = path.join(homedir(), '.claude');
const MAX_CONFIG_FILE_SIZE = 512 * 1024; // 512 KB cap for config/skill files

/**
 * Options for scanning Claude Code configuration
 */
export interface ScanOptions {
  /** Project directory path to scan (in addition to global ~/.claude/) */
  projectPath?: string;
  /** Whether to include plugin configuration (default: true) */
  includePlugins?: boolean;
  /**
   * Override the global Claude path (defaults to ~/.claude).
   * Useful for testing — inject a temporary directory instead of touching the real global config.
   */
  globalClaudePath?: string;
}

/**
 * Scan and discover all Claude Code configuration across global and project scopes.
 */
export async function scan(options: ScanOptions = {}): Promise<ScanResult> {
  const { projectPath, includePlugins = true, globalClaudePath = GLOBAL_CLAUDE_PATH } = options;

  const items: ConfigItem[] = [
    ...scanGlobalItems(globalClaudePath),
    ...scanProjectItems(projectPath),
    ...(includePlugins ? await scanPlugins(globalClaudePath) : []),
  ];

  const claudeMds = await Promise.all(
    items
      .filter(item => item.type === 'memory' && /^CLAUDE(\.local)?\.md$/i.test(item.name))
      .map(item => parseClaudeMd(item.path, item.scope))
  );

  const settings = await Promise.all(
    items.filter(item => item.type === 'settings')
      .map(item => parseSettings(item.path, item.scope).catch(e => {
        if (process.env['DEBUG']) {
          console.debug(`[scanner] Failed to parse ${item.path}:`, e instanceof Error ? e.message : String(e));
        }
        return null;
      }))
  );

  buildDependencies(items, claudeMds);

  return {
    timestamp: new Date(),
    globalPath: globalClaudePath,
    projectPath,
    items,
    claudeMds: claudeMds.filter((c): c is ClaudeMdParsed => c !== null),
    settings: settings.filter((s): s is SettingsParsed => s !== null),
    summary: generateSummary(items, claudeMds),
  };
}

function scanGlobalItems(globalClaudePath: string): ConfigItem[] {
  return scanScope(globalClaudePath, 'global');
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

function resolveSymlink(dirPath: string): { isSymlink: boolean; realPath: string; target?: string } | null {
  const stats = fs.lstatSync(dirPath);
  if (!stats.isSymbolicLink()) {
    return { isSymlink: false, realPath: dirPath };
  }
  try {
    const realPath = fs.realpathSync(dirPath);
    return {
      isSymlink: true,
      realPath,
      target: fs.readlinkSync(dirPath),
    };
  } catch (cause) {
    if (process.env['DEBUG']) {
      console.debug(`[scanner] Broken symlink at ${dirPath}:`, cause instanceof Error ? cause.message : String(cause));
    }
    return null; // Broken symlink
  }
}

function readFileWithSizeCap(filePath: string): string {
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_CONFIG_FILE_SIZE) {
    return `[Content truncated: file exceeds ${MAX_CONFIG_FILE_SIZE / 1024} KB limit]`;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function findContentFile(realPath: string): { path?: string; content: string } {
  for (const file of ['SKILL.md', 'skill.md', 'index.md', 'README.md']) {
    const filePath = path.join(realPath, file);
    try {
      return { path: filePath, content: readFileWithSizeCap(filePath) };
    } catch (e) {
      if (!isEnoent(e) && process.env['DEBUG']) {
        console.debug(`[scanner] Cannot read ${filePath}:`, e instanceof Error ? e.message : String(e));
      }
    }
  }

  // Fallback: first .md file in directory
  try {
    const mdFiles = fs.readdirSync(realPath).filter(f => f.endsWith('.md'));
    if (mdFiles.length > 0) {
      const filePath = path.join(realPath, mdFiles[0]);
      return { path: filePath, content: readFileWithSizeCap(filePath) };
    }
  } catch (e) {
    if (process.env['DEBUG']) {
      console.debug(`[scanner] Cannot read directory ${realPath}:`, e instanceof Error ? e.message : String(e));
    }
  }
  return { content: '' };
}

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

function scanFile(filePath: string, scope: ConfigScope, type: ConfigItemType): ConfigItem | null {
  try {
    const content = readFileWithSizeCap(filePath);
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
  } catch (e) {
    if (process.env['DEBUG']) {
      console.debug(`[scanner] Cannot read ${filePath}:`, e instanceof Error ? e.message : String(e));
    }
    return null;
  }
}

async function scanPlugins(globalClaudePath: string): Promise<ConfigItem[]> {
  const pluginsPath = path.join(globalClaudePath, 'plugins');
  if (!fs.existsSync(pluginsPath)) return [];

  const items: ConfigItem[] = [];

  for (const pluginDir of ['marketplaces', 'cache']) {
    const dirPath = path.join(pluginsPath, pluginDir);
    if (!fs.existsSync(dirPath)) continue;

    let skillPaths: string[];
    try {
      skillPaths = await glob('**/skills/*', { cwd: dirPath, absolute: true, maxDepth: 5 });
    } catch {
      continue;
    }

    for (const skillPath of skillPaths) {
      try {
        if (!fs.statSync(skillPath).isDirectory()) continue;
      } catch { continue; }
      const item = scanSkillOrCommandDir(skillPath, 'plugin', 'skill');
      if (item) items.push(item);
    }
  }

  return items;
}

export { GLOBAL_CLAUDE_PATH };
