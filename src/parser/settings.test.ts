/**
 * Tests for settings parser:
 * parseSettings — happy path, missing file, invalid JSON, bad shape, full object
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { parseSettings } from './settings.js';

describe('parseSettings', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-settings-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it('returns null when the file does not exist (ENOENT)', async () => {
    const result = await parseSettings(path.join(tmpDir, 'nonexistent.json'), 'global');
    expect(result).toBeNull();
  });

  it('parses a minimal valid settings file', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(filePath, '{}');

    const result = await parseSettings(filePath, 'global');

    expect(result).not.toBeNull();
    expect(result!.path).toBe(filePath);
    expect(result!.scope).toBe('global');
  });

  it('parses the model field', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(filePath, JSON.stringify({ model: 'claude-opus-4' }));

    const result = await parseSettings(filePath, 'project');

    expect(result!.model).toBe('claude-opus-4');
  });

  it('extracts mcpServers from enabledMcpjsonServers array', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(filePath, JSON.stringify({ enabledMcpjsonServers: ['server-a', 'server-b'] }));

    const result = await parseSettings(filePath, 'global');

    expect(result!.mcpServers).toEqual(['server-a', 'server-b']);
  });

  it('returns empty mcpServers when field is missing', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(filePath, '{}');

    const result = await parseSettings(filePath, 'global');

    expect(result!.mcpServers).toEqual([]);
  });

  it('filters non-string values from enabledMcpjsonServers', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(filePath, JSON.stringify({ enabledMcpjsonServers: ['valid', 42, null, 'also-valid'] }));

    const result = await parseSettings(filePath, 'global');

    expect(result!.mcpServers).toEqual(['valid', 'also-valid']);
  });

  it('parses a permissions object', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    const permissions = { allow: ['Bash', 'Read'], deny: [] };
    fs.writeFileSync(filePath, JSON.stringify({ permissions }));

    const result = await parseSettings(filePath, 'global');

    expect(result!.permissions).toEqual(permissions);
  });

  it('parses env variables', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(filePath, JSON.stringify({ env: { FOO: 'bar', BAZ: 'qux' } }));

    const result = await parseSettings(filePath, 'project');

    expect(result!.env).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('assigns undefined to env when field is an array', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(filePath, JSON.stringify({ env: ['not', 'an', 'object'] }));

    const result = await parseSettings(filePath, 'global');

    expect(result!.env).toBeUndefined();
  });

  it('preserves scope from argument', async () => {
    const filePath = path.join(tmpDir, 'settings.json');
    fs.writeFileSync(filePath, '{}');

    const project = await parseSettings(filePath, 'project');
    const plugin = await parseSettings(filePath, 'plugin');

    expect(project!.scope).toBe('project');
    expect(plugin!.scope).toBe('plugin');
  });

  // -------------------------------------------------------------------------
  // Error cases
  // -------------------------------------------------------------------------

  it('throws on invalid JSON (corrupted data)', async () => {
    const filePath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(filePath, '{ invalid json !!!');

    await expect(parseSettings(filePath, 'global')).rejects.toThrow('Invalid JSON in settings file');
  });

  it('throws on zero-byte file (empty JSON is also invalid)', async () => {
    const filePath = path.join(tmpDir, 'empty.json');
    fs.writeFileSync(filePath, '');

    await expect(parseSettings(filePath, 'global')).rejects.toThrow();
  });

  it('throws when settings is an array rather than object', async () => {
    const filePath = path.join(tmpDir, 'array.json');
    fs.writeFileSync(filePath, '["not", "an", "object"]');

    await expect(parseSettings(filePath, 'global')).rejects.toThrow('unexpected shape');
  });

  it('throws when settings is a string primitive', async () => {
    const filePath = path.join(tmpDir, 'string.json');
    fs.writeFileSync(filePath, '"just a string"');

    await expect(parseSettings(filePath, 'global')).rejects.toThrow('unexpected shape');
  });

  it('throws when settings is null', async () => {
    const filePath = path.join(tmpDir, 'null.json');
    fs.writeFileSync(filePath, 'null');

    await expect(parseSettings(filePath, 'global')).rejects.toThrow('unexpected shape');
  });
});
