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

${chalk.bold.yellow('CONFIGURE A PROJECT')}

  ${chalk.white('1.')} ${chalk.green('$')} lens profile list              ${chalk.dim('See available profiles')}
  ${chalk.white('2.')} ${chalk.green('$')} lens profile apply ${chalk.white('javascript+react .')}  ${chalk.dim('Install skills + config')}
  ${chalk.white('3.')} ${chalk.green('$')} claude                                  ${chalk.dim('Start Claude Code')}

  ${chalk.dim('Combine profiles with +: javascript+react, python+security, java+sql')}
  ${chalk.dim('Copies canon skills to .claude/skills/, phases to .claude/phases/,')}
  ${chalk.dim('sets up CLAUDE.md with auto-invoke rules, and configures MCP servers.')}

${chalk.bold.yellow('INSIDE CLAUDE CODE')} ${chalk.dim('(slash commands after setup)')}

  ${chalk.cyan('/build')} ${chalk.dim('target')}              Build new feature (11 phases)
  ${chalk.cyan('/improve')} ${chalk.dim('path')}             Improve existing code (11 phases)
  ${chalk.cyan('/quick-edit')} ${chalk.dim('desc')}          Simple change (add field, rename)
  ${chalk.cyan('/quick-clean')} ${chalk.dim('path')}         Fast AI smell cleanup
  ${chalk.cyan('/ai-smell-scan')} ${chalk.dim('path')}       Check for AI-generated patterns
  ${chalk.cyan('/ai-smell-fix')} ${chalk.dim('path')}        Fix AI-generated patterns
  ${chalk.cyan('/generate-docs')} ${chalk.dim('path')}       Generate documentation
  ${chalk.cyan('/lens')}                        Status, help, choices

${chalk.bold.yellow('OTHER CLI COMMANDS')}

  ${chalk.cyan('lens canon list')}                 Browse 75+ expert skills
  ${chalk.cyan('lens canon inspect')} ${chalk.dim('<skill>')}   Show what a skill contains
  ${chalk.cyan('lens scan')}                       Show current project config

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
