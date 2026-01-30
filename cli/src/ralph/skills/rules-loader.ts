/**
 * YAML-based skill detection rules loader.
 *
 * Following cherny: strict types, discriminated unions, readonly where possible.
 * Following kernighan: explicit error handling, no silent failures.
 * Following gang-of-four: Strategy pattern - swap rule sources without changing detector.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { StageName } from '../types.js';

/** Workflow names */
export type WorkflowName =
  | 'implement'
  | 'plan'
  | 'review-hard'
  | 'structure-first'
  | 'build-from-plan'
  | 'refactor-clean'
  | 'test';

/** A single rule from the YAML file */
export interface YamlRule {
  readonly patterns: readonly string[];
  readonly skills: readonly string[];
  readonly stages: readonly string[];
  readonly workflows?: readonly string[];
}

/** Workflow default configuration */
export interface WorkflowDefault {
  readonly always: readonly string[];
  readonly phases?: Readonly<Record<string, readonly string[]>>;
}

/** The complete YAML rules file structure */
export interface YamlRulesFile {
  readonly rules: Readonly<Record<string, YamlRule>>;
  readonly 'workflow-defaults'?: Readonly<Record<string, WorkflowDefault>>;
}

/** Compiled rule ready for detection */
export interface SkillRule {
  readonly keywords: RegExp;
  readonly skills: readonly string[];
  readonly stages?: readonly StageName[];
  readonly workflows?: readonly WorkflowName[];
}

/** Workflow configuration with defaults and phase-specific canons */
export interface WorkflowConfig {
  readonly always: readonly string[];
  readonly phases: Readonly<Record<string, readonly string[]>>;
}

/** Result of loading rules - success or failure with reason */
export type LoadResult =
  | { readonly ok: true; readonly rules: readonly SkillRule[] }
  | { readonly ok: false; readonly error: string; readonly rules: readonly SkillRule[] };

/** Cache for loaded rules to avoid re-reading files */
let cachedRules: readonly SkillRule[] | null = null;
let cachedPath: string | null = null;

/**
 * Escape special regex characters in a pattern string.
 * Preserves word boundary matching for multi-word patterns.
 */
function escapeRegexPattern(pattern: string): string {
  // Escape regex special chars except spaces (handled separately)
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a regex from pattern strings.
 * Handles multi-word patterns and special characters safely.
 */
function buildRegexFromPatterns(patterns: readonly string[]): RegExp {
  const escaped = patterns.map(p => {
    const escaped = escapeRegexPattern(p);
    // Multi-word patterns: replace spaces with flexible whitespace
    return escaped.replace(/ /g, '[.\\s-]?');
  });

  // Sort by length descending so longer patterns match first
  const sorted = [...escaped].sort((a, b) => b.length - a.length);

  return new RegExp(`\\b(${sorted.join('|')})\\b`, 'i');
}

/**
 * Validate stage names against known values.
 */
function validateStages(stages: readonly string[]): readonly StageName[] {
  const validStages: StageName[] = ['plan', 'build', 'refactor', 'test', 'review', 'doc'];
  return stages.filter((s): s is StageName => validStages.includes(s as StageName));
}

/**
 * Validate workflow names against known values.
 */
function validateWorkflows(workflows: readonly string[]): readonly WorkflowName[] {
  const validWorkflows: WorkflowName[] = [
    'implement', 'plan', 'review-hard', 'structure-first',
    'build-from-plan', 'refactor-clean', 'test'
  ];
  return workflows.filter((w): w is WorkflowName => validWorkflows.includes(w as WorkflowName));
}

/**
 * Parse and validate the YAML rules file.
 * Returns compiled rules or error with fallback to defaults.
 */
function parseRulesFile(content: string): LoadResult {
  try {
    const parsed = yaml.parse(content) as YamlRulesFile;

    if (!parsed?.rules || typeof parsed.rules !== 'object') {
      return {
        ok: false,
        error: 'Invalid rules file: missing "rules" object',
        rules: getDefaultRules(),
      };
    }

    const rules: SkillRule[] = [];

    for (const [category, rule] of Object.entries(parsed.rules)) {
      if (!Array.isArray(rule.patterns) || rule.patterns.length === 0) {
        console.warn(`Skipping rule "${category}": missing patterns array`);
        continue;
      }

      if (!Array.isArray(rule.skills) || rule.skills.length === 0) {
        console.warn(`Skipping rule "${category}": missing skills array`);
        continue;
      }

      const stages = Array.isArray(rule.stages)
        ? validateStages(rule.stages)
        : undefined;

      const workflows = Array.isArray(rule.workflows)
        ? validateWorkflows(rule.workflows)
        : undefined;

      rules.push({
        keywords: buildRegexFromPatterns(rule.patterns),
        skills: [...rule.skills],
        stages: stages?.length ? stages : undefined,
        workflows: workflows?.length ? workflows : undefined,
      });
    }

    return { ok: true, rules };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `Failed to parse rules YAML: ${message}`,
      rules: getDefaultRules(),
    };
  }
}

