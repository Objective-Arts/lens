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
  MCPServerDefinition,
  MCPServerConfig,
  MCPOperationResult,
  EnvCheckResult
} from './types.js';
import { getServer, checkRequiredEnv, resolveEnvVars } from './registry.js';

const GLOBAL_CLAUDE_DIR = path.join(homedir(), '.claude');

/**
 * Resolve paths for MCP config based on scope
 */
function resolvePaths(projectPath?: string): {
  mcpJsonPath: string;
  settingsJsonPath: string;
  scope: 'project' | 'global';
} {
  if (projectPath) {
    return {
      mcpJsonPath: path.join(projectPath, '.mcp.json'),
      settingsJsonPath: path.join(projectPath, '.claude', 'settings.json'),
      scope: 'project'
    };
  }
  return {
    mcpJsonPath: path.join(GLOBAL_CLAUDE_DIR, '.mcp.json'),
    settingsJsonPath: path.join(GLOBAL_CLAUDE_DIR, 'settings.json'),
    scope: 'global'
  };
}

/**
 * Load mcp.json (server definitions)
 * Format: { "mcpServers": { "name": { config } } }
 */
export function loadMcpJson(projectPath?: string): Record<string, MCPServerConfig> {
  const { mcpJsonPath } = resolvePaths(projectPath);

  if (!fs.existsSync(mcpJsonPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(mcpJsonPath, 'utf-8');
    const parsed = JSON.parse(content);
    // Handle both formats: { mcpServers: {...} } and raw { name: config }
    return parsed.mcpServers || parsed;
  } catch {
    return {};
  }
}

/**
 * Save mcp.json
 */
export function saveMcpJson(servers: Record<string, MCPServerConfig>, projectPath?: string): void {
  const { mcpJsonPath } = resolvePaths(projectPath);

  // Ensure directory exists for project-level config
  const dir = path.dirname(mcpJsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Use mcpServers wrapper format (Claude Code standard)
  const content = { mcpServers: servers };
  fs.writeFileSync(mcpJsonPath, JSON.stringify(content, null, 2), 'utf-8');
}

/**
 * Load settings.json
 */
export function loadSettings(projectPath?: string): Record<string, unknown> {
  const { settingsJsonPath } = resolvePaths(projectPath);

  if (!fs.existsSync(settingsJsonPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(settingsJsonPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Save settings.json
 */
export function saveSettings(settings: Record<string, unknown>, projectPath?: string): void {
  const { settingsJsonPath } = resolvePaths(projectPath);

  // Ensure directory exists
  const dir = path.dirname(settingsJsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(settingsJsonPath, JSON.stringify(settings, null, 2), 'utf-8');
}

/**
 * Get list of enabled MCP servers from settings.json
 */
export function getEnabledServers(projectPath?: string): string[] {
  const settings = loadSettings(projectPath);
  return (settings.enabledMcpjsonServers as string[]) || [];
}

/**
 * Check if a server is installed (exists in mcp.json)
 */
export function isServerInstalled(name: string, projectPath?: string): boolean {
  const mcpJson = loadMcpJson(projectPath);
  return name in mcpJson;
}

/**
 * Check if a server is enabled (in settings.json enabledMcpjsonServers)
 */
export function isServerEnabled(name: string, projectPath?: string): boolean {
  return getEnabledServers(projectPath).includes(name);
}

/**
 * Install a server from the registry to mcp.json
 */
export function installServer(
  name: string,
  options: { skipEnvCheck?: boolean; projectPath?: string } = {}
): MCPOperationResult {
  const { skipEnvCheck = false, projectPath } = options;
  const { scope } = resolvePaths(projectPath);
  const server = getServer(name);

  if (!server) {
    return {
      success: false,
      message: `Server not found in registry: ${name}`,
      server: name
    };
  }

  // Check required env vars unless skipped
  if (!skipEnvCheck && server.requiredEnv && server.requiredEnv.length > 0) {
    const envCheck = checkRequiredEnv(server);
    if (!envCheck.ok) {
      return {
        success: false,
        message: `Missing required environment variables: ${envCheck.missing.join(', ')}`,
        server: name,
        warnings: [`Set these variables in your shell: ${envCheck.missing.join(', ')}`]
      };
    }
  }

  // Build the server config
  const mcpJson = loadMcpJson(projectPath);

  if (mcpJson[name]) {
    return {
      success: true,
      message: `Server already installed (${scope}): ${name}`,
      server: name,
      warnings: ['Server was already installed, no changes made']
    };
  }

  const config: MCPServerConfig = {
    type: server.type
  };

  if (server.type === 'stdio') {
    config.command = server.command;
    config.args = server.args;
  } else if (server.type === 'http') {
    config.url = server.url;
  }

  // Resolve env var references to actual values
  if (server.env) {
    config.env = resolveEnvVars(server.env);
  }

  mcpJson[name] = config;
  saveMcpJson(mcpJson, projectPath);

  return {
    success: true,
    message: `Installed server (${scope}): ${name}`,
    server: name
  };
}

/**
 * Uninstall a server (remove from mcp.json)
 */
export function uninstallServer(name: string, projectPath?: string): MCPOperationResult {
  const { scope } = resolvePaths(projectPath);
  const mcpJson = loadMcpJson(projectPath);

  if (!(name in mcpJson)) {
    return {
      success: false,
      message: `Server not installed (${scope}): ${name}`,
      server: name
    };
  }

  // Also disable if enabled
  if (isServerEnabled(name, projectPath)) {
    disableServer(name, projectPath);
  }

  delete mcpJson[name];
  saveMcpJson(mcpJson, projectPath);

  return {
    success: true,
    message: `Uninstalled server (${scope}): ${name}`,
    server: name
  };
}

/**
 * Enable a server (add to settings.json enabledMcpjsonServers)
 */
export function enableServer(name: string, projectPath?: string): MCPOperationResult {
  const { scope } = resolvePaths(projectPath);

  // Check if installed first
  if (!isServerInstalled(name, projectPath)) {
    return {
      success: false,
      message: `Server not installed: ${name}. Install it first with: cc-config mcp install ${name}${projectPath ? ' -p ' + projectPath : ''}`,
      server: name
    };
  }

  const settings = loadSettings(projectPath);
  const enabled = (settings.enabledMcpjsonServers as string[]) || [];

  if (enabled.includes(name)) {
    return {
      success: true,
      message: `Server already enabled (${scope}): ${name}`,
      server: name,
      warnings: ['Server was already enabled, no changes made']
    };
  }

  enabled.push(name);
  settings.enabledMcpjsonServers = enabled;
  saveSettings(settings, projectPath);

  return {
    success: true,
    message: `Enabled server (${scope}): ${name}`,
    server: name
  };
}

/**
 * Disable a server (remove from settings.json enabledMcpjsonServers)
 */
export function disableServer(name: string, projectPath?: string): MCPOperationResult {
  const { scope } = resolvePaths(projectPath);
  const settings = loadSettings(projectPath);
  const enabled = (settings.enabledMcpjsonServers as string[]) || [];

  if (!enabled.includes(name)) {
    return {
      success: true,
      message: `Server already disabled (${scope}): ${name}`,
      server: name,
      warnings: ['Server was already disabled, no changes made']
    };
  }

  settings.enabledMcpjsonServers = enabled.filter(s => s !== name);
  saveSettings(settings, projectPath);

  return {
    success: true,
    message: `Disabled server (${scope}): ${name}`,
    server: name
  };
}

/**
 * Check a server's env vars
 */
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

/**
 * Check all installed servers' env vars
 */
export function checkAllServers(projectPath?: string): EnvCheckResult[] {
  const mcpJson = loadMcpJson(projectPath);
  const results: EnvCheckResult[] = [];

  for (const name of Object.keys(mcpJson)) {
    results.push(checkServer(name));
  }

  return results;
}

/**
 * List installed servers with their status
 */
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

/**
 * Get the path where MCP config will be written
 */
export function getMcpConfigPath(projectPath?: string): string {
  const { mcpJsonPath } = resolvePaths(projectPath);
  return mcpJsonPath;
}
