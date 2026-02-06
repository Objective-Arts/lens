#!/usr/bin/env node
/**
 * Ralph CLI entry point.
 *
 * Ralph: PRD-driven autonomous implementation tool.
 * Processes PRD items through plan → build → test → review → doc stages.
 */

import * as path from 'path';
import * as fs from 'fs';
import { run, RunnerOptions } from './runner.js';
import { printError } from './display/terminal.js';
import { hasConfig } from './config/loader.js';
import { isClaudeAvailable } from './process/claude.js';

/** Validate inputs and return resolved paths. Returns null and exits if invalid. */
function validateInputs(options: ParsedArgs): { prdPath: string; projectPath: string } | null {
  if (options.help) { printHelp(); process.exit(0); }
  if (!options.prdPath) { printError('PRD file path required. Usage: ralph <PRD.md>'); process.exit(1); }
  const prdPath = path.resolve(options.prdPath);
  if (!fs.existsSync(prdPath)) { printError(`PRD file not found: ${prdPath}`); process.exit(1); }
  return { prdPath, projectPath: path.dirname(prdPath) };
}

/** Check prerequisites are met. Exits if not. */
async function checkPrerequisites(projectPath: string): Promise<void> {
  if (!hasConfig(projectPath)) {
    printError('Ralph config not found.\nRun: lens profile apply <profile>+ralph-integration -p .');
    process.exit(1);
  }
  if (!(await isClaudeAvailable())) {
    printError('Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code');
    process.exit(1);
  }
}

/** Run ralph with error handling. */
async function runWithErrorHandling(runOptions: RunnerOptions): Promise<void> {
  try {
    await run(runOptions);
  } catch (err) {
    printError(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const paths = validateInputs(options);
  if (!paths) return;

  await checkPrerequisites(paths.projectPath);
  await runWithErrorHandling({
    prdPath: paths.prdPath,
    projectPath: paths.projectPath,
    skipReview: options.skipReview,
    verbose: options.verbose,
    postOnly: options.postOnly,
  });
}

interface ParsedArgs {
  prdPath?: string;
  skipReview?: boolean;
  verbose?: boolean;
  postOnly?: boolean;
  help?: boolean;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--skip-review' || arg === '--skip-scan') {
      result.skipReview = true;
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (arg === '--post-only') {
      result.postOnly = true;
    } else if (arg === '--yes' || arg === '-y') {
      // Accepted but ignored (always auto-approve)
    } else if (!arg.startsWith('-')) {
      result.prdPath = arg;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Ralph - PRD-driven autonomous implementation

Usage: ralph <PRD.md> [options]

Options:
  --post-only       Skip per-item phases, run only post-loop (security + production)
  --skip-review     Skip Gemini + Qodana review
  --verbose, -v     Show detailed output
  --help, -h        Show this help

Example:
  ralph PRD.md
  ralph PRD.md --post-only    # Test post-loop phases only
  ralph PRD.md --skip-review

Ralph processes each unchecked item in the PRD through 8 phases:
  1. Plan              - Understand requirements, design approach
  2. Structure-First   - Design data structures and types
  3. Implement         - Write the code
  4. Build-Tests       - Write tests for implemented code
  5. Refactor-Check    - Simplify and clean up
  6. Adversarial-Review - Gemini security review
  7. Static-Analysis   - Qodana code analysis
  8. Doc-Code          - Document the completed work

Prerequisites:
  - Claude CLI installed
  - ralph-config.yaml in .claude/ (use lens to set up)
`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
