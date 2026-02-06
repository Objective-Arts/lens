/**
 * MCP display helpers
 *
 * Extracted from cli/index.ts for single responsibility (simplicity)
 * Pure display functions - no side effects except console output (correctness)
 */

import chalk from 'chalk';
import type { MCPServerDefinition } from '../../mcp/types.js';

/** Format server status for display */
function formatServerStatus(installed: boolean, enabled: boolean): string {
  if (enabled) return chalk.green(' [enabled]');
  if (installed) return chalk.blue(' [installed]');
  return '';
}

/** Print installed servers list */
export function printInstalledServers(
  servers: Array<{ name: string; enabled: boolean; config: { type: string; command?: string; url?: string } }>,
  filterEnabled: boolean
): void {
  const filtered = filterEnabled ? servers.filter(s => s.enabled) : servers;

  console.log(chalk.bold('\nInstalled MCP Servers:\n'));

  for (const server of filtered) {
    const status = server.enabled
      ? chalk.green('✓ enabled')
      : chalk.gray('○ disabled');
    console.log(`  ${chalk.cyan(server.name)} ${status}`);
    console.log(chalk.gray(`    ${server.config.type} - ${server.config.command || server.config.url}`));
  }
}

/** Print registry servers grouped by category */
export function printRegistryServers(
  servers: MCPServerDefinition[],
  isInstalled: (name: string) => boolean,
  isEnabled: (name: string) => boolean,
  categories: string[]
): void {
  console.log(chalk.bold('\nMCP Server Registry:\n'));

  // Group by category
  const byCategory = new Map<string, MCPServerDefinition[]>();
  for (const server of servers) {
    const cat = server.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(server);
  }

  for (const [category, categoryServers] of byCategory) {
    console.log(chalk.yellow(`  ${category.toUpperCase()}`));

    for (const server of categoryServers) {
      const status = formatServerStatus(isInstalled(server.name), isEnabled(server.name));
      const envWarning = server.requiredEnv?.length
        ? chalk.gray(` (requires: ${server.requiredEnv.join(', ')})`)
        : '';

      console.log(`    ${chalk.cyan(server.name)}${status}${envWarning}`);
      if (server.description) {
        console.log(chalk.gray(`      ${server.description}`));
      }
    }
    console.log();
  }

  if (categories.length > 0) {
    console.log(chalk.gray(`Categories: ${categories.join(', ')}`));
  }
}

/** Print server details */
export function printServerDetails(
  server: MCPServerDefinition,
  installed: boolean,
  enabled: boolean,
  configPath: string
): void {
  console.log(chalk.bold(`\n${server.name}`));
  console.log(chalk.gray('─'.repeat(50)));

  if (server.description) {
    console.log(`Description: ${server.description}\n`);
  }

  console.log(`Type:     ${chalk.cyan(server.type)}`);
  console.log(`Category: ${chalk.yellow(server.category)}`);
  console.log(`Source:   ${server.source}`);

  if (server.type === 'stdio') {
    console.log(`Command:  ${server.command} ${server.args?.join(' ') || ''}`);
  } else if (server.type === 'http') {
    console.log(`URL:      ${server.url}`);
  }

  if (server.tags?.length) {
    console.log(`Tags:     ${server.tags.join(', ')}`);
  }

  if (server.plugin) {
    console.log(`Plugin:   ${server.plugin}`);
  }

  printEnvVarStatus(server.requiredEnv, server.env);
  printInstallStatus(installed, enabled, configPath);
}

/** Print environment variable status */
function printEnvVarStatus(
  required?: string[],
  env?: Record<string, string>
): void {
  if (required?.length) {
    console.log(chalk.cyan('\nRequired Environment Variables:'));
    for (const envVar of required) {
      const isSet = process.env[envVar];
      const status = isSet ? chalk.green('✓ set') : chalk.red('✗ not set');
      console.log(`  ${envVar}: ${status}`);
    }
  }

  if (env) {
    console.log(chalk.cyan('\nEnvironment Config:'));
    for (const [key, value] of Object.entries(env)) {
      console.log(`  ${key}: ${chalk.gray(value)}`);
    }
  }
}

/** Print installation status */
function printInstallStatus(installed: boolean, enabled: boolean, configPath: string): void {
  console.log(chalk.cyan('\nStatus:'));
  console.log(`  Installed: ${installed ? chalk.green('yes') : chalk.gray('no')}`);
  console.log(`  Enabled:   ${enabled ? chalk.green('yes') : chalk.gray('no')}`);
  console.log(`  Config:    ${chalk.gray(configPath)}`);
}

/** Print env check results */
export function printEnvCheckResults(
  results: Array<{ server: string; ok: boolean; missing: string[]; found: string[] }>
): void {
  console.log(chalk.bold('\nEnvironment Check Results:\n'));

  let allOk = true;
  for (const result of results) {
    if (result.ok) {
      console.log(chalk.green(`  ✓ ${result.server}: All env vars set`));
    } else {
      allOk = false;
      console.log(chalk.red(`  ✗ ${result.server}: Missing ${result.missing.join(', ')}`));
    }
  }

  console.log(allOk
    ? chalk.green('\nAll servers have required env vars set.')
    : chalk.yellow('\nSet missing env vars in your shell configuration.'));
}
