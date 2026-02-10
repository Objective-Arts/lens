/**
 * Configuration file application for profiles.
 * Handles hooks, phase configs, ralph config, and CLAUDE.md updates.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { stringify as stringifyYaml } from 'yaml';
import type { ComposableProfile } from '../types.js';
import { CLAUDE_DIR_NAME, PHASE_CONFIG_SOURCE_DIR } from './paths.js';

/** Result subset needed by config application */
interface ConfigApplyResult {
  created: string[];
  skipped: string[];
  errors: string[];
  warnings: string[];
}

export async function applyHooksToProject(profile: ComposableProfile, projectPath: string, result: ConfigApplyResult): Promise<void> {
  if (!profile.hooks) return;

  const settingsPath = path.join(projectPath, CLAUDE_DIR_NAME, 'settings.json');
  let settings: Record<string, unknown> = {};

  try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')); }
  catch { /* file missing or invalid JSON — start fresh */ }

  const existingHooks = (settings.hooks as Record<string, unknown[]>) || {};
  for (const [eventType, hookItems] of Object.entries(profile.hooks as Record<string, unknown[]>)) {
    if (!existingHooks[eventType]) existingHooks[eventType] = [];
    existingHooks[eventType].push(...hookItems);
  }
  settings.hooks = existingHooks;

  await fsPromises.mkdir(path.dirname(settingsPath), { recursive: true });
  await fsPromises.writeFile(settingsPath, JSON.stringify(settings, null, 2));
  result.created.push(`Hooks installed: ${Object.keys(profile.hooks).join(', ')}`);
}

export async function copyPhaseConfigFiles(projectPath: string, result: ConfigApplyResult): Promise<void> {
  const targetDir = path.join(projectPath, CLAUDE_DIR_NAME, 'config');
  const files = ['workflow-phases.yaml', 'keyword-detection.yaml'];

  if (!fs.existsSync(PHASE_CONFIG_SOURCE_DIR)) {
    result.warnings.push(`Phase config source not found: ${PHASE_CONFIG_SOURCE_DIR}`);
    return;
  }

  await fsPromises.mkdir(targetDir, { recursive: true });

  for (const file of files) {
    const src = path.join(PHASE_CONFIG_SOURCE_DIR, file);
    const dest = path.join(targetDir, file);
    if (!fs.existsSync(src)) { result.warnings.push(`Phase config file not found: ${file}`); continue; }
    if (fs.existsSync(dest)) { result.skipped.push(`.claude/config/${file} (already exists)`); continue; }
    try { await fsPromises.copyFile(src, dest); result.created.push(`.claude/config/${file}`); }
    catch (e) { result.errors.push(`Failed to copy ${file}: ${e instanceof Error ? e.message : e}`); }
  }
}

/** Generate ralph-config.yaml */
export async function generateRalphConfig(profile: ComposableProfile, projectPath: string, result: ConfigApplyResult): Promise<void> {
  if (!profile.ralph) return;

  const configPath = path.join(projectPath, CLAUDE_DIR_NAME, 'ralph-config.yaml');
  const config: Record<string, unknown> = {
    _generated: `Auto-generated from profile: ${profile.name}`,
    _regenerate: 'lens profile apply',
  };

  if (profile.ralph.skills) {
    config.skills = {
      plan: profile.ralph.skills.plan ?? [],
      build: profile.ralph.skills.build ?? [],
      refactor: profile.ralph.skills.refactor ?? [],
      test: profile.ralph.skills.test ?? [],
      review: profile.ralph.skills.review ?? [],
      doc: profile.ralph.skills.doc ?? []
    };
  }

  if (profile.ralph.max_iterations) config.max_iterations = profile.ralph.max_iterations;
  if (profile.ralph.max_iterations_per_item) config.max_iterations_per_item = profile.ralph.max_iterations_per_item;
  if (profile.ralph.exit_on_idle_commits) config.exit_on_idle_commits = profile.ralph.exit_on_idle_commits;
  if (profile.ralph.quality_gates) config.quality_gates = profile.ralph.quality_gates;
  if (profile.ralph.post_loop_validation) config.post_loop_validation = profile.ralph.post_loop_validation;
  if (profile.ralph.exit_criteria) config.exit_criteria = profile.ralph.exit_criteria;

  try {
    await fsPromises.writeFile(configPath, stringifyYaml(config), 'utf-8');
    result.created.push('.claude/ralph-config.yaml');
  } catch (e) { result.errors.push(`Failed to generate ralph-config.yaml: ${e instanceof Error ? e.message : e}`); }
}

