#!/usr/bin/env node

/**
 * Lens CLI - AI Assisted Development That Builds In Quality
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  registerScanCommands,
  registerProfileCommands,
  registerCanonCommands,
  registerWorkflowCommands,
  registerDedupeCommands,
  registerInitCommand
} from './commands/index.js';

const program = new Command();

const DESCRIPTION = `
${chalk.bold.white('Lens')} ${chalk.dim('— AI Assisted Development That Builds In Quality')}

${chalk.bold.yellow('QUICK START')}

  ${chalk.green('$')} npx @objective-arts/lens init
  ${chalk.green('$')} cd your-project
  ${chalk.green('$')} lens init                  ${chalk.dim('Auto-detect stack, create skills + config')}
  ${chalk.green('$')} claude                     ${chalk.dim('Start Claude Code')}

${chalk.bold.yellow('INSIDE CLAUDE CODE')} ${chalk.dim('(slash commands after setup)')}

  ${chalk.bold('Actions:')}
  ${chalk.cyan('/change')} ${chalk.dim('desc')}              Simple change + cleanup
  ${chalk.cyan('/fix')} ${chalk.dim('path [--dry-run]')}     Review against canons + gate, fix findings, verify

  ${chalk.bold('Scans (read-only):')}
  ${chalk.cyan('/code-scan')} ${chalk.dim('path')}           13-dimension quality analysis
  ${chalk.cyan('/ai-smell-scan')} ${chalk.dim('path')}       AI code patterns
  ${chalk.cyan('/deadcode-scan')} ${chalk.dim('path')}       Unused code detection
  ${chalk.cyan('/naming-scan')} ${chalk.dim('path')}         Naming consistency
  ${chalk.cyan('/refactor-scan')} ${chalk.dim('path')}       Refactoring opportunities
  ${chalk.cyan('/dedupe-scan')} ${chalk.dim('path')}         Duplication detection
  ${chalk.cyan('/canon-audit')} ${chalk.dim('<canon> path')}  Audit against a canon's rules
  ${chalk.cyan('/generate-docs')} ${chalk.dim('path')}       Generate documentation

${chalk.bold.yellow('OTHER CLI COMMANDS')}

  ${chalk.cyan('lens canon list')}             Browse 75+ expert skills
  ${chalk.cyan('lens canon inspect')} ${chalk.dim('<skill>')} Show what a skill contains
  ${chalk.cyan('lens scan')}                   Show current project config

Run ${chalk.yellow('lens <command> --help')} for details.

${chalk.bold.yellow('ENVIRONMENT VARIABLES')}

  ${chalk.white('CANON_SKILLS_PATH')}            Override canon skills source directory
  ${chalk.white('CC_WORKFLOW_SKILLS_PATH')}       Override workflow skills source directory
  ${chalk.white('DEBUG')}                         Show stack traces on errors
`;

program
  .name('lens')
  .description('Lens — AI Assisted Development That Builds In Quality')
  .version('0.4.0')
  .action(() => {
    console.log(DESCRIPTION);
  });

// Register all command groups
registerInitCommand(program);
registerScanCommands(program);
registerProfileCommands(program);
registerCanonCommands(program);
registerWorkflowCommands(program);
registerDedupeCommands(program);

program.parseAsync().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`Error: ${message}`));
  if (process.env['DEBUG'] && err instanceof Error && err.stack) {
    console.error(chalk.gray(err.stack));
  }
  process.exitCode = 1;
});
