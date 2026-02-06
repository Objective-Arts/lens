#!/bin/bash
# Hard gate: verify Qodana prerequisites before scan
# Exit 0 = ready, Exit 1 = not ready (with diagnostics)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"

errors=0
has_mcp=false
has_cli=false

# Check 1: Qodana MCP configured and binary exists
if [ -f "$MCP_CONFIG" ] && grep -q '"qodana"' "$MCP_CONFIG" 2>/dev/null; then
  server_path=$(python3 -c "
import json, sys
with open('$MCP_CONFIG') as f:
    cfg = json.load(f)
args = cfg.get('mcpServers',{}).get('qodana',{}).get('args',[])
print(args[0] if args else '')
" 2>/dev/null)

  if [ -n "$server_path" ] && [ -f "$server_path" ]; then
    echo "OK: Qodana MCP server binary exists: $server_path"
    has_mcp=true
  else
    echo "WARN: Qodana MCP configured but binary not found: ${server_path:-unknown}"
    echo "  Local server exists at: $PROJECT_ROOT/mcp-servers/qodana/dist/index.js"
    echo "  Fix: Update .mcp.json to point to the correct path"
  fi
else
  echo "WARN: Qodana MCP not configured in .mcp.json"
fi

# Check 2: Qodana CLI available
if command -v qodana &>/dev/null; then
  echo "OK: Qodana CLI found: $(which qodana)"
  has_cli=true
else
  echo "WARN: Qodana CLI not in PATH"
fi

# Check 3: Docker available (needed for CLI mode)
if [ "$has_cli" = true ]; then
  if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
    echo "OK: Docker is running"
  else
    echo "WARN: Docker not available (needed for Qodana CLI)"
    has_cli=false
  fi
fi

# Verdict
echo ""
if [ "$has_mcp" = true ] || [ "$has_cli" = true ]; then
  echo "PREFLIGHT PASSED: Qodana available via $([ "$has_mcp" = true ] && echo 'MCP')$([ "$has_mcp" = true ] && [ "$has_cli" = true ] && echo ' + ')$([ "$has_cli" = true ] && echo 'CLI')"
  exit 0
else
  echo "PREFLIGHT FAILED: Neither Qodana MCP nor CLI is available"
  echo "Fix: Either update .mcp.json with correct Qodana path, or install Qodana CLI + Docker"
  exit 1
fi
