/**
 * Polyglot quality gate.
 *
 * Usage:
 *   tsx scripts/quality-gate.ts              # Lens own src/ (custom checks only)
 *   tsx scripts/quality-gate.ts <path>       # Any project (detect language → lint + custom checks)
 *
 * Exit 0 = pass, exit 1 = fail.
 *
 * Language support:
 *   JS/TS  → ESLint (must be configured in target project)
 *   Java   → Qodana qodana-jvm-community
 *   C#     → Qodana qodana-dotnet
 *   Python → Qodana qodana-python-community
 *   Go     → Qodana qodana-go
 *   Rust   → Qodana qodana-rust
 *   PHP    → Qodana qodana-php
 *   Ruby   → Qodana qodana-ruby
 *
 * Universal custom checks (all languages):
 *   1. Hardcoded secrets — API keys, passwords, tokens in source
 *
 * JS/TS-specific custom checks:
 *   2. Shell injection — exec()/execSync() with template literals
 *   3. Path traversal — user input reaching path.join without validation
 *   4. Circular imports — DFS cycle detection on import graph
 *   5. Raw error output — console.error(err) leaking raw error objects
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Violation {
  file: string;
  line: number;
  check: string;
  message: string;
}

export type Language = 'typescript' | 'java' | 'csharp' | 'python' | 'go' | 'rust' | 'php' | 'ruby';

export interface LintResult {
  passed: boolean;
  output: string;
}

export interface PhaseMetric {
  phase: string;
  issuesFound: number;
  issuesFixed: number;
  durationMs: number;
}

export interface PipelineMetrics {
  pipeline: string;
  target: string;
  startedAt: string;
  completedAt?: string;
  phases: PhaseMetric[];
}

export interface ConstructionCheck {
  type: 'file' | 'export_function' | 'export_type';
  name: string;
  file?: string;
}

export interface ConstructionResult {
  check: ConstructionCheck;
  found: boolean;
}

export const QODANA_LINTERS: Record<Exclude<Language, 'typescript'>, string> = {
  java: 'qodana-jvm-community',
  csharp: 'qodana-dotnet',
  python: 'qodana-python-community',
  go: 'qodana-go',
  rust: 'qodana-rust',
  php: 'qodana-php',
  ruby: 'qodana-ruby',
};

export const SOURCE_EXTENSIONS: Record<Language, string[]> = {
  typescript: ['.ts', '.tsx', '.js', '.jsx'],
  java: ['.java'],
  csharp: ['.cs'],
  python: ['.py'],
  go: ['.go'],
  rust: ['.rs'],
  php: ['.php'],
  ruby: ['.rb'],
};

const SKIP_DIRS = new Set([
  'node_modules', 'dist', 'build', 'target', 'bin', 'obj',
  '__pycache__', 'vendor', 'scripts', 'mcp-servers',
]);

export const TEST_PATTERNS = [
  /\.test\.\w+$/,
  /\.spec\.\w+$/,
  /_test\.\w+$/,
  /Test\.java$/,
  /Tests?\.cs$/,
  /test_.*\.py$/,
  /_test\.go$/,
  /_test\.rs$/,
];

// ─── File Collection ─────────────────────────────────────────────────────────

export function collectFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

export function isTestFile(filePath: string): boolean {
  return TEST_PATTERNS.some(p => p.test(path.basename(filePath)));
}

export function collectSourceFiles(dir: string, extensions: string[]): string[] {
  return collectFiles(dir, extensions).filter(f => !isTestFile(f));
}

function relativeTo(base: string, filePath: string): string {
  return path.relative(base, filePath);
}

// ─── Language Detection ──────────────────────────────────────────────────────

export function detectLanguages(projectDir: string): Language[] {
  const detected: Language[] = [];
  for (const [lang, exts] of Object.entries(SOURCE_EXTENSIONS) as [Language, string[]][]) {
    const files = collectFiles(projectDir, exts);
    if (files.length > 0) detected.push(lang);
  }
  return detected;
}

// ─── Linter Dispatch ─────────────────────────────────────────────────────────

export function runEslint(projectDir: string): LintResult {
  const hasConfig = fs.existsSync(path.join(projectDir, 'eslint.config.js')) ||
                    fs.existsSync(path.join(projectDir, 'eslint.config.mjs')) ||
                    fs.existsSync(path.join(projectDir, '.eslintrc.json')) ||
                    fs.existsSync(path.join(projectDir, '.eslintrc.js'));

  if (!hasConfig) {
    return { passed: true, output: 'ESLint: no config found, skipping' };
  }

  try {
    const output = execSync('npx eslint src/', {
      cwd: projectDir,
      encoding: 'utf-8',
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { passed: true, output: output || 'ESLint: passed' };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return { passed: false, output: e.stdout || e.stderr || 'ESLint: failed' };
  }
}

export function runQodana(projectDir: string, linter: string): LintResult {
  try {
    execSync('which qodana', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    return { passed: true, output: `Qodana: CLI not found, skipping ${linter}` };
  }

  try {
    const output = execSync(
      `qodana scan --linter ${linter} --project-dir ${JSON.stringify(projectDir)} --print-problems`,
      { encoding: 'utf-8', timeout: 600_000, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    return { passed: true, output: output || `Qodana ${linter}: passed` };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    const output = (e.stdout || '') + (e.stderr || '');
    return { passed: false, output: output || `Qodana ${linter}: failed` };
  }
}

export function runLinter(projectDir: string, lang: Language): LintResult {
  if (lang === 'typescript') return runEslint(projectDir);
  return runQodana(projectDir, QODANA_LINTERS[lang]);
}

// ─── Universal Custom Checks (All Languages) ────────────────────────────────

export function checkHardcodedSecrets(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const secretPatterns = [
    { pattern: /['"](?:sk|pk|api|token|key|secret|password|passwd|pwd)[-_]?[a-zA-Z0-9]{20,}['"]/, name: 'API key/token' },
    { pattern: /(?:password|passwd|pwd|secret|token)\s*[:=]\s*['"][^'"]{8,}['"]/, name: 'hardcoded credential' },
    { pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, name: 'private key' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub PAT' },
    { pattern: /xox[bprs]-[a-zA-Z0-9-]+/, name: 'Slack token' },
  ];

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) continue;
      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(line)) {
          violations.push({
            file: relativeTo(base, file),
            line: i + 1,
            check: 'hardcoded-secret',
            message: `Possible ${name} — use environment variables`,
          });
        }
      }
    }
  }
  return violations;
}

// ─── JS/TS-Specific Custom Checks ───────────────────────────────────────────

export function checkShellInjection(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const dangerPattern = /\b(exec|execSync)\s*\(\s*`/;

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (dangerPattern.test(lines[i])) {
        violations.push({
          file: relativeTo(base, file),
          line: i + 1,
          check: 'shell-injection',
          message: 'exec()/execSync() called with template literal — use spawn() with argument array',
        });
      }
    }
  }
  return violations;
}

export function checkPathTraversal(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const pathJoinPattern = /path\.(join|resolve)\s*\([^)]*\b(req\.|params\.|query\.|input\.|userInput|fileName|filePath)\b/;

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pathJoinPattern.test(lines[i])) {
        const context = lines.slice(Math.max(0, i - 5), i).join('\n');
        if (!context.includes('includes(\'..\')') && !context.includes('traversal') &&
            !context.includes('sanitize') && !context.includes('normalize')) {
          violations.push({
            file: relativeTo(base, file),
            line: i + 1,
            check: 'path-traversal',
            message: 'User-controlled input in path.join/resolve without traversal validation',
          });
        }
      }
    }
  }
  return violations;
}

export function checkCircularImports(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const graph = new Map<string, string[]>();
  const importPattern = /(?:import|from)\s+['"](\.[^'"]+)['"]/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const deps: string[] = [];
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const resolved = resolveImport(file, match[1]);
      if (resolved) deps.push(resolved);
    }
    graph.set(file, deps);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string, stack: string[]): void {
    if (inStack.has(node)) {
      const cycleStart = stack.indexOf(node);
      const cycle = stack.slice(cycleStart).map(f => relativeTo(base, f));
      violations.push({
        file: relativeTo(base, node),
        line: 0,
        check: 'circular-import',
        message: `Circular: ${cycle.join(' → ')} → ${relativeTo(base, node)}`,
      });
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    inStack.add(node);
    stack.push(node);
    for (const dep of graph.get(node) ?? []) dfs(dep, stack);
    inStack.delete(node);
    stack.pop();
  }

  for (const file of graph.keys()) dfs(file, []);
  return violations;
}

export function resolveImport(fromFile: string, importPath: string): string | null {
  const dir = path.dirname(fromFile);
  const candidates = [
    path.resolve(dir, importPath),
    path.resolve(dir, `${importPath}.ts`),
    path.resolve(dir, importPath.replace(/\.js$/, '.ts')),
    path.resolve(dir, importPath, 'index.ts'),
  ];
  return candidates.find(c => fs.existsSync(c)) ?? null;
}

export function checkRawErrorOutput(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const rawErrorPattern = /console\.error\(\s*(err|error)\s*\)/;

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (rawErrorPattern.test(lines[i])) {
        violations.push({
          file: relativeTo(base, file),
          line: i + 1,
          check: 'raw-error-output',
          message: 'Raw error object passed to console.error — use error.message instead',
        });
      }
    }
  }
  return violations;
}

// ─── Lesson-Learned Checks (from phase-loop findings) ────────────────────────

export function checkToctou(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/\b(?:existsSync|accessSync)\s*\(\s*([^)]+)\)/);
      if (!m) continue;
      const pathArg = m[1].trim();
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (/\b(?:readFileSync|readFile|createReadStream)\b/.test(lines[j]) && lines[j].includes(pathArg)) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'toctou', message: `existsSync() then read on line ${j + 1} — use try/catch around the read instead` });
          break;
        }
      }
    }
  }
  return violations;
}

export function checkVerificationReads(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/\bwriteFileSync\s*\(\s*([^,]+)/);
      if (!m) continue;
      const pathArg = m[1].trim();
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        if (/\breadFileSync\b/.test(lines[j]) && lines[j].includes(pathArg)) {
          violations.push({ file: relativeTo(base, file), line: j + 1, check: 'verification-read', message: 'readFileSync() right after writeFileSync() on same path — write succeeded if no throw' });
          break;
        }
      }
    }
  }
  return violations;
}

export function checkDangerousEval(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const patterns = [
    { pattern: /\beval\s*\(/, name: 'eval()' },
    { pattern: /\.innerHTML\s*=/, name: 'innerHTML assignment' },
    { pattern: /\bdocument\.write\s*\(/, name: 'document.write()' },
  ];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      for (const { pattern, name } of patterns) {
        if (pattern.test(lines[i])) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'dangerous-eval', message: `${name} — use safe alternatives` });
        }
      }
    }
  }
  return violations;
}

export function checkFalsyNumericGuard(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    const numVars = new Set<string>();
    for (const line of lines) {
      const m1 = line.match(/(\w+)\s*\?:\s*number/);
      if (m1) numVars.add(m1[1]);
      const m2 = line.match(/(\w+)\s*:\s*number\s*\|\s*undefined/);
      if (m2) numVars.add(m2[1]);
    }
    if (numVars.size === 0) continue;
    for (let i = 0; i < lines.length; i++) {
      for (const v of numVars) {
        if (new RegExp(`\\bif\\s*\\(\\s*${v}\\s*\\)`).test(lines[i])) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'falsy-numeric-guard', message: `Truthy check on optional number '${v}' — 0 is falsy, use '!== undefined'` });
        }
      }
    }
  }
  return violations;
}

export function checkCommentSpam(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!/^\s*\/\*\*/.test(lines[i])) continue;
      let doc = '', j = i, jsdocLines = 0;
      while (j < lines.length) {
        doc += ' ' + lines[j].replace(/^\s*\/?[*]+\s*/, '').replace(/\*\/\s*$/, '');
        jsdocLines++;
        if (lines[j].includes('*/')) { j++; break; }
        j++;
      }
      if (jsdocLines > 3 || j >= lines.length) continue;
      const fnMatch = lines[j]?.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (!fnMatch) continue;
      const fnName = fnMatch[1];
      const nameWords = fnName.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (nameWords.length < 2) continue;
      const cleanDoc = doc.toLowerCase().replace(/@\w+/g, '').replace(/[^a-z\s]/g, '').trim();
      if (cleanDoc.length > 80) continue;
      const docWords = new Set(cleanDoc.split(/\s+/).filter(w => w.length > 2));
      const overlap = nameWords.filter(w => docWords.has(w));
      if (overlap.length >= nameWords.length - 1) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'comment-spam', message: `JSDoc restates function name '${fnName}' — remove or add non-obvious info` });
      }
    }
  }
  return violations;
}

