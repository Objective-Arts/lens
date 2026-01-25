#!/usr/bin/env node

/**
 * cc-config CLI - Claude Code configuration manager
 */

import * as fs from 'fs';
import { Command } from 'commander';
import chalk from 'chalk';
import { scan } from '../scanner/index.js';
import { formatTokens, tokenPercentage } from '../utils/tokens.js';
import {
  listProfiles,
  getProfile,
  saveProfile,
  applyComposableProfile,
  combineProfiles,
  parseProfileString,
  exampleComposableProfile
} from '../profiles/index.js';
import {
  listServers,
  listCategories,
  getServer,
  installServer,
  uninstallServer,
  enableServer,
  disableServer,
  checkServer,
  checkAllServers,
  listInstalledServers,
  isServerInstalled,
  isServerEnabled,
  addServerToRegistry,
  getRegistryPath,
  ensureRegistryDir,
  getMcpConfigPath
} from '../mcp/index.js';
import {
  listCanonSkills,
  checkSkillStatus,
  upgradeSkills,
  diffSkill,
  copySkill,
  getCanonSourceInfo
} from '../canon/index.js';
import {
  listWorkflowSkills,
  checkWorkflowStatus,
  upgradeWorkflowSkills,
  installWorkflowSkill,
  installAllWorkflowSkills,
  getWorkflowSourceInfo
} from '../workflow/index.js';
import type { ConfigItem, ConfigItemType, ConfigScope, ScanResult, ComposableProfile } from '../types.js';
import type { MCPServerDefinition, MCPServerCategory } from '../mcp/types.js';
import {
  isValidName,
  validateProjectPath,
  getNameValidationError,
  getPathValidationError
} from '../utils/validation.js';

const program = new Command();

// ============================================================================
// Input Validation Helpers (P0 Security)
// ============================================================================

/**
 * Validate server/skill name and exit if invalid
 */
function validateNameOrExit(name: string, fieldName: string = 'name'): boolean {
  if (!isValidName(name)) {
    console.log(chalk.red(`Invalid ${fieldName}: ${getNameValidationError(name, fieldName)}`));
    return false;
  }
  return true;
}

/**
 * Validate project path and return normalized path or null
 */
function validateProjectPathOrWarn(projectPath: string): string | null {
  const validated = validateProjectPath(projectPath);
  if (!validated) {
    console.log(chalk.red(`Invalid project path: ${getPathValidationError(projectPath)}`));
    return null;
  }
  return validated;
}

/**
 * Print a labeled list of items (Ashkenas-style helper for DRY output)
 */
function printList(
  title: string,
  items: string[],
  color: typeof chalk.green,
  icon: string
): void {
  if (items.length === 0) return;
  console.log(color(`\n${title}:`));
  items.forEach(item => console.log(color(`  ${icon} ${item}`)));
}

program
  .name('cc-config')
  .description('Claude Code configuration manager')
  .version('0.1.0');

// Scan command
program
  .command('scan')
  .description('Scan and discover all Claude Code configuration')
  .option('-p, --project <path>', 'Project path to scan', process.cwd())
  .option('--no-plugins', 'Skip scanning plugins')
  .action(async (options) => {
    console.log(chalk.blue('Scanning Claude Code configuration...\n'));

    const result = await scan({
      projectPath: options.project,
      includePlugins: options.plugins
    });

    printScanSummary(result);
  });

