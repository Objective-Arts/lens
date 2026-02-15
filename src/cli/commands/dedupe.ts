/**
 * Deduplication detection command.
 *
 * Scans codebase for duplicated code patterns and reports consolidation opportunities.
 */

import * as path from 'path';
import { execFileSync } from 'child_process';

interface DuplicationPattern {
  name: string;
  pattern: string;
  description: string;
}

interface Finding {
  file: string;
  line: number;
  content: string;
}

interface DuplicationResult {
  pattern: string;
  description: string;
  findings: Finding[];
  recommendation: string;
}

/** Patterns to search for */
const PATTERNS: DuplicationPattern[] = [
  { name: 'copyDirectory', pattern: 'function copy.*Directory', description: 'Directory copy operations' },
  { name: 'hashFunction', pattern: 'function hash', description: 'Hashing functions' },
  { name: 'createHash', pattern: 'createHash\\(', description: 'Hash creation calls' },
  { name: 'gitExec', pattern: "execSync.*'git", description: 'Git exec calls' },
  { name: 'gitCommit', pattern: 'getGitCommit|git.*HEAD', description: 'Git commit retrieval' },
  { name: 'gitRemote', pattern: 'getGitRemote|git.*remote', description: 'Git remote retrieval' },
  { name: 'readFileSync', pattern: 'readFileSync.*utf-8', description: 'File reading patterns' },
  { name: 'writeFileSync', pattern: 'writeFileSync.*utf-8', description: 'File writing patterns' },
  { name: 'mkdirRecursive', pattern: "mkdirSync.*recursive.*true", description: 'Directory creation' },
  { name: 'validateFunction', pattern: 'function validate[A-Z]', description: 'Validation functions' },
  { name: 'isTypeGuard', pattern: 'function is[A-Z].*\\(.*\\):.*is ', description: 'Type guard functions' },
  { name: 'pathJoinClaude', pattern: "path\\.join.*'\\.claude'", description: '.claude path construction' },
];

/** Filter out non-source lines (node_modules, tests, dist). */
function isSourceLine(line: string): boolean {
  return !line.includes('node_modules') && !line.includes('.test.ts') && !line.includes('dist/');
}

/** Run grep safely using execFileSync (no shell interpolation). */
function searchPattern(pattern: string, searchPath: string): Finding[] {
  const findings: Finding[] = [];

  try {
    const result = execFileSync('grep', [
      '-rn', pattern, '--include=*.ts', searchPath,
    ], { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });

    for (const line of result.trim().split('\n')) {
      if (!line || !isSourceLine(line)) continue;
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        findings.push({
          file: match[1],
          line: parseInt(match[2], 10),
          content: match[3].trim().slice(0, 80)
        });
      }
    }
  } catch (error: unknown) {
    // grep returns exit code 1 when no matches found — that's expected
    const exitCode = (error as { status?: number }).status;
    if (exitCode !== 1) {
      throw error;
    }
  }

  return findings;
}

/** Group findings by similarity */
function analyzeDuplications(searchPath: string): DuplicationResult[] {
  const results: DuplicationResult[] = [];

  for (const pattern of PATTERNS) {
    const findings = searchPattern(pattern.pattern, searchPath);

    // Only report if found in 2+ files
    const uniqueFiles = new Set(findings.map(f => f.file));
    if (uniqueFiles.size >= 2) {
      results.push({
        pattern: pattern.name,
        description: pattern.description,
        findings,
        recommendation: generateRecommendation(pattern.name, findings)
      });
    }
  }

  return results;
}

function generateRecommendation(patternName: string, findings: Finding[]): string {
  const fileCount = new Set(findings.map(f => f.file)).size;

  const recommendations: Record<string, string> = {
    copyDirectory: `Extract to utils/fs.ts with sync and async variants`,
    hashFunction: `Consolidate to utils/hash.ts if algorithms are identical`,
    createHash: `Check if same hashing logic - extract to shared utility`,
    gitExec: `Replace execSync with file-based git reading (faster, no process spawn)`,
    gitCommit: `Extract to utils/git.ts`,
    gitRemote: `Extract to utils/git.ts`,
    readFileSync: `Consider shared file reading utility if patterns are identical`,
    writeFileSync: `Consider shared file writing utility if patterns are identical`,
    mkdirRecursive: `Common pattern - usually OK unless wrapped in identical helper`,
    validateFunction: `Check if validation logic overlaps - may need shared validators`,
    isTypeGuard: `Check if type guards are duplicated - extract to types/guards.ts`,
    pathJoinClaude: `Extract CLAUDE_DIR constant to shared paths module`,
  };

  return recommendations[patternName] || `Found in ${fileCount} files - review for consolidation`;
}

function formatResultEntry(result: DuplicationResult, index: number): string[] {
  const lines: string[] = [];
  const uniqueFiles = [...new Set(result.findings.map(f => f.file))];

  lines.push(`### ${index + 1}. ${result.pattern}`);
  lines.push(`${result.description}`);
  lines.push('');
  lines.push('FILES:');

  for (const file of uniqueFiles) {
    const firstFinding = result.findings.find(f => f.file === file)!;
    lines.push(`- ${file}:${firstFinding.line} - ${firstFinding.content}`);
  }

  lines.push('');
  lines.push(`RECOMMENDATION: ${result.recommendation}`);
  lines.push('');
  return lines;
}

function formatPriorityList(results: DuplicationResult[]): string[] {
  const lines: string[] = ['CONSOLIDATION_PRIORITY:'];
  for (let i = 0; i < Math.min(results.length, 5); i++) {
    const fileCount = new Set(results[i].findings.map(f => f.file)).size;
    lines.push(`${i + 1}. ${results[i].pattern} (${fileCount} files)`);
  }
  lines.push('');
  lines.push('DEDUPLICATION_COMPLETE');
  return lines;
}

function formatReport(results: DuplicationResult[], searchPath: string): string {
  const lines: string[] = [
    `## Deduplication Report: ${searchPath}`, '',
    `DUPLICATIONS_FOUND: ${results.length}`, '',
  ];

  if (results.length === 0) {
    lines.push('No significant duplications detected.', '', 'DEDUPLICATION_COMPLETE');
    return lines.join('\n');
  }

  // Sort by number of files affected (descending)
  results.sort((a, b) => {
    const aFiles = new Set(a.findings.map(f => f.file)).size;
    const bFiles = new Set(b.findings.map(f => f.file)).size;
    return bFiles - aFiles;
  });

  for (let i = 0; i < results.length; i++) {
    lines.push(...formatResultEntry(results[i], i));
  }

  lines.push(...formatPriorityList(results));
  return lines.join('\n');
}

/** Main command handler */
function runDedupe(targetPath: string = '.'): string {
  const absolutePath = path.resolve(targetPath);

  try {
    const results = analyzeDuplications(absolutePath);
    return formatReport(results, targetPath);
  } catch {
    return `Error: Path not accessible: ${absolutePath}`;
  }
}

export function registerDedupeCommands(program: import('commander').Command): void {
  program
    .command('dedupe [path]')
    .description('Scan for duplicated code patterns')
    .option('-j, --json', 'Output as JSON')
    .action((targetPath: string = 'src', options: { json?: boolean }) => {
      const report = runDedupe(targetPath);
      if (options.json) {
        // For JSON output, re-run and format differently
        const results = analyzeDuplications(path.resolve(targetPath));
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(report);
      }
    });
}
