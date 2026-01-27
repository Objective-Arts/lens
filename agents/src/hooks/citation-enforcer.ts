/**
 * Citation Enforcer Hook - PreToolUse
 *
 * Blocks Edit/Write operations unless canon has been cited.
 * Forces deliberate design decisions before code changes.
 *
 * Reads the conversation transcript to detect citations rather than
 * relying on explicit recordCitation() calls.
 */

import { readFile } from 'node:fs/promises';
import type {
  HookCallback,
  PreToolUseHookInput,
  SyncHookJSONOutput,
} from '@anthropic-ai/claude-code';
import { getCanonState } from './canon-loader.js';

/** Tools that require citation before use */
const CITATION_REQUIRED_TOOLS = ['Edit', 'Write', 'NotebookEdit'] as const;

type CitationRequiredTool = (typeof CITATION_REQUIRED_TOOLS)[number];

/** How many recent messages to search for citations */
const RECENT_MESSAGE_COUNT = 10;

function isCitationRequiredTool(name: string): name is CitationRequiredTool {
  return CITATION_REQUIRED_TOOLS.includes(name as CitationRequiredTool);
}

/**
 * Type guard for PreToolUse input
 */
function isPreToolUseInput(input: unknown): input is PreToolUseHookInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    'hook_event_name' in input &&
    (input as { hook_event_name: string }).hook_event_name === 'PreToolUse'
  );
}

/**
 * Extract text content from a transcript message
 */
function extractTextFromMessage(message: unknown): string {
  if (typeof message !== 'object' || message === null) return '';

  const msg = message as Record<string, unknown>;

  // Only look at assistant messages
  if (msg['type'] !== 'assistant') return '';

  // Navigate to message.message.content
  const innerMessage = msg['message'] as Record<string, unknown> | undefined;
  if (!innerMessage) return '';

  const content = innerMessage['content'];
  if (!Array.isArray(content)) return '';

  // Extract text from content blocks
  const textParts: string[] = [];
  for (const block of content) {
    if (typeof block === 'object' && block !== null) {
      const b = block as Record<string, unknown>;
      if (b['type'] === 'text' && typeof b['text'] === 'string') {
        textParts.push(b['text']);
      }
    }
  }

  return textParts.join(' ');
}

/**
 * Check if text contains a citation to any loaded canon
 *
 * Looks for patterns like:
 * - "cherny" (author name)
 * - "Cherny's" (possessive)
 * - "per Dodds" (attribution)
 * - "following Rams" (attribution)
 */
function textContainsCitation(
  text: string,
  loadedCanon: readonly string[]
): boolean {
  const lowerText = text.toLowerCase();

  for (const canon of loadedCanon) {
    // Extract author name from path (e.g., "javascript/cherny" -> "cherny")
    const authorName = canon.split('/').pop()?.toLowerCase();
    if (!authorName) continue;

    // Check for author name mention
    if (lowerText.includes(authorName)) {
      return true;
    }
  }

  return false;
}

/**
 * Read transcript and check for canon citations in recent messages
 */
async function checkTranscriptForCitation(
  transcriptPath: string,
  loadedCanon: readonly string[]
): Promise<boolean> {
  try {
    const content = await readFile(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n');

    // Get last N messages
    const recentLines = lines.slice(-RECENT_MESSAGE_COUNT);

    for (const line of recentLines) {
      try {
        const message = JSON.parse(line);
        const text = extractTextFromMessage(message);

        if (text && textContainsCitation(text, loadedCanon)) {
          return true;
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }

    return false;
  } catch {
    // If we can't read transcript, allow the operation
    // (fail open rather than blocking all edits)
    return true;
  }
}

/**
 * Citation Enforcer Hook
 *
 * Triggered on PreToolUse for Edit/Write operations.
 * Denies permission unless a recent canon citation exists in the transcript.
 */
export const citationEnforcerHook: HookCallback = async (
  input,
  _toolUseId,
  _options
): Promise<SyncHookJSONOutput> => {
  // Only handle PreToolUse
  if (!isPreToolUseInput(input)) {
    return {};
  }

  const { tool_name, transcript_path } = input;

  // Only enforce on code-changing tools
  if (!isCitationRequiredTool(tool_name)) {
    return {};
  }

  // Check if citation enforcement is enabled
  const canonState = getCanonState();
  if (!canonState.citationsRequired) {
    return {};
  }

  // Check if any canon was loaded (if not, skip enforcement)
  if (canonState.summariesLoaded.length === 0) {
    return {};
  }

  // Check transcript for recent canon citation
  const hasCitation = await checkTranscriptForCitation(
    transcript_path,
    canonState.summariesLoaded
  );

  if (!hasCitation) {
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: buildDenyReason(canonState.summariesLoaded),
      },
    };
  }

  // Citation found, allow the operation
  return {};
};

/**
 * Build a helpful denial reason with available canon
 */
function buildDenyReason(loadedCanon: readonly string[]): string {
  const canonList = loadedCanon.map((c) => `  - ${c}`).join('\n');

  return `Canon citation required before editing code.

Before making changes, cite which design principle guides this change.

**Loaded Canon:**
${canonList}

**Example citations:**
- "Following Cherny's preference for discriminated unions..."
- "Applying Rams' principle of less but better..."
- "Per Dodds' testing guidance on user-centric queries..."

State your reasoning, then retry the edit.`;
}

export default citationEnforcerHook;
