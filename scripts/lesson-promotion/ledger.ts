/**
 * Ledger I/O, text normalization, duplicate detection, and tier promotion rules.
 */

import * as fs from 'fs';
import * as crypto from 'crypto';
import type { Ledger, Lesson } from './types.js';
import { LEDGER_PATH, JACCARD_THRESHOLD } from './config.js';

// ─── Text Helpers ────────────────────────────────────────────────────────────

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function computeId(text: string): string {
  return crypto.createHash('sha256').update(normalizeText(text)).digest('hex').slice(0, 12);
}

export function wordTrigrams(text: string): Set<string> {
  const words = normalizeText(text).split(' ');
  const trigrams = new Set<string>();
  for (let i = 0; i <= words.length - 3; i++) {
    trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return trigrams;
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Date Helpers ────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowISO(): string {
  return new Date().toISOString();
}

// ─── Ledger I/O ──────────────────────────────────────────────────────────────

export function loadLedger(): Ledger {
  try {
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'));
  } catch {
    return { lessons: [], lastIngest: '' };
  }
}

export function saveLedger(ledger: Ledger): void {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf-8');
}

// ─── Duplicate Detection ─────────────────────────────────────────────────────

export function findDuplicate(ledger: Ledger, text: string): Lesson | null {
  const newTrigrams = wordTrigrams(text);
  if (newTrigrams.size === 0) return null;

  for (const existing of ledger.lessons) {
    const existingTrigrams = wordTrigrams(existing.text);
    if (jaccardSimilarity(newTrigrams, existingTrigrams) >= JACCARD_THRESHOLD) {
      return existing;
    }
  }
  return null;
}

// ─── Tier Promotion Rules ────────────────────────────────────────────────────

export function applyTierPromotion(lesson: Lesson): void {
  if (lesson.tier === 'promoted') return;

  if (lesson.tier === 'local') {
    if (lesson.occurrences >= 2 || lesson.sources.length >= 2) {
      lesson.tier = 'universal';
    }
    if (lesson.languages.length >= 3) {
      lesson.tier = 'universal';
    }
  }

  if (lesson.tier === 'universal') {
    if (lesson.occurrences >= 3) {
      lesson.tier = 'canon-candidate';
    }
  }
}