// List command
program
  .command('list [type]')
  .description('List configuration items')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('-s, --scope <scope>', 'Filter by scope (global, project, plugin)')
  .option('--tokens', 'Sort by token count')
  .action(async (type, options) => {
    const result = await scan({ projectPath: options.project });

    let items = result.items;

    // Filter by type
    if (type) {
      items = items.filter(i => i.type === type);
    }

    // Filter by scope
    if (options.scope) {
      items = items.filter(i => i.scope === options.scope);
    }

    // Sort
    if (options.tokens) {
      items.sort((a, b) => b.tokens - a.tokens);
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    printItemList(items, result.summary.totalTokens);
  });

// Show command
program
  .command('show <name>')
  .description('Show details of a configuration item')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action(async (name, options) => {
    const result = await scan({ projectPath: options.project });
    const item = result.items.find(i => i.name === name);

    if (!item) {
      console.log(chalk.red(`Item not found: ${name}`));
      console.log(chalk.gray('Available items:'));
      result.items.forEach(i => console.log(chalk.gray(`  - ${i.name} (${i.type})`)));
      return;
    }

    printItemDetails(item, result);
  });

// Audit command
program
  .command('audit')
  .description('Run configuration audit')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action(async (options) => {
    const result = await scan({ projectPath: options.project });
    printAuditReport(result);
  });

// Tokens command
program
  .command('tokens')
  .description('Show token usage breakdown')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action(async (options) => {
    const result = await scan({ projectPath: options.project });
    printTokenBreakdown(result);
  });

// Dependencies command
program
  .command('deps')
  .description('Show dependency graph')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action(async (options) => {
    const result = await scan({ projectPath: options.project });
    printDependencies(result);
  });

// Profile commands
const profileCmd = program.command('profile').description('Manage configuration profiles');

profileCmd
  .command('list')
  .description('List available profiles')
  .action(() => {
    const profiles = listProfiles();

    if (profiles.length === 0) {
      console.log(chalk.gray('No profiles found.'));
      console.log(chalk.gray(`Create one with: cc-config profile create <name>`));
      return;
    }

    console.log(chalk.bold('\nAvailable Profiles:\n'));
    for (const profile of profiles) {
      const composable = profile.composable ? chalk.green(' [composable]') : '';
      console.log(`  ${chalk.cyan(profile.name)}${composable}`);
      if (profile.description) {
        console.log(chalk.gray(`    ${profile.description}`));
      }
      // Count skills across all categories
      const skillCount = Object.values(profile.skills || {}).flat().length;
      const agentCount = profile.agents?.length || 0;
      console.log(chalk.gray(`    Skills: ${skillCount}, Agents: ${agentCount}`));
    }

    console.log(chalk.gray('\nTip: Combine profiles with + syntax:'));
    console.log(chalk.gray('  cc-config profile apply base-tech+javascript+react /path/to/project'));
  });

profileCmd
  .command('show <name>')
  .description('Show profile details (supports + syntax to preview combined profiles)')
  .action((name) => {
    // Check if this is a combined profile request
    const profileNames = parseProfileString(name);
    let profile: ComposableProfile | null;

    if (profileNames.length > 1) {
      profile = combineProfiles(profileNames);
      if (!profile) {
        console.log(chalk.red(`One or more profiles not found in: ${name}`));
        const available = listProfiles().map(p => p.name);
        console.log(chalk.gray(`Available: ${available.join(', ')}`));
        return;
      }
    } else {
      profile = getProfile(name);
      if (!profile) {
        console.log(chalk.red(`Profile not found: ${name}`));
        const available = listProfiles().map(p => p.name);
        console.log(chalk.gray(`Available: ${available.join(', ')}`));
        return;
      }
    }

    console.log(chalk.bold(`\n${profile.name}`));
    console.log(chalk.gray('─'.repeat(50)));

    if (profile.description) {
      console.log(`Description: ${profile.description}\n`);
    }

    // Show skills by category
    if (profile.skills) {
      const categories = ['security', 'tech', 'canon', 'global'] as const;
      for (const category of categories) {
        const skills = profile.skills[category];
        if (skills && skills.length > 0) {
          const categoryColors: Record<string, typeof chalk.red> = {
            security: chalk.red,
            tech: chalk.yellow,
            canon: chalk.blue,
            global: chalk.green
          };
          const color = categoryColors[category] || chalk.white;
          console.log(color(`Skills (${category}):`));
          skills.forEach(s => console.log(`  • ${s}`));
        }
      }
    }

    if (profile.commands && profile.commands.length > 0) {
      console.log(chalk.cyan('\nCommands:'));
      profile.commands.forEach(c => console.log(`  • ${c}`));
    }

    if (profile.agents && profile.agents.length > 0) {
      console.log(chalk.cyan('\nAgents:'));
      profile.agents.forEach(a => console.log(`  • ${a}`));
    }

    if (profile.claudeMd?.autoInvoke?.length) {
      console.log(chalk.cyan('\nAuto-invoke rules:'));
      profile.claudeMd.autoInvoke.forEach(ai =>
        console.log(`  ${ai.context} → ${ai.action}`)
      );
    }
  });

profileCmd
  .command('create <name>')
  .description('Create a new profile (starts with example template)')
  .action((name) => {
    const profile: ComposableProfile = { ...exampleComposableProfile, name };
    saveProfile(profile);
    console.log(chalk.green(`Created profile: ${name}`));
    console.log(chalk.gray(`Edit at: ~/.claude/profiles/${name.toLowerCase().replace(/\s+/g, '-')}.yaml`));
  });

profileCmd
  .command('apply <profiles>')
  .description('Apply profile(s) to a project. Use + to combine: base-tech+javascript+react')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('--dry-run', 'Show what would be done without making changes')
  .action(async (profiles, options) => {
    // Parse profile string (supports + syntax)
    const profileNames = parseProfileString(profiles);
    let profile: ComposableProfile | null;

    if (profileNames.length > 1) {
      // Combine multiple profiles
      profile = combineProfiles(profileNames);
      if (!profile) {
        console.log(chalk.red(`One or more profiles not found in: ${profiles}`));
        const available = listProfiles().map(p => p.name);
        console.log(chalk.gray(`Available: ${available.join(', ')}`));
        return;
      }
      console.log(chalk.blue(`Combining profiles: ${profileNames.join(' + ')}\n`));
    } else {
      profile = getProfile(profileNames[0]);
      if (!profile) {
        console.log(chalk.red(`Profile not found: ${profileNames[0]}`));
        const available = listProfiles().map(p => p.name);
        console.log(chalk.gray(`Available: ${available.join(', ')}`));
        return;
      }
    }

    if (options.dryRun) {
      console.log(chalk.yellow('DRY RUN - No changes will be made\n'));
      console.log(chalk.bold('Would apply:'));
      console.log(`  Profile: ${profile.name}`);
      console.log(`  Project: ${options.project}`);

      if (profile.skills) {
        for (const [category, skills] of Object.entries(profile.skills)) {
          if (skills && skills.length > 0) {
            console.log(`  Skills (${category}): ${skills.join(', ')}`);
          }
        }
      }
      if (profile.agents?.length) {
        console.log(`  Agents: ${profile.agents.join(', ')}`);
      }
      if (profile.claudeMd?.autoInvoke?.length) {
        console.log(`  Auto-invoke rules: ${profile.claudeMd.autoInvoke.length}`);
      }
      return;
    }

    console.log(chalk.blue(`Applying profile "${profile.name}" to ${options.project}...\n`));

    const result = await applyComposableProfile(profile, options.project);

    // Print results using helper (Ashkenas: DRY)
    printList('Created', result.created, chalk.green, '+');
    printList('Linked', result.linked, chalk.cyan, '→');
    printList('Skipped', result.skipped, chalk.gray, '-');
    printList('Errors', result.errors, chalk.red, '✗');

    if (result.errors.length === 0) {
      console.log(chalk.green('\nProfile applied successfully!'));
    } else {
      console.log(chalk.yellow('\nProfile applied with some errors.'));
    }
  });

// MCP Registry commands
const mcpCmd = program.command('mcp').description('Manage MCP server registry');

mcpCmd
  .command('list')
  .description('List all servers in the registry')
  .option('-p, --project <path>', 'Project path (default: global)')
  .option('--installed', 'Show only installed servers')
  .option('--category <category>', 'Filter by category')
  .option('--enabled', 'Show only enabled servers')
  .action((options) => {
    const projectPath = options.project;
    if (options.installed || options.enabled) {
      // Show installed servers
      const installed = listInstalledServers(projectPath);

      if (installed.length === 0) {
        console.log(chalk.gray('No MCP servers installed.'));
        console.log(chalk.gray('Install from registry with: cc-config mcp install <server>'));
        return;
      }

      console.log(chalk.bold('\nInstalled MCP Servers:\n'));

      const filtered = options.enabled
        ? installed.filter(s => s.enabled)
        : installed;

      for (const server of filtered) {
        const status = server.enabled
          ? chalk.green('✓ enabled')
          : chalk.gray('○ disabled');
        console.log(`  ${chalk.cyan(server.name)} ${status}`);
        console.log(chalk.gray(`    ${server.config.type} - ${server.config.command || server.config.url}`));
      }
    } else {
      // Show registry servers
      const filters = options.category
        ? { category: options.category as MCPServerCategory }
        : undefined;
      const servers = listServers(filters);

      if (servers.length === 0) {
        console.log(chalk.gray('No servers found in registry.'));
        console.log(chalk.gray(`Registry path: ${getRegistryPath()}`));
        return;
      }

      console.log(chalk.bold('\nMCP Server Registry:\n'));

      // Group by category
      const byCategory = new Map<string, MCPServerDefinition[]>();
      for (const server of servers) {
        const cat = server.category;
        if (!byCategory.has(cat)) {
          byCategory.set(cat, []);
        }
        byCategory.get(cat)!.push(server);
      }

      for (const [category, categoryServers] of byCategory) {
        console.log(chalk.yellow(`  ${category.toUpperCase()}`));

        for (const server of categoryServers) {
          const installed = isServerInstalled(server.name, projectPath);
          const enabled = isServerEnabled(server.name, projectPath);

          let status = '';
          if (enabled) {
            status = chalk.green(' [enabled]');
          } else if (installed) {
            status = chalk.blue(' [installed]');
          }

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

      // Show categories
      const categories = listCategories();
      if (categories.length > 0) {
        console.log(chalk.gray(`Categories: ${categories.join(', ')}`));
      }
    }
  });

mcpCmd
  .command('show <server>')
  .description('Show server details including required env vars')
  .option('-p, --project <path>', 'Project path (default: global)')
  .action((serverName, options) => {
    const projectPath = options.project;
    const server = getServer(serverName);

    if (!server) {
      console.log(chalk.red(`Server not found in registry: ${serverName}`));
      const available = listServers().map(s => s.name);
      console.log(chalk.gray(`Available: ${available.slice(0, 10).join(', ')}${available.length > 10 ? '...' : ''}`));
      return;
    }

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

    // Show env var status
    if (server.requiredEnv?.length) {
      console.log(chalk.cyan('\nRequired Environment Variables:'));
      for (const envVar of server.requiredEnv) {
        const isSet = process.env[envVar];
        const status = isSet ? chalk.green('✓ set') : chalk.red('✗ not set');
        console.log(`  ${envVar}: ${status}`);
      }
    }

    if (server.env) {
      console.log(chalk.cyan('\nEnvironment Config:'));
      for (const [key, value] of Object.entries(server.env)) {
        console.log(`  ${key}: ${chalk.gray(value)}`);
      }
    }

    // Installation status
    const installed = isServerInstalled(server.name, projectPath);
    const enabled = isServerEnabled(server.name, projectPath);
    const configPath = getMcpConfigPath(projectPath);

    console.log(chalk.cyan('\nStatus:'));
    console.log(`  Installed: ${installed ? chalk.green('yes') : chalk.gray('no')}`);
    console.log(`  Enabled:   ${enabled ? chalk.green('yes') : chalk.gray('no')}`);
    console.log(`  Config:    ${chalk.gray(configPath)}`);
  });

mcpCmd
  .command('install <server>')
  .description('Install a server from the registry to project .mcp.json')
  .option('-p, --project <path>', 'Project path (default: current directory)', process.cwd())
  .option('--category <category>', 'Install all servers in a category')
  .option('--skip-env-check', 'Skip environment variable validation')
  .action((serverName, options) => {
    // P0: Input validation
    if (!validateNameOrExit(serverName, 'server name')) return;
    const projectPath = validateProjectPathOrWarn(options.project);
    if (!projectPath) return;

    if (options.category) {
      // Install all servers in category
      const servers = listServers({ category: options.category as MCPServerCategory });

      if (servers.length === 0) {
        console.log(chalk.red(`No servers found in category: ${options.category}`));
        return;
      }

      console.log(chalk.blue(`Installing ${servers.length} servers from category: ${options.category}\n`));
      console.log(chalk.gray(`Config: ${getMcpConfigPath(projectPath)}\n`));

      for (const server of servers) {
        const result = installServer(server.name, { skipEnvCheck: options.skipEnvCheck, projectPath });
        if (result.success) {
          console.log(chalk.green(`  ✓ ${server.name}`));
        } else {
          console.log(chalk.red(`  ✗ ${server.name}: ${result.message}`));
        }
      }
    } else {
      const result = installServer(serverName, { skipEnvCheck: options.skipEnvCheck, projectPath });

      if (result.success) {
        console.log(chalk.green(result.message));
        console.log(chalk.gray(`Config: ${getMcpConfigPath(projectPath)}`));
        if (result.warnings?.length) {
          result.warnings.forEach(w => console.log(chalk.yellow(`  Warning: ${w}`)));
        }
        console.log(chalk.gray(`Enable with: cc-config mcp enable ${serverName} -p ${projectPath}`));
      } else {
        console.log(chalk.red(result.message));
        if (result.warnings?.length) {
          result.warnings.forEach(w => console.log(chalk.yellow(`  ${w}`)));
        }
      }
    }
  });

mcpCmd
  .command('uninstall <server>')
  .description('Remove a server from mcp.json')
  .option('-p, --project <path>', 'Project path (default: current directory)', process.cwd())
  .action((serverName, options) => {
    // P0: Input validation
    if (!validateNameOrExit(serverName, 'server name')) return;
    const projectPath = validateProjectPathOrWarn(options.project);
    if (!projectPath) return;

    const result = uninstallServer(serverName, projectPath);

    if (result.success) {
      console.log(chalk.green(result.message));
    } else {
      console.log(chalk.red(result.message));
    }
  });

mcpCmd
  .command('enable <server>')
  .description('Add server to enabledMcpjsonServers in settings.json')
  .option('-p, --project <path>', 'Project path (default: current directory)', process.cwd())
  .action((serverName, options) => {
    // P0: Input validation
    if (!validateNameOrExit(serverName, 'server name')) return;
    const projectPath = validateProjectPathOrWarn(options.project);
    if (!projectPath) return;

    const result = enableServer(serverName, projectPath);

    if (result.success) {
      console.log(chalk.green(result.message));
      if (result.warnings?.length) {
        result.warnings.forEach(w => console.log(chalk.yellow(`  Warning: ${w}`)));
      }
    } else {
      console.log(chalk.red(result.message));
    }
  });

mcpCmd
  .command('disable <server>')
  .description('Remove server from enabledMcpjsonServers in settings.json')
  .option('-p, --project <path>', 'Project path (default: current directory)', process.cwd())
  .action((serverName, options) => {
    // P0: Input validation
    if (!validateNameOrExit(serverName, 'server name')) return;
    const projectPath = validateProjectPathOrWarn(options.project);
    if (!projectPath) return;

    const result = disableServer(serverName, projectPath);

    if (result.success) {
      console.log(chalk.green(result.message));
    } else {
      console.log(chalk.red(result.message));
    }
  });

mcpCmd
  .command('check [server]')
  .description('Verify required env vars are set')
  .option('-p, --project <path>', 'Project path (default: current directory)', process.cwd())
  .option('--all', 'Check all installed servers')
  .action((serverName, options) => {
    if (options.all || !serverName) {
      const results = checkAllServers(options.project);

      if (results.length === 0) {
        console.log(chalk.gray('No installed servers to check.'));
        return;
      }

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

      if (allOk) {
        console.log(chalk.green('\nAll servers have required env vars set.'));
      } else {
        console.log(chalk.yellow('\nSet missing env vars in your shell configuration.'));
      }
    } else {
      const result = checkServer(serverName);

      if (result.ok) {
        console.log(chalk.green(`✓ ${serverName}: All required env vars are set`));
        if (result.found.length > 0) {
          result.found.forEach(v => console.log(chalk.gray(`  ${v}: ✓`)));
        }
      } else {
        console.log(chalk.red(`✗ ${serverName}: Missing required env vars`));
        result.missing.forEach(v => console.log(chalk.red(`  ${v}: not set`)));
        console.log(chalk.yellow(`\nSet these in your shell: export ${result.missing[0]}=your_value`));
      }
    }
  });

mcpCmd
  .command('add <name> <command>')
  .description('Add a custom server to the registry')
  .option('-a, --args <args>', 'Command arguments (comma-separated)')
  .option('-c, --category <category>', 'Server category', 'other')
  .option('-d, --description <description>', 'Server description')
  .option('-e, --env <env>', 'Environment variables (KEY=${VAR} format, comma-separated)')
  .option('-r, --required-env <vars>', 'Required env vars (comma-separated)')
  .action((name, command, options) => {
    ensureRegistryDir();

    const server: MCPServerDefinition = {
      name,
      command,
      type: 'stdio',
      category: options.category as MCPServerCategory,
      source: 'custom',
      description: options.description
    };

    if (options.args) {
      server.args = options.args.split(',').map((a: string) => a.trim());
    }

    if (options.env) {
      server.env = {};
      const pairs = options.env.split(',');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          server.env[key.trim()] = value.trim();
        }
      }
    }

    if (options.requiredEnv) {
      server.requiredEnv = options.requiredEnv.split(',').map((v: string) => v.trim());
    }

    addServerToRegistry(server);
    console.log(chalk.green(`Added server to registry: ${name}`));
    console.log(chalk.gray(`Registry file: ${getRegistryPath()}/${name}.yaml`));
  });

// Canon commands - copy-with-manifest skill management
const canonCmd = program.command('canon').description('Manage canon skills (copy-with-manifest system)');

canonCmd
  .command('list')
  .description('List all available canon skills from source')
  .option('--category <category>', 'Filter by category')
  .action((options) => {
    const skills = listCanonSkills();

    if (skills.length === 0) {
      console.log(chalk.gray('No canon skills found.'));
      const sourceInfo = getCanonSourceInfo();
      console.log(chalk.gray(`Source path: ${sourceInfo.path}`));
      return;
    }

    const sourceInfo = getCanonSourceInfo();
    console.log(chalk.bold('\nAvailable Canon Skills'));
    console.log(chalk.gray(`Source: ${sourceInfo.path}`));
    if (sourceInfo.commit) {
      console.log(chalk.gray(`Commit: ${sourceInfo.commit}`));
    }
    console.log(chalk.gray('─'.repeat(50)));

    // Filter by category if specified
    let filtered = skills;
    if (options.category) {
      filtered = skills.filter(s => s.category === options.category);
    }

    // Group by category
    const byCategory = new Map<string, typeof skills>();
    for (const skill of filtered) {
      const cat = skill.category || 'root';
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat)!.push(skill);
    }

    for (const [category, categorySkills] of byCategory) {
      console.log(chalk.yellow(`\n  ${category.toUpperCase()}`));
      for (const skill of categorySkills) {
        console.log(`    ${chalk.cyan(skill.name)}`);
      }
    }

    console.log(chalk.gray(`\nTotal: ${filtered.length} skills`));
  });

