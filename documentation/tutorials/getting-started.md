---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# Tutorial: Getting Started with Claude-Optimal

*Learn the fundamentals by setting up your first project with quality standards.*

## What You'll Learn

- How to install the Claude-Optimal CLI
- How to configure required API keys
- How to apply a profile to a project
- How expert skills shape code quality
- How to verify the setup is working

## Prerequisites

| Requirement | Purpose |
|-------------|---------|
| Node.js 18+ | Run cc-config CLI |
| Claude Code CLI | AI coding assistant |
| Docker | Run Qodana static analysis |
| Gemini API Key | External code review |

## Step 1: Install the CLI

You should have received a `cc-config-X.X.X.tgz` file or access to the source repository.

### Option A: From Tarball

```bash
npm install -g ./cc-config-0.1.0.tgz
```

### Option B: From Source

```bash
git clone <provided-repository-url> claude-optimal
cd claude-optimal/cli
npm install
npm run build
npm link
```

Verify the installation:

```bash
cc-config --version
```

You should see a version number displayed.

## Step 2: Configure API Keys

### Gemini API Key (Required for External Review)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a free API key
3. Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### Qodana Token (Optional)

For cloud-based static analysis reports:

1. Go to [Qodana Cloud](https://qodana.cloud)
2. Create account and generate token
3. Add to shell profile:

```bash
export QODANA_TOKEN="your-qodana-token-here"
```

### Reload Shell

```bash
source ~/.zshrc  # or source ~/.bashrc
```

## Step 3: Navigate to Your Project

Change to your project directory:

```bash
cd /path/to/your/project
```

For this tutorial, we'll use a JavaScript/React project. If you don't have one, create a simple one:

```bash
mkdir my-react-app
cd my-react-app
npm init -y
git init
```

## Step 4: Apply a Profile

Profiles bundle together the right expert skills, standards, and auto-invoke rules. Apply the JavaScript + React profile:

```bash
cc-config profile apply javascript+react -p .
```

You'll see output confirming what was configured:

```
Combining profiles: javascript + react

Created:
  + .claude/CLAUDE.md
  + .claude/settings.json

Linked:
  → skills/simpson
  → skills/cherny
  → skills/crockford
  → skills/react-state

Profile applied successfully!
```

## Step 5: Examine What Was Created

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
- Profiles Applied (which profiles are active)
- Standards (code quality rules)
- Anti-Patterns (what to avoid)
- Auto-Invoke Rules (when to activate which skills)

## Step 6: Verify MCP Servers (Optional)

If you want external validation with Gemini and Qodana:

```bash
# Install MCP servers
cc-config mcp install gemini-reviewer -p .
cc-config mcp install qodana -p .

# Enable them
cc-config mcp enable gemini-reviewer -p .
cc-config mcp enable qodana -p .

# Verify environment variables are set
cc-config mcp check --all -p .
```

## Step 7: Verify with Claude

Open Claude Code in your project:

```bash
claude
```

Ask Claude to check its configuration:

```
/status
```

Claude should show the active skills, standards, and agents.

## Step 8: Write Some Code

Now let's see the canon in action. Ask Claude to build something:

```
Build a simple counter component --structure-first
```

Notice how Claude:
1. Plans the structure before implementing
2. Separates concerns (state hook vs presentation)
3. Follows React patterns (react-state skill)
4. Keeps functions focused (clarity skill)

## Step 9: Run an Audit

Check your project's configuration:

```bash
cc-config audit -p .
```

This shows:
- Which canon skills are installed
- Any missing references
- Token usage breakdown

## What You've Accomplished

You've successfully:
- Installed the Claude-Optimal CLI
- Configured API keys for external validation
- Applied a profile that loads the right canon
- Configured standards that enforce quality
- Verified that Claude is using the configuration

## Next Steps

- [Adding a Canon Skill](adding-canon-skill.md) - Create your own expert lens
- [Running Ralph Loop](ralph-loop-basics.md) - Autonomous development with PRDs
- [How to Use Quality Flags](../how-to/use-quality-flags.md) - Enforce quality at key moments
- [Why Expert Skills?](../explanation/why-expert-skills.md) - Understand the philosophy
