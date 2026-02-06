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
 * When CANON_TRIBUTE_NAMES=1 is set, tribute names (legacy IDs)
 * are resolved to their generic equivalents (clarity, correctness).
 *
 * @param projectPath - Project root path
 * @param skillName - Name of the skill to load (can be tribute or generic name)
 * @returns Skill object or null if not found
 */
function loadSkill(projectPath: string, skillName: string): Skill | null {
  const resolvedName = resolveSkillName(skillName);
  const skillPath = path.join(projectPath, '.claude', 'skills', resolvedName, 'SKILL.md');

  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    return { name: resolvedName, content, source: 'profile' };
  } catch {
    return null;
  }
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

