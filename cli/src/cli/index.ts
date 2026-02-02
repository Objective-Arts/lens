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
  registerTraceCommand,
  registerDedupeCommands
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
registerDedupeCommands(program);

program.parse();
