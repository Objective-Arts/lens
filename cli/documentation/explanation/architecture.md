# Architecture

System design and how the pieces fit together.

---

## Overview

cc-config is a two-part system:

```
┌─────────────────────────────────────────────────────────────────┐
│                         cc-config CLI                           │
│                                                                  │
│  profile apply  →  Copy skills, create CLAUDE.md, settings     │
│  scan          →  Discover configuration, count tokens          │
│  canon         →  Manage expert skills                          │
│  mcp           →  Manage MCP servers                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                            ralph                                 │
│                                                                  │
│  PRD → 10 Phases → Complete Implementation                       │
│                                                                  │
│  plan → structure → implement → refactor → review → analyze     │
│  → test → document → security → production-readiness            │
└─────────────────────────────────────────────────────────────────┘
```

**cc-config** prepares projects. **ralph** executes work.

---

## Module Structure

```
src/
├── cli/           # CLI entry and commands
├── ralph/         # Autonomous implementation
├── scanner/       # Configuration discovery
├── profiles/      # Profile management
├── canon/         # Skill management
├── mcp/           # MCP server registry
├── workflow/      # Workflow skills
├── parser/        # File parsing
├── hooks/         # Hook system
├── trace/         # Debug tracing
├── utils/         # Utilities
└── types.ts       # Shared types
```

### cli/

Entry point and command definitions. Uses Commander.js.

- `index.ts` — Program entry, registers commands
- `commands/` — One file per command group
- `display/` — Output formatting

### ralph/

The autonomous implementation engine.

- `index.ts` — Ralph CLI entry
- `runner.ts` — Orchestrates phases
- `phases/` — Phase implementations
- `prd/` — PRD parsing and updating
- `parsers/` — Output parsing
- `display/` — Terminal UI

### scanner/

Discovers configuration across scopes.

- Scans `~/.claude/` (global) and `.claude/` (project)
- Finds skills, commands, agents, settings
- Builds dependency graph
- Estimates token counts

### profiles/

Manages composable profiles.

- Loads YAML profiles
- Handles inheritance (`extends`)
- Merges combined profiles (`+`)
- Applies to projects

### canon/

Copy-with-manifest system for skills.

- Copies skills (not symlinks) for portability
- Tracks versions via manifest
- Detects outdated and modified skills
- Enables upgrade path

### mcp/

MCP server registry and operations.

- Registry of known servers
- Install/enable/disable operations
- Environment variable checking

---

## Data Flow

### Profile Application

```
cc-config profile apply javascript+react -p .
                     │
                     ▼
            Parse profile string
            ["javascript", "react"]
                     │
                     ▼
            Load each profile YAML
            Resolve inheritance (extends)
                     │
                     ▼
            Merge profiles
            (later overrides earlier)
                     │
                     ▼
            Copy skills to .claude/skills/
            Update canon-manifest.json
                     │
                     ▼
            Generate CLAUDE.md
            (standards + auto-invoke)
                     │
                     ▼
            Create settings.json
            Configure MCP servers
                     │
                     ▼
            Project configured
```

### Ralph Execution

```
ralph PRD.md
     │
     ▼
Validate prerequisites
├── Claude CLI installed?
├── ralph-config.yaml exists?
└── PRD file valid?
     │
     ▼
Parse PRD, find incomplete items
     │
     ▼
For each incomplete item:
     │
     ├─── Phase 1: Plan
     │    ├── Load phase experts
     │    ├── Detect dynamic experts (keywords)
     │    ├── Build prompt
     │    └── Run Claude
     │
     ├─── Phase 2: Structure-First
     │    └── Define types/interfaces
     │
     ├─── Phase 3: Implement
     │    └── Write the code
     │
     ├─── Phase 4: Refactor-Check
     │    └── Clean up, simplify
     │
     ├─── Phase 5: Adversarial-Review
     │    └── Gemini security review
     │
     ├─── Phase 6: Static-Analysis
     │    └── Qodana scan
     │
     ├─── Phase 7: Test
     │    └── Write and run tests
     │
     └─── Phase 8: Doc-Code
          └── Generate documentation
     │
     ▼
Mark item complete in PRD
     │
     ▼
Next item (or done)
     │
     ▼
Generate summary report
```

---

## Key Design Decisions

### Copy vs Symlink

Skills are **copied** to projects, not symlinked.

**Why**:
- Projects are fully portable
- No broken symlinks when source moves
- Explicit upgrade path via `canon upgrade`
- Clear versioning via manifest

**Trade-off**: Duplicate storage, but skills are small.

### Manifest Tracking

`canon-manifest.json` tracks:
- Git commit when installed
- SHA-256 hash of content
- Whether user modified it

This enables:
- Detecting when source updated
- Detecting user modifications
- Safe upgrades that don't lose changes

### Phase-Based Quality

Ralph uses 10 phases instead of "write code, then test."

**Why**:
- Planning prevents false starts
- Structure-first prevents refactoring
- Early review catches issues cheaply
- Quality is built in, not bolted on

### Expert Loading

Each phase loads relevant experts:

```yaml
plan:
  - kernighan    # Clarity
  - pike         # Simplicity
  - dijkstra     # Correctness

implement:
  - cherny       # TypeScript
  - crockford    # JavaScript safety
```

Plus dynamic loading based on keywords in PRD:
- "form", "button" → frost, norman
- "database", "schema" → relevant experts
- "security", "auth" → schneier, owasp

---

## Configuration Scopes

### Global (`~/.claude/`)

User-wide configuration:
- Default skills and agents
- Global CLAUDE.md
- User MCP servers

### Project (`.claude/`)

Project-specific configuration:
- Overrides global
- Copied (portable) skills
- Project settings

### Resolution

Project scope wins for conflicts:

```
~/.claude/skills/foo/      ← global foo
.claude/skills/foo/        ← project foo (used)
```

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript 5.6 |
| CLI Framework | Commander.js 12 |
| Terminal Output | chalk 5 |
| File Matching | glob 11 |
| YAML Parsing | js-yaml 4, yaml 2 |
| Testing | Vitest 2 |
| Build | tsc |

---

## Extension Points

### Adding a Command

1. Create `src/cli/commands/mycommand.ts`
2. Export `registerMyCommand(program)`
3. Add to `src/cli/commands/index.ts`
4. Register in `src/cli/index.ts`

### Adding a Phase

1. Create `src/ralph/phases/myphase.ts`
2. Extend `BasePhase`
3. Add to `PhaseName` type
4. Add to `PHASE_ORDER`
5. Export from `src/ralph/phases/index.ts`

### Adding a Profile

Create YAML in `~/.claude/profiles/` or built-in profiles directory.
