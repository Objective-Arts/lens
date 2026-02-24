#!/usr/bin/env bash
set -euo pipefail

# ── Pipeline Orchestrator ──────────────────────────────────────────────
# Spawns one `claude -p` session per phase. Each phase gets a full
# context window. File-based handoff via .claude/build-log/.
#
# Usage:
#   pipeline.sh build <target> [--from N|name] [--rollback] [--dry-run]
#   pipeline.sh improve <target> [--from N|name] [--rollback] [--dry-run]
# ───────────────────────────────────────────────────────────────────────

# ── Constants ──────────────────────────────
BUILD_LOG=".claude/build-log"
STATE_FILE="$BUILD_LOG/build-state.json"
MAX_RETRIES=3
MAX_IMPL=5
MAX_EVAL=3
MAX_CANARY=2
MAX_QG=2

# ── Color output ───────────────────────────
if [[ -t 1 ]]; then
  BOLD='\033[1m'
  CYAN='\033[1;36m'
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  RESET='\033[0m'
else
  BOLD='' CYAN='' GREEN='' RED='' YELLOW='' BLUE='' RESET=''
fi

color_phase() { printf "${CYAN}[Phase %s] %s${RESET}\n" "$1" "$2"; }
color_ok()    { printf "${GREEN}  ✓ %s${RESET}\n" "$1"; }
color_fail()  { printf "${RED}  ✗ %s${RESET}\n" "$1" >&2; }
color_warn()  { printf "${YELLOW}  ⚠ %s${RESET}\n" "$1"; }
color_info()  { printf "${BLUE}  · %s${RESET}\n" "$1"; }

# ── Utility ────────────────────────────────
iso_now() { date -u +%Y-%m-%dT%H:%M:%SZ; }

realpath_portable() {
  python3 -c "import os; print(os.path.realpath('$1'))" 2>/dev/null || echo "$1"
}

elapsed_since() {
  local start_epoch="$1"
  local now_epoch
  now_epoch=$(date +%s)
  echo $(( now_epoch - start_epoch ))
}

# ── Dependency check ───────────────────────
check_deps() {
  local missing=()
  for cmd in jq claude node npm; do
    if ! command -v "$cmd" &>/dev/null; then
      missing+=("$cmd")
    fi
  done
  # tsx via npx is fine
  if ! npx tsx --version &>/dev/null; then
    missing+=("tsx (via npx)")
  fi
  if [[ ${#missing[@]} -gt 0 ]]; then
    color_fail "Missing dependencies: ${missing[*]}"
    exit 1
  fi
}

# ── Skills path resolution ─────────────────
resolve_skills_path() {
  if [[ -n "${CC_WORKFLOW_SKILLS_PATH:-}" ]]; then
    echo "$CC_WORKFLOW_SKILLS_PATH"
    return
  fi
  if [[ -d "workflow-skills" ]]; then
    echo "workflow-skills"
    return
  fi
  # Follow .claude/skills/build symlink
  if [[ -L ".claude/skills/build" ]]; then
    local target
    target=$(realpath_portable ".claude/skills/build")
    # Go up from workflow-skills/workflow/build to workflow-skills
    echo "$(dirname "$(dirname "$target")")"
    return
  fi
  color_fail "Cannot find workflow-skills directory"
  exit 1
}

# ── State management ───────────────────────
init_state() {
  local target="$1" mode="$2"
  mkdir -p "$BUILD_LOG"
  jq -n \
    --arg target "$target" \
    --arg mode "$mode" \
    --arg started "$(iso_now)" \
    '{
      target: $target,
      mode: $mode,
      startedAt: $started,
      currentPhase: 0,
      stashRef: null,
      phaseResults: {},
      scores: {}
    }' > "$STATE_FILE"
}

update_state() {
  local expr="$1"
  local tmp="${STATE_FILE}.tmp"
  jq "$expr" "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

read_state() {
  jq -r "$1" "$STATE_FILE" 2>/dev/null || echo ""
}

# ── Phase name/number mapping ──────────────
# Build: 0-8, Improve: 1-8
phase_name_to_num() {
  case "$1" in
    reference)      echo 0 ;;
    plan)           echo 1 ;;
    structure)      echo 2 ;;
    implementation) echo 3 ;;
    refactoring)    echo 4 ;;
    deduplication)  echo 5 ;;
    review)         echo 6 ;;
    testing)        echo 7 ;;
    evaluation)     echo 8 ;;
    *)
      if [[ "$1" =~ ^[0-8]$ ]]; then
        echo "$1"
      else
        color_fail "Unknown phase: $1"
        # Return error so caller can detect (subshell exit won't propagate)
        return 1
      fi
      ;;
  esac
}

phase_num_to_name() {
  case "$1" in
    0) echo "reference" ;;
    1) echo "plan" ;;
    2) echo "structure" ;;
    3) echo "implementation" ;;
    4) echo "refactoring" ;;
    5) echo "deduplication" ;;
    6) echo "review" ;;
    7) echo "testing" ;;
    8) echo "evaluation" ;;
  esac
}

phase_num_to_model() {
  case "$1" in
    0) echo "opus" ;;
    1) echo "sonnet" ;;
    2) echo "sonnet" ;;
    3) echo "opus" ;;
    4) echo "sonnet" ;;
    5) echo "haiku" ;;
    6) echo "sonnet" ;;
    7) echo "sonnet" ;;
    8) echo "sonnet" ;;
  esac
}

