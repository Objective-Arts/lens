/**
 * Tools Management - Legacy module for companion CLI tools.
 *
 * NOTE: This module is largely deprecated. Ralph is now TypeScript-based
 * and installed via `npm link`. The bash script installation is no longer used.
 *
 * Kept for backward compatibility with `lens tools` command.
 */

import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export interface ToolInfo {
  name: string;
  description: string;
  path?: string;
  installed: boolean;
}

export interface ToolInstallResult {
  success: boolean;
  message: string;
  path?: string;
}

const DEFAULT_BIN_DIR = path.join(homedir(), '.local', 'bin');

export function getBinDir(): string {
  return process.env.CC_BIN_DIR || DEFAULT_BIN_DIR;
}

/**
 * Available tools metadata.
 * Ralph is now TypeScript-based - use `npm link` to install.
 */
const AVAILABLE_TOOLS: Record<string, { description: string }> = {
  ralph: {
    description: 'Autonomous PRD implementation loop (TypeScript - use npm link)',
  },
};

export function listTools(): ToolInfo[] {
  const binDir = getBinDir();

  return Object.entries(AVAILABLE_TOOLS).map(([name, info]) => {
    const toolPath = path.join(binDir, name);
    const installed = fs.existsSync(toolPath);

    return {
      name,
      description: info.description,
      path: installed ? toolPath : undefined,
      installed,
    };
  });
}

export function isToolInstalled(name: string): boolean {
  const binDir = getBinDir();
  return fs.existsSync(path.join(binDir, name));
}

export function installTool(
  name: string,
  _options: { force?: boolean; projectDir?: string } = {}
): ToolInstallResult {
  if (name === 'ralph') {
    return {
      success: false,
      message: 'Ralph is now TypeScript-based. Install with: cd cli && npm link',
    };
  }

  return {
    success: false,
    message: `Unknown tool: ${name}. Available: ${Object.keys(AVAILABLE_TOOLS).join(', ')}`,
  };
}

export function uninstallTool(name: string): ToolInstallResult {
  const binDir = getBinDir();
  const toolPath = path.join(binDir, name);

  if (!fs.existsSync(toolPath)) {
    return {
      success: false,
      message: `Tool not installed: ${name}`,
    };
  }

  fs.unlinkSync(toolPath);

  return {
    success: true,
    message: `Uninstalled ${name} from ${toolPath}`,
  };
}

export function getToolPath(name: string): string {
  return path.join(getBinDir(), name);
}
