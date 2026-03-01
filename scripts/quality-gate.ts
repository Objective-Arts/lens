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
 *   C#     → Custom checks (async, security, design)
 *   Java   → Custom checks (types, strings, fields)
 *   All    → Universal checks (secrets, error handling, URLs, TODOs)
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

export function runLinter(projectDir: string, lang: Language): LintResult {
  if (lang === 'typescript') return runEslint(projectDir);
  return { passed: true, output: `${lang}: no linter configured, skipping` };
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

export function checkEmptyErrorHandling(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];

  for (const file of files) {
    const ext = path.extname(file);
    const lines = fs.readFileSync(file, 'utf-8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue;

      // Python: except...: followed by pass
      if (ext === '.py' && /^\s*except\b/.test(lines[i])) {
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const next = lines[j].trim();
          if (!next) continue;
          if (next === 'pass') {
            violations.push({ file: relativeTo(base, file), line: i + 1, check: 'empty-error-handler', message: 'except block only contains pass — handle or propagate the error' });
          }
          break;
        }
        continue;
      }

      // Ruby: rescue followed by end with nothing between
      if (ext === '.rb' && /^\s*rescue\b/.test(lines[i])) {
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const next = lines[j].trim();
          if (!next) continue;
          if (next === 'end') {
            violations.push({ file: relativeTo(base, file), line: i + 1, check: 'empty-error-handler', message: 'rescue block is empty — handle or propagate the error' });
          }
          break;
        }
        continue;
      }

      // Brace languages: JS/TS, Java, C#, Go, PHP
      let isCatch = /\bcatch\b/.test(lines[i]);
      if (ext === '.go' && /if\s+err\s*!=\s*nil/.test(lines[i])) isCatch = true;
      if (!isCatch || !lines[i].includes('{')) continue;

      // Same-line empty: catch (e) {} or if err != nil {}
      if (/\{\s*\}/.test(lines[i])) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'empty-error-handler', message: 'Empty error handler — handle or propagate the error' });
        continue;
      }

      // Multi-line: next non-blank line is just }
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (next === '}') {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'empty-error-handler', message: 'Empty error handler — handle or propagate the error' });
        }
        break;
      }
    }
  }
  return violations;
}

export function checkTodoAccumulation(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const pattern = /\b(TODO|FIXME|HACK|XXX)\b/;

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    let count = 0;
    for (const line of lines) {
      if (pattern.test(line)) count++;
    }
    if (count > 3) {
      violations.push({ file: relativeTo(base, file), line: 1, check: 'todo-accumulation', message: `${count} TODO/FIXME/HACK markers (max 3 per file)` });
    }
  }
  return violations;
}

export function checkHardcodedUrls(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const httpPattern = /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|example\.com|example\.org)/;
  const ipPortPattern = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})\b/;

  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*') || trimmed.startsWith('<!--')) continue;
      if (httpPattern.test(lines[i])) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'insecure-http', message: 'http:// URL — use https:// or environment variable' });
      }
      const ipMatch = lines[i].match(ipPortPattern);
      if (ipMatch && ipMatch[1] !== '127.0.0.1' && ipMatch[1] !== '0.0.0.0') {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'hardcoded-ip-port', message: 'Hardcoded IP:port — use environment variable or config' });
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

// ─── C#-Specific Checks ─────────────────────────────────────────────────────

export function checkCSharpAsyncVoid(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const asyncVoidRe = /\basync\s+void\s+(\w+)/;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(asyncVoidRe);
      if (!m) continue;
      // Exclude EventArgs event handlers
      if (/EventArgs/.test(lines[i]) || /\bsender\b/.test(lines[i])) continue;
      violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-async-void', message: `async void method '${m[1]}' — use async Task instead` });
    }
  }
  return violations;
}

export function checkCSharpSyncOverAsync(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const syncPatterns = [
    { pattern: /\.Result\b/, name: '.Result' },
    { pattern: /\.Wait\(\)/, name: '.Wait()' },
    { pattern: /\.GetAwaiter\(\)\.GetResult\(\)/, name: '.GetAwaiter().GetResult()' },
  ];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed.startsWith('//')) continue;
      for (const { pattern, name } of syncPatterns) {
        if (pattern.test(lines[i])) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-sync-over-async', message: `Blocking call ${name} on async Task — use await instead` });
        }
      }
    }
  }
  return violations;
}