phase_num_to_marker() {
  case "$1" in
    0) echo "REFERENCE_COMPLETE" ;;
    1) echo "PLAN_COMPLETE" ;;
    2) echo "STRUCTURE_COMPLETE" ;;
    3) echo "IMPLEMENTATION_COMPLETE" ;;
    4) echo "REFACTORING_COMPLETE" ;;
    5) echo "DEDUPLICATION_COMPLETE" ;;
    6) echo "REVIEW_COMPLETE" ;;
    7) echo "TESTING_COMPLETE" ;;
    8) echo "EVALUATION_COMPLETE" ;;
  esac
}

# ── Argument parsing ───────────────────────
parse_args() {
  MODE=""
  TARGET=""
  PRD_FILE=""
  DESC=""
  FROM_PHASE=""
  DRY_RUN=false
  ROLLBACK=false

  if [[ $# -lt 1 ]]; then
    usage
    exit 1
  fi

  MODE="$1"; shift

  if [[ "$MODE" != "build" && "$MODE" != "improve" ]]; then
    color_fail "Mode must be 'build' or 'improve', got: $MODE"
    exit 1
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --from)
        shift
        FROM_PHASE=$(phase_name_to_num "$1") || exit 1
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --prd)
        shift
        PRD_FILE="$1"
        shift
        ;;
      --desc)
        shift
        DESC="$1"
        shift
        ;;
      --rollback)
        ROLLBACK=true
        shift
        ;;
      -*)
        color_fail "Unknown flag: $1"
        exit 1
        ;;
      *)
        if [[ -z "$TARGET" ]]; then
          TARGET="$1"
        else
          color_fail "Unexpected argument: $1"
          exit 1
        fi
        shift
        ;;
    esac
  done

  if [[ "$ROLLBACK" == true ]]; then
    return 0
  fi

  if [[ -z "$TARGET" ]]; then
    color_fail "Target path or description required"
    usage
    exit 1
  fi

  # If TARGET is not a path on disk, treat it as a description
  if [[ ! -e "$TARGET" && -z "$DESC" ]]; then
    DESC="$TARGET"
    TARGET="."
    color_info "No path found — using current directory, description: $DESC"
  fi

  if [[ -n "$PRD_FILE" ]]; then
    if [[ "$MODE" != "build" ]]; then
      color_fail "--prd is only valid with build mode"
      exit 1
    fi
    if [[ ! -f "$PRD_FILE" ]]; then
      color_fail "PRD file not found: $PRD_FILE"
      exit 1
    fi
  fi
}

usage() {
  cat <<'EOF'
Usage:
  pipeline.sh build <target|"description"> [--prd FILE] [--desc "..."] [--from N|name] [--rollback] [--dry-run]
  pipeline.sh improve <target|"description"> [--desc "..."] [--from N|name] [--rollback] [--dry-run]

  If the argument is not a path on disk, it is treated as a task description
  and the current directory is used as the target.

Options:
  --prd FILE      PRD document for phase 0 (build only, target = output path)
  --desc "..."    Description of what to build/improve (injected into all phases)
  --from N|name   Resume from phase N (number or name)
  --dry-run       Show phase table and exit
  --rollback      Restore from last stash

Phases: reference(0) plan(1) structure(2) implementation(3) refactoring(4)
        deduplication(5) review(6) testing(7) evaluation(8)
EOF
}

# ── Claude invocation ──────────────────────
run_claude() {
  local prompt="$1"
  local model="$2"
  local output="$3"
  local tools="${4:-Bash Read Write Edit Glob Grep}"
  local stderr_file="${output%.txt}-stderr.txt"

  color_info "Invoking claude (model: $model)"

  claude --dangerously-skip-permissions \
    --no-session-persistence \
    --model "$model" \
    --allowedTools "$tools" \
    -p "$prompt" \
    > "$output" 2>"$stderr_file"

  return $?
}

check_gate() {
  local output_file="$1"
  local marker="$2"
  grep -q "$marker" "$output_file" 2>/dev/null
}

extract_summary() {
  local output_file="$1"
  local marker="$2"
  # Get the line after the marker
  awk -v m="$marker" 'found {print; exit} $0 ~ m {found=1}' "$output_file" 2>/dev/null || echo "(no summary)"
}

# ── Prompt builders ────────────────────────
build_standard_prompt() {
  local phase_num="$1"
  local skill="$2"
  local marker="$3"
  local mode_context=""

  if [[ "$MODE" == "build" ]]; then
    case "$phase_num" in
      1) mode_context="You are planning HARDENING work against a reference implementation that Opus already built. The code exists. Plan what needs to be improved, hardened, and fixed — not what needs to be created." ;;
      2) mode_context="You are IMPROVING the structure of a reference implementation that Opus already built. Analyze the architecture and improve it — assign quality contract types, fix boundaries, restructure where needed." ;;
      *) mode_context="" ;;
    esac
  else
    mode_context="This is an IMPROVEMENT workflow on existing code. Focus on analysis, refactoring, and enhancement rather than greenfield creation."
  fi

  local desc_context=""
  if [[ -n "$DESC" ]]; then
    desc_context="TASK: ${DESC}
"
  fi

  cat <<PROMPT
Read the skill file at ${SKILLS_PATH}/workflow/${skill}/SKILL.md
and execute ALL of its instructions against: ${TARGET}

${desc_context}${mode_context}

Follow every step in the skill. Do not skip any steps.

OUTPUT RULES:
Write your full detailed output to .claude/build-log/phase-${phase_num}-${skill}.md
Your final message MUST contain ONLY:
  1. ${marker} on its own line
  2. A single summary line
Do NOT return your full work log — the orchestrator reads the file when needed.
PROMPT
}

