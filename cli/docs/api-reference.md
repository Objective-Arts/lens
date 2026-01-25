# cc-config API Reference

Complete reference for exported functions by module.

## scanner/index.ts

### scan(options?)

Discover all Claude Code configuration.

```typescript
function scan(options?: ScanOptions): Promise<ScanResult>

interface ScanOptions {
  projectPath?: string;    // Project to scan (default: none)
  includePlugins?: boolean; // Include plugins (default: true)
}

interface ScanResult {
  timestamp: Date;
  globalPath: string;      // ~/.claude
  projectPath?: string;
  items: ConfigItem[];
  claudeMds: ClaudeMdParsed[];
  settings: SettingsParsed[];
  summary: ScanSummary;
}
```

**Example**:
```typescript
import { scan } from 'cc-config/scanner';

const result = await scan({ projectPath: './myproject' });
console.log(`Found ${result.items.length} items`);
console.log(`Total tokens: ${result.summary.totalTokens}`);
```

---

## profiles/index.ts

### listProfiles()

List all available profiles.

```typescript
function listProfiles(): ComposableProfile[]
function listProfilesAsync(): Promise<ComposableProfile[]>
```

### getProfile(name)

Get a single profile by name.

```typescript
function getProfile(name: string): ComposableProfile | null
function getProfileAsync(name: string): Promise<ComposableProfile | null>
```

### parseProfileString(profileString)

Parse profile composition string.

```typescript
function parseProfileString(profileString: string): string[]

// Example
parseProfileString('base-tech+javascript+react')
// Returns: ['base-tech', 'javascript', 'react']
```

### combineProfiles(profileNames)

Merge multiple profiles into one.

```typescript
function combineProfiles(profileNames: string[]): ComposableProfile | null
```

**Merging rules**:
- Skills: Deduplicated union
- Commands: Deduplicated union
- Agents: Deduplicated union
- Auto-invoke: Concatenated
- Ralph config: Last wins

### applyComposableProfile(profile, projectPath)

Apply a profile to a project.

```typescript
function applyComposableProfile(
  profile: ComposableProfile,
  projectPath: string
): Promise<ApplyResult>

interface ApplyResult {
  created: string[];   // Files/dirs created
  linked: string[];    // Symlinks created, skills copied
  skipped: string[];   // Already existed
  errors: string[];    // Failures
  warnings: string[];  // Non-fatal issues
}
```

### saveProfile(profile)

Save a profile to user directory.

```typescript
function saveProfile(profile: ComposableProfile): void
function saveProfileAsync(profile: ComposableProfile): Promise<void>
```

---

## canon/index.ts

### listCanonSkills()

List available skills from canon source.

```typescript
function listCanonSkills(): CanonListItem[]

interface CanonListItem {
  name: string;
  path: string;
  category?: string;  // 'javascript', 'testing', etc.
}
```

### findSkillSourcePath(skillName)

Find source path for a skill.

```typescript
function findSkillSourcePath(skillName: string): string | null
```

### getInstalledSkills(projectPath)

List skills installed in a project.

```typescript
function getInstalledSkills(projectPath: string): string[]
```

### checkSkillStatus(projectPath)

Compare installed skills against source.

```typescript
function checkSkillStatus(projectPath: string): SkillStatusInfo[]

interface SkillStatusInfo {
  name: string;
  status: 'current' | 'outdated' | 'modified' | 'missing' | 'unknown';
  installedHash?: string;
  sourceHash?: string;
  installedCommit?: string;
  sourceCommit?: string;
}
```

### copySkill(skillName, projectPath, options?)

Copy a skill from source to project.

```typescript
function copySkill(
  skillName: string,
  projectPath: string,
  options?: { force?: boolean }
): { success: boolean; message: string }
```

### upgradeSkills(projectPath, options?)

Upgrade outdated skills.

```typescript
function upgradeSkills(
  projectPath: string,
  options?: { force?: boolean; skills?: string[] }
): CanonUpgradeResult

interface CanonUpgradeResult {
  upgraded: string[];
  skipped: string[];
  errors: string[];
}
```

### diffSkill(skillName, projectPath)

Show diff between installed and source.

```typescript
function diffSkill(skillName: string, projectPath: string): string | null
```

### getCanonSourceInfo()

Get canon source path and git info.

```typescript
function getCanonSourceInfo(): {
  path: string;
  commit?: string;
  remote?: string;
}
```

---

## workflow/index.ts

### listWorkflowSkills()

List available workflow skills.

```typescript
function listWorkflowSkills(): WorkflowSkillInfo[]

interface WorkflowSkillInfo {
  name: string;
  path: string;
  description?: string;
}
```

### installWorkflowSkill(skillName, projectPath, options?)

Install a single workflow skill.

```typescript
function installWorkflowSkill(
  skillName: string,
  projectPath: string,
  options?: { force?: boolean }
): { success: boolean; message: string }
```

