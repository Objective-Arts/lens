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
import { isEnoent } from '../utils/fs.js';

/** Result subset needed by MCP application */
interface McpApplyResult {
  created: string[];
  skipped: string[];
  errors: string[];
  warnings: string[];
}

type McpJsonConfig = { mcpServers: Record<string, { type: string; command: string; args: string[]; env?: Record<string, string> }> };
type EnableResult = { created: string[]; skipped: string[]; errors: string[] };

function handleMissingServer(serverName: string, requireAll: boolean, result: EnableResult): void {
  const msg = `MCP server ${serverName} not in registry`;
  if (requireAll) {
    result.errors.push(msg);
  } else {
    result.skipped.push(`${msg} (skipping)`);
  }
}

function handleMissingEnv(serverName: string, missing: string[], requireAll: boolean, result: EnableResult): void {
  const msg = `MCP server ${serverName} requires: ${missing.join(', ')}`;
  if (requireAll) {
    result.errors.push(msg);
  } else {
    result.skipped.push(`${msg} - set env vars to enable`);
  }
}

function enableOrInstallServer(serverName: string, projectPath: string, result: EnableResult): void {
  if (isServerInstalled(serverName, projectPath)) {
    const r = enableServer(serverName, projectPath);
    result[r.success ? 'created' : 'skipped'].push(`MCP server ${serverName}: ${r.success ? 'enabled' : r.message}`);
  } else {
    const r = installAndEnableServer(serverName, { projectPath });
    result[r.success ? 'created' : 'errors'].push(`MCP server ${serverName}: ${r.success ? 'installed and enabled' : r.message}`);
  }
}

function enableMcpServer(
  serverName: string,
  projectPath: string,
  requireAll: boolean,
  result: EnableResult
): void {
  const serverDef = getServer(serverName);
  if (!serverDef) {
    handleMissingServer(serverName, requireAll, result);
    return;
  }

  if (serverDef.requiredEnv?.length) {
    const envCheck = checkRequiredEnv(serverDef);
    if (!envCheck.ok) {
      handleMissingEnv(serverName, envCheck.missing, requireAll, result);
      return;
    }
  }

  enableOrInstallServer(serverName, projectPath, result);
}

function collectServersToEnable(mcpConfig: {
  enable?: string[];
  disable?: string[];
  categories?: MCPServerCategory[];
}): Set<string> {
  const serversToEnable = new Set<string>(mcpConfig.enable ?? []);

  if (mcpConfig.categories) {
    for (const category of mcpConfig.categories) {
      for (const server of listServers({ category })) serversToEnable.add(server.name);
    }
  }

  for (const server of mcpConfig.disable ?? []) serversToEnable.delete(server);
  return serversToEnable;
}

function applyDisableServers(disable: string[], projectPath: string, result: EnableResult): void {
  for (const serverName of disable) {
    const r = disableServer(serverName, projectPath);
    if (r.success && !r.warnings?.length) result.created.push(`MCP server ${serverName}: disabled`);
  }
}

async function applyMcpServers(mcpConfig: {
  enable?: string[];
  disable?: string[];
  categories?: MCPServerCategory[];
  requireAll?: boolean;
}, projectPath: string): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const result = { created: [] as string[], skipped: [] as string[], errors: [] as string[] };
  const requireAll = mcpConfig.requireAll ?? false;

  const serversToEnable = collectServersToEnable(mcpConfig);
  for (const serverName of serversToEnable) enableMcpServer(serverName, projectPath, requireAll, result);

  applyDisableServers(mcpConfig.disable ?? [], projectPath, result);

  return result;
}

async function addMcpServerIfMissing(config: McpJsonConfig, name: string, serverPath: string, added: string[]): Promise<void> {
  if (config.mcpServers[name]) return;
  try {
    await fsPromises.access(serverPath);
    config.mcpServers[name] = { type: 'stdio', command: 'node', args: [serverPath] };
    added.push(name);
  } catch (e) {
    if (isEnoent(e)) return;
    throw new Error(`Failed to check MCP server path: ${serverPath}`, { cause: e });
  }
}

async function readMcpJsonConfig(targetPath: string): Promise<{ config: McpJsonConfig; error?: string }> {
  try {
    const config = JSON.parse(await fsPromises.readFile(targetPath, 'utf-8')) as McpJsonConfig;
    if (!config.mcpServers) config.mcpServers = {};
    return { config };
  } catch (e) {
    if (isEnoent(e)) return { config: { mcpServers: {} } };
    return { config: { mcpServers: {} }, error: e instanceof Error ? e.message : String(e) };
  }
}

async function writeMcpJsonConfig(
  targetPath: string,
  mcpConfig: McpJsonConfig,
  added: string[]
): Promise<{ status: 'created' | 'skipped' | 'error'; warning?: string; error?: string; added?: string[] }> {
  if (added.length === 0) return { status: 'skipped' };
  const warning = Object.keys(mcpConfig.mcpServers).length === 0 ? 'No MCP servers found' : undefined;
  const tmpPath = `${targetPath}.tmp.${process.pid}`;
  try {
    await fsPromises.writeFile(tmpPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    await fsPromises.rename(tmpPath, targetPath);
    return { status: 'created', warning, added };
  } catch (error) {
    try { await fsPromises.unlink(tmpPath); } catch { /* ignore */ }
    return { status: 'error', error: error instanceof Error ? error.message : String(error) };
  }
}

/** Create or update project-level .mcp.json with required MCP servers */
export async function createProjectMcpJson(projectPath: string): Promise<{ status: 'created' | 'skipped' | 'error'; warning?: string; error?: string; added?: string[] }> {
  const targetPath = path.join(projectPath, '.mcp.json');

  const { config: mcpConfig, error: readError } = await readMcpJsonConfig(targetPath);
  if (readError) return { status: 'error', error: readError };

  const added: string[] = [];
  await addMcpServerIfMissing(mcpConfig, 'gemini-reviewer', path.join(MCP_SERVERS_DIR, 'gemini-reviewer', 'index.js'), added);
  await addMcpServerIfMissing(mcpConfig, 'qodana', path.join(MCP_SERVERS_DIR, 'qodana', 'dist', 'index.js'), added);

  return writeMcpJsonConfig(targetPath, mcpConfig, added);
}

export async function applyMcpToProject(profile: ComposableProfile, projectPath: string, mcpReport: McpApplyResult): Promise<void> {
  if (profile.mcpServers) {
    const mcpResult = await applyMcpServers(profile.mcpServers, projectPath);
    mcpReport.created.push(...mcpResult.created);
    mcpReport.skipped.push(...mcpResult.skipped);
    mcpReport.errors.push(...mcpResult.errors);

    const mcpJsonResult = await createProjectMcpJson(projectPath);
    switch (mcpJsonResult.status) {
      case 'created': {
        const addedServers = mcpJsonResult.added?.join(', ') || 'validation servers';
        mcpReport.created.push(`.mcp.json (added: ${addedServers})`);
        if (mcpJsonResult.warning) mcpReport.warnings.push(mcpJsonResult.warning);
        break;
      }
      case 'skipped':
        mcpReport.skipped.push('.mcp.json (all required servers present)');
        break;
      case 'error':
        mcpReport.errors.push(`.mcp.json: ${mcpJsonResult.error}`);
        break;
    }
  }
}