build_phase3_prompt() {
  local remaining_context="${1:-}"

  local mode_context=""
  if [[ "$MODE" == "build" ]]; then
    mode_context=""
  else
    mode_context="This is an IMPROVEMENT workflow on existing code. Focus on analysis, refactoring, and enhancement rather than greenfield creation."
  fi

  local desc_context=""
  if [[ -n "$DESC" ]]; then
    desc_context="TASK: ${DESC}
"
  fi

  cat <<PROMPT
Read the skill file at ${SKILLS_PATH}/workflow/implementation/SKILL.md
and execute ALL of its instructions against: ${TARGET}

${desc_context}${mode_context}

IMPORTANT: Follow the compile loop. For each unit: refresh the relevant
canon principle, write the code, then compile-check before starting the
next unit. Do not write all code first and check later.

${remaining_context}

QUALITY GATE RULES — the gate runs immediately after this phase.
Every violation below causes a pipeline failure and a retry:

  SECURITY (instant fail):
  - No hardcoded secrets (API keys, passwords, tokens, private keys)
  - No exec()/execSync() with template literals — use spawn() with args
  - No path.join/resolve with user input without traversal validation
  - No eval(), innerHTML assignment, or document.write()

  NAMING:
  - No parameters named: data, info, result, item, obj, val, tmp, temp, ret, res
  - No single-letter parameters (except _, i, j, k, e)
  - No exported functions shorter than 4 characters
  - No files named: utils.ts, helpers.ts, misc.ts, common.ts, shared.ts

  SIZE LIMITS:
  - Functions: max 30 significant lines
  - Files: max 300 lines
  - Parameters per function: max 4
  - Exports per file: max 10 (index.ts exempt)

  CODE QUALITY:
  - No magic numbers (except -1, 0, 1, 2) — extract to named constants
  - No magic strings in conditionals — extract to constants
  - No circular imports
  - No empty catch/except/rescue blocks
  - Types/interfaces must appear before functions in each file

Follow every step in the skill. Do not skip any steps.

OUTPUT RULES:
Write your full detailed output to .claude/build-log/phase-3-implementation.md
Your final message MUST contain ONLY:
  1. IMPLEMENTATION_COMPLETE (or IMPLEMENTATION_PARTIAL) on its own line
  2. A single summary line
Do NOT return your full work log — the orchestrator reads the file when needed.
PROMPT
}

# ── Phase runners ──────────────────────────

run_phase_0() {
  color_phase 0 "reference (opus)"
  local output="$BUILD_LOG/phase-0-output.txt"

  local prd_instruction=""
  if [[ -n "$PRD_FILE" ]]; then
    prd_instruction="Read the PRD document at ${PRD_FILE} for full requirements.
Build the implementation into: ${TARGET}"
  elif [[ -n "$DESC" ]]; then
    prd_instruction="TASK: ${DESC}
Build the implementation into: ${TARGET}"
  else
    prd_instruction="PRD / Feature description: ${TARGET}"
  fi

  local prompt
  prompt=$(cat <<PROMPT
You are building a reference implementation from a PRD.

Build the feature described below. Focus on feature richness and
completeness. Do not worry about hardening — that comes later.

${prd_instruction}

Write the code. Make it work. Make it feature-complete.

OUTPUT RULES:
Write a summary of what you built to .claude/build-log/phase-0-reference.md
Your final message MUST contain ONLY:
  1. REFERENCE_COMPLETE on its own line
  2. A single summary line (e.g. "Built 4 files: auth module with login, logout, session management")
Do NOT return your full work log — the orchestrator reads the file when needed.
PROMPT
)

  local start_epoch
  start_epoch=$(date +%s)

  for attempt in $(seq 1 $MAX_RETRIES); do
    run_claude "$prompt" opus "$output" || true
    if check_gate "$output" "REFERENCE_COMPLETE"; then
      local summary duration
      summary=$(extract_summary "$output" "REFERENCE_COMPLETE")
      duration=$(elapsed_since "$start_epoch")
      update_state ".currentPhase = 0 | .phaseResults.\"phase-0\" = {status: \"complete\", summary: \"$summary\", duration: $duration}"
      color_ok "Reference complete — $summary"
      return 0
    fi
    color_warn "Attempt $attempt/$MAX_RETRIES — marker not found, retrying"
  done
  color_fail "Phase 0 failed after $MAX_RETRIES attempts"
  exit 1
}

run_standard_phase() {
  local phase_num="$1"
  local skill="$2"
  local model="$3"
  local marker="$4"
  local output="$BUILD_LOG/phase-${phase_num}-output.txt"

  color_phase "$phase_num" "$skill ($model)"

  local prompt
  prompt=$(build_standard_prompt "$phase_num" "$skill" "$marker")

  local start_epoch
  start_epoch=$(date +%s)

  for attempt in $(seq 1 $MAX_RETRIES); do
    run_claude "$prompt" "$model" "$output" || true
    if check_gate "$output" "$marker"; then
      local summary duration
      summary=$(extract_summary "$output" "$marker")
      duration=$(elapsed_since "$start_epoch")
      update_state ".currentPhase = ${phase_num} | .phaseResults.\"phase-${phase_num}\" = {status: \"complete\", summary: \"$summary\", duration: $duration}"
      color_ok "$(phase_num_to_name "$phase_num") complete — $summary"
      return 0
    fi
    color_warn "Attempt $attempt/$MAX_RETRIES — marker not found, retrying"
  done
  color_fail "Phase $phase_num ($skill) failed after $MAX_RETRIES attempts"
  exit 1
}

