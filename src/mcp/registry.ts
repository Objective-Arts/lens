import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type {
  MCPServerDefinition,
  MCPRegistry,
  MCPListFilters,
  MCPServerCategory,
  EnvCheckResult
} from './types.js';
import { isRecord } from '../utils/validation.js';

const DEFAULT_REGISTRY_DIR = path.join(homedir(), '.claude', 'mcp-registry', 'servers');
const MAX_YAML_SIZE = 1024 * 1024; // 1 MB


/** Exported for tests that need to override the registry directory */
export function getRegistryDir(): string {
  return process.env['MCP_REGISTRY_DIR'] ?? DEFAULT_REGISTRY_DIR;
}

export function ensureRegistryDir(registryDir?: string): void {
  const dir = registryDir ?? getRegistryDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function hasValidTransport(obj: Record<string, unknown>): boolean {
  if (obj['type'] === 'stdio') return typeof obj['command'] === 'string';
  if (obj['type'] === 'http') return typeof obj['url'] === 'string';
  return false;
}

function isValidServerShape(value: unknown): value is MCPServerDefinition {
  if (!isRecord(value)) return false;
  if (typeof value['name'] !== 'string' || value['name'] === '') return false;
  return hasValidTransport(value);
}

export function loadRegistry(registryDir?: string): MCPRegistry {
  const dir = registryDir ?? getRegistryDir();
  ensureRegistryDir(dir);

  const servers = new Map<string, MCPServerDefinition>();

  const files = fs.readdirSync(dir).filter(f =>
    f.endsWith('.yaml') || f.endsWith('.yml')
  );

  for (const file of files) {
    try {
      const filePath = path.join(dir, file);

      const stat = fs.statSync(filePath);
      if (stat.size > MAX_YAML_SIZE) {
        console.error(`Registry file exceeds 1 MB size limit, skipping: ${file}`);
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed: unknown = parseYaml(content, { schema: 'core' });

      if (!isValidServerShape(parsed)) {
        console.error(`Registry file has invalid or missing required fields, skipping: ${file}`);
        continue;
      }

      servers.set(parsed.name, parsed);
    } catch (error) {
      console.error(`Failed to parse registry file: ${file}`, error);
    }
  }

  return { servers };
}

export function getServer(name: string, registryDir?: string): MCPServerDefinition | null {
  const registry = loadRegistry(registryDir);
  return registry.servers.get(name) || null;
}

export function listServers(filters?: MCPListFilters, registryDir?: string): MCPServerDefinition[] {
  const registry = loadRegistry(registryDir);
  let servers = Array.from(registry.servers.values());

  if (filters) {
    if (filters.category) {
      servers = servers.filter(s => s.category === filters.category);
    }

    if (filters.source) {
      servers = servers.filter(s => s.source === filters.source);
    }

    if (filters.tags && filters.tags.length > 0) {
      const filterTags = filters.tags;
      servers = servers.filter(s =>
        s.tags?.some(t => filterTags.includes(t))
      );
    }
  }

  return servers.sort((a, b) => a.name.localeCompare(b.name));
}

export function listCategories(registryDir?: string): MCPServerCategory[] {
  const registry = loadRegistry(registryDir);
  const categories = new Set<MCPServerCategory>();

  for (const server of registry.servers.values()) {
    categories.add(server.category);
  }

  return Array.from(categories).sort();
}

export function checkRequiredEnv(server: MCPServerDefinition): EnvCheckResult {
  const missing: string[] = [];
  const found: string[] = [];

  if (server.requiredEnv) {
    for (const envVar of server.requiredEnv) {
      if (process.env[envVar]) {
        found.push(envVar);
      } else {
        missing.push(envVar);
      }
    }
  }

  return {
    ok: missing.length === 0,
    server: server.name,
    missing,
    found
  };
}

function isValidServerName(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(name) && !name.includes('..');
}

export function addServerToRegistry(server: MCPServerDefinition, registryDir?: string): void {
  const dir = registryDir ?? getRegistryDir();
  ensureRegistryDir(dir);

  if (!isValidServerName(server.name)) {
    throw new Error(`Invalid server name: ${server.name}. Use only alphanumeric, dash, dot, underscore.`);
  }

  const filename = `${server.name}.yaml`;
  const filePath = path.join(dir, filename);

  const resolvedPath = path.resolve(filePath);
  const resolvedDir = path.resolve(dir);
  if (!resolvedPath.startsWith(resolvedDir + path.sep) && resolvedPath !== resolvedDir) {
    throw new Error(`Path traversal detected for server name: ${server.name}`);
  }

  const tmpPath = `${filePath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmpPath, stringifyYaml(server), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (cause) {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    throw new Error(`Failed to write server registry file: ${server.name}`, { cause });
  }
}

export function removeServerFromRegistry(name: string, registryDir?: string): boolean {
  const dir = registryDir ?? getRegistryDir();
  if (!isValidServerName(name)) {
    return false;
  }
  const filePath = path.join(dir, `${name}.yaml`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  // Try .yml extension
  const ymlPath = path.join(dir, `${name}.yml`);
  if (fs.existsSync(ymlPath)) {
    fs.unlinkSync(ymlPath);
    return true;
  }

  return false;
}
