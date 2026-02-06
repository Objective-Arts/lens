import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { traceSkillConfig, formatTrace } from './index.js';
import type { TraceResult } from './index.js';

describe('traceSkillConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty yamlStack for project with no config files', () => {
    const result = traceSkillConfig(tmpDir, 'plan');
    expect(result.skill).toBe('plan');
    expect(result.phase).toBe('plan');
    expect(result.yamlStack).toEqual([]);
  });

  it('maps known skill names to phases', () => {
    expect(traceSkillConfig(tmpDir, 'plan').phase).toBe('plan');
    expect(traceSkillConfig(tmpDir, 'implement').phase).toBe('implement');
    expect(traceSkillConfig(tmpDir, 'test').phase).toBe('test');
    expect(traceSkillConfig(tmpDir, 'static-analysis').phase).toBe('static-analysis');
  });

  it('returns null phase for unknown skill names', () => {
    const result = traceSkillConfig(tmpDir, 'unknown-skill');
    expect(result.phase).toBeNull();
    expect(result.resolvedConfig).toEqual({
      experts: [],
      tools: [],
      keywords: [],
    });
  });

  it('reads profiles from CLAUDE.md in .claude directory', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir);
    fs.writeFileSync(
      path.join(claudeDir, 'CLAUDE.md'),
      '## Profiles Applied\n\n`typescript-cli`\n'
    );

    const result = traceSkillConfig(tmpDir, 'plan');
    // Profile won't be in yamlStack because the profile YAML file doesn't exist
    // in the expected location, but the function should not throw
    expect(result.yamlStack).toEqual([]);
  });

  it('reads profiles from root CLAUDE.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'CLAUDE.md'),
      '## Profiles Applied\n\n`base-tech`\n'
    );

    const result = traceSkillConfig(tmpDir, 'plan');
    expect(result.yamlStack).toEqual([]);
  });

  it('filters out invalid profile names from CLAUDE.md', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir);
    fs.writeFileSync(
      path.join(claudeDir, 'CLAUDE.md'),
      '## Profiles Applied\n\n`../../etc/passwd + valid-name`\n'
    );

    // Should not throw, and the traversal name should be filtered out
    const result = traceSkillConfig(tmpDir, 'plan');
    expect(result.yamlStack).toEqual([]);
  });

  it('handles missing CLAUDE.md gracefully', () => {
    const result = traceSkillConfig(tmpDir, 'plan');
    expect(result.yamlStack).toEqual([]);
  });

  it('returns correct structure for any skill', () => {
    const result = traceSkillConfig(tmpDir, 'implement');
    expect(result).toHaveProperty('skill', 'implement');
    expect(result).toHaveProperty('phase', 'implement');
    expect(result).toHaveProperty('yamlStack');
    expect(result).toHaveProperty('resolvedConfig');
    expect(result.resolvedConfig).toHaveProperty('experts');
    expect(result.resolvedConfig).toHaveProperty('tools');
    expect(result.resolvedConfig).toHaveProperty('keywords');
  });
});

describe('formatTrace', () => {
  it('formats empty trace', () => {
    const trace: TraceResult = {
      skill: 'plan',
      phase: 'plan',
      yamlStack: [],
      resolvedConfig: { experts: [], tools: [], keywords: [] },
    };

    const output = formatTrace(trace);
    expect(output).toContain('YAML Trace: /plan');
    expect(output).toContain('Phase: plan');
    expect(output).toContain('YAML Stack:');
    expect(output).toContain('experts: [] (none)');
  });

  it('formats trace with yaml sources', () => {
    const trace: TraceResult = {
      skill: 'implement',
      phase: 'implement',
      yamlStack: [
        {
          file: '/project/.claude/ralph-config.yaml',
          purpose: 'Ralph configuration',
          contributed: ['implement experts: typescript, react'],
        },
      ],
      resolvedConfig: {
        experts: ['typescript', 'react'],
        tools: [],
        keywords: [],
      },
    };

    const output = formatTrace(trace);
    expect(output).toContain('YAML Trace: /implement');
    expect(output).toContain('Ralph configuration');
    expect(output).toContain('implement experts: typescript, react');
    expect(output).toContain('experts: typescript, react');
  });

  it('formats trace with tools', () => {
    const trace: TraceResult = {
      skill: 'independent-review',
      phase: 'independent-review',
      yamlStack: [],
      resolvedConfig: {
        experts: [],
        tools: ['mcp__gemini-reviewer__gemini_review'],
        keywords: [],
      },
    };

    const output = formatTrace(trace);
    expect(output).toContain('tools: mcp__gemini-reviewer__gemini_review');
  });

  it('formats trace with keywords', () => {
    const trace: TraceResult = {
      skill: 'plan',
      phase: 'plan',
      yamlStack: [],
      resolvedConfig: {
        experts: ['security-expert'],
        tools: [],
        keywords: ['authentication'],
      },
    };

    const output = formatTrace(trace);
    expect(output).toContain('matched keywords: authentication');
  });

  it('formats trace without phase', () => {
    const trace: TraceResult = {
      skill: 'unknown',
      phase: null,
      yamlStack: [],
      resolvedConfig: { experts: [], tools: [], keywords: [] },
    };

    const output = formatTrace(trace);
    expect(output).toContain('YAML Trace: /unknown');
    expect(output).not.toContain('Phase:');
  });

  it('numbers yaml stack entries', () => {
    const trace: TraceResult = {
      skill: 'plan',
      phase: 'plan',
      yamlStack: [
        { file: '/a.yaml', purpose: 'First', contributed: ['a'] },
        { file: '/b.yaml', purpose: 'Second', contributed: ['b'] },
      ],
      resolvedConfig: { experts: [], tools: [], keywords: [] },
    };

    const output = formatTrace(trace);
    expect(output).toContain('1.');
    expect(output).toContain('2.');
    expect(output).toContain('First');
    expect(output).toContain('Second');
  });
});