run_phase_3_loop() {
  color_phase 3 "implementation (opus)"
  local output="$BUILD_LOG/phase-3-output.txt"
  local start_epoch
  start_epoch=$(date +%s)

  local remaining_context=""
  for i in $(seq 1 $MAX_IMPL); do
    color_info "Implementation iteration $i/$MAX_IMPL"
    local prompt
    prompt=$(build_phase3_prompt "$remaining_context")

    for attempt in $(seq 1 $MAX_RETRIES); do
      run_claude "$prompt" opus "$output" || true
      if check_gate "$output" "IMPLEMENTATION_COMPLETE"; then
        local summary duration
        summary=$(extract_summary "$output" "IMPLEMENTATION_COMPLETE")
        duration=$(elapsed_since "$start_epoch")
        update_state ".currentPhase = 3 | .phaseResults.\"phase-3\" = {status: \"complete\", summary: \"$summary\", duration: $duration}"
        color_ok "Implementation complete — $summary"
        return 0
      fi
      if check_gate "$output" "IMPLEMENTATION_PARTIAL"; then
        local summary
        summary=$(extract_summary "$output" "IMPLEMENTATION_PARTIAL")
        color_warn "Partial — $summary"
        remaining_context="CONTINUATION: Previous iteration was partial. Target remaining items only. Previous summary: $summary"
        break
      fi
      color_warn "Gate attempt $attempt/$MAX_RETRIES — no marker found"
    done
  done

  # Exhausted implementation iterations — ask user
  color_warn "Implementation did not complete after $MAX_IMPL iterations"
  printf "Continue? [y/N] "
  read -r answer
  if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    # One more attempt
    local prompt
    prompt=$(build_phase3_prompt "$remaining_context")
    run_claude "$prompt" opus "$output" || true
    if check_gate "$output" "IMPLEMENTATION_COMPLETE"; then
      local summary duration
      summary=$(extract_summary "$output" "IMPLEMENTATION_COMPLETE")
      duration=$(elapsed_since "$start_epoch")
      update_state ".currentPhase = 3 | .phaseResults.\"phase-3\" = {status: \"complete\", summary: \"$summary\", duration: $duration}"
      color_ok "Implementation complete — $summary"
      return 0
    fi
  fi
  color_fail "Implementation phase incomplete"
  exit 1
}

run_quality_gate() {
  local target="$1"
  local label="${2:-quality gate}"
  color_info "Running $label"
  if npx tsx .claude/scripts/quality-gate.ts "$target" 2>&1; then
    color_ok "$label passed"
    return 0
  else
    return 1
  fi
}

run_phase_3_with_gate() {
  run_phase_3_loop

  for qg_attempt in $(seq 1 $MAX_QG); do
    if run_quality_gate "$TARGET" "quality gate (post-implementation)"; then
      return 0
    fi
    color_warn "Quality gate failed — re-running phase 3 with errors (attempt $qg_attempt/$MAX_QG)"
    local gate_errors
    gate_errors=$(npx tsx .claude/scripts/quality-gate.ts "$TARGET" 2>&1 || true)
    local output="$BUILD_LOG/phase-3-output.txt"
    local fix_prompt
    fix_prompt=$(cat <<PROMPT
Read the skill file at ${SKILLS_PATH}/workflow/implementation/SKILL.md
and execute ALL of its instructions against: ${TARGET}

QUALITY GATE FAILED. Fix these errors:

${gate_errors}

OUTPUT RULES:
Write your full detailed output to .claude/build-log/phase-3-implementation.md
Your final message MUST contain ONLY:
  1. IMPLEMENTATION_COMPLETE on its own line
  2. A single summary line
Do NOT return your full work log.
PROMPT
)
    run_claude "$fix_prompt" opus "$output" || true
  done
  color_fail "Quality gate still failing after $MAX_QG fix attempts"
  exit 1
}

