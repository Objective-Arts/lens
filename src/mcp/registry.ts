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

const REGISTRY_DIR = path.join(homedir(), '.claude', 'mcp-registry', 'servers');

export function ensureRegistryDir(): void {
  if (!fs.existsSync(REGISTRY_DIR)) {
    fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  }
}

export function loadRegistry(): MCPRegistry {
  ensureRegistryDir();

  const servers = new Map<string, MCPServerDefinition>();

  const files = fs.readdirSync(REGISTRY_DIR).filter(f =>
    f.endsWith('.yaml') || f.endsWith('.yml')
  );

  for (const file of files) {
    try {
      const filePath = path.join(REGISTRY_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const server = parseYaml(content) as MCPServerDefinition;

      if (server && server.name) {
        servers.set(server.name, server);
      }
    } catch (error) {
      console.error(`Failed to parse registry file: ${file}`, error);
    }
  }

  return { servers };
}

export function getServer(name: string): MCPServerDefinition | null {
  const registry = loadRegistry();
  return registry.servers.get(name) || null;
}

export function listServers(filters?: MCPListFilters): MCPServerDefinition[] {
  const registry = loadRegistry();
  let servers = Array.from(registry.servers.values());

  if (filters) {
    if (filters.category) {
      servers = servers.filter(s => s.category === filters.category);
    }

    if (filters.source) {
      servers = servers.filter(s => s.source === filters.source);
    }

    if (filters.tags && filters.tags.length > 0) {
      servers = servers.filter(s =>
        s.tags?.some(t => filters.tags!.includes(t))
      );
    }
  }

  return servers.sort((a, b) => a.name.localeCompare(b.name));
}

export function listCategories(): MCPServerCategory[] {
  const registry = loadRegistry();
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

export function addServerToRegistry(server: MCPServerDefinition): void {
  ensureRegistryDir();

  if (!isValidServerName(server.name)) {
    throw new Error(`Invalid server name: ${server.name}. Use only alphanumeric, dash, dot, underscore.`);
  }

  const filename = `${server.name}.yaml`;
  const filePath = path.join(REGISTRY_DIR, filename);

  fs.writeFileSync(filePath, stringifyYaml(server), 'utf-8');
}

export function removeServerFromRegistry(name: string): boolean {
  if (!isValidServerName(name)) {
    return false;
  }
  const filePath = path.join(REGISTRY_DIR, `${name}.yaml`);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  // Try .yml extension
  const ymlPath = path.join(REGISTRY_DIR, `${name}.yml`);
  if (fs.existsSync(ymlPath)) {
    fs.unlinkSync(ymlPath);
    return true;
  }

  return false;
}

/**
 * Resolve env var references in a config
 * Converts ${VAR} to actual environment variable value
 */
export function resolveEnvVars(env: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (value.startsWith('${') && value.endsWith('}')) {
      const envVarName = value.slice(2, -1);
      const envValue = process.env[envVarName];
      if (envValue === undefined) {
        throw new Error(`Required environment variable not set: ${envVarName}`);
      }
      resolved[key] = envValue;
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
