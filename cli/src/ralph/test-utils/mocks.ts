/**
 * Test mocks for external dependencies.
 *
 * Following Hevery: Injectable interfaces, testable seams.
 * Following Dodds: Mock at boundaries only, use realistic responses.
 */

import { ClaudeOutput } from '../types.js';

/**
 * Interface for Claude runner - enables dependency injection.
 * Following Hevery: Explicit interface for external dependency.
 */
export interface ClaudeRunner {
  run(options: {
    prompt: string;
    projectPath: string;
    logDir: string;
    logPrefix: string;
    allowedTools?: string[];
  }): Promise<ClaudeOutput>;
}

/**
 * Create a mock Claude runner for testing.
 * Following Dodds: Returns realistic responses, not minimal stubs.
 */
export function createMockClaudeRunner(
  responses: Map<string, ClaudeOutput> | ClaudeOutput
): ClaudeRunner {
  return {
    async run(options) {
      if (responses instanceof Map) {
        // Find matching response by checking if prompt contains key
        for (const [key, output] of responses) {
          if (options.prompt.includes(key)) {
            return output;
          }
        }
        // Default to first response if no match
        const firstResponse = responses.values().next().value;
        return firstResponse ?? createSuccessfulClaudeOutput();
      }
      return responses;
    },
  };
}

/**
 * Create a successful Claude output.
 */
export function createSuccessfulClaudeOutput(
  result: string = 'BUILD_COMPLETE: Task finished successfully'
): ClaudeOutput {
  return {
    success: true,
    jsonPath: '/test/logs/test.json',
    rawPath: '/test/logs/test.raw',
    result,
    durationMs: 5000,
  };
}

/**
 * Create a failed Claude output.
 */
export function createFailedClaudeOutput(
  error: string = 'BUILD_FAILED: Could not complete task'
): ClaudeOutput {
  return {
    success: false,
    jsonPath: '/test/logs/test.json',
    rawPath: '/test/logs/test.raw',
    result: error,
    durationMs: 2000,
  };
}

/**
 * Interface for file system operations - enables dependency injection.
 */
export interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
}

/**
 * Create an in-memory file system mock for testing.
 */
export function createMockFileSystem(
  initialFiles: Map<string, string> = new Map()
): FileSystem & { files: Map<string, string> } {
  const files = new Map(initialFiles);

  return {
    files,
    async readFile(path: string): Promise<string> {
      const content = files.get(path);
      if (content === undefined) {
        throw new Error(`ENOENT: no such file or directory: ${path}`);
      }
      return content;
    },
    async writeFile(path: string, content: string): Promise<void> {
      files.set(path, content);
    },
    async exists(path: string): Promise<boolean> {
      return files.has(path);
    },
    async mkdir(_path: string, _options?: { recursive?: boolean }): Promise<void> {
      // No-op for mock - directories are implicit
    },
  };
}

/**
 * Create mock stage execution tracker.
 * Useful for verifying stage calls and order.
 */
export function createStageTracker() {
  const calls: Array<{ stage: string; context: unknown }> = [];

  return {
    calls,
    track(stage: string, context: unknown) {
      calls.push({ stage, context });
    },
    getCallsForStage(stage: string) {
      return calls.filter(c => c.stage === stage);
    },
    wasCalled(stage: string): boolean {
      return calls.some(c => c.stage === stage);
    },
    getCallOrder(): string[] {
      return calls.map(c => c.stage);
    },
    reset() {
      calls.length = 0;
    },
  };
}

/**
 * Mock console for capturing output in tests.
 */
export function createMockConsole() {
  const logs: string[] = [];
  const errors: string[] = [];
  const warns: string[] = [];

  return {
    logs,
    errors,
    warns,
    log(...args: unknown[]) {
      logs.push(args.map(String).join(' '));
    },
    error(...args: unknown[]) {
      errors.push(args.map(String).join(' '));
    },
    warn(...args: unknown[]) {
      warns.push(args.map(String).join(' '));
    },
    reset() {
      logs.length = 0;
      errors.length = 0;
      warns.length = 0;
    },
  };
}

/**
 * Wait helper for async tests.
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise for testing async flows.
 */
export function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