canonCmd
  .command('status')
  .description('Show installed skills vs source (current/outdated/modified)')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action((options) => {
    const statuses = checkSkillStatus(options.project);
    const sourceInfo = getCanonSourceInfo();

    if (statuses.length === 0) {
      console.log(chalk.gray('No skills installed in this project.'));
      console.log(chalk.gray(`Install with: cc-config canon install <skill> -p ${options.project}`));
      return;
    }

    console.log(chalk.bold('\nCanon Skills Status'));
    console.log(chalk.gray(`Source: ${sourceInfo.path} @ ${sourceInfo.commit || 'unknown'}`));
    console.log(chalk.gray('─'.repeat(60)));

    const statusIcons: Record<string, string> = {
      current: chalk.green('✓ current'),
      outdated: chalk.yellow('⚠ outdated'),
      modified: chalk.blue('✎ modified'),
      missing: chalk.red('✗ missing'),
      unknown: chalk.gray('? unknown')
    };

    for (const status of statuses) {
      const icon = statusIcons[status.status] || status.status;
      const commit = status.installedCommit ? chalk.gray(`(${status.installedCommit})`) : '';
      const arrow = status.status === 'outdated' && status.sourceCommit
        ? chalk.gray(` → ${status.sourceCommit}`)
        : '';
      console.log(`  ${status.name.padEnd(20)} ${icon} ${commit}${arrow}`);
    }

    const outdated = statuses.filter(s => s.status === 'outdated').length;
    const modified = statuses.filter(s => s.status === 'modified').length;

    if (outdated > 0) {
      console.log(chalk.yellow(`\nRun 'cc-config canon upgrade -p ${options.project}' to update ${outdated} skill(s)`));
    }
    if (modified > 0) {
      console.log(chalk.blue(`\n${modified} skill(s) have local modifications`));
    }
  });

