# Installation Map

Complete map of all components and their locations.

---

## Overview

```
~/ (Home Directory)
├── .claude/                          ← Global Claude Code config
│   ├── settings.json                 ← Global settings (hooks, permissions)
│   ├── profiles/                     ← User-created profiles
│   ├── skills/                       ← Global skills (available to all projects)
│   ├── skill-library/                ← Skill sources
│   │   ├── security/                 ← Security skills
│   │   └── tech/                     ← Tech skills
│   ├── mcp-registry/                 ← MCP server registry
│   │   └── servers/                  ← Server definitions (YAML)
│   ├── mcp.json                      ← Global MCP configuration
│   └── workflow-skills/              ← Global workflow skills
│
├── .local/bin/                       ← CLI tools
│   ├── cc-config                     ← Configuration CLI
│   └── ralph                         ← Autonomous workflow CLI
│
└── local-tech-projects/claude-optimal/  ← Source repository (development)
    ├── canon/                        ← Canon skill sources
    ├── profiles/                     ← Built-in profile definitions
    ├── workflow-skills/              ← Workflow skill sources
    ├── mcp-servers/                  ← MCP server sources
    └── config/                       ← Phase config sources
        ├── workflow-phases.yaml
        └── keyword-detection.yaml

project/                              ← Any project with profile applied
├── .claude/                          ← Project-specific config
│   ├── settings.json                 ← Project MCP, permissions
│   ├── skills/                       ← Installed skills (copied, not linked)
│   │   ├── plan/
│   │   ├── structure-first/
│   │   ├── implement/
│   │   └── ...
│   ├── plans/                        ← Implementation plans (created during workflow)
│   │   └── feature-slug.md
│   ├── config/                       ← Phase configuration
│   │   ├── workflow-phases.yaml
│   │   └── keyword-detection.yaml
│   ├── ralph-config.yaml             ← Ralph configuration
│   ├── ralph-logs/                   ← Ralph execution logs
│   ├── canon-manifest.json           ← Tracks installed skill versions
│   ├── workflow-manifest.json        ← Tracks workflow skill versions
│   └── active-workflow.json          ← Current workflow state
│
└── CLAUDE.md                         ← Project instructions, auto-invoke rules
```

---

## Global Installation (~/.claude/)

Files that apply to all projects on this machine.

| Path | Purpose | Created By |
|------|---------|------------|
| `~/.claude/settings.json` | Global hooks, permissions | Claude Code / `cc-config hooks` |
| `~/.claude/mcp.json` | Global MCP servers | `cc-config mcp install --global` |
| `~/.claude/profiles/` | User-created profiles | `cc-config profile save` |
| `~/.claude/skills/` | Global skills | Manual or profile with global scope |
| `~/.claude/skill-library/security/` | Security skill sources | Separate installation |
| `~/.claude/skill-library/tech/` | Tech skill sources | Separate installation |
| `~/.claude/mcp-registry/servers/` | MCP server definitions | `cc-config mcp add` |
| `~/.claude/workflow-skills/` | Global workflow skills | Manual installation |

---

## Project Installation (project/.claude/)

Files specific to a single project.

| Path | Purpose | Created By |
|------|---------|------------|
| `.claude/settings.json` | Project MCP, permissions | `cc-config mcp install -p .` |
| `.claude/skills/` | Installed skills (copied) | `cc-config profile apply` |
| `.claude/plans/` | Implementation plans | `/plan` workflow skill |
| `.claude/config/workflow-phases.yaml` | Phase expert assignments | `cc-config profile apply` (ralph profiles) |
| `.claude/config/keyword-detection.yaml` | Keyword → expert mapping | `cc-config profile apply` (ralph profiles) |
| `.claude/ralph-config.yaml` | Ralph settings | `cc-config profile apply` (ralph profiles) |
| `.claude/ralph-logs/` | Execution logs | Ralph during execution |
| `.claude/canon-manifest.json` | Skill version tracking | `cc-config canon install` |
| `.claude/workflow-manifest.json` | Workflow skill versions | `cc-config profile apply` |
| `.claude/active-workflow.json` | Current workflow state | Workflow skills during execution |

---

## CLI Tools (~/.local/bin/)

| Tool | Purpose | Installation |
|------|---------|--------------|
| `cc-config` | Configuration management | `npm link` or `npm install -g` |
| `ralph` | Autonomous PRD workflow | `npm link` or `npm install -g` |

---

## Source Repository (Development)

The source repository contains canonical definitions that get copied to projects.

| Path | Purpose |
|------|---------|
| `canon/` | Canon skill definitions (88 skills) |
| `profiles/` | Built-in profile definitions |
| `workflow-skills/` | Workflow skill definitions |
| `mcp-servers/` | MCP server definitions |
| `config/` | Phase configuration templates |

---

## What Gets Installed Where

### When you run `cc-config profile apply javascript -p ./myproject`:

```
myproject/
├── .claude/
│   ├── skills/                    ← Skills from profile copied here
│   │   ├── clarity/
│   │   ├── typescript/
│   │   ├── js-safety/
│   │   ├── plan/
│   │   ├── implement/
│   │   └── ...
│   ├── canon-manifest.json        ← Tracks what was installed
│   └── workflow-manifest.json     ← Tracks workflow skills
│
└── CLAUDE.md                      ← Updated with auto-invoke rules
```

### When you run `cc-config profile apply ralph-integration -p ./myproject`:

Additional files:

```
myproject/.claude/
├── config/
│   ├── workflow-phases.yaml       ← Phase → expert mapping
│   └── keyword-detection.yaml     ← Keyword → expert mapping
└── ralph-config.yaml              ← Ralph settings
```

### When you run `cc-config mcp install gemini-reviewer -p ./myproject`:

```
myproject/.claude/
└── settings.json                  ← MCP server configuration added
```

---

## Environment Variables

Override default paths with environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `CC_SKILLS_SECURITY` | `~/.claude/skill-library/security` | Security skills source |
| `CC_SKILLS_TECH` | `~/.claude/skill-library/tech` | Tech skills source |
| `CC_SKILLS_CANON` | `~/local-tech-projects/claude-optimal/canon` | Canon skills source |
| `CC_SKILLS_GLOBAL` | `~/.claude/skills` | Global skills directory |

---

## File Ownership

| File | Owned By | Should You Edit? |
|------|----------|------------------|
| `.claude/skills/*` | Profile system | No - use `cc-config canon upgrade` |
| `.claude/config/*` | Profile system | Yes - customize for project |
| `.claude/ralph-config.yaml` | Profile system | Yes - customize for project |
| `.claude/plans/*` | Workflow | Yes - these are your plans |
| `CLAUDE.md` | Profile + You | Yes - add custom rules |
| `.claude/settings.json` | Claude Code | Use `cc-config` to modify |

---

## Typical Installation Flow

```bash
# 1. Install CLI tools (once)
cd claude-optimal/cli
npm install && npm run build && npm link

# 2. Apply profile to a project
cd ~/myproject
cc-config profile apply javascript+react+ralph-integration -p .

# 3. Install MCP servers (optional)
cc-config mcp install gemini-reviewer -p .

# 4. Start using
claude                     # Opens Claude Code with skills loaded
ralph PRD.md              # Runs autonomous workflow
```

---

## Verification

Check what's installed:

```bash
# List installed skills
cc-config canon status -p ./myproject

# Audit configuration
cc-config scan -p ./myproject

# Check MCP servers
cc-config mcp list -p ./myproject
```
