# Gemini Reviewer MCP Server

Code review via Google Gemini. Use as an external reviewer during Claude Code sessions.

## Tool

| Tool | Description |
|------|-------------|
| `gemini_review` | Send code to Gemini for expert review |

### Focus Options

- `general` - Comprehensive review (default)
- `security` - Security vulnerabilities and risks
- `performance` - Performance and optimization
- `readability` - Clarity and maintainability
- `bugs` - Bug detection and edge cases

## Setup via cc-config

### 1. Get API Key

Get a free key from [Google AI Studio](https://aistudio.google.com/apikey)

### 2. Set Environment Variable

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export GEMINI_API_KEY="your-key-here"
```

Then reload: `source ~/.zshrc`

### 3. Register Server in cc-config Registry

```bash
cd mcp-servers/gemini-reviewer
npm install
./install.sh
```

This adds the server definition to `~/.claude/mcp-registry/servers/`.

### 4. Install to Your Project

```bash
cd /path/to/your/project
cc-config mcp install gemini-reviewer
cc-config mcp enable gemini-reviewer
```

This creates/updates `.mcp.json` in your project with the server config.

### 5. Restart Claude Code

## Usage

```
"Use Gemini to review this code"
"Have Gemini check this function for security issues"
"Get Gemini's opinion on this implementation"
```

## Project-Level Config

MCP servers are installed per-project, not globally. This means:
- Each project has its own `.mcp.json`
- Different projects can use different MCP servers
- Config is portable with the project

## Cost

- Free tier: 60 requests/minute (plenty for code reviews)
- Paid: ~$0.00025/1K characters (very cheap)