export function checkCSharpMissingCancellationToken(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const publicAsyncRe = /public\s+(?:virtual\s+|override\s+|static\s+)?async\s+Task\b[^(]*\(([^)]*)\)/;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(publicAsyncRe);
      if (!m) continue;
      const params = m[1];
      if (!/CancellationToken/.test(params)) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-missing-cancellation-token', message: 'Public async Task method without CancellationToken parameter' });
      }
    }
  }
  return violations;
}

export function checkCSharpSqlInjection(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const sqlCmdRe = /new\s+SqlCommand\s*\(/;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!sqlCmdRe.test(lines[i])) continue;
      if (/\$"/.test(lines[i]) || /\+" /.test(lines[i]) || /"\s*\+/.test(lines[i])) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-sql-injection', message: 'SqlCommand with string interpolation/concatenation — use parameterized queries' });
      }
    }
  }
  return violations;
}

export function checkCSharpInsecureDeserialization(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const dangerousTypes = [
    { pattern: /\bBinaryFormatter\b/, name: 'BinaryFormatter' },
    { pattern: /\bJavaScriptSerializer\b/, name: 'JavaScriptSerializer' },
  ];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed.startsWith('//')) continue;
      for (const { pattern, name } of dangerousTypes) {
        if (pattern.test(lines[i])) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-insecure-deserialization', message: `${name} is inherently unsafe — use System.Text.Json or Newtonsoft.Json` });
        }
      }
    }
  }
  return violations;
}

export function checkCSharpPathTraversal(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const pathCombineRe = /Path\.Combine\s*\([^)]*\b(input|request|query|param|fileName|filePath|userPath)\b/;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!pathCombineRe.test(lines[i])) continue;
      const context = lines.slice(Math.max(0, i - 5), i).join('\n');
      if (!context.includes('..') && !context.includes('GetFullPath') && !context.includes('sanitize')) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-path-traversal', message: 'Path.Combine with unvalidated input — validate against directory traversal' });
      }
    }
  }
  return violations;
}

const CSHARP_DISPOSABLE_TYPES = ['HttpClient', 'SqlConnection', 'SqlCommand', 'StreamReader', 'StreamWriter', 'FileStream', 'TcpClient', 'WebClient'];

export function checkCSharpMissingDispose(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const typeName of CSHARP_DISPOSABLE_TYPES) {
        if (!lines[i].includes(`new ${typeName}`)) continue;
        // Check if this line or the previous line has 'using'
        const contextLine = (i > 0 ? lines[i - 1] : '') + lines[i];
        if (/\busing\b/.test(contextLine)) continue;
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-missing-dispose', message: `new ${typeName}() without using statement — wrap in using or dispose explicitly` });
      }
    }
  }
  return violations;
}

export function checkCSharpMultipleHttpClient(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(/new\s+HttpClient\s*\(/g) || [];
    if (matches.length > 1) {
      violations.push({ file: relativeTo(base, file), line: 1, check: 'csharp-multiple-httpclient', message: `${matches.length} HttpClient instantiations — use IHttpClientFactory or a singleton` });
    }
  }
  return violations;
}

export function checkCSharpMutablePublicFields(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const publicFieldRe = /^\s*public\s+(?!(?:readonly|const|static\s+readonly|override|virtual|abstract|event)\b)\w+\s+\w+\s*[;=]/;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    // Skip records
    if (/\brecord\b/.test(content)) continue;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (publicFieldRe.test(lines[i]) && !/{/.test(lines[i])) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-mutable-public-field', message: 'Public mutable field — use a property or make readonly' });
      }
    }
  }
  return violations;
}

