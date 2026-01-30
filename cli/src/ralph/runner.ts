/**
 * Main ralph runner - orchestrates PRD item processing.
 *
 * Following mcilroy: pipeline architecture.
 * Following kernighan: simple control flow.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Prd, PrdItem, Session, RalphConfig, Skill, PhaseName, ExpertDetection } from './types.js';
import { parsePrd, countIncomplete, getNextIncomplete, getIncompleteItems, isAllComplete } from './prd/parser.js';
import { markItemComplete } from './prd/updater.js';
import { loadConfig } from './config/loader.js';
import { loadSkills } from './skills/loader.js';
import { createPhases, PhaseContext, PhaseStatus, detectExperts, Phase } from './phases/index.js';
import {
  SummaryCollector,
  generateSummaryHtml,
  openSummary,
  parseGeminiIssues,
  parseQodanaIssues,
  parseTestResults,
  parseRefactorResults,
  StageSummary,
} from './summary/index.js';
import {
  printHeader,
  printItemHeader,
  printStageHeader,
  printStageComplete,
  printStageFailed,
  printStageSkipped,
  printItemComplete,
  printAllComplete,
  printError,
  printWarning,
  printInfo,
  printPipelineProgress,
  printSummaryLink,
  Spinner,
} from './display/terminal.js';
import { getGitCommitHash, hasNewCommitsSince } from './process/claude.js';

export interface RunnerOptions {
  prdPath: string;
  projectPath: string;
  skipReview?: boolean;
  verbose?: boolean;
}

/** Check if timeout can be recovered via commit detection. */
async function canRecoverFromTimeout(
  error: string,
  projectPath: string,
  commitHashBefore: string | null
): Promise<boolean> {
  if (!error.includes('timed out') || !commitHashBefore) {
    return false;
  }
  return hasNewCommitsSince(projectPath, commitHashBefore);
}

/** Handle early exit when PRD is already complete. */
async function handleAlreadyComplete(
  prd: Prd,
  summaryCollector: SummaryCollector,
  logsDir: string
): Promise<void> {
  printAllComplete();
  for (let i = 0; i < prd.items.length; i++) {
    summaryCollector.startItem(i + 1, prd.items[i].text);
    summaryCollector.completeItem('success');
  }
  const summary = summaryCollector.build();
  const summaryPath = generateSummaryHtml(summary, logsDir);
  printSummaryLink(summaryPath);
  await openSummary(summaryPath);
}

/** Build phase execution context. */
function buildPhaseContext(
  session: Session,
  item: PrdItem,
  config: RalphConfig,
  phase: Phase,
  projectPath: string,
  verbose: boolean = false
): PhaseContext {
  const profileExperts = getProfileExpertsForPhase(config, phase.name);
  const detection = detectExperts(projectPath, phase.name, item.text, profileExperts);
  const skills = loadSkills(projectPath, detection.experts as string[], verbose);

  return {
    session,
    item,
    experts: skills,
    projectPath,
    logsDir: session.logsDir,
  };
}

/** Parse phase-specific metrics into summary. */
function parsePhaseMetrics(
  phaseSummary: StageSummary,
  phaseName: PhaseName,
  logsDir: string,
  itemNum: number,
  metrics: Record<string, unknown>
): void {
  if (phaseName === 'adversarial-review') {
    const rawPath = path.join(logsDir, `item${itemNum}-adversarial-review.raw`);
    const qodanaPath = path.join(logsDir, `item${itemNum}-static-analysis-qodana.raw`);
    if (fs.existsSync(rawPath)) {
      (phaseSummary as any).gemini = parseGeminiIssues(fs.readFileSync(rawPath, 'utf-8'));
    }
    if (fs.existsSync(qodanaPath)) {
      (phaseSummary as any).qodana = parseQodanaIssues(fs.readFileSync(qodanaPath, 'utf-8'));
    }
  } else if (phaseName === 'build-tests') {
    (phaseSummary as any).tests = {
      passed: metrics.passed ?? 0,
      failed: metrics.failed ?? 0,
      written: metrics.written ?? 0,
    };
  } else if (phaseName === 'refactor-check') {
    const rawPath = path.join(logsDir, `item${itemNum}-refactor-check.raw`);
    if (fs.existsSync(rawPath)) {
      (phaseSummary as any).refactor = parseRefactorResults(fs.readFileSync(rawPath, 'utf-8'));
    }
  }
}

