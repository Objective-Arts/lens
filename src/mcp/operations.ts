/**
 * MCP Operations - install, uninstall, enable, disable servers
 *
 * Supports both global (~/.claude/) and project-level (.mcp.json) configuration.
 * Project-level is preferred for portability.
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import type {
  MCPServerConfig,
  MCPOperationResult,
  EnvCheckResult
} from './types.js';
import { getServer, checkRequiredEnv } from './registry.js';
import { isEnoent, safeReadFileSync } from '../utils/fs.js';
import { isRecord } from '../utils/validation.js';

const GLOBAL_CLAUDE_DIR = path.join(homedir(), '.claude');

function resolvePaths(projectPath?: string): {
  mcpJsonPath: string;
  settingsJsonPath: string;
  scope: 'project' | 'global';
} {
  if (projectPath) {
    if (projectPath.includes('\0')) {
      throw new Error('Invalid project path: contains null bytes');
    }
    const resolved = path.resolve(projectPath);
    return {
      mcpJsonPath: path.join(resolved, '.mcp.json'),
      settingsJsonPath: path.join(resolved, '.claude', 'settings.json'),
      scope: 'project'
    };
  }
  return {
    mcpJsonPath: path.join(GLOBAL_CLAUDE_DIR, '.mcp.json'),
    settingsJsonPath: path.join(GLOBAL_CLAUDE_DIR, 'settings.json'),
    scope: 'global'
  };
}

function isMcpServersMap(value: unknown): value is Record<string, MCPServerConfig> {
  if (!isRecord(value)) return false;
  // type field is optional; stdio servers may omit it and use command instead
  return Object.values(value).every(entry => isRecord(entry));
}

function loadMcpJson(projectPath?: string): Record<string, MCPServerConfig> {
  const { mcpJsonPath } = resolvePaths(projectPath);

  try {
    const content = safeReadFileSync(mcpJsonPath);
    const parsed: unknown = JSON.parse(content);
    if (!isRecord(parsed)) {
      throw new Error('.mcp.json is not a JSON object');
    }
    const servers = parsed.mcpServers ?? parsed;
    if (!isMcpServersMap(servers)) {
      throw new Error('.mcp.json has invalid server configuration structure');
    }
    return servers;
  } catch (cause) {
    if (isEnoent(cause)) return {};
    const backupPath = `${mcpJsonPath}.corrupt.${process.pid}.json`;
    try { fs.renameSync(mcpJsonPath, backupPath); } catch { /* ignore */ }
    console.warn(`Warning: corrupt .mcp.json — backed up to ${backupPath} and using empty config`);
    return {};
  }
}

/**
 * Save mcp.json using a write-to-temp-then-rename pattern to prevent
 * partial writes leaving the file in a corrupt state.
 */
function saveMcpJson(servers: Record<string, MCPServerConfig>, projectPath?: string): void {
  const { mcpJsonPath } = resolvePaths(projectPath);

  // Ensure directory exists for project-level config
  const dir = path.dirname(mcpJsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${mcpJsonPath}.tmp.${process.pid}`;
  const content = { mcpServers: servers };
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(content, null, 2), 'utf-8');
    fs.renameSync(tmpPath, mcpJsonPath);
  } catch (cause) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw new Error(`Failed to save mcp.json`, { cause });
  }
}

function loadSettings(projectPath?: string): Record<string, unknown> {
  const { settingsJsonPath } = resolvePaths(projectPath);

  try {
    const content = safeReadFileSync(settingsJsonPath);
    const parsed: unknown = JSON.parse(content);
    if (!isRecord(parsed)) {
      console.warn(`Warning: settings.json is not a JSON object at ${settingsJsonPath} — using defaults`);
      return {};
    }
    return parsed;
  } catch (cause) {
    if (!isEnoent(cause)) {
      console.warn(`Warning: corrupt settings at ${settingsJsonPath} — using defaults`);
    }
    return {};
  }
}

function saveSettings(settings: Record<string, unknown>, projectPath?: string): void {
  const { settingsJsonPath } = resolvePaths(projectPath);

  // Ensure directory exists
  const dir = path.dirname(settingsJsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = `${settingsJsonPath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2), 'utf-8');
    fs.renameSync(tmpPath, settingsJsonPath);
  } catch (cause) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw cause;
  }
}

function isEnabledList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function getEnabledServers(projectPath?: string): string[] {
  const settings = loadSettings(projectPath);
  const raw = settings['enabledMcpjsonServers'];
  return isEnabledList(raw) ? raw : [];
}

function saveEnabledServers(enabledNames: string[], projectPath?: string): void {
  const settings = loadSettings(projectPath);
  settings['enabledMcpjsonServers'] = enabledNames;
  saveSettings(settings, projectPath);
}

export function isServerInstalled(name: string, projectPath?: string): boolean {
  const mcpJson = loadMcpJson(projectPath);
  return name in mcpJson;
}

export function isServerEnabled(name: string, projectPath?: string): boolean {
  return getEnabledServers(projectPath).includes(name);
}

// installServer helpers

