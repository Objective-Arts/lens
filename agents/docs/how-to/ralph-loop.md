# How to Run PRD-Driven Development

Use the Ralph loop for autonomous, PRD-driven development with checkpointing.

## Prerequisites

- A PRD file with numbered items
- Canon agents installed

## Create a PRD File

Create `PRD.md` with numbered items:

```markdown
# Feature: User Dashboard

## Items

1. Create a DashboardLayout component with sidebar and main content area
2. Add a StatsCard component showing key metrics
3. Implement the ActivityFeed component with pagination
4. Add responsive breakpoints for mobile view
```

## Run the Ralph Loop

```bash
npx canon-agent --prd ./PRD.md
```

Output:

```
Starting Ralph loop for: ./PRD.md

[10:40:00] Found 4 PRD items to implement
[10:40:01] Working on item 1/4: Create a DashboardLayout component...
```

## How It Works

1. **Parse PRD** - Extracts numbered items as tasks
2. **Process Each Item** - Runs build-from-plan agent per item
3. **Checkpoint Progress** - Saves state every 3 items (configurable)
4. **Quality Gates** - Runs TypeScript + tests after each item
5. **Resume on Failure** - Picks up from last checkpoint

## Resume After Interruption

If the process stops, just run again:

```bash
npx canon-agent --prd ./PRD.md
```

It finds the checkpoint and resumes:

```
Resuming from checkpoint: item 2/4, completed: 1, failed: 0
```

## Options

```bash
# Limit iterations (default: 50)
npx canon-agent --prd ./PRD.md --max-turns 100

# Add external validation (Gemini + Qodana)
# Requires MCP tools configured
npx canon-agent --prd ./PRD.md --external
```

## PRD Format Tips

Good PRD items are:

- **Specific**: "Add pagination to ActivityFeed" not "improve the feed"
- **Testable**: Clear acceptance criteria
- **Independent**: Can be implemented in isolation

```markdown
3. Implement the ActivityFeed component with pagination
   - [ ] Show 20 items per page
   - [ ] Add "Load More" button
   - [ ] Display loading state during fetch
```

## Programmatic Usage

```typescript
import { runRalphLoop } from '@claude-optimal/agents';

for await (const msg of runRalphLoop('./PRD.md', {
  maxIterations: 50,
  checkpointInterval: 3,
  external: true, // Gemini + Qodana
})) {
  if (msg.type === 'status') {
    console.log(`[STATUS] ${msg.content}`);
  } else if (msg.type === 'text') {
    console.log(msg.content);
  }
}
```

## Troubleshooting

### "No items found in PRD"

Check your PRD uses numbered lists:

```markdown
1. First item
2. Second item
```

Not bullets or other formats.

### Stuck on one item

The agent has iteration limits. If an item keeps failing:

1. Check the session log: `.claude/sessions/<id>.json`
2. Simplify the PRD item
3. Run with higher max-turns: `--max-turns 20`

## See Also

- [API: runRalphLoop](../reference/api.md#runralphloop)
- [Architecture: State Machine](../architecture/ralph-state.md)
