#!/bin/bash
# Install gemini-reviewer to cc-config registry

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGISTRY_DIR="$HOME/.claude/mcp-registry/servers"

# Create registry directory if needed
mkdir -p "$REGISTRY_DIR"

# Copy registry definition, replacing path placeholder
sed "s|\${MCP_SERVER_PATH}|$SCRIPT_DIR|g" "$SCRIPT_DIR/registry.yaml" > "$REGISTRY_DIR/gemini-reviewer.yaml"

echo "✓ Installed gemini-reviewer to registry"
echo ""
echo "Next steps:"
echo "  1. Set your API key:  export GEMINI_API_KEY='your-key-here'"
echo "     (add to ~/.zshrc or ~/.bashrc for persistence)"
echo ""
echo "  2. Install and enable:"
echo "     cc-config mcp install gemini-reviewer"
echo "     cc-config mcp enable gemini-reviewer"
echo ""
echo "  3. Restart Claude Code"
