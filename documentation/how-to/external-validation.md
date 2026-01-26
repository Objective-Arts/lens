# How to Set Up External Validation

*Configure Gemini and Qodana for two-tier code review.*

## Why External Validation?

Claude-Optimal uses a two-tier review architecture:

1. **Self-Review** (Tier 1): Claude reviews its own code using canon standards
2. **External Validation** (Tier 2): Different tools catch blind spots

External validation uses:
- **Gemini**: Different AI model with different biases
- **Qodana**: Static analysis catches mechanical issues

## Prerequisites

- cc-config CLI installed
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

When using `ralph-integration` profile, the CLI automatically creates `.mcp.json`:

```bash
cc-config profile apply "javascript+ralph-integration" -p .
```

This creates `.mcp.json` with Gemini and Qodana server configs.

**Important**: The servers inherit environment variables from your shell, so `GEMINI_API_KEY` must be set before starting Claude Code.

### Manual Installation

If not using ralph-integration, install servers manually:

```bash
# Gemini reviewer
cc-config mcp install gemini-reviewer -p .

# Qodana scanner
cc-config mcp install qodana -p .
```

Enable them:

```bash
cc-config mcp enable gemini-reviewer -p .
cc-config mcp enable qodana -p .
```

---

## Step 3: Verify Setup

Check that everything is configured:

```bash
cc-config mcp check --all -p .
```

Expected output:

```
Environment Check Results:

  ✓ gemini-reviewer: All env vars set
  ✓ qodana: All env vars set

All servers have required env vars set.
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
Review this code with Gemini:

function add(a, b) {
  return a + b;
}
```

Claude should use the Gemini MCP tool to get an external review.

### Test Qodana Scan

```
Run Qodana on this project
```

Or via CLI:

```bash
# Direct Qodana scan
docker run --rm -v $(pwd):/data/project jetbrains/qodana-js:latest --save-report
```

---

## Using with Ralph Loop

When running Ralph Loop with external validation:

```bash
claude "/ralph-loop PRD.md --external"
```

This runs Gemini + Qodana as post-loop validation after all PRD items complete.

### Two-Tier Architecture

```
┌─────────────────────────────────────────────────┐
│                 RALPH LOOP                       │
│                                                  │
│  Per PRD item:                                   │
│      implement → test → /review-hard → commit    │
│                                                  │
│  Self-review catches:                            │
│      - Pattern violations                        │
│      - Security basics                           │
│      - Style issues                              │
│                                                  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│           POST-LOOP VALIDATION (once)            │
│                                                  │
│  Gemini: Second opinion, edge cases              │
│  Qodana: Static analysis, deep checks            │
│                                                  │
│  Output: .claude/ext-validation-findings.md      │
│  Action: Human decides to fix or ship            │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Configuration Options

In your profile or `.claude/settings.json`:

```yaml
ralph:
  post_loop_validation:
    enabled: true
    gemini: true
    qodana: true
    action: report           # report | fail
    findings_file: .claude/ext-validation-findings.md
    promote_threshold: 3     # Suggest adding to CLAUDE.md after N occurrences
```

---

## Reviewing Findings

After external validation, check the findings:

```bash
cat .claude/ext-validation-findings.md
```

The file accumulates findings across runs. Review periodically and:
- Fix critical issues
- Add recurring patterns to CLAUDE.md standards
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
cc-config mcp list --installed -p .

# Check they're enabled
cc-config mcp list --enabled -p .

# Restart Claude Code after enabling
```

---

## Best Practices

1. **Run external validation at milestones**, not every commit
2. **Review findings thoughtfully** — not all issues need fixing
3. **Promote recurring patterns** to CLAUDE.md to prevent future issues
4. **Use `--external` flag** with Ralph Loop for autonomous runs
5. **Keep Docker images updated** for latest Qodana checks

---

## See Also

- [Two-Tier Review Architecture](../explanation/two-tier-review.md)
- [Configure Ralph Loop](configure-ralph-loop.md)
- [Installation Reference](../reference/installation.md)
