/**
 * Stage exports and factory.
 */

export { Stage, StageContext, BaseStage, STAGE_ORDER } from './types.js';
export { PlanStage } from './plan.js';
export { BuildStage } from './build.js';
export { RefactorStage } from './refactor.js';
export { TestStage } from './test.js';
export { ReviewStage } from './review.js';
export { DocStage } from './doc.js';

import { Stage } from './types.js';
import { PlanStage } from './plan.js';
import { BuildStage } from './build.js';
import { RefactorStage } from './refactor.js';
import { TestStage } from './test.js';
import { ReviewStage } from './review.js';
import { DocStage } from './doc.js';

/**
 * Create all stages in execution order.
 */
export function createStages(): Stage[] {
  return [
    new PlanStage(),
    new BuildStage(),
    new RefactorStage(),
    new TestStage(),
    new ReviewStage(),
    new DocStage(),
  ];
}

/**
 * Get a specific stage by name.
 */
export function getStage(name: string): Stage | null {
  const stages: Record<string, Stage> = {
    plan: new PlanStage(),
    build: new BuildStage(),
    refactor: new RefactorStage(),
    test: new TestStage(),
    review: new ReviewStage(),
    doc: new DocStage(),
  };

  return stages[name] ?? null;
}
