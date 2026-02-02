/**
 * Deduplication detection command.
 *
 * Scans codebase for duplicated code patterns and reports consolidation opportunities.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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

/** Run grep and parse results */
function searchPattern(pattern: string, searchPath: string): Finding[] {
  const findings: Finding[] = [];

  try {
    const result = execSync(
      `grep -rn "${pattern}" --include="*.ts" "${searchPath}" 2>/dev/null | grep -v node_modules | grep -v "\\.test\\.ts" | grep -v "dist/"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );

    for (const line of result.trim().split('\n')) {
      if (!line) continue;
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        findings.push({
          file: match[1],
          line: parseInt(match[2], 10),
          content: match[3].trim().slice(0, 80)
        });
      }
    }
  } catch {
    // grep returns non-zero if no matches
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

/** Generate recommendation based on pattern */
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

/** Format report */
function formatReport(results: DuplicationResult[], searchPath: string): string {
  const lines: string[] = [];

  lines.push(`## Deduplication Report: ${searchPath}`);
  lines.push('');
  lines.push(`DUPLICATIONS_FOUND: ${results.length}`);
  lines.push('');

  if (results.length === 0) {
    lines.push('No significant duplications detected.');
    lines.push('');
    lines.push('DEDUPE_COMPLETE');
    return lines.join('\n');
  }

  // Sort by number of files affected
  results.sort((a, b) => {
    const aFiles = new Set(a.findings.map(f => f.file)).size;
    const bFiles = new Set(b.findings.map(f => f.file)).size;
    return bFiles - aFiles;
  });

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const uniqueFiles = [...new Set(result.findings.map(f => f.file))];

    lines.push(`### ${i + 1}. ${result.pattern}`);
    lines.push(`${result.description}`);
    lines.push('');
    lines.push('FILES:');

    for (const file of uniqueFiles) {
      const fileFindings = result.findings.filter(f => f.file === file);
      const firstFinding = fileFindings[0];
      lines.push(`- ${file}:${firstFinding.line} - ${firstFinding.content}`);
    }

    lines.push('');
    lines.push(`RECOMMENDATION: ${result.recommendation}`);
    lines.push('');
  }

  lines.push('CONSOLIDATION_PRIORITY:');
  for (let i = 0; i < Math.min(results.length, 5); i++) {
    const result = results[i];
    const fileCount = new Set(result.findings.map(f => f.file)).size;
    lines.push(`${i + 1}. ${result.pattern} (${fileCount} files)`);
  }
  lines.push('');
  lines.push('DEDUPE_COMPLETE');

  return lines.join('\n');
}

/** Main command handler */
export function runDedupe(targetPath: string = '.'): string {
  const absolutePath = path.resolve(targetPath);

  if (!fs.existsSync(absolutePath)) {
    return `Error: Path not found: ${absolutePath}`;
  }

  const results = analyzeDuplications(absolutePath);
  return formatReport(results, targetPath);
}

/** Register dedupe commands */
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