/** Finalize run with summary generation. */
async function finalizeRun(
  prd: Prd,
  summaryCollector: SummaryCollector,
  logsDir: string
): Promise<void> {
  if (isAllComplete(prd)) {
    printAllComplete();
  }
  const summary = summaryCollector.build();
  const summaryPath = generateSummaryHtml(summary, logsDir);
  printSummaryLink(summaryPath);
  await openSummary(summaryPath);
}

/** Get detection info for phase header. */
function getDetectionInfo(
  config: RalphConfig,
  phase: Phase,
  item: PrdItem,
  projectPath: string
): { skills: string[]; keywords: string[] } {
  const profileExperts = getProfileExpertsForPhase(config, phase.name);
  const detection = detectExperts(projectPath, phase.name, item.text, profileExperts);
  return {
    skills: detection.experts as string[],
    keywords: detection.matchedKeywords as string[],
  };
}

/** Run ralph on a PRD file. */
export async function run(options: RunnerOptions): Promise<void> {
  const { prdPath, projectPath, skipReview, verbose } = options;
  const config = loadConfig(projectPath);
  const prdContent = fs.readFileSync(prdPath, 'utf-8');
  let prd = parsePrd(prdPath, prdContent);
  const session = createSession(prdPath, projectPath, prd);

  const projectType = detectProjectType(projectPath);
  printHeader(prdPath, countIncomplete(prd), projectType);

  const phases = createPhases();
  const summaryCollector = new SummaryCollector(
    session.id, prdPath, projectType, prd.items.length
  );

  if (isAllComplete(prd)) {
    await handleAlreadyComplete(prd, summaryCollector, session.logsDir);
    return;
  }

  const attemptedItems = new Set<number>();
  let itemNum = 0;

  while (!isAllComplete(prd)) {
    const item = getIncompleteItems(prd).find(i => !attemptedItems.has(i.lineNumber));
    if (!item) break;

    attemptedItems.add(item.lineNumber);
    itemNum++;
    session.currentItem = itemNum;
    summaryCollector.startItem(itemNum, item.text);

    const phaseStatus = new Map<string, PhaseStatus>();
    phases.forEach(p => phaseStatus.set(p.name, 'pending'));
    printItemHeader(itemNum, prd.items.length, item.text, phaseStatus);

    const itemFailed = await runItemPhases(
      phases, item, session, config, projectPath, skipReview, verbose,
      phaseStatus, summaryCollector, itemNum
    );

    if (!itemFailed) {
      summaryCollector.completeItem('success');
      const updatedContent = markItemComplete(prd, item);
      fs.writeFileSync(prdPath, updatedContent);
      prd = parsePrd(prdPath, updatedContent);
      printItemComplete(itemNum, countIncomplete(prd));
      session.completedItems++;
    } else {
      summaryCollector.completeItem('failed');
      printWarning(`Item ${itemNum} failed, moving to next item`);
    }

    if (itemNum >= (config.settings?.maxIterations ?? 50)) {
      printWarning('Max iterations reached');
      break;
    }
  }

  await finalizeRun(prd, summaryCollector, session.logsDir);
}

/** Run all phases for a single item. Returns true if item failed. */
async function runItemPhases(
  phases: Phase[],
  item: PrdItem,
  session: Session,
  config: RalphConfig,
  projectPath: string,
  skipReview: boolean | undefined,
  verbose: boolean | undefined,
  phaseStatus: Map<string, PhaseStatus>,
  summaryCollector: SummaryCollector,
  itemNum: number
): Promise<boolean> {
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const commitHash = await getGitCommitHash(projectPath);

    if (phase.name === 'adversarial-review' && skipReview) {
      phaseStatus.set(phase.name, 'skipped');
      continue;
    }

    const context = buildPhaseContext(session, item, config, phase, projectPath, true);

    if (!phase.shouldRun(context)) {
      phaseStatus.set(phase.name, 'skipped');
      if (verbose) printStageSkipped(phase.name, 'Not needed');
      continue;
    }

    phaseStatus.set(phase.name, 'running');
    const detectionInfo = getDetectionInfo(config, phase, item, projectPath);
    printStageHeader(phase.name, detectionInfo, i, phases.length);

    const failed = await executePhase(
      phase, context, projectPath, commitHash,
      phaseStatus, summaryCollector, itemNum
    );

    if (failed) return true;
  }
  return false;
}

