/**
 * Hooks commands - manage Claude Code hooks
 * Following kernighan: single responsibility module
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { listHooks, listPresets, setupPreset, removePreset, removeHook, getSettingsPath } from '../../hooks/index.js';

export function registerHooksCommands(program: Command): void {
  const hooksCmd = program.command('hooks').description('Manage Claude Code hooks');

  hooksCmd.command('list').description('List installed hooks').action(handleList);
  hooksCmd.command('presets').description('List available presets').action(handlePresets);

  hooksCmd.command('setup').description('Install a preset')
    .option('--workflow-marker', 'Enforce workflow discipline')
    .action(handleSetup);

  hooksCmd.command('remove <target>').description('Remove a hook or preset').action(handleRemove);
}

function handleList(): void {
  const hooks = listHooks();

  if (hooks.length === 0) {
    console.log(chalk.gray('No hooks installed.'));
    console.log(chalk.gray(`Settings: ${getSettingsPath()}`));
    console.log(chalk.gray('\nInstall with: cc-config hooks setup --workflow-marker'));
    return;
  }

  console.log(chalk.bold('\nInstalled Hooks'));
  console.log(chalk.gray(`Settings: ${getSettingsPath()}`));
  console.log(chalk.gray('─'.repeat(60)));

  const byEvent = new Map<string, typeof hooks>();
  for (const hook of hooks) {
    if (!byEvent.has(hook.event)) byEvent.set(hook.event, []);
    byEvent.get(hook.event)!.push(hook);
  }

  for (const [event, eventHooks] of byEvent) {
    console.log(chalk.yellow(`\n  ${event}`));
    for (const hook of eventHooks) {
      const typeColor = hook.type === 'command' ? chalk.cyan : chalk.magenta;
      console.log(`    ${chalk.gray(hook.id)} ${typeColor(`[${hook.type}]`)} ${hook.matcher}`);
      console.log(chalk.gray(`      ${hook.description}`));
    }
  }

  console.log(chalk.gray('\nRemove with: cc-config hooks remove <id>'));
}

function handlePresets(): void {
  const presets = listPresets();

  console.log(chalk.bold('\nAvailable Hook Presets\n'));

  for (const preset of presets) {
    const status = preset.installed ? chalk.green('✓ installed') : chalk.gray('○ not installed');
    console.log(`  ${chalk.cyan(preset.name)} ${status}`);
    console.log(chalk.gray(`    ${preset.description}`));
  }

  console.log(chalk.gray('\nInstall with: cc-config hooks setup --<preset-name>'));
}

function handleSetup(options: { workflowMarker?: boolean }): void {
  if (options.workflowMarker) {
    const result = setupPreset('workflow-marker');

    if (result.success) {
      console.log(chalk.green(result.message));
      if (result.backupPath) console.log(chalk.gray(`Backup: ${result.backupPath}`));
      console.log(chalk.gray(`Settings: ${getSettingsPath()}`));
      console.log(chalk.yellow('\nRestart Claude Code for changes to take effect.'));
    } else {
      console.log(chalk.red(result.message));
    }
  } else {
    console.log(chalk.yellow('Specify a preset to install:'));
    console.log(chalk.gray('  --workflow-marker  Enforce workflow discipline'));
  }
}

function handleRemove(target: string): void {
  const presets = listPresets();
  const preset = presets.find(p => p.name === target);

  const result = preset ? removePreset(preset.name) : removeHook(target);

  if (result.success) {
    console.log(chalk.green(result.message));
    if (result.backupPath) console.log(chalk.gray(`Backup: ${result.backupPath}`));
    console.log(chalk.yellow('\nRestart Claude Code for changes to take effect.'));
  } else {
    console.log(chalk.red(result.message));
  }
}
