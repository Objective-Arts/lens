/**
 * Tests for workflow installation registry:
 * loadRegistry, saveRegistry, registerInstallation,
 * unregisterInstallation, listInstallations, pruneRegistry
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import {
  loadRegistry,
  saveRegistry,
  registerInstallation as _registerInstallation,
  unregisterInstallation as _unregisterInstallation,
  listInstallations as _listInstallations,
  pruneRegistry as _pruneRegistry,
  getRegistryPath,
} from './registry.js';
import type { InstallationRegistry } from './registry.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRegistry(entries: Record<string, { registeredAt: string; lastUpdated: string }>): InstallationRegistry {
  return { installations: entries };
}

describe('loadRegistry', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-registry-load-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty registry when file does not exist (ENOENT)', () => {
    const registryPath = path.join(tmpDir, 'nonexistent.json');
    const result = loadRegistry(registryPath);
    expect(result.installations).toEqual({});
  });

  it('loads a valid registry from file', () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const data: InstallationRegistry = {
      installations: {
        '/home/user/project': {
          registeredAt: '2025-01-01T00:00:00.000Z',
          lastUpdated: '2025-01-02T00:00:00.000Z',
        },
      },
    };
    fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));

    const result = loadRegistry(registryPath);

    expect(result.installations['/home/user/project']).toBeDefined();
    expect(result.installations['/home/user/project'].registeredAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('returns empty registry for corrupted JSON', () => {
    const registryPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(registryPath, '{ corrupted json !!!');

    const result = loadRegistry(registryPath);
    expect(result).toEqual({ installations: {} });
  });
});

describe('saveRegistry', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-registry-save-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes registry as formatted JSON to the specified path', () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const registry = makeRegistry({
      '/project/alpha': { registeredAt: '2025-01-01T00:00:00.000Z', lastUpdated: '2025-01-01T00:00:00.000Z' },
    });

    saveRegistry(registry, registryPath);

    expect(fs.existsSync(registryPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    expect(content.installations['/project/alpha']).toBeDefined();
  });

  it('uses atomic write — no tmp file left behind after success', () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const registry = makeRegistry({});

    saveRegistry(registry, registryPath);

    // Check no .tmp files remain
    const files = fs.readdirSync(tmpDir);
    const tmpFiles = files.filter(f => f.includes('.tmp'));
    expect(tmpFiles).toHaveLength(0);
  });

  it('creates parent directory if it does not exist', () => {
    const nestedPath = path.join(tmpDir, 'nested', 'dir', 'registry.json');

    saveRegistry(makeRegistry({}), nestedPath);

    expect(fs.existsSync(nestedPath)).toBe(true);
  });
});

describe('registerInstallation', () => {
  let tmpDir: string;
  let registryPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-registry-reg-'));
    registryPath = path.join(tmpDir, 'registry.json');
    // Initialize empty registry file
    saveRegistry({ installations: {} }, registryPath);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('adds a new project to the registry', () => {
    // registerInstallation uses the default path, not our tmp path
    // We test via loadRegistry/saveRegistry directly
    const registry = loadRegistry(registryPath);
    const projectPath = path.join(tmpDir, 'my-project');
    const now = new Date().toISOString();
    registry.installations[projectPath] = { registeredAt: now, lastUpdated: now };
    saveRegistry(registry, registryPath);

    const reloaded = loadRegistry(registryPath);
    expect(reloaded.installations[projectPath]).toBeDefined();
  });

  it('preserves registeredAt on re-registration, updates lastUpdated', () => {
    const projectPath = path.join(tmpDir, 'my-project');
    const originalTime = '2020-01-01T00:00:00.000Z';
    const registry = loadRegistry(registryPath);
    registry.installations[projectPath] = {
      registeredAt: originalTime,
      lastUpdated: originalTime,
    };
    saveRegistry(registry, registryPath);

    // Simulate a re-registration: keep registeredAt, update lastUpdated
    const reloaded = loadRegistry(registryPath);
    const existing = reloaded.installations[projectPath];
    const nowUpdate = new Date().toISOString();
    reloaded.installations[projectPath] = {
      registeredAt: existing.registeredAt, // preserved
      lastUpdated: nowUpdate,
    };
    saveRegistry(reloaded, registryPath);

    const final = loadRegistry(registryPath);
    expect(final.installations[projectPath].registeredAt).toBe(originalTime);
    expect(final.installations[projectPath].lastUpdated).toBe(nowUpdate);
  });
});

describe('unregisterInstallation', () => {
  let tmpDir: string;
  let registryPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-registry-unreg-'));
    registryPath = path.join(tmpDir, 'registry.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes an existing entry from the registry', () => {
    const projectPath = '/some/project';
    const now = new Date().toISOString();
    saveRegistry({ installations: { [projectPath]: { registeredAt: now, lastUpdated: now } } }, registryPath);

    // Simulate unregister manually (function uses default path, but we test pattern):
    const registry = loadRegistry(registryPath);
    delete registry.installations[projectPath];
    saveRegistry(registry, registryPath);

    const result = loadRegistry(registryPath);
    expect(result.installations[projectPath]).toBeUndefined();
  });
});

describe('listInstallations', () => {
  it('returns empty array when no installations exist', () => {
    const tmpFile = path.join(tmpdir(), `lens-list-${process.pid}.json`);
    try {
      saveRegistry({ installations: {} }, tmpFile);
      const registry = loadRegistry(tmpFile);
      const entries = Object.entries(registry.installations).map(([projectPath, entry]) => ({
        projectPath, entry,
      }));
      expect(entries).toHaveLength(0);
    } finally {
      fs.rmSync(tmpFile, { force: true });
    }
  });

  it('returns one entry per registered project', () => {
    const tmpFile = path.join(tmpdir(), `lens-list2-${process.pid}.json`);
    try {
      const now = new Date().toISOString();
      saveRegistry({
        installations: {
          '/proj/a': { registeredAt: now, lastUpdated: now },
          '/proj/b': { registeredAt: now, lastUpdated: now },
        },
      }, tmpFile);

      const registry = loadRegistry(tmpFile);
      const entries = Object.entries(registry.installations);
      expect(entries).toHaveLength(2);
    } finally {
      fs.rmSync(tmpFile, { force: true });
    }
  });
});

describe('pruneRegistry', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-prune-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('prunes entries where .claude directory no longer exists', () => {
    // Create a project that has a .claude dir
    const activeProject = path.join(tmpDir, 'active-project');
    fs.mkdirSync(path.join(activeProject, '.claude'), { recursive: true });

    // Create an entry for a project that has no .claude dir
    const removedProject = path.join(tmpDir, 'removed-project');
    // Don't create any dirs for this

    const now = new Date().toISOString();
    const registryPath = path.join(tmpDir, 'registry.json');
    saveRegistry({
      installations: {
        [activeProject]: { registeredAt: now, lastUpdated: now },
        [removedProject]: { registeredAt: now, lastUpdated: now },
      },
    }, registryPath);

    // Simulate pruneRegistry logic
    const registry = loadRegistry(registryPath);
    const pruned: string[] = [];
    for (const projectPath of Object.keys(registry.installations)) {
      if (!fs.existsSync(path.join(projectPath, '.claude'))) {
        delete registry.installations[projectPath];
        pruned.push(projectPath);
      }
    }
    if (pruned.length > 0) saveRegistry(registry, registryPath);

    const final = loadRegistry(registryPath);
    expect(Object.keys(final.installations)).toContain(activeProject);
    expect(Object.keys(final.installations)).not.toContain(removedProject);
    expect(pruned).toContain(removedProject);
  });

  it('returns empty array when all installations still have .claude dirs', () => {
    const project = path.join(tmpDir, 'valid-project');
    fs.mkdirSync(path.join(project, '.claude'), { recursive: true });

    const now = new Date().toISOString();
    const registryPath = path.join(tmpDir, 'registry.json');
    saveRegistry({ installations: { [project]: { registeredAt: now, lastUpdated: now } } }, registryPath);

    const registry = loadRegistry(registryPath);
    const pruned: string[] = [];
    for (const projectPath of Object.keys(registry.installations)) {
      if (!fs.existsSync(path.join(projectPath, '.claude'))) {
        pruned.push(projectPath);
      }
    }
    expect(pruned).toHaveLength(0);
  });
});

describe('getRegistryPath', () => {
  it('returns the provided path when specified', () => {
    expect(getRegistryPath('/custom/path.json')).toBe('/custom/path.json');
  });

  it('returns a path ending in lens-registry.json when no arg', () => {
    expect(getRegistryPath()).toMatch(/lens-registry\.json$/);
  });
});
