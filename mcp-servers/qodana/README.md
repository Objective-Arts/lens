# Qodana MCP Server

MCP server for JetBrains Qodana code quality analysis.

## Features

- **Local Scanning**: Run Qodana scans via CLI on any project
- **Auto-detection**: Automatically detects project type and appropriate linter
- **Results Analysis**: Parse and filter scan results by severity, file, category
- **Baseline Management**: Create baselines to suppress known issues
- **Cloud Integration**: Access Qodana Cloud projects, reports, and problems

## Installation

### Prerequisites

1. **Qodana CLI** (for local scanning):
   ```bash
   # macOS
   brew install jetbrains/utils/qodana

   # Other platforms: https://github.com/JetBrains/qodana-cli
   ```

2. **Docker** (required by Qodana CLI for running linters)

3. **QODANA_TOKEN** (optional, for Cloud features):
   ```bash
   export QODANA_TOKEN=your_token_here
   ```

### Install Server

```bash
cd mcp-servers/qodana
npm install
npm run build
```

### Configure in Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "qodana": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/mcp-servers/qodana/dist/index.js"]
    }
  }
}
```

Or use cc-config:

```bash
cc-config mcp install qodana -p .
cc-config mcp enable qodana -p .
```

## Tools

### Local Analysis Tools

#### qodana_scan

Run a Qodana scan on a project.

```
qodana_scan({
  projectDir: "/path/to/project",
  linter: "qodana-js",           // optional, auto-detected
  baseline: "qodana.baseline.json", // optional
  failThreshold: "high",         // optional: any|critical|high|moderate|low|none
  changesOnly: true              // optional, scan only changed files
})
```

**Returns**: Summary with problem counts, top problems, paths to full results.

#### qodana_results

Get summary of previous scan results.

```
qodana_results({
  projectDir: "/path/to/project",
  resultsDir: ".qodana"  // optional
})
```

#### qodana_problems

List problems with filtering.

```
qodana_problems({
  projectDir: "/path/to/project",
  severity: "HIGH",      // optional: CRITICAL|HIGH|MODERATE|LOW|INFO
  file: "src/",          // optional: filter by file path
  category: "security",  // optional: filter by category
  limit: 50              // optional: max problems to return
})
```

#### qodana_baseline

Create a baseline from current results.

```
qodana_baseline({
  projectDir: "/path/to/project",
  baselinePath: "qodana.baseline.json"  // optional
})
```

#### qodana_status

Check CLI availability and Cloud configuration.

```
qodana_status()
```

#### qodana_detect

Detect appropriate linter for a project.

```
qodana_detect({
  projectDir: "/path/to/project"
})
```

### Cloud API Tools

Require `QODANA_TOKEN` environment variable.

#### qodana_cloud_projects

List projects in Qodana Cloud.

```
qodana_cloud_projects()
```

#### qodana_cloud_reports

List reports for a Cloud project.

```
qodana_cloud_reports({
  projectId: "project-uuid",
  limit: 10
})
```

#### qodana_cloud_problems

Get problems from a Cloud report.

```
qodana_cloud_problems({
  projectId: "project-uuid",
  reportId: "report-uuid",
  severity: "HIGH",
  limit: 50
})
```

## Supported Linters

| Linter | Languages |
|--------|-----------|
| `qodana-jvm-community` | Java, Kotlin (free) |
| `qodana-jvm` | Java, Kotlin (Ultimate) |
| `qodana-js` | JavaScript, TypeScript |
| `qodana-python-community` | Python (free) |
| `qodana-python` | Python (Ultimate) |
| `qodana-php` | PHP |
| `qodana-go` | Go |
| `qodana-rust` | Rust |
| `qodana-dotnet` | C#, .NET |
| `qodana-cpp` | C, C++ |
| `qodana-ruby` | Ruby |

## Example Workflow

### 1. Check Status

```
> qodana_status()

{
  "cli": { "available": true, "version": "2025.1.0" },
  "cloud": { "configured": true }
}
```

### 2. Detect Linter

```
> qodana_detect({ projectDir: "/my/project" })

{
  "detectedLinter": "qodana-js",
  "recommendation": "Use: qodana scan --linter qodana-js"
}
```

### 3. Run Scan

```
> qodana_scan({ projectDir: "/my/project" })

{
  "success": true,
  "summary": {
    "total": 42,
    "critical": 0,
    "high": 3,
    "moderate": 15,
    "low": 24
  },
  "topProblems": [...]
}
```

### 4. Filter Problems

```
> qodana_problems({ projectDir: "/my/project", severity: "HIGH" })

{
  "count": 3,
  "problems": [
    {
      "severity": "HIGH",
      "type": "SqlInjection",
      "message": "Possible SQL injection",
      "file": "src/db.ts",
      "line": 42
    }
  ]
}
```

### 5. Create Baseline

```
> qodana_baseline({ projectDir: "/my/project" })

{
  "success": true,
  "problemCount": 42,
  "baselinePath": "/my/project/qodana.baseline.json"
}
```

## Integration with --review-hard

This server is designed to work with the `--review-hard` workflow:

1. **After code changes**: Run `qodana_scan` to catch issues
2. **Before PR**: Use `qodana_problems` to ensure no HIGH/CRITICAL issues
3. **Baseline management**: Create baselines for legacy code

Example in CLAUDE.md:

```markdown
## Review Process

When using --review-hard:
1. Run Qodana scan: `qodana_scan({ projectDir: "." })`
2. Fix any HIGH or CRITICAL issues
3. Run Gemini review for architectural feedback
4. Address all findings before marking complete
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `QODANA_TOKEN` | Qodana Cloud API token | For Cloud features |

## License

MIT
