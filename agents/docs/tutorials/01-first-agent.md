# Tutorial: Your First Canon Agent

Learn how to run Claude with design principle enforcement.

## What You'll Learn

- Run the canon-agent CLI
- Understand what canon gets loaded
- See citation enforcement in action

## Prerequisites

- Node.js 20+
- Claude API key set as `ANTHROPIC_API_KEY`

## Step 1: Install the Package

```bash
cd your-project
npm install @claude-optimal/agents
```

## Step 2: Run Your First Task

```bash
npx canon-agent "Create a function that validates email addresses"
```

You'll see output like:

```
Canon path: /path/to/canon

Starting build-from-plan agent...

[10:30:15] Starting build-from-plan agent (loaded: kernighan, gang-of-four, javascript/cherny)
```

## Step 3: Observe Canon Loading

The agent automatically detects your project type and loads relevant canon:

- **All projects**: kernighan (clarity), gang-of-four (patterns)
- **TypeScript**: cherny (type design)
- **Tests**: dodds (testing philosophy), meszaros (patterns)
- **React**: norman (UX), frost (atomic design)

## Step 4: See Citation Enforcement

When Claude tries to edit code, the citation enforcer checks if Claude mentioned a canon author. If not, the edit is blocked:

```
Canon citation required before editing code.

Before making changes, cite which design principle guides this change.

**Loaded Canon:**
  - kernighan
  - gang-of-four
  - javascript/cherny

**Example citations:**
- "Following Cherny's preference for discriminated unions..."
- "Applying Gang of Four's strategy pattern..."
```

Claude must then state its reasoning:

```
Following Cherny's preference for explicit validation types,
I'll define a ValidationResult discriminated union...
```

## Step 5: Check the Session Log

After completion, find the session log:

```bash
cat .claude/sessions/<session-id>.json
```

This shows:
- Which canon was loaded
- All tools used
- Quality gate results

## What's Next?

- [Design Types First](./02-structure-first.md) - Use structure-first agent
- [PRD-Driven Development](../how-to/ralph-loop.md) - Autonomous development loop
- [API Reference](../reference/api.md) - Full API documentation
