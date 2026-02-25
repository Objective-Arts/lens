import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type {
  ClaudeSettings,
  HookEntry,
  HookSetupResult,
  ListedHook,
  HookEvent,
  HookPreset,
  HookDefinition,
} from "./types.js";
import { isRecord } from "../utils/validation.js";
import { isEnoent, safeReadFileSync } from "../utils/fs.js";

export * from "./types.js";

export function getSettingsPath(): string {
  return path.join(os.homedir(), ".claude", "settings.json");
}

function isClaudeSettings(value: unknown): value is ClaudeSettings {
  if (!isRecord(value)) return false;
  if (value.hooks !== undefined && !isRecord(value.hooks)) return false;
  return true;
}

export function readSettings(): ClaudeSettings {
  const settingsPath = getSettingsPath();

  try {
    const content = safeReadFileSync(settingsPath);
    const parsed: unknown = JSON.parse(content);
    if (!isClaudeSettings(parsed)) {
      console.warn("settings.json has unexpected structure, using defaults");
      return {};
    }
    return parsed;
  } catch (cause) {
    if (!isEnoent(cause)) {
      console.warn("Warning: corrupt settings.json — using defaults");
    }
    return {};
  }
}

function writeSettings(
  settings: ClaudeSettings,
  options: { backup?: boolean } = {}
): { success: boolean; backupPath?: string } {
  const settingsPath = getSettingsPath();
  const settingsDir = path.dirname(settingsPath);

  // Ensure directory exists
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true });
  }

  let backupPath: string | undefined;

  // Create backup if requested and file exists
  if (options.backup && fs.existsSync(settingsPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    backupPath = path.join(settingsDir, `settings.backup.${timestamp}.json`);
    fs.copyFileSync(settingsPath, backupPath);
  }

  // Write atomically: write to temp file then rename
  const tmpPath = settingsPath + ".tmp." + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2));
  fs.renameSync(tmpPath, settingsPath);

  return { success: true, backupPath };
}

/** Workflow marker hook command - validates .claude/active-workflow.json exists and is fresh */
const NODE_BIN = JSON.stringify(process.execPath);
const WORKFLOW_MARKER_COMMAND = `${NODE_BIN} -e "const fs=require('fs');const marker='.claude/active-workflow.json';try{const s=fs.statSync(marker);const age=(Date.now()-s.mtimeMs)/60000;if(age<=60){process.exit(0);}}catch(e){}console.error('ERROR: No active workflow detected.');console.error('Invoke a workflow skill first: /implementation, /plan, /structure, /security-review, /refactoring, or /test');process.exit(1);"`;

/** Workflow marker hook definition */
const WORKFLOW_MARKER_HOOK: HookEntry = {
  matcher: "Edit|Write",
  hooks: [
    {
      type: "command",
      command: WORKFLOW_MARKER_COMMAND,
    },
  ],
};

export function hasWorkflowMarkerHook(settings: ClaudeSettings): boolean {
  const preToolUse = settings.hooks?.PreToolUse;
  if (!Array.isArray(preToolUse)) return false;

  return preToolUse.some(entry =>
    entry.matcher === "Edit|Write" &&
    Array.isArray(entry.hooks) &&
    entry.hooks.some(h =>
      h.type === "command" &&
      h.command?.includes("active-workflow.json")
    )
  );
}

function setupWorkflowMarkerHook(): HookSetupResult {
  const settings = readSettings();

  // Check if already installed
  if (hasWorkflowMarkerHook(settings)) {
    return {
      success: true,
      message: "Workflow marker hook is already installed",
    };
  }

  // Initialize hooks structure if needed
  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.PreToolUse) {
    settings.hooks.PreToolUse = [];
  }

  // Remove any existing Edit|Write hooks (to avoid duplicates)
  if (Array.isArray(settings.hooks.PreToolUse)) {
    settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
      entry => entry.matcher !== "Edit|Write"
    );
  } else {
    settings.hooks.PreToolUse = [];
  }

  // Add the workflow marker hook
  settings.hooks.PreToolUse.push(WORKFLOW_MARKER_HOOK);

  // Write with backup
  const { backupPath } = writeSettings(settings, { backup: true });

  return {
    success: true,
    message: "Workflow marker hook installed successfully",
    backupPath,
  };
}

/** Parse and validate the event, entry index, and hook index components of a hook ID. */
function parseHookId(hookId: string): { event: string; entryIndex: number; hookIndex: number } | null {
  const [event, entryIndexStr, hookIndexStr] = hookId.split(":");
  const entryIndex = parseInt(entryIndexStr, 10);
  const hookIndex = parseInt(hookIndexStr, 10);
  if (!event || isNaN(entryIndex) || isNaN(hookIndex)) return null;
  return { event, entryIndex, hookIndex };
}

/** Validate that the parsed hook ID refers to an existing hook. */
function validateHookTarget(
  settings: ClaudeSettings,
  event: string,
  entryIndex: number,
  hookIndex: number
): { hooksArr: HookEntry[]; entry: HookEntry; error?: never } | { hooksArr?: never; entry?: never; error: string } {
  const eventKey = event as HookEvent;
  const raw = settings.hooks?.[eventKey];
  if (!Array.isArray(raw)) {
    return { error: `No hooks found for event: ${event}` };
  }
  const hooksArr = raw;
  if (entryIndex < 0 || entryIndex >= hooksArr.length) {
    return { error: `Hook entry index ${entryIndex} out of range for ${event} (0-${hooksArr.length - 1})` };
  }
  const entry = hooksArr[entryIndex];
  if (!Array.isArray(entry.hooks)) {
    return { error: `Hook entry ${entryIndex} for ${event} has no hooks` };
  }
  if (hookIndex < 0 || hookIndex >= entry.hooks.length) {
    return { error: `Hook index ${hookIndex} out of range for ${event}:${entryIndex} (0-${entry.hooks.length - 1})` };
  }
  return { hooksArr, entry };
}

