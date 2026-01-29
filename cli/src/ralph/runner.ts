/**
 * Main ralph runner - orchestrates PRD item processing.
 *
 * Following mcilroy: pipeline architecture.
 * Following kernighan: simple control flow.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Prd, PrdItem, Session, RalphConfig, Skill, StageStatus, SkillDetection } from './types.js';
import { parsePrd, countIncomplete, getNextIncomplete, getIncompleteItems, isAllComplete } from './prd/parser.js';
import { markItemComplete } from './prd/updater.js';
import { loadConfig } from './config/loader.js';
import { loadSkills } from './skills/loader.js';
import { getSkillsForStage } from './skills/detector.js';
import { createStages, StageContext } from './stages/index.js';
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
  printHeader(prdPath, remaining, detectProjectType(projectPath));

  // Check if already complete
  if (isAllComplete(prd)) {
    printAllComplete();
    return;
  }

  // Create stages
  const stages = createStages();

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

    // Initialize stage status tracking for pipeline progress display
    const stageStatus = new Map<string, StageStatus>();
    for (const s of stages) {
      stageStatus.set(s.name, 'pending');
    }

    // Print item header with pipeline progress
    printItemHeader(itemNum, prd.items.length, item.text, stageStatus);

    // Run each stage for this item
    let itemFailed = false;
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex];

      // Skip review if requested
      if (stage.name === 'review' && skipReview) {
        stageStatus.set(stage.name, 'skipped');
        continue;
      }

      // Get skills for this stage (now returns SkillDetection with keywords)
      const profileSkills = config.skills[stage.name as keyof typeof config.skills] ?? [];
      const detection = getSkillsForStage(profileSkills, item.text, stage.name as any);
      const skills = loadSkills(projectPath, detection.skills);

      // Build context
      const context: StageContext = {
        session,
        item,
        skills,
        projectPath,
        logsDir: session.logsDir,
      };

      // Check if stage should run
      if (!stage.shouldRun(context)) {
        stageStatus.set(stage.name, 'skipped');
        if (verbose) {
          printStageSkipped(stage.name, 'Not needed');
        }
        continue;
      }

      // Mark stage as running
      stageStatus.set(stage.name, 'running');

      // Print stage header with detection info and position
      printStageHeader(stage.name, detection, stageIndex, stages.length);

      // Run stage with spinner
      const spinner = new Spinner(`Running ${stage.name}...`);
      spinner.start();
      const startTime = Date.now();

      try {
        const result = await stage.execute(context);
        const duration = (Date.now() - startTime) / 1000;
        spinner.stop();

        if (result.status === 'success') {
          stageStatus.set(stage.name, 'done');
          printStageComplete(stage.name, duration, result.message);
        } else if (result.status === 'skipped') {
          stageStatus.set(stage.name, 'skipped');
          printStageSkipped(stage.name, result.reason);
        } else {
          stageStatus.set(stage.name, 'failed');
          printStageFailed(stage.name, result.error);
          itemFailed = true;
          break; // Stop processing this item
        }
      } catch (err) {
        spinner.stop();
        stageStatus.set(stage.name, 'failed');
        const error = err instanceof Error ? err.message : String(err);
        printStageFailed(stage.name, error);
        itemFailed = true;
        break;
      }
    }

    // Mark item complete if all stages passed
    if (!itemFailed) {
      const updatedContent = markItemComplete(prd, item);
      fs.writeFileSync(prdPath, updatedContent);
      prd = parsePrd(prdPath, updatedContent);

      const newRemaining = countIncomplete(prd);
      printItemComplete(itemNum, newRemaining);
      session.completedItems++;
    } else {
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