### installAllWorkflowSkills(projectPath, options?)

Install all workflow skills.

```typescript
function installAllWorkflowSkills(
  projectPath: string,
  options?: { force?: boolean }
): { installed: string[]; skipped: string[]; errors: string[] }
```

### checkWorkflowStatus(projectPath)

Check status of installed workflow skills.

```typescript
function checkWorkflowStatus(projectPath: string): WorkflowStatusInfo[]
```

### upgradeWorkflowSkills(projectPath, options?)

Upgrade outdated workflow skills.

```typescript
function upgradeWorkflowSkills(
  projectPath: string,
  options?: { force?: boolean; skills?: string[] }
): { upgraded: string[]; skipped: string[]; errors: string[] }
```

---

## mcp/index.ts

### listServers(filters?)

List servers from registry.

```typescript
function listServers(filters?: MCPListFilters): MCPServerDefinition[]

interface MCPListFilters {
  category?: MCPServerCategory;
  tags?: string[];
}
```

### getServer(name)

Get server definition by name.

```typescript
function getServer(name: string): MCPServerDefinition | null
```

### installServer(serverName, options?)

Install server to .mcp.json.

```typescript
function installServer(
  serverName: string,
  options?: { skipEnvCheck?: boolean; projectPath?: string }
): MCPOperationResult
```

### uninstallServer(serverName, projectPath?)

Remove server from .mcp.json.

```typescript
function uninstallServer(
  serverName: string,
  projectPath?: string
): MCPOperationResult
```

### enableServer(serverName, projectPath?)

Add server to enabledMcpjsonServers in settings.json.

```typescript
function enableServer(
  serverName: string,
  projectPath?: string
): MCPOperationResult
```

### disableServer(serverName, projectPath?)

Remove server from enabledMcpjsonServers.

```typescript
function disableServer(
  serverName: string,
  projectPath?: string
): MCPOperationResult
```

### checkServer(serverName)

Check if server's required env vars are set.

```typescript
function checkServer(serverName: string): EnvCheckResult

interface EnvCheckResult {
  ok: boolean;
  missing: string[];
  found: string[];
}
```

### checkAllServers(projectPath?)

Check env vars for all installed servers.

```typescript
function checkAllServers(projectPath?: string): Array<{
  server: string;
  ok: boolean;
  missing: string[];
}>
```

### listInstalledServers(projectPath?)

List servers in .mcp.json.

```typescript
function listInstalledServers(projectPath?: string): Array<{
  name: string;
  enabled: boolean;
  config: MCPServerConfig;
}>
```

### isServerInstalled(serverName, projectPath?)

Check if server is in .mcp.json.

```typescript
function isServerInstalled(serverName: string, projectPath?: string): boolean
```

### isServerEnabled(serverName, projectPath?)

Check if server is enabled in settings.json.

```typescript
function isServerEnabled(serverName: string, projectPath?: string): boolean
```

---

## utils/tokens.ts

### estimateTokens(text)

Estimate token count for text.

```typescript
function estimateTokens(text: string): number
```

Uses ~4 characters per token heuristic.

### formatTokens(count)

Format token count for display.

```typescript
function formatTokens(count: number): string

// Examples
formatTokens(500)    // "500"
formatTokens(1500)   // "1.5K"
formatTokens(15000)  // "15K"
```

### tokenPercentage(count, total)

Calculate percentage string.

```typescript
function tokenPercentage(count: number, total: number): string

// Example
tokenPercentage(1500, 10000)  // "15%"
```

---

## utils/validation.ts

### isValidName(name)

Validate a name (skill, server, profile).

```typescript
function isValidName(name: string): boolean

// Valid: alphanumeric, hyphens, underscores
// Max length: 100 characters
```

### validateProjectPath(projectPath, allowedRoot?)

Validate and normalize a project path.

```typescript
function validateProjectPath(
  projectPath: string,
  allowedRoot?: string
): string | null

// Returns absolute path if valid, null if invalid
// Prevents path traversal attacks
```

### getNameValidationError(name, fieldName?)

Get error message for invalid name.

```typescript
function getNameValidationError(
  name: string,
  fieldName?: string
): string
```

### getPathValidationError(projectPath)

Get error message for invalid path.

```typescript
function getPathValidationError(projectPath: string): string
```

---

## Types

### ConfigItem

```typescript
interface ConfigItem {
  type: ConfigItemType;  // 'skill' | 'command' | 'agent' | etc.
  name: string;
  scope: ConfigScope;    // 'global' | 'project' | 'plugin'
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

### ComposableProfile

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
  ralph?: RalphConfig;
}
```

### MCPServerDefinition

```typescript
interface MCPServerDefinition {
  name: string;
  type: 'stdio' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  requiredEnv?: string[];
  category: MCPServerCategory;
  source: string;
  description?: string;
  tags?: string[];
  plugin?: string;
}
```
