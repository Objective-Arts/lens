/**
 * Core types for Claude Code configuration management
 */

export type ConfigItemType = 'skill' | 'command' | 'agent' | 'memory' | 'settings' | 'hook' | 'mcp';
export type ConfigScope = 'global' | 'project' | 'plugin';

export interface ConfigItem {
  type: ConfigItemType;
  name: string;
  scope: ConfigScope;
  path: string;
  isSymlink: boolean;
  symlinkTarget?: string;
  tokens: number;
  content?: string;
  dependencies: string[];    // Skills/commands this item references
  referencedBy: string[];    // Items that reference this
  metadata: ConfigItemMetadata;
}

export interface ConfigItemMetadata {
  description?: string;
  triggers?: string[];       // Auto-invoke triggers
  tools?: string[];          // For agents - which tools they have
  frontmatter?: Record<string, unknown>;
}

export interface ClaudeMdAutoInvoke {
  context: string;
  action: string;
  skillName: string;
}

export interface ClaudeMdParsed {
  path: string;
  scope: ConfigScope;
  autoInvokes: ClaudeMdAutoInvoke[];
  skillReferences: string[];
  commandReferences: string[];
  agentReferences: string[];
  rawContent: string;
  sections: Record<string, string>;
}

export interface SettingsParsed {
  path: string;
  scope: ConfigScope;
  model?: string;
  permissions?: {
    allow: string[];
    deny: string[];
    defaultMode?: string;
  };
  hooks?: Record<string, unknown[]>;
  mcpServers?: string[];
  env?: Record<string, string>;
}

/**
 * Project types - determines which base canon to use
 */
export type ProjectType = 'software' | 'business';

/**
 * Skill categories - aligned with actual skill-library structure
 */
export type SkillCategory = 'security' | 'tech' | 'canon' | 'global';

export interface SkillLibraryPaths {
  security: string;  // ~/.claude/skill-library/security/
  tech: string;      // ~/.claude/skill-library/tech/
  canon: string;     // ~/local-tech-projects/canon-skills/
  global: string;    // ~/.claude/skills/
}

/**
 * Composable profile - aligned with claude-optimal Base + Domain canon structure
 *
 * Canon is always alive - the lens through which all work is done.
 * Quality is generative (built in), not corrective (fixed after).
 */
/**
 * Extended MCP server configuration for profiles
 */
export type MCPServerCategory =
  | 'development'
  | 'productivity'
  | 'data'
  | 'reasoning'
  | 'automation'
  | 'other';

export interface ProfileMCPServerConfig {
  enable: string[];
  disable: string[];
  config?: Record<string, Record<string, unknown>>;  // Override registry settings
  categories?: MCPServerCategory[];  // Enable all servers in category
  requireAll?: boolean;  // Fail if any unavailable (default: false)
}

/**
 * Hook configuration for profiles
 * Maps hook event types to hook definitions
 */
export interface ProfileHookItem {
  matcher?: string;  // Regex pattern for tool/event matching
  hooks: Array<{
    type: 'command' | 'prompt';
    command?: string;  // For type: command
    prompt?: string;   // For type: prompt
  }>;
}

export interface ProfileHooksConfig {
  PreToolUse?: ProfileHookItem[];
  PostToolUse?: ProfileHookItem[];
  UserPromptSubmit?: ProfileHookItem[];
  Notification?: ProfileHookItem[];
}

export interface ComposableProfile {
  name: string;
  description?: string;
  projectType?: ProjectType;  // 'software' or 'business'
  composable?: boolean;
  extends?: string;  // Base profile to extend
  skills?: {
    security?: string[];  // Security skills (owasp, security-mindset, etc.)
    tech?: string[];      // Tech workflow skills (ceremony, etc.)
    canon?: string[];     // Domain experts (react-state, d3, etc.)
    global?: string[];    // Productivity workflows, meta skills
  };
  agents?: string[];
  commands?: string[];
  claudeMd?: {
    standards?: string[];     // Coding standards to follow
    antiPatterns?: string[];  // Patterns to avoid
    autoInvoke?: Array<{ context: string; action: string }>;
  };
  mcpServers?: ProfileMCPServerConfig;
  settings?: Record<string, unknown>;
  hooks?: ProfileHooksConfig;  // Hooks to install in project settings.json
  ralph?: RalphConfig;  // Ralph Loop configuration
}

/**
 * Ralph stage-specific skills configuration
 */
export interface RalphSkillsConfig {
  plan?: string[];
  build?: string[];
  refactor?: string[];
  test?: string[];
  review?: string[];
  doc?: string[];
}

/**
 * Ralph Loop configuration for autonomous PRD implementation
 */
export interface RalphConfig {
  skills?: RalphSkillsConfig;
  max_iterations?: number;
  max_iterations_per_item?: number;
  exit_on_idle_commits?: number;
  quality_gates?: {
    tests_required?: boolean;
    test_level?: 'unit' | 'integration' | 'e2e';
    review_required?: boolean;
    review_mode?: 'self' | 'full';
    review_threshold?: 'no_critical' | 'no_high' | 'clean';
  };
  post_loop_validation?: {
    enabled?: boolean;
    gemini?: boolean;
    qodana?: boolean;
    action?: 'report' | 'fail';
    findings_file?: string;
    promote_threshold?: number;
  };
  exit_criteria?: {
    prd_items_complete?: string;
    tests_passing?: string;
    review_issues_critical?: number;
  };
}

/**
 * Legacy profile structure (for backwards compatibility)
 */
export interface Profile {
  name: string;
  description?: string;
  skills: {
    include: string[];
    exclude: string[];
  };
  commands: {
    include: string[];
    exclude: string[];
  };
  agents: {
    include: string[];
    exclude: string[];
  };
  claudeMd?: {
    autoInvoke: Array<{ context: string; action: string }>;
  };
  mcpServers?: ProfileMCPServerConfig;
  settings?: Record<string, unknown>;
}

export interface ScanResult {
  timestamp: Date;
  globalPath: string;
  projectPath?: string;
  items: ConfigItem[];
  claudeMds: ClaudeMdParsed[];
  settings: SettingsParsed[];
  summary: ScanSummary;
}

export interface ScanSummary {
  totalItems: number;
  byType: Record<ConfigItemType, number>;
  byScope: Record<ConfigScope, number>;
  totalTokens: number;
  tokensByScope: Record<ConfigScope, number>;
  conflicts: ConfigConflict[];
  missingReferences: MissingReference[];
  unusedItems: string[];
}

export interface ConfigConflict {
  name: string;
  type: ConfigItemType;
  locations: string[];
}

export interface MissingReference {
  referencedName: string;
  referencedIn: string;
  referenceType: ConfigItemType;
}

export interface AuditReport {
  scanResult: ScanResult;
  tokenBreakdown: TokenBreakdown;
  recommendations: Recommendation[];
}

export interface TokenBreakdown {
  total: number;
  byScope: Record<ConfigScope, number>;
  byType: Record<ConfigItemType, number>;
  items: Array<{ name: string; type: ConfigItemType; scope: ConfigScope; tokens: number }>;
}

export interface Recommendation {
  type: 'move' | 'remove' | 'consolidate' | 'missing';
  severity: 'info' | 'warning' | 'error';
  message: string;
  item?: string;
  suggestedAction?: string;
}
