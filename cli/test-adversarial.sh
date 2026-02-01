#!/bin/bash
# Test adversarial-review phase in isolation

cd "${1:-.}"

claude --dangerously-skip-permissions \
  --allowedTools Bash Read Write Edit Glob Grep \
  --allowedTools mcp__gemini-reviewer__gemini_review \
  --allowedTools mcp__qodana__qodana_scan \
  --allowedTools mcp__qodana__qodana_problems \
  -p "Perform adversarial review of this codebase.

## REQUIRED: Call these MCP tools

1. Call gemini_review:
   mcp__gemini-reviewer__gemini_review({ code: '<main code>', focus: 'security' })

2. Call qodana_scan:
   mcp__qodana__qodana_scan({ projectDir: '.' })
   mcp__qodana__qodana_problems({ projectDir: '.', severity: 'HIGH' })

If a tool is not available, note it and continue.

## OUTPUT (Required)
EXTERNAL_REVIEWS:
Gemini: [ran/not available]
Qodana: [ran/not available]

REVIEW_ISSUES: N
"