export function checkCSharpLargeStructs(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const structRegex = /\bstruct\s+(\w+)/g;
    let structMatch;
    while ((structMatch = structRegex.exec(content)) !== null) {
      const structName = structMatch[1]!;
      const lineNum = content.substring(0, structMatch.index).split('\n').length;
      const afterStruct = content.substring(structMatch.index);
      let depth = 0, started = false, fieldCount = 0;
      for (const line of afterStruct.split('\n')) {
        for (const ch of line) { if (ch === '{') { depth++; started = true; } if (ch === '}') depth--; }
        if (started && depth === 1 && /^\s+(?:public|private|internal|protected)\s+\w+\s+\w+\s*[;=]/.test(line)) fieldCount++;
        if (started && depth === 0) break;
      }
      if (fieldCount > 4) {
        violations.push({ file: relativeTo(base, file), line: lineNum, check: 'csharp-large-struct', message: `Struct '${structName}' has ${fieldCount} fields (max 4) — consider using a class` });
      }
    }
  }
  return violations;
}

export function checkCSharpUnsealedClasses(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const classRe = /^\s*public\s+class\s+(\w+)/;
  const excludePatterns = [/Controller$/, /Hub$/, /Middleware$/, /Startup$/, /Program$/];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(classRe);
      if (!m) continue;
      if (/\b(sealed|abstract|static|partial)\b/.test(lines[i])) continue;
      const className = m[1]!;
      if (excludePatterns.some(p => p.test(className))) continue;
      violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-unsealed-class', message: `Public class '${className}' is not sealed — seal by default, unseal by design` });
    }
  }
  return violations;
}

export function checkCSharpMultipleEnumeration(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const paramRe = /IEnumerable<[^>]+>\s+(\w+)/g;
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    let paramMatch;
    while ((paramMatch = paramRe.exec(content)) !== null) {
      const varName = paramMatch[1]!;
      const afterParam = content.substring(paramMatch.index);
      const usageRe = new RegExp(`\\b${varName}\\b`, 'g');
      const usages = afterParam.match(usageRe) || [];
      // First match is the declaration itself, so >2 means multiple usage
      if (usages.length > 2) {
        const lineNum = content.substring(0, paramMatch.index).split('\n').length;
        violations.push({ file: relativeTo(base, file), line: lineNum, check: 'csharp-multiple-enumeration', message: `IEnumerable parameter '${varName}' used multiple times — call .ToList() first` });
      }
    }
  }
  return violations;
}

export function checkCSharpLinqInLoops(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const loopRe = /^\s*(?:for|foreach)\b/;
  const linqRe = /\.(?:Where|Select|OrderBy|GroupBy|Any|All|First|Last|Count|Sum|Average|Min|Max|Distinct|Take|Skip)\s*\(/;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    let inLoop = false, loopDepth = 0, loopStart = 0;
    for (let i = 0; i < lines.length; i++) {
      if (loopRe.test(lines[i])) { inLoop = true; loopDepth = 0; loopStart = i; }
      if (inLoop) {
        for (const ch of lines[i]) { if (ch === '{') loopDepth++; if (ch === '}') loopDepth--; }
        if (linqRe.test(lines[i]) && i !== loopStart) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-linq-in-loop', message: 'LINQ query inside loop — evaluate outside the loop' });
        }
        if (loopDepth === 0 && i > loopStart) inLoop = false;
      }
    }
  }
  return violations;
}

export function checkCSharpMissingConfigureAwait(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const relPath = relativeTo(base, file).toLowerCase();
    // Skip web/UI projects where ConfigureAwait(false) is wrong
    if (/controller|page|view|component|hub|blazor|razor/.test(relPath)) continue;
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/\bawait\b/.test(lines[i]) && !lines[i].includes('ConfigureAwait')) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'csharp-missing-configure-await', message: 'await without ConfigureAwait(false) in library code' });
      }
    }
  }
  return violations;
}

export function runCSharpChecks(files: string[], base: string): Violation[] {
  return [
    ...checkCSharpAsyncVoid(files, base),
    ...checkCSharpSyncOverAsync(files, base),
    ...checkCSharpMissingCancellationToken(files, base),
    ...checkCSharpSqlInjection(files, base),
    ...checkCSharpInsecureDeserialization(files, base),
    ...checkCSharpPathTraversal(files, base),
    ...checkCSharpMissingDispose(files, base),
    ...checkCSharpMultipleHttpClient(files, base),
    ...checkCSharpMutablePublicFields(files, base),
    ...checkCSharpLargeStructs(files, base),
    ...checkCSharpUnsealedClasses(files, base),
    ...checkCSharpMultipleEnumeration(files, base),
    ...checkCSharpLinqInLoops(files, base),
    ...checkCSharpMissingConfigureAwait(files, base),
  ];
}

