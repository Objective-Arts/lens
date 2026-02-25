/**
 * Tests for json-adapter: ensureProject, writeRun, listRuns, penaltyToScore, scoreToVerdict
 *
 * Covers WI-12 scenarios:
 * - ensureProject creates new project.json when none exists
 * - ensureProject updates existing valid project.json
 * - ensureProject handles corrupt project.json gracefully
 * - writeRun produces valid JSON with correct structure
 * - listRuns respects the limit parameter
 * - listRuns skips corrupt files silently
 * - penaltyToScore(0) === 100, penaltyToScore(130) === 0
 * - scoreToVerdict thresholds: 90+, 70+, 50+, below 50
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import {
  ensureProject,
  writeRun,
  listRuns,
  penaltyToScore,
  scoreToVerdict,
  type RunInput,
  type RawFinding
} from './json-adapter.js';

// ---------------------------------------------------------------------------
// penaltyToScore — pure function, no I/O
// ---------------------------------------------------------------------------

describe('penaltyToScore', () => {
  it('returns 100 when penalty is 0', () => {
    expect(penaltyToScore(0)).toBe(100);
  });

  it('returns 0 when penalty is 130 (maximum)', () => {
    expect(penaltyToScore(130)).toBe(0);
  });

  it('clamps values above 130 to 0', () => {
    expect(penaltyToScore(200)).toBe(0);
  });

  it('clamps negative values to 100', () => {
    expect(penaltyToScore(-10)).toBe(100);
  });

  it('returns 50 for halfway penalty (65)', () => {
    expect(penaltyToScore(65)).toBe(50);
  });

  it('always returns integer result', () => {
    for (const p of [1, 33, 50, 99, 130]) {
      const score = penaltyToScore(p);
      expect(Number.isInteger(score)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// scoreToVerdict — pure function, no I/O
// ---------------------------------------------------------------------------

describe('scoreToVerdict', () => {
  it('returns production-ready at exactly 90', () => {
    expect(scoreToVerdict(90)).toBe('production-ready');
  });

  it('returns production-ready above 90', () => {
    expect(scoreToVerdict(100)).toBe('production-ready');
    expect(scoreToVerdict(95)).toBe('production-ready');
  });

  it('returns needs-attention at exactly 70', () => {
    expect(scoreToVerdict(70)).toBe('needs-attention');
  });

  it('returns needs-attention between 70 and 89', () => {
    expect(scoreToVerdict(89)).toBe('needs-attention');
    expect(scoreToVerdict(75)).toBe('needs-attention');
  });

  it('returns needs-work at exactly 50', () => {
    expect(scoreToVerdict(50)).toBe('needs-work');
  });

  it('returns needs-work between 50 and 69', () => {
    expect(scoreToVerdict(69)).toBe('needs-work');
    expect(scoreToVerdict(55)).toBe('needs-work');
  });

  it('returns needs-rework below 50', () => {
    expect(scoreToVerdict(49)).toBe('needs-rework');
    expect(scoreToVerdict(0)).toBe('needs-rework');
  });
});

// ---------------------------------------------------------------------------
// ensureProject — filesystem I/O
// ---------------------------------------------------------------------------

describe('ensureProject', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-ensureProject-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates project.json when none exists', async () => {
    const project = await ensureProject(tmpDir, { language: 'typescript', framework: 'nextjs' });

    expect(project.version).toBe(1);
    expect(project.id).toBeTruthy();
    expect(project.language).toBe('typescript');
    expect(project.framework).toBe('nextjs');
    expect(project.name).toBe(path.basename(tmpDir));

    const written = JSON.parse(
      fs.readFileSync(path.join(tmpDir, '.lens', 'project.json'), 'utf-8')
    );
    expect(written.id).toBe(project.id);
  });

  it('updates language/framework on existing valid project.json', async () => {
    // Create initial project
    const first = await ensureProject(tmpDir, { language: 'javascript', framework: null });

    // Re-run with updated stack info
    const second = await ensureProject(tmpDir, { language: 'typescript', framework: 'react' });

    // ID must be preserved
    expect(second.id).toBe(first.id);
    // Language and framework updated
    expect(second.language).toBe('typescript');
    expect(second.framework).toBe('react');
    // updatedAt changes
    expect(second.updatedAt).toBeTruthy();
  });

  it('handles corrupt project.json by creating a fresh one', async () => {
    const lensDir = path.join(tmpDir, '.lens');
    fs.mkdirSync(lensDir, { recursive: true });
    fs.writeFileSync(path.join(lensDir, 'project.json'), '{{{not json', 'utf-8');

    // Should not throw
    const project = await ensureProject(tmpDir, { language: 'python', framework: null });
    expect(project.version).toBe(1);
    expect(project.language).toBe('python');
  });

  it('handles project.json with wrong schema version by creating a fresh one', async () => {
    const lensDir = path.join(tmpDir, '.lens');
    fs.mkdirSync(lensDir, { recursive: true });
    fs.writeFileSync(
      path.join(lensDir, 'project.json'),
      JSON.stringify({ version: 99, name: 'old', someField: true }),
      'utf-8'
    );

    const project = await ensureProject(tmpDir, { language: 'go', framework: null });
    expect(project.version).toBe(1);
  });

  it('creates .lens directory if it does not exist', async () => {
    const deepTmp = path.join(tmpDir, 'deep', 'project');
    fs.mkdirSync(deepTmp, { recursive: true });

    await ensureProject(deepTmp, { language: 'rust', framework: null });

    expect(fs.existsSync(path.join(deepTmp, '.lens'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// writeRun — filesystem I/O
// ---------------------------------------------------------------------------

function makeRunInput(overrides: Partial<RunInput> = {}): RunInput {
  const start = new Date('2025-01-01T10:00:00Z');
  const end = new Date('2025-01-01T10:05:00Z');
  return {
    mode: 'scan',
    startedAt: start,
    completedAt: end,
    penaltyIndex: 20,
    ...overrides
  };
}

describe('writeRun', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-writeRun-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes a JSON file to .lens/runs/', async () => {
    await writeRun(tmpDir, makeRunInput());

    const runsDir = path.join(tmpDir, '.lens', 'runs');
    const files = fs.readdirSync(runsDir).filter(f => f.endsWith('.json'));
    expect(files.length).toBe(1);
  });

  it('produces valid JSON with required fields', async () => {
    const run = await writeRun(tmpDir, makeRunInput({ penaltyIndex: 0 }));

    expect(run.version).toBe(1);
    expect(run.id).toBeTruthy();
    expect(run.mode).toBe('scan');
    expect(run.score.total).toBe(100);
    expect(run.score.max).toBe(100);
    expect(run.score.verdict).toBe('production-ready');
    expect(run.durationMs).toBe(300000); // 5 minutes
    expect(Array.isArray(run.dimensions)).toBe(true);
    expect(run.dimensions.length).toBe(13);
  });

  it('calculates score from penaltyIndex', async () => {
    const run = await writeRun(tmpDir, makeRunInput({ penaltyIndex: 130 }));
    expect(run.score.total).toBe(0);
    expect(run.score.verdict).toBe('needs-rework');
  });

  it('defaults to score 100 when penaltyIndex is absent', async () => {
    const run = await writeRun(tmpDir, makeRunInput({ penaltyIndex: undefined }));
    expect(run.score.total).toBe(100);
  });

  it('includes findings with generated IDs', async () => {
    const rawFindings: RawFinding[] = [
      {
        severity: 'high',
        dimension: 'Security',
        title: 'SQL Injection',
        description: 'User input not sanitized',
        file: 'src/db.ts',
        line: 42
      }
    ];
    const run = await writeRun(tmpDir, makeRunInput({ findings: rawFindings }));

    expect(run.findings.length).toBe(1);
    expect(run.findings[0].id).toMatch(/^f-[a-f0-9]+$/);
    expect(run.findings[0].severity).toBe('high');
    expect(run.findings[0].line).toBe(42);
    expect(run.summary.high).toBe(1);
    expect(run.summary.critical).toBe(0);
  });

  it('includes fixedFrom when provided', async () => {
    const run = await writeRun(tmpDir, makeRunInput({ mode: 'fix', fixedFrom: 'run-abc123' }));
    expect(run.fixedFrom).toBe('run-abc123');
  });

  it('does not include fixedFrom when absent', async () => {
    const run = await writeRun(tmpDir, makeRunInput());
    expect('fixedFrom' in run).toBe(false);
  });

  it('written file content matches returned run object', async () => {
    const run = await writeRun(tmpDir, makeRunInput());
    const runsDir = path.join(tmpDir, '.lens', 'runs');
    const file = fs.readdirSync(runsDir)[0];
    const content = JSON.parse(fs.readFileSync(path.join(runsDir, file), 'utf-8'));
    expect(content.id).toBe(run.id);
    expect(content.score.total).toBe(run.score.total);
  });
});

// ---------------------------------------------------------------------------
// listRuns — filesystem I/O
// ---------------------------------------------------------------------------

describe('listRuns', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-listRuns-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when .lens/runs does not exist', async () => {
    const runs = await listRuns(tmpDir);
    expect(runs).toEqual([]);
  });

  it('returns written runs in reverse-chronological order', async () => {
    const start1 = new Date('2025-01-01T10:00:00Z');
    const start2 = new Date('2025-01-02T10:00:00Z');
    await writeRun(tmpDir, makeRunInput({ startedAt: start1, completedAt: new Date('2025-01-01T10:05:00Z') }));
    await writeRun(tmpDir, makeRunInput({ startedAt: start2, completedAt: new Date('2025-01-02T10:05:00Z') }));

    const runs = await listRuns(tmpDir);
    expect(runs.length).toBe(2);
    // Most recent first (reverse sorted by filename = timestamp)
    expect(runs[0].startedAt > runs[1].startedAt).toBe(true);
  });

  it('respects the limit parameter', async () => {
    for (let i = 0; i < 5; i++) {
      const base = new Date(`2025-01-0${i + 1}T10:00:00Z`);
      await writeRun(tmpDir, makeRunInput({
        startedAt: base,
        completedAt: new Date(base.getTime() + 60000)
      }));
    }

    const runs = await listRuns(tmpDir, 3);
    expect(runs.length).toBe(3);
  });

  it('skips corrupt JSON files without throwing', async () => {
    // Write one valid run
    await writeRun(tmpDir, makeRunInput());

    // Inject a corrupt file
    const runsDir = path.join(tmpDir, '.lens', 'runs');
    fs.writeFileSync(path.join(runsDir, '0000-corrupt.json'), '{bad json{{', 'utf-8');

    // Should return only the valid run
    const runs = await listRuns(tmpDir);
    expect(runs.length).toBe(1);
    expect(runs[0].version).toBe(1);
  });

  it('skips files that look like JSON but have wrong schema', async () => {
    const runsDir = path.join(tmpDir, '.lens', 'runs');
    fs.mkdirSync(runsDir, { recursive: true });
    fs.writeFileSync(
      path.join(runsDir, '2025-01-01T10-00-00-000Z.json'),
      JSON.stringify({ version: 99, wrongSchema: true }),
      'utf-8'
    );

    const runs = await listRuns(tmpDir);
    expect(runs.length).toBe(0);
  });
});
