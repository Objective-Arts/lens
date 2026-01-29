/**
 * Dynamic skill detection based on PRD item content.
 *
 * Following kernighan: explicit rules, no magic.
 * Following hevery: pure function, easily testable.
 * Following gang-of-four: Strategy pattern via rules loader.
 */

import { StageName, SkillDetection } from '../types.js';
import { loadSkillRules, getDefaultRules, type SkillRule } from './rules-loader.js';

// Re-export for backwards compatibility
export type { SkillRule } from './rules-loader.js';

/**
 * Get detection rules - from YAML file or defaults.
 * Uses cached rules from loader for performance.
 */
function getRules(projectPath?: string): readonly SkillRule[] {
  if (projectPath) {
    return loadSkillRules(projectPath);
  }
  return getDefaultRules();
}

/**
 * Detect skills that should be dynamically loaded based on item text.
 * Returns both skill names and the keywords that triggered detection.
 *
 * @param itemText - The PRD item text to analyze
 * @param stage - Current stage name
 * @param projectPath - Optional project path for custom rules (uses defaults if not provided)
 * @returns SkillDetection with skills and matched keywords
 */
export function detectDynamicSkills(
  itemText: string,
  stage: StageName,
  projectPath?: string
): SkillDetection {
  const detected = new Set<string>();
  const keywords = new Set<string>();
  const rules = getRules(projectPath);

  for (const rule of rules) {
    // Check if rule applies to this stage
    if (rule.stages && rule.stages.length > 0 && !rule.stages.includes(stage)) {
      continue;
    }

    // Check if keywords match
    const match = itemText.match(rule.keywords);
    if (match) {
      for (const skill of rule.skills) {
        detected.add(skill);
      }
      // Extract matched keyword
      if (match[0]) {
        keywords.add(match[0].toLowerCase());
      }
    }
  }

  return {
    skills: Array.from(detected),
    keywords: Array.from(keywords),
  };
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
 * Returns detection info with merged skills and matched keywords.
 *
 * @param profileSkills - Skills from profile configuration
 * @param itemText - PRD item text to analyze
 * @param stage - Current stage name
 * @param projectPath - Optional project path for custom rules
 */
export function getSkillsForStage(
  profileSkills: string[],
  itemText: string,
  stage: StageName,
  projectPath?: string
): SkillDetection {
  const dynamic = detectDynamicSkills(itemText, stage, projectPath);
  const merged = mergeSkills(profileSkills, dynamic.skills);

  return {
    skills: merged,
    keywords: dynamic.keywords,
  };
}
