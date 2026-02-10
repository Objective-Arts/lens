import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { parseClaudeMd } from './claude-md.js';

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(tmpdir(), 'claude-md-test-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function writeMd(content: string): string {
  const filePath = path.join(tempDir, 'CLAUDE.md');
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('parseClaudeMd', () => {
  it('returns null for missing file', async () => {
    const result = await parseClaudeMd('/nonexistent/CLAUDE.md', 'project');
    expect(result).toBeNull();
  });

  it('parses empty file', async () => {
    const filePath = writeMd('');
    const result = await parseClaudeMd(filePath, 'project');
    expect(result).not.toBeNull();
    expect(result!.autoInvokes).toHaveLength(0);
    expect(result!.skillReferences).toHaveLength(0);
  });

  it('extracts auto-invoke table entries', async () => {
    const content = `## Auto-Invoke Skills

| Context | Action |
|---------|--------|
| Writing any code | INVOKE \`/clarity\` |
| Security-sensitive code | INVOKE \`/security-mindset\` then \`/owasp\` |
`;
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    expect(result!.autoInvokes.length).toBeGreaterThanOrEqual(1);
    const clarityInvoke = result!.autoInvokes.find(a => a.skillName === 'clarity');
    expect(clarityInvoke).toBeDefined();
    expect(clarityInvoke!.context).toBe('Writing any code');
  });

  it('skips table header rows', async () => {
    const content = `| Context | Action |
|---------|--------|
| Writing tests | INVOKE \`/test-doubles\` |
`;
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    const headerMatch = result!.autoInvokes.find(a => a.context.toLowerCase() === 'context');
    expect(headerMatch).toBeUndefined();
  });

  it('extracts skill references from invoke statements', async () => {
    const content = `Invoke /clarity when writing code.
Invoke /security-mindset for auth code.
Skills: \`test-doubles\`
`;
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    expect(result!.skillReferences).toContain('clarity');
    expect(result!.skillReferences).toContain('security-mindset');
  });

  it('extracts slash command references', async () => {
    const content = `Run /build to build.
Use /improve for existing code.
Try /gemini-fix for review.
`;
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    expect(result!.commandReferences).toContain('build');
    expect(result!.commandReferences).toContain('improve');
    expect(result!.commandReferences).toContain('gemini-fix');
  });

  it('filters out common non-command words', async () => {
    const content = `Type /help for assistance.
Run /clear to reset.
`;
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    expect(result!.commandReferences).not.toContain('help');
    expect(result!.commandReferences).not.toContain('clear');
  });

  it('extracts agent references', async () => {
    const content = `Use the explore agent for codebase search.
Agents: code-reviewer
`;
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    expect(result!.agentReferences.length).toBeGreaterThan(0);
  });

  it('extracts markdown sections by heading', async () => {
    const content = `# Main Title

Some intro text.

## Standards

- Clarity over cleverness
- Data structures first

## Anti-Patterns

- God objects
- Deep inheritance
`;
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    expect(result!.sections).toHaveProperty('standards');
    expect(result!.sections['standards']).toContain('Clarity over cleverness');
    expect(result!.sections).toHaveProperty('anti-patterns');
    expect(result!.sections['anti-patterns']).toContain('God objects');
  });

  it('preserves raw content', async () => {
    const content = '# Test\n\nSome content here.';
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    expect(result!.rawContent).toBe(content);
  });

  it('stores path and scope', async () => {
    const filePath = writeMd('# Test');
    const result = await parseClaudeMd(filePath, 'global');
    expect(result!.path).toBe(filePath);
    expect(result!.scope).toBe('global');
  });

  it('deduplicates auto-invoke entries with same context and skill', async () => {
    const content = `| Context | Action |
|---------|--------|
| Writing code | INVOKE \`/clarity\` |
| Writing code | INVOKE \`/clarity\` |
`;
    const filePath = writeMd(content);
    const result = await parseClaudeMd(filePath, 'project');
    const clarityInvokes = result!.autoInvokes.filter(a => a.skillName === 'clarity');
    expect(clarityInvokes).toHaveLength(1);
  });
});
