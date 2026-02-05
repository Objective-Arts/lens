/**
 * Hook types for Claude Code settings.json
 *
 * Following cherny: strict types match the actual schema.
 */

/** Hook trigger events */
export type HookEvent = 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'Notification';

/** Hook types */
export type HookType = 'command' | 'prompt';

/** A single hook definition */
export interface HookDefinition {
  type: HookType;
  command?: string;
  prompt?: string;
}

/** A hook entry with optional matcher */
export interface HookEntry {
  matcher?: string;
  hooks: HookDefinition[];
}

/** Hooks configuration in settings.json */
export interface HooksConfig {
  PreToolUse?: HookEntry[];
  PostToolUse?: HookEntry[];
  UserPromptSubmit?: HookEntry[];
  Notification?: HookEntry[];
}

/** Claude Code settings.json structure (partial) */
export interface ClaudeSettings {
  hooks?: HooksConfig;
  permissions?: {
    allow?: string[];
    deny?: string[];
    defaultMode?: string;
  };
  model?: string;
  env?: Record<string, string>;
  enabledMcpjsonServers?: string[];
  statusLine?: {
    type: string;
    command: string;
  };
  [key: string]: unknown;
}

/** Known hook presets */
export type HookPreset = 'workflow-marker';

/** Hook setup result */
export interface HookSetupResult {
  success: boolean;
  message: string;
  backupPath?: string;
}

/** Listed hook for display */
export interface ListedHook {
  event: HookEvent;
  matcher: string;
  type: HookType;
  description: string;
  id: string;
}