export function removeHook(hookId: string): HookSetupResult {
  const parsed = parseHookId(hookId);

  if (!parsed) {
    return {
      success: false,
      message: `Invalid hook ID: ${hookId}. Use format "event:entry:hook" (e.g., "PreToolUse:0:0")`,
    };
  }

  const { event, entryIndex, hookIndex } = parsed;
  const settings = readSettings();
  const validated = validateHookTarget(settings, event, entryIndex, hookIndex);

  if (validated.error) {
    return { success: false, message: validated.error };
  }

  const hooksArr = validated.hooksArr;
  const entry = validated.entry;
  if (!hooksArr || !entry || !Array.isArray(entry.hooks)) {
    return { success: false, message: 'Hook array unexpectedly undefined after validation' };
  }
  const eventKey = event as HookEvent;

  // Remove the specific hook within the entry
  entry.hooks.splice(hookIndex, 1);

  // Remove empty entry if no hooks remain
  if (entry.hooks.length === 0) {
    hooksArr.splice(entryIndex, 1);
  }

  // Clean up empty arrays
  if (hooksArr.length === 0 && settings.hooks) {
    delete settings.hooks[eventKey];
  }

  // Write with backup
  const { backupPath } = writeSettings(settings, { backup: true });

  return {
    success: true,
    message: `Removed hook ${hookId}`,
    backupPath,
  };
}

function removeWorkflowMarkerHook(): HookSetupResult {
  const settings = readSettings();

  if (!hasWorkflowMarkerHook(settings)) {
    return {
      success: true,
      message: "Workflow marker hook is not installed",
    };
  }

  // Remove Edit|Write hooks that contain active-workflow.json
  if (Array.isArray(settings.hooks?.PreToolUse)) {
    settings.hooks!.PreToolUse = settings.hooks!.PreToolUse!.filter(entry => {
      if (entry.matcher !== "Edit|Write") return true;
      return !Array.isArray(entry.hooks) || !entry.hooks.some(h =>
        h.type === "command" &&
        h.command?.includes("active-workflow.json")
      );
    });

    // Clean up empty array
    if (settings.hooks.PreToolUse.length === 0) {
      delete settings.hooks.PreToolUse;
    }
  }

  const { backupPath } = writeSettings(settings, { backup: true });

  return {
    success: true,
    message: "Workflow marker hook removed",
    backupPath,
  };
}

const COMMAND_DESCRIPTIONS: ReadonlyArray<[string, string]> = [
  ["active-workflow.json", "Workflow marker enforcement (blocks Edit/Write without active workflow)"],
  ["afplay", "Sound notification"],
  ["/clear", "/clear warning"],
];

function truncate(text: string, fallback: string): string {
  const value = text || fallback;
  return value.length > 60 ? value.slice(0, 60) + "..." : value;
}

/** Generate a human-readable description for a single hook definition. */
function describeHook(hook: HookDefinition): string {
  if (hook.type === "command") {
    const match = COMMAND_DESCRIPTIONS.find(([pattern]) => hook.command?.includes(pattern));
    if (match) return match[1];
    return truncate(hook.command || "", "Command hook");
  }
  return truncate(hook.prompt || "", "Prompt hook");
}

/** Collect listed hooks for a single event from its entries array. */
function collectEventHooks(event: HookEvent, entries: HookEntry[]): ListedHook[] {
  const listed: ListedHook[] = [];

  for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
    const entry = entries[entryIndex];
    if (!Array.isArray(entry.hooks)) continue;
    for (let hookIndex = 0; hookIndex < entry.hooks.length; hookIndex++) {
      const hook = entry.hooks[hookIndex];
      listed.push({
        event,
        matcher: entry.matcher || "*",
        type: hook.type,
        description: describeHook(hook),
        id: `${event}:${entryIndex}:${hookIndex}`,
      });
    }
  }

  return listed;
}

export function listHooks(): ListedHook[] {
  const settings = readSettings();

  if (!settings.hooks) {
    return [];
  }

  const events: HookEvent[] = ["PreToolUse", "PostToolUse", "UserPromptSubmit", "Notification"];
  const result: ListedHook[] = [];

  for (const event of events) {
    const entries = settings.hooks[event];
    if (!Array.isArray(entries)) continue;
    result.push(...collectEventHooks(event, entries));
  }

  return result;
}

export function listPresets(): Array<{ name: HookPreset; description: string; installed: boolean }> {
  const settings = readSettings();

  return [
    {
      name: "workflow-marker",
      description: "Enforce workflow discipline by requiring active workflow marker for Edit/Write",
      installed: hasWorkflowMarkerHook(settings),
    },
  ];
}

export function setupPreset(preset: HookPreset): HookSetupResult {
  switch (preset) {
    case "workflow-marker":
      return setupWorkflowMarkerHook();
    default:
      return {
        success: false,
        message: `Unknown preset: ${preset}`,
      };
  }
}

export function removePreset(preset: HookPreset): HookSetupResult {
  switch (preset) {
    case "workflow-marker":
      return removeWorkflowMarkerHook();
    default:
      return {
        success: false,
        message: `Unknown preset: ${preset}`,
      };
  }
}
