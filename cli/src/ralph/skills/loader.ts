/**
 * Skill file loader.
 *
 * Following hevery: explicit dependencies, testable.
 * Following kernighan: simple file operations, clear errors.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Skill } from '../types.js';

/**
 * Load a skill from the project's .claude/skills directory.
 *
 * @param projectPath - Project root path
 * @param skillName - Name of the skill to load
 * @returns Skill object or null if not found
 */
export function loadSkill(projectPath: string, skillName: string): Skill | null {
  const skillPath = path.join(projectPath, '.claude', 'skills', skillName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    return null;
  }

  const content = fs.readFileSync(skillPath, 'utf-8');
  return {
    name: skillName,
    content,
    source: 'profile',
  };
}

/**
 * Load multiple skills by name.
 *
 * @param projectPath - Project root path
 * @param skillNames - Array of skill names
 * @returns Array of loaded skills (excludes not found)
 */
export function loadSkills(projectPath: string, skillNames: string[]): Skill[] {
  const skills: Skill[] = [];

  for (const name of skillNames) {
    const skill = loadSkill(projectPath, name);
    if (skill) {
      skills.push(skill);
    }
  }

  return skills;
}

/**
 * List all available skills in project.
 */
export function listSkills(projectPath: string): string[] {
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
export function hasSkill(projectPath: string, skillName: string): boolean {
  const skillPath = path.join(projectPath, '.claude', 'skills', skillName, 'SKILL.md');
  return fs.existsSync(skillPath);
}

/**
 * Extract condensed guidance from skill content.
 * Takes the first N lines after frontmatter.
 */
export function extractGuidance(skill: Skill, maxLines: number = 50): string {
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
 */
export function buildSkillGuidance(skills: Skill[]): string {
  if (skills.length === 0) {
    return '';
  }

  const sections = skills.map(skill => {
    const guidance = extractGuidance(skill);
    return `## ${skill.name}\n\n${guidance}`;
  });

  return sections.join('\n\n---\n\n');
}
