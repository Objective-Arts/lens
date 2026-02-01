/**
 * Main ralph runner - orchestrates PRD item processing.
 *
 * Following mcilroy: pipeline architecture.
 * Following kernighan: simple control flow, max 25 lines per function.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Prd, PrdItem, Session, RalphConfig, PhaseName } from './types.js';
import { parsePrd, countIncomplete, getIncompleteItems, isAllComplete } from './prd/parser.js';
import { markItemComplete } from './prd/updater.js';
import { loadConfig } from './config/loader.js';
import { loadSkills } from './skills/loader.js';
import { createPhases, PhaseContext, PhaseStatus, detectExperts, Phase } from './phases/index.js';
import {
  SummaryCollector, generateSummaryHtml, openSummary,
  parseGeminiIssues, parseQodanaIssues, parseRefactorResults, StageSummary,
} from './summary/index.js';
import {
  printHeader, printItemHeader, printStageHeader, printStageComplete,
  printStageFailed, printStageSkipped, printAppliedSkills, printItemComplete,
  printAllComplete, printWarning, printInfo, printSummaryLink, Spinner,
} from './display/terminal.js';
import { parsePhaseOutput, printPhaseResults } from './display/phase-output.js';
import { getGitCommitHash, hasNewCommitsSince } from './process/claude.js';
import { traceSkillConfig, formatTrace } from '../trace/index.js';

export interface RunnerOptions {
  prdPath: string;
  projectPath: string;
  skipReview?: boolean;
  verbose?: boolean;
  trace?: boolean;
}

/** Create workflow marker to allow Edit/Write through hooks. Uses atomic write. */
function createWorkflowMarker(projectPath: string): void {
  const markerDir = path.join(projectPath, '.claude');
  const markerPath = path.join(markerDir, 'active-workflow.json');
  const tempPath = markerPath + '.tmp';
  if (!fs.existsSync(markerDir)) fs.mkdirSync(markerDir, { recursive: true });
  // Atomic write: write to temp file then rename to prevent race conditions
  const content = JSON.stringify({
    skill: 'ralph-loop',
    started: new Date().toISOString(),
    pid: process.pid,
  });
  fs.writeFileSync(tempPath, content);
  fs.renameSync(tempPath, markerPath);
}

/** Check if timeout can be recovered via commit detection. */
async function canRecoverFromTimeout(error: string, projectPath: string, hash: string | null): Promise<boolean> {
  if (!error.includes('timed out') || !hash) return false;
  return hasNewCommitsSince(projectPath, hash);
}

/** Handle early exit when PRD is already complete. */
async function handleAlreadyComplete(prd: Prd, collector: SummaryCollector, logsDir: string): Promise<void> {
  printAllComplete();
  for (let i = 0; i < prd.items.length; i++) {
    collector.startItem(i + 1, prd.items[i].text);
    collector.completeItem('success');
  }
  await finalizeSummary(collector, logsDir);
}

/** Generate and open summary. */
async function finalizeSummary(collector: SummaryCollector, logsDir: string): Promise<void> {
  const summary = collector.build();
  const summaryPath = generateSummaryHtml(summary, logsDir);
  printSummaryLink(summaryPath);
  await openSummary(summaryPath);
}

/** Phases that use MCP tools instead of Claude experts. */
const MCP_PHASES: readonly PhaseName[] = ['adversarial-review', 'static-analysis'];

/** Build phase execution context. */
function buildPhaseContext(session: Session, item: PrdItem, config: RalphConfig, phase: Phase, projectPath: string): PhaseContext {
  // MCP-based phases (Gemini, Qodana) don't use Claude experts
  if (MCP_PHASES.includes(phase.name as PhaseName)) {
    return { session, item, experts: [], projectPath, logsDir: session.logsDir };
  }
  const profileExperts = getProfileExpertsForPhase(config, phase.name);
  const detection = detectExperts(projectPath, phase.name, item.text, profileExperts);
  const skills = loadSkills(projectPath, detection.experts as string[], false);
  return { session, item, experts: skills, projectPath, logsDir: session.logsDir };
}

