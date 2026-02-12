/**
 * File writers for promotion targets: universal lessons.md and profile YAMLs.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Lesson } from './types.js';
import { LENS_ROOT, UNIVERSAL_LESSONS_PATH, isAntiPattern } from './config.js';

// ─── Promotion Targets ───────────────────────────────────────────────────────

export function determinePromotionTargets(lesson: Lesson): string[] {
  const languages = lesson.languages.filter(l => l !== 'sql');

  if (languages.length === 0 || languages.length >= 3) {
    return ['profiles/software-base.yaml'];
  }

  if (languages.length === 1) {
    const profile = `profiles/${languages[0]}.yaml`;
    return fs.existsSync(path.join(LENS_ROOT, profile)) ? [profile] : ['profiles/software-base.yaml'];
  }

  // 2 languages -> both profiles
  const targets = languages
    .map(lang => {
      const profile = `profiles/${lang}.yaml`;
      return fs.existsSync(path.join(LENS_ROOT, profile)) ? profile : 'profiles/software-base.yaml';
    })
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe

  return targets;
}

// ─── Universal Lessons.md Writing ────────────────────────────────────────────

export function appendToUniversalLessons(lesson: Lesson): void {
  let content = fs.readFileSync(UNIVERSAL_LESSONS_PATH, 'utf-8');

  // Dedup: skip if lesson text already present
  if (content.includes(lesson.text)) return;

  const category = lesson.category || 'CODE_QUALITY';
  const sectionHeader = `## ${category} Patterns`;
  const sectionIdx = content.indexOf(sectionHeader);

  if (sectionIdx === -1) {
    // Category doesn't exist - append new section at end
    content += `\n${sectionHeader}\n\n### Promoted\n- ${lesson.text}\n`;
  } else {
    // Find end of section (next ## or end of file)
    const nextSection = content.indexOf('\n## ', sectionIdx + sectionHeader.length);
    const insertAt = nextSection === -1 ? content.length : nextSection;

    // Check for existing ### Promoted subsection
    const sectionSlice = content.slice(sectionIdx, insertAt);
    const promotedIdx = sectionSlice.indexOf('\n### Promoted');

    if (promotedIdx !== -1) {
      // Find end of Promoted subsection (next ### or end of section)
      const afterPromoted = sectionSlice.indexOf('\n### ', promotedIdx + 13);
      const bulletInsert = sectionIdx + (afterPromoted === -1 ? sectionSlice.length : afterPromoted);
      content = content.slice(0, bulletInsert) + `\n- ${lesson.text}` + content.slice(bulletInsert);
    } else {
      // Create Promoted subsection at end of category
      const insertion = `\n### Promoted\n- ${lesson.text}\n`;
      content = content.slice(0, insertAt) + insertion + content.slice(insertAt);
    }
  }

  fs.writeFileSync(UNIVERSAL_LESSONS_PATH, content, 'utf-8');
}

// ─── Profile YAML Writing ────────────────────────────────────────────────────

export function appendToProfile(lesson: Lesson, profileRelPath: string): void {
  const profilePath = path.join(LENS_ROOT, profileRelPath);
  const content = fs.readFileSync(profilePath, 'utf-8');

  // Dedup: skip if lesson text already present
  if (content.includes(lesson.text)) return;

  const section = isAntiPattern(lesson.text) ? 'antiPatterns' : 'standards';
  const sectionPattern = new RegExp(`^(\\s*)${section}:`, 'm');
  const match = content.match(sectionPattern);

  if (!match) {
    console.warn(`  Warning: ${section} section not found in ${profileRelPath}, skipping`);
    return;
  }

  const indent = match[1]!;
  const itemIndent = indent + '  ';
  const lines = content.split('\n');
  const sectionLineIdx = lines.findIndex(l => sectionPattern.test(l));

  // Find last actual item in this section (skip trailing blanks)
  let insertAfterIdx = sectionLineIdx;
  for (let i = sectionLineIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(itemIndent + '- ') || line.startsWith(itemIndent + '#')) {
      insertAfterIdx = i;
    } else if (line.trim() === '') {
      continue; // skip blanks but don't update insertAfterIdx
    } else {
      break; // hit next section
    }
  }

  // Escape quotes for YAML
  const escaped = lesson.text.replace(/"/g, '\\"');
  lines.splice(insertAfterIdx + 1, 0, `${itemIndent}- "${escaped}"`);
  fs.writeFileSync(profilePath, lines.join('\n'), 'utf-8');
}