function checkEnvForInstall(
  name: string,
  server: import('./types.js').MCPServerDefinition,
  skipEnvCheck: boolean
): MCPOperationResult | null {
  if (skipEnvCheck || !server.requiredEnv || server.requiredEnv.length === 0) {
    return null;
  }
  const envCheck = checkRequiredEnv(server);
  if (!envCheck.ok) {
    return {
      success: false,
      message: `Missing required environment variables: ${envCheck.missing.join(', ')}`,
      server: name,
      warnings: [`Set these variables in your shell: ${envCheck.missing.join(', ')}`]
    };
  }
  return null;
}

function buildServerConfig(
  server: import('./types.js').MCPServerDefinition
): MCPServerConfig {
  const config: MCPServerConfig = { type: server.type };

  if (server.type === 'stdio') {
    config.command = server.command;
    config.args = server.args;
  } else if (server.type === 'http') {
    config.url = server.url;
  }

  return config;
}

function applyServerEnv(
  server: import('./types.js').MCPServerDefinition,
  config: MCPServerConfig
): void {
  if (server.env) {
    config.env = { ...server.env }; // Keep ${VAR} references — resolve at runtime, not at install
  }
}

export function installServer(
  name: string,
  options: { skipEnvCheck?: boolean; projectPath?: string } = {}
): MCPOperationResult {
  const { skipEnvCheck = false, projectPath } = options;
  const { scope } = resolvePaths(projectPath);
  const server = getServer(name);

  if (!server) {
    return { success: false, message: `Server not found in registry: ${name}`, server: name };
  }

  const envError = checkEnvForInstall(name, server, skipEnvCheck);
  if (envError) return envError;

  const mcpJson = loadMcpJson(projectPath);
  if (mcpJson[name]) {
    return {
      success: true,
      message: `Server already installed (${scope}): ${name}`,
      server: name,
      warnings: ['Server was already installed, no changes made']
    };
  }

  const config = buildServerConfig(server);
  applyServerEnv(server, config);

  mcpJson[name] = config;
  saveMcpJson(mcpJson, projectPath);

  return { success: true, message: `Installed server (${scope}): ${name}`, server: name };
}

export function uninstallServer(name: string, projectPath?: string): MCPOperationResult {
  const { scope } = resolvePaths(projectPath);
  const mcpJson = loadMcpJson(projectPath);
  if (!(name in mcpJson)) {
    return { success: false, message: `Server not installed (${scope}): ${name}`, server: name };
  }
  if (isServerEnabled(name, projectPath)) disableServer(name, projectPath);
  delete mcpJson[name];
  saveMcpJson(mcpJson, projectPath);
  return { success: true, message: `Uninstalled server (${scope}): ${name}`, server: name };
}

export function enableServer(name: string, projectPath?: string): MCPOperationResult {
  const { scope } = resolvePaths(projectPath);
  if (!isServerInstalled(name, projectPath)) {
    return {
      success: false,
      message: `Server not installed: ${name}. Install it first with: lens mcp install ${name}${projectPath ? ' -p ' + projectPath : ''}`,
      server: name
    };
  }
  const enabled = getEnabledServers(projectPath);
  if (enabled.includes(name)) {
    return { success: true, message: `Server already enabled (${scope}): ${name}`, server: name, warnings: ['Server was already enabled, no changes made'] };
  }
  saveEnabledServers([...enabled, name], projectPath);
  return { success: true, message: `Enabled server (${scope}): ${name}`, server: name };
}

export function disableServer(name: string, projectPath?: string): MCPOperationResult {
  const { scope } = resolvePaths(projectPath);
  const enabled = getEnabledServers(projectPath);
  if (!enabled.includes(name)) {
    return { success: true, message: `Server already disabled (${scope}): ${name}`, server: name, warnings: ['Server was already disabled, no changes made'] };
  }
  saveEnabledServers(enabled.filter(s => s !== name), projectPath);
  return { success: true, message: `Disabled server (${scope}): ${name}`, server: name };
}

export function checkServer(name: string): EnvCheckResult {
  const server = getServer(name);

  if (!server) {
    return {
      ok: false,
      server: name,
      missing: [],
      found: []
    };
  }

  return checkRequiredEnv(server);
}

export function checkAllServers(projectPath?: string): EnvCheckResult[] {
  const mcpJson = loadMcpJson(projectPath);
  const results: EnvCheckResult[] = [];

  for (const name of Object.keys(mcpJson)) {
    results.push(checkServer(name));
  }

  return results;
}

export function listInstalledServers(projectPath?: string): Array<{
  name: string;
  enabled: boolean;
  config: MCPServerConfig;
}> {
  const mcpJson = loadMcpJson(projectPath);
  const enabledList = getEnabledServers(projectPath);

  return Object.entries(mcpJson).map(([name, config]) => ({
    name,
    enabled: enabledList.includes(name),
    config
  }));
}

/**
 * Install and enable a server in one operation
 * Used by profile application
 */
export function installAndEnableServer(
  name: string,
  options: { skipEnvCheck?: boolean; projectPath?: string } = {}
): MCPOperationResult {
  const { projectPath } = options;
  const installResult = installServer(name, options);

  if (!installResult.success) {
    return installResult;
  }

  const enableResult = enableServer(name, projectPath);

  return {
    success: enableResult.success,
    message: `${installResult.message}; ${enableResult.message}`,
    server: name,
    warnings: [...(installResult.warnings || []), ...(enableResult.warnings || [])]
  };
}

export function getMcpConfigPath(projectPath?: string): string {
  const { mcpJsonPath } = resolvePaths(projectPath);
  return mcpJsonPath;
}