// ─── Layer 2: Proxy Checks (TS-specific) ────────────────────────────────────

const BANNED_PARAM_NAMES = new Set(['data', 'info', 'result', 'item', 'obj', 'val', 'tmp', 'temp', 'ret', 'res']);
const ALLOWED_SINGLE_LETTER = new Set(['_', 'i', 'j', 'k', 'e']);
const BANNED_FILE_NAMES = new Set(['utils.ts', 'helpers.ts', 'misc.ts', 'common.ts', 'shared.ts']);
const BANNED_ABBREVIATIONS = ['mgr', 'impl', 'proc', 'svc', 'repo'];

export function checkBannedParamNames(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const paramRegex = /export\s+(?:async\s+)?function\s+\w+\s*\(([^)]*)\)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = paramRegex.exec(content)) !== null) {
      const params = match[1]!;
      const lineNum = content.substring(0, match.index).split('\n').length;
      for (const p of params.split(',')) {
        const name = p.trim().split(/[\s:?=]/)[0]!.replace(/[{}\[\]]/g, '');
        if (BANNED_PARAM_NAMES.has(name)) {
          violations.push({ file: relativeTo(base, file), line: lineNum, check: 'banned-param-name', message: `Exported function parameter named '${name}'` });
        }
      }
    }
  }
  return violations;
}

