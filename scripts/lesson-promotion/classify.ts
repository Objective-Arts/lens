/**
 * Lesson classification and lessons.md parsing.
 */

import type { ClassificationResult, ParsedLesson } from './types.js';
import { LANGUAGE_KEYWORDS, FRAMEWORK_KEYWORDS, VALID_CATEGORIES } from './config.js';

// ─── Classification ──────────────────────────────────────────────────────────

export function classifyLesson(text: string, projectLanguages: string[] = []): ClassificationResult {
  const languages = new Set<string>();
  const frameworks = new Set<string>();

  for (const [lang, patterns] of Object.entries(LANGUAGE_KEYWORDS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        languages.add(lang);
        break;
      }
    }
  }

  // Merge javascript -> typescript (matches quality-gate Language type)
  if (languages.has('javascript')) {
    languages.delete('javascript');
    languages.add('typescript');
  }

  for (const lang of projectLanguages) {
    languages.add(lang);
  }

  for (const [framework, patterns] of Object.entries(FRAMEWORK_KEYWORDS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        frameworks.add(framework);
        break;
      }
    }
  }

  return { languages: [...languages], frameworks: [...frameworks] };
}

// ─── Lessons.md Parsing ──────────────────────────────────────────────────────

export function parseLessonsFile(content: string): ParsedLesson[] {
  const lessons: ParsedLesson[] = [];
  const lines = content.split('\n');
  let currentCategory = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect ## headers - reset category on any ##
    if (line.startsWith('## ')) {
      const categoryMatch = line.match(/^##\s+(\w+)(?:\s+Patterns)?$/);
      if (categoryMatch && VALID_CATEGORIES.includes(categoryMatch[1].toUpperCase())) {
        currentCategory = categoryMatch[1].toUpperCase();
      } else {
        currentCategory = ''; // Unrecognized section - skip its bullets
      }
      continue;
    }

    if (line.startsWith('### ')) continue;

    // Detect lesson bullets
    if (line.startsWith('- ') && currentCategory) {
      let text = line.slice(2).trim();
      // Collect indented continuation lines
      let j = i + 1;
      while (j < lines.length && /^\s+\S/.test(lines[j]) && !lines[j].startsWith('- ') && !lines[j].startsWith('#')) {
        text += ' ' + lines[j].trim();
        j++;
      }
      if (text.length > 10) {
        lessons.push({ text, category: currentCategory });
      }
    }
  }

  return lessons;
}
