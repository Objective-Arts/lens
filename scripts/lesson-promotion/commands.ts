/**
 * CLI commands: ingest, status, promote.
 */

import * as fs from 'fs';
import * as path from 'path';
import { detectLanguages } from '../quality-gate.js';
import type { Lesson, PromotionAction } from './types.js';
import { LENS_ROOT, isAntiPattern } from './config.js';
import {
  loadLedger, saveLedger, computeId, todayISO, nowISO,
  findDuplicate, applyTierPromotion,
} from './ledger.js';
import { classifyLesson, parseLessonsFile } from './classify.js';
import { appendToUniversalLessons, appendToProfile, determinePromotionTargets } from './writers.js';

// ─── Ingest Command ──────────────────────────────────────────────────────────

export function ingest(targetPath: string): void {
  const resolved = path.resolve(targetPath);

  let lessonsPath: string;
  let isDir: boolean;
  try {
    isDir = fs.statSync(resolved).isDirectory();
  } catch {
    console.error(`Path not found: ${resolved}`);
    process.exit(1);
  }

  if (isDir) {
    const claudeLessons = path.join(resolved, '.claude', 'lessons.md');
    const rootLessons = path.join(resolved, 'lessons.md');
    if (fs.existsSync(claudeLessons)) {
      lessonsPath = claudeLessons;
    } else if (fs.existsSync(rootLessons)) {
      lessonsPath = rootLessons;
    } else {
      console.error(`No lessons.md found in ${resolved}`);
      process.exit(1);
    }
  } else {
    lessonsPath = resolved;
  }

  if (!fs.existsSync(lessonsPath)) {
    console.error(`File not found: ${lessonsPath}`);
    process.exit(1);
  }

  // Detect project languages as secondary signal
  let projectLanguages: string[] = [];
  const projectDir = isDir ? resolved : path.dirname(resolved);
  try {
    projectLanguages = detectLanguages(projectDir);
  } catch {
    // No source files - that's fine
  }

  const content = fs.readFileSync(lessonsPath, 'utf-8');
  const parsed = parseLessonsFile(content);

  if (parsed.length === 0) {
    console.log('No lessons found to ingest.');
    return;
  }

  const ledger = loadLedger();
  const source = path.relative(LENS_ROOT, lessonsPath);
  let added = 0;
  let merged = 0;

  for (const { text, category } of parsed) {
    const classification = classifyLesson(text, projectLanguages);
    const duplicate = findDuplicate(ledger, text);

    if (duplicate) {
      duplicate.occurrences++;
      duplicate.lastSeen = todayISO();
      if (!duplicate.sources.includes(source)) {
        duplicate.sources.push(source);
      }
      for (const lang of classification.languages) {
        if (!duplicate.languages.includes(lang)) duplicate.languages.push(lang);
      }
      for (const fw of classification.frameworks) {
        if (!duplicate.frameworks.includes(fw)) duplicate.frameworks.push(fw);
      }
      applyTierPromotion(duplicate);
      merged++;
    } else {
      const lesson: Lesson = {
        id: computeId(text),
        text,
        category,
        tier: 'local',
        languages: classification.languages,
        frameworks: classification.frameworks,
        occurrences: 1,
        firstSeen: todayISO(),
        lastSeen: todayISO(),
        sources: [source],
        promotedTo: null,
        promotedDate: null,
      };
      // Cross-language rule: 3+ languages -> universal
      if (lesson.languages.length >= 3) {
        lesson.tier = 'universal';
      }
      ledger.lessons.push(lesson);
      added++;
    }
  }

  ledger.lastIngest = nowISO();
  saveLedger(ledger);

  console.log(`Ingested ${path.relative(LENS_ROOT, lessonsPath)}`);
  console.log(`  ${parsed.length} lessons parsed`);
  console.log(`  ${added} new, ${merged} merged`);
  console.log(`  Ledger total: ${ledger.lessons.length} lessons`);
}

// ─── Status Command ──────────────────────────────────────────────────────────