run_phase_6() {
  color_phase 6 "review (parallel scans)"
  local start_epoch
  start_epoch=$(date +%s)

  for canary_attempt in $(seq 1 $MAX_CANARY); do
    color_info "Review attempt $canary_attempt/$MAX_CANARY"

    # 6a. Insert canaries
    color_info "Inserting canaries"
    npx tsx .claude/scripts/quality-gate.ts insert-canaries review "$TARGET" 2>&1 || true

    # 6b. Parallel scans — 4 background processes
    color_info "Launching 4 parallel scans"

    local gemini_out="$BUILD_LOG/scan-gemini-output.txt"
    local codex_out="$BUILD_LOG/scan-codex-output.txt"
    local qodana_out="$BUILD_LOG/scan-qodana-output.txt"
    local smell_out="$BUILD_LOG/scan-ai-smell-output.txt"

    local gemini_prompt codex_prompt qodana_prompt smell_prompt

    gemini_prompt=$(cat <<PROMPT
Read the skill at ${SKILLS_PATH}/utils/gemini-scan/SKILL.md.
Execute against: ${TARGET}

Run Gemini TWICE:
1. focus: "general" — code quality, architecture, AI smells
2. focus: "security" — think like an attacker, find vulnerabilities

Combine findings from both passes. Write all findings to .claude/build-log/scan-gemini.md as:
[file:line] — description (severity)

OUTPUT RULES:
Your final message MUST contain ONLY:
  1. GEMINI_SCAN_DONE on its own line
  2. A single summary line (e.g. "7 findings")
Do NOT return findings in your message.
PROMPT
)

    codex_prompt=$(cat <<PROMPT
Read the skill at ${SKILLS_PATH}/utils/codex-scan/SKILL.md.
Execute against: ${TARGET}

Write all findings to .claude/build-log/scan-codex.md as:
[file:line] — description (category)

OUTPUT RULES:
Your final message MUST contain ONLY:
  1. CODEX_SCAN_DONE on its own line
  2. A single summary line (e.g. "4 findings")
Do NOT return findings in your message.
PROMPT
)

    qodana_prompt=$(cat <<PROMPT
Read the skill at ${SKILLS_PATH}/utils/qodana-scan/SKILL.md.
Execute against: ${TARGET}

Write all findings to .claude/build-log/scan-qodana.md as:
[file:line] — description (severity)

OUTPUT RULES:
Your final message MUST contain ONLY:
  1. QODANA_SCAN_DONE on its own line
  2. A single summary line (e.g. "3 findings")
Do NOT return findings in your message.
PROMPT
)

    smell_prompt=$(cat <<PROMPT
Read the skill at ${SKILLS_PATH}/utils/ai-smell-scan/SKILL.md.
Execute against: ${TARGET}

Write all findings to .claude/build-log/scan-ai-smell.md as:
[file:line] [smell type]: description

OUTPUT RULES:
Your final message MUST contain ONLY:
  1. AI_SMELL_SCAN_DONE on its own line
  2. A single summary line (e.g. "5 findings")
Do NOT return findings in your message.
PROMPT
)

    # Launch all 4 in background
    claude --dangerously-skip-permissions --no-session-persistence \
      --model sonnet \
      --allowedTools "Read Glob Grep mcp__gemini-reviewer__gemini_review" \
      -p "$gemini_prompt" \
      > "$gemini_out" 2>"${gemini_out%.txt}-stderr.txt" &
    local pid_gemini=$!

    claude --dangerously-skip-permissions --no-session-persistence \
      --model sonnet \
      --allowedTools "Bash Read Glob Grep Write" \
      -p "$codex_prompt" \
      > "$codex_out" 2>"${codex_out%.txt}-stderr.txt" &
    local pid_codex=$!

    claude --dangerously-skip-permissions --no-session-persistence \
      --model haiku \
      --allowedTools "Read Glob Grep Bash mcp__qodana__qodana_scan mcp__qodana__qodana_problems" \
      -p "$qodana_prompt" \
      > "$qodana_out" 2>"${qodana_out%.txt}-stderr.txt" &
    local pid_qodana=$!

    claude --dangerously-skip-permissions --no-session-persistence \
      --model haiku \
      --allowedTools "Read Glob Grep" \
      -p "$smell_prompt" \
      > "$smell_out" 2>"${smell_out%.txt}-stderr.txt" &
    local pid_smell=$!

    color_info "Waiting for scans to complete..."
    wait $pid_gemini $pid_codex $pid_qodana $pid_smell 2>/dev/null || true

    # Log scan results
    for scan in gemini codex qodana ai-smell; do
      if [[ -f "$BUILD_LOG/scan-${scan}-output.txt" ]]; then
        if grep -q "SCAN_DONE" "$BUILD_LOG/scan-${scan}-output.txt" 2>/dev/null; then
          color_ok "$scan scan complete"
        else
          color_warn "$scan scan — no completion marker"
        fi
      fi
    done

    # 6c. Deduplicate findings
    color_info "Deduplicating findings"
    local dedup_prompt
    dedup_prompt=$(cat <<PROMPT
Read these 4 scan result files:
- .claude/build-log/scan-gemini.md
- .claude/build-log/scan-codex.md
- .claude/build-log/scan-qodana.md
- .claude/build-log/scan-ai-smell.md

Some files may not exist or may be empty — that is fine, skip them.

Deduplicate the findings:
- Same file + line within 5 lines + similar description = one finding
- Keep the most specific description
- Write deduplicated findings to .claude/build-log/phase-6-review-findings.md

Format each finding as:
[file:line] — description (severity/category)

At the end, write:
DEDUP_DONE
N findings after deduplication
PROMPT
)
    local dedup_out="$BUILD_LOG/dedup-output.txt"
    run_claude "$dedup_prompt" haiku "$dedup_out" "Read Write Glob Grep" || true

    # 6d. Fix findings if any exist
    local findings_file="$BUILD_LOG/phase-6-review-findings.md"
    if [[ -s "$findings_file" ]]; then
      local finding_count
      finding_count=$(wc -l < "$findings_file" | tr -d ' ')
      color_info "Fixing $finding_count findings"

      local fix_prompt
      fix_prompt=$(cat <<PROMPT
Read the deduplicated findings from .claude/build-log/phase-6-review-findings.md
Fix these review findings in ${TARGET}.

SCOPE CONSTRAINT: Only modify code directly related to findings.
Do not refactor, rename, or restructure code that was not flagged.

COMPLEXITY BUDGET: Do not increase overall complexity. Net-zero or
net-negative lines/functions/types.
EXCEPTION: Security fixes are exempt.

NO SILENT FAILURES: Do not change a throw/crash to a log-and-continue.

Apply each fix. Run tests after.

OUTPUT RULES:
Write your detailed fix log to .claude/build-log/phase-6-review-fix.md
Your final message MUST contain ONLY:
  1. REVIEW_COMPLETE on its own line
  2. A single summary line (e.g. "Fixed 8 findings across 4 files")
Do NOT return your full work log.
PROMPT
)
      local fix_out="$BUILD_LOG/phase-6-fix-output.txt"
      run_claude "$fix_prompt" sonnet "$fix_out" || true
    else
      color_info "No findings — skipping fix"
    fi

    # 6e. Validate canaries
    color_info "Validating canaries"
    if npx tsx .claude/scripts/quality-gate.ts validate-canaries review "$TARGET" 2>&1; then
      local duration
      duration=$(elapsed_since "$start_epoch")
      update_state ".currentPhase = 6 | .phaseResults.\"phase-6\" = {status: \"complete\", summary: \"review complete\", duration: $duration}"
      color_ok "Review complete — canaries validated"
      return 0
    fi
    color_warn "Canary validation failed — retrying review"
  done

  # Canary retries exhausted — proceed anyway with warning
  color_warn "Canary validation failed after $MAX_CANARY attempts — proceeding"
  local duration
  duration=$(elapsed_since "$start_epoch")
  update_state ".currentPhase = 6 | .phaseResults.\"phase-6\" = {status: \"complete-with-warnings\", summary: \"review complete (canary validation failed)\", duration: $duration}"
}

