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
    expect(result.yamlStack).toEqual([]);
  });

  it('reads profiles from CLAUDE.md in .claude directory', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir);
    fs.writeFileSync(
      path.join(claudeDir, 'CLAUDE.md'),
      '## Profiles Applied\n\n`nonexistent-profile-xyzzy`\n'
    );

    const result = traceSkillConfig(tmpDir, 'plan');
    // Profile won't be in yamlStack because the profile YAML file doesn't exist
    expect(result.yamlStack).toEqual([]);
  });

  it('reads profiles from root CLAUDE.md', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'CLAUDE.md'),
      '## Profiles Applied\n\n`nonexistent-profile-xyzzy`\n'
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
    expect(result).toHaveProperty('yamlStack');
  });
});

describe('formatTrace', () => {
  it('formats empty trace', () => {
    const trace: TraceResult = {
      skill: 'plan',
      yamlStack: [],
    };

    const output = formatTrace(trace);
    expect(output).toContain('YAML Trace: /plan');
    expect(output).toContain('YAML Stack:');
  });

  it('formats trace with yaml sources', () => {
    const trace: TraceResult = {
      skill: 'implement',
      yamlStack: [
        {
          file: '/project/profiles/javascript.yaml',
          purpose: 'Profile: javascript',
          contributed: ['canon skills: 12'],
        },
      ],
    };

    const output = formatTrace(trace);
    expect(output).toContain('YAML Trace: /implement');
    expect(output).toContain('Profile: javascript');
    expect(output).toContain('canon skills: 12');
  });

  it('numbers yaml stack entries', () => {
    const trace: TraceResult = {
      skill: 'plan',
      yamlStack: [
        { file: '/a.yaml', purpose: 'First', contributed: ['a'] },
        { file: '/b.yaml', purpose: 'Second', contributed: ['b'] },
      ],
    };

    const output = formatTrace(trace);
    expect(output).toContain('1.');
    expect(output).toContain('2.');
    expect(output).toContain('First');
    expect(output).toContain('Second');
  });
});
