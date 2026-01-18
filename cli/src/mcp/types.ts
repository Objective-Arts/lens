/**
 * MCP Server Registry Types
 *
 * Defines types for MCP server definitions with env var references (never actual secrets).
 */

/**
 * MCP server transport type
 */
export type MCPServerType = 'stdio' | 'http';

/**
 * Source of the MCP server definition
 */
export type MCPServerSource = 'official' | 'community' | 'plugin' | 'custom';

/**
 * MCP server categories for organization
 */
export type MCPServerCategory =
  | 'development'
  | 'productivity'
  | 'data'
  | 'reasoning'
  | 'automation'
  | 'other';

/**
 * MCP server definition in the registry
 */
export interface MCPServerDefinition {
  name: string;
  description?: string;
  category: MCPServerCategory;
  type: MCPServerType;

  // For stdio servers
  command?: string;
  args?: string[];

  // For http servers
  url?: string;

  // Environment variables (uses ${VAR} references, NEVER actual values)
  env?: Record<string, string>;

  // Required env vars that must be set in user's shell
  requiredEnv?: string[];

  // Metadata
  source: MCPServerSource;
  tags?: string[];
  optional?: boolean;

  // For plugin-provided HTTP servers
  plugin?: string;
}

/**
 * Runtime MCP server config (as stored in mcp.json)
 */
export interface MCPServerConfig {
  type: MCPServerType;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

/**
 * MCP Registry - collection of available servers
 */
export interface MCPRegistry {
  servers: Map<string, MCPServerDefinition>;
}

/**
 * Result of checking required env vars
 */
export interface EnvCheckResult {
  ok: boolean;
  server: string;
  missing: string[];
  found: string[];
}

/**
 * Result of MCP operations
 */
export interface MCPOperationResult {
  success: boolean;
  message: string;
  server?: string;
  warnings?: string[];
}

/**
 * Filter options for listing servers
 */
export interface MCPListFilters {
  category?: MCPServerCategory;
  source?: MCPServerSource;
  installed?: boolean;
  tags?: string[];
}

/**
 * Extended mcpServers config for ComposableProfile
 */
export interface ProfileMCPConfig {
  enable: string[];
  disable: string[];
  config?: Record<string, Partial<MCPServerDefinition>>;
  categories?: MCPServerCategory[];
  requireAll?: boolean;
}