run_phase_8() {
  color_phase 8 "evaluation"
  local start_epoch
  start_epoch=$(date +%s)

  # 8a. Prepare scorecard prompt
  color_info "Preparing scorecard"
  local prep_prompt
  prep_prompt=$(cat <<PROMPT
Read the evaluation skill at ${SKILLS_PATH}/workflow/evaluation/SKILL.md.
Extract the scorecard prompt template and the scoreboard format.

Read rubrics from .claude/rubric/ (all .md files in that directory).

Build the full scorecard command that uses Codex to score: ${TARGET}

Write the complete command to .claude/build-log/scorecard-prompt.txt
The command should:
1. Use codex CLI if available
2. Score 7 dimensions: Security, Structure, Error Handling, Naming, Complexity, Type Safety, Testability
3. Output scores to /tmp/lens-eval-scores.md

Your final message MUST contain ONLY:
  1. PREP_COMPLETE on its own line
  2. A summary line
PROMPT
)
  local prep_out="$BUILD_LOG/phase-8-prep-output.txt"
  run_claude "$prep_prompt" haiku "$prep_out" "Read Glob Grep Write" || true

  # 8b. Score-fix loop
  local initial_scores=""
  local codex_available=true

  for eval_iter in $(seq 1 $MAX_EVAL); do
    color_info "Evaluation iteration $eval_iter/$MAX_EVAL"

    # Score
    local score_prompt
    score_prompt=$(cat <<PROMPT
You have ONE task: run the Codex scorecard and report scores. Do NOTHING else.

1. which codex 2>/dev/null && echo "CODEX_AVAILABLE" || echo "CODEX_UNAVAILABLE"
   If unavailable: print CODEX_UNAVAILABLE and end with SCORE_COMPLETE.

2. If codex is available, run it to score these files: ${TARGET}
   Score 7 dimensions (1-10 each): Security, Structure, Error Handling, Naming, Complexity, Type Safety, Testability

3. Write parsed scores to .claude/build-log/phase-8-scores.md in this EXACT format:
   SCORE_SECURITY: N
   SCORE_STRUCTURE: N
   SCORE_ERROR_HANDLING: N
   SCORE_NAMING: N
   SCORE_COMPLEXITY: N
   SCORE_TYPE_SAFETY: N
   SCORE_TESTABILITY: N
   SCORE_TOTAL: NN

PROHIBITED: editing source files, committing, fixing code

OUTPUT RULES:
Your final message MUST contain ONLY:
  1. SCORE_COMPLETE on its own line
  2. The total score (e.g. "Total: 58/70")
Do NOT return full scores.
PROMPT
)
    local score_out="$BUILD_LOG/phase-8-score-output-${eval_iter}.txt"
    run_claude "$score_prompt" sonnet "$score_out" "Bash Read Write Glob Grep" || true

    # Check for codex unavailability
    if grep -q "CODEX_UNAVAILABLE" "$score_out" 2>/dev/null; then
      color_warn "Codex not available — skipping score-fix loop"
      codex_available=false
      break
    fi

    # Parse scores
    local scores_file="$BUILD_LOG/phase-8-scores.md"
    if [[ ! -f "$scores_file" ]]; then
      color_warn "No scores file produced"
      break
    fi

    local total
    total=$(awk -F': *' '$1 == "SCORE_TOTAL" {print $2+0}' "$scores_file" 2>/dev/null || echo 0)

    if [[ $eval_iter -eq 1 ]]; then
      initial_scores="$total/70"
    fi

    # Print scoreboard
    printf "\n${BOLD}  Scoreboard (iteration $eval_iter):${RESET}\n"
    while IFS=': ' read -r key val; do
      case "$key" in
        SCORE_TOTAL) printf "  ${BOLD}%-22s %s/70${RESET}\n" "Total:" "$val" ;;
        SCORE_*)
          local dim="${key#SCORE_}"
          dim="${dim//_/ }"
          local score_val="${val//[^0-9]/}"
          if [[ -n "$score_val" ]] && [[ "$score_val" -ge 9 ]]; then
            printf "  ${GREEN}%-22s %s/10${RESET}\n" "$dim:" "$score_val"
          else
            printf "  ${YELLOW}%-22s %s/10${RESET}\n" "$dim:" "${score_val:-?}"
          fi
          ;;
      esac
    done < "$scores_file"
    printf "\n"

    # Update state with scores
    update_state ".scores.iteration_${eval_iter} = $total"

    # Check if all dimensions >= 9
    local all_pass=true
    while IFS=': ' read -r key val; do
      case "$key" in
        SCORE_TOTAL) continue ;;
        SCORE_*)
          local score_val="${val//[^0-9]/}"
          if [[ -n "$score_val" ]] && [[ "$score_val" -lt 9 ]]; then
            all_pass=false
          fi
          ;;
      esac
    done < "$scores_file"

    if [[ "$all_pass" == true ]]; then
      color_ok "All dimensions >= 9"
      break
    fi

    if [[ $eval_iter -eq $MAX_EVAL ]]; then
      color_warn "Max evaluation iterations reached"
      break
    fi

    # Fix lowest dimensions
    color_info "Fixing lowest-scoring dimensions"
    local fix_prompt
    fix_prompt=$(cat <<PROMPT
Read scores from .claude/build-log/phase-8-scores.md.
Fix ONLY dimensions scoring below 9 in: ${TARGET}

For each fix, write to .claude/build-log/phase-8-fixes.md:
FIX_APPLIED: {dimension} | {file:line} | {what changed}

After all fixes: npm test

PROHIBITED: committing, re-scoring, modifying unrelated code

OUTPUT RULES:
Your final message MUST contain ONLY:
  1. FIX_COMPLETE on its own line
  2. A single summary line
Do NOT return your full work log.
PROMPT
)
    local fix_out="$BUILD_LOG/phase-8-fix-output-${eval_iter}.txt"
    run_claude "$fix_prompt" sonnet "$fix_out" || true
  done

  # 8c. Lessons
  color_info "Writing lessons"
  local lesson_prompt
  lesson_prompt=$(cat <<PROMPT
Classify fixes and write evaluation outputs. Do NOT modify source code.

Read scores and fixes from:
- .claude/build-log/phase-8-scores.md (final scores)
- .claude/build-log/phase-8-fixes.md (all fixes applied, may not exist)

Initial scores: ${initial_scores}

Classify each fix using this tree:
- Code pattern to avoid? YES + general → LESSON in both .claude/lessons.md and .claude/universal-lessons.md
- Code pattern to avoid? YES + project-specific → LESSON in .claude/lessons.md only
- Suggests pipeline/tool change? → PROPOSAL in .claude/eval-proposals.md
- Neither → eval-report.md only

Category: LOGIC | DESIGN | CODE_QUALITY | DUPLICATION | AI_SMELL

Read .claude/lessons.md and .claude/universal-lessons.md — skip duplicates.
Write .claude/eval-report.md with a summary of the evaluation.
Write detailed evaluation log to .claude/build-log/phase-8-evaluation.md
Append to lessons + proposals.
Verify writes by reading each file.

OUTPUT RULES:
Your final message MUST contain ONLY:
  1. LESSONS_COMPLETE on its own line
  2. A single summary line (e.g. "3 lessons written, 1 proposal filed")
Do NOT return your full work log.
PROMPT
)
  local lesson_out="$BUILD_LOG/phase-8-lesson-output.txt"
  run_claude "$lesson_prompt" sonnet "$lesson_out" "Read Write Edit Glob Grep" || true

  local duration
  duration=$(elapsed_since "$start_epoch")
  local final_total
  final_total=$(awk -F': *' '$1 == "SCORE_TOTAL" {print $2+0}' "$BUILD_LOG/phase-8-scores.md" 2>/dev/null || echo "?")

  update_state ".currentPhase = 8 | .phaseResults.\"phase-8\" = {status: \"complete\", summary: \"${initial_scores} → ${final_total}/70\", duration: $duration} | .scores.initial = \"${initial_scores}\" | .scores.final = \"${final_total}/70\""
  color_ok "Evaluation complete — ${initial_scores} → ${final_total}/70"
}

