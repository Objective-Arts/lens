/**
 * Scaffold stage - sets up test infrastructure if missing.
 */

import { BaseStage, StageContext } from './types.js';
import { StageResult } from '../types.js';
import { runClaude } from '../process/claude.js';
import { execSync } from 'child_process';

const SCAFFOLD_PROMPT = `Set up test infrastructure for this project.

Detect the project type and install appropriate testing framework:
- TypeScript/JavaScript: vitest or jest
- Python: pytest
- Go: built-in testing
- Rust: built-in testing

Steps:
1. Detect project type from package.json, pyproject.toml, go.mod, Cargo.toml
2. Install test framework if not present
3. Create a placeholder test file
4. Verify the test command runs

Output SCAFFOLD_COMPLETE when done.
Output SCAFFOLD_SKIPPED if tests already configured.
Output SCAFFOLD_FAILED: <reason> if unable to set up.`;

export class ScaffoldStage extends BaseStage {
  readonly name = 'scaffold';
  readonly icon = '\u2699\ufe0f'; // ⚙️

  shouldRun(context: StageContext): boolean {
    // Only run if no test infrastructure detected
    return !this.hasTestInfrastructure(context.projectPath);
  }

  async execute(context: StageContext): Promise<StageResult> {
    const { projectPath, logsDir } = context;

    const logPrefix = this.getLogPrefix(context);
    const output = await runClaude({
      prompt: SCAFFOLD_PROMPT,
      projectPath,
      logDir: logsDir,
      logPrefix,
      allowedTools: ['Bash', 'Read', 'Write', 'Edit'],
    });

    if (!output.success) {
      return {
        status: 'failed',
        error: 'Failed to scaffold test infrastructure',
      };
    }

    return {
      status: 'success',
      message: 'Test infrastructure configured',
    };
  }

  private hasTestInfrastructure(projectPath: string): boolean {
    try {
      // Try running a test command
      execSync('npm test --version 2>/dev/null || pytest --version 2>/dev/null', {
        cwd: projectPath,
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  }
}