export function checkSingleLetterParams(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const paramRegex = /(?:export\s+)?(?:async\s+)?function\s+\w+\s*\(([^)]*)\)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = paramRegex.exec(content)) !== null) {
      const params = match[1]!;
      const lineNum = content.substring(0, match.index).split('\n').length;
      for (const p of params.split(',')) {
        const name = p.trim().split(/[\s:?=]/)[0]!.replace(/[{}\[\]]/g, '');
        if (name.length === 1 && !ALLOWED_SINGLE_LETTER.has(name)) {
          violations.push({ file: relativeTo(base, file), line: lineNum, check: 'single-letter-param', message: `Single-letter parameter '${name}'` });
        }
      }
    }
  }
  return violations;
}

export function checkShortFunctionNames(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const fnRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = fnRegex.exec(content)) !== null) {
      const name = match[1]!;
      const lineNum = content.substring(0, match.index).split('\n').length;
      if (name.length < 4) {
        violations.push({ file: relativeTo(base, file), line: lineNum, check: 'short-function-name', message: `Exported function '${name}' under 4 chars` });
      }
    }
  }
  return violations;
}

export function checkBannedFileNames(files: string[], base: string): Violation[] {
  return files
    .filter(f => BANNED_FILE_NAMES.has(path.basename(f)))
    .map(f => ({ file: relativeTo(base, f), line: 1, check: 'banned-file-name', message: `File named '${path.basename(f)}' — use a descriptive name` }));
}

export function checkAbbreviatedNames(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const exportRegex = /export\s+(?:const|function|class|type|interface)\s+(\w+)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const words = match[1]!.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase().split(/[_\d]+/);
      for (const abbr of BANNED_ABBREVIATIONS) {
        if (words.includes(abbr)) {
          violations.push({ file: relativeTo(base, file), line: lineNum, check: 'abbreviated-name', message: `Export '${match[1]}' contains abbreviation '${abbr}'` });
        }
      }
    }
  }
  return violations;
}

export function checkExportCount(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    if (path.basename(file) === 'index.ts') continue;
    const content = fs.readFileSync(file, 'utf-8');
    const count = (content.match(/^export\s/gm) || []).length;
    if (count > 10) {
      violations.push({ file: relativeTo(base, file), line: 1, check: 'export-count', message: `${count} exports (max 10)` });
    }
  }
  return violations;
}

export function checkParameterCount(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const fnRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = fnRegex.exec(content)) !== null) {
      const params = match[2]!.trim();
      if (!params) continue;
      const lineNum = content.substring(0, match.index).split('\n').length;
      let count = 0;
      let depth = 0;
      for (const ch of params) {
        if (ch === '{' || ch === '[') depth++;
        else if (ch === '}' || ch === ']') depth--;
        else if (ch === ',' && depth === 0) count++;
      }
      count++;
      if (count > 4) {
        violations.push({ file: relativeTo(base, file), line: lineNum, check: 'parameter-count', message: `Function '${match[1]}' has ${count} params (max 4)` });
      }
    }
  }
  return violations;
}

