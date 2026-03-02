// Display helpers for the init command.

import chalk from 'chalk';
import type { ComposableProfile } from '../../types.js';
import { USER_FACING_SKILLS } from '../../workflow/index.js';

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
  '**Actions:**', '',
  '| Command | Description |',
  '|---------|-------------|',
  '| `/change [description]` | Simple changes done right — make it, clean it, report it |',
  '| `/cleanup [path] [--dry-run]` | Review against canons + gate, fix findings, verify |', '',
  '**Scans (read-only):**', '',
  '| Command | Description |',
  '|---------|-------------|',
  '| `/code-scan [path]` | 13-dimension quality analysis |',
  '| `/ai-smell-scan [path]` | AI code patterns |',
  '| `/deadcode-scan [path]` | Unused code detection |',
  '| `/naming-scan [path]` | Naming consistency |',
  '| `/refactor-scan [path]` | Refactoring opportunities |',
  '| `/dedupe-scan [path]` | Duplication detection |',
  "| `/canon-audit <canon> [path]` | Audit against a canon's rules |",
  '| `/generate-docs [path]` | Generate documentation |',
];

export function transformAutoInvokeAction(action: string): string {
  // INVOKE `/name` → Read `.claude/canon/name/SKILL.md`  (for canons)
  // INVOKE `/cleanup`  → unchanged                       (for workflow skills)
  let result = action.replace(/INVOKE `\/([^`]+)`/g, (match, name: string) => {
    const skillName = name.split(/[\s/]/)[0];
    return USER_FACING_SKILLS.has(skillName) ? match : `Read \`.claude/canon/${skillName}/SKILL.md\``;
  });
  // Bare `/name` refs after "then"/"and": then `/clarity` → then read canon
  result = result.replace(/(?:then|and)\s+`\/([^`]+)`/g, (match, name: string) => {
    const skillName = name.split(/[\s/]/)[0];
    return USER_FACING_SKILLS.has(skillName) ? match : `then read \`.claude/canon/${skillName}/SKILL.md\``;
  });
  return result;
}

function buildProfileLines(profile: ComposableProfile | null | undefined): string[] {
  if (!profile?.claudeMd) return [];
  const lines: string[] = [];

  const standards = profile.claudeMd.standards ?? [];
  if (standards.length > 0) {
    lines.push('## Standards', '', ...standards.map(s => `- ${s}`), '');
  }

  const antiPatterns = profile.claudeMd.antiPatterns ?? [];
  if (antiPatterns.length > 0) {
    lines.push('## Anti-Patterns (Avoid)', '', ...antiPatterns.map(p => `- ${p}`), '');
  }

  const autoInvoke = profile.claudeMd.autoInvoke ?? [];
  if (autoInvoke.length > 0) {
    lines.push('## Auto-Invoke Skills', '', '| Context | Action |', '|---------|--------|');
    lines.push(...autoInvoke.map(ai => `| ${ai.context} | ${transformAutoInvokeAction(ai.action)} |`), '');
  }

  return lines;
}

export function buildLensSection(stack: DetectedStack, profile?: ComposableProfile | null): string {
  const lang = stack.language + (stack.framework ? ` / ${stack.framework}` : '');
  return [
    LENS_MARKER_START,
    `## Lens Configuration`, '',
    `**Profile:** \`${stack.profile}\``,
    `**Language:** ${lang}`, '',
    '## Available Commands', '',
    ...COMMAND_TABLE, '',
    '## Quality Gate', '',
    'Run the quality gate against your project:', '',
    '    tsx .claude/scripts/quality-gate.ts .', '',
    'Checks by language:',
    '- **All languages:** secrets, empty catch, TODO accumulation, hardcoded URLs',
    '- **JS/TS:** shell injection, path traversal, circular imports, raw error output, proxy checks',
    '- **C#:** async void, sync-over-async, SQL injection, missing dispose, mutable fields, large structs + polyglot proxy checks',
    '- **Java:** raw types, string concat in loops, mutable fields + polyglot proxy checks', '',
    ...buildProfileLines(profile),
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
