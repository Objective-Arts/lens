#!/usr/bin/env node

/**
 * Lens CLI - AI Assisted Development That Builds In Quality
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  registerScanCommands,
  registerProfileCommands,
  registerMcpCommands,
  registerCanonCommands,
  registerWorkflowCommands,
  registerTraceCommand,
  registerDedupeCommands
} from './commands/index.js';

const program = new Command();

const DESCRIPTION = `
${chalk.bold.white('Lens')} ${chalk.dim('— AI Assisted Development That Builds In Quality')}

${chalk.bold.yellow('SETUP')}
  ${chalk.green('$')} lens profile apply ${chalk.dim('<javascript|python|...>')}
  ${chalk.green('$')} claude

${chalk.bold.yellow('WORKFLOW SKILLS')} ${chalk.dim('(use inside Claude Code)')}
  ${chalk.cyan('/lens')}                        ${chalk.white('Start here')} — status, help, choices
  ${chalk.cyan('/create-plan')} ${chalk.dim('feature')}       Design before coding
  ${chalk.cyan('/structure-first')} ${chalk.dim('feature')}   Define types and interfaces
  ${chalk.cyan('/implement-plan')}              Build from plan
  ${chalk.cyan('/gemini-scan')} ${chalk.dim('path')}          Adversarial code review
  ${chalk.cyan('/phase-loop')} ${chalk.dim('path')}           Run 8 quality phases on file

${chalk.bold.yellow('CLI COMMANDS')}
  ${chalk.cyan('lens profile apply')} ${chalk.dim('<profile>')}   Configure project
  ${chalk.cyan('lens canon list')}                 Browse 70+ quality lenses
  ${chalk.cyan('lens scan')}                       Show current config

${chalk.bold.yellow('AUTONOMOUS MODE')}
  ${chalk.cyan('/ralph-loop')} ${chalk.dim('prd.md')}         Execute PRD with full quality gates

Run ${chalk.yellow('lens <command> --help')} for details.
`;

program
  .name('lens')
  .description('Lens - AI Assisted Development That Builds In Quality')
  .version('0.2.0')
  .action(() => {
    console.log(DESCRIPTION);
  });

// Register all command groups
registerScanCommands(program);
registerProfileCommands(program);
registerMcpCommands(program);
registerCanonCommands(program);
registerWorkflowCommands(program);
registerTraceCommand(program);
registerDedupeCommands(program);

program.parse();
