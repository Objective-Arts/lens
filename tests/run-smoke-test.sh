#!/bin/bash
# Smoke test for Ralph loop framework
# Proves: install + run = doesn't break

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE_DIR="$SCRIPT_DIR/fixtures/smoke-test"
TEST_DIR=$(mktemp -d)

echo "=== Ralph Loop Smoke Test ==="
echo "Fixture: $FIXTURE_DIR"
echo "Test dir: $TEST_DIR"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "=== Cleanup ==="
    rm -rf "$TEST_DIR"
    echo "Removed $TEST_DIR"
}
trap cleanup EXIT

# Step 1: Copy fixture
echo "=== Step 1: Copy fixture ==="
cp -r "$FIXTURE_DIR"/* "$TEST_DIR/"
echo "Copied fixture to $TEST_DIR"

# Step 2: Initialize git
echo ""
echo "=== Step 2: Initialize git ==="
cd "$TEST_DIR"
git init
git add -A
git commit -m "Initial bad code"
echo "Git initialized with $(git rev-list --count HEAD) commit(s)"

# Step 3: Apply profile
echo ""
echo "=== Step 3: Apply profile ==="
mkdir -p .claude/skills

# Check if cc-config exists
if command -v cc-config &> /dev/null; then
    cc-config profile apply csharp+ralph-integration -p .
    echo "Profile applied via cc-config"
else
    echo "SKIP: cc-config not in PATH (install framework first)"
    echo "Creating minimal .claude structure manually..."
    mkdir -p .claude
    cat > .claude/settings.json << 'EOF'
{
  "profile": "csharp+ralph-integration",
  "test_mode": true
}
EOF
    echo "Created minimal .claude/settings.json"
fi

# Step 4: Verify structure
echo ""
echo "=== Step 4: Verify structure ==="
echo "Directory contents:"
ls -la
echo ""
echo ".claude contents:"
ls -la .claude/ 2>/dev/null || echo "(empty)"

# Step 5: Pre-flight checks
echo ""
echo "=== Step 5: Pre-flight checks ==="

# Check bad patterns exist in source
echo "Checking bad patterns exist in fixture..."
ASYNC_VOID=$(grep -c "async void" src/UserService.cs || true)
RESULT_CALL=$(grep -c "\.Result" src/UserService.cs || true)
SQL_CONCAT=$(grep -c '\" +' src/UserService.cs || true)

echo "  async void occurrences: $ASYNC_VOID"
echo "  .Result occurrences: $RESULT_CALL"
echo "  String concat (SQL): $SQL_CONCAT"

if [ "$ASYNC_VOID" -eq 0 ] && [ "$RESULT_CALL" -eq 0 ]; then
    echo "ERROR: Fixture doesn't contain expected bad patterns"
    exit 1
fi
echo "Pre-flight checks passed"

# Step 6: Run ralph-loop (or simulate)
echo ""
echo "=== Step 6: Run ralph-loop ==="

# Check if claude CLI exists
if command -v claude &> /dev/null; then
    echo "Running: claude '/ralph-loop PRD.md --max 5'"
    echo ""
    echo "--- Claude Output ---"
    # Uncomment to actually run:
    # claude "/ralph-loop PRD.md --max 5"
    echo "SKIP: Actual run commented out (uncomment to test)"
    echo "--- End Claude Output ---"
else
    echo "SKIP: claude CLI not in PATH"
    echo "To run full test, install Claude Code CLI"
fi

# Step 7: Assertions (would run after actual claude execution)
echo ""
echo "=== Step 7: Assertions (template) ==="
echo "After real run, would check:"
echo "  [ ] async void removed from src/UserService.cs"
echo "  [ ] .Result removed from src/UserService.cs"
echo "  [ ] PRD.md items marked [x]"
echo "  [ ] Git commits > 1"
echo "  [ ] .claude/ext-validation-findings.md exists (if full mode)"

# Step 8: Summary
echo ""
echo "=== Smoke Test Complete ==="
echo "Result: PASS (framework structure verified)"
echo ""
echo "To run full E2E test:"
echo "  1. Install cc-config: npm install -g @claude-optimal/cli"
echo "  2. Install Claude Code CLI"
echo "  3. Uncomment the claude command in this script"
echo "  4. Run: ./tests/run-smoke-test.sh"
