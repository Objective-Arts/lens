#!/usr/bin/env bash
# normalize-skills.sh
#
# Makes workflow-skills/ the single source of truth.
# Replaces all copied skill directories in .claude/skills/ with symlinks.
# Also moves ai-smell-review into workflow-skills/ and removes the java canon symlink.
#
# Run from the lens repo root:
#   bash scripts/normalize-skills.sh
#
# Compatible with Bash 3 (macOS default).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/.claude/skills"
WF_DIR="$REPO_ROOT/workflow-skills"

echo "Normalizing .claude/skills/ → symlinks to workflow-skills/"
echo "Repo root: $REPO_ROOT"
echo ""

replace_with_symlink() {
  local skill="$1"
  local target="$2"
  local reason="$3"

  if [ -d "$SKILLS_DIR/$skill" ] && [ ! -L "$SKILLS_DIR/$skill" ]; then
    echo "REPLACE  $skill → workflow-skills/$target  ($reason)"
    rm -rf "$SKILLS_DIR/$skill"
    ln -s "../../workflow-skills/$target" "$SKILLS_DIR/$skill"
  elif [ -L "$SKILLS_DIR/$skill" ]; then
    echo "SKIP     $skill  (already a symlink)"
  fi
}

# --- Step 1: Move ai-smell-review into workflow-skills (it has no counterpart) ---
if [ -d "$SKILLS_DIR/ai-smell-review" ] && [ ! -L "$SKILLS_DIR/ai-smell-review" ]; then
  if [ ! -d "$WF_DIR/utils/ai-smell-review" ]; then
    echo "MOVE     ai-smell-review → workflow-skills/utils/ai-smell-review"
    cp -r "$SKILLS_DIR/ai-smell-review" "$WF_DIR/utils/ai-smell-review"
  else
    echo "SKIP     ai-smell-review already exists in workflow-skills/utils/"
  fi
fi

# --- Step 2: Replace real directories with symlinks ---

# Identical copies (these matched workflow-skills exactly)
replace_with_symlink "change"        "workflow/change"        "was identical copy"
replace_with_symlink "fix"           "workflow/fix"           "was identical copy"
replace_with_symlink "generate-docs" "utils/generate-docs"    "was identical copy"

# Diverged copies (workflow-skills version wins)
replace_with_symlink "build"         "workflow/build"         "workflow-skills wins"
replace_with_symlink "improve"       "workflow/improve"       "workflow-skills wins"
replace_with_symlink "ai-smell-scan" "utils/ai-smell-scan"    "workflow-skills wins"
replace_with_symlink "lens"          "utils/lens"             "workflow-skills wins"

# ai-smell-review (just moved to workflow-skills in step 1)
replace_with_symlink "ai-smell-review" "utils/ai-smell-review" "moved to workflow-skills"

# --- Step 3: Remove java canon symlink (it's not a skill) ---
if [ -L "$SKILLS_DIR/java" ]; then
  echo "REMOVE   java  (canon reference, not a skill)"
  rm "$SKILLS_DIR/java"
fi

# --- Step 4: Verify ---
echo ""
echo "Final state of .claude/skills/:"
echo ""
for entry in "$SKILLS_DIR"/*/; do
  name=$(basename "$entry")
  if [ -L "${entry%/}" ]; then
    target=$(readlink "${entry%/}")
    echo "  ✓ $name → $target"
  else
    echo "  ✗ $name  (NOT a symlink — needs attention)"
  fi
done

echo ""
echo "Done. All skills now symlink to workflow-skills/."