// ─── Java-Specific Checks ───────────────────────────────────────────────────

export function checkJavaRawTypes(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const rawTypeRe = /\b(List|Map|Set|Collection|Iterable)\s+\w+\s*[;=]/;
  const genericRe = /\b(List|Map|Set|Collection|Iterable)\s*</;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trimStart();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
      if (rawTypeRe.test(lines[i]) && !genericRe.test(lines[i])) {
        const m = lines[i].match(rawTypeRe);
        if (m) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'java-raw-type', message: `Raw type ${m[1]} without type parameter — use ${m[1]}<T>` });
        }
      }
    }
  }
  return violations;
}

export function checkJavaStringConcatInLoops(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const loopRe = /^\s*(?:for|while)\b/;
  const concatRe = /\+= *"/;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    let inLoop = false, loopDepth = 0, loopStart = 0;
    for (let i = 0; i < lines.length; i++) {
      if (loopRe.test(lines[i])) { inLoop = true; loopDepth = 0; loopStart = i; }
      if (inLoop) {
        for (const ch of lines[i]) { if (ch === '{') loopDepth++; if (ch === '}') loopDepth--; }
        if (concatRe.test(lines[i]) && i !== loopStart) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'java-string-concat-in-loop', message: 'String concatenation with += in loop — use StringBuilder' });
        }
        if (loopDepth === 0 && i > loopStart) inLoop = false;
      }
    }
  }
  return violations;
}

export function checkJavaMutablePublicFields(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  const publicFieldRe = /^\s*public\s+(?!(?:final|static\s+final|abstract|synchronized)\b)\w+\s+\w+\s*[;=]/;
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (publicFieldRe.test(lines[i]) && !/{/.test(lines[i]) && !/\(/.test(lines[i])) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'java-mutable-public-field', message: 'Public non-final field — use getter/setter or make final' });
      }
    }
  }
  return violations;
}

export function runJavaChecks(files: string[], base: string): Violation[] {
  return [
    ...checkJavaRawTypes(files, base),
    ...checkJavaStringConcatInLoops(files, base),
    ...checkJavaMutablePublicFields(files, base),
  ];
}

// ─── Polyglot Proxy Checks (C#/Java) ────────────────────────────────────────

const POLYGLOT_METHOD_RE = /^\s*(?:(?:public|private|protected|internal|static|virtual|override|abstract|async|sealed)\s+)*(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)/;

export function checkPolyglotFunctionLength(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    let fnStart = -1, fnName = '', startDepth = 0, braceDepth = 0, significantLines = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (fnStart === -1) {
        const m = line.match(POLYGLOT_METHOD_RE);
        if (m && line.includes('{') && !CONTROL_KEYWORDS.has(m[1]!)) {
          fnStart = i; fnName = m[1]!; startDepth = braceDepth; significantLines = 0;
        }
      }
      for (const ch of line) { if (ch === '{') braceDepth++; if (ch === '}') braceDepth--; }
      if (fnStart >= 0 && braceDepth > startDepth) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*')) significantLines++;
      }
      if (fnStart >= 0 && braceDepth === startDepth && i > fnStart) {
        if (significantLines > 30) {
          violations.push({ file: relativeTo(base, file), line: fnStart + 1, check: 'function-length', message: `Method '${fnName}' is ${significantLines} significant lines (max 30)` });
        }
        fnStart = -1;
      }
    }
  }
  return violations;
}

export function checkPolyglotParameterCount(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(POLYGLOT_METHOD_RE);
      if (!m) continue;
      const params = m[2]!.trim();
      if (!params) continue;
      let count = 0, depth = 0;
      for (const ch of params) {
        if (ch === '<' || ch === '(' || ch === '[') depth++;
        else if (ch === '>' || ch === ')' || ch === ']') depth--;
        else if (ch === ',' && depth === 0) count++;
      }
      count++;
      if (count > 4) {
        violations.push({ file: relativeTo(base, file), line: i + 1, check: 'parameter-count', message: `Method '${m[1]}' has ${count} params (max 4)` });
      }
    }
  }
  return violations;
}