export function checkImportFanIn(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const projectImports = (content.match(/^import\s.*from\s+['"]\.\//gm) || []).length +
      (content.match(/^import\s.*from\s+['"]\.\.\/]/gm) || []).length;
    if (projectImports > 8) {
      violations.push({ file: relativeTo(base, file), line: 1, check: 'import-fan-in', message: `${projectImports} project imports (max 8)` });
    }
  }
  return violations;
}

export function checkFileLength(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lineCount = fs.readFileSync(file, 'utf-8').split('\n').length;
    if (lineCount > 300) {
      violations.push({ file: relativeTo(base, file), line: 1, check: 'file-length', message: `${lineCount} lines (max 300)` });
    }
  }
  return violations;
}

const FN_DECL_RE = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
const ARROW_RE = /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(.*\).*=>\s*\{/;
const METHOD_RE = /^\s+(?:(?:public|private|protected|static|override|get|set)\s+)*(?:async\s+)?(\w+)\s*\(/;
const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'throw', 'new', 'do', 'try', 'typeof', 'delete', 'void', 'super', 'yield', 'await', 'case', 'else', 'with']);

export function checkFunctionLength(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    let fnStart = -1, fnName = '', startDepth = 0, braceDepth = 0, significantLines = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (fnStart === -1) {
        let name: string | undefined;
        const fnMatch = line.match(FN_DECL_RE);
        const arrowMatch = line.match(ARROW_RE);
        const methodMatch = line.match(METHOD_RE);
        if (fnMatch) { name = fnMatch[1]; }
        else if (arrowMatch) { name = arrowMatch[1]; }
        else if (methodMatch && line.includes('{') && !CONTROL_KEYWORDS.has(methodMatch[1]!)) { name = methodMatch[1]; }
        if (name) { fnStart = i; fnName = name; startDepth = braceDepth; significantLines = 0; }
      }
      for (const ch of line) { if (ch === '{') braceDepth++; if (ch === '}') braceDepth--; }
      if (fnStart >= 0 && braceDepth > startDepth) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*')) significantLines++;
      }
      if (fnStart >= 0 && braceDepth === startDepth && i > fnStart) {
        if (significantLines > 30) {
          violations.push({ file: relativeTo(base, file), line: fnStart + 1, check: 'function-length', message: `Function '${fnName}' is ${significantLines} significant lines (max 30)` });
        }
        fnStart = -1;
      }
    }
  }
  return violations;
}

export function checkTestCoverage(projectDir: string, sourceFiles: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of sourceFiles) {
    const bn = path.basename(file);
    if (bn === 'index.ts' || bn === 'types.ts' || bn === 'types.d.ts') continue;
    const testPath = file.replace(/\.ts$/, '.test.ts');
    const rel = path.relative(projectDir, file);
    const testPathAlt = path.join(projectDir, 'test', rel.replace(/\.ts$/, '.test.ts'));
    if (!fs.existsSync(testPath) && !fs.existsSync(testPathAlt)) {
      violations.push({ file: relativeTo(base, file), line: 1, check: 'missing-test', message: `No test file for ${relativeTo(base, file)}` });
    }
  }
  return violations;
}

export function checkEmptyTests(projectDir: string, base: string): Violation[] {
  const violations: Violation[] = [];
  const testFiles = collectFiles(projectDir, ['.test.ts', '.spec.ts']);
  const itRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]*)/g;
  for (const file of testFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = itRegex.exec(content)) !== null) {
      const rest = content.substring(match.index + match[0].length);
      const openIdx = rest.indexOf('{');
      if (openIdx === -1) continue;
      let depth = 0;
      let closeIdx = -1;
      for (let ci = openIdx; ci < rest.length; ci++) {
        if (rest[ci] === '{') depth++;
        if (rest[ci] === '}') depth--;
        if (depth === 0) { closeIdx = ci; break; }
      }
      if (closeIdx === -1) continue;
      const body = rest.substring(openIdx, closeIdx + 1);
      if (!body.includes('expect')) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        violations.push({ file: relativeTo(base, file), line: lineNum, check: 'empty-test', message: `Test '${match[1]}' has no expect()` });
      }
    }
  }
  return violations;
}

export function checkTestImportingTest(projectDir: string, base: string): Violation[] {
  const violations: Violation[] = [];
  const testFiles = collectFiles(projectDir, ['.test.ts', '.spec.ts']);
  for (const file of testFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const imports = content.match(/from\s+['"]([^'"]*\.test)['"]/g) || [];
    for (const imp of imports) {
      violations.push({ file: relativeTo(base, file), line: 1, check: 'test-imports-test', message: `Test file imports another test: ${imp}` });
    }
  }
  return violations;
}

export function checkClassMethodCount(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const classRegex = /class\s+(\w+)/g;
    let classMatch;
    while ((classMatch = classRegex.exec(content)) !== null) {
      const className = classMatch[1]!;
      const lineNum = content.substring(0, classMatch.index).split('\n').length;
      const afterClass = content.substring(classMatch.index);
      let depth = 0, started = false, methodCount = 0;
      for (const line of afterClass.split('\n')) {
        for (const ch of line) { if (ch === '{') { depth++; started = true; } if (ch === '}') depth--; }
        if (started && depth === 1 && /^\s+(?:async\s+)?(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:get\s+|set\s+)?\w+\s*\(/.test(line)) methodCount++;
        if (started && depth === 0) break;
      }
      if (methodCount > 10) {
        violations.push({ file: relativeTo(base, file), line: lineNum, check: 'class-method-count', message: `Class '${className}' has ${methodCount} methods (max 10)` });
      }
    }
  }
  return violations;
}

export function checkInheritanceDepth(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const parentMap = new Map<string, string>();
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const regex = /class\s+(\w+)\s+extends\s+(\w+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) parentMap.set(match[1]!, match[2]!);
  }
  for (const [cls] of parentMap) {
    let depth = 0, current: string | undefined = cls;
    const seen = new Set<string>();
    while (current && parentMap.has(current)) {
      if (seen.has(current)) break;
      seen.add(current);
      current = parentMap.get(current);
      depth++;
    }
    if (depth > 2) violations.push({ file: 'project', line: 1, check: 'inheritance-depth', message: `Class '${cls}' has inheritance depth ${depth} (max 2)` });
  }
  return violations;
}

export function checkTypesBeforeFunctions(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    let firstFn = -1, firstType = -1;
    for (let i = 0; i < lines.length; i++) {
      if (firstFn === -1 && /^(?:export\s+)?(?:async\s+)?function\s/.test(lines[i]!)) firstFn = i;
      if (firstType === -1 && /^(?:export\s+)?(?:type|interface)\s/.test(lines[i]!)) firstType = i;
    }
    if (firstFn >= 0 && firstType >= 0 && firstFn < firstType) {
      violations.push({ file: relativeTo(base, file), line: firstFn + 1, check: 'types-before-functions', message: 'First function appears before first type declaration' });
    }
  }
  return violations;
}

