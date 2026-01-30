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
import { createPhases, PhaseContext, PhaseStatus, detectExperts } from './phases/index.js';
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
  printPipelineProgress,
  printSummaryLink,
  Spinner,
} from './display/terminal.js';

export interface RunnerOptions {
  prdPath: string;
  projectPath: string;
  skipReview?: boolean;
  verbose?: boolean;
}

/**
 * Run ralph on a PRD file.
 */
export async function run(options: RunnerOptions): Promise<void> {
  const { prdPath, projectPath, skipReview, verbose } = options;

  // Load configuration
  const config = loadConfig(projectPath);

  // Parse PRD
  const prdContent = fs.readFileSync(prdPath, 'utf-8');
  let prd = parsePrd(prdPath, prdContent);

  // Initialize session
  const session = createSession(prdPath, projectPath, prd);

  // Print header
  const remaining = countIncomplete(prd);
  const projectType = detectProjectType(projectPath);
  printHeader(prdPath, remaining, projectType);

  // Create phases (8-phase workflow)
  const phases = createPhases();

  // Initialize summary collector BEFORE early exit check
  const summaryCollector = new SummaryCollector(
    session.id,
    prdPath,
    projectType,
    prd.items.length
  );

  // Check if already complete - generate summary and exit
  if (isAllComplete(prd)) {
    printAllComplete();

    // Still generate summary showing all items as complete
    for (let i = 0; i < prd.items.length; i++) {
      const item = prd.items[i];
      summaryCollector.startItem(i + 1, item.text);
      summaryCollector.completeItem('success');
    }

    const summary = summaryCollector.build();
    const summaryPath = generateSummaryHtml(summary, session.logsDir);
    printSummaryLink(summaryPath);
    await openSummary(summaryPath);
    return;
  }

  // Track attempted items to avoid infinite loop on failures
  const attemptedItems = new Set<number>();

  // Main loop - process each incomplete item
  let itemNum = 0;
  while (!isAllComplete(prd)) {
    // Get all incomplete items and find one we haven't attempted
    const incompleteItems = getIncompleteItems(prd);
    const item = incompleteItems.find(i => !attemptedItems.has(i.lineNumber));

    if (!item) {
      // All incomplete items have been attempted
      break;
    }

    attemptedItems.add(item.lineNumber);
    itemNum++;
    session.currentItem = itemNum;

    // Start tracking this item in summary
    summaryCollector.startItem(itemNum, item.text);

    // Initialize phase status tracking for pipeline progress display
    const phaseStatus = new Map<string, PhaseStatus>();
    for (const p of phases) {
      phaseStatus.set(p.name, 'pending');
    }

    // Print item header with pipeline progress
    printItemHeader(itemNum, prd.items.length, item.text, phaseStatus);

    // Run each phase for this item
    let itemFailed = false;
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phase = phases[phaseIndex];

      // Skip adversarial-review if requested (replaces old 'review' skip)
      if (phase.name === 'adversarial-review' && skipReview) {
        phaseStatus.set(phase.name, 'skipped');
        continue;
      }

      // Get experts for this phase using new 4-layer detection
      const profileExperts = getProfileExpertsForPhase(config, phase.name);
      const detection = detectExperts(projectPath, phase.name, item.text, profileExperts);

      // Convert expert names to Skill objects
      const skills = loadSkills(projectPath, detection.experts as string[]);

      // Build context
      const context: PhaseContext = {
        session,
        item,
        experts: skills,
        projectPath,
        logsDir: session.logsDir,
      };

      // Check if phase should run
      if (!phase.shouldRun(context)) {
        phaseStatus.set(phase.name, 'skipped');
        if (verbose) {
          printStageSkipped(phase.name, 'Not needed');
        }
        continue;
      }

      // Mark phase as running
      phaseStatus.set(phase.name, 'running');

      // Print phase header with detection info and position
      const detectionInfo = {
        skills: detection.experts as string[],
        keywords: detection.matchedKeywords as string[],
      };
      printStageHeader(phase.name, detectionInfo, phaseIndex, phases.length);

      // Run phase with spinner
      const spinner = new Spinner(`Running ${phase.name}...`);
      spinner.start();
      const startTime = Date.now();

      try {
        const result = await phase.execute(context);
        const durationMs = Date.now() - startTime;
        const duration = durationMs / 1000;
        spinner.stop();

        // Build phase summary for D3 visualization
        const phaseSummary: StageSummary = {
          name: phase.name,
          status: result.status === 'success' ? 'done' : result.status === 'skipped' ? 'skipped' : 'failed',
          durationMs,
        };

        // Parse phase-specific data from result (only on success with metrics)
        if (result.status === 'success' && result.metrics) {
          if (phase.name === 'adversarial-review') {
            // Read raw output for issue details
            const rawPath = path.join(session.logsDir, `item${itemNum}-adversarial-review.raw`);
            const qodanaRawPath = path.join(session.logsDir, `item${itemNum}-static-analysis-qodana.raw`);
            if (fs.existsSync(rawPath)) {
              (phaseSummary as any).gemini = parseGeminiIssues(fs.readFileSync(rawPath, 'utf-8'));
            }
            if (fs.existsSync(qodanaRawPath)) {
              (phaseSummary as any).qodana = parseQodanaIssues(fs.readFileSync(qodanaRawPath, 'utf-8'));
            }
          } else if (phase.name === 'build-tests') {
            (phaseSummary as any).tests = {
              passed: result.metrics.passed ?? 0,
              failed: result.metrics.failed ?? 0,
              written: result.metrics.written ?? 0,
            };
          } else if (phase.name === 'refactor-check') {
            const rawPath = path.join(session.logsDir, `item${itemNum}-refactor-check.raw`);
            if (fs.existsSync(rawPath)) {
              (phaseSummary as any).refactor = parseRefactorResults(fs.readFileSync(rawPath, 'utf-8'));
            }
          }
        }

        summaryCollector.addStage(phaseSummary);

        if (result.status === 'success') {
          phaseStatus.set(phase.name, 'done');
          printStageComplete(phase.name, duration, result.message);
        } else if (result.status === 'skipped') {
          phaseStatus.set(phase.name, 'skipped');
          printStageSkipped(phase.name, result.reason);
        } else {
          phaseStatus.set(phase.name, 'failed');
          printStageFailed(phase.name, result.error);
          itemFailed = true;
          break; // Stop processing this item
        }
      } catch (err) {
        spinner.stop();
        phaseStatus.set(phase.name, 'failed');
        const error = err instanceof Error ? err.message : String(err);
        printStageFailed(phase.name, error);

        // Still record failed phase in summary
        summaryCollector.addStage({
          name: phase.name,
          status: 'failed',
          durationMs: Date.now() - startTime,
        });

        itemFailed = true;
        break;
      }
    }

    // Mark item complete if all phases passed
    if (!itemFailed) {
      summaryCollector.completeItem('success');

      const updatedContent = markItemComplete(prd, item);
      fs.writeFileSync(prdPath, updatedContent);
      prd = parsePrd(prdPath, updatedContent);

      const newRemaining = countIncomplete(prd);
      printItemComplete(itemNum, newRemaining);
      session.completedItems++;
    } else {
      summaryCollector.completeItem('failed');
      printWarning(`Item ${itemNum} failed, moving to next item`);
    }

    // Check iteration limits
    if (itemNum >= (config.settings?.maxIterations ?? 50)) {
      printWarning('Max iterations reached');
      break;
    }
  }

  if (isAllComplete(prd)) {
    printAllComplete();
  }

  // Generate D3 summary visualization
  const summary = summaryCollector.build();
  const summaryPath = generateSummaryHtml(summary, session.logsDir);
  printSummaryLink(summaryPath);

  // Open summary in browser
  await openSummary(summaryPath);
}

/**
 * Get profile experts for a phase (maps old stage names to new phase names).
 */
function getProfileExpertsForPhase(config: RalphConfig, phaseName: PhaseName): string[] {
  // Map new phase names to config keys (which may still use old names)
  const mapping: Record<PhaseName, keyof RalphConfig['skills']> = {
    'plan': 'plan',
    'structure-first': 'plan', // Uses plan experts from config
    'implement': 'build',
    'build-tests': 'test',
    'refactor-check': 'refactor',
    'adversarial-review': 'review',
    'static-analysis': 'review',
    'doc-code': 'doc',
  };

  const configKey = mapping[phaseName];
  return config.skills[configKey] ?? [];
}

/**
 * Create a new session.
 */
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
    completedItems: countIncomplete(prd) === 0 ? prd.items.length : prd.items.length - countIncomplete(prd),
  };
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `${date}-${time}-${rand}`;
}

/**
 * Detect project type from files.
 */
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