export function status(): void {
  const ledger = loadLedger();

  if (ledger.lessons.length === 0) {
    console.log('Ledger is empty. Run `ingest` to add lessons.');
    return;
  }

  const tiers: Record<string, number> = {};
  const langs: Record<string, number> = {};
  const categories: Record<string, number> = {};

  for (const lesson of ledger.lessons) {
    tiers[lesson.tier] = (tiers[lesson.tier] || 0) + 1;
    for (const lang of lesson.languages) {
      langs[lang] = (langs[lang] || 0) + 1;
    }
    categories[lesson.category] = (categories[lesson.category] || 0) + 1;
  }

  console.log('Lesson Ledger Status');
  console.log(`Last ingest: ${ledger.lastIngest || 'never'}\n`);

  console.log('By tier:');
  for (const tier of ['local', 'universal', 'canon-candidate', 'promoted']) {
    if (tiers[tier]) console.log(`  ${tier}: ${tiers[tier]}`);
  }

  console.log('\nBy language:');
  for (const [lang, count] of Object.entries(langs).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${lang}: ${count}`);
  }

  console.log('\nBy category:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  const candidates = ledger.lessons.filter(l => l.tier === 'canon-candidate');
  if (candidates.length > 0) {
    console.log(`\nCanon candidates ready for promotion (${candidates.length}):`);
    for (const c of candidates) {
      console.log(`  [${c.id}] ${c.text.slice(0, 80)}${c.text.length > 80 ? '...' : ''}`);
      console.log(`    languages: ${c.languages.join(', ') || 'universal'} | occurrences: ${c.occurrences}`);
    }
  }
}

// ─── Promote Command ─────────────────────────────────────────────────────────

export function promote(dryRun: boolean): void {
  const ledger = loadLedger();

  // Apply tier promotions
  for (const lesson of ledger.lessons) {
    if (lesson.tier !== 'promoted') applyTierPromotion(lesson);
  }

  // Collect actions
  const actions: PromotionAction[] = [];

  for (const lesson of ledger.lessons) {
    // Universal or canon-candidate lessons not yet written to lessons.md
    if ((lesson.tier === 'universal' || lesson.tier === 'canon-candidate') && !lesson.promotedTo) {
      actions.push({ lesson, action: 'append-to-universal', target: 'workflow-skills/lessons.md' });
    }

    // Canon-candidates -> profile YAMLs
    if (lesson.tier === 'canon-candidate') {
      const targets = determinePromotionTargets(lesson);
      for (const target of targets) {
        actions.push({ lesson, action: 'append-to-profile', target });
      }
    }
  }

  if (actions.length === 0) {
    console.log('No lessons eligible for promotion.');
    return;
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}Promotion plan:\n`);
  for (const { lesson, action, target } of actions) {
    const detail = action === 'append-to-profile'
      ? ` (${isAntiPattern(lesson.text) ? 'antiPatterns' : 'standards'})`
      : '';
    console.log(`  ${action} -> ${target}${detail}`);
    console.log(`    "${lesson.text.slice(0, 100)}${lesson.text.length > 100 ? '...' : ''}"\n`);
  }

  if (dryRun) {
    console.log(`${actions.length} action(s) would be performed. Run without --dry-run to execute.`);
    return;
  }

  let executed = 0;
  for (const { lesson, action, target } of actions) {
    try {
      if (action === 'append-to-universal') {
        appendToUniversalLessons(lesson);
        if (lesson.tier === 'universal') {
          lesson.promotedTo = target;
          lesson.promotedDate = nowISO();
        }
      } else if (action === 'append-to-profile') {
        appendToProfile(lesson, target);
        lesson.tier = 'promoted';
        lesson.promotedTo = target;
        lesson.promotedDate = nowISO();
      }
      executed++;
    } catch (err) {
      console.error(`  Failed to promote to ${target}: ${(err as Error).message}`);
    }
  }

  saveLedger(ledger);
  console.log(`${executed}/${actions.length} promotion(s) executed.`);
}