export function checkMagicNumbers(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const ALLOWED = new Set(['-1', '0', '1', '2']);
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/^\s*(const|import|\/\/|\*|export\s+const)/.test(line)) continue;
      const nums = line.match(/(?<![a-zA-Z_$.])\b(\d+(?:\.\d+)?)\b/g) || [];
      for (const num of nums) {
        if (!ALLOWED.has(num)) violations.push({ file: relativeTo(base, file), line: i + 1, check: 'magic-number', message: `Magic number ${num}` });
      }
    }
  }
  return violations;
}

export function checkMagicStrings(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (/(?:===|!==|==|!=)\s*['"](?!['"])/.test(line)) {
        const m = line.match(/(?:===|!==|==|!=)\s*['"]([^'"]+)['"]/);
        if (m) violations.push({ file: relativeTo(base, file), line: i + 1, check: 'magic-string', message: `Magic string "${m[1]}" in conditional` });
      }
    }
  }
  return violations;
}

export function runProxyChecks(projectDir: string): Violation[] {
  const tsFiles = collectSourceFiles(projectDir, SOURCE_EXTENSIONS.typescript);
  return [
    ...checkBannedParamNames(tsFiles, projectDir),
    ...checkSingleLetterParams(tsFiles, projectDir),
    ...checkShortFunctionNames(tsFiles, projectDir),
    ...checkBannedFileNames(tsFiles, projectDir),
    ...checkAbbreviatedNames(tsFiles, projectDir),
    ...checkExportCount(tsFiles, projectDir),
    ...checkParameterCount(tsFiles, projectDir),
    ...checkImportFanIn(tsFiles, projectDir),
    ...checkFileLength(tsFiles, projectDir),
    ...checkFunctionLength(tsFiles, projectDir),
    ...checkTestCoverage(projectDir, tsFiles, projectDir),
    ...checkEmptyTests(projectDir, projectDir),
    ...checkTestImportingTest(projectDir, projectDir),
    ...checkClassMethodCount(tsFiles, projectDir),
    ...checkInheritanceDepth(tsFiles, projectDir),
    ...checkTypesBeforeFunctions(tsFiles, projectDir),
    ...checkMagicNumbers(tsFiles, projectDir),
    ...checkMagicStrings(tsFiles, projectDir),
    ...checkToctou(tsFiles, projectDir),
    ...checkVerificationReads(tsFiles, projectDir),
    ...checkDangerousEval(tsFiles, projectDir),
    ...checkFalsyNumericGuard(tsFiles, projectDir),
    ...checkCommentSpam(tsFiles, projectDir),
  ];
}

// ─── Layer 5: Canary Insertion/Validation ────────────────────────────────────

interface CanaryEntry {
  file: string;
  line: number;
  category: string;
  original: string;
  inserted: string;
}

interface CanaryManifest {
  phase: string;
  timestamp: string;
  canaries: CanaryEntry[];
}