canonCmd
  .command('install <skill>')
  .description('Install a skill from canon source to project')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('-f, --force', 'Overwrite existing skill')
  .action((skill, options) => {
    // P0: Input validation
    if (!validateNameOrExit(skill, 'skill name')) return;
    const projectPath = validateProjectPathOrWarn(options.project);
    if (!projectPath) return;

    const result = copySkill(skill, projectPath, { force: options.force });

    if (result.success) {
      console.log(chalk.green(result.message));
      console.log(chalk.gray(`Installed to: ${projectPath}/.claude/skills/${skill}/`));
    } else {
      console.log(chalk.red(result.message));
    }
  });

canonCmd
  .command('upgrade')
  .description('Copy updated skills from source (preserves local mods without --force)')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('-f, --force', 'Overwrite even if locally modified')
  .option('-s, --skills <skills>', 'Comma-separated list of specific skills to upgrade')
  .action((options) => {
    const skillList = options.skills ? options.skills.split(',').map((s: string) => s.trim()) : undefined;

    const result = upgradeSkills(options.project, {
      force: options.force,
      skills: skillList
    });

    // Print results using helper (Ashkenas: DRY)
    printList('Upgraded', result.upgraded, chalk.green, '✓');
    printList('Skipped', result.skipped, chalk.yellow, '-');
    printList('Errors', result.errors, chalk.red, '✗');

    if (result.upgraded.length === 0 && result.errors.length === 0) {
      console.log(chalk.gray('All skills are current.'));
    }
  });

