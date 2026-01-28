/**
 * Claude CLI process spawning.
 *
 * Following hevery: injectable, testable interface.
 * Following kernighan: simple wrapper, clear errors.
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeOutput } from '../types.js';
import { extractResult, isSuccessfulRun, extractError } from '../parsers/claude-stream.js';

/** Options for spawning Claude */
export interface ClaudeOptions {
  prompt: string;
  projectPath: string;
  logDir: string;
  logPrefix: string;
  allowedTools?: string[];
  maxTurns?: number;
  timeout?: number; // ms
}

/**
 * Run Claude with a prompt and capture output.
 *
 * @param options - Claude execution options
 * @returns Promise resolving to structured output
 */
export async function runClaude(options: ClaudeOptions): Promise<ClaudeOutput> {
  const {
    prompt,
    projectPath,
    logDir,
    logPrefix,
    allowedTools = [],
    maxTurns = 50,
    timeout = 600000, // 10 minutes default
  } = options;

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const jsonPath = path.join(logDir, `${logPrefix}.json`);
  const rawPath = path.join(logDir, `${logPrefix}.raw`);

  const startTime = Date.now();

  // Build Claude command arguments
  // --output-format stream-json requires --verbose
  const args = [
    '--output-format', 'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
    '-p', prompt,
  ];

  // Add allowed tools if specified
  for (const tool of allowedTools) {
    args.push('--allowedTools', tool);
  }

  return new Promise((resolve, reject) => {
    let output = '';

    const child = spawn('claude', args, {
      cwd: projectPath,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    // Close stdin immediately to prevent blocking
    if (child.stdin) {
      child.stdin.end();
    }

    // Handle timeout
    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Claude timed out after ${timeout}ms`));
    }, timeout);

    // Collect stdout
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });
    }

    // Collect stderr (but don't fail on warnings)
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        if (!text.includes('Warning:')) {
          output += text;
        }
      });
    }

    child.on('close', (code) => {
      clearTimeout(timeoutId);

      // Write output to json file
      fs.writeFileSync(jsonPath, output);

      const durationMs = Date.now() - startTime;
      const result = extractResult(jsonPath);

      // Write raw result to file
      fs.writeFileSync(rawPath, result);

      // Check success: exit code 0 AND success marker in result OR stream
      const hasSuccessMarker = isSuccessfulRun(result) || isSuccessfulRun(output);

      resolve({
        success: code === 0 && hasSuccessMarker,
        jsonPath,
        rawPath,
        result,
        durationMs,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to spawn Claude: ${err.message}`));
    });
  });
}

/**
 * Check if Claude CLI is available.
 */
export async function isClaudeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('which', ['claude']);
    child.on('close', (code) => {
      resolve(code === 0);
    });
    child.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Get Claude version.
 */
export async function getClaudeVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['--version']);
    let output = '';

    child.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        resolve(null);
      }
    });

    child.on('error', () => {
      resolve(null);
    });
  });
}
