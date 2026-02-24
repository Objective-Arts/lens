/**
 * MCP server application for profile application.
 */

import * as fsPromises from 'fs/promises';
import * as path from 'path';
import type { ComposableProfile, MCPServerCategory } from '../types.js';
import {
  getServer,
  isServerInstalled,
  installAndEnableServer,
  enableServer,
  disableServer,
  listServers,
  checkRequiredEnv
} from '../mcp/index.js';
import { MCP_SERVERS_DIR } from './paths.js';

/** Result subset needed by MCP application */
interface McpApplyResult {
  created: string[];
  skipped: string[];
  errors: string[];
  warnings: string[];
}

type McpJsonConfig = { mcpServers: Record<string, { type: string; command: string; args: string[]; env?: Record<string, string> }> };

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

export async function applyMcpToProject(profile: ComposableProfile, projectPath: string, result: McpApplyResult): Promise<void> {
  if (profile.mcpServers) {
    const mcpResult = await applyMcpServers(profile.mcpServers);
    result.created.push(...mcpResult.created);
    result.skipped.push(...mcpResult.skipped);
    result.errors.push(...mcpResult.errors);

    const mcpJsonResult = await createProjectMcpJson(projectPath);
    switch (mcpJsonResult.status) {
      case 'created': {
        const addedServers = mcpJsonResult.added?.join(', ') || 'validation servers';
        result.created.push(`.mcp.json (added: ${addedServers})`);
        if (mcpJsonResult.warning) result.warnings.push(mcpJsonResult.warning);
        break;
      }
      case 'skipped':
        result.skipped.push('.mcp.json (all required servers present)');
        break;
      case 'error':
        result.errors.push(`.mcp.json: ${mcpJsonResult.error}`);
        break;
    }
  }
}
