/**
 * Phase execution logic.
 *
 * Following Kernighan: clear control flow, small functions.
 */

import { Phase, PhaseContext, PhaseStatus, PhaseResult } from '../phases/index.js';
import { RalphConfig, PrdItem, Session, PhaseName } from '../types.js';
import { SummaryCollector, StageSummary } from '../summary/index.js';
import { parsePhaseOutput, printPhaseResults } from '../display/phase-output.js';
import { parseRefactorResults } from '../summary/index.js';
import {
  printStageHeader, printStageComplete, printStageFailed, printStageSkipped,
  printAppliedSkills, printInfo, Spinner,
} from '../display/terminal.js';
import { getGitCommitHash, hasNewCommitsSince } from '../process/claude.js';
import { traceSkillConfig, formatTrace } from '../../trace/index.js';
import {
  buildPhaseContext, parsePhaseMetrics, createWorkflowMarker, getDetectionInfo,
} from './context.js';
import { MAX_RETRIES, isCorrectableFailure, buildCorrectivePrompt } from './retry.js';

/** Check if timeout can be recovered via commit detection. */
async function canRecoverFromTimeout(error: string, projectPath: string, hash: string | null): Promise<boolean> {
  if (!error.includes('timed out') || !hash) return false;
  return hasNewCommitsSince(projectPath, hash);
}

/** Map phase result status to summary status. */
function mapResultStatus(status: string): 'done' | 'skipped' | 'failed' {
  if (status === 'success') return 'done';
  if (status === 'skipped') return 'skipped';
  return 'failed';
}

/** Print refactorings applied. */
function printRefactorings(rawOutput: string): void {
  const refactorResults = parseRefactorResults(rawOutput);
  if (refactorResults.improvements.length > 0) {
    console.log('      Refactorings:');
    for (const improvement of refactorResults.improvements) {
      console.log(`        • ${improvement}`);
    }
  }
}

/** Handle successful phase completion. */
function handlePhaseSuccess(
  result: { message: string; rawOutput?: string },
  phase: Phase, durationMs: number, phaseStatus: Map<string, PhaseStatus>
): void {
  phaseStatus.set(phase.name, 'done');
  printStageComplete(phase.name, durationMs / 1000, result.message);

  if (phase.name === 'independent-review' && result.rawOutput) {
    const phaseOutput = parsePhaseOutput(result.rawOutput);
    if (phaseOutput.issues.length > 0 || phaseOutput.fixed.length > 0) {
      printPhaseResults(phase.name, phaseOutput, 'Gemini');
    }
  }
  if (phase.name === 'static-analysis' && result.rawOutput) {
    const phaseOutput = parsePhaseOutput(result.rawOutput);
    if (phaseOutput.issues.length > 0 || phaseOutput.fixed.length > 0) {
      printPhaseResults(phase.name, phaseOutput, 'Qodana');
    }
  }
  if (phase.name === 'refactor-check' && result.rawOutput) {
    printRefactorings(result.rawOutput);
  }

  printAppliedSkills(result.rawOutput);
}

/** Handle phase error with timeout recovery. */
async function handlePhaseError(
  error: string, phase: Phase, durationMs: number, projectPath: string, commitHash: string | null,
  phaseStatus: Map<string, PhaseStatus>, collector: SummaryCollector
): Promise<boolean> {
  if (await canRecoverFromTimeout(error, projectPath, commitHash)) {
    printInfo(`Timeout but commits detected - treating as success`);
    phaseStatus.set(phase.name, 'done');
    printStageComplete(phase.name, durationMs / 1000, 'Completed (timeout with commits)');
    collector.addStage({ name: phase.name, status: 'done', durationMs });
    return false;
  }
  phaseStatus.set(phase.name, 'failed');
  printStageFailed(phase.name, error);
  collector.addStage({ name: phase.name, status: 'failed', durationMs });
  return true;
}

/** Process phase result and update status. Returns true if failed. */
function processPhaseResult(
  result: { status: string; message?: string; error?: string; reason?: string; rawOutput?: string; metrics?: Record<string, unknown> },
  phase: Phase, durationMs: number, context: PhaseContext, phaseStatus: Map<string, PhaseStatus>,
  collector: SummaryCollector, itemNum: number
): boolean {
  let summary: StageSummary = { name: phase.name, status: mapResultStatus(result.status), durationMs };
  if (result.status === 'success' && result.metrics) {
    summary = parsePhaseMetrics(summary, phase.name as PhaseName, context.logsDir, itemNum, result.metrics);
  }
  collector.addStage(summary);

  if (result.status === 'success') {
    handlePhaseSuccess({ message: result.message || '', rawOutput: result.rawOutput }, phase, durationMs, phaseStatus);
    return false;
  }
  if (result.status === 'skipped') {
    phaseStatus.set(phase.name, 'skipped');
    printStageSkipped(phase.name, result.reason || 'skipped');
    return false;
  }
  phaseStatus.set(phase.name, 'failed');
  printStageFailed(phase.name, result.error || 'unknown error');
  return true;
}

