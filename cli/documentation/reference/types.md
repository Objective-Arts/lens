# Types Reference

TypeScript type definitions used in the codebase.

---

## Configuration Types

### ConfigItemType

Types of configuration items.

```typescript
type ConfigItemType =
  | 'skill'
  | 'command'
  | 'agent'
  | 'memory'
  | 'settings'
  | 'hook'
  | 'mcp';
```

### ConfigScope

Where configuration lives.

```typescript
type ConfigScope = 'global' | 'project' | 'plugin';
```

### ConfigItem

A single configuration item.

```typescript
interface ConfigItem {
  type: ConfigItemType;
  name: string;
  scope: ConfigScope;
  path: string;
  isSymlink: boolean;
  symlinkTarget?: string;
  tokens: number;
  content?: string;
  dependencies: string[];
  referencedBy: string[];
  metadata: ConfigItemMetadata;
}
```

### ConfigItemMetadata

Additional item information.

```typescript
interface ConfigItemMetadata {
  description?: string;
  triggers?: string[];
  tools?: string[];
  frontmatter?: Record<string, unknown>;
}
```

---

## Scan Types

### ScanOptions

Options for scanning configuration.

```typescript
interface ScanOptions {
  projectPath?: string;
  includePlugins?: boolean;
}
```

### ScanResult

Result of a configuration scan.

```typescript
interface ScanResult {
  timestamp: Date;
  globalPath: string;
  projectPath?: string;
  items: ConfigItem[];
  claudeMds: ClaudeMdParsed[];
  settings: SettingsParsed[];
  summary: ScanSummary;
}
```

### ScanSummary

Summary statistics from a scan.

```typescript
interface ScanSummary {
  totalItems: number;
  byType: Record<ConfigItemType, number>;
  byScope: Record<ConfigScope, number>;
  totalTokens: number;
  tokensByScope: Record<ConfigScope, number>;
  conflicts: ConfigConflict[];
  missingReferences: MissingReference[];
  unusedItems: string[];
}
```

---

## Profile Types

### ComposableProfile

A composable configuration profile.

```typescript
interface ComposableProfile {
  name: string;
  description?: string;
  projectType?: 'software' | 'business';
  composable?: boolean;
  extends?: string;
  skills?: {
    security?: string[];
    tech?: string[];
    canon?: string[];
    global?: string[];
  };
  agents?: string[];
  commands?: string[];
  claudeMd?: {
    standards?: string[];
    antiPatterns?: string[];
    autoInvoke?: Array<{ context: string; action: string }>;
  };
  mcpServers?: ProfileMCPServerConfig;
  settings?: Record<string, unknown>;
  hooks?: ProfileHooksConfig;
  ralph?: RalphConfig;
}
```

### ProfileMCPServerConfig

MCP server configuration in profiles.

```typescript
interface ProfileMCPServerConfig {
  enable: string[];
  disable: string[];
  config?: Record<string, Record<string, unknown>>;
  categories?: MCPServerCategory[];
  requireAll?: boolean;
}
```

### MCPServerCategory

```typescript
type MCPServerCategory =
  | 'development'
  | 'productivity'
  | 'data'
  | 'reasoning'
  | 'automation'
  | 'other';
```

---

## Ralph Types

### PhaseName

The 10 phases in ralph's workflow.

```typescript
type PhaseName =
  | 'plan'
  | 'structure-first'
  | 'implement'
  | 'refactor-check'
  | 'independent-review'
  | 'static-analysis'
  | 'test'
  | 'doc-code'
  | 'security-review'
  | 'production-readiness';
```

### PHASE_ORDER

Execution order of phases.

```typescript
const PHASE_ORDER: readonly PhaseName[] = [
  'plan',
  'structure-first',
  'implement',
  'refactor-check',
  'independent-review',
  'static-analysis',
  'test',
  'doc-code',
  'security-review',
  'production-readiness',
] as const;
```

### PhaseResult

Result of phase execution.

```typescript
type PhaseResult =
  | { status: 'success'; message: string; metrics?: Record<string, number>; rawOutput?: string }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };
```

### PhaseContext

Context passed to each phase.

```typescript
interface PhaseContext {
  session: Session;
  item: PrdItem;
  experts: Skill[];
  projectPath: string;
  logsDir: string;
  correctivePrompt?: string;
}
```

### Session

Ralph session state.

```typescript
interface Session {
  id: string;
  startTime: Date;
  prdPath: string;
  projectPath: string;
  logsDir: string;
  currentItem: number;
  totalItems: number;
  completedItems: number;
}
```

### PrdItem

A single PRD item.

```typescript
interface PrdItem {
  lineNumber: number;
  text: string;
  status: 'pending' | 'complete';
}
```

### Prd

Parsed PRD file.

```typescript
interface Prd {
  filepath: string;
  items: PrdItem[];
  raw: string;
}
```

### Skill

A loaded skill.

```typescript
interface Skill {
  name: string;
  content: string;
  source: 'profile' | 'dynamic';
}
```

---

## Ralph Configuration Types

### RalphConfig

```typescript
interface RalphConfig {
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
```

### RalphSkillsConfig

Stage-specific skills.

```typescript
interface RalphSkillsConfig {
  plan?: string[];
  build?: string[];
  refactor?: string[];
  test?: string[];
  review?: string[];
  doc?: string[];
}
```

---

## CLAUDE.md Types

### ClaudeMdParsed

Parsed CLAUDE.md file.

```typescript
interface ClaudeMdParsed {
  path: string;
  scope: ConfigScope;
  autoInvokes: ClaudeMdAutoInvoke[];
  skillReferences: string[];
  commandReferences: string[];
  agentReferences: string[];
  rawContent: string;
  sections: Record<string, string>;
}
```

### ClaudeMdAutoInvoke

An auto-invoke rule.

```typescript
interface ClaudeMdAutoInvoke {
  context: string;
  action: string;
  skillName: string;
}
```

---

## Settings Types

### SettingsParsed

Parsed settings.json.

```typescript
interface SettingsParsed {
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
```
