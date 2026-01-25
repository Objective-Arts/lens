# cc-config Architecture

System design and module structure for the Claude Code configuration manager.

## Overview

cc-config is a CLI tool that manages Claude Code configuration across global (`~/.claude/`) and project (`.claude/`) scopes. It uses a copy-with-manifest pattern for skill portability.

```
┌─────────────────────────────────────────────────────────────────┐
│                         cc-config CLI                            │
│                     (src/cli/index.ts)                          │
└─────────────────┬───────────────┬───────────────┬───────────────┘
                  │               │               │
      ┌───────────▼───────────┐   │   ┌───────────▼───────────┐
      │       Scanner         │   │   │       Profiles        │
      │  (src/scanner/)       │   │   │   (src/profiles/)     │
      │                       │   │   │                       │
      │ - Discovers config    │   │   │ - YAML parsing        │
      │ - Token estimation    │   │   │ - Profile combination │
      │ - Dependency graph    │   │   │ - Skill installation  │
      └───────────────────────┘   │   └───────────────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      │                           │                           │
┌─────▼─────┐             ┌───────▼───────┐           ┌───────▼───────┐
│   Canon   │             │   Workflow    │           │     MCP       │
│(src/canon)│             │(src/workflow) │           │  (src/mcp/)   │
│           │             │               │           │               │
│ - Skill   │             │ - Universal   │           │ - Registry    │
│   copying │             │   patterns    │           │ - Install     │
│ - Manifest│             │ - Manifest    │           │ - Enable      │
│   tracking│             │   tracking    │           │ - Env check   │
└───────────┘             └───────────────┘           └───────────────┘
```

## Module Structure

### cli/ - Command Line Interface

Entry point that defines all commands using Commander.js.

**Key file**: `src/cli/index.ts`

- Command definitions (scan, profile, mcp, canon, workflow)
- Input validation helpers
- Output formatting with chalk

### scanner/ - Configuration Discovery

Discovers all Claude Code configuration items across scopes.

**Key file**: `src/scanner/index.ts`

```typescript
interface ScanResult {
  items: ConfigItem[];      // Skills, commands, agents, etc.
  claudeMds: ClaudeMdParsed[];  // Parsed CLAUDE.md files
  settings: SettingsParsed[];   // Parsed settings.json
  summary: ScanSummary;         // Counts, conflicts, references
}
```

**Responsibilities**:
- Scan global (`~/.claude/`) and project (`.claude/`) directories
- Parse CLAUDE.md for auto-invoke rules and skill references
- Build dependency graph between configuration items
- Detect conflicts (same name in multiple scopes)
- Estimate token counts for context budgeting

### profiles/ - Profile Management

Manages composable configuration profiles.

**Key file**: `src/profiles/index.ts`

```typescript
interface ComposableProfile {
  name: string;
  skills?: {
    security?: string[];  // OWASP, security-mindset
    tech?: string[];      // ceremony, etc.
    canon?: string[];     // Expert skills (abramov, dodds)
    global?: string[];    // Productivity workflows
  };
  commands?: string[];
  agents?: string[];
  claudeMd?: {
    autoInvoke?: Array<{ context: string; action: string }>;
  };
  mcpServers?: ProfileMCPServerConfig;
}
```

**Key functions**:
- `listProfiles()` - Load profiles from YAML
- `combineProfiles()` - Merge with `+` syntax
- `applyComposableProfile()` - Install to project

**Design decisions**:
- Skills are **copied** (not symlinked) for portability
- Manifest tracks source version for upgrade path
- Parallel execution with `Promise.all` for performance

### canon/ - Expert Skill Management

Copy-with-manifest system for expert-authored skills.

**Key file**: `src/canon/index.ts`

```typescript
interface CanonManifest {
  version?: number;
  source: CanonSource;
  skills: Record<string, InstalledSkillInfo>;
}

interface InstalledSkillInfo {
  installedCommit?: string;
  hash: string;          // SHA-256 of skill content
  modified: boolean;     // Detects local changes
}
```

**Key functions**:
- `listCanonSkills()` - List available skills from source
- `copySkill()` - Copy skill to project
- `checkSkillStatus()` - Compare installed vs source
- `upgradeSkills()` - Update outdated skills

**Skill status**:
- `current` - Matches source
- `outdated` - Source has updates
- `modified` - Local changes detected
- `missing` - Source not found

### workflow/ - Universal Workflow Skills

