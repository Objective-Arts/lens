/**
 * YAML Configuration Trace Module
 *
 * Traces which YAML files contribute to a skill's configuration.
 * Following kernighan: simple, clear output.
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../ralph/config/loader.js';
import { loadPhaseConfig, loadKeywordRules, detectExperts } from '../ralph/phases/loader.js';
import { getProfile } from '../profiles/index.js';
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

/**
 * Check if a file exists and return its path, or null.
 */
function findFile(projectPath: string, ...candidates: string[]): string | null {
  for (const candidate of candidates) {
    const fullPath = path.join(projectPath, candidate);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

/**
 * Get the applied profiles from CLAUDE.md
 */
function getAppliedProfiles(projectPath: string): string[] {
  const claudeMdPath = path.join(projectPath, '.claude', 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    // Try root CLAUDE.md
    const rootPath = path.join(projectPath, 'CLAUDE.md');
    if (!fs.existsSync(rootPath)) return [];
    const content = fs.readFileSync(rootPath, 'utf-8');
    const match = content.match(/Profiles Applied[:\s]*\n+`([^`]+)`/i);
    return match ? match[1].split(/\s*\+\s*/) : [];
  }
  const content = fs.readFileSync(claudeMdPath, 'utf-8');
  const match = content.match(/Profiles Applied[:\s]*\n+`([^`]+)`/i);
  return match ? match[1].split(/\s*\+\s*/) : [];
}

/**
 * Map skill name to phase name if applicable.
 */
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

/**
 * Trace which YAML files contribute to a skill's configuration.
 */
export function traceSkillConfig(projectPath: string, skillName: string, taskText?: string): TraceResult {
  const yamlStack: YamlSource[] = [];
  const phase = skillToPhase(skillName);

  // 1. Check for applied profiles
  const appliedProfiles = getAppliedProfiles(projectPath);
  const profilesDir = path.join(projectPath, '..', 'profiles');

  for (const profileName of appliedProfiles) {
    const profilePath = findFile(profilesDir, `${profileName}.yaml`, `${profileName}.yml`);
    if (profilePath) {
      const profile = getProfile(profileName);
      const contributed: string[] = [];

      if (profile?.skills?.canon?.length) {
        contributed.push(`canon skills: ${profile.skills.canon.length}`);
      }
      if (profile?.ralph?.skills) {
        const phaseSkills = Object.entries(profile.ralph.skills)
          .filter(([_, v]) => v && (v as string[]).length > 0)
          .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`);
        if (phaseSkills.length) contributed.push(`phase skills: ${phaseSkills.join('; ')}`);
      }
      if (profile?.claudeMd?.standards?.length) {
        contributed.push(`standards: ${profile.claudeMd.standards.length}`);
      }

      yamlStack.push({
        file: profilePath,
        purpose: `Profile: ${profileName}`,
        contributed: contributed.length ? contributed : ['(base profile)'],
      });
    }
  }

  // 2. Check ralph-config.yaml
  const ralphConfigPath = findFile(projectPath, '.claude/ralph-config.yaml');
  if (ralphConfigPath) {
    try {
      const config = loadConfig(projectPath);
      const contributed: string[] = [];

      if (phase && config.skills) {
        const mapping: Record<string, keyof typeof config.skills> = {
          'plan': 'plan',
          'structure-first': 'plan',
          'implement': 'build',
          'test': 'test',
          'refactor-check': 'refactor',
          'independent-review': 'review',
          'static-analysis': 'review',
          'doc-code': 'doc',
        };
        const key = mapping[phase];
        if (key && config.skills[key]?.length) {
          contributed.push(`${phase} experts: ${config.skills[key].join(', ')}`);
        }
      }

      if (config.settings) {
        contributed.push(`settings: maxIterations=${config.settings.maxIterations}`);
      }

      yamlStack.push({
        file: ralphConfigPath,
        purpose: 'Ralph configuration',
        contributed: contributed.length ? contributed : ['(default settings)'],
      });
    } catch {
      // Config exists but couldn't be loaded
      yamlStack.push({
        file: ralphConfigPath,
        purpose: 'Ralph configuration',
        contributed: ['(error loading config)'],
      });
    }
  }

  // 3. Check workflow-phases.yaml
  const phasesPath = findFile(projectPath, 'config/workflow-phases.yaml', 'workflow-phases.yaml');
  if (phasesPath) {
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

    yamlStack.push({
      file: phasesPath,
      purpose: 'Workflow phases',
      contributed: contributed.length ? contributed : ['(phase definitions)'],
    });
  }

  // 4. Check keyword-detection.yaml
  const keywordPath = findFile(projectPath, 'config/keyword-detection.yaml', 'keyword-detection.yaml');
  if (keywordPath && taskText) {
    const rules = loadKeywordRules(projectPath);
    const contributed: string[] = [];

    for (const rule of rules) {
      if (rule.pattern.test(taskText)) {
        contributed.push(`"${rule.category}" → ${rule.experts.join(', ')}`);
      }
    }

    yamlStack.push({
      file: keywordPath,
      purpose: 'Keyword detection',
      contributed: contributed.length ? contributed : ['(no keywords matched)'],
    });
  } else if (keywordPath) {
    yamlStack.push({
      file: keywordPath,
      purpose: 'Keyword detection',
      contributed: ['(no task text provided - keywords not evaluated)'],
    });
  }

  // 5. Resolve final config
  let experts: string[] = [];
  let keywords: string[] = [];
  const tools: string[] = [];

  if (phase) {
    try {
      const config = loadConfig(projectPath);
      const mapping: Record<string, keyof typeof config.skills> = {
        'plan': 'plan',
        'structure-first': 'plan',
        'implement': 'build',
        'test': 'test',
        'refactor-check': 'refactor',
        'independent-review': 'review',
        'static-analysis': 'review',
        'doc-code': 'doc',
      };
      const key = mapping[phase];
      const profileExperts = key && config.skills[key] ? config.skills[key] : [];

      const detection = detectExperts(projectPath, phase, taskText || '', profileExperts);
      experts = detection.experts as string[];
      keywords = detection.matchedKeywords as string[];
    } catch {
      // No ralph config - try with empty profile experts
      try {
        const detection = detectExperts(projectPath, phase, taskText || '', []);
        experts = detection.experts as string[];
        keywords = detection.matchedKeywords as string[];
      } catch {
        // detectExperts failed too
      }
    }

    // Add known tools for phases
    if (phase === 'independent-review') {
      tools.push('mcp__gemini-reviewer__gemini_review');
    } else if (phase === 'static-analysis') {
      tools.push('mcp__qodana__qodana_scan', 'mcp__qodana__qodana_problems');
    }
  }

  return {
    skill: skillName,
    phase,
    yamlStack,
    resolvedConfig: {
      experts,
      tools,
      keywords,
    },
  };
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
