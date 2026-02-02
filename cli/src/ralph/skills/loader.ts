/**
 * Skill file loader.
 *
 * Explicit dependencies, testable.
 * Simple file operations, clear errors.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Skill } from '../types.js';
import { resolveSkillName, formatSkillName } from '../../canon/naming.js';

/**
 * Load a skill from the project's .claude/skills directory.
 *
 * When CANON_TRIBUTE_NAMES=1 is set, tribute names (kernighan, dijkstra)
 * are resolved to their generic equivalents (clarity, correctness).
 *
 * @param projectPath - Project root path
 * @param skillName - Name of the skill to load (can be tribute or generic name)
 * @returns Skill object or null if not found
 */
function loadSkill(projectPath: string, skillName: string): Skill | null {
  // Resolve tribute names to generic names when flag is set
  const resolvedName = resolveSkillName(skillName);
  const skillPath = path.join(projectPath, '.claude', 'skills', resolvedName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    return null;
  }

  const content = fs.readFileSync(skillPath, 'utf-8');
  return {
    name: resolvedName,
    content,
    source: 'profile',
  };
}

/**
 * Load multiple skills by name.
 *
 * @param projectPath - Project root path
 * @param skillNames - Array of skill names (can be tribute or generic names)
 * @param verbose - Print confirmation of loaded skills
 * @returns Array of loaded skills (excludes not found)
 */
export function loadSkills(projectPath: string, skillNames: string[], verbose: boolean = false): Skill[] {
  const skills: Skill[] = [];

  for (const name of skillNames) {
    const skill = loadSkill(projectPath, name);
    if (skill) {
      skills.push(skill);
      if (verbose) {
        const lines = skill.content.split('\n').length;
        const preview = skill.content.slice(0, 60).replace(/\n/g, ' ').trim();
        // Show tribute name in parentheses when CANON_TRIBUTE_NAMES=1
        const displayName = formatSkillName(skill.name);
        console.log(`      ✓ ${displayName}: ${lines} lines loaded "${preview}..."`);
      }
    }
  }

  return skills;
}

/**
 * Load skills with source tracking (profile vs dynamic).
 *
 * @param projectPath - Project root path
 * @param profileSkills - Skills from profile configuration (can be tribute or generic names)
 * @param dynamicSkills - Skills detected from PRD content (can be tribute or generic names)
 * @returns Array of loaded skills with correct source attribution
 */
function loadSkillsWithSources(
  projectPath: string,
  profileSkills: string[],
  dynamicSkills: string[]
): Skill[] {
  const skills: Skill[] = [];
  // Resolve names for the profile set check
  const profileSet = new Set(profileSkills.map(resolveSkillName));

  // Merge unique skill names (resolve all to generic)
  const allSkills = new Set([
    ...profileSkills.map(resolveSkillName),
    ...dynamicSkills.map(resolveSkillName)
  ]);

  for (const name of allSkills) {
    const skill = loadSkill(projectPath, name);
    if (skill) {
      skill.source = profileSet.has(skill.name) ? 'profile' : 'dynamic';
      skills.push(skill);
    }
  }

  return skills;
}

/**
 * List all available skills in project.
 */
function listSkills(projectPath: string): string[] {
  const skillsDir = path.join(projectPath, '.claude', 'skills');

  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs.readdirSync(skillsDir).filter(name => {
    const skillPath = path.join(skillsDir, name, 'SKILL.md');
    return fs.existsSync(skillPath);
  });
}

/**
 * Check if a skill exists in the project.
 */
function hasSkill(projectPath: string, skillName: string): boolean {
  const skillPath = path.join(projectPath, '.claude', 'skills', skillName, 'SKILL.md');
  return fs.existsSync(skillPath);
}

/**
 * Extract condensed guidance from skill content.
 * Takes the first N lines after frontmatter.
 */
function extractGuidance(skill: Skill, maxLines: number = 50): string {
  const lines = skill.content.split('\n');

  // Skip frontmatter if present
  let start = 0;
  if (lines[0]?.trim() === '---') {
    const endIndex = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
    if (endIndex > 0) {
      start = endIndex + 1;
    }
  }

  // Take maxLines after frontmatter
  return lines.slice(start, start + maxLines).join('\n').trim();
}

/**
 * Build combined skill guidance for a stage prompt.
 * When CANON_TRIBUTE_NAMES=1, shows tribute names in section headers.
 */
function buildSkillGuidance(skills: Skill[]): string {
  if (skills.length === 0) {
    return '';
  }

  const sections = skills.map(skill => {
    const guidance = extractGuidance(skill);
    const displayName = formatSkillName(skill.name);
    return `## ${displayName}\n\n${guidance}`;
  });

  return sections.join('\n\n---\n\n');
}