/**
 * Default hardcoded rules as fallback.
 * Used when YAML file is missing or invalid.
 */
export function getDefaultRules(): readonly SkillRule[] {
  return [
    {
      keywords: /\b(auth|password|login|token|jwt|oauth|credential|secret|encrypt|hash|session|permission|role|access.?control|csrf|xss|injection|sanitiz|valid)\b/i,
      skills: ['schneier', 'owasp', 'tanya-janca', 'troy-hunt', 'security-mindset'],
      stages: ['plan', 'build', 'review'],
    },
    {
      keywords: /\b(database|sql|query|orm|prisma|sequelize|mongoose|postgres|mysql|mongo|redis|migration|schema)\b/i,
      skills: ['bloch', 'schneier'],
      stages: ['plan', 'build', 'review'],
    },
    {
      keywords: /\b(ui|ux|modal|dialog|form|button|input|component|layout|responsive|mobile|desktop|css|style|design|interface|user.?experience)\b/i,
      skills: ['frost', 'ive', 'norman', 'rams'],
      stages: ['plan', 'build'],
    },
    {
      keywords: /\b(api|endpoint|rest|graphql|route|controller|middleware|request|response|http|webhook)\b/i,
      skills: ['bloch'],
      stages: ['plan', 'build'],
    },
    {
      keywords: /\b(test|spec|mock|stub|fixture|assert|expect|coverage|unit|integration|e2e)\b/i,
      skills: ['meszaros', 'fowler-test', 'hevery', 'dodds'],
      stages: ['test'],
    },
    {
      keywords: /\b(performance|optimize|cache|memory|cpu|latency|throughput|benchmark|profil)\b/i,
      skills: ['carmack'],
      stages: ['build', 'review'],
    },
    {
      keywords: /\b(algorithm|sort|search|tree|graph|recursive|recursion|complexity|O\(|big.?o|binary.?search|hash|queue|stack|heap|linked.?list|traversal|invariant|edge.?cases?)\b/i,
      skills: ['knuth', 'dijkstra'],
      stages: ['plan', 'build', 'review'],
    },
    {
      keywords: /\b(cli|command.?line|terminal|shell|argv|flag|option|prompt|pipe|stream|stdin|stdout|text.?processing)\b/i,
      skills: ['mcilroy', 'pike', 'kernighan', 'thompson'],
      stages: ['plan', 'build'],
    },
    {
      keywords: /\b(prototype|mvp|simplif|refactor|rewrit|delet|remov|brute.?force|working.?first|minimum.?viable)\b/i,
      skills: ['thompson'],
      stages: ['plan', 'build', 'refactor'],
    },
    {
      keywords: /\b(regex|regexp|regular.?expression|pattern.?match|match|replace.?all)\b/i,
      skills: ['thompson'],
      stages: ['build'],
    },
    {
      keywords: /\b(error.?handl|fail.?fast|exception|throw|catch|try|panic|recover)\b/i,
      skills: ['thompson', 'bill-joy'],
      stages: ['build', 'review'],
    },
    {
      keywords: /\b(document|readme|changelog|jsdoc|comment|explain|usage|example)\b/i,
      skills: ['strunk-white', 'zinsser'],
      stages: ['doc'],
    },
    {
      keywords: /\b(chart|graph|plot|visualization|d3|dashboard|metric|analytics)\b/i,
      skills: ['tufte', 'few', 'knaflic'],
      stages: ['build'],
    },
    {
      keywords: /\b(react|component|hook|state|props|redux|context|render)\b/i,
      skills: ['abramov', 'dodds'],
      stages: ['build'],
    },
  ];
}

/**
 * Load skill rules from project's YAML file or use defaults.
 * Caches results for repeated calls with same path.
 *
 * @param projectPath - Project root directory
 * @returns Array of compiled skill rules
 */
export function loadSkillRules(projectPath: string): readonly SkillRule[] {
  const rulesPath = path.join(projectPath, 'config', 'skill-rules.yaml');

  // Return cached rules if path unchanged
  if (cachedRules && cachedPath === rulesPath) {
    return cachedRules;
  }

  if (!fs.existsSync(rulesPath)) {
    cachedRules = getDefaultRules();
    cachedPath = rulesPath;
    return cachedRules;
  }

  try {
    const content = fs.readFileSync(rulesPath, 'utf-8');
    const result = parseRulesFile(content);

    if (!result.ok) {
      console.warn(`Rules warning: ${result.error}. Using defaults.`);
    }

    cachedRules = result.rules;
    cachedPath = rulesPath;
    return cachedRules;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Failed to read rules file: ${message}. Using defaults.`);
    cachedRules = getDefaultRules();
    cachedPath = rulesPath;
    return cachedRules;
  }
}

/**
 * Clear the rules cache. Useful for testing or after file changes.
 */
export function clearRulesCache(): void {
  cachedRules = null;
  cachedPath = null;
}

/**
 * Check if custom rules are loaded (vs defaults).
 * Useful for diagnostics.
 */
export function hasCustomRules(projectPath: string): boolean {
  const rulesPath = path.join(projectPath, 'config', 'skill-rules.yaml');
  return fs.existsSync(rulesPath);
}

// =============================================================================
// WORKFLOW CONFIGURATION
// =============================================================================

/** Cache for workflow defaults */
let cachedWorkflowDefaults: Readonly<Record<string, WorkflowConfig>> | null = null;

/**
 * Default workflow configurations (fallback when YAML not present).
 */
function getDefaultWorkflowConfigs(): Readonly<Record<string, WorkflowConfig>> {
  return {
    plan: {
      always: ['kernighan', 'pike', 'linus'],
      phases: { design: ['cherny', 'dijkstra'] },
    },
    implement: {
      always: ['kernighan'],
      phases: {
        plan: ['pike', 'linus'],
        structure: ['cherny', 'dijkstra'],
        build: ['thompson', 'bill-joy'],
        test: ['meszaros', 'fowler-test', 'dodds'],
        review: ['schneier', 'owasp'],
      },
    },
    'review-hard': {
      always: ['schneier'],
      phases: {
        'self-review': ['kernighan'],
        security: ['owasp', 'tanya-janca'],
        quality: ['bloch'],
      },
    },
    'structure-first': {
      always: ['linus', 'cherny', 'dijkstra'],
      phases: {},
    },
    'build-from-plan': {
      always: ['thompson', 'kernighan'],
      phases: {},
    },
    'refactor-clean': {
      always: ['thompson', 'kernighan', 'pike'],
      phases: {},
    },
    test: {
      always: ['meszaros', 'fowler-test'],
      phases: {
        unit: ['hevery'],
        integration: ['feathers'],
        e2e: ['dodds'],
      },
    },
  };
}

/**
 * Load workflow defaults from YAML file.
 */
export function loadWorkflowDefaults(projectPath: string): Readonly<Record<string, WorkflowConfig>> {
  const rulesPath = path.join(projectPath, 'config', 'skill-rules.yaml');

  // Return cached if available
  if (cachedWorkflowDefaults && cachedPath === rulesPath) {
    return cachedWorkflowDefaults;
  }

  if (!fs.existsSync(rulesPath)) {
    cachedWorkflowDefaults = getDefaultWorkflowConfigs();
    return cachedWorkflowDefaults;
  }

  try {
    const content = fs.readFileSync(rulesPath, 'utf-8');
    const parsed = yaml.parse(content) as YamlRulesFile;

    if (!parsed?.['workflow-defaults']) {
      cachedWorkflowDefaults = getDefaultWorkflowConfigs();
      return cachedWorkflowDefaults;
    }

    const configs: Record<string, WorkflowConfig> = {};

    for (const [workflow, config] of Object.entries(parsed['workflow-defaults'])) {
      configs[workflow] = {
        always: config.always ?? [],
        phases: config.phases ?? {},
      };
    }

    cachedWorkflowDefaults = configs;
    return cachedWorkflowDefaults;
  } catch {
    cachedWorkflowDefaults = getDefaultWorkflowConfigs();
    return cachedWorkflowDefaults;
  }
}

/**
 * Get workflow configuration for a specific command.
 */
export function getWorkflowConfig(
  projectPath: string,
  workflow: WorkflowName
): WorkflowConfig {
  const defaults = loadWorkflowDefaults(projectPath);
  return defaults[workflow] ?? { always: [], phases: {} };
}

/**
 * Detect skills for a workflow command based on task text.
 * Combines workflow defaults with keyword-detected skills.
 *
 * @param projectPath - Project root
 * @param workflow - Workflow command name
 * @param taskText - Task description to analyze for keywords
 * @param phase - Optional phase within workflow (e.g., 'build', 'review')
 * @returns Array of unique skill names
 */
export function getWorkflowSkills(
  projectPath: string,
  workflow: WorkflowName,
  taskText: string,
  phase?: string
): readonly string[] {
  const skills = new Set<string>();

  // 1. Add workflow defaults (always)
  const config = getWorkflowConfig(projectPath, workflow);
  for (const skill of config.always) {
    skills.add(skill);
  }

  // 2. Add phase-specific skills if phase provided
  if (phase && config.phases[phase]) {
    for (const skill of config.phases[phase]) {
      skills.add(skill);
    }
  }

  // 3. Add keyword-detected skills for this workflow
  const rules = loadSkillRules(projectPath);
  for (const rule of rules) {
    // Check if rule applies to this workflow
    if (rule.workflows && !rule.workflows.includes(workflow)) {
      continue;
    }

    // Check if keywords match
    if (rule.keywords.test(taskText)) {
      for (const skill of rule.skills) {
        skills.add(skill);
      }
    }
  }

  return Array.from(skills);
}

/**
 * Clear all caches (rules + workflow defaults).
 */
export function clearAllCaches(): void {
  clearRulesCache();
  cachedWorkflowDefaults = null;
}
