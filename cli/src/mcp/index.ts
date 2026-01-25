/**
 * MCP Registry Module
 *
 * Provides server registry management for Claude Code.
 */

// Types
export type {
  MCPServerType,
  MCPServerSource,
  MCPServerCategory,
  MCPServerDefinition,
  MCPServerConfig,
  MCPRegistry,
  EnvCheckResult,
  MCPOperationResult,
  MCPListFilters,
  ProfileMCPConfig
} from './types.js';

// Registry functions
export {
  loadRegistry,
  getServer,
  listServers,
  listCategories,
  checkRequiredEnv,
  addServerToRegistry,
  removeServerFromRegistry,
  getRegistryPath,
  resolveEnvVars,
  ensureRegistryDir
} from './registry.js';

// Operations
export {
  loadMcpJson,
  saveMcpJson,
  loadSettings,
  saveSettings,
  getEnabledServers,
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