const CANARY_TEMPLATES: Record<string, string> = {
  naming: 'export function process(d: any) { return d; }',
  security: 'import { exec } from "child_process";\nexec(`echo ${input}`);',
  secrets: 'const apiKey = "sk-canary-test-00000";',
  types: 'export function load(config: any): void {}',
  complexity: 'if (a) { if (b) { if (c) { if (d) { /* canary */ } } } }',
};

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function insertCanaries(phaseName: string, targetDir: string): void {
  const sourceFiles = collectSourceFiles(targetDir, SOURCE_EXTENSIONS.typescript)
    .filter(f => !['index.ts', 'quality-gate.ts'].includes(path.basename(f)));
  if (sourceFiles.length === 0) { console.error('No source files for canary insertion'); process.exit(1); }

  const categories = Object.keys(CANARY_TEMPLATES);
  const selected = pickRandom(categories, Math.min(3 + Math.floor(Math.random() * 3), categories.length));
  const canaries: CanaryEntry[] = [];

  for (const category of selected) {
    const file = pickRandom(sourceFiles, 1)[0]!;
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    let insertLine = -1, braceDepth = 0;
    for (let i = 0; i < lines.length; i++) {
      for (const ch of lines[i]!) { if (ch === '{') braceDepth++; if (ch === '}') braceDepth--; }
      if (braceDepth > 0 && lines[i]!.trim() !== '' && !lines[i]!.trim().startsWith('//')) insertLine = i;
    }
    if (insertLine === -1) insertLine = Math.min(5, lines.length);

    const template = CANARY_TEMPLATES[category]!;
    const original = lines[insertLine] ?? '';
    const needsImport = category === 'security' && !lines.some(l => l.includes('child_process'));
    if (needsImport) { lines.splice(0, 0, 'import { exec } from "child_process";'); insertLine++; }
    lines.splice(insertLine + 1, 0, `// CANARY:${category}`, template);
    canaries.push({ file, line: insertLine + 1, category, original, inserted: template });
    fs.writeFileSync(file, lines.join('\n'), 'utf-8');
  }

  const manifestDir = path.join(targetDir, '.claude');
  fs.mkdirSync(manifestDir, { recursive: true });
  const manifest: CanaryManifest = { phase: phaseName, timestamp: new Date().toISOString(), canaries };
  fs.writeFileSync(path.join(manifestDir, 'canary-manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Inserted ${canaries.length} canaries for phase '${phaseName}'`);
}

export function validateCanaries(phaseName: string, targetDir: string): void {
  const manifestPath = path.join(targetDir, '.claude', 'canary-manifest.json');
  if (!fs.existsSync(manifestPath)) { console.error('No canary manifest found'); process.exit(1); }

  const manifest: CanaryManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  let missed = 0;

  for (const canary of manifest.canaries) {
    const relFile = path.relative(targetDir, canary.file);
    if (!fs.existsSync(canary.file)) {
      console.log(`CAUGHT canary: ${canary.category} in ${relFile}:${canary.line} (file removed)`);
      continue;
    }
    const content = fs.readFileSync(canary.file, 'utf-8');
    const marker = `// CANARY:${canary.category}`;
    if (content.includes(marker)) {
      console.error(`MISSED canary: ${canary.category} in ${relFile}:${canary.line}`);
      missed++;
    } else {
      console.log(`CAUGHT canary: ${canary.category} in ${relFile}:${canary.line}`);
    }
  }

  // Restore files
  for (const canary of manifest.canaries) {
    if (fs.existsSync(canary.file)) {
      const lines = fs.readFileSync(canary.file, 'utf-8').split('\n');
      const restored = lines.filter(l =>
        !l.includes('// CANARY:') &&
        !Object.values(CANARY_TEMPLATES).some(t => t.split('\n').some(tl => l.includes(tl.trim()) && tl.trim().length > 5))
      );
      fs.writeFileSync(canary.file, restored.join('\n'), 'utf-8');
    }
  }
  fs.unlinkSync(manifestPath);

  if (missed > 0) { console.error(`\n${missed}/${manifest.canaries.length} canaries missed by phase '${phaseName}'`); process.exit(1); }
  console.log(`\nAll ${manifest.canaries.length} canaries caught by phase '${phaseName}'`);
}

// ─── Layer 3: Evidence Validation ────────────────────────────────────────────

interface EvidenceRow { location: string; item: string; verdict: string; reasoning: string; }

function parseChecklistRows(content: string): EvidenceRow[] {
  const rows: EvidenceRow[] = [];
  for (const line of content.split('\n')) {
    if (!line.includes('|') || !line.includes('src/')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 4) rows.push({ location: cols[0]!, item: cols[1]!, verdict: cols[2]!, reasoning: cols[3]! });
  }
  return rows;
}

function countExportedFunctionsAndConstants(dir: string): number {
  let n = 0;
  for (const f of collectSourceFiles(dir, SOURCE_EXTENSIONS.typescript)) {
    n += (fs.readFileSync(f, 'utf-8').match(/^export\s+(?:const|function|async\s+function)/gm) || []).length;
  }
  return n;
}

function countExportedFunctions(dir: string): number {
  let n = 0;
  for (const f of collectSourceFiles(dir, SOURCE_EXTENSIONS.typescript)) {
    n += (fs.readFileSync(f, 'utf-8').match(/^export\s+(?:async\s+)?function\s/gm) || []).length;
  }
  return n;
}

function countErrorPatterns(dir: string): number {
  let n = 0;
  for (const f of collectSourceFiles(dir, SOURCE_EXTENSIONS.typescript)) {
    n += (fs.readFileSync(f, 'utf-8').match(/console\.error|console\.log|throw\s+new\s+Error|reject\(/g) || []).length;
  }
  return n;
}

function countInputBoundaries(dir: string): number {
  let n = 0;
  for (const f of collectSourceFiles(dir, SOURCE_EXTENSIONS.typescript)) {
    n += (fs.readFileSync(f, 'utf-8').match(/process\.argv|commander|\.option\(|fs\.readFile|process\.env\./g) || []).length;
  }
  return n;
}

function countCatchBlocks(dir: string): number {
  let n = 0;
  for (const f of collectSourceFiles(dir, SOURCE_EXTENSIONS.typescript)) {
    n += (fs.readFileSync(f, 'utf-8').match(/catch\s*\(/g) || []).length;
  }
  return n;
}

function countEntryPoints(dir: string): number {
  let n = 0;
  for (const f of collectSourceFiles(dir, SOURCE_EXTENSIONS.typescript)) {
    n += (fs.readFileSync(f, 'utf-8').match(/\.command\(|\.action\(|createReadStream|createWriteStream|readFileSync|writeFileSync/g) || []).length;
  }
  return n;
}

const CHECKLIST_COUNTERS: Record<string, { counter: (dir: string) => number; label: string }> = {
  'refactor-4a': { counter: countExportedFunctionsAndConstants, label: 'exported functions + constants' },
  'refactor-4b': { counter: countExportedFunctions, label: 'exported functions' },
  'gemini-6a': { counter: countErrorPatterns, label: 'error/log/throw/reject calls' },
  'gemini-6b': { counter: countInputBoundaries, label: 'CLI arg reads, fs reads, env access' },
  'codex-7a': { counter: countCatchBlocks, label: 'catch blocks' },
  'adversarial-9a': { counter: countEntryPoints, label: 'entry points' },
};

export function validateEvidence(phaseName: string, targetDir: string): void {
  const evidenceDir = path.join(targetDir, '.claude', 'evidence');
  if (!fs.existsSync(evidenceDir)) { console.error(`No evidence directory at ${evidenceDir}`); process.exit(1); }

  let allComplete = true;
  for (const file of fs.readdirSync(evidenceDir)) {
    if (!file.startsWith(`${phaseName}-`) || !file.endsWith('.md')) continue;
    const checklistId = file.replace('.md', '');
    const content = fs.readFileSync(path.join(evidenceDir, file), 'utf-8');
    const rows = parseChecklistRows(content);
    const cfg = CHECKLIST_COUNTERS[checklistId];
    if (!cfg) { console.log(`Checklist ${checklistId}: ${rows.length} items (no counter)`); continue; }
    const expected = cfg.counter(targetDir);
    if (rows.length >= expected) { console.log(`Checklist ${checklistId}: ${rows.length}/${expected} items reviewed`); }
    else { console.error(`Checklist ${checklistId}: ${rows.length}/${expected} INCOMPLETE (${cfg.label})`); allComplete = false; }
  }
  if (!allComplete) process.exit(1);
  console.log('\nAll evidence checklists complete');
}

// ─── Layer 4: Three-Model Vote Reconciliation ───────────────────────────────

export function reconcileVotes(targetDir: string): void {
  const evidenceDir = path.join(targetDir, '.claude', 'evidence');
  if (!fs.existsSync(evidenceDir)) { console.log('No evidence directory — nothing to reconcile'); return; }

  const itemMap = new Map<string, { key: string; reviews: Array<{ phase: string; verdict: string }> }>();
  for (const file of fs.readdirSync(evidenceDir)) {
    if (!file.endsWith('.md')) continue;
    const phase = file.replace(/\.md$/, '');
    for (const row of parseChecklistRows(fs.readFileSync(path.join(evidenceDir, file), 'utf-8'))) {
      const key = row.location.replace(/:\d+/, '').trim();
      if (!itemMap.has(key)) itemMap.set(key, { key, reviews: [] });
      itemMap.get(key)!.reviews.push({ phase, verdict: row.verdict });
    }
  }

  const disagreements: Array<{ key: string; reviews: Array<{ phase: string; verdict: string }> }> = [];
  let agreements = 0;
  for (const [, item] of itemMap) {
    if (item.reviews.length < 2) continue;
    const verdicts = new Set(item.reviews.map(r => r.verdict.toUpperCase()));
    if (verdicts.size > 1) disagreements.push(item);
    else agreements++;
  }

  console.log(`Reconciliation: ${agreements} agreements, ${disagreements.length} disagreements`);
  if (disagreements.length === 0) { console.log('No disagreements — all models agree'); return; }

  const report = ['# Vote Disagreements', '', '| Location | Reviews |', '|----------|---------|'];
  for (const d of disagreements) {
    report.push(`| ${d.key} | ${d.reviews.map(r => `${r.phase}: ${r.verdict}`).join(', ')} |`);
  }
  fs.writeFileSync(path.join(evidenceDir, 'vote-disagreements.md'), report.join('\n'), 'utf-8');
  console.log(`Wrote disagreement report to .claude/evidence/vote-disagreements.md`);
  process.exit(1);
}

// ─── Pipeline Metrics ────────────────────────────────────────────────────────

export function startPipelineMetrics(pipeline: string, target: string, metricsDir: string): void {
  const metrics: PipelineMetrics = { pipeline, target, startedAt: new Date().toISOString(), phases: [] };
  fs.mkdirSync(metricsDir, { recursive: true });
  fs.writeFileSync(path.join(metricsDir, 'active-metrics.json'), JSON.stringify(metrics, null, 2), 'utf-8');
}

export function recordPhaseMetrics(metricsDir: string, phase: string, issuesFound: number, issuesFixed: number, durationMs: number): void {
  const metricsPath = path.join(metricsDir, 'active-metrics.json');
  const metrics: PipelineMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
  metrics.phases.push({ phase, issuesFound, issuesFixed, durationMs });
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2), 'utf-8');
}

export function reportMetrics(metricsDir: string): void {
  const metricsPath = path.join(metricsDir, 'active-metrics.json');
  const metrics: PipelineMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
  metrics.completedAt = new Date().toISOString();
  const archiveName = `${metrics.pipeline}-${metrics.startedAt.replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(path.join(metricsDir, archiveName), JSON.stringify(metrics, null, 2), 'utf-8');
  fs.unlinkSync(metricsPath);
  console.log(`\nPipeline: ${metrics.pipeline} → ${metrics.target}`);
  for (const p of metrics.phases) {
    console.log(`  ${p.phase}: ${p.issuesFound} found, ${p.issuesFixed} fixed (${p.durationMs}ms)`);
  }
  const totalFound = metrics.phases.reduce((s, p) => s + p.issuesFound, 0);
  const totalFixed = metrics.phases.reduce((s, p) => s + p.issuesFixed, 0);
  console.log(`Total: ${totalFound} found, ${totalFixed} fixed`);
}

// ─── Construction Validation ─────────────────────────────────────────────────

export function parseConstructionChecks(planContent: string): ConstructionCheck[] {
  const checks: ConstructionCheck[] = [];
  const lines = planContent.split('\n');
  let inSection = false;
  for (const line of lines) {
    if (/^##\s*CONSTRUCTION_CHECKS/i.test(line)) { inSection = true; continue; }
    if (inSection && /^##\s/.test(line)) break;
    if (!inSection) continue;
    const fileMatch = line.match(/^-\s*FILE:\s*(.+)/i);
    if (fileMatch) { checks.push({ type: 'file', name: fileMatch[1].trim() }); continue; }
    const fnMatch = line.match(/^-\s*EXPORT_FUNCTION:\s*(\w+)\s+IN\s+(.+)/i);
    if (fnMatch) { checks.push({ type: 'export_function', name: fnMatch[1], file: fnMatch[2].trim() }); continue; }
    const typeMatch = line.match(/^-\s*EXPORT_TYPE:\s*(\w+)\s+IN\s+(.+)/i);
    if (typeMatch) { checks.push({ type: 'export_type', name: typeMatch[1], file: typeMatch[2].trim() }); continue; }
  }
  return checks;
}

export function validateConstruction(planPath: string, projectDir: string): { passed: boolean; results: ConstructionResult[] } {
  const planContent = fs.readFileSync(planPath, 'utf-8');
  const checks = parseConstructionChecks(planContent);
  const results: ConstructionResult[] = [];
  for (const check of checks) {
    let found = false;
    if (check.type === 'file') {
      found = fs.existsSync(path.join(projectDir, check.name));
    } else if (check.file) {
      const filePath = path.join(projectDir, check.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (check.type === 'export_function') {
          found = new RegExp(`export\\s+(?:async\\s+)?function\\s+${check.name}\\b`).test(content) ||
                  new RegExp(`export\\s+const\\s+${check.name}\\s*=`).test(content);
        } else {
          found = new RegExp(`export\\s+(?:type|interface)\\s+${check.name}\\b`).test(content);
        }
      }
    }
    results.push({ check, found });
  }
  return { passed: results.every(r => r.found), results };
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

export interface GateResult {
  passed: boolean;
  languages: Language[];
  lintFailures: string[];
  violations: Violation[];
}

export function runGate(projectDir: string, skipLinters = false): GateResult {
  const languages = detectLanguages(projectDir);
  const lintFailures: string[] = [];
  const violations: Violation[] = [];

  if (languages.length === 0) {
    return { passed: true, languages: [], lintFailures: [], violations: [] };
  }

  // Phase 1: Language-specific linters
  if (!skipLinters) {
    for (const lang of languages) {
      const result = runLinter(projectDir, lang);
      if (!result.passed) lintFailures.push(lang);
    }
  }

  // Phase 2: Custom checks (Layer 1)
  const allExtensions = languages.flatMap(l => SOURCE_EXTENSIONS[l]);
  const allSourceFiles = collectSourceFiles(projectDir, allExtensions);

  violations.push(...checkHardcodedSecrets(allSourceFiles, projectDir));

  if (languages.includes('typescript')) {
    const tsFiles = collectSourceFiles(projectDir, SOURCE_EXTENSIONS.typescript);
    violations.push(
      ...checkShellInjection(tsFiles, projectDir),
      ...checkPathTraversal(tsFiles, projectDir),
      ...checkCircularImports(tsFiles, projectDir),
      ...checkRawErrorOutput(tsFiles, projectDir),
    );

    // Phase 3: Proxy checks (Layer 2)
    violations.push(...runProxyChecks(projectDir));
  }

  const totalIssues = lintFailures.length + violations.length;
  return { passed: totalIssues === 0, languages, lintFailures, violations };
}

// ─── CLI Entry Point ─────────────────────────────────────────────────────────

function runDefaultGate(targetArg?: string): void {
  const LENS_ROOT = path.resolve(import.meta.dirname ?? '.', '..');
  const projectDir = targetArg ? path.resolve(targetArg) : LENS_ROOT;
  const isLensSelf = !targetArg || path.resolve(targetArg) === LENS_ROOT;

  if (!fs.existsSync(projectDir)) {
    console.error(`Target not found: ${projectDir}`);
    process.exit(1);
  }

  const result = runGate(projectDir, isLensSelf);

  if (result.languages.length === 0) {
    console.log('Quality gate: no recognized source files found');
    process.exit(0);
  }

  console.log(`Quality gate: ${projectDir}`);
  console.log(`Languages detected: ${result.languages.join(', ')}\n`);

  if (result.violations.length > 0) {
    console.error(`Custom checks: ${result.violations.length} violation(s)\n`);
    for (const v of result.violations) {
      const location = v.line > 0 ? `:${v.line}` : '';
      console.error(`  ${v.check} ${v.file}${location}`);
      console.error(`    ${v.message}\n`);
    }
  }

  if (result.lintFailures.length > 0) {
    console.error(`Linter failures: ${result.lintFailures.join(', ')}`);
  }

  if (result.passed) {
    console.log('Quality gate: all checks passed');
    process.exit(0);
  } else {
    console.error(`\nQuality gate: FAILED (${result.lintFailures.length + result.violations.length} issue(s))`);
    process.exit(1);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'insert-canaries': {
      const phase = args[1];
      const target = args[2];
      if (!phase || !target) { console.error('Usage: quality-gate insert-canaries <phase> <target-dir>'); process.exit(1); }
      insertCanaries(phase, path.resolve(target));
      break;
    }
    case 'validate-canaries': {
      const phase = args[1];
      const target = args[2];
      if (!phase || !target) { console.error('Usage: quality-gate validate-canaries <phase> <target-dir>'); process.exit(1); }
      validateCanaries(phase, path.resolve(target));
      break;
    }
    case 'validate-evidence': {
      const phase = args[1];
      const target = args[2];
      if (!phase || !target) { console.error('Usage: quality-gate validate-evidence <phase> <target-dir>'); process.exit(1); }
      validateEvidence(phase, path.resolve(target));
      break;
    }
    case 'reconcile-votes': {
      const target = args[1];
      if (!target) { console.error('Usage: quality-gate reconcile-votes <target-dir>'); process.exit(1); }
      reconcileVotes(path.resolve(target));
      break;
    }
    case 'start-metrics': {
      const pipeline = args[1];
      const target = args[2];
      if (!pipeline || !target) { console.error('Usage: quality-gate start-metrics <pipeline> <target>'); process.exit(1); }
      const metricsDir = path.join(path.resolve(target), '.claude', 'metrics');
      startPipelineMetrics(pipeline, target, metricsDir);
      console.log(`Metrics started: ${pipeline} → ${target}`);
      break;
    }
    case 'record-metrics': {
      const phase = args[1];
      const found = parseInt(args[2] ?? '', 10);
      const fixed = parseInt(args[3] ?? '', 10);
      const ms = parseInt(args[4] ?? '', 10);
      const tgt = args[5] ?? '.';
      if (!phase || isNaN(found) || isNaN(fixed) || isNaN(ms)) {
        console.error('Usage: quality-gate record-metrics <phase> <found> <fixed> <ms> [target]');
        process.exit(1);
      }
      recordPhaseMetrics(path.join(path.resolve(tgt), '.claude', 'metrics'), phase, found, fixed, ms);
      break;
    }
    case 'report-metrics': {
      const tgt = args[1] ?? '.';
      reportMetrics(path.join(path.resolve(tgt), '.claude', 'metrics'));
      break;
    }
    case 'validate-construction': {
      const planFile = args[1];
      const projectDir = args[2];
      if (!planFile || !projectDir) { console.error('Usage: quality-gate validate-construction <plan-file> <project-dir>'); process.exit(1); }
      const result = validateConstruction(path.resolve(planFile), path.resolve(projectDir));
      for (const r of result.results) {
        const status = r.found ? 'PASS' : 'FAIL';
        const detail = r.check.file ? `${r.check.name} in ${r.check.file}` : r.check.name;
        console.log(`  ${status}: ${r.check.type} ${detail}`);
      }
      if (result.passed) { console.log('\nConstruction check: all items present'); }
      else { console.error('\nConstruction check: FAILED — missing items'); process.exit(1); }
      break;
    }
    default:
      runDefaultGate(command);
  }
}

// Only run main when executed directly (not imported)
const isDirectRun = process.argv[1]?.endsWith('quality-gate.ts') ||
                    process.argv[1]?.endsWith('quality-gate.js');
if (isDirectRun) main();
