/**
 * Phase exports and factory.
 *
 * Following simplicity: simple exports, clear factory.
 */

export { Phase, PhaseContext, PhaseResult, PhaseStatus } from './types.js';
export { detectExperts } from './loader.js';

import type { Phase } from './types.js';
import type { PhaseName } from '../types.js';

/**
 * Phase execution order for tests.
 */
export const PHASE_ORDER: readonly PhaseName[] = [
  'plan',
  'structure',
  'implement',
  'refactoring',
  'independent-review',
  'static-analysis',
  'test',
  'doc-code',
] as const;
import { PlanPhase } from './plan.js';
import { StructurePhase } from './structure.js';
import { ImplementPhase } from './implement.js';
import { TestPhase } from './test.js';
import { RefactoringPhase } from './refactoring.js';
import { IndependentReviewPhase } from './independent-review.js';
import { StaticAnalysisPhase } from './static-analysis.js';
import { DocCodePhase } from './doc-code.js';
import { ProductionReadinessPhase } from './production-readiness.js';
import { SecurityReviewPhase } from './security-review.js';

export function createPhases(): Phase[] {
  return [
    new PlanPhase(),
    new StructurePhase(),
    new ImplementPhase(),
    new RefactoringPhase(),
    new IndependentReviewPhase(),
    new StaticAnalysisPhase(),
    new TestPhase(),
    new DocCodePhase(),
  ];
}

export function getPhase(name: PhaseName): Phase | null {
  const phases: Record<PhaseName, Phase> = {
    'plan': new PlanPhase(),
    'structure': new StructurePhase(),
    'implement': new ImplementPhase(),
    'test': new TestPhase(),
    'refactoring': new RefactoringPhase(),
    'independent-review': new IndependentReviewPhase(),
    'static-analysis': new StaticAnalysisPhase(),
    'doc-code': new DocCodePhase(),
    'production-readiness': new ProductionReadinessPhase(),
    'security-review': new SecurityReviewPhase(),
  };

  return phases[name] ?? null;
}

export function getPhaseIcon(name: PhaseName): string {
  const icons: Partial<Record<PhaseName, string>> = {
    'plan': '📝',
    'structure': '🏗️',
    'implement': '🛠️',
    'test': '🧪',
    'refactoring': '🧹',
    'independent-review': '🔍',
    'static-analysis': '📊',
    'doc-code': '📚',
    'production-readiness': '🚀',
    'security-review': '🔒',
  };

  return icons[name] ?? '▶️';
}

/**
 * Create all post-loop phases.
 * Order: security review first, production readiness last (applies final fixes).
 */
export function createPostLoopPhases(): Phase[] {
  return [
    new SecurityReviewPhase(),
    new ProductionReadinessPhase(),
  ];
}