export function checkPolyglotCommentSpam(files: string[], base: string): Violation[] {
  const violations: Violation[] = [];
  for (const file of files) {
    const ext = path.extname(file);
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      // C# XML docs: /// <summary>
      if (ext === '.cs' && /^\s*\/\/\//.test(lines[i])) {
        let doc = '', j = i;
        while (j < lines.length && /^\s*\/\/\//.test(lines[j])) {
          doc += ' ' + lines[j].replace(/^\s*\/\/\/\s*/, '').replace(/<[^>]+>/g, '');
          j++;
        }
        const fnMatch = lines[j]?.match(/(?:public|private|protected|internal)\s+.*?(\w+)\s*\(/);
        if (!fnMatch) continue;
        const fnName = fnMatch[1]!;
        const nameWords = fnName.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (nameWords.length < 2) continue;
        const cleanDoc = doc.toLowerCase().replace(/[^a-z\s]/g, '').trim();
        if (cleanDoc.length > 80) continue;
        const docWords = new Set(cleanDoc.split(/\s+/).filter(w => w.length > 2));
        const overlap = nameWords.filter(w => docWords.has(w));
        if (overlap.length >= nameWords.length - 1) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'comment-spam', message: `XML doc restates method name '${fnName}' — remove or add non-obvious info` });
        }
        continue;
      }
      // Java Javadoc: /** ... */
      if (ext === '.java' && /^\s*\/\*\*/.test(lines[i])) {
        let doc = '', j = i, docLines = 0;
        while (j < lines.length) {
          doc += ' ' + lines[j].replace(/^\s*\/?[*]+\s*/, '').replace(/\*\/\s*$/, '');
          docLines++;
          if (lines[j].includes('*/')) { j++; break; }
          j++;
        }
        if (docLines > 3 || j >= lines.length) continue;
        const fnMatch = lines[j]?.match(/(?:public|private|protected)\s+.*?(\w+)\s*\(/);
        if (!fnMatch) continue;
        const fnName = fnMatch[1]!;
        const nameWords = fnName.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (nameWords.length < 2) continue;
        const cleanDoc = doc.toLowerCase().replace(/@\w+/g, '').replace(/[^a-z\s]/g, '').trim();
        if (cleanDoc.length > 80) continue;
        const docWords = new Set(cleanDoc.split(/\s+/).filter(w => w.length > 2));
        const overlap = nameWords.filter(w => docWords.has(w));
        if (overlap.length >= nameWords.length - 1) {
          violations.push({ file: relativeTo(base, file), line: i + 1, check: 'comment-spam', message: `Javadoc restates method name '${fnName}' — remove or add non-obvious info` });
        }
      }
    }
  }
  return violations;
}

export function runPolyglotProxyChecks(files: string[], base: string): Violation[] {
  return [
    ...checkFileLength(files, base),
    ...checkMagicNumbers(files, base),
    ...checkMagicStrings(files, base),
    ...checkBannedFileNames(files, base),
    ...checkClassMethodCount(files, base),
    ...checkPolyglotFunctionLength(files, base),
    ...checkPolyglotParameterCount(files, base),
    ...checkPolyglotCommentSpam(files, base),
  ];
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
  violations.push(...checkEmptyErrorHandling(allSourceFiles, projectDir));
  violations.push(...checkTodoAccumulation(allSourceFiles, projectDir));
  violations.push(...checkHardcodedUrls(allSourceFiles, projectDir));

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

  if (languages.includes('csharp')) {
    const csFiles = collectSourceFiles(projectDir, SOURCE_EXTENSIONS.csharp);
    violations.push(...runCSharpChecks(csFiles, projectDir), ...runPolyglotProxyChecks(csFiles, projectDir));
  }

  if (languages.includes('java')) {
    const javaFiles = collectSourceFiles(projectDir, SOURCE_EXTENSIONS.java);
    violations.push(...runJavaChecks(javaFiles, projectDir), ...runPolyglotProxyChecks(javaFiles, projectDir));
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
  runDefaultGate(args[0]);
}

// Only run main when executed directly (not imported)
const isDirectRun = process.argv[1]?.endsWith('quality-gate.ts') ||
                    process.argv[1]?.endsWith('quality-gate.js');
if (isDirectRun) main();
