# Tutorial: Getting Started with Claude-Optimal

*Learn the fundamentals by setting up your first project with quality standards.*

## What You'll Learn

- How to install the Claude-Optimal CLI
- How to apply a profile to a project
- How canon masters shape code quality
- How to verify the setup is working

## Prerequisites

- Claude Code CLI installed and authenticated
- Node.js 18+ installed
- A project directory to configure

## Step 1: Install the CLI

Open your terminal and install the cc-config CLI globally:

```bash
npm install -g @claude-optimal/cli
```

Verify the installation:

```bash
cc-config --version
```

You should see a version number displayed.

## Step 2: Navigate to Your Project

Change to your project directory:

```bash
cd /path/to/your/project
```

For this tutorial, we'll use a JavaScript/React project. If you don't have one, create a simple one:

```bash
mkdir my-react-app
cd my-react-app
npm init -y
```

## Step 3: Apply a Profile

Profiles bundle together the right canon masters, standards, and auto-invoke rules. Apply the JavaScript + React profile:

```bash
cc-config profile apply javascript+react -p .
```

You'll see output confirming what was configured:

```
Applied profile: javascript+react

Canon Stack:
  Baseline Brain: kernighan, thompson, pike, joy, linus, dijkstra
  Base Practices: schneier, owasp, dodds, meszaros, feathers, procida
  Domain: simpson, cherny, crockford, abramov

Created:
  .claude/CLAUDE.md
  .claude/settings.json
```

## Step 4: Examine What Was Created

Look at your project's `.claude` directory:

```bash
ls -la .claude/
```

You should see:

```
.claude/
├── CLAUDE.md      # Standards and auto-invoke rules
├── settings.json  # Profile configuration
└── skills/        # Symlinked canon skills
```

Open `.claude/CLAUDE.md` to see the standards that were added:

```bash
cat .claude/CLAUDE.md
```

You'll see sections for:
- Canon Stack (which masters are active)
- Universal Standards (30-line max, single responsibility)
- Framework Standards (React-specific patterns)
- Auto-Invoke Rules (when to activate which skills)

## Step 5: Verify with Claude

Open Claude Code in your project:

```bash
claude
```

Ask Claude to check its configuration:

```
/status
```

Claude should show the active canon stack, standards, and agents.

## Step 6: Write Some Code

Now let's see the canon in action. Ask Claude to build something:

```
Build a simple counter component --structure-first
```

Notice how Claude:
1. Plans the structure before implementing
2. Separates concerns (state hook vs presentation)
3. Follows React patterns (Abramov canon)
4. Keeps functions under 30 lines (universal standard)

## What You've Accomplished

You've successfully:
- Installed the Claude-Optimal CLI
- Applied a profile that loads the right canon
- Configured standards that enforce quality
- Verified that Claude is using the configuration

## Next Steps

- [Adding a Canon Skill](adding-canon-skill.md) - Create your own expert lens
- [How to Use Quality Flags](../how-to/use-quality-flags.md) - Enforce quality at key moments
- [Why Canon Masters?](../explanation/why-canon-masters.md) - Understand the philosophy