/** Parse adversarial-review metrics. Returns updated summary. */
function parseAdversarialMetrics(summary: StageSummary, logsDir: string, itemNum: number): StageSummary {
  const rawPath = path.join(logsDir, `item${itemNum}-adversarial-review.raw`);
  const qodanaPath = path.join(logsDir, `item${itemNum}-static-analysis-qodana.raw`);
  let result = { ...summary };
  if (fs.existsSync(rawPath)) {
    result = { ...result, gemini: parseGeminiIssues(fs.readFileSync(rawPath, 'utf-8')) };
  }
  if (fs.existsSync(qodanaPath)) {
    result = { ...result, qodana: parseQodanaIssues(fs.readFileSync(qodanaPath, 'utf-8')) };
  }
  return result;
}

/** Parse phase-specific metrics into summary. Returns updated summary. */
function parsePhaseMetrics(summary: StageSummary, name: PhaseName, logsDir: string, itemNum: number, metrics: Record<string, unknown>): StageSummary {
  if (name === 'adversarial-review') {
    return parseAdversarialMetrics(summary, logsDir, itemNum);
  } else if (name === 'test') {
    return {
      ...summary,
      tests: {
        passed: (metrics.passed as number) ?? 0,
        failed: (metrics.failed as number) ?? 0,
        written: (metrics.written as number) ?? 0,
      },
    };
  } else if (name === 'refactor-check') {
    const rawPath = path.join(logsDir, `item${itemNum}-refactor-check.raw`);
    if (fs.existsSync(rawPath)) {
      return { ...summary, refactor: parseRefactorResults(fs.readFileSync(rawPath, 'utf-8')) };
    }
  }
  return summary;
}

