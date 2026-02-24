/**
 * Configuration file application for profiles.
 * Handles hooks, phase configs, ralph config, and CLAUDE.md updates.
 */

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import type { ComposableProfile } from '../types.js';
import { CLAUDE_DIR_NAME } from './paths.js';

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

/** Metadata for workflow skills, keyed by actual directory name */
const WORKFLOW_SKILL_META: Record<string, { cmd: string; desc: string; category: 'pipeline' | 'phase' | 'scan' | 'utility' }> = {
  // Pipeline orchestrators
  'build': { cmd: '/build [path] [--rollback] [--dry-run]', desc: 'Build new feature with quality pipeline', category: 'pipeline' },
  'improve': { cmd: '/improve [path] [--rollback] [--dry-run]', desc: 'Improve existing code with quality pipeline', category: 'pipeline' },
  'change': { cmd: '/change [description]', desc: 'Simple changes done right — make it, clean it, report it', category: 'pipeline' },

  // Individual phase skills
  'plan': { cmd: '/plan [task]', desc: 'Create implementation plan before coding', category: 'phase' },
  'structure': { cmd: '/structure [path]', desc: 'Map architecture or design data structures', category: 'phase' },
  'implementation': { cmd: '/implementation [target]', desc: 'Implement code from plan', category: 'phase' },
  'refactoring': { cmd: '/refactoring [target]', desc: 'Systematic code cleanup', category: 'phase' },
  'ai-smell-fix': { cmd: '/ai-smell-fix [path]', desc: 'Deep AI smell removal', category: 'phase' },
  'deduplication': { cmd: '/deduplication [path]', desc: 'Consolidate duplicated code', category: 'phase' },
  'gemini-review': { cmd: '/gemini-review [path]', desc: 'Gemini review + fix all issues', category: 'phase' },
  'codex-review': { cmd: '/codex-review [path]', desc: 'Codex review + fix all issues', category: 'phase' },
  'qodana-review': { cmd: '/qodana-review [path]', desc: 'Static analysis + fix all issues', category: 'phase' },
  'security-review': { cmd: '/security-review [path]', desc: 'Security audit - think like an attacker', category: 'phase' },
  'testing': { cmd: '/testing [level]', desc: 'Write and run tests', category: 'phase' },
  'evaluation': { cmd: '/evaluation [path]', desc: 'Final external review via Codex + Gemini', category: 'phase' },
  'generate-docs': { cmd: '/generate-docs [path]', desc: 'Generate documentation', category: 'phase' },
  // Read-only scans
  'gemini-scan': { cmd: '/gemini-scan [path]', desc: 'Gemini review (report only)', category: 'scan' },
  'qodana-scan': { cmd: '/qodana-scan [path]', desc: 'Static analysis (report only)', category: 'scan' },
  'refactor-scan': { cmd: '/refactor-scan [path]', desc: 'Refactoring opportunities (report only)', category: 'scan' },
  'ai-smell-scan': { cmd: '/ai-smell-scan [path]', desc: 'AI code patterns (report only)', category: 'scan' },
  'dedupe-scan': { cmd: '/dedupe-scan [path]', desc: 'Duplicate code (report only)', category: 'scan' },
  'codex-scan': { cmd: '/codex-scan [path]', desc: 'Codex pattern scan (report only)', category: 'scan' },
  'naming-scan': { cmd: '/naming-scan [path]', desc: 'Name clarity check', category: 'scan' },

  // Utilities
  'lens': { cmd: '/lens', desc: 'Home base - status and help', category: 'utility' },
  'session-status': { cmd: '/session-status', desc: 'Show active primitives', category: 'utility' },
  'explain-skill': { cmd: '/explain-skill [name]', desc: 'Explain what a skill does', category: 'utility' },
};

type SkillMeta = { cmd: string; desc: string; category: string };

const TABLE_HEADER = '| Command | Description |\n|---------|-------------|';
const FLAGS_SECTION = `
**Flags for /build and /improve:**
- \`--rollback\` — Restore from last stash
- \`--dry-run\` — Show what would change without modifying
`;

function toRows(skills: SkillMeta[]): string {
  return skills.map(s => `| \`${s.cmd}\` | ${s.desc} |`).join('\n');
}

function formatCategory(label: string, skills: SkillMeta[]): string {
  if (skills.length === 0) return '';
  return `\n**${label}:**\n\n${TABLE_HEADER}\n${toRows(skills)}\n`;
}

function getWorkflowCommandsDocs(projectPath: string): string {
  const skillsDir = path.join(projectPath, CLAUDE_DIR_NAME, 'skills');
  if (!fs.existsSync(skillsDir)) return '';

  const installed = Object.entries(WORKFLOW_SKILL_META)
    .filter(([name]) => fs.existsSync(path.join(skillsDir, name)))
    .map(([, meta]) => meta);
  if (installed.length === 0) return '';

  const byCategory = (cat: string): SkillMeta[] => installed.filter(s => s.category === cat);
  const pipeline = byCategory('pipeline');
  const phase = byCategory('phase');

  let doc = `\n## Available Commands\n\n${TABLE_HEADER}\n`;
  doc += toRows(pipeline);
  if (phase.length > 0) doc += '\n' + toRows(phase);
  doc += '\n';
  doc += formatCategory('Read-only scans', byCategory('scan'));
  doc += formatCategory('Utilities', byCategory('utility'));
  doc += FLAGS_SECTION;
  return doc;
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
