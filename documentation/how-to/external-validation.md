---
**STRICTLY CONFIDENTIAL**

This document contains proprietary and confidential information. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. This material is intended solely for authorized recipients.

---

# How to Set Up External Validation

*Configure Gemini and Qodana for multi-model code review.*

## Why External Validation?

Different tools catch blind spots Claude misses: Gemini provides a second AI opinion, Qodana runs static analysis. The pipeline's review phase (phase 6) runs all four scanners in parallel.

## Prerequisites

- lens CLI installed
- Docker running (for Qodana)
- Gemini API key

---

## Step 1: Get API Keys

### Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export GEMINI_API_KEY="your-key-here"
```

Reload:
```bash
source ~/.zshrc
```

### Qodana Token (Optional)

For cloud reports and history:

1. Go to [Qodana Cloud](https://qodana.cloud)
2. Create account
3. Generate token in Settings

```bash
export QODANA_TOKEN="your-token-here"
```

---

## Step 2: Configure MCP Servers

### Automatic (Recommended)

MCP servers are configured automatically when you apply a profile:

```bash
lens profile apply javascript+react -p .
```

This creates `.mcp.json` with Gemini and Qodana server configs. The servers inherit environment variables from your shell, so `GEMINI_API_KEY` must be set before starting Claude Code.

### Manual Installation

Install servers individually:

```bash
# Gemini reviewer
lens mcp install gemini-reviewer -p .

# Qodana scanner
lens mcp install qodana -p .
```

Enable them:

```bash
lens mcp enable gemini-reviewer -p .
lens mcp enable qodana -p .
```

---

## Step 3: Verify Setup

Check that everything is configured:

```bash
lens mcp check --all -p .
```

If you see missing variables, ensure they're exported in your shell profile.

---

## Step 4: Pull Qodana Images

Pre-pull Docker images to avoid delays:

```bash
# For JavaScript/TypeScript projects
docker pull jetbrains/qodana-js:latest

# For C#/.NET projects
docker pull jetbrains/qodana-dotnet:latest

# For Java projects
docker pull jetbrains/qodana-jvm:latest

# For Python projects
docker pull jetbrains/qodana-python:latest
```

---

## Step 5: Test External Validation

### Test Gemini Review

In Claude Code:

```
/gemini-scan src/
```

Claude should use the Gemini MCP tool to get an external review.

### Test Qodana Scan

```
/qodana-scan
```

Or via CLI:

```bash
# Direct Qodana scan
docker run --rm -v $(pwd):/data/project jetbrains/qodana-js:latest --save-report
```

---

## Using with the Pipeline

External validation runs automatically during phase 6 (review) of the `/build` and `/improve` pipelines:

```
Phase 6: Review
  ├── Gemini scan (code quality + security)
  ├── Codex scan (independent review)
  ├── Qodana scan (static analysis)
  └── AI smell scan (antipattern detection)
         ↓
  Findings deduped across all 4 scanners
         ↓
  Single fix agent applies unified list
```

### Two-Tier Architecture

```
┌─────────────────────────────────────────────────┐
│             PIPELINE (phases 1-8)                │
│                                                  │
│  Phase 3: implementation (Claude writes code)    │
│  Phase 6: review (4 parallel external scans)     │
│  Phase 8: evaluation (Codex + Gemini scoring)    │
│                                                  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│           LEARNING LOOP (cross-run)              │
│                                                  │
│  Findings → .claude/lessons.md                   │
│  Next run → phases 1-5 read lessons              │
│  Defect caught once → prevented forever          │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Reviewing Findings

Findings are written to lesson files during the pipeline:

- `.claude/lessons.md` — project-specific patterns with file paths
- `.claude/universal-lessons.md` — general patterns carried across projects

Review periodically and:
- Fix critical issues
- Promote recurring patterns to CLAUDE.md standards
- Dismiss false positives

---

## Troubleshooting

### "GEMINI_API_KEY not set"

```bash
# Check it's exported
echo $GEMINI_API_KEY

# If empty, verify your shell profile has the export
grep GEMINI ~/.zshrc

# Source the profile
source ~/.zshrc
```

### Qodana fails to start

```bash
# Check Docker is running
docker ps

# Check image is pulled
docker images | grep qodana

# Try running manually
docker run --rm jetbrains/qodana-js:latest --help
```

### Gemini returns errors

```bash
# Test API key directly
curl -s "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY"
```

If you see authentication errors, generate a new key.

### MCP servers not recognized

```bash
# Check they're installed
lens mcp list --installed -p .

# Check they're enabled
lens mcp list --enabled -p .

# Restart Claude Code after enabling
```

---

## Best Practices

1. Run external validation at milestones, not every commit
2. Promote recurring patterns to CLAUDE.md to prevent future issues

---

## See Also

- [Two-Tier Review Architecture](../explanation/two-tier-review.md)
- [Installation Reference](../reference/installation.md)
