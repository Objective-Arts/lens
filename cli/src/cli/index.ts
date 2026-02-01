#!/usr/bin/env node

/**
 * cc-config CLI - Claude Code configuration manager
 *
 * Following kernighan: minimal entry point, delegated responsibilities
 * Following gang-of-four: Command pattern via separate modules
 * Following procida: clear organization by domain
 */

import { Command } from 'commander';
import {
  registerScanCommands,
  registerProfileCommands,
  registerMcpCommands,
  registerCanonCommands,
  registerWorkflowCommands,
  registerToolsCommands,
  registerHooksCommands,
  registerTraceCommand
} from './commands/index.js';

const program = new Command();

program
  .name('cc-config')
  .description('Claude Code configuration manager')
  .version('0.1.0');

// Register all command groups
registerScanCommands(program);
registerProfileCommands(program);
registerMcpCommands(program);
registerCanonCommands(program);
registerWorkflowCommands(program);
registerToolsCommands(program);
registerHooksCommands(program);
registerTraceCommand(program);

// UI command - kept here as it's a single simple command
program
  .command('ui')
  .description('Launch local web UI for managing Claude Code configuration')
  .option('--port <port>', 'Port to run on', '3847')
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    const { runUI } = await import('../ui/server.js');
    runUI({ port });
  });

program.parse();
