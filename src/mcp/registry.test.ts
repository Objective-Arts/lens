/**
 * Tests for MCP registry operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadRegistry,
  getServer,
  listServers,
  listCategories,
  checkRequiredEnv,
  resolveEnvVars
} from './registry.js';
import type { MCPServerDefinition } from './types.js';

describe('resolveEnvVars', () => {
  beforeEach(() => {
    process.env.TEST_VAR = 'test-value';
    process.env.API_KEY = 'secret-key';
  });

  afterEach(() => {
    delete process.env.TEST_VAR;
    delete process.env.API_KEY;
  });

  it('resolves ${VAR} syntax to env values', () => {
    const env = {
      MY_VAR: '${TEST_VAR}',
      KEY: '${API_KEY}'
    };

    const resolved = resolveEnvVars(env);

    expect(resolved.MY_VAR).toBe('test-value');
    expect(resolved.KEY).toBe('secret-key');
  });

  it('leaves literal values unchanged', () => {
    const env = {
      LITERAL: 'some-value',
      NUMBER: '123'
    };

    const resolved = resolveEnvVars(env);

    expect(resolved.LITERAL).toBe('some-value');
    expect(resolved.NUMBER).toBe('123');
  });

  it('returns empty string for missing env vars', () => {
    const env = {
      MISSING: '${DOES_NOT_EXIST}'
    };

    const resolved = resolveEnvVars(env);

    expect(resolved.MISSING).toBe('');
  });
});

describe('checkRequiredEnv', () => {
  beforeEach(() => {
    process.env.EXISTING_VAR = 'value';
  });

  afterEach(() => {
    delete process.env.EXISTING_VAR;
  });

  it('returns ok: true when no env vars required', () => {
    const server: MCPServerDefinition = {
      name: 'test-server',
      description: 'Test',
      type: 'stdio',
      command: 'node',
      category: 'development',
      source: 'custom'
    };

    const result = checkRequiredEnv(server);

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('returns ok: true when all env vars present', () => {
    const server: MCPServerDefinition = {
      name: 'test-server',
      description: 'Test',
      type: 'stdio',
      command: 'node',
      category: 'development',
      source: 'custom',
      requiredEnv: ['EXISTING_VAR']
    };

    const result = checkRequiredEnv(server);

    expect(result.ok).toBe(true);
    expect(result.found).toContain('EXISTING_VAR');
    expect(result.missing).toEqual([]);
  });

  it('returns ok: false when env vars missing', () => {
    const server: MCPServerDefinition = {
      name: 'test-server',
      description: 'Test',
      type: 'stdio',
      command: 'node',
      category: 'development',
      source: 'custom',
      requiredEnv: ['MISSING_VAR', 'ANOTHER_MISSING']
    };

    const result = checkRequiredEnv(server);

    expect(result.ok).toBe(false);
    expect(result.missing).toContain('MISSING_VAR');
    expect(result.missing).toContain('ANOTHER_MISSING');
  });

  it('reports partial env var availability', () => {
    const server: MCPServerDefinition = {
      name: 'test-server',
      description: 'Test',
      type: 'stdio',
      command: 'node',
      category: 'development',
      source: 'custom',
      requiredEnv: ['EXISTING_VAR', 'MISSING_VAR']
    };

    const result = checkRequiredEnv(server);

    expect(result.ok).toBe(false);
    expect(result.found).toContain('EXISTING_VAR');
    expect(result.missing).toContain('MISSING_VAR');
  });
});

describe('loadRegistry', () => {
  it('returns empty registry if directory does not exist', () => {
    // This tests against the actual registry directory
    // If it exists, we should get servers; if not, empty
    const registry = loadRegistry();
    expect(registry).toHaveProperty('servers');
    expect(registry.servers).toBeInstanceOf(Map);
  });
});

describe('listServers', () => {
  it('returns servers with required properties', () => {
    const servers = listServers();
    expect(Array.isArray(servers)).toBe(true);
    // Every server should have required fields
    for (const server of servers) {
      expect(server.name).toBeTruthy();
      expect(server.category).toBeTruthy();
    }
  });

  it('filters by category returning only matching servers', () => {
    const devServers = listServers({ category: 'development' });
    expect(Array.isArray(devServers)).toBe(true);
    // All returned servers must match the filter
    for (const server of devServers) {
      expect(server.category).toBe('development');
    }
  });

  it('filters by source returning only matching servers', () => {
    const officialServers = listServers({ source: 'official' });
    expect(Array.isArray(officialServers)).toBe(true);
    // All returned servers must match the filter
    for (const server of officialServers) {
      expect(server.source).toBe('official');
    }
  });

  it('returns servers sorted alphabetically by name', () => {
    const servers = listServers();
    const names = servers.map(s => s.name);
    const sorted = [...names].sort();
    // Should always be sorted, even with 0 or 1 servers
    expect(names).toEqual(sorted);
  });
});

describe('listCategories', () => {
  it('returns categories as unique strings', () => {
    const categories = listCategories();
    expect(Array.isArray(categories)).toBe(true);
    // All categories should be non-empty strings
    for (const cat of categories) {
      expect(typeof cat).toBe('string');
      expect(cat.length).toBeGreaterThan(0);
    }
    // Should be unique
    const unique = [...new Set(categories)];
    expect(categories.length).toBe(unique.length);
  });

  it('returns categories sorted alphabetically', () => {
    const categories = listCategories();
    const sorted = [...categories].sort();
    expect(categories).toEqual(sorted);
  });
});

describe('getServer', () => {
  it('returns null for non-existent server', () => {
    const server = getServer('definitely-does-not-exist-xyz');
    expect(server).toBeNull();
  });

  it('returns complete server definition when found', () => {
    const servers = listServers();
    // Test behavior: if servers exist, getServer should return matching definition
    for (const listedServer of servers.slice(0, 3)) { // Test first 3 max
      const server = getServer(listedServer.name);
      expect(server).not.toBeNull();
      expect(server?.name).toBe(listedServer.name);
      expect(server?.category).toBe(listedServer.category);
      expect(server?.description).toBeTruthy();
    }
  });
});
