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
  registerDedupeCommands,
  registerInitCommand
} from './commands/index.js';

const program = new Command();

const DESCRIPTION = `
${chalk.bold.white('Lens')} ${chalk.dim('— AI Assisted Development That Builds In Quality')}

${chalk.bold.yellow('QUICK START')}

  ${chalk.green('$')} npm install -g @objective-arts/lens
  ${chalk.green('$')} cd your-project
  ${chalk.green('$')} lens init                ${chalk.dim('Auto-detect stack, create skills + config')}
  ${chalk.green('$')} claude                   ${chalk.dim('Start Claude Code')}

${chalk.bold.yellow('CONFIGURE A PROJECT')} ${chalk.dim('(manual)')}

  ${chalk.white('1.')} ${chalk.green('$')} lens profile list              ${chalk.dim('See available profiles')}
  ${chalk.white('2.')} ${chalk.green('$')} lens profile apply ${chalk.white('javascript+react .')}  ${chalk.dim('Install skills + config')}
  ${chalk.white('3.')} ${chalk.green('$')} claude                                  ${chalk.dim('Start Claude Code')}

  ${chalk.dim('Combine profiles with +: javascript+react, python+security, java+sql')}
  ${chalk.dim('Copies canon skills to .claude/skills/,')}
  ${chalk.dim('sets up CLAUDE.md with auto-invoke rules, and configures MCP servers.')}

${chalk.bold.yellow('INSIDE CLAUDE CODE')} ${chalk.dim('(slash commands after setup)')}

  ${chalk.cyan('/build')} ${chalk.dim('target')}              Build new feature (10 phases)
  ${chalk.cyan('/improve')} ${chalk.dim('path')}             Improve existing code (10 phases)
  ${chalk.cyan('/change')} ${chalk.dim('desc')}              Simple change + cleanup
  ${chalk.cyan('/ai-smell-scan')} ${chalk.dim('path')}       Check for AI-generated patterns
  ${chalk.cyan('/ai-smell-fix')} ${chalk.dim('path')}        Fix AI-generated patterns
  ${chalk.cyan('/generate-docs')} ${chalk.dim('path')}       Generate documentation
  ${chalk.cyan('/lens')}                        Status, help, choices

${chalk.bold.yellow('OTHER CLI COMMANDS')}

  ${chalk.cyan('lens canon list')}                 Browse 75+ expert skills
  ${chalk.cyan('lens canon inspect')} ${chalk.dim('<skill>')}   Show what a skill contains
  ${chalk.cyan('lens scan')}                       Show current project config

Run ${chalk.yellow('lens <command> --help')} for details.

${chalk.bold.yellow('ENVIRONMENT VARIABLES')}

  ${chalk.white('CANON_SKILLS_PATH')}            Override canon skills source directory
  ${chalk.white('CC_WORKFLOW_SKILLS_PATH')}       Override workflow skills source directory
  ${chalk.white('MCP_REGISTRY_DIR')}              Override MCP server registry directory
  ${chalk.white('DEBUG')}                         Show stack traces on errors
`;

program
  .name('lens')
  .description('Lens - AI Assisted Development That Builds In Quality')
  .version('0.4.0')
  .action(() => {
    console.log(DESCRIPTION);
  });

// Register all command groups
registerInitCommand(program);
registerScanCommands(program);
registerProfileCommands(program);
registerMcpCommands(program);
registerCanonCommands(program);
registerWorkflowCommands(program);
registerTraceCommand(program);
registerDedupeCommands(program);

program.parseAsync().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red(`Error: ${message}`));
  if (process.env['DEBUG'] && err instanceof Error && err.stack) {
    console.error(chalk.gray(err.stack));
  }
  process.exitCode = 1;
});