run_final_gate() {
  color_info "Running final quality gate (npm test + quality-gate)"
  for fg_attempt in $(seq 1 $MAX_QG); do
    local gate_pass=true

    if ! npm test 2>&1; then
      gate_pass=false
    fi

    if ! npx tsx .claude/scripts/quality-gate.ts "$TARGET" 2>&1; then
      gate_pass=false
    fi

    if [[ "$gate_pass" == true ]]; then
      color_ok "Final quality gate passed"
      return 0
    fi

    color_warn "Final gate failed — re-running phase 7 (attempt $fg_attempt/$MAX_QG)"
    local gate_errors
    gate_errors=$(npm test 2>&1; npx tsx .claude/scripts/quality-gate.ts "$TARGET" 2>&1 || true)
    local fix_prompt
    fix_prompt=$(cat <<PROMPT
Read the skill file at ${SKILLS_PATH}/workflow/testing/SKILL.md
and execute ALL of its instructions against: ${TARGET}

The quality gate failed with these errors. Fix them:

${gate_errors}

OUTPUT RULES:
Write your full detailed output to .claude/build-log/phase-7-testing.md
Your final message MUST contain ONLY:
  1. TESTING_COMPLETE on its own line
  2. A single summary line
Do NOT return your full work log.
PROMPT
)
    local fix_out="$BUILD_LOG/phase-7-gate-fix-output.txt"
    run_claude "$fix_prompt" sonnet "$fix_out" || true
  done

  color_warn "Final gate still failing after $MAX_QG attempts — check manually"
}

# ── Dry run ────────────────────────────────
print_dry_run() {
  local start=1
  if [[ "$MODE" == "build" ]]; then
    start=0
  fi
  if [[ -n "$FROM_PHASE" ]]; then
    start=$FROM_PHASE
  fi

  printf "\n${BOLD}Pipeline: %s %s${RESET}\n\n" "$MODE" "$TARGET"
  printf "%-5s %-20s %-8s %-30s\n" "#" "Skill" "Model" "Gate Marker"
  printf "%-5s %-20s %-8s %-30s\n" "---" "----" "-----" "-----------"

  for n in 0 1 2 3 4 5 6 7 8; do
    if [[ "$MODE" == "improve" && $n -eq 0 ]]; then continue; fi
    if [[ $n -lt $start ]]; then
      printf "${BLUE}%-5s %-20s %-8s %-30s (skip)${RESET}\n" \
        "$n" "$(phase_num_to_name $n)" "$(phase_num_to_model $n)" "$(phase_num_to_marker $n)"
    else
      printf "%-5s %-20s %-8s %-30s\n" \
        "$n" "$(phase_num_to_name $n)" "$(phase_num_to_model $n)" "$(phase_num_to_marker $n)"
    fi
  done

  printf "\n${BOLD}Quality gates:${RESET} after phase 3, after phase 8\n"
  printf "${BOLD}Phase 3:${RESET} implementation loop (max %d iterations)\n" "$MAX_IMPL"
  printf "${BOLD}Phase 6:${RESET} 4 parallel scans → dedup → fix → canary validate\n"
  printf "${BOLD}Phase 8:${RESET} score-fix loop (max %d iterations)\n" "$MAX_EVAL"
  printf "\n"
}

