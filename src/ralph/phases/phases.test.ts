/**
 * Phases Factory Tests
 *
 * Following test-doubles: clear tests for phase creation.
 * Following testability: verify contracts are honored.
 */

import { describe, it, expect } from 'vitest';
import {
  createPhases,
  getPhase,
  getPhaseIcon,
  PHASE_ORDER,
} from './index.js';
import type { PhaseName } from '../types.js';

describe('Phases Factory', () => {
  describe('createPhases', () => {
    it('returns 8 phases', () => {
      const phases = createPhases();

      expect(phases).toHaveLength(8);
    });

    it('returns phases in correct order', () => {
      const phases = createPhases();

      expect(phases[0].name).toBe('plan');
      expect(phases[1].name).toBe('structure-first');
      expect(phases[2].name).toBe('implement');
      expect(phases[3].name).toBe('refactor-check');
      expect(phases[4].name).toBe('independent-review');
      expect(phases[5].name).toBe('static-analysis');
      expect(phases[6].name).toBe('test');
      expect(phases[7].name).toBe('doc-code');
    });

    it('each phase has required properties', () => {
      const phases = createPhases();

      for (const phase of phases) {
        expect(phase.name).toBeDefined();
        expect(phase.icon).toBeDefined();
        expect(phase.description).toBeDefined();
        expect(typeof phase.execute).toBe('function');
        expect(typeof phase.shouldRun).toBe('function');
      }
    });

    it('each phase has an icon', () => {
      const phases = createPhases();

      for (const phase of phases) {
        expect(phase.icon.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getPhase', () => {
    it('returns phase by name', () => {
      const plan = getPhase('plan');
      const implement = getPhase('implement');

      expect(plan?.name).toBe('plan');
      expect(implement?.name).toBe('implement');
    });

    it('returns null for unknown phase', () => {
      const unknown = getPhase('unknown' as PhaseName);

      expect(unknown).toBeNull();
    });

    it('returns all 8 phases by name', () => {
      const names: PhaseName[] = [
        'plan',
        'structure-first',
        'implement',
        'test',
        'refactor-check',
        'independent-review',
        'static-analysis',
        'doc-code',
      ];

      for (const name of names) {
        const phase = getPhase(name);
        expect(phase).not.toBeNull();
        expect(phase?.name).toBe(name);
      }
    });
  });

  describe('getPhaseIcon', () => {
    it('returns icon for each phase', () => {
      expect(getPhaseIcon('plan')).toBe('📝');
      expect(getPhaseIcon('structure-first')).toBe('🏗️');
      expect(getPhaseIcon('implement')).toBe('🛠️');
      expect(getPhaseIcon('test')).toBe('🧪');
      expect(getPhaseIcon('refactor-check')).toBe('🧹');
      expect(getPhaseIcon('independent-review')).toBe('🔍');
      expect(getPhaseIcon('static-analysis')).toBe('📊');
      expect(getPhaseIcon('doc-code')).toBe('📚');
    });

    it('returns default icon for unknown phase', () => {
      const icon = getPhaseIcon('unknown' as PhaseName);

      expect(icon).toBe('▶️');
    });
  });

  describe('PHASE_ORDER', () => {
    it('contains 8 phases', () => {
      expect(PHASE_ORDER).toHaveLength(8);
    });

    it('matches createPhases order', () => {
      const phases = createPhases();

      for (let i = 0; i < PHASE_ORDER.length; i++) {
        expect(phases[i].name).toBe(PHASE_ORDER[i]);
      }
    });

    it('starts with plan and ends with doc-code', () => {
      expect(PHASE_ORDER[0]).toBe('plan');
      expect(PHASE_ORDER[7]).toBe('doc-code');
    });
  });

  describe('Phase contracts', () => {
    it('shouldRun returns boolean for all phases', () => {
      const phases = createPhases();
      const mockContext = {
        session: {} as any,
        item: { lineNumber: 1, text: 'test', status: 'pending' as const },
        experts: [],
        projectPath: '/tmp',
        logsDir: '/tmp/logs',
      };

      for (const phase of phases) {
        const result = phase.shouldRun(mockContext);
        expect(typeof result).toBe('boolean');
      }
    });

    it('all phases run for security-relevant items', () => {
      const phases = createPhases();
      // Use security-relevant text to trigger independent-review
      const mockContext = {
        session: {} as any,
        item: { lineNumber: 1, text: 'implement user authentication with password validation', status: 'pending' as const },
        experts: [],
        projectPath: '/tmp',
        logsDir: '/tmp/logs',
      };

      for (const phase of phases) {
        expect(phase.shouldRun(mockContext)).toBe(true);
      }
    });

    it('independent-review runs on most code items (broad keywords)', () => {
      const phases = createPhases();
      const reviewPhase = phases.find(p => p.name === 'independent-review');
      const mockContext = {
        session: {} as any,
        item: { lineNumber: 1, text: 'add loading spinner to button', status: 'pending' as const },
        experts: [],
        projectPath: '/tmp',
        logsDir: '/tmp/logs',
      };

      // Independent-review now runs on most items (contains "add")
      expect(reviewPhase?.shouldRun(mockContext)).toBe(true);
    });

    it('independent-review skips items with no trigger keywords', () => {
      const phases = createPhases();
      const reviewPhase = phases.find(p => p.name === 'independent-review');
      const mockContext = {
        session: {} as any,
        item: { lineNumber: 1, text: 'read documentation about patterns', status: 'pending' as const },
        experts: [],
        projectPath: '/tmp',
        logsDir: '/tmp/logs',
      };

      // No trigger keywords like add, create, update, etc.
      expect(reviewPhase?.shouldRun(mockContext)).toBe(false);
    });
  });
});
