#!/bin/bash
#
# Reset experiment directory, keeping only PRD.md
# Usage: cc-reset [directory]
#

set -e

TARGET_DIR="${1:-.}"
cd "$TARGET_DIR"

if [ ! -f PRD.md ]; then
  echo "Error: No PRD.md found in $(pwd)"
  echo "This script resets experiment directories that contain a PRD.md"
  exit 1
fi

echo "Resetting $(pwd)..."

# Save PRD
cp PRD.md /tmp/PRD.md.bak

# Remove everything except PRD (we'll copy the script back if needed)
find . -mindepth 1 -maxdepth 1 ! -name 'PRD.md' -exec rm -rf {} +

# Restore PRD (in case it got deleted)
cp /tmp/PRD.md.bak PRD.md

# Reset PRD checkboxes to unchecked
sed -i.bak 's/- \[x\]/- [ ]/g' PRD.md
rm -f PRD.md.bak

# Reinit git
git init
git add PRD.md
git commit -m "Initial commit" 2>/dev/null || true

echo "Done. PRD.md reset with $(grep -c '\[ \]' PRD.md) unchecked items."
