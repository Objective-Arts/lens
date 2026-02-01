# Tutorial: Getting Started

Set up your first project with cc-config. By the end, you'll have a fully configured Claude Code project ready for development.

**Time**: 10 minutes
**Prerequisites**: Node.js installed, Claude Code CLI installed

---

## Step 1: Install cc-config

Navigate to the cli directory and install:

```bash
cd cli
npm install
npm run build
npm link
```

Verify it works:

```bash
cc-config --version
```

You should see version output.

---

## Step 2: Create a Project Directory

Create a new directory for your project:

```bash
mkdir my-project
cd my-project
npm init -y
```

---

## Step 3: See Available Profiles

List the profiles you can use:

```bash
cc-config profile list
```

You'll see profiles like:
- `javascript` — JavaScript/TypeScript projects
- `react` — React applications
- `python` — Python projects
- `java` — Java projects

---

## Step 4: Apply a Profile

Apply the JavaScript profile to your project:

```bash
cc-config profile apply javascript -p .
```

This creates:
```
my-project/
├── .claude/
│   ├── skills/           # Expert skills copied here
│   ├── canon-manifest.json
│   └── settings.json
└── CLAUDE.md             # Standards and auto-invoke rules
```

---

## Step 5: Verify the Setup

Scan your project to see what was installed:

```bash
cc-config scan -p .
```

You'll see a summary of skills, their token counts, and any issues.

---

## Step 6: Check Skill Status

See which skills are installed and their versions:

```bash
cc-config canon status -p .
```

Each skill shows:
- `✓ current` — Matches source
- `⚠ outdated` — Source has updates
- `✎ modified` — You changed it locally

---

## Step 7: Combine Profiles (Optional)

If you're building a React app, combine profiles:

```bash
cc-config profile apply javascript+react -p .
```

The `+` operator merges profiles, adding React-specific skills.

---

## What You've Learned

- How to install cc-config
- How to apply profiles to a project
- How to scan and verify configuration
- How to combine profiles

---

## Next Steps

- [Run ralph on a PRD](first-ralph-run.md) — Implement a feature autonomously
- [How to Manage Skills](../how-to/manage-skills.md) — Install and upgrade skills
- [Command Reference](../reference/commands.md) — All available commands
