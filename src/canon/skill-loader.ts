/**
 * Skill file loader for canon inspect.
 *
 * Loads SKILL.md + SUMMARY.md from installed skills.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Skill } from '../types.js';
import { resolveSkillName, formatSkillName } from './naming.js';

const PREVIEW_LENGTH = 60;

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

function isValidSkillName(name: string): boolean {
  return !name.includes('/') && !name.includes('\\') && !name.includes('..');
}

function loadSkill(projectPath: string, skillName: string): Skill | null {
  if (!isValidSkillName(skillName)) return null;

  const resolvedName = resolveSkillName(skillName);
  if (!isValidSkillName(resolvedName)) return null;

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
      checklist = extractChecklist(content);
    }

    return { name: resolvedName, content, summary, checklist, source: 'profile' };
  } catch {
    return null;
  }
}

export function loadSkills(projectPath: string, skillNames: string[], verbose: boolean = false): Skill[] {
  const skills: Skill[] = [];

  for (const name of skillNames) {
    const skill = loadSkill(projectPath, name);
    if (skill) {
      skills.push(skill);
      if (verbose) {
        const lines = skill.content.split('\n').length;
        const preview = skill.content.slice(0, PREVIEW_LENGTH).replace(/\n/g, ' ').trim();
        const displayName = formatSkillName(skill.name);
        console.log(`      ✓ ${displayName}: ${lines} lines loaded "${preview}..."`);
      }
    }
  }

  return skills;
}
