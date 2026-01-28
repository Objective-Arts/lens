/**
 * Test fixtures helpers.
 *
 * Following Hevery: Explicit dependencies, clear factory functions.
 * Following Dodds: Realistic test data, not minimal stubs.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Prd, PrdItem, Session, Skill, StageResult } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Fixtures directory path */
export const FIXTURES_DIR = path.join(__dirname, '..', '__fixtures__');

/**
 * Load a fixture file by name.
 */
export function loadFixture(filename: string): string {
  const filepath = path.join(FIXTURES_DIR, filename);
  return fs.readFileSync(filepath, 'utf-8');
}

/**
 * Load JSON fixture file.
 */
export function loadJsonFixture<T>(filename: string): T {
  const content = loadFixture(filename);
  return JSON.parse(content) as T;
}

/**
 * Create a PRD for testing.
 */
export function createPrd(options: Partial<Prd> = {}): Prd {
  return {
    filepath: options.filepath ?? '/test/prd.md',
    items: options.items ?? [],
    raw: options.raw ?? '',
  };
}

/**
 * Create a PRD item for testing.
 */
export function createPrdItem(options: Partial<PrdItem> = {}): PrdItem {
  return {
    lineNumber: options.lineNumber ?? 1,
    text: options.text ?? 'Test item',
    status: options.status ?? 'pending',
  };
}

/**
 * Create a session for testing.
 */
export function createSession(options: Partial<Session> = {}): Session {
  return {
    id: options.id ?? 'test-session-123',
    startTime: options.startTime ?? new Date('2024-01-01T00:00:00Z'),
    prdPath: options.prdPath ?? '/test/prd.md',
    projectPath: options.projectPath ?? '/test/project',
    logsDir: options.logsDir ?? '/test/project/.claude/ralph-logs',
    currentItem: options.currentItem ?? 0,
    totalItems: options.totalItems ?? 5,
    completedItems: options.completedItems ?? 0,
  };
}

/**
 * Create a skill for testing.
 */
export function createSkill(options: Partial<Skill> = {}): Skill {
  return {
    name: options.name ?? 'test-skill',
    content: options.content ?? '# Test Skill\n\nTest content.',
    source: options.source ?? 'profile',
  };
}

/**
 * Create a successful stage result.
 */
export function createSuccessResult(message: string = 'Success'): StageResult {
  return {
    status: 'success',
    message,
  };
}

/**
 * Create a failed stage result.
 */
export function createFailedResult(error: string = 'Error'): StageResult {
  return {
    status: 'failed',
    error,
  };
}

/**
 * Create a skipped stage result.
 */
export function createSkippedResult(reason: string = 'Skipped'): StageResult {
  return {
    status: 'skipped',
    reason,
  };
}

/**
 * Create a test PRD file in a temp directory.
 */
export function createTempPrd(
  tempDir: string,
  content: string,
  filename: string = 'prd.md'
): string {
  const prdPath = path.join(tempDir, filename);
  fs.writeFileSync(prdPath, content);
  return prdPath;
}

/**
 * Create a test project structure in a temp directory.
 */
export function createTestProject(tempDir: string): void {
  // Create basic project structure
  fs.mkdirSync(path.join(tempDir, '.claude', 'ralph-logs'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, '.claude', 'plans'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });

  // Create a basic package.json
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
  );
}

/**
 * Sample PRD content with mixed complete/incomplete items.
 */
export const SAMPLE_PRD_CONTENT = `# Test PRD

- [ ] Implement user authentication
- [ ] Add password reset flow
- [x] Setup project structure
- [ ] Create API endpoints
`;

/**
 * PRD with all items complete.
 */
export const COMPLETE_PRD_CONTENT = `# Complete PRD

- [x] First task
- [x] Second task
- [x] Third task
`;

/**
 * Empty PRD with no checkboxes.
 */
export const EMPTY_PRD_CONTENT = `# Empty PRD

No tasks yet.
`;
