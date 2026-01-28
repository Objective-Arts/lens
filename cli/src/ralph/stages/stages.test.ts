/**
 * Stage Integration Tests
 *
 * Following Hevery: Testing at module boundaries with mocked dependencies.
 * Following Dodds: Integration tests (highest value), test behavior not implementation.
 *
 * These tests mock runClaude at the module level since stages currently use
 * it as a global function. Future refactoring could inject it as a dependency.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { StageContext } from './types.js';
import { PlanStage } from './plan.js';
import { BuildStage } from './build.js';
import { createStages, getStage } from './index.js';
import {
  createSession,
  createPrdItem,
  createSkill,
  createTestProject,
} from '../test-utils/index.js';

// Mock the Claude process module
vi.mock('../process/claude.js', () => ({
  runClaude: vi.fn(),
}));

// Import the mocked function after mocking
import { runClaude } from '../process/claude.js';
const mockRunClaude = vi.mocked(runClaude);

describe('Stage Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create isolated temp directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ralph-stage-test-'));
    createTestProject(tempDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('createStages', () => {
    it('creates all stages in correct order', () => {
      const stages = createStages();

      expect(stages.map(s => s.name)).toEqual([
        'scaffold',
        'plan',
        'build',
        'clean',
        'test',
        'review',
        'doc',
      ]);
    });

    it('all stages have required interface', () => {
      const stages = createStages();

      for (const stage of stages) {
        expect(stage).toHaveProperty('name');
        expect(stage).toHaveProperty('icon');
        expect(typeof stage.execute).toBe('function');
        expect(typeof stage.shouldRun).toBe('function');
      }
    });
  });

  describe('getStage', () => {
    it('returns correct stage by name', () => {
      const plan = getStage('plan');
      const build = getStage('build');

      expect(plan?.name).toBe('plan');
      expect(build?.name).toBe('build');
    });

    it('returns null for unknown stage', () => {
      expect(getStage('nonexistent')).toBeNull();
    });
  });

  describe('PlanStage', () => {
    it('creates plan file on success', async () => {
      const stage = new PlanStage();
      const context = createStageContext(tempDir, 'Implement user login');

      mockRunClaude.mockResolvedValueOnce({
        success: true,
        jsonPath: path.join(tempDir, '.claude', 'ralph-logs', 'test.json'),
        rawPath: path.join(tempDir, '.claude', 'ralph-logs', 'test.raw'),
        result: '# Plan\n\n1. Create auth module\n2. Add login endpoint\n\nPLAN_COMPLETE',
        durationMs: 5000,
      });

      const result = await stage.execute(context);

      expect(result.status).toBe('success');

      // Verify plan file was created
      const planPath = path.join(tempDir, '.claude', 'plans', 'implement-user-login.md');
      expect(fs.existsSync(planPath)).toBe(true);

      // Verify plan content
      const planContent = fs.readFileSync(planPath, 'utf-8');
      expect(planContent).toContain('PLAN_COMPLETE');
    });

    it('returns failed result when Claude fails', async () => {
      const stage = new PlanStage();
      const context = createStageContext(tempDir, 'Test item');

      mockRunClaude.mockResolvedValueOnce({
        success: false,
        jsonPath: '',
        rawPath: '',
        result: 'PLAN_FAILED: Could not generate plan',
        durationMs: 1000,
      });

      const result = await stage.execute(context);

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.error).toContain('not complete successfully');
      }
    });

    it('passes skill names to Claude prompt', async () => {
      const stage = new PlanStage();
      const context = createStageContext(tempDir, 'Test item', [
        createSkill({ name: 'schneier' }),
        createSkill({ name: 'owasp' }),
      ]);

      mockRunClaude.mockResolvedValueOnce({
        success: true,
        jsonPath: '',
        rawPath: '',
        result: 'PLAN_COMPLETE',
        durationMs: 1000,
      });

      await stage.execute(context);

      // Verify Claude was called with skills in prompt
      expect(mockRunClaude).toHaveBeenCalledTimes(1);
      const callArgs = mockRunClaude.mock.calls[0][0];
      expect(callArgs.prompt).toContain('schneier, owasp');
    });

    it('creates slug from item text for plan filename', async () => {
      const stage = new PlanStage();
      const context = createStageContext(tempDir, 'Add API: /users endpoint');

      mockRunClaude.mockResolvedValueOnce({
        success: true,
        jsonPath: '',
        rawPath: '',
        result: 'PLAN_COMPLETE',
        durationMs: 1000,
      });

      await stage.execute(context);

      // Verify plan file uses slugified name
      const planPath = path.join(tempDir, '.claude', 'plans', 'add-api-users-endpoint.md');
      expect(fs.existsSync(planPath)).toBe(true);
    });
  });

  describe('BuildStage', () => {
    it('fails when plan file does not exist', async () => {
      const stage = new BuildStage();
      const context = createStageContext(tempDir, 'Missing plan item');

      const result = await stage.execute(context);

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.error).toContain('Plan not found');
      }
    });

    it('succeeds when plan exists and Claude completes', async () => {
      const stage = new BuildStage();
      const context = createStageContext(tempDir, 'Build test item');

      // Create the plan file first
      const planPath = path.join(tempDir, '.claude', 'plans', 'build-test-item.md');
      fs.writeFileSync(planPath, '# Plan\n\n1. Create files\n2. Implement logic');

      mockRunClaude.mockResolvedValueOnce({
        success: true,
        jsonPath: '',
        rawPath: '',
        result: 'BUILD_COMPLETE: All files created',
        durationMs: 10000,
      });

      const result = await stage.execute(context);

      expect(result.status).toBe('success');
      if (result.status === 'success') {
        expect(result.message).toContain('Implementation complete');
      }
    });

    it('returns failed result when Claude build fails', async () => {
      const stage = new BuildStage();
      const context = createStageContext(tempDir, 'Failing build');

      // Create the plan file
      const planPath = path.join(tempDir, '.claude', 'plans', 'failing-build.md');
      fs.writeFileSync(planPath, '# Plan');

      mockRunClaude.mockResolvedValueOnce({
        success: false,
        jsonPath: '',
        rawPath: '',
        result: 'BUILD_FAILED: Compilation error',
        durationMs: 5000,
      });

      const result = await stage.execute(context);

      expect(result.status).toBe('failed');
    });

    it('includes plan content in prompt', async () => {
      const stage = new BuildStage();
      const context = createStageContext(tempDir, 'Plan content test');

      const planContent = '# Implementation Plan\n\n- Step 1: Create auth.ts\n- Step 2: Add tests';
      const planPath = path.join(tempDir, '.claude', 'plans', 'plan-content-test.md');
      fs.writeFileSync(planPath, planContent);

      mockRunClaude.mockResolvedValueOnce({
        success: true,
        jsonPath: '',
        rawPath: '',
        result: 'BUILD_COMPLETE',
        durationMs: 1000,
      });

      await stage.execute(context);

      // Verify plan content was included in prompt
      const callArgs = mockRunClaude.mock.calls[0][0];
      expect(callArgs.prompt).toContain('Create auth.ts');
      expect(callArgs.prompt).toContain('Add tests');
    });

    it('uses extended tool set for build', async () => {
      const stage = new BuildStage();
      const context = createStageContext(tempDir, 'Tool test');

      const planPath = path.join(tempDir, '.claude', 'plans', 'tool-test.md');
      fs.writeFileSync(planPath, '# Plan');

      mockRunClaude.mockResolvedValueOnce({
        success: true,
        jsonPath: '',
        rawPath: '',
        result: 'BUILD_COMPLETE',
        durationMs: 1000,
      });

      await stage.execute(context);

      // Verify allowed tools
      const callArgs = mockRunClaude.mock.calls[0][0];
      expect(callArgs.allowedTools).toContain('Bash');
      expect(callArgs.allowedTools).toContain('Read');
      expect(callArgs.allowedTools).toContain('Write');
      expect(callArgs.allowedTools).toContain('Edit');
      expect(callArgs.allowedTools).toContain('Glob');
      expect(callArgs.allowedTools).toContain('Grep');
    });
  });

  describe('Stage shouldRun', () => {
    it('most stages return true by default', () => {
      const stages = createStages();
      const context = createStageContext(tempDir, 'Test item');

      // ScaffoldStage has custom logic - check test infrastructure
      // Other stages should return true
      for (const stage of stages) {
        if (stage.name === 'scaffold') {
          // ScaffoldStage may return true or false depending on test infra
          expect(typeof stage.shouldRun(context)).toBe('boolean');
        } else {
          expect(stage.shouldRun(context)).toBe(true);
        }
      }
    });

    it('scaffold stage checks for test infrastructure', () => {
      const stages = createStages();
      const scaffold = stages.find(s => s.name === 'scaffold');
      const context = createStageContext(tempDir, 'Test item');

      // Result depends on whether npm test works in temp dir
      expect(scaffold).toBeDefined();
      expect(typeof scaffold!.shouldRun(context)).toBe('boolean');
    });
  });

  describe('Stage log prefix', () => {
    it('generates unique log prefix per execution', async () => {
      const stage = new PlanStage();
      const context1 = createStageContext(tempDir, 'Test item');
      const context2 = createStageContext(tempDir, 'Test item');
      context2.item.lineNumber = 2;

      mockRunClaude.mockResolvedValue({
        success: true,
        jsonPath: '',
        rawPath: '',
        result: 'PLAN_COMPLETE',
        durationMs: 1000,
      });

      await stage.execute(context1);
      await stage.execute(context2);

      // Different contexts should have different log prefixes
      const prefix1 = mockRunClaude.mock.calls[0][0].logPrefix;
      const prefix2 = mockRunClaude.mock.calls[1][0].logPrefix;

      expect(prefix1).toContain('item1');
      expect(prefix2).toContain('item2');
    });
  });
});

// Helper to create stage context for testing
function createStageContext(
  projectPath: string,
  itemText: string,
  skills: ReturnType<typeof createSkill>[] = []
): StageContext {
  return {
    session: createSession({ projectPath, logsDir: path.join(projectPath, '.claude', 'ralph-logs') }),
    item: createPrdItem({ text: itemText }),
    skills,
    projectPath,
    logsDir: path.join(projectPath, '.claude', 'ralph-logs'),
  };
}
