/**
 * Main ralph runner - orchestrates PRD item processing.
 *
 * Following McIlroy: pipeline architecture.
 * Following Kernighan: simple control flow.
 */

import * as fs from 'fs';
import { Prd, PrdItem, Session, RalphConfig } from './types.js';
import { parsePrd, countIncomplete, getIncompleteItems, isAllComplete } from './prd/parser.js';
import { markItemComplete } from './prd/updater.js';
import { loadConfig } from './config/loader.js';
import { createPhases, PhaseContext, PhaseStatus, createPostLoopPhases } from './phases/index.js';
import { SummaryCollector, generateSummaryHtml, openSummary } from './summary/index.js';
import {
  printHeader, printItemHeader, printItemComplete, printAllComplete,
  printWarning, printInfo, printSummaryLink,
} from './display/terminal.js';
import {
  createSession, validateProjectPath, detectProjectType, buildPhaseContext,
} from './runner/context.js';
import { runItemPhases } from './runner/phases.js';

export interface RunnerOptions {
  prdPath: string;
  projectPath: string;
  skipReview?: boolean;
  verbose?: boolean;
  trace?: boolean;
}

interface RunContext {
  prd: Prd;
  prdPath: string;
  projectPath: string;
  session: Session;
  config: RalphConfig;
  phases: ReturnType<typeof createPhases>;
  collector: SummaryCollector;
  skipReview?: boolean;
  verbose?: boolean;
  trace?: boolean;
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

/** Atomically update PRD file with completed item. */
function updatePrdFile(prd: Prd, item: PrdItem, prdPath: string): Prd {
  const updatedContent = markItemComplete(prd, item);
  const tempPath = prdPath + '.tmp';
  fs.writeFileSync(tempPath, updatedContent);
  fs.renameSync(tempPath, prdPath);
  return parsePrd(prdPath, updatedContent);
}

/** Process a single PRD item. */
async function processItem(ctx: RunContext, item: PrdItem, itemNum: number): Promise<boolean> {
  ctx.session.currentItem = itemNum;
  ctx.collector.startItem(itemNum, item.text);

  const phaseStatus = new Map<string, PhaseStatus>();
  ctx.phases.forEach(p => phaseStatus.set(p.name, 'pending'));
  printItemHeader(itemNum, ctx.prd.items.length, item.text, phaseStatus);

  const failed = await runItemPhases(
    ctx.phases, item, ctx.session, ctx.config, ctx.projectPath,
    ctx.skipReview, ctx.verbose, phaseStatus, ctx.collector, itemNum, ctx.trace
  );

  if (failed) {
    ctx.collector.completeItem('failed');
    printWarning(`Item ${itemNum} failed, moving to next item`);
  } else {
    ctx.collector.completeItem('success');
    ctx.prd = updatePrdFile(ctx.prd, item, ctx.prdPath);
    printItemComplete(itemNum, countIncomplete(ctx.prd));
    ctx.session.completedItems++;
  }
  return failed;
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
    await processItem(ctx, item, itemNum);
  }

  if (itemNum >= maxIterations) printWarning('Max iterations reached');
  if (isAllComplete(ctx.prd)) printAllComplete();
}

/** Run post-loop phases (security-review, production-readiness). */
async function runPostLoopPhases(ctx: RunContext): Promise<void> {
  const phases = createPostLoopPhases();

  for (const phase of phases) {
    const syntheticItem: PrdItem = { lineNumber: 0, text: `Post-loop: ${phase.name}`, status: 'pending' };
    const context: PhaseContext = {
      session: ctx.session,
      item: syntheticItem,
      experts: [],
      projectPath: ctx.projectPath,
      logsDir: ctx.session.logsDir,
    };

    try {
      const result = await phase.execute(context);
      if (result.status === 'success') {
        printInfo(`${phase.name}: ${result.message}`);
      } else if (result.status === 'failed') {
        printWarning(`${phase.name} failed: ${result.error}`);
      }
      if (phase.name === 'production-readiness') {
        ctx.collector.addProductionCheck(result);
      }
    } catch (err) {
      printWarning(`${phase.name} error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/** Main entry point. */
export async function run(options: RunnerOptions): Promise<void> {
  const { prdPath, skipReview, verbose, trace } = options;
  const projectPath = validateProjectPath(options.projectPath);
  const config = loadConfig(projectPath);
  const prd = parsePrd(prdPath, fs.readFileSync(prdPath, 'utf-8'));
  const session = createSession(prdPath, projectPath, prd.items.length, prd.items.length - countIncomplete(prd));
  const collector = new SummaryCollector(session.id, prdPath, detectProjectType(projectPath), prd.items.length);

  printHeader(prdPath, countIncomplete(prd), detectProjectType(projectPath));

  if (isAllComplete(prd)) {
    await handleAlreadyComplete(prd, collector, session.logsDir);
    return;
  }

  const ctx: RunContext = { prd, prdPath, projectPath, session, config, phases: createPhases(), collector, skipReview, verbose, trace };

  try {
    await processAllItems(ctx);
    if (ctx.collector.getCompletedCount() > 0) {
      await runPostLoopPhases(ctx);
    }
  } finally {
    await finalizeSummary(collector, session.logsDir);
  }
}
