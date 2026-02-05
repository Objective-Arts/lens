/**
 * Command module index
 * Following procida: clear organization, single entry point
 */

export { registerScanCommands } from './scan.js';
export { registerProfileCommands } from './profile.js';
export { registerMcpCommands } from './mcp.js';
export { registerCanonCommands } from './canon.js';
export { registerWorkflowCommands } from './workflow.js';
export { registerTraceCommand } from './trace.js';
export { registerDedupeCommands } from './dedupe.js';
