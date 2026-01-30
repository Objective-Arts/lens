/**
 * Phases Factory Tests
 *
 * Following meszaros: clear tests for phase creation.
 * Following hevery: verify contracts are honored.
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
      expect(phases[3].name).toBe('build-tests');
      expect(phases[4].name).toBe('refactor-check');
      expect(phases[5].name).toBe('adversarial-review');
      expect(phases[6].name).toBe('static-analysis');
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
        'build-tests',
        'refactor-check',
        'adversarial-review',
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
      expect(getPhaseIcon('build-tests')).toBe('🧪');
      expect(getPhaseIcon('refactor-check')).toBe('🧹');
      expect(getPhaseIcon('adversarial-review')).toBe('🔒');
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

    it('all phases default to shouldRun = true', () => {
      const phases = createPhases();
      const mockContext = {
        session: {} as any,
        item: { lineNumber: 1, text: 'test', status: 'pending' as const },
        experts: [],
        projectPath: '/tmp',
        logsDir: '/tmp/logs',
      };

      for (const phase of phases) {
        expect(phase.shouldRun(mockContext)).toBe(true);
      }
    });
  });
});