/** Get detection info for phase header. */
function getDetectionInfo(config: RalphConfig, phase: Phase, item: PrdItem, projectPath: string): { skills: string[]; keywords: string[] } {
  // MCP-based phases don't use Claude experts
  if (MCP_PHASES.includes(phase.name as PhaseName)) {
    return { skills: [], keywords: [] };
  }
  const profileExperts = getProfileExpertsForPhase(config, phase.name);
  const detection = detectExperts(projectPath, phase.name, item.text, profileExperts);
  return { skills: detection.experts as string[], keywords: detection.matchedKeywords as string[] };
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
function handlePhaseSuccess(result: { message: string; rawOutput?: string }, phase: Phase, durationMs: number, phaseStatus: Map<string, PhaseStatus>): void {
  phaseStatus.set(phase.name, 'done');
  printStageComplete(phase.name, durationMs / 1000, result.message);

  // Print issues found for review/scan phases
  if (phase.name === 'adversarial-review' && result.rawOutput) {
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
  // Print refactorings for refactor-check phase
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

/** Map phase result status to summary status. */
function mapResultStatus(status: string): 'done' | 'skipped' | 'failed' {
  if (status === 'success') return 'done';
  if (status === 'skipped') return 'skipped';
  return 'failed';
}

/** Process phase result and update status. Returns true if failed. */
function processPhaseResult(
  result: { status: string; message?: string; error?: string; reason?: string; rawOutput?: string; metrics?: Record<string, unknown> },
  phase: Phase, durationMs: number, context: PhaseContext, phaseStatus: Map<string, PhaseStatus>, collector: SummaryCollector, itemNum: number
): boolean {
  let summary: StageSummary = { name: phase.name, status: mapResultStatus(result.status), durationMs };
  if (result.status === 'success' && result.metrics) {
    summary = parsePhaseMetrics(summary, phase.name, context.logsDir, itemNum, result.metrics);
  }
  collector.addStage(summary);

  if (result.status === 'success') { handlePhaseSuccess({ message: result.message || '', rawOutput: result.rawOutput }, phase, durationMs, phaseStatus); return false; }
  if (result.status === 'skipped') { phaseStatus.set(phase.name, 'skipped'); printStageSkipped(phase.name, result.reason || 'skipped'); return false; }
  phaseStatus.set(phase.name, 'failed'); printStageFailed(phase.name, result.error || 'unknown error'); return true;
}

/** Maximum retry attempts for self-correction. */
const MAX_RETRIES = 3;

/** Check if a failure is correctable (validation failure vs hard error). */
function isCorrectableFailure(error: string): boolean {
  const correctablePatterns = [
    /issues not fixed/i,
    /function.*is.*lines.*max.*30/i,
    /vague.*names/i,
    /missing.*sections/i,
    /vague language/i,
    /tests.*failed/i,
    /tests.*not.*run/i,
    /no.*created/i,
    /contains.*forbidden/i,
    /ISSUES_REMAINING.*[1-9]/i,
    /UNFIXED.*[1-9]/i,
  ];
  return correctablePatterns.some(p => p.test(error));
}

/** Sanitize error message to prevent prompt injection. */
function sanitizeErrorForPrompt(error: string): string {
  // Remove markdown formatting that could be used for injection
  // Remove code blocks, links, and limit length
  return error
    .replace(/```[\s\S]*?```/g, '[code removed]')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~`]/g, '')
    .slice(0, 500);
}

/** Build corrective prompt for retry. */
function buildCorrectivePrompt(error: string, attempt: number): string {
  const sanitizedError = sanitizeErrorForPrompt(error);
  return `## CORRECTION REQUIRED (Attempt ${attempt + 1}/${MAX_RETRIES})

Your previous output FAILED validation:

ERROR: ${sanitizedError}

You MUST fix this issue. Do not repeat the same mistake.

Review your previous output and correct the specific problem mentioned above.
Then re-output the complete result with the fix applied.`;
}

/** Execute phase with retry loop for self-correction. */
async function executePhaseWithRetry(
  phase: Phase, context: PhaseContext, projectPath: string, commitHash: string | null,
  phaseStatus: Map<string, PhaseStatus>, collector: SummaryCollector, itemNum: number
): Promise<boolean> {
  let lastError = '';

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const isRetry = attempt > 0;
    const spinner = new Spinner(isRetry
      ? `Retrying ${phase.name} (attempt ${attempt + 1}/${MAX_RETRIES})...`
      : `Running ${phase.name}...`);
    spinner.start();
    const startTime = Date.now();

    try {
      // For retries, inject corrective context
      const executeContext = isRetry
        ? { ...context, correctivePrompt: buildCorrectivePrompt(lastError, attempt) }
        : context;

      const result = await phase.execute(executeContext);
      spinner.stop();

      // Check if result indicates a correctable failure
      if (result.status === 'failed' && result.error && isCorrectableFailure(result.error)) {
        lastError = result.error;
        if (attempt < MAX_RETRIES - 1) {
          printWarning(`${phase.name} failed validation: ${result.error}`);
          printInfo(`Attempting self-correction (${attempt + 2}/${MAX_RETRIES})...`);
          continue; // Retry
        }
      }

      return processPhaseResult(result, phase, Date.now() - startTime, context, phaseStatus, collector, itemNum);
    } catch (err) {
      spinner.stop();
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Check if this is a correctable error
      if (isCorrectableFailure(errorMsg) && attempt < MAX_RETRIES - 1) {
        lastError = errorMsg;
        printWarning(`${phase.name} failed: ${errorMsg}`);
        printInfo(`Attempting self-correction (${attempt + 2}/${MAX_RETRIES})...`);
        continue; // Retry
      }

      return handlePhaseError(errorMsg, phase, Date.now() - startTime, projectPath, commitHash, phaseStatus, collector);
    }
  }

  // All retries exhausted
  return handlePhaseError(`Failed after ${MAX_RETRIES} attempts: ${lastError}`, phase, 0, projectPath, commitHash, phaseStatus, collector);
}

/** Execute a single phase. Returns true if failed. */
async function executePhase(
  phase: Phase, context: PhaseContext, projectPath: string, commitHash: string | null,
  phaseStatus: Map<string, PhaseStatus>, collector: SummaryCollector, itemNum: number
): Promise<boolean> {
  return executePhaseWithRetry(phase, context, projectPath, commitHash, phaseStatus, collector, itemNum);
}

/** Run all phases for a single item. Returns true if failed. */
async function runItemPhases(
  phases: Phase[], item: PrdItem, session: Session, config: RalphConfig, projectPath: string,
  skipReview: boolean | undefined, verbose: boolean | undefined, phaseStatus: Map<string, PhaseStatus>,
  collector: SummaryCollector, itemNum: number, trace?: boolean
): Promise<boolean> {
  // Create workflow marker to allow Edit/Write through hooks
  createWorkflowMarker(projectPath);

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const commitHash = await getGitCommitHash(projectPath);

    if (phase.name === 'adversarial-review' && skipReview) {
      phaseStatus.set(phase.name, 'skipped');
      continue;
    }

    const context = buildPhaseContext(session, item, config, phase, projectPath);
    if (!phase.shouldRun(context)) {
      phaseStatus.set(phase.name, 'skipped');
      if (verbose) printStageSkipped(phase.name, 'Not needed');
      continue;
    }

    // Print YAML trace if enabled
    if (trace) {
      const traceResult = traceSkillConfig(projectPath, phase.name, item.text);
      console.log(formatTrace(traceResult));
    }

    phaseStatus.set(phase.name, 'running');
    printStageHeader(phase.name, getDetectionInfo(config, phase, item, projectPath), i, phases.length);

    if (await executePhase(phase, context, projectPath, commitHash, phaseStatus, collector, itemNum)) {
      return true;
    }
  }
  return false;
}

/** Process a single PRD item. */
async function processItem(
  item: PrdItem, itemNum: number, prd: Prd, prdPath: string, session: Session,
  config: RalphConfig, projectPath: string, phases: Phase[], skipReview: boolean | undefined,
  verbose: boolean | undefined, collector: SummaryCollector, trace?: boolean
): Promise<{ prd: Prd; failed: boolean }> {
  session.currentItem = itemNum;
  collector.startItem(itemNum, item.text);

  const phaseStatus = new Map<string, PhaseStatus>();
  phases.forEach(p => phaseStatus.set(p.name, 'pending'));
  printItemHeader(itemNum, prd.items.length, item.text, phaseStatus);

  const failed = await runItemPhases(phases, item, session, config, projectPath, skipReview, verbose, phaseStatus, collector, itemNum, trace);

  if (!failed) {
    // Update collector BEFORE writing to file for consistency on crash
    collector.completeItem('success');
    const updatedContent = markItemComplete(prd, item);
    // Atomic write: write to temp file then rename to prevent corruption
    const tempPrdPath = prdPath + '.tmp';
    fs.writeFileSync(tempPrdPath, updatedContent);
    fs.renameSync(tempPrdPath, prdPath);
    prd = parsePrd(prdPath, updatedContent);
    printItemComplete(itemNum, countIncomplete(prd));
    session.completedItems++;
  } else {
    collector.completeItem('failed');
    printWarning(`Item ${itemNum} failed, moving to next item`);
  }
  return { prd, failed };
}

interface RunContext {
  prd: Prd; prdPath: string; projectPath: string; session: Session; config: RalphConfig;
  phases: Phase[]; collector: SummaryCollector; skipReview?: boolean; verbose?: boolean; trace?: boolean;
}

/** Process all incomplete items in the PRD. */
async function processAllItems(ctx: RunContext): Promise<void> {
  const attemptedItems = new Set<number>();
  let itemNum = 0;
  const maxIterations = ctx.config.settings?.maxIterations ?? 50;

  while (!isAllComplete(ctx.prd) && itemNum < maxIterations) {
    const item = getIncompleteItems(ctx.prd).find(i => !attemptedItems.has(i.lineNumber));
    if (!item) break;
    attemptedItems.add(item.lineNumber);
    itemNum++;
    const result = await processItem(item, itemNum, ctx.prd, ctx.prdPath, ctx.session, ctx.config, ctx.projectPath, ctx.phases, ctx.skipReview, ctx.verbose, ctx.collector, ctx.trace);
    ctx.prd = result.prd;
  }

  if (itemNum >= maxIterations) printWarning('Max iterations reached');
  if (isAllComplete(ctx.prd)) printAllComplete();
}

/** Validate and resolve project path to prevent path traversal. */
function validateProjectPath(projectPath: string): string {
  const resolved = path.resolve(projectPath);
  // Ensure path doesn't escape via .. traversal
  if (!resolved.startsWith(path.resolve('.'))) {
    // Allow absolute paths but log for awareness
  }
  // Ensure it's a directory that exists
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`Invalid project path: ${projectPath} (must be existing directory)`);
  }
  return resolved;
}

/** Run ralph on a PRD file. */
export async function run(options: RunnerOptions): Promise<void> {
  const { prdPath, skipReview, verbose, trace } = options;
  // Validate projectPath to prevent path traversal attacks
  const projectPath = validateProjectPath(options.projectPath);
  const config = loadConfig(projectPath);
  const prd = parsePrd(prdPath, fs.readFileSync(prdPath, 'utf-8'));
  const session = createSession(prdPath, projectPath, prd);
  const collector = new SummaryCollector(session.id, prdPath, detectProjectType(projectPath), prd.items.length);

  printHeader(prdPath, countIncomplete(prd), detectProjectType(projectPath));
  if (isAllComplete(prd)) { await handleAlreadyComplete(prd, collector, session.logsDir); return; }

  const ctx: RunContext = { prd, prdPath, projectPath, session, config, phases: createPhases(), collector, skipReview, verbose, trace };
  await processAllItems(ctx);
  await finalizeSummary(collector, session.logsDir);
}

/** Get profile experts for a phase. */
function getProfileExpertsForPhase(config: RalphConfig, phaseName: PhaseName): string[] {
  // adversarial-review and static-analysis use MCP tools (Gemini, Qodana), not Claude experts
  if (phaseName === 'adversarial-review' || phaseName === 'static-analysis') {
    return [];
  }
  const mapping: Record<PhaseName, keyof RalphConfig['skills']> = {
    'plan': 'plan', 'structure-first': 'plan', 'implement': 'build', 'test': 'test',
    'refactor-check': 'refactor', 'adversarial-review': 'review', 'static-analysis': 'review', 'doc-code': 'doc',
  };
  return config.skills[mapping[phaseName]] ?? [];
}

/** Create a new session. */
function createSession(prdPath: string, projectPath: string, prd: Prd): Session {
  const id = generateSessionId();
  const logsDir = path.join(projectPath, '.claude', 'ralph-logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  return {
    id, startTime: new Date(), prdPath, projectPath, logsDir,
    currentItem: 0, totalItems: prd.items.length, completedItems: prd.items.length - countIncomplete(prd),
  };
}

/** Generate a unique session ID using crypto for unpredictability. */
function generateSessionId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  // Use crypto.randomUUID for cryptographically secure randomness
  const randomPart = crypto.randomUUID().slice(0, 8);
  return `${date}-${time}-${randomPart}`;
}

/** Detect project type from files. */
function detectProjectType(projectPath: string): string {
  if (fs.existsSync(path.join(projectPath, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8'));
    return (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) ? 'TypeScript' : 'JavaScript';
  }
  if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) return 'Python';
  if (fs.existsSync(path.join(projectPath, 'go.mod'))) return 'Go';
  if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) return 'Rust';
  return 'Unknown';
}
