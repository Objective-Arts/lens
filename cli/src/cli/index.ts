#!/usr/bin/env node

/**
 * cc-config CLI - Claude Code configuration manager
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { scan, GLOBAL_CLAUDE_PATH } from '../scanner/index.js';
import { formatTokens, tokenPercentage } from '../utils/tokens.js';
import {
  listProfiles,
  getProfile,
  saveProfile,
  applyProfile,
  applyComposableProfile,
  combineProfiles,
  parseProfileString,
  getSkillLibraryPaths,
  exampleProfile,
  exampleComposableProfile
} from '../profiles/index.js';
import type { ConfigItem, ConfigItemType, ConfigScope, ScanResult, ComposableProfile } from '../types.js';

const program = new Command();

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

    if (result.created.length > 0) {
      console.log(chalk.green('Created:'));
      result.created.forEach(c => console.log(`  + ${c}`));
    }

    if (result.linked.length > 0) {
      console.log(chalk.cyan('\nLinked:'));
      result.linked.forEach(l => console.log(`  → ${l}`));
    }

    if (result.skipped.length > 0) {
      console.log(chalk.gray('\nSkipped:'));
      result.skipped.forEach(s => console.log(`  - ${s}`));
    }

    if (result.errors.length > 0) {
      console.log(chalk.red('\nErrors:'));
      result.errors.forEach(e => console.log(`  ✗ ${e}`));
    }

    if (result.errors.length === 0) {
      console.log(chalk.green('\nProfile applied successfully!'));
    } else {
      console.log(chalk.yellow('\nProfile applied with some errors.'));
    }
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

  // Conflicts
  console.log(`\n${chalk.yellow('Conflicts')} (same name, different scopes):`);
  if (summary.conflicts.length === 0) {
    console.log(chalk.green('  ✓ No conflicts found'));
  } else {
    for (const conflict of summary.conflicts) {
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

  // Unused items
  console.log(`\n${chalk.gray('Potentially Unused Skills')}:`);
  if (summary.unusedItems.length === 0) {
    console.log(chalk.green('  ✓ All skills are referenced'));
  } else {
    for (const unused of summary.unusedItems) {
      const item = result.items.find(i => i.name === unused);
      if (item) {
        console.log(`  ${chalk.gray('○')} ${unused} (${formatTokens(item.tokens)} tokens)`);
      }
    }
  }

  // CLAUDE.md analysis
  console.log(`\n${chalk.cyan('CLAUDE.md Analysis')}:`);
  for (const claudeMd of result.claudeMds) {
    if (!claudeMd) continue;
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
