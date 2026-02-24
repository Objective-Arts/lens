/**
 * Trace command - show YAML configuration stack for a skill.
 *
 * Following clarity: clear output, one purpose.
 */

import type { Command } from 'commander';
import { printTrace, traceSkillConfig } from '../../trace/index.js';

function handleTrace(skill: string, options: { json?: boolean }): void {
  const projectPath = process.cwd();

  if (options.json) {
    const trace = traceSkillConfig(projectPath, skill);
    console.log(JSON.stringify(trace, null, 2));
  } else {
    printTrace(projectPath, skill);
  }
}

export function registerTraceCommand(program: Command): void {
  program
    .command('trace <skill>')
    .description('Show YAML configuration stack for a skill')
    .option('--json', 'Output as JSON')
    .action(handleTrace);
}