/** Result from a retry attempt including the phase result. */
interface RetryAttemptResult {
  done: boolean;
  failed: boolean;
  error?: string;
  result?: PhaseResult;
}

/** Execute a single retry attempt. */
async function executeRetryAttempt(
  phase: Phase, context: PhaseContext, attempt: number
): Promise<RetryAttemptResult> {
  const result = await phase.execute(context);
  if (result.status === 'success' || result.status === 'skipped') {
    return { done: true, failed: false, result };
  }
  const error = result.error || 'Phase failed';
  if (!isCorrectableFailure(error) || attempt >= MAX_RETRIES - 1) {
    return { done: true, failed: true, error, result };
  }
  context.correctivePrompt = buildCorrectivePrompt(error, attempt, phase.name);
  return { done: false, failed: false, error };
}

/** Execute phase with retry logic. */
async function executePhaseWithRetry(
  phase: Phase, context: PhaseContext, phaseStatus: Map<string, PhaseStatus>,
  collector: SummaryCollector, itemNum: number
): Promise<boolean> {
  const startTime = Date.now();
  const commitHash = await getGitCommitHash(context.projectPath);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const attemptResult = await executeRetryAttempt(phase, context, attempt);
    if (attemptResult.done) {
      const durationMs = Date.now() - startTime;
      if (attemptResult.failed) {
        return handlePhaseError(attemptResult.error!, phase, durationMs, context.projectPath, commitHash, phaseStatus, collector);
      }
      // Use the result from the attempt, don't execute again
      return processPhaseResult(attemptResult.result!, phase, durationMs, context, phaseStatus, collector, itemNum);
    }
  }
  return true;
}

/** Execute a single phase (no retry). */
async function executePhase(
  phase: Phase, context: PhaseContext, phaseStatus: Map<string, PhaseStatus>,
  collector: SummaryCollector, itemNum: number
): Promise<boolean> {
  const startTime = Date.now();
  const result = await phase.execute(context);
  const durationMs = Date.now() - startTime;
  return processPhaseResult(result, phase, durationMs, context, phaseStatus, collector, itemNum);
}

/** Check if phase should be skipped. */
function shouldSkipPhase(phase: Phase, context: PhaseContext, skipReview?: boolean): string | null {
  if (skipReview && (phase.name === 'independent-review' || phase.name === 'static-analysis')) {
    return 'review skipped';
  }
  if (phase.shouldRun && !phase.shouldRun(context)) {
    return 'not applicable';
  }
  return null;
}

/** Run a single phase with spinner and tracing. */
async function runSinglePhase(
  phase: Phase, phaseIndex: number, phases: Phase[], context: PhaseContext,
  config: RalphConfig, item: PrdItem, projectPath: string,
  phaseStatus: Map<string, PhaseStatus>, collector: SummaryCollector, itemNum: number, trace?: boolean
): Promise<boolean> {
  const detection = getDetectionInfo(config, phase, item, projectPath);
  printStageHeader(phase.name, detection, phaseIndex, phases.length);

  if (trace && detection.skills.length > 0) {
    console.log(formatTrace(traceSkillConfig(projectPath, detection.skills[0], item.text)));
  }

  const spinner = new Spinner(`${phase.name}...`);
  spinner.start();

  try {
    const failed = await executePhaseWithRetry(phase, context, phaseStatus, collector, itemNum);
    spinner.stop();
    return failed;
  } catch (err) {
    spinner.stop();
    const error = err instanceof Error ? err.message : String(err);
    phaseStatus.set(phase.name, 'failed');
    printStageFailed(phase.name, error);
    collector.addStage({ name: phase.name, status: 'failed', durationMs: 0 });
    return true;
  }
}

/** Run all phases for an item. */
export async function runItemPhases(
  phases: Phase[], item: PrdItem, session: Session, config: RalphConfig, projectPath: string,
  skipReview: boolean | undefined, verbose: boolean | undefined, phaseStatus: Map<string, PhaseStatus>,
  collector: SummaryCollector, itemNum: number, trace?: boolean
): Promise<boolean> {
  createWorkflowMarker(projectPath);

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const context = buildPhaseContext(session, item, config, phase, projectPath);
    const skipReason = shouldSkipPhase(phase, context, skipReview);

    if (skipReason) {
      phaseStatus.set(phase.name, 'skipped');
      if (verbose) printStageSkipped(phase.name, skipReason);
      continue;
    }

    const failed = await runSinglePhase(
      phase, i, phases, context, config, item, projectPath, phaseStatus, collector, itemNum, trace
    );
    if (failed) return true;
  }
  return false;
}
