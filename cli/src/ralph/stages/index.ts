/**
 * Stage exports and factory.
 */

export { Stage, StageContext, BaseStage, STAGE_ORDER } from './types.js';
export { ScaffoldStage } from './scaffold.js';
export { PlanStage } from './plan.js';
export { BuildStage } from './build.js';
export { CleanStage } from './clean.js';
export { TestStage } from './test.js';
export { ReviewStage } from './review.js';
export { DocStage } from './doc.js';

import { Stage } from './types.js';
import { ScaffoldStage } from './scaffold.js';
import { PlanStage } from './plan.js';
import { BuildStage } from './build.js';
import { CleanStage } from './clean.js';
import { TestStage } from './test.js';
import { ReviewStage } from './review.js';
import { DocStage } from './doc.js';

/**
 * Create all stages in execution order.
 */
export function createStages(): Stage[] {
  return [
    new ScaffoldStage(),
    new PlanStage(),
    new BuildStage(),
    new CleanStage(),
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
    scaffold: new ScaffoldStage(),
    plan: new PlanStage(),
    build: new BuildStage(),
    clean: new CleanStage(),
    test: new TestStage(),
    review: new ReviewStage(),
    doc: new DocStage(),
  };

  return stages[name] ?? null;
}
