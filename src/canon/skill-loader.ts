/**
 * Skill file loader for canon inspect.
 *
 * Loads SKILL.md + SUMMARY.md from installed skills.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Skill } from '../types.js';
import { resolveSkillName, formatSkillName } from './naming.js';
import { isValidSkillName } from '../utils/validation.js';

const PREVIEW_LENGTH = 60;

function extractChecklist(content: string): string[] {
  const items: string[] = [];

  const checklistPattern = /##\s+[\w\s]*Checklist[^\n]*\n([\s\S]*?)(?=\n##|\n---|\s*$)/gi;
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

function loadSkillContent(skillDir: string): { content: string; summary: string; checklist: string[] } | null {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  let content: string;
  try {
    content = fs.readFileSync(skillMdPath, 'utf-8');
  } catch {
    return null;
  }

  const summaryPath = path.join(skillDir, 'SUMMARY.md');
  let summary = '';
  let checklist: string[];
  try {
    summary = fs.readFileSync(summaryPath, 'utf-8');
    checklist = extractChecklist(summary);
  } catch {
    checklist = extractChecklist(content);
  }

  return { content, summary, checklist };
}

function loadSkill(projectPath: string, skillName: string): Skill | null {
  if (!isValidSkillName(skillName)) return null;

  const resolvedName = resolveSkillName(skillName);
  if (!isValidSkillName(resolvedName)) return null;

  const skillDir = path.join(projectPath, '.claude', 'skills', resolvedName);
  const loaded = loadSkillContent(skillDir);
  if (!loaded) return null;

  return { name: resolvedName, ...loaded, source: 'profile' };
}

export function loadSkills(projectPath: string, skillNames: string[], verbose: boolean = false): Skill[] {
  const skills: Skill[] = [];

  for (const skillName of skillNames) {
    const skill = loadSkill(projectPath, skillName);
    if (skill) {
      skills.push(skill);
      if (verbose) {
        const lineCount = skill.content.split('\n').length;
        const preview = skill.content.slice(0, PREVIEW_LENGTH).replace(/\n/g, ' ').trim();
        const displayName = formatSkillName(skill.name);
        console.log(`      ✓ ${displayName}: ${lineCount} lines loaded "${preview}..."`);
      }
    }
  }

  return skills;
}
