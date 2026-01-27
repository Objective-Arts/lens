# Canon Agents Documentation

Canon-enforced agents using Claude Agent SDK. Forces deliberate design decisions through programmatic hooks.

## Quick Start

```bash
# Install
npm install @claude-optimal/agents

# Run a task with canon enforcement
npx canon-agent "Add user authentication"

# Or from code
import { runWithCanon } from '@claude-optimal/agents';

for await (const msg of runWithCanon("Add login form", 'build-from-plan')) {
  console.log(msg.content);
}
```

## Documentation

| Type | Purpose | Start Here |
|------|---------|------------|
| **[Tutorial](./tutorials/)** | Learn by doing | [Your First Canon Agent](./tutorials/01-first-agent.md) |
| **[How-To](./how-to/)** | Solve specific problems | [Run PRD-Driven Development](./how-to/ralph-loop.md) |
| **[Reference](./reference/)** | API lookup | [API Reference](./reference/api.md) |
| **[Architecture](./architecture/)** | Understand the system | [How Canon Enforcement Works](./architecture/enforcement.md) |

## What This Package Does

1. **Loads Canon** - Design principles (Cherny's TypeScript, Dodds' testing, etc.) into Claude's context
2. **Enforces Citations** - Blocks code edits unless Claude cites which principle guides the change
3. **Quality Gates** - Runs TypeScript, tests, and lint before allowing task completion

## Agent Types

| Agent | Use Case |
|-------|----------|
| `structure-first` | Design types and interfaces before implementation |
| `build-from-plan` | Implement from an approved plan |
| `refactor-clean` | Systematically clean up legacy code |
| `ralph-loop` | Autonomous PRD-driven development |