/** Execute a single phase with error handling. Returns true if failed. */
async function executePhase(
  phase: Phase,
  context: PhaseContext,
  projectPath: string,
  commitHash: string | null,
  phaseStatus: Map<string, PhaseStatus>,
  summaryCollector: SummaryCollector,
  itemNum: number
): Promise<boolean> {
  const spinner = new Spinner(`Running ${phase.name}...`);
  spinner.start();
  const startTime = Date.now();

  try {
    const result = await phase.execute(context);
    const durationMs = Date.now() - startTime;
    spinner.stop();

    const phaseSummary: StageSummary = {
      name: phase.name,
      status: result.status === 'success' ? 'done' : result.status === 'skipped' ? 'skipped' : 'failed',
      durationMs,
    };

    if (result.status === 'success' && result.metrics) {
      parsePhaseMetrics(phaseSummary, phase.name, context.logsDir, itemNum, result.metrics);
    }

    summaryCollector.addStage(phaseSummary);

    if (result.status === 'success') {
      phaseStatus.set(phase.name, 'done');
      printStageComplete(phase.name, durationMs / 1000, result.message);
      return false;
    } else if (result.status === 'skipped') {
      phaseStatus.set(phase.name, 'skipped');
      printStageSkipped(phase.name, result.reason);
      return false;
    } else {
      phaseStatus.set(phase.name, 'failed');
      printStageFailed(phase.name, result.error);
      return true;
    }
  } catch (err) {
    spinner.stop();
    const error = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startTime;

    if (await canRecoverFromTimeout(error, projectPath, commitHash)) {
      printInfo(`Timeout but commits detected - treating as success`);
      phaseStatus.set(phase.name, 'done');
      printStageComplete(phase.name, durationMs / 1000, 'Completed (timeout with commits)');
      summaryCollector.addStage({ name: phase.name, status: 'done', durationMs });
      return false;
    }

    phaseStatus.set(phase.name, 'failed');
    printStageFailed(phase.name, error);
    summaryCollector.addStage({ name: phase.name, status: 'failed', durationMs });
    return true;
  }
}

/** Get profile experts for a phase. */
function getProfileExpertsForPhase(config: RalphConfig, phaseName: PhaseName): string[] {
  const mapping: Record<PhaseName, keyof RalphConfig['skills']> = {
    'plan': 'plan',
    'structure-first': 'plan',
    'implement': 'build',
    'build-tests': 'test',
    'refactor-check': 'refactor',
    'adversarial-review': 'review',
    'static-analysis': 'review',
    'doc-code': 'doc',
  };
  return config.skills[mapping[phaseName]] ?? [];
}

/** Create a new session. */
function createSession(prdPath: string, projectPath: string, prd: Prd): Session {
  const id = generateSessionId();
  const logsDir = path.join(projectPath, '.claude', 'ralph-logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return {
    id,
    startTime: new Date(),
    prdPath,
    projectPath,
    logsDir,
    currentItem: 0,
    totalItems: prd.items.length,
    completedItems: prd.items.length - countIncomplete(prd),
  };
}

/** Generate a unique session ID. */
function generateSessionId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `${date}-${time}-${rand}`;
}

/** Detect project type from files. */
function detectProjectType(projectPath: string): string {
  if (fs.existsSync(path.join(projectPath, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
    if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) {
      return 'TypeScript';
    }
    return 'JavaScript';
  }
  if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) return 'Python';
  if (fs.existsSync(path.join(projectPath, 'go.mod'))) return 'Go';
  if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) return 'Rust';
  return 'Unknown';
}
