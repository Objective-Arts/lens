/**
 * Path constants, thresholds, and keyword maps for lesson classification.
 */

import * as path from 'path';

// ─── Paths ───────────────────────────────────────────────────────────────────

export const LENS_ROOT = path.resolve(import.meta.dirname ?? '.', '../..');
export const LEDGER_PATH = path.join(LENS_ROOT, 'workflow-skills', 'lesson-ledger.json');
export const UNIVERSAL_LESSONS_PATH = path.join(LENS_ROOT, 'workflow-skills', 'lessons.md');

// ─── Thresholds ──────────────────────────────────────────────────────────────

export const JACCARD_THRESHOLD = 0.6;

// ─── Categories ──────────────────────────────────────────────────────────────

export const VALID_CATEGORIES = ['LOGIC', 'DESIGN', 'CODE_QUALITY', 'DUPLICATION', 'AI_SMELL'];

// ─── Keyword Maps ────────────────────────────────────────────────────────────

export const LANGUAGE_KEYWORDS: Record<string, RegExp[]> = {
  csharp: [
    /\bTask\b/, /\bCancellationToken\b/, /\bLINQ\b/, /\bIEnumerable\b/,
    /\.NET\b/, /\bNuGet\b/, /\bDbContext\b/, /\bEF Core\b/i, /\bStartup\b/,
    /\bProgram\.cs\b/, /\bC#\b/i, /\b\.cs\b/,
  ],
  typescript: [
    /\bPromise\b/, /\basync\/await\b/, /\bfetch\b/, /\bDOM\b/, /\binnerHTML\b/,
    /\bquerySelector\b/, /\bnpm\b/, /\bpackage\.json\b/, /\bESLint\b/,
    /\bTypeScript\b/i, /\b\.ts\b/, /\b\.tsx\b/,
  ],
  javascript: [
    /\bJavaScript\b/i, /\b\.js\b/, /\b\.jsx\b/,
  ],
  python: [
    /\bpip\b/, /\bDjango\b/, /\bFlask\b/, /\b__init__\b/,
    /\bpytest\b/, /\bvenv\b/, /\bPython\b/i, /\b\.py\b/,
  ],
  java: [
    /\bSpring\b/, /\bMaven\b/, /\bGradle\b/, /\bJUnit\b/, /\b@Override\b/,
    /\bOptional\b/, /\bJava\b/i, /\b\.java\b/,
  ],
  go: [
    /\bgoroutine\b/, /\bchan\b/, /\bdefer\b/, /\bfmt\b/, /\bgo\.mod\b/,
    /\bGolang\b/i,
  ],
  rust: [
    /\bimpl\b/, /\btrait\b/, /\bcargo\b/, /\bunsafe\b/,
    /\blifetime\b/, /\bborrow\b/, /\bRust\b/i, /\b\.rs\b/,
  ],
  sql: [
    /\bSELECT\b/, /\bINSERT\b/, /\bINDEX\b/, /\bforeign key\b/i,
    /\bJOIN\b/, /\bschema\b/i,
  ],
};

export const FRAMEWORK_KEYWORDS: Record<string, RegExp[]> = {
  react: [/\buseState\b/, /\buseEffect\b/, /\bJSX\b/, /\bReact\b/],
  angular: [/\b@Component\b/, /\bNgModule\b/, /\bObservable\b/, /\bRxJS\b/],
  aspnet: [/\bController\b/, /\[HttpGet\]/, /\bIActionResult\b/, /\bMiddleware\b/, /\bStartup\.cs\b/],
  efcore: [/\bDbContext\b/, /\bDbSet\b/, /\bMigration\b/, /\bOnModelCreating\b/],
};

export const AVOIDANCE_KEYWORDS = /\b(?:avoid|don'?t|never|anti[- ]?pattern|do not|should not|shouldn'?t|must not)\b/i;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isAntiPattern(text: string): boolean {
  return AVOIDANCE_KEYWORDS.test(text);
}
