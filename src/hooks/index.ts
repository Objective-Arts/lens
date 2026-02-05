/**
 * Hook management for Claude Code settings.json
 *
 * Following kernighan: clear, explicit operations.
 * Following bloch: defensive programming with backups.
 */

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
} from "./types.js";

export * from "./types.js";

/** Get path to global Claude settings.json */
export function getSettingsPath(): string {
  return path.join(os.homedir(), ".claude", "settings.json");
}

/** Read settings.json, return empty object if not found */
export function readSettings(): ClaudeSettings {
  const settingsPath = getSettingsPath();

  if (!fs.existsSync(settingsPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(settingsPath, "utf-8");
    return JSON.parse(content) as ClaudeSettings;
  } catch {
    return {};
  }
}

/** Write settings.json with optional backup */
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

  // Write new settings
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  return { success: true, backupPath };
}

/** Workflow marker hook command - validates .claude/active-workflow.json exists and is fresh */
const WORKFLOW_MARKER_COMMAND = `marker=".claude/active-workflow.json"; if [ -f "$marker" ] && find "$marker" -mmin -60 2>/dev/null | grep -q .; then exit 0; fi; echo "ERROR: No active workflow detected."; echo "Invoke a workflow skill first: /implement, /plan, /structure-first, /adversarial-review, /refactor-check, or /test"; exit 1`;

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

/** Check if workflow marker hook is already installed */
export function hasWorkflowMarkerHook(settings: ClaudeSettings): boolean {
  const preToolUse = settings.hooks?.PreToolUse;
  if (!preToolUse) return false;

  return preToolUse.some(entry =>
    entry.matcher === "Edit|Write" &&
    entry.hooks.some(h =>
      h.type === "command" &&
      h.command?.includes("active-workflow.json")
    )
  );
}

/** Setup the workflow marker hook */
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
  settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
    entry => entry.matcher !== "Edit|Write"
  );

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

/** Remove a hook by ID (event:index format) */
export function removeHook(hookId: string): HookSetupResult {
  const [event, indexStr] = hookId.split(":");
  const index = parseInt(indexStr, 10);

  if (!event || isNaN(index)) {
    return {
      success: false,
      message: `Invalid hook ID: ${hookId}. Use format "event:index" (e.g., "PreToolUse:0")`,
    };
  }

  const settings = readSettings();
  const eventKey = event as HookEvent;

  if (!settings.hooks?.[eventKey]) {
    return {
      success: false,
      message: `No hooks found for event: ${event}`,
    };
  }

  const hooksArr = settings.hooks[eventKey]!;

  if (index < 0 || index >= hooksArr.length) {
    return {
      success: false,
      message: `Hook index ${index} out of range for ${event} (0-${hooksArr.length - 1})`,
    };
  }

  // Remove the hook
  hooksArr.splice(index, 1);

  // Clean up empty arrays
  if (hooksArr.length === 0) {
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

/** Remove workflow marker hook specifically */
function removeWorkflowMarkerHook(): HookSetupResult {
  const settings = readSettings();

  if (!hasWorkflowMarkerHook(settings)) {
    return {
      success: true,
      message: "Workflow marker hook is not installed",
    };
  }

  // Remove Edit|Write hooks that contain active-workflow.json
  if (settings.hooks?.PreToolUse) {
    settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(entry => {
      if (entry.matcher !== "Edit|Write") return true;
      return !entry.hooks.some(h =>
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

/** List all hooks with descriptions */
export function listHooks(): ListedHook[] {
  const settings = readSettings();
  const result: ListedHook[] = [];

  if (!settings.hooks) {
    return result;
  }

  const events: HookEvent[] = ["PreToolUse", "PostToolUse", "UserPromptSubmit", "Notification"];

  for (const event of events) {
    const entries = settings.hooks[event];
    if (!entries) continue;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      for (const hook of entry.hooks) {
        let description = "";

        // Generate description based on hook content
        if (hook.type === "command") {
          if (hook.command?.includes("active-workflow.json")) {
            description = "Workflow marker enforcement (blocks Edit/Write without active workflow)";
          } else if (hook.command?.includes("afplay")) {
            description = "Sound notification";
          } else if (hook.command?.includes("/clear")) {
            description = "/clear warning";
          } else {
            // Truncate long commands
            const cmd = hook.command || "Command hook";
            description = cmd.length > 60 ? cmd.slice(0, 60) + "..." : cmd;
          }
        } else if (hook.type === "prompt") {
          const prompt = hook.prompt || "Prompt hook";
          description = prompt.length > 60 ? prompt.slice(0, 60) + "..." : prompt;
        }

        result.push({
          event,
          matcher: entry.matcher || "*",
          type: hook.type,
          description,
          id: `${event}:${i}`,
        });
      }
    }
  }

  return result;
}

/** Get available hook presets */
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

/** Setup a hook preset */
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

/** Remove a hook preset */
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
