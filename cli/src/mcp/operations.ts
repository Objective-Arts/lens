/**
 * MCP Operations - install, uninstall, enable, disable servers
 *
 * Manages mcp.json (server definitions) and settings.json (enabled servers).
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

const CLAUDE_DIR = path.join(homedir(), '.claude');
const MCP_JSON_PATH = path.join(CLAUDE_DIR, 'mcp.json');
const SETTINGS_JSON_PATH = path.join(CLAUDE_DIR, 'settings.json');

/**
 * Load mcp.json (server definitions)
 */
export function loadMcpJson(): Record<string, MCPServerConfig> {
  if (!fs.existsSync(MCP_JSON_PATH)) {
    return {};
  }

  try {
    const content = fs.readFileSync(MCP_JSON_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Save mcp.json
 */
export function saveMcpJson(servers: Record<string, MCPServerConfig>): void {
  fs.writeFileSync(MCP_JSON_PATH, JSON.stringify(servers, null, 2), 'utf-8');
}

/**
 * Load settings.json
 */
export function loadSettings(): Record<string, unknown> {
  if (!fs.existsSync(SETTINGS_JSON_PATH)) {
    return {};
  }

  try {
    const content = fs.readFileSync(SETTINGS_JSON_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Save settings.json
 */
export function saveSettings(settings: Record<string, unknown>): void {
  fs.writeFileSync(SETTINGS_JSON_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

/**
 * Get list of enabled MCP servers from settings.json
 */
export function getEnabledServers(): string[] {
  const settings = loadSettings();
  return (settings.enabledMcpjsonServers as string[]) || [];
}

/**
 * Check if a server is installed (exists in mcp.json)
 */
export function isServerInstalled(name: string): boolean {
  const mcpJson = loadMcpJson();
  return name in mcpJson;
}

/**
 * Check if a server is enabled (in settings.json enabledMcpjsonServers)
 */
export function isServerEnabled(name: string): boolean {
  return getEnabledServers().includes(name);
}

/**
 * Install a server from the registry to mcp.json
 */
export function installServer(
  name: string,
  skipEnvCheck = false
): MCPOperationResult {
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
  const mcpJson = loadMcpJson();

  if (mcpJson[name]) {
    return {
      success: true,
      message: `Server already installed: ${name}`,
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
  saveMcpJson(mcpJson);

  return {
    success: true,
    message: `Installed server: ${name}`,
    server: name
  };
}

/**
 * Uninstall a server (remove from mcp.json)
 */
export function uninstallServer(name: string): MCPOperationResult {
  const mcpJson = loadMcpJson();

  if (!(name in mcpJson)) {
    return {
      success: false,
      message: `Server not installed: ${name}`,
      server: name
    };
  }

  // Also disable if enabled
  if (isServerEnabled(name)) {
    disableServer(name);
  }

  delete mcpJson[name];
  saveMcpJson(mcpJson);

  return {
    success: true,
    message: `Uninstalled server: ${name}`,
    server: name
  };
}

/**
 * Enable a server (add to settings.json enabledMcpjsonServers)
 */
export function enableServer(name: string): MCPOperationResult {
  // Check if installed first
  if (!isServerInstalled(name)) {
    return {
      success: false,
      message: `Server not installed: ${name}. Install it first with: cc-config mcp install ${name}`,
      server: name
    };
  }

  const settings = loadSettings();
  const enabled = (settings.enabledMcpjsonServers as string[]) || [];

  if (enabled.includes(name)) {
    return {
      success: true,
      message: `Server already enabled: ${name}`,
      server: name,
      warnings: ['Server was already enabled, no changes made']
    };
  }

  enabled.push(name);
  settings.enabledMcpjsonServers = enabled;
  saveSettings(settings);

  return {
    success: true,
    message: `Enabled server: ${name}`,
    server: name
  };
}

/**
 * Disable a server (remove from settings.json enabledMcpjsonServers)
 */
export function disableServer(name: string): MCPOperationResult {
  const settings = loadSettings();
  const enabled = (settings.enabledMcpjsonServers as string[]) || [];

  if (!enabled.includes(name)) {
    return {
      success: true,
      message: `Server already disabled: ${name}`,
      server: name,
      warnings: ['Server was already disabled, no changes made']
    };
  }

  settings.enabledMcpjsonServers = enabled.filter(s => s !== name);
  saveSettings(settings);

  return {
    success: true,
    message: `Disabled server: ${name}`,
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
export function checkAllServers(): EnvCheckResult[] {
  const mcpJson = loadMcpJson();
  const results: EnvCheckResult[] = [];

  for (const name of Object.keys(mcpJson)) {
    results.push(checkServer(name));
  }

  return results;
}

/**
 * List installed servers with their status
 */
export function listInstalledServers(): Array<{
  name: string;
  enabled: boolean;
  config: MCPServerConfig;
}> {
  const mcpJson = loadMcpJson();
  const enabledList = getEnabledServers();

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
  skipEnvCheck = false
): MCPOperationResult {
  const installResult = installServer(name, skipEnvCheck);

  if (!installResult.success) {
    return installResult;
  }

  const enableResult = enableServer(name);

  return {
    success: enableResult.success,
    message: `${installResult.message}; ${enableResult.message}`,
    server: name,
    warnings: [...(installResult.warnings || []), ...(enableResult.warnings || [])]
  };
}
