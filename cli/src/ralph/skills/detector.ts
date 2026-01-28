/**
 * Dynamic skill detection based on PRD item content.
 *
 * Following kernighan: explicit rules, no magic.
 * Following hevery: pure function, easily testable.
 */

import { StageName } from '../types.js';

/** Keyword patterns mapped to skills */
interface SkillRule {
  keywords: RegExp;
  skills: string[];
  stages?: StageName[]; // If empty, applies to all stages
}

/**
 * Detection rules for dynamic skill loading.
 * Order matters - first match wins for each category.
 */
const DETECTION_RULES: SkillRule[] = [
  // Security keywords
  {
    keywords: /\b(auth|password|login|token|jwt|oauth|credential|secret|encrypt|hash|session|permission|role|access.?control|csrf|xss|injection|sanitiz|valid)\b/i,
    skills: ['schneier', 'owasp', 'tanya-janca', 'troy-hunt', 'security-mindset'],
    stages: ['plan', 'build', 'review'],
  },

  // Database keywords
  {
    keywords: /\b(database|sql|query|orm|prisma|sequelize|mongoose|postgres|mysql|mongo|redis|migration|schema)\b/i,
    skills: ['bloch', 'schneier'],
    stages: ['plan', 'build', 'review'],
  },

  // UI/UX keywords
  {
    keywords: /\b(ui|ux|modal|dialog|form|button|input|component|layout|responsive|mobile|desktop|css|style|design|interface|user.?experience)\b/i,
    skills: ['frost', 'ive', 'norman', 'rams'],
    stages: ['plan', 'build'],
  },

  // API keywords
  {
    keywords: /\b(api|endpoint|rest|graphql|route|controller|middleware|request|response|http|webhook)\b/i,
    skills: ['bloch'],
    stages: ['plan', 'build'],
  },

  // Testing keywords
  {
    keywords: /\b(test|spec|mock|stub|fixture|assert|expect|coverage|unit|integration|e2e)\b/i,
    skills: ['meszaros', 'fowler-test', 'hevery', 'dodds'],
    stages: ['test'],
  },

  // Performance keywords
  {
    keywords: /\b(performance|optimize|cache|memory|cpu|latency|throughput|benchmark|profil)\b/i,
    skills: ['carmack', 'knuth'],
    stages: ['build', 'review'],
  },

  // CLI keywords
  {
    keywords: /\b(cli|command.?line|terminal|shell|argv|flag|option|prompt)\b/i,
    skills: ['mcilroy', 'pike', 'kernighan'],
    stages: ['plan', 'build'],
  },

  // Documentation keywords
  {
    keywords: /\b(document|readme|changelog|jsdoc|comment|explain|usage|example)\b/i,
    skills: ['strunk-white', 'zinsser'],
    stages: ['doc'],
  },

  // Data visualization keywords
  {
    keywords: /\b(chart|graph|plot|visualization|d3|dashboard|metric|analytics)\b/i,
    skills: ['tufte', 'few', 'knaflic'],
    stages: ['build'],
  },

  // React/Frontend keywords
  {
    keywords: /\b(react|component|hook|state|props|redux|context|render)\b/i,
    skills: ['abramov', 'dodds'],
    stages: ['build'],
  },
];

/**
 * Detect skills that should be dynamically loaded based on item text.
 *
 * @param itemText - The PRD item text to analyze
 * @param stage - Current stage name
 * @returns Array of skill names to load
 */
export function detectDynamicSkills(itemText: string, stage: StageName): string[] {
  const detected = new Set<string>();

  for (const rule of DETECTION_RULES) {
    // Check if rule applies to this stage
    if (rule.stages && rule.stages.length > 0 && !rule.stages.includes(stage)) {
      continue;
    }

    // Check if keywords match
    if (rule.keywords.test(itemText)) {
      for (const skill of rule.skills) {
        detected.add(skill);
      }
    }
  }

  return Array.from(detected);
}

/**
 * Merge dynamic skills with profile skills, removing duplicates.
 */
export function mergeSkills(profileSkills: string[], dynamicSkills: string[]): string[] {
  const merged = new Set(profileSkills);
  for (const skill of dynamicSkills) {
    merged.add(skill);
  }
  return Array.from(merged);
}

/**
 * Get all skills for a stage, including dynamic detection.
 */
export function getSkillsForStage(
  profileSkills: string[],
  itemText: string,
  stage: StageName
): string[] {
  const dynamic = detectDynamicSkills(itemText, stage);
  return mergeSkills(profileSkills, dynamic);
}