function getWorkflowCommandsDocs(projectPath: string): string {
  const skillsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'skills');
  if (!fs.existsSync(skillsDir)) return '';

  const workflowSkills = [
    { name: 'ralph-loop', cmd: '/ralph-loop [prd-file] [--max N] [--resume]', desc: 'Autonomous PRD implementation loop' },
    { name: 'plan', cmd: '/plan [task]', desc: 'Create implementation plan before coding' },
    { name: 'structure-first', cmd: '/structure-first [feature]', desc: 'Design data structures before implementation' },
    { name: 'implement', cmd: '/implement [target]', desc: 'Implement code from plan' },
    { name: 'refactor-check', cmd: '/refactor-check [target]', desc: 'Systematic code cleanup' },
    { name: 'independent-review', cmd: '/independent-review [path]', desc: 'Code review via Gemini (bugs, edge cases, quality)' },
    { name: 'static-analysis', cmd: '/static-analysis [path]', desc: 'Run Qodana and fix issues' },
    { name: 'test', cmd: '/test [level]', desc: 'Write and run tests' },
    { name: 'doc-code', cmd: '/doc-code [path]', desc: 'Generate documentation' },
    { name: 'security-review', cmd: '/security-review [path]', desc: 'Adversarial security review - think like an attacker' },
    { name: 'production-readiness', cmd: '/production-readiness [path]', desc: 'Final production readiness check and fixes' }
  ] as const;

  const installed = workflowSkills.filter(s => fs.existsSync(path.join(skillsDir, s.name)));
  if (installed.length === 0) return '';

  return `
## Available Commands

| Command | Description |
|---------|-------------|
${installed.map(s => `| \`${s.cmd}\` | ${s.desc} |`).join('\n')}

**Flags for /ralph-loop:**
- \`--max N\` — Override max iterations (default: 50)
- \`--resume\` — Continue from last incomplete PRD item
- \`--external\` — Enable Gemini + Qodana post-loop validation
- \`--dry-run\` — Show what would be done without executing
`;
}

export function buildProfileSections(profile: ComposableProfile, projectPath?: string): string {
  let sections = `## Profiles Applied\n\n\`${profile.name}\`\n`;

  if (projectPath) {
    const cmdDocs = getWorkflowCommandsDocs(projectPath);
    if (cmdDocs) sections += cmdDocs;
  }

  const standards = profile.claudeMd?.standards ?? [];
  if (standards.length > 0) sections += `\n## Standards\n\n${standards.map(s => `- ${s}`).join('\n')}\n`;

  const antiPatterns = profile.claudeMd?.antiPatterns ?? [];
  if (antiPatterns.length > 0) sections += `\n## Anti-Patterns (Avoid)\n\n${antiPatterns.map(p => `- ${p}`).join('\n')}\n`;

  const autoInvoke = profile.claudeMd?.autoInvoke ?? [];
  if (autoInvoke.length > 0) {
    const table = autoInvoke.map(ai => `| ${ai.context} | ${ai.action} |`).join('\n');
    sections += `\n## Auto-Invoke Skills\n\n| Context | Action |\n|---------|--------|\n${table}\n`;
  }

  return sections;
}

function stripProfileSections(content: string): string {
  return content
    .replace(/## Profiles Applied[\s\S]*?(?=\n## [^A]|\n# |$)/g, '')
    .replace(/## Available Commands[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Standards[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Anti-Patterns[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/## Auto-Invoke[\s\S]*?(?=\n## |\n# |$)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function updateClaudeMdWithProfile(claudeMdPath: string, profile: ComposableProfile, projectPath?: string): Promise<void> {
  let content = '';
  try { content = await fsPromises.readFile(claudeMdPath, 'utf-8'); } catch { /* new file */ }

  const newSections = buildProfileSections(profile, projectPath);
  content = stripProfileSections(content);

  const firstHeadingMatch = content.match(/^#[^#].*\n/m);
  if (firstHeadingMatch) {
    const insertPos = (firstHeadingMatch.index ?? 0) + firstHeadingMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + newSections + '\n' + content.slice(insertPos).trim();
  } else {
    content = newSections + '\n' + content;
  }

  await fsPromises.writeFile(claudeMdPath, content.trim() + '\n', 'utf-8');
}