canonCmd
  .command('diff <skill>')
  .description('Show diff between installed and source skill')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action((skill, options) => {
    const diff = diffSkill(skill, options.project);

    if (!diff) {
      console.log(chalk.gray('Could not generate diff'));
      return;
    }

    console.log(chalk.bold(`\nDiff: ${skill}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(diff);
  });

canonCmd
  .command('source')
  .description('Show canon source path and info')
  .action(() => {
    const info = getCanonSourceInfo();

    console.log(chalk.bold('\nCanon Source'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Path:   ${chalk.cyan(info.path)}`);
    console.log(`Commit: ${info.commit ? chalk.yellow(info.commit) : chalk.gray('unknown')}`);
    console.log(`Remote: ${info.remote || chalk.gray('none')}`);
  });

// Workflow commands - universal workflow skills (not canon)
const workflowCmd = program.command('workflow').description('Manage workflow skills (universal patterns, not canon)');

workflowCmd
  .command('list')
  .description('List all available workflow skills from source')
  .action(() => {
    const skills = listWorkflowSkills();

    if (skills.length === 0) {
      console.log(chalk.gray('No workflow skills found.'));
      const sourceInfo = getWorkflowSourceInfo();
      console.log(chalk.gray(`Source path: ${sourceInfo.path}`));
      return;
    }

    const sourceInfo = getWorkflowSourceInfo();
    console.log(chalk.bold('\nAvailable Workflow Skills'));
    console.log(chalk.gray(`Source: ${sourceInfo.path}`));
    if (sourceInfo.commit) {
      console.log(chalk.gray(`Commit: ${sourceInfo.commit}`));
    }
    console.log(chalk.gray('─'.repeat(50)));

    for (const skill of skills) {
      console.log(`  ${chalk.cyan(skill.name)}`);
      if (skill.description) {
        console.log(chalk.gray(`    ${skill.description}`));
      }
    }

    console.log(chalk.gray(`\nTotal: ${skills.length} skills`));
  });

workflowCmd
  .command('status')
  .description('Show installed workflow skills status')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .action((options) => {
    const statuses = checkWorkflowStatus(options.project);
    const sourceInfo = getWorkflowSourceInfo();

    if (statuses.length === 0) {
      console.log(chalk.gray('No workflow skills installed in this project.'));
      console.log(chalk.gray(`Install with: cc-config workflow install <skill> -p ${options.project}`));
      console.log(chalk.gray(`Or install all: cc-config workflow install --all -p ${options.project}`));
      return;
    }

    console.log(chalk.bold('\nWorkflow Skills Status'));
    console.log(chalk.gray(`Source: ${sourceInfo.path} @ ${sourceInfo.commit || 'unknown'}`));
    console.log(chalk.gray('─'.repeat(60)));

    const statusIcons: Record<string, string> = {
      current: chalk.green('✓ current'),
      outdated: chalk.yellow('⚠ outdated'),
      modified: chalk.blue('✎ modified'),
      missing: chalk.red('✗ missing'),
      unknown: chalk.gray('? unknown')
    };

    for (const status of statuses) {
      const icon = statusIcons[status.status] || status.status;
      const commit = status.installedCommit ? chalk.gray(`(${status.installedCommit})`) : '';
      const arrow = status.status === 'outdated' && status.sourceCommit
        ? chalk.gray(` → ${status.sourceCommit}`)
        : '';
      console.log(`  ${status.name.padEnd(20)} ${icon} ${commit}${arrow}`);
    }

    const outdated = statuses.filter(s => s.status === 'outdated').length;
    const modified = statuses.filter(s => s.status === 'modified').length;

    if (outdated > 0) {
      console.log(chalk.yellow(`\nRun 'cc-config workflow upgrade -p ${options.project}' to update ${outdated} skill(s)`));
    }
    if (modified > 0) {
      console.log(chalk.blue(`\n${modified} skill(s) have local modifications`));
    }
  });

workflowCmd
  .command('install [skill]')
  .description('Install workflow skill(s) to a project')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('-a, --all', 'Install all workflow skills')
  .option('-f, --force', 'Overwrite existing skills')
  .action((skill, options) => {
    // P0: Input validation for project path
    const projectPath = validateProjectPathOrWarn(options.project);
    if (!projectPath) return;

    if (options.all) {
      console.log(chalk.blue(`Installing all workflow skills to ${projectPath}...\n`));
      const result = installAllWorkflowSkills(projectPath, { force: options.force });

      // Print results using helper (Ashkenas: DRY)
      printList('Installed', result.installed, chalk.green, '✓');
      printList('Skipped', result.skipped, chalk.yellow, '-');
      printList('Errors', result.errors, chalk.red, '✗');

      console.log(chalk.gray(`\nInstalled to: ${projectPath}/.claude/skills/`));
    } else if (skill) {
      // P0: Validate skill name
      if (!validateNameOrExit(skill, 'skill name')) return;

      const result = installWorkflowSkill(skill, projectPath, { force: options.force });

      if (result.success) {
        console.log(chalk.green(result.message));
        console.log(chalk.gray(`Installed to: ${projectPath}/.claude/skills/${skill}/`));
      } else {
        console.log(chalk.red(result.message));
      }
    } else {
      console.log(chalk.red('Specify a skill name or use --all'));
      console.log(chalk.gray('Available skills:'));
      const skills = listWorkflowSkills();
      skills.forEach(s => console.log(chalk.gray(`  - ${s.name}`)));
    }
  });

workflowCmd
  .command('upgrade')
  .description('Upgrade outdated workflow skills')
  .option('-p, --project <path>', 'Project path', process.cwd())
  .option('-f, --force', 'Overwrite even if locally modified')
  .option('-s, --skills <skills>', 'Comma-separated list of specific skills')
  .action((options) => {
    const skillList = options.skills ? options.skills.split(',').map((s: string) => s.trim()) : undefined;

    const result = upgradeWorkflowSkills(options.project, {
      force: options.force,
      skills: skillList
    });

    // Print results using helper (Ashkenas: DRY)
    printList('Upgraded', result.upgraded, chalk.green, '✓');
    printList('Skipped', result.skipped, chalk.yellow, '-');
    printList('Errors', result.errors, chalk.red, '✗');

    if (result.upgraded.length === 0 && result.errors.length === 0) {
      console.log(chalk.gray('All workflow skills are current.'));
    }
  });

workflowCmd
  .command('source')
  .description('Show workflow skills source path')
  .action(() => {
    const info = getWorkflowSourceInfo();

    console.log(chalk.bold('\nWorkflow Skills Source'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Path:   ${chalk.cyan(info.path)}`);
    console.log(`Commit: ${info.commit ? chalk.yellow(info.commit) : chalk.gray('unknown')}`);
    console.log(`Remote: ${info.remote || chalk.gray('none')}`);
  });

// Print helpers
function printScanSummary(result: ScanResult) {
  const { summary } = result;

  console.log(chalk.bold('Configuration Summary'));
  console.log(chalk.gray('─'.repeat(50)));

  console.log(`\n${chalk.cyan('Locations:')}`);
  console.log(`  Global: ${result.globalPath}`);
  if (result.projectPath) {
    console.log(`  Project: ${result.projectPath}`);
  }

  console.log(`\n${chalk.cyan('Items by Type:')}`);
  const types: ConfigItemType[] = ['skill', 'command', 'agent', 'memory', 'settings'];
  for (const type of types) {
    const count = summary.byType[type];
    if (count > 0) {
      console.log(`  ${type.padEnd(10)} ${chalk.yellow(count.toString())}`);
    }
  }

  console.log(`\n${chalk.cyan('Items by Scope:')}`);
  const scopes: ConfigScope[] = ['global', 'project', 'plugin'];
  for (const scope of scopes) {
    const count = summary.byScope[scope];
    const tokens = summary.tokensByScope[scope];
    if (count > 0) {
      console.log(`  ${scope.padEnd(10)} ${chalk.yellow(count.toString().padStart(3))} items, ${chalk.magenta(formatTokens(tokens).padStart(6))} tokens`);
    }
  }

  console.log(`\n${chalk.cyan('Total Tokens:')} ${chalk.bold.magenta(formatTokens(summary.totalTokens))}`);

  // Warnings
  if (summary.conflicts.length > 0) {
    console.log(`\n${chalk.yellow('⚠ Conflicts:')} ${summary.conflicts.length} items with same name in multiple scopes`);
  }

  if (summary.missingReferences.length > 0) {
    console.log(`${chalk.red('✗ Missing:')} ${summary.missingReferences.length} referenced items not found`);
  }

  if (summary.unusedItems.length > 0) {
    console.log(`${chalk.gray('○ Unused:')} ${summary.unusedItems.length} skills not referenced anywhere`);
  }
}

function printItemList(items: ConfigItem[], totalTokens: number) {
  if (items.length === 0) {
    console.log(chalk.gray('No items found'));
    return;
  }

  const scopeColors: Record<ConfigScope, typeof chalk.blue> = {
    global: chalk.blue,
    project: chalk.green,
    plugin: chalk.magenta
  };

  const typeIcons: Record<ConfigItemType, string> = {
    skill: '⚡',
    command: '/',
    agent: '🤖',
    memory: '📄',
    settings: '⚙️',
    hook: '🪝',
    mcp: '🔌'
  };

  console.log(chalk.bold(`\nFound ${items.length} items:\n`));

  for (const item of items) {
    const icon = typeIcons[item.type] || '•';
    const scopeColor = scopeColors[item.scope];
    const scopeLabel = scopeColor(`[${item.scope}]`.padEnd(10));
    const tokenPct = tokenPercentage(item.tokens, totalTokens);

    let name = item.name;
    if (item.isSymlink) {
      name += chalk.gray(' →');
    }

    console.log(
      `${icon} ${scopeLabel} ${name.padEnd(25)} ${chalk.magenta(formatTokens(item.tokens).padStart(6))} (${tokenPct})`
    );
  }
}

function printItemDetails(item: ConfigItem, result: ScanResult) {
  console.log(chalk.bold(`\n${item.name}`));
  console.log(chalk.gray('─'.repeat(50)));

  console.log(`Type:     ${chalk.cyan(item.type)}`);
  console.log(`Scope:    ${chalk.blue(item.scope)}`);
  console.log(`Path:     ${chalk.gray(item.path)}`);

  if (item.isSymlink) {
    console.log(`Symlink:  ${chalk.yellow('→')} ${item.symlinkTarget}`);
  }

  console.log(`Tokens:   ${chalk.magenta(formatTokens(item.tokens))} (${tokenPercentage(item.tokens, result.summary.totalTokens)} of total)`);

  if (item.metadata.description) {
    console.log(`\nDescription: ${item.metadata.description}`);
  }

  if (item.dependencies.length > 0) {
    console.log(`\n${chalk.cyan('Dependencies:')}`);
    item.dependencies.forEach(dep => console.log(`  → ${dep}`));
  }

  if (item.referencedBy.length > 0) {
    console.log(`\n${chalk.cyan('Referenced by:')}`);
    item.referencedBy.forEach(ref => console.log(`  ← ${ref}`));
  }
}

function printAuditReport(result: ScanResult) {
  const { summary } = result;

  console.log(chalk.bold('\nConfiguration Audit Report'));
  console.log(chalk.gray('═'.repeat(50)));

  // Claude-Optimal Pattern Check
  console.log(`\n${chalk.cyan('Claude-Optimal Patterns')}:`);

  const projectSkills = result.items
    .filter(i => i.type === 'skill' && i.scope === 'project')
    .map(i => i.name);

  // Check for STRATEGY.md (in .claude directory)
  const strategyPath = result.projectPath
    ? `${result.projectPath}/.claude/STRATEGY.md`
    : null;
  const hasStrategy = result.items.some(i =>
    i.name === 'STRATEGY.md' || i.path.includes('STRATEGY.md')
  ) || (strategyPath && fs.existsSync(strategyPath));
  console.log(hasStrategy
    ? chalk.green('  ✓ STRATEGY.md present')
    : chalk.yellow('  ○ STRATEGY.md missing - consider adding configuration rationale')
  );

  // Check for base canon skills
  const baseCanon = ['kernighan', 'owasp', 'dodds'];
  const missingBaseCanon = baseCanon.filter(s => !projectSkills.includes(s));
  if (missingBaseCanon.length === 0) {
    console.log(chalk.green('  ✓ Base canon complete (kernighan, owasp, dodds)'));
  } else {
    console.log(chalk.yellow(`  ○ Base canon missing: ${missingBaseCanon.join(', ')}`));
  }

  // Check for security skills
  const securitySkills = ['security-mindset', 'bruce-schneier', 'owasp', 'tanya-janca', 'troy-hunt'];
  const hasSecuritySkills = securitySkills.filter(s => projectSkills.includes(s));
  if (hasSecuritySkills.length >= 2) {
    console.log(chalk.green(`  ✓ Security skills present (${hasSecuritySkills.length}/5)`));
  } else {
    console.log(chalk.yellow(`  ○ Security skills sparse (${hasSecuritySkills.length}/5) - consider adding more`));
  }

  // Check for quality flags in CLAUDE.md
  const claudeMdContent = result.items.find(i =>
    i.type === 'memory' && i.scope === 'project' && i.name === 'CLAUDE.md'
  )?.content || '';

  const hasStructureFirst = claudeMdContent.includes('--structure-first');
  const hasReviewHard = claudeMdContent.includes('--review-hard');
  const hasRefactorClean = claudeMdContent.includes('--refactor-clean');

  const flagCount = [hasStructureFirst, hasReviewHard, hasRefactorClean].filter(Boolean).length;
  if (flagCount === 3) {
    console.log(chalk.green('  ✓ Quality flags documented (--structure-first, --review-hard, --refactor-clean)'));
  } else if (flagCount > 0) {
    console.log(chalk.yellow(`  ○ Quality flags partial (${flagCount}/3) - consider documenting all flags`));
  } else {
    console.log(chalk.yellow('  ○ Quality flags not documented - add --structure-first, --review-hard, --refactor-clean'));
  }

  // Check for tech workflow skills
  const workflowSkills = ['understand-first', 'generate-validate', 'defense-in-depth', 'escalate', 'ceremony'];
  const hasWorkflowSkills = workflowSkills.filter(s => projectSkills.includes(s));
  if (hasWorkflowSkills.length >= 3) {
    console.log(chalk.green(`  ✓ Tech workflow skills present (${hasWorkflowSkills.length}/5)`));
  } else {
    console.log(chalk.yellow(`  ○ Tech workflow skills sparse (${hasWorkflowSkills.length}/5)`));
  }

  // Conflicts
  console.log(`\n${chalk.yellow('Conflicts')} (same name, different scopes):`);
  // Only show project-relevant conflicts
  const projectConflicts = summary.conflicts.filter(c =>
    c.locations.some(l => l.includes(result.projectPath || ''))
  );
  if (projectConflicts.length === 0) {
    console.log(chalk.green('  ✓ No project conflicts found'));
  } else {
    for (const conflict of projectConflicts) {
      console.log(`  ${chalk.red('✗')} ${conflict.name} (${conflict.type})`);
      conflict.locations.forEach(loc => console.log(chalk.gray(`      ${loc}`)));
    }
  }

  // Missing references
  console.log(`\n${chalk.red('Missing References')}:`);
  if (summary.missingReferences.length === 0) {
    console.log(chalk.green('  ✓ All references resolved'));
  } else {
    for (const missing of summary.missingReferences) {
      console.log(`  ${chalk.red('✗')} ${missing.referencedName} (${missing.referenceType})`);
      console.log(chalk.gray(`      Referenced in: ${missing.referencedIn}`));
    }
  }

  // Project skills summary
  console.log(`\n${chalk.cyan('Project Skills')} (${projectSkills.length} total):`);
  if (projectSkills.length > 0) {
    // Group by category
    const canonSkills = projectSkills.filter(s =>
      ['kernighan', 'bloch', 'cherny', 'gang-of-four', 'liskov', 'hevery', 'kurata',
       'minko-gechev', 'ben-lesh', 'kyle-simpson', 'dodds', 'owasp', 'bruce-schneier',
       'tanya-janca', 'troy-hunt', 'abramov', 'osmani'].includes(s)
    );
    const workflowSkillsFound = projectSkills.filter(s => workflowSkills.includes(s));
    const securitySkillsFound = projectSkills.filter(s => securitySkills.includes(s));
    const domainSkills = projectSkills.filter(s =>
      !canonSkills.includes(s) && !workflowSkillsFound.includes(s) && !securitySkillsFound.includes(s)
    );

    if (canonSkills.length > 0) {
      console.log(chalk.blue(`  Canon (${canonSkills.length}): ${canonSkills.join(', ')}`));
    }
    if (securitySkillsFound.length > 0) {
      console.log(chalk.red(`  Security (${securitySkillsFound.length}): ${securitySkillsFound.join(', ')}`));
    }
    if (workflowSkillsFound.length > 0) {
      console.log(chalk.yellow(`  Workflow (${workflowSkillsFound.length}): ${workflowSkillsFound.join(', ')}`));
    }
    if (domainSkills.length > 0) {
      console.log(chalk.green(`  Domain (${domainSkills.length}): ${domainSkills.join(', ')}`));
    }
  }

  // CLAUDE.md analysis
  console.log(`\n${chalk.cyan('CLAUDE.md Analysis')}:`);
  for (const claudeMd of result.claudeMds) {
    if (!claudeMd || claudeMd.scope !== 'project') continue;
    console.log(`\n  ${chalk.bold(claudeMd.path)}`);
    console.log(`    Auto-invoke rules: ${claudeMd.autoInvokes.length}`);
    console.log(`    Skill references:  ${claudeMd.skillReferences.length}`);

    if (claudeMd.autoInvokes.length > 0) {
      console.log(chalk.gray('    Rules:'));
      claudeMd.autoInvokes.forEach(ai => {
        console.log(chalk.gray(`      ${ai.context} → ${ai.skillName}`));
      });
    }
  }
}

function printTokenBreakdown(result: ScanResult) {
  const { summary, items } = result;

  console.log(chalk.bold('\nToken Usage Breakdown'));
  console.log(chalk.gray('═'.repeat(50)));

  console.log(`\nTotal: ${chalk.bold.magenta(formatTokens(summary.totalTokens))} tokens\n`);

  // By scope
  console.log(chalk.cyan('By Scope:'));
  const scopes: ConfigScope[] = ['global', 'project', 'plugin'];
  for (const scope of scopes) {
    const tokens = summary.tokensByScope[scope];
    if (tokens > 0) {
      const bar = createBar(tokens, summary.totalTokens, 30);
      console.log(`  ${scope.padEnd(10)} ${bar} ${formatTokens(tokens).padStart(6)} (${tokenPercentage(tokens, summary.totalTokens)})`);
    }
  }

  // By type
  console.log(`\n${chalk.cyan('By Type:')}`);
  const tokensByType: Record<string, number> = {};
  for (const item of items) {
    tokensByType[item.type] = (tokensByType[item.type] || 0) + item.tokens;
  }

  const sortedTypes = Object.entries(tokensByType).sort((a, b) => b[1] - a[1]);
  for (const [type, tokens] of sortedTypes) {
    const bar = createBar(tokens, summary.totalTokens, 30);
    console.log(`  ${type.padEnd(10)} ${bar} ${formatTokens(tokens).padStart(6)} (${tokenPercentage(tokens, summary.totalTokens)})`);
  }

  // Top items
  console.log(`\n${chalk.cyan('Top 10 Items by Token Count:')}`);
  const sortedItems = [...items].sort((a, b) => b.tokens - a.tokens).slice(0, 10);
  for (const item of sortedItems) {
    const bar = createBar(item.tokens, summary.totalTokens, 20);
    console.log(`  ${item.name.padEnd(20)} ${bar} ${formatTokens(item.tokens).padStart(6)} (${tokenPercentage(item.tokens, summary.totalTokens)})`);
  }
}

function printDependencies(result: ScanResult) {
  console.log(chalk.bold('\nDependency Graph'));
  console.log(chalk.gray('═'.repeat(50)));

  for (const claudeMd of result.claudeMds) {
    if (!claudeMd) continue;

    console.log(`\n${chalk.cyan(claudeMd.path)}`);

    if (claudeMd.autoInvokes.length > 0) {
      console.log(chalk.gray('  Auto-invoke rules:'));
      for (const ai of claudeMd.autoInvokes) {
        const skillExists = result.items.some(i => i.name === ai.skillName);
        const status = skillExists ? chalk.green('✓') : chalk.red('✗');
        console.log(`    ${status} ${ai.context} → /${ai.skillName}`);
      }
    }

    if (claudeMd.skillReferences.length > 0) {
      console.log(chalk.gray('  Skill references:'));
      for (const skill of claudeMd.skillReferences) {
        const item = result.items.find(i => i.name === skill);
        if (item) {
          console.log(`    ${chalk.green('✓')} ${skill} (${item.scope}, ${formatTokens(item.tokens)})`);
        } else {
          console.log(`    ${chalk.red('✗')} ${skill} (not found)`);
        }
      }
    }
  }

  // Show items with dependencies
  const itemsWithDeps = result.items.filter(i => i.dependencies.length > 0 || i.referencedBy.length > 0);
  if (itemsWithDeps.length > 0) {
    console.log(`\n${chalk.cyan('Items with dependencies:')}`);
    for (const item of itemsWithDeps) {
      console.log(`\n  ${chalk.bold(item.name)} (${item.type})`);
      if (item.dependencies.length > 0) {
        console.log(`    depends on: ${item.dependencies.join(', ')}`);
      }
      if (item.referencedBy.length > 0) {
        console.log(`    used by: ${item.referencedBy.join(', ')}`);
      }
    }
  }
}

function createBar(value: number, max: number, width: number): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return chalk.magenta('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

// Run CLI
program.parse();
