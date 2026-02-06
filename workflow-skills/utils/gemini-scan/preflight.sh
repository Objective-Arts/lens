#!/bin/bash
# Hard gate: verify Gemini MCP prerequisites before scan
# Exit 0 = ready, Exit 1 = not ready (with diagnostics)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"

errors=0

# Check 1: .mcp.json exists and has gemini-reviewer
if [ ! -f "$MCP_CONFIG" ]; then
  echo "FAIL: No .mcp.json found at $MCP_CONFIG"
  errors=$((errors + 1))
else
  if ! grep -q '"gemini-reviewer"' "$MCP_CONFIG" 2>/dev/null; then
    echo "FAIL: gemini-reviewer not configured in .mcp.json"
    errors=$((errors + 1))
  else
    # Check 2: configured binary exists
    server_path=$(python3 -c "
import json, sys
with open('$MCP_CONFIG') as f:
    cfg = json.load(f)
args = cfg.get('mcpServers',{}).get('gemini-reviewer',{}).get('args',[])
print(args[0] if args else '')
" 2>/dev/null)

    if [ -z "$server_path" ]; then
      echo "FAIL: Could not parse gemini-reviewer server path from .mcp.json"
      errors=$((errors + 1))
    elif [ ! -f "$server_path" ]; then
      echo "FAIL: Gemini MCP server binary not found: $server_path"
      echo "  .mcp.json points to a file that does not exist."
      echo "  Local server exists at: $PROJECT_ROOT/mcp-servers/gemini-reviewer/index.js"
      echo "  Fix: Update .mcp.json to point to the correct path"
      errors=$((errors + 1))
    else
      echo "OK: Gemini MCP server binary exists: $server_path"
    fi
  fi
fi

# Check 3: GEMINI_API_KEY is set (check .mcp.json env or shell env)
has_key=false
if [ -n "${GEMINI_API_KEY:-}" ]; then
  has_key=true
elif grep -q 'GEMINI_API_KEY' "$MCP_CONFIG" 2>/dev/null; then
  has_key=true
fi

if [ "$has_key" = true ]; then
  echo "OK: GEMINI_API_KEY configured"
else
  echo "FAIL: GEMINI_API_KEY not set in environment or .mcp.json"
  errors=$((errors + 1))
fi

# Verdict
echo ""
if [ $errors -gt 0 ]; then
  echo "PREFLIGHT FAILED: $errors issue(s) — cannot run gemini-scan"
  echo "Fix the issues above before running this skill."
  exit 1
else
  echo "PREFLIGHT PASSED: Gemini MCP ready"
  exit 0
fi
