// Display helpers for the init command.

import chalk from 'chalk';

interface DetectedStack {
  language: string;
  framework: string | null;
  profile: string;
}

interface InitResult {
  created: string[];
  replaced: string[];
  skipped: string[];
  warnings: string[];
  errors: string[];
  cleanupHints: string[];
}

const LENS_MARKER_START = '<!-- LENS:START -->';
const LENS_MARKER_END = '<!-- LENS:END -->';
const CLEANUP_COLUMN_WIDTH = 20;

export { LENS_MARKER_START, LENS_MARKER_END };
export type { DetectedStack, InitResult };

const COMMAND_TABLE = [
  '| Command | Description |',
  '|---------|-------------|',
  '| `/build [path]` | Build new feature with quality pipeline |',
  '| `/improve [path]` | Improve existing code with quality pipeline |',
  '| `/change [desc]` | Simple change + cleanup |',
  '| `/fix [path]` | Fast quality loop |',
  '| `/ai-smell-scan [path]` | AI code patterns (report only) |',
  '| `/ai-smell-fix [path]` | Deep AI smell removal |',
  '| `/gemini-scan [path]` | Gemini review (report only) |',
  '| `/canon-audit <canon> [path]` | Audit against canon rules |',
  '| `/generate-docs [path]` | Generate documentation |',
  '| `/lens` | Home base - status and help |',
];

export function buildLensSection(stack: DetectedStack): string {
  const lang = stack.language + (stack.framework ? ` / ${stack.framework}` : '');
  return [
    LENS_MARKER_START,
    `## Lens Configuration`, '',
    `**Profile:** \`${stack.profile}\``,
    `**Language:** ${lang}`, '',
    '## Available Commands', '',
    ...COMMAND_TABLE, '',
    '**Flags for /build and /improve:**',
    '- `--rollback` -- Restore from last stash',
    '- `--dry-run` -- Show what would change without modifying',
    '- `--from N|name` -- Resume from a specific phase', '',
    LENS_MARKER_END,
  ].join('\n');
}

function printCleanupHints(hints: string[]): void {
  if (hints.length === 0) return;
  console.log('');
  console.log(chalk.yellow('  Found copied Lens directories that are no longer needed:'));
  for (const hint of hints) {
    console.log(chalk.gray(`    ${hint.padEnd(CLEANUP_COLUMN_WIDTH)} (Lens resolves from the installed package)`));
  }
  console.log('');
  console.log(chalk.gray('  You can safely delete these:'));
  console.log(chalk.gray(`    rm -rf ${hints.join(' ')}`));
}

export function printResults(initResult: InitResult): void {
  for (const item of initResult.created) { console.log(`  ${chalk.green('+')} Created ${item}`); }
  for (const item of initResult.replaced) { console.log(`  ${chalk.yellow('~')} Replaced ${item}`); }
  for (const item of initResult.skipped) { console.log(`  ${chalk.gray('-')} ${item}`); }
  for (const warning of initResult.warnings) { console.log(`  ${chalk.yellow('!')} ${warning}`); }
  for (const errorMsg of initResult.errors) { console.log(`  ${chalk.red('x')} ${errorMsg}`); }

  console.log('');
  const total = initResult.created.length + initResult.replaced.length;
  if (initResult.errors.length > 0) {
    console.log(chalk.yellow(`  Init completed with ${initResult.errors.length} error(s).`));
  } else if (total > 0) {
    console.log(chalk.green(`  Init complete. ${total} item(s) set up.`));
  } else {
    console.log(chalk.gray('  Nothing to do — already initialized.'));
  }

  printCleanupHints(initResult.cleanupHints);
  console.log('');
}
