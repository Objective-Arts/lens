/**
 * YAML Configuration Trace Module
 *
 * Traces which YAML files contribute to a skill's configuration.
 * Following clarity: simple, clear output.
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getProfile } from '../profiles/index.js';
import { isValidName } from '../utils/validation.js';
import { PATHS } from '../paths.js';

export interface YamlSource {
  file: string;
  purpose: string;
  contributed: string[];
}

export interface TraceResult {
  skill: string;
  yamlStack: YamlSource[];
}

const MAX_PROFILES = 20;

function findFile(projectPath: string, ...candidates: string[]): string | null {
  for (const candidate of candidates) {
    const fullPath = path.join(projectPath, candidate);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

function getAppliedProfiles(projectPath: string): string[] {
  const claudeMd = findFile(projectPath, '.claude/CLAUDE.md', 'CLAUDE.md');
  if (!claudeMd) return [];
  try {
    const content = fs.readFileSync(claudeMd, 'utf-8');
    const match = content.match(/Profiles Applied[:\s]*\n+`([^`]+)`/i);
    return match ? match[1].split(/\s*\+\s*/).filter(isValidName).slice(0, MAX_PROFILES) : [];
  } catch {
    return [];
  }
}

function buildContributions(profile: ReturnType<typeof getProfile>): string[] {
  const contributed: string[] = [];
  if (profile?.skills?.canon?.length) {
    contributed.push(`canon skills: ${profile.skills.canon.length}`);
  }
  if (profile?.claudeMd?.standards?.length) {
    contributed.push(`standards: ${profile.claudeMd.standards.length}`);
  }
  return contributed.length ? contributed : ['(base profile)'];
}

function traceProfileSources(projectPath: string, profiles: string[]): YamlSource[] {
  const profilesDir = PATHS.profiles;
  const sources: YamlSource[] = [];

  for (const profileName of profiles) {
    const profilePath = findFile(profilesDir, `${profileName}.yaml`, `${profileName}.yml`);
    if (!profilePath) continue;

    sources.push({
      file: profilePath,
      purpose: `Profile: ${profileName}`,
      contributed: buildContributions(getProfile(profileName)),
    });
  }

  return sources;
}

/**
 * Trace which YAML files contribute to a skill's configuration.
 */
export function traceSkillConfig(projectPath: string, skillName: string): TraceResult {
  const appliedProfiles = getAppliedProfiles(projectPath);
  const yamlStack: YamlSource[] = traceProfileSources(projectPath, appliedProfiles);
  return { skill: skillName, yamlStack };
}

export function formatTrace(trace: TraceResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.cyan(`━━━ YAML Trace: /${trace.skill} ━━━`));
  lines.push('');

  lines.push(chalk.yellow('YAML Stack:'));
  for (let i = 0; i < trace.yamlStack.length; i++) {
    const source = trace.yamlStack[i];
    lines.push(`  ${i + 1}. ${chalk.bold(source.purpose)}`);
    lines.push(chalk.dim(`     ${source.file}`));
    for (const item of source.contributed) {
      lines.push(chalk.green(`     → ${item}`));
    }
  }

  lines.push('');
  lines.push(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  lines.push('');

  return lines.join('\n');
}

export function printTrace(projectPath: string, skillName: string): void {
  const trace = traceSkillConfig(projectPath, skillName);
  console.log(formatTrace(trace));
}
