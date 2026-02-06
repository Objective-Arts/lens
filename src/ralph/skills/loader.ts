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

/** Extract enforcement items from Checklist and "The X Test" sections. */
function extractChecklist(content: string): string[] {
  const items: string[] = [];

  const checklistPattern = /##\s+(?:[\w\s]*Checklist)[^\n]*\n([\s\S]*?)(?=\n##|\n---|\s*$)/gi;
  let match;
  while ((match = checklistPattern.exec(content)) !== null) {
    const lines = match[1].split('\n');
    for (const line of lines) {
      if (/^\s*-\s*\[[ x]\]/.test(line)) {
        const text = line.replace(/^\s*-\s*\[[ x]\]\s*/, '').trim();
        if (text) items.push(text);
      }
    }
  }

  const testPattern = /##\s+The\s+\w+\s+Test[^\n]*\n([\s\S]*?)(?=\n##|\n---|\s*$)/gi;
  while ((match = testPattern.exec(content)) !== null) {
    const lines = match[1].split('\n');
    for (const line of lines) {
      if (/^\s*\d+\.\s+/.test(line)) {
        const text = line.replace(/^\s*\d+\.\s+/, '').trim();
        if (text) items.push(text);
      }
    }
  }

  return items;
}

/**
 * Load SKILL.md + SUMMARY.md for a skill, extracting enforcement checklist.
 * Resolves tribute names when CANON_TRIBUTE_NAMES=1.
 */
function loadSkill(projectPath: string, skillName: string): Skill | null {
  const resolvedName = resolveSkillName(skillName);
  const skillDir = path.join(projectPath, '.claude', 'skills', resolvedName);
  const skillPath = path.join(skillDir, 'SKILL.md');

  try {
    const content = fs.readFileSync(skillPath, 'utf-8');
    let summary = '';
    let checklist: string[] = [];

    const summaryPath = path.join(skillDir, 'SUMMARY.md');
    try {
      summary = fs.readFileSync(summaryPath, 'utf-8');
      checklist = extractChecklist(summary);
    } catch {
      // No SUMMARY.md - extract checklist from SKILL.md instead
      checklist = extractChecklist(content);
    }

    return { name: resolvedName, content, summary, checklist, source: 'profile' };
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

