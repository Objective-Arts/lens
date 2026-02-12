/**
 * Lesson promotion system.
 *
 * Automates the feedback loop from project lessons -> universal lessons -> canon (profile YAMLs).
 * Auto-classifies lessons by language/framework from text keywords and project context.
 *
 * Usage:
 *   tsx scripts/lesson-promotion/index.ts ingest <path>      Parse lessons.md, classify, upsert into ledger
 *   tsx scripts/lesson-promotion/index.ts status              Show ledger summary
 *   tsx scripts/lesson-promotion/index.ts promote [--dry-run]  Promote eligible lessons
 */

import { ingest, status, promote } from './commands.js';

// Re-exports for testing
export type { Lesson, Ledger, ClassificationResult, ParsedLesson, PromotionAction } from './types.js';
export { loadLedger, jaccardSimilarity } from './ledger.js';
export { classifyLesson, parseLessonsFile } from './classify.js';

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'ingest': {
      const target = args[1];
      if (!target) {
        console.error('Usage: tsx scripts/lesson-promotion/index.ts ingest <path>');
        process.exit(1);
      }
      ingest(target);
      break;
    }
    case 'status':
      status();
      break;
    case 'promote': {
      const dryRun = args.includes('--dry-run');
      promote(dryRun);
      break;
    }
    default:
      console.error('Usage: tsx scripts/lesson-promotion/index.ts <ingest|status|promote> [options]');
      console.error('');
      console.error('Commands:');
      console.error('  ingest <path>       Parse lessons.md, classify, upsert into ledger');
      console.error('  status              Show ledger summary');
      console.error('  promote [--dry-run]  Promote eligible lessons');
      process.exit(1);
  }
}

const isDirectRun = process.argv[1]?.includes('lesson-promotion/index');
if (isDirectRun) main();
