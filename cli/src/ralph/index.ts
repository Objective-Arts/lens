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

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!options.prdPath) {
    printError('PRD file path required. Usage: ralph <PRD.md>');
    process.exit(1);
  }

  // Resolve paths
  const prdPath = path.resolve(options.prdPath);
  const projectPath = path.dirname(prdPath);

  // Validate PRD exists
  if (!fs.existsSync(prdPath)) {
    printError(`PRD file not found: ${prdPath}`);
    process.exit(1);
  }

  // Check for ralph config
  if (!hasConfig(projectPath)) {
    printError(
      'Ralph config not found.\n' +
      'Run: cc-config profile apply <profile>+ralph-integration -p .'
    );
    process.exit(1);
  }

  // Check Claude is available
  if (!(await isClaudeAvailable())) {
    printError('Claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code');
    process.exit(1);
  }

  // Run ralph
  try {
    await run({
      prdPath,
      projectPath,
      skipReview: options.skipReview,
      verbose: options.verbose,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printError(message);
    process.exit(1);
  }
}

interface ParsedArgs {
  prdPath?: string;
  skipReview?: boolean;
  verbose?: boolean;
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
  --skip-review     Skip Gemini + Qodana review
  --verbose, -v     Show detailed output
  --help, -h        Show this help

Example:
  ralph PRD.md
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
  - ralph-config.yaml in .claude/ (use cc-config to set up)
`);
}

main();
