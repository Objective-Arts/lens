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
 * Skill categories aligned with claude-optimal methodology
 *
 * Canon Structure (always alive throughout workflow):
 * - software-base: Kernighan, Schneier, Dodds, OWASP, Procida (all software projects)
 * - software-domain: Language/framework experts (Bloch, Simpson, Abramov, Bostock, etc.)
 * - business-base: Strunk & White, Zinsser (all business projects)
 * - business-domain: Focus area experts (Porter, Thompson, Horowitz)
 * - global: Productivity workflows, meta skills
 */
export type SkillCategory = 'software-base' | 'software-domain' | 'business-base' | 'business-domain' | 'global';

export interface SkillLibraryPaths {
  'software-base': string;    // ~/.claude/skill-library/software-base/
  'software-domain': string;  // ~/local-tech-projects/canon-skills/
  'business-base': string;    // ~/.claude/skill-library/business-base/
  'business-domain': string;  // ~/local-tech-projects/canon-skills/business/
  global: string;             // ~/.claude/skills/
}

/**
 * Composable profile - aligned with claude-optimal Base + Domain canon structure
 *
 * Canon is always alive - the lens through which all work is done.
 * Quality is generative (built in), not corrective (fixed after).
 */
export interface ComposableProfile {
  name: string;
  description?: string;
  projectType?: ProjectType;  // 'software' or 'business'
  composable?: boolean;
  canon?: {
    base?: string[];           // Software: kernighan, schneier, dodds, owasp, procida
                               // Business: strunk-white, zinsser
    domain?: string[];         // Software: bloch, simpson, abramov, bostock, tufte, etc.
                               // Business: porter, thompson, horowitz
  };
  skills?: {
    global?: string[];         // Productivity workflows, meta skills
  };
  agents?: string[];
  commands?: string[];
  // Note: claudeMd.autoInvoke removed - canon is always alive, not invoked per-use
  mcpServers?: {
    enable: string[];
    disable: string[];
  };
  settings?: Record<string, unknown>;
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
  mcpServers?: {
    enable: string[];
    disable: string[];
  };
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
