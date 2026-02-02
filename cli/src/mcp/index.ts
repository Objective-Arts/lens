/**
 * MCP Registry Module
 *
 * Provides server registry management for Claude Code.
 */

// Registry functions - only export what's actually used
export {
  getServer,
  listServers,
  listCategories,
  checkRequiredEnv,
  addServerToRegistry,
  ensureRegistryDir
} from './registry.js';

// Operations - only export what's actually used
export {
  isServerInstalled,
  isServerEnabled,
  installServer,
  uninstallServer,
  enableServer,
  disableServer,
  checkServer,
  checkAllServers,
  listInstalledServers,
  installAndEnableServer,
  getMcpConfigPath
} from './operations.js';