Manages workflow patterns that apply across all projects.

**Key file**: `src/workflow/index.ts`

Similar to canon but for universal patterns:
- `ralph-loop` - Autonomous PRD implementation
- `implement` - Feature implementation with gates
- `review-hard` - Rigorous code review
- `structure-first` - Design before coding

### mcp/ - MCP Server Registry

Manages Model Context Protocol server configuration.

**Key files**:
- `src/mcp/registry.ts` - Server definitions
- `src/mcp/operations.ts` - Install/enable operations

```typescript
interface MCPServerDefinition {
  name: string;
  type: 'stdio' | 'http';
  command?: string;
  args?: string[];
  requiredEnv?: string[];
  category: MCPServerCategory;
}
```

**Key functions**:
- `listServers()` - List registry
- `installServer()` - Add to .mcp.json
- `enableServer()` - Add to settings.json
- `checkRequiredEnv()` - Validate env vars

### parser/ - Configuration Parsing

Utilities for parsing CLAUDE.md and settings.json.

**Key files**:
- `src/parser/claude-md.ts` - CLAUDE.md parsing
- `src/parser/settings.ts` - settings.json parsing

### utils/ - Shared Utilities

**Key files**:
- `src/utils/tokens.ts` - Token estimation
- `src/utils/validation.ts` - Input validation

## Data Flow

### Profile Application

```
profile apply javascript+react -p ./myproject
       │
       ▼
┌──────────────────┐
│ Parse profile    │  parseProfileString() → ["javascript", "react"]
│ string           │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Load & combine   │  combineProfiles() → merged profile
│ profiles         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Apply to project │  applyComposableProfile()
│                  │
│ 1. Copy skills   │  → .claude/skills/
│ 2. Update manifest│ → .claude/canon-manifest.json
│ 3. Install workflow│ → workflow skills
│ 4. Link commands │  → symlinks to global
│ 5. Update CLAUDE.md│ → auto-invoke rules
│ 6. Configure MCP │  → .mcp.json
└──────────────────┘
```

### Configuration Scan

```
cc-config scan -p ./myproject
       │
       ▼
┌──────────────────┐
│ Scan global      │  ~/.claude/{skills,commands,agents}
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Scan project     │  .claude/{skills,commands,agents}
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Parse CLAUDE.md  │  Extract auto-invoke rules, references
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Build dependency │  Which skills reference which
│ graph            │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Generate summary │  Counts, conflicts, missing refs
└──────────────────┘
```

## Key Design Decisions

### 1. Copy vs Symlink

Skills are **copied** to projects, not symlinked.

**Why**:
- Projects are fully portable (work on any machine)
- No broken symlinks when source moves
- Explicit upgrade path via `canon upgrade`

**Trade-off**: Duplicate storage, but skills are small.

### 2. Manifest Tracking

`canon-manifest.json` tracks installed skill versions.

**Why**:
- Detect when source has updates
- Detect when user modified installed skill
- Enable safe upgrade without losing changes

### 3. Parallel Execution

Profile application uses `Promise.all` for skill copying.

**Why**:
- File I/O is the bottleneck
- Skills are independent
- Significant speedup with many skills

### 4. Input Validation

All user input is validated before use.

**Why**:
- Prevent path traversal attacks
- Prevent command injection
- Fail fast with clear errors

## File Locations

| Path | Purpose |
|------|---------|
| `~/.claude/profiles/` | User-defined profiles (YAML) |
| `~/local-tech-projects/claude-optimal/profiles/` | Built-in profiles |
| `~/local-tech-projects/claude-optimal/canon/` | Canon skill source |
| `~/local-tech-projects/claude-optimal/workflow-skills/` | Workflow skill source |
| `.claude/skills/` | Project-installed skills |
| `.claude/canon-manifest.json` | Skill version tracking |
| `.claude/workflow-manifest.json` | Workflow version tracking |
| `.mcp.json` | Project MCP server config |

## Testing Strategy

Tests follow the Testing Trophy (Dodds):

```
        Integration
       /          \
      /   Unit     \
     /              \
    ────────────────────
```

- **Integration tests**: `src/cli/cli.integration.test.ts`
  - Full CLI command execution
  - File system verification
  - End-to-end workflows

- **Unit tests**: Per-module test files
  - `src/profiles/profiles.test.ts`
  - `src/mcp/registry.test.ts`
  - `src/scanner/scanner.test.ts`
