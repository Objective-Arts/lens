/**
 * Phase exports and factory.
 *
 * Following pike: simple exports, clear factory.
 */

export { Phase, PhaseContext, PhaseResult, BasePhase, PhaseStatus } from './types.js';
export { PlanPhase } from './plan.js';
export { StructureFirstPhase } from './structure-first.js';
export { ImplementPhase } from './implement.js';
export { TestPhase } from './test.js';
export { RefactorCheckPhase } from './refactor-check.js';
export { IndependentReviewPhase } from './independent-review.js';
export { StaticAnalysisPhase } from './static-analysis.js';
export { DocCodePhase } from './doc-code.js';
export { ProductionReadinessPhase } from './production-readiness.js';
export { SecurityReviewPhase } from './security-review.js';
export {
  loadPhaseConfig,
  getPhaseExperts,
  getRalphSequence,
  loadKeywordRules,
  detectExperts,
  clearPhaseLoaderCaches,
  hasCustomPhaseConfig,
  hasCustomKeywordRules,
} from './loader.js';

import type { Phase } from './types.js';
import type { PhaseName } from '../types.js';
import { PlanPhase } from './plan.js';
import { StructureFirstPhase } from './structure-first.js';
import { ImplementPhase } from './implement.js';
import { TestPhase } from './test.js';
import { RefactorCheckPhase } from './refactor-check.js';
import { IndependentReviewPhase } from './independent-review.js';
import { StaticAnalysisPhase } from './static-analysis.js';
import { DocCodePhase } from './doc-code.js';
import { ProductionReadinessPhase } from './production-readiness.js';
import { SecurityReviewPhase } from './security-review.js';

/**
 * Phase execution order.
 * Same sequence used by standalone commands and Ralph loop.
 * Order: plan → structure → implement → refactor → review → scan → test → doc
 */
export const PHASE_ORDER: readonly PhaseName[] = [
  'plan',
  'structure-first',
  'implement',
  'refactor-check',
  'independent-review',
  'static-analysis',
  'test',
  'doc-code',
] as const;

/**
 * Create all phases in execution order.
 */
export function createPhases(): Phase[] {
  return [
    new PlanPhase(),
    new StructureFirstPhase(),
    new ImplementPhase(),
    new RefactorCheckPhase(),
    new IndependentReviewPhase(),
    new StaticAnalysisPhase(),
    new TestPhase(),
    new DocCodePhase(),
  ];
}

/**
 * Get a specific phase by name.
 */
export function getPhase(name: PhaseName): Phase | null {
  const phases: Record<PhaseName, Phase> = {
    'plan': new PlanPhase(),
    'structure-first': new StructureFirstPhase(),
    'implement': new ImplementPhase(),
    'test': new TestPhase(),
    'refactor-check': new RefactorCheckPhase(),
    'independent-review': new IndependentReviewPhase(),
    'static-analysis': new StaticAnalysisPhase(),
    'doc-code': new DocCodePhase(),
    'production-readiness': new ProductionReadinessPhase(),
    'security-review': new SecurityReviewPhase(),
  };

  return phases[name] ?? null;
}

/**
 * Get phase icon for display.
 */
export function getPhaseIcon(name: PhaseName): string {
  const icons: Partial<Record<PhaseName, string>> = {
    'plan': '📝',
    'structure-first': '🏗️',
    'implement': '🛠️',
    'test': '🧪',
    'refactor-check': '🧹',
    'independent-review': '🔍',
    'static-analysis': '📊',
    'doc-code': '📚',
    'production-readiness': '🚀',
    'security-review': '🔒',
  };

  return icons[name] ?? '▶️';
}

/**
 * Create the production-readiness phase (post-loop, not per-item).
 */
export function createProductionReadinessPhase(): Phase {
  return new ProductionReadinessPhase();
}

/**
 * Create the security-review phase (post-loop, not per-item).
 */
export function createSecurityReviewPhase(): Phase {
  return new SecurityReviewPhase();
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
