/**
 * YAML Configuration Trace Module
 *
 * Traces which YAML files contribute to a skill's configuration.
 * Following clarity: simple, clear output.
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../ralph/config/loader.js';
import { loadPhaseConfig, loadKeywordRules, detectExperts } from '../ralph/phases/loader.js';
import { getProfile } from '../profiles/index.js';
import { isValidName } from '../utils/validation.js';
import type { PhaseName } from '../ralph/types.js';

export interface YamlSource {
  file: string;
  purpose: string;
  contributed: string[];
}

export interface TraceResult {
  skill: string;
  phase: PhaseName | null;
  yamlStack: YamlSource[];
  resolvedConfig: {
    experts: string[];
    tools: string[];
    keywords: string[];
  };
}

const MAX_PROFILES = 20;

/** Phase name → ralph config skill key */
const PHASE_CONFIG_KEYS: Readonly<Record<string, string>> = {
  'plan': 'plan',
  'structure-first': 'plan',
  'implement': 'build',
  'test': 'test',
  'refactor-check': 'refactor',
  'independent-review': 'review',
  'static-analysis': 'review',
  'doc-code': 'doc',
};

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

function skillToPhase(skill: string): PhaseName | null {
  const phaseMap: Record<string, PhaseName> = {
    'plan': 'plan',
    'structure-first': 'structure-first',
    'implement': 'implement',
    'test': 'test',
    'refactor-check': 'refactor-check',
    'independent-review': 'independent-review',
    'static-analysis': 'static-analysis',
    'doc-code': 'doc-code',
  };
  return phaseMap[skill] ?? null;
}

function getPhaseConfigKey(phase: string): string | null {
  return PHASE_CONFIG_KEYS[phase] ?? null;
}

function traceProfileSources(projectPath: string, profiles: string[]): YamlSource[] {
  const profilesDir = path.join(projectPath, '..', 'profiles');
  const sources: YamlSource[] = [];

  for (const profileName of profiles) {
    const profilePath = findFile(profilesDir, `${profileName}.yaml`, `${profileName}.yml`);
    if (!profilePath) continue;

    const profile = getProfile(profileName);
    const contributed: string[] = [];

    if (profile?.skills?.canon?.length) {
      contributed.push(`canon skills: ${profile.skills.canon.length}`);
    }
    if (profile?.ralph?.skills) {
      const entries = Object.entries(profile.ralph.skills)
        .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0);
      if (entries.length) {
        contributed.push(`phase skills: ${entries.map(([k, v]) => `${k}: ${v.join(', ')}`).join('; ')}`);
      }
    }
    if (profile?.claudeMd?.standards?.length) {
      contributed.push(`standards: ${profile.claudeMd.standards.length}`);
    }

    sources.push({
      file: profilePath,
      purpose: `Profile: ${profileName}`,
      contributed: contributed.length ? contributed : ['(base profile)'],
    });
  }

  return sources;
}

function traceRalphConfig(projectPath: string, phase: PhaseName | null): YamlSource | null {
  const configPath = findFile(projectPath, '.claude/ralph-config.yaml');
  if (!configPath) return null;

  try {
    const config = loadConfig(projectPath);
    const contributed: string[] = [];

    if (phase) {
      const key = getPhaseConfigKey(phase);
      const skills = key ? config.skills[key as keyof typeof config.skills] : null;
      if (skills?.length) {
        contributed.push(`${phase} experts: ${skills.join(', ')}`);
      }
    }

    if (config.settings) {
      contributed.push(`settings: maxIterations=${config.settings.maxIterations}`);
    }

    return {
      file: configPath,
      purpose: 'Ralph configuration',
      contributed: contributed.length ? contributed : ['(default settings)'],
    };
  } catch {
    return {
      file: configPath,
      purpose: 'Ralph configuration',
      contributed: ['(error loading config)'],
    };
  }
}

function tracePhaseConfig(projectPath: string, phase: PhaseName | null): YamlSource | null {
  const phasesPath = findFile(projectPath, 'config/workflow-phases.yaml', 'workflow-phases.yaml');
  if (!phasesPath) return null;

  const phaseConfig = loadPhaseConfig(projectPath);
  const contributed: string[] = [];

  if (phase && phaseConfig.phases[phase]) {
    const phaseData = phaseConfig.phases[phase];
    if (phaseData.experts?.length) {
      contributed.push(`${phase} experts: ${phaseData.experts.join(', ')}`);
    } else {
      contributed.push(`${phase} experts: [] (uses external tool)`);
    }
    if (phaseData.description) {
      contributed.push(`description: "${phaseData.description}"`);
    }
  }

  if (phaseConfig['ralph-sequence']?.length) {
    contributed.push(`ralph sequence: ${phaseConfig['ralph-sequence'].length} phases`);
  }

  return {
    file: phasesPath,
    purpose: 'Workflow phases',
    contributed: contributed.length ? contributed : ['(phase definitions)'],
  };
}

