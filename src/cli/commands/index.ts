/**
 * Command module index
 * Following docs: clear organization, single entry point
 */

import chalk from 'chalk';
import { validateProjectPath, getPathValidationError } from '../../utils/validation.js';

export { registerScanCommands } from './scan.js';
export { registerProfileCommands } from './profile.js';
export { registerMcpCommands } from './mcp.js';
export { registerCanonCommands } from './canon.js';
export { registerWorkflowCommands } from './workflow.js';
export { registerTraceCommand } from './trace.js';
export { registerDedupeCommands } from './dedupe.js';
export { registerInitCommand } from './init.js';

/** Validate and resolve a project path, printing an error if invalid. */
export function validatePath(rawPath: string): string | null {
  const validated = validateProjectPath(rawPath);
  if (!validated) {
    console.error(chalk.red(`Invalid path: ${getPathValidationError(rawPath)}`));
    return null;
  }
  return validated;
}