# ── Rollback handler ───────────────────────
handle_rollback() {
  local pattern="${MODE}:"
  local stash_line
  stash_line=$(git stash list 2>/dev/null | grep "$pattern" | head -1 || true)

  if [[ -z "$stash_line" ]]; then
    color_fail "No $MODE stash found"
    exit 1
  fi

  local stash_ref
  stash_ref=$(echo "$stash_line" | cut -d: -f1)

  color_info "Restoring from $stash_ref"
  git stash pop "$stash_ref"
  color_ok "Rolled back to $stash_ref"
}

# ── Report ─────────────────────────────────
print_report() {
  printf "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
  local mode_label
  mode_label=$(echo "$MODE" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')
  printf "${BOLD}%s: %s${RESET}\n" "$mode_label" "$TARGET"

  local stash
  stash=$(read_state '.stashRef // "none"')
  printf "  Rollback: %s\n\n" "$stash"

  # Read phase results from state
  local phases
  if [[ "$MODE" == "build" ]]; then
    phases="0 1 2 3 4 5 6 7 8"
  else
    phases="1 2 3 4 5 6 7 8"
  fi

  for n in $phases; do
    local status summary
    status=$(read_state ".phaseResults.\"phase-${n}\".status // \"skipped\"")
    summary=$(read_state ".phaseResults.\"phase-${n}\".summary // \"\"")
    local name
    name=$(phase_num_to_name "$n")
    if [[ "$status" == "complete" || "$status" == "complete-with-warnings" ]]; then
      color_ok "$(printf '%-14s %s' "${name}" "$summary")"
    elif [[ "$status" == "skipped" ]]; then
      color_info "$(printf '%-14s %s' "${name}" "skipped")"
    else
      color_fail "$(printf '%-14s %s' "${name}" "$status")"
    fi
  done

  local initial final
  initial=$(read_state '.scores.initial // "?"')
  final=$(read_state '.scores.final // "?"')
  if [[ "$initial" != "?" ]]; then
    printf "\n  Scores: %s → %s\n" "$initial" "$final"
  fi

  printf "\n  Rollback: pipeline.sh %s --rollback\n" "$MODE"
  printf "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n\n"
}

# ── Main ───────────────────────────────────
main() {
  check_deps
  parse_args "$@"

  SKILLS_PATH=$(resolve_skills_path)

  # Rollback mode
  if [[ "$ROLLBACK" == true ]]; then
    handle_rollback
    exit 0
  fi

  # Dry run
  if [[ "$DRY_RUN" == true ]]; then
    print_dry_run
    exit 0
  fi

  local start_phase=1
  if [[ "$MODE" == "build" ]]; then
    start_phase=0
  fi
  if [[ -n "$FROM_PHASE" ]]; then
    start_phase=$FROM_PHASE
  fi

  printf "\n${BOLD}Pipeline: %s %s${RESET}\n" "$MODE" "$TARGET"
  printf "${BOLD}Starting from phase: %s (%s)${RESET}\n\n" "$start_phase" "$(phase_num_to_name $start_phase)"

  # Initialize state (or restore on resume)
  if [[ -n "$FROM_PHASE" && -f "$STATE_FILE" ]]; then
    color_info "Resuming — reading existing state"
    TARGET=$(read_state '.target')
    color_info "Target from state: $TARGET"
  else
    init_state "$TARGET" "$MODE"
  fi

  # Rollback point (only on fresh run)
  if [[ -z "$FROM_PHASE" ]]; then
    color_info "Creating rollback point"
    local stash_msg="${MODE}:$(basename "$TARGET"):$(date +%s)"
    if git stash push -m "$stash_msg" 2>/dev/null; then
      local stash_ref
      stash_ref=$(git stash list | grep "$stash_msg" | head -1 | cut -d: -f1)
      if [[ -n "$stash_ref" ]]; then
        update_state ".stashRef = \"$stash_ref\""
        color_ok "Stash: $stash_ref"
      else
        color_info "Nothing to stash (clean working tree)"
      fi
    fi
  fi

  # Phase 0: Reference (build only)
  if [[ "$MODE" == "build" && $start_phase -le 0 ]]; then
    run_phase_0
  fi

  # Phase 1: Plan
  if [[ $start_phase -le 1 ]]; then
    run_standard_phase 1 plan sonnet PLAN_COMPLETE
    # Log plan summary
    if [[ -f "$BUILD_LOG/phase-1-plan.md" ]]; then
      color_info "Plan written to $BUILD_LOG/phase-1-plan.md"
    fi
  fi

  # Phase 2: Structure
  if [[ $start_phase -le 2 ]]; then
    run_standard_phase 2 structure sonnet STRUCTURE_COMPLETE
  fi

  # Phase 3: Implementation (with loop + quality gate)
  if [[ $start_phase -le 3 ]]; then
    run_phase_3_with_gate
  fi

  # Phase 4: Refactoring
  if [[ $start_phase -le 4 ]]; then
    run_standard_phase 4 refactoring sonnet REFACTORING_COMPLETE
  fi

  # Phase 5: Deduplication
  if [[ $start_phase -le 5 ]]; then
    run_standard_phase 5 deduplication haiku DEDUPLICATION_COMPLETE
  fi

  # Phase 6: Review
  if [[ $start_phase -le 6 ]]; then
    run_phase_6
  fi

  # Phase 7: Testing
  if [[ $start_phase -le 7 ]]; then
    run_standard_phase 7 testing sonnet TESTING_COMPLETE
  fi

  # Phase 8: Evaluation
  if [[ $start_phase -le 8 ]]; then
    run_phase_8
  fi

  # Final quality gate
  run_final_gate

  # Report
  print_report
}

main "$@"
