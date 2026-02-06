/**
 * Claude CLI process spawning.
 *
 * Following testability: injectable, testable interface.
 * Following clarity: simple wrapper, clear errors.
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeOutput } from '../types.js';
import { extractResult, isFailedRun } from '../parsers/claude-stream.js';

/** Callback for streaming events */
export interface StreamCallbacks {
  onToolCall?: (toolName: string, input?: string) => void;
  onToolResult?: (toolName: string, output?: string) => void;
  onText?: (text: string) => void;
}

/** Options for spawning Claude */
export interface ClaudeOptions {
  prompt: string;
  projectPath: string;
  logDir: string;
  logPrefix: string;
  allowedTools?: string[];
  maxTurns?: number;
  timeout?: number; // ms
  stream?: StreamCallbacks;
}

/** Ensure log directory exists. */
function ensureLogDir(logDir: string): void {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

/** Build Claude CLI arguments. */
function buildClaudeArgs(prompt: string, allowedTools: string[]): string[] {
  const args = [
    '--output-format', 'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
    '-p', prompt,
  ];
  if (allowedTools.length > 0) {
    args.push('--allowedTools', allowedTools.join(','));
  }
  return args;
}

/** Write output files and build result. */
function buildClaudeResult(output: string, code: number | null, jsonPath: string, rawPath: string, startTime: number): ClaudeOutput {
  fs.writeFileSync(jsonPath, output);
  const result = extractResult(jsonPath);
  fs.writeFileSync(rawPath, result);
  // More lenient: succeed if exit code 0 and no explicit failure marker
  // Don't require success markers - they're nice to have but not mandatory
  const hasFailureMarker = isFailedRun(result) || isFailedRun(output);
  return {
    success: code === 0 && !hasFailureMarker,
    jsonPath, rawPath, result,
    durationMs: Date.now() - startTime,
  };
}

/** Spawn Claude process with args. */
function spawnClaudeProcess(args: string[], projectPath: string) {
  return spawn('claude', args, {
    cwd: projectPath,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
  });
}

/** Parse streaming JSON line for tool events. */
function parseStreamLine(line: string, callbacks?: StreamCallbacks): void {
  if (!callbacks || !line.trim()) return;
  try {
    const event = JSON.parse(line);
    // Tool use events
    if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
      callbacks.onToolCall?.(event.content_block.name, undefined);
    }
    // Tool result events
    if (event.type === 'tool_result') {
      callbacks.onToolResult?.(event.tool_name || 'unknown', event.content?.slice(0, 200));
    }
    // Also check for MCP tool patterns in assistant messages
    if (event.type === 'assistant' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === 'tool_use' && block.name?.startsWith('mcp__')) {
          callbacks.onToolCall?.(block.name, JSON.stringify(block.input)?.slice(0, 100));
        }
      }
    }
  } catch {
    // Not valid JSON or unexpected format - ignore
  }
}

/** Run Claude with a prompt and capture output. */
export async function runClaude(options: ClaudeOptions): Promise<ClaudeOutput> {
  const { prompt, projectPath, logDir, logPrefix, allowedTools = [], timeout = 1800000, stream } = options;
  ensureLogDir(logDir);

  const jsonPath = path.join(logDir, `${logPrefix}.json`);
  const rawPath = path.join(logDir, `${logPrefix}.raw`);
  const startTime = Date.now();
  const child = spawnClaudeProcess(buildClaudeArgs(prompt, allowedTools), projectPath);

  return new Promise((resolve, reject) => {
    let output = '';
    let lineBuffer = '';
    child.stdin?.end();

    const timeoutId = setTimeout(() => { child.kill('SIGTERM'); reject(new Error(`Claude timed out after ${timeout}ms`)); }, timeout);

    child.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      // Stream parsing: process complete lines
      if (stream) {
        lineBuffer += chunk;
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || ''; // Keep incomplete line in buffer
        for (const line of lines) {
          parseStreamLine(line, stream);
        }
      }
    });

    child.stderr?.on('data', (data: Buffer) => { if (!data.toString().includes('Warning:')) output += data.toString(); });
    child.on('close', (code) => { clearTimeout(timeoutId); resolve(buildClaudeResult(output, code, jsonPath, rawPath, startTime)); });
    child.on('error', (err) => { clearTimeout(timeoutId); reject(new Error(`Failed to spawn Claude: ${err.message}`)); });
  });
}

/** Check if Claude CLI is available. */
export async function isClaudeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('which', ['claude']);
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

/** Get the current git commit hash. */
export async function getGitCommitHash(projectPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn('git', ['rev-parse', 'HEAD'], { cwd: projectPath });
    let output = '';
    child.stdout?.on('data', (data: Buffer) => { output += data.toString(); });
    child.on('close', (code) => resolve(code === 0 ? output.trim() : null));
    child.on('error', () => resolve(null));
  });
}

/** Check if there are new commits since a given hash. */
export async function hasNewCommitsSince(projectPath: string, sinceHash: string): Promise<boolean> {
  const currentHash = await getGitCommitHash(projectPath);
  return currentHash !== null && currentHash !== sinceHash;
}

