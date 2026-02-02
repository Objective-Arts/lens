# cc-config Documentation

**cc-config** sets up Claude Code projects with expert skills and configuration profiles, while **ralph** autonomously implements features by running code through a 10-phase workflow. This reflects Deming's principle of building quality in rather than inspecting it at the end. The result is code that is much more reviewable and much closer to production ready.

---

## Quick Links

| I want to... | Go to... |
|--------------|----------|
| Set up my first project | [Getting Started Tutorial](./tutorials/getting-started.md) |
| Run ralph on a PRD | [First Ralph Run Tutorial](./tutorials/first-ralph-run.md) |
| Apply a profile | [How to Apply Profiles](./how-to/apply-profiles.md) |
| Look up a command | [Command Reference](./reference/commands.md) |
| Understand the architecture | [Architecture Explanation](./explanation/architecture.md) |
| Learn to code in this codebase | [Developer Guide](./DEVELOPER-GUIDE.md) |

---

## Documentation Structure

This documentation follows the [Diátaxis framework](https://diataxis.fr/):

### Tutorials — Learning-oriented

Step-by-step lessons for beginners. Start here if you're new.

- [Getting Started](./tutorials/getting-started.md) — Set up your first project
- [First Ralph Run](./tutorials/first-ralph-run.md) — Implement a feature autonomously

### How-To Guides — Task-oriented

Practical steps to accomplish specific goals. Use when you know what you want to do.

- [Apply Profiles](./how-to/apply-profiles.md) — Configure a project with profiles
- [Manage Skills](./how-to/manage-skills.md) — Install, upgrade, and check skills
- [Configure MCP Servers](./how-to/configure-mcp.md) — Set up MCP servers
- [Run Ralph](./how-to/run-ralph.md) — Execute the autonomous workflow
- [Audit Configuration](./how-to/audit-configuration.md) — Scan and troubleshoot

### Reference — Information-oriented

Technical descriptions. Look up specific details.

- [Commands](./reference/commands.md) — All CLI commands and flags
- [Profile Format](./reference/profiles.md) — YAML profile specification
- [Configuration Files](./reference/configuration.md) — File formats and locations
- [Types](./reference/types.md) — TypeScript type definitions

### Explanation — Understanding-oriented

Background and context. Read to understand *why*.

- [Architecture](./explanation/architecture.md) — System design and module structure
- [Quality Philosophy](./explanation/quality-philosophy.md) — Why quality is built in
- [Skills System](./explanation/skills-system.md) — How skills work
- [The 8 Phases](./explanation/phases.md) — What each phase does and why

---

## Installation

```bash
# Clone and build
cd cli
npm install
npm run build
npm link

# Verify
cc-config --version
ralph --help
```

---

## Quick Example

```bash
# Set up a React project
cc-config profile apply javascript+react -p ./my-app

# Create a PRD
echo "- [ ] Add user authentication" > PRD.md

# Run autonomous implementation
ralph PRD.md
```
