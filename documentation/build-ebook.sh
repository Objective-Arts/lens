#!/bin/bash
# Build Lens documentation as Kindle ebook
# Requires: pandoc (installed), calibre (optional, for .mobi)

set -e

OUTPUT_DIR="$(dirname "$0")"
EPUB_FILE="$OUTPUT_DIR/lens-guide.epub"
MOBI_FILE="$OUTPUT_DIR/lens-guide.mobi"

# Ordered list of chapters (excluding enterprise proposal)
# Workflow skills emphasized first, ralph-loop at the end
CHAPTERS=(
  "PROJECT-OVERVIEW.md"
  "index.md"

  # Getting Started & Workflow Skills
  "tutorials/getting-started.md"
  "WORKFLOW-SKILLS.md"
  "tutorials/adding-canon-skill.md"

  # How-To: Core Workflows
  "how-to/install-from-github-packages.md"
  "how-to/apply-profile.md"
  "how-to/use-quality-flags.md"
  "how-to/external-validation.md"

  # Reference
  "reference/installation.md"
  "reference/profiles.md"
  "reference/canon-catalog.md"
  "reference/canon-loading-strategy.md"
  "reference/structural-standards.md"
  "reference/hooks.md"
  "reference/flags.md"
  "reference/patterns.md"
  "reference/api-design-standards.md"
  "reference/framework-templates.md"
  "reference/sample-claude-md.md"

  # Explanation
  "explanation/why-expert-skills.md"
  "explanation/two-tier-review.md"
  "explanation/how-skills-load.md"

  # Autonomous Mode (Ralph Loop) - at the end
  "tutorials/ralph-loop-basics.md"
  "how-to/configure-ralph-loop.md"
)

cd "$OUTPUT_DIR"

# Strip YAML frontmatter and confidential notice
strip_confidential() {
  awk 'BEGIN{f=0;d=0} /^---$/{if(d<2){f=1-f;d++;next}} f{next} /CONFIDENTIAL/{next} /unauthorized/{next} {print}' "$1"
}

# Create temp directory for processed files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Process each chapter
PROCESSED_FILES=()
for chapter in "${CHAPTERS[@]}"; do
  if [ -f "$chapter" ]; then
    outfile="$TEMP_DIR/$(basename "$chapter")"
    strip_confidential "$chapter" > "$outfile"
    PROCESSED_FILES+=("$outfile")
    echo "  + $chapter"
  else
    echo "  - $chapter (not found, skipping)"
  fi
done

echo ""
echo "Building EPUB..."

pandoc \
  --from=markdown \
  --to=epub3 \
  --output="$EPUB_FILE" \
  --metadata title="Lens" \
  --metadata subtitle="AI Assisted Development That Builds In Quality" \
  --metadata author="Objective Arts LLC" \
  --toc \
  --toc-depth=2 \
  --split-level=1 \
  "${PROCESSED_FILES[@]}"

echo "Created: $EPUB_FILE"

# Convert to MOBI if Calibre is available
if command -v ebook-convert &> /dev/null; then
  echo ""
  echo "Building MOBI (Kindle)..."
  ebook-convert "$EPUB_FILE" "$MOBI_FILE" --no-inline-toc 2>/dev/null
  echo "Created: $MOBI_FILE"
else
  echo ""
  echo "To create .mobi for Kindle, install Calibre:"
  echo "  brew install calibre"
  echo "Then run: ebook-convert $EPUB_FILE $MOBI_FILE"
fi

echo ""
echo "Done. Transfer to Kindle via USB or email to your Kindle address."