function traceKeywordConfig(projectPath: string, taskText?: string): YamlSource | null {
  const keywordPath = findFile(projectPath, 'config/keyword-detection.yaml', 'keyword-detection.yaml');
  if (!keywordPath) return null;

  if (!taskText) {
    return {
      file: keywordPath,
      purpose: 'Keyword detection',
      contributed: ['(no task text provided - keywords not evaluated)'],
    };
  }

  const rules = loadKeywordRules(projectPath);
  const contributed = rules
    .filter(rule => rule.pattern.test(taskText))
    .map(rule => `"${rule.category}" → ${rule.experts.join(', ')}`);

  return {
    file: keywordPath,
    purpose: 'Keyword detection',
    contributed: contributed.length ? contributed : ['(no keywords matched)'],
  };
}

function resolveConfig(
  projectPath: string, phase: PhaseName, taskText: string
): { experts: string[]; tools: string[]; keywords: string[] } {
  const tools: string[] = [];
  let experts: string[] = [];
  let keywords: string[] = [];

  const key = getPhaseConfigKey(phase);
  let profileExperts: string[] = [];

  if (key) {
    try {
      const config = loadConfig(projectPath);
      profileExperts = config.skills[key as keyof typeof config.skills] ?? [];
    } catch {
      // No ralph config — use empty profile experts
    }
  }

  try {
    const detection = detectExperts(projectPath, phase, taskText, profileExperts);
    experts = [...detection.experts];
    keywords = [...detection.matchedKeywords];
  } catch {
    // detectExperts failed
  }

  if (phase === 'independent-review') {
    tools.push('mcp__gemini-reviewer__gemini_review');
  } else if (phase === 'static-analysis') {
    tools.push('mcp__qodana__qodana_scan', 'mcp__qodana__qodana_problems');
  }

  return { experts, tools, keywords };
}

/**
 * Trace which YAML files contribute to a skill's configuration.
 */
export function traceSkillConfig(projectPath: string, skillName: string, taskText?: string): TraceResult {
  const phase = skillToPhase(skillName);
  const appliedProfiles = getAppliedProfiles(projectPath);

  const yamlStack: YamlSource[] = [
    ...traceProfileSources(projectPath, appliedProfiles),
  ];

  const ralphSource = traceRalphConfig(projectPath, phase);
  if (ralphSource) yamlStack.push(ralphSource);

  const phaseSource = tracePhaseConfig(projectPath, phase);
  if (phaseSource) yamlStack.push(phaseSource);

  const keywordSource = traceKeywordConfig(projectPath, taskText);
  if (keywordSource) yamlStack.push(keywordSource);

  const resolvedConfig = phase
    ? resolveConfig(projectPath, phase, taskText ?? '')
    : { experts: [], tools: [], keywords: [] };

  return { skill: skillName, phase, yamlStack, resolvedConfig };
}

/**
 * Format trace result for terminal output.
 */
export function formatTrace(trace: TraceResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(chalk.cyan(`━━━ YAML Trace: /${trace.skill} ━━━`));
  lines.push('');

  if (trace.phase) {
    lines.push(chalk.dim(`Phase: ${trace.phase}`));
    lines.push('');
  }

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
  lines.push(chalk.yellow('Resolved Config:'));

  if (trace.resolvedConfig.experts.length) {
    lines.push(`  experts: ${trace.resolvedConfig.experts.join(', ')}`);
  } else {
    lines.push(chalk.dim('  experts: [] (none)'));
  }

  if (trace.resolvedConfig.tools.length) {
    lines.push(`  tools: ${trace.resolvedConfig.tools.join(', ')}`);
  }

  if (trace.resolvedConfig.keywords.length) {
    lines.push(`  matched keywords: ${trace.resolvedConfig.keywords.join(', ')}`);
  }

  lines.push('');
  lines.push(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  lines.push('');

  return lines.join('\n');
}

/**
 * Print trace to console.
 */
export function printTrace(projectPath: string, skillName: string, taskText?: string): void {
  const trace = traceSkillConfig(projectPath, skillName, taskText);
  console.log(formatTrace(trace));
}
