import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import {
  detectLanguages,
  isTestFile,
  collectFiles,
  collectSourceFiles,
  checkHardcodedSecrets,
  checkEmptyErrorHandling,
  checkTodoAccumulation,
  checkHardcodedUrls,
  checkShellInjection,
  checkPathTraversal,
  checkCircularImports,
  checkRawErrorOutput,
  checkToctou,
  checkVerificationReads,
  checkDangerousEval,
  checkFalsyNumericGuard,
  checkCommentSpam,
  checkFunctionLength,
  startPipelineMetrics,
  recordPhaseMetrics,
  reportMetrics,
  parseConstructionChecks,
  validateConstruction,
  runGate,
} from './quality-gate.js';

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(tmpdir(), 'qgate-'));
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

function writeFile(relativePath: string, content: string): string {
  const full = path.join(tempDir, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  return full;
}

// ─── Language Detection ──────────────────────────────────────────────────────

describe('detectLanguages', () => {
  it('detects TypeScript', () => {
    writeFile('src/app.ts', 'const x = 1;');
    expect(detectLanguages(tempDir)).toContain('typescript');
  });

  it('detects Java', () => {
    writeFile('src/App.java', 'public class App {}');
    expect(detectLanguages(tempDir)).toContain('java');
  });

  it('detects C#', () => {
    writeFile('src/App.cs', 'class App {}');
    expect(detectLanguages(tempDir)).toContain('csharp');
  });

  it('detects Python', () => {
    writeFile('src/app.py', 'x = 1');
    expect(detectLanguages(tempDir)).toContain('python');
  });

  it('detects Go', () => {
    writeFile('src/main.go', 'package main');
    expect(detectLanguages(tempDir)).toContain('go');
  });

  it('detects Rust', () => {
    writeFile('src/main.rs', 'fn main() {}');
    expect(detectLanguages(tempDir)).toContain('rust');
  });

  it('detects PHP', () => {
    writeFile('src/app.php', '<?php echo "hi"; ?>');
    expect(detectLanguages(tempDir)).toContain('php');
  });

  it('detects Ruby', () => {
    writeFile('src/app.rb', 'puts "hi"');
    expect(detectLanguages(tempDir)).toContain('ruby');
  });

  it('detects multiple languages', () => {
    writeFile('src/app.ts', 'const x = 1;');
    writeFile('src/App.java', 'public class App {}');
    writeFile('src/app.py', 'x = 1');
    const langs = detectLanguages(tempDir);
    expect(langs).toContain('typescript');
    expect(langs).toContain('java');
    expect(langs).toContain('python');
  });

  it('returns empty for no source files', () => {
    writeFile('README.md', '# hello');
    expect(detectLanguages(tempDir)).toEqual([]);
  });
});

// ─── Test File Detection ─────────────────────────────────────────────────────

describe('isTestFile', () => {
  it('detects TS test files', () => {
    expect(isTestFile('app.test.ts')).toBe(true);
    expect(isTestFile('app.spec.ts')).toBe(true);
  });

  it('detects Java test files', () => {
    expect(isTestFile('AppTest.java')).toBe(true);
  });

  it('detects C# test files', () => {
    expect(isTestFile('AppTests.cs')).toBe(true);
    expect(isTestFile('AppTest.cs')).toBe(true);
  });

  it('detects Python test files', () => {
    expect(isTestFile('test_app.py')).toBe(true);
  });

  it('detects Go test files', () => {
    expect(isTestFile('app_test.go')).toBe(true);
  });

  it('detects Rust test files', () => {
    expect(isTestFile('app_test.rs')).toBe(true);
  });

  it('does not match source files', () => {
    expect(isTestFile('app.ts')).toBe(false);
    expect(isTestFile('App.java')).toBe(false);
    expect(isTestFile('app.py')).toBe(false);
  });
});

// ─── File Collection ─────────────────────────────────────────────────────────

describe('collectSourceFiles', () => {
  it('skips test files', () => {
    writeFile('src/app.ts', 'export const x = 1;');
    writeFile('src/app.test.ts', 'import { x } from "./app";');
    const files = collectSourceFiles(tempDir, ['.ts']);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('app.ts');
  });

  it('skips node_modules', () => {
    writeFile('src/app.ts', 'const x = 1;');
    writeFile('node_modules/pkg/index.ts', 'const y = 2;');
    const files = collectFiles(tempDir, ['.ts']);
    expect(files).toHaveLength(1);
  });

  it('skips dotfiles', () => {
    writeFile('src/app.ts', 'const x = 1;');
    writeFile('.hidden/secret.ts', 'const y = 2;');
    const files = collectFiles(tempDir, ['.ts']);
    expect(files).toHaveLength(1);
  });
});

// ─── Hardcoded Secrets (Universal — All Languages) ──────────────────────────

describe('checkHardcodedSecrets', () => {
  it('catches hardcoded password in TypeScript', () => {
    const f = writeFile('src/config.ts', 'const password = "SuperSecret123456";');
    const v = checkHardcodedSecrets([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('hardcoded-secret');
  });

  it('catches hardcoded password in Java', () => {
    const f = writeFile('src/Config.java', 'String password = "SuperSecret123456";');
    const v = checkHardcodedSecrets([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('hardcoded-secret');
  });

  it('catches hardcoded password in C#', () => {
    const f = writeFile('src/Config.cs', 'var password = "SuperSecret123456";');
    const v = checkHardcodedSecrets([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('catches hardcoded password in Python', () => {
    const f = writeFile('src/config.py', 'password = "SuperSecret123456"');
    const v = checkHardcodedSecrets([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('catches hardcoded password in Go', () => {
    const f = writeFile('src/config.go', 'var password = "SuperSecret123456"');
    const v = checkHardcodedSecrets([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('catches GitHub PAT', () => {
    const f = writeFile('src/app.ts', 'const token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";');
    const v = checkHardcodedSecrets([f], tempDir);
    expect(v.some(x => x.message.includes('GitHub PAT'))).toBe(true);
  });

  it('catches private key', () => {
    const f = writeFile('src/app.py', '-----BEGIN RSA PRIVATE KEY-----');
    const v = checkHardcodedSecrets([f], tempDir);
    expect(v.some(x => x.message.includes('private key'))).toBe(true);
  });

  it('catches Slack token', () => {
    const f = writeFile('src/App.java', 'String token = "xoxb-some-slack-token";');
    const v = checkHardcodedSecrets([f], tempDir);
    expect(v.some(x => x.message.includes('Slack token'))).toBe(true);
  });

  it('skips comments in all languages', () => {
    const ts = writeFile('src/a.ts', '// password = "SuperSecret123456"');
    const py = writeFile('src/b.py', '# password = "SuperSecret123456"');
    const java = writeFile('src/C.java', '* password = "SuperSecret123456"');
    expect(checkHardcodedSecrets([ts, py, java], tempDir)).toHaveLength(0);
  });

  it('passes clean code', () => {
    const f = writeFile('src/app.ts', 'const password = process.env.DB_PASSWORD;');
    expect(checkHardcodedSecrets([f], tempDir)).toHaveLength(0);
  });
});

// ─── Empty Error Handling (Universal) ────────────────────────────────────────

describe('checkEmptyErrorHandling', () => {
  it('catches empty catch in TypeScript', () => {
    const f = writeFile('src/app.ts', 'try { doStuff(); } catch (e) {}');
    const v = checkEmptyErrorHandling([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('empty-error-handler');
  });

  it('catches multi-line empty catch in Java', () => {
    const f = writeFile('src/App.java', [
      'try { doStuff(); }',
      'catch (Exception e) {',
      '}',
    ].join('\n'));
    const v = checkEmptyErrorHandling([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('catches except pass in Python', () => {
    const f = writeFile('src/app.py', [
      'try:',
      '    do_stuff()',
      'except Exception:',
      '    pass',
    ].join('\n'));
    const v = checkEmptyErrorHandling([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('catches empty rescue in Ruby', () => {
    const f = writeFile('src/app.rb', [
      'begin',
      '  do_stuff',
      'rescue',
      'end',
    ].join('\n'));
    const v = checkEmptyErrorHandling([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('catches empty if err != nil in Go', () => {
    const f = writeFile('src/main.go', 'if err != nil {}');
    const v = checkEmptyErrorHandling([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('catches empty catch in PHP', () => {
    const f = writeFile('src/app.php', 'catch (Exception $e) {}');
    const v = checkEmptyErrorHandling([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('passes catch with handler', () => {
    const f = writeFile('src/app.ts', [
      'try { doStuff(); }',
      'catch (e) {',
      '  console.error(e.message);',
      '}',
    ].join('\n'));
    expect(checkEmptyErrorHandling([f], tempDir)).toHaveLength(0);
  });

  it('passes Python except with handler', () => {
    const f = writeFile('src/app.py', [
      'except Exception as e:',
      '    logger.error(e)',
    ].join('\n'));
    expect(checkEmptyErrorHandling([f], tempDir)).toHaveLength(0);
  });
});

// ─── TODO Accumulation (Universal) ──────────────────────────────────────────

describe('checkTodoAccumulation', () => {
  it('flags file with >3 TODO markers', () => {
    const f = writeFile('src/app.ts', [
      '// TODO: fix this',
      '// TODO: clean up',
      '// FIXME: broken',
      '// HACK: workaround',
    ].join('\n'));
    const v = checkTodoAccumulation([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('todo-accumulation');
    expect(v[0].message).toContain('4');
  });

  it('passes file with 3 or fewer markers', () => {
    const f = writeFile('src/app.ts', [
      '// TODO: fix this',
      '// FIXME: broken',
      'const x = 1;',
    ].join('\n'));
    expect(checkTodoAccumulation([f], tempDir)).toHaveLength(0);
  });

  it('counts across all marker types', () => {
    const f = writeFile('src/app.py', [
      '# TODO: one',
      '# FIXME: two',
      '# HACK: three',
      '# XXX: four',
    ].join('\n'));
    const v = checkTodoAccumulation([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain('4');
  });
});

// ─── Hardcoded URLs (Universal) ─────────────────────────────────────────────

describe('checkHardcodedUrls', () => {
  it('catches insecure http:// URL', () => {
    const f = writeFile('src/config.ts', 'const api = "http://api.production.com/v1";');
    const v = checkHardcodedUrls([f], tempDir);
    expect(v.some(x => x.check === 'insecure-http')).toBe(true);
  });

  it('catches hardcoded IP:port', () => {
    const f = writeFile('src/config.java', 'String host = "192.168.1.100:8080";');
    const v = checkHardcodedUrls([f], tempDir);
    expect(v.some(x => x.check === 'hardcoded-ip-port')).toBe(true);
  });

  it('skips localhost http://', () => {
    const f = writeFile('src/dev.ts', 'const url = "http://localhost:3000";');
    const v = checkHardcodedUrls([f], tempDir);
    expect(v.some(x => x.check === 'insecure-http')).toBe(false);
  });

  it('skips 127.0.0.1 http://', () => {
    const f = writeFile('src/dev.ts', 'const url = "http://127.0.0.1:3000";');
    const v = checkHardcodedUrls([f], tempDir);
    expect(v.some(x => x.check === 'insecure-http')).toBe(false);
  });

  it('skips 127.0.0.1 IP:port', () => {
    const f = writeFile('src/dev.ts', 'const url = "127.0.0.1:3000";');
    const v = checkHardcodedUrls([f], tempDir);
    expect(v.some(x => x.check === 'hardcoded-ip-port')).toBe(false);
  });

  it('skips comments', () => {
    const f = writeFile('src/app.ts', '// See http://api.example.com/docs');
    expect(checkHardcodedUrls([f], tempDir)).toHaveLength(0);
  });

  it('passes https:// URLs', () => {
    const f = writeFile('src/config.ts', 'const api = "https://api.production.com/v1";');
    expect(checkHardcodedUrls([f], tempDir)).toHaveLength(0);
  });
});

// ─── Shell Injection (JS/TS Only) ───────────────────────────────────────────

describe('checkShellInjection', () => {
  it('catches exec with template literal', () => {
    const f = writeFile('src/run.ts', 'exec(`rm -rf ${userInput}`);');
    const v = checkShellInjection([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('shell-injection');
  });

  it('catches execSync with template literal', () => {
    const f = writeFile('src/run.ts', 'execSync(`git clone ${url}`);');
    const v = checkShellInjection([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('passes exec with string literal', () => {
    const f = writeFile('src/run.ts', 'execSync("git status");');
    expect(checkShellInjection([f], tempDir)).toHaveLength(0);
  });

  it('passes spawn with array args', () => {
    const f = writeFile('src/run.ts', 'spawn("git", ["clone", url]);');
    expect(checkShellInjection([f], tempDir)).toHaveLength(0);
  });
});

// ─── Path Traversal (JS/TS Only) ────────────────────────────────────────────

describe('checkPathTraversal', () => {
  it('catches path.join with req param', () => {
    const f = writeFile('src/serve.ts', 'const p = path.join(base, req.params.file);');
    const v = checkPathTraversal([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('path-traversal');
  });

  it('catches path.resolve with user input', () => {
    const f = writeFile('src/serve.ts', 'path.resolve(root, input.fileName);');
    const v = checkPathTraversal([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('passes when validation is nearby', () => {
    const f = writeFile('src/serve.ts', [
      'if (name.includes("..")) throw new Error("traversal");',
      'const p = path.join(base, req.params.file);',
    ].join('\n'));
    expect(checkPathTraversal([f], tempDir)).toHaveLength(0);
  });

  it('passes internal path.join', () => {
    const f = writeFile('src/util.ts', 'path.join(__dirname, "templates");');
    expect(checkPathTraversal([f], tempDir)).toHaveLength(0);
  });
});

// ─── Circular Imports (JS/TS Only) ──────────────────────────────────────────

describe('checkCircularImports', () => {
  it('detects A → B → A cycle', () => {
    const a = writeFile('src/a.ts', 'import { b } from "./b.js";');
    const b = writeFile('src/b.ts', 'import { a } from "./a.js";');
    const v = checkCircularImports([a, b], tempDir);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].check).toBe('circular-import');
  });

  it('passes linear imports', () => {
    const a = writeFile('src/a.ts', 'export const a = 1;');
    const b = writeFile('src/b.ts', 'import { a } from "./a.js";');
    expect(checkCircularImports([a, b], tempDir)).toHaveLength(0);
  });
});

// ─── Raw Error Output (JS/TS Only) ──────────────────────────────────────────

describe('checkRawErrorOutput', () => {
  it('catches console.error(err)', () => {
    const f = writeFile('src/app.ts', [
      'try { doStuff(); }',
      'catch (err) { console.error(err) }',
    ].join('\n'));
    const v = checkRawErrorOutput([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('raw-error-output');
  });

  it('catches console.error(error)', () => {
    const f = writeFile('src/app.ts', 'catch (error) { console.error(error) }');
    expect(checkRawErrorOutput([f], tempDir)).toHaveLength(1);
  });

  it('passes console.error(error.message)', () => {
    const f = writeFile('src/app.ts', 'console.error(error.message)');
    expect(checkRawErrorOutput([f], tempDir)).toHaveLength(0);
  });

  it('passes console.error with string', () => {
    const f = writeFile('src/app.ts', 'console.error("something failed")');
    expect(checkRawErrorOutput([f], tempDir)).toHaveLength(0);
  });
});

// ─── Full Gate (Integration) ────────────────────────────────────────────────

describe('runGate', () => {
  it('passes clean TypeScript project', () => {
    writeFile('src/index.ts', 'export const x = 1;');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(true);
    expect(result.languages).toContain('typescript');
    expect(result.violations).toHaveLength(0);
  });

  it('fails on secret in Java project', () => {
    writeFile('src/Config.java', 'String password = "SuperSecret123456";');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(false);
    expect(result.languages).toContain('java');
    expect(result.violations.some(v => v.check === 'hardcoded-secret')).toBe(true);
  });

  it('fails on secret in C# project', () => {
    writeFile('src/Config.cs', 'var token = "secret_ABCDEFGHIJKLMNOPQRSTUVWXYZ";');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(false);
    expect(result.languages).toContain('csharp');
  });

  it('fails on secret in Python project', () => {
    writeFile('src/config.py', 'password = "SuperSecret123456"');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(false);
    expect(result.languages).toContain('python');
  });

  it('fails on secret in Go project', () => {
    writeFile('src/config.go', 'var password = "SuperSecret123456"');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(false);
    expect(result.languages).toContain('go');
  });

  it('fails on secret in Rust project', () => {
    writeFile('src/main.rs', 'let password = "SuperSecret123456";');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(false);
    expect(result.languages).toContain('rust');
  });

  it('fails on secret in PHP project', () => {
    writeFile('src/config.php', '$password = "SuperSecret123456";');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(false);
    expect(result.languages).toContain('php');
  });

  it('fails on secret in Ruby project', () => {
    writeFile('src/config.rb', 'password = "SuperSecret123456"');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(false);
    expect(result.languages).toContain('ruby');
  });

  it('catches shell injection in mixed TS+Java project', () => {
    writeFile('src/app.ts', 'exec(`rm -rf ${dir}`);');
    writeFile('src/App.java', 'public class App {}');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(false);
    expect(result.languages).toContain('typescript');
    expect(result.languages).toContain('java');
    expect(result.violations.some(v => v.check === 'shell-injection')).toBe(true);
  });

  it('passes empty directory', () => {
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(true);
    expect(result.languages).toHaveLength(0);
  });

  it('skips test files in all languages', () => {
    writeFile('src/AppTest.java', 'String password = "SuperSecret123456";');
    writeFile('src/test_config.py', 'password = "SuperSecret123456"');
    writeFile('src/app.test.ts', 'const password = "SuperSecret123456";');
    const result = runGate(tempDir, true);
    expect(result.passed).toBe(true);
  });
});

// ─── TOCTOU ─────────────────────────────────────────────────────────────────

describe('checkToctou', () => {
  it('catches existsSync then readFileSync on same path', () => {
    const f = writeFile('src/load.ts', [
      'if (fs.existsSync(configPath)) {',
      '  const data = fs.readFileSync(configPath, "utf-8");',
      '}',
    ].join('\n'));
    const v = checkToctou([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('toctou');
  });

  it('passes when paths differ', () => {
    const f = writeFile('src/load.ts', [
      'if (fs.existsSync(lockPath)) {',
      '  const data = fs.readFileSync(configPath, "utf-8");',
      '}',
    ].join('\n'));
    expect(checkToctou([f], tempDir)).toHaveLength(0);
  });

  it('passes try/catch pattern', () => {
    const f = writeFile('src/load.ts', [
      'try {',
      '  const data = fs.readFileSync(configPath, "utf-8");',
      '} catch {',
      '  return defaults;',
      '}',
    ].join('\n'));
    expect(checkToctou([f], tempDir)).toHaveLength(0);
  });
});

// ─── Verification Reads ─────────────────────────────────────────────────────

describe('checkVerificationReads', () => {
  it('catches writeFileSync then readFileSync on same path', () => {
    const f = writeFile('src/save.ts', [
      'fs.writeFileSync(outputPath, content, "utf-8");',
      'const written = fs.readFileSync(outputPath, "utf-8");',
    ].join('\n'));
    const v = checkVerificationReads([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('verification-read');
  });

  it('passes when paths differ', () => {
    const f = writeFile('src/save.ts', [
      'fs.writeFileSync(outputPath, content, "utf-8");',
      'const other = fs.readFileSync(inputPath, "utf-8");',
    ].join('\n'));
    expect(checkVerificationReads([f], tempDir)).toHaveLength(0);
  });
});

// ─── Dangerous Eval ─────────────────────────────────────────────────────────

describe('checkDangerousEval', () => {
  it('catches eval()', () => {
    const f = writeFile('src/run.ts', 'const result = eval(userCode);');
    const v = checkDangerousEval([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('dangerous-eval');
  });

  it('catches innerHTML assignment', () => {
    const f = writeFile('src/dom.ts', 'element.innerHTML = content;');
    expect(checkDangerousEval([f], tempDir)).toHaveLength(1);
  });

  it('catches document.write', () => {
    const f = writeFile('src/page.ts', 'document.write("<script>alert(1)</script>");');
    expect(checkDangerousEval([f], tempDir)).toHaveLength(1);
  });

  it('skips comments', () => {
    const f = writeFile('src/run.ts', '// eval(code) is dangerous');
    expect(checkDangerousEval([f], tempDir)).toHaveLength(0);
  });

  it('passes safe alternatives', () => {
    const f = writeFile('src/dom.ts', 'element.textContent = content;');
    expect(checkDangerousEval([f], tempDir)).toHaveLength(0);
  });
});

// ─── Falsy Numeric Guard ────────────────────────────────────────────────────

describe('checkFalsyNumericGuard', () => {
  it('catches truthy check on optional number parameter', () => {
    const f = writeFile('src/calc.ts', [
      'function calc(count?: number) {',
      '  if (count) { return count * 2; }',
      '}',
    ].join('\n'));
    const v = checkFalsyNumericGuard([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('falsy-numeric-guard');
  });

  it('catches truthy check on number | undefined', () => {
    const f = writeFile('src/calc.ts', [
      'let limit: number | undefined;',
      'if (limit) { doWork(); }',
    ].join('\n'));
    expect(checkFalsyNumericGuard([f], tempDir)).toHaveLength(1);
  });

  it('passes non-numeric optional', () => {
    const f = writeFile('src/greet.ts', [
      'function greet(name?: string) {',
      '  if (name) { return `Hi ${name}`; }',
      '}',
    ].join('\n'));
    expect(checkFalsyNumericGuard([f], tempDir)).toHaveLength(0);
  });
});

// ─── Comment Spam ───────────────────────────────────────────────────────────

describe('checkCommentSpam', () => {
  it('catches JSDoc that restates function name', () => {
    const f = writeFile('src/parser.ts', [
      '/** Parse checklist rows */',
      'export function parseChecklistRows(content: string) {}',
    ].join('\n'));
    const v = checkCommentSpam([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('comment-spam');
  });

  it('passes JSDoc with substantive info', () => {
    const f = writeFile('src/parser.ts', [
      '/** Extracts markdown table rows, skipping headers. Returns EvidenceRow array with location, item, verdict, and reasoning columns parsed from pipe-delimited content. */',
      'export function parseChecklistRows(content: string) {}',
    ].join('\n'));
    expect(checkCommentSpam([f], tempDir)).toHaveLength(0);
  });

  it('passes single-word function names', () => {
    const f = writeFile('src/util.ts', [
      '/** Parse the input */',
      'export function parse(input: string) {}',
    ].join('\n'));
    expect(checkCommentSpam([f], tempDir)).toHaveLength(0);
  });
});

// ─── Function Length ─────────────────────────────────────────────────────────

function makeBody(count: number, indent = '  '): string {
  return Array.from({ length: count }, (_, i) => `${indent}const v${i} = ${i};`).join('\n');
}

describe('checkFunctionLength', () => {
  it('passes short function declaration', () => {
    const f = writeFile('src/util.ts', `function short() {\n  return 1;\n}`);
    expect(checkFunctionLength([f], tempDir)).toHaveLength(0);
  });

  it('catches long function declaration', () => {
    const f = writeFile('src/util.ts', `function long() {\n${makeBody(31)}\n}`);
    const v = checkFunctionLength([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('function-length');
    expect(v[0].message).toContain('long');
  });

  it('passes short arrow const', () => {
    const f = writeFile('src/util.ts', `export const short = (x: string) => {\n  return x;\n}`);
    expect(checkFunctionLength([f], tempDir)).toHaveLength(0);
  });

  it('catches long arrow const', () => {
    const f = writeFile('src/util.ts', `export const long = (x: string) => {\n${makeBody(31)}\n}`);
    const v = checkFunctionLength([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain('long');
  });

  it('passes short class method', () => {
    const f = writeFile('src/util.ts', `class Foo {\n  bar(): void {\n    return;\n  }\n}`);
    expect(checkFunctionLength([f], tempDir)).toHaveLength(0);
  });

  it('catches long class method', () => {
    const f = writeFile('src/util.ts', `class Foo {\n  bar(): void {\n${makeBody(31, '    ')}\n  }\n}`);
    const v = checkFunctionLength([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain('bar');
  });

  it('catches long async method with access modifier', () => {
    const f = writeFile('src/util.ts', `class Svc {\n  private async process(data: string): Promise<void> {\n${makeBody(31, '    ')}\n  }\n}`);
    const v = checkFunctionLength([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain('process');
  });

  it('does not double-count nested functions', () => {
    const outer = makeBody(10);
    const inner = makeBody(10, '    ');
    const f = writeFile('src/util.ts', `function outer() {\n${outer}\n  function inner() {\n${inner}\n  }\n}`);
    // Total ~23 significant lines (outer body + inner decl + inner body + inner close) — under 30
    expect(checkFunctionLength([f], tempDir)).toHaveLength(0);
  });
});

// ─── Pipeline Metrics ───────────────────────────────────────────────────────

describe('pipeline metrics', () => {
  it('creates, records, and reports metrics', () => {
    const metricsDir = path.join(tempDir, '.claude', 'metrics');
    startPipelineMetrics('build', 'src/', metricsDir);

    const activePath = path.join(metricsDir, 'active-metrics.json');
    expect(fs.existsSync(activePath)).toBe(true);

    recordPhaseMetrics(metricsDir, 'plan', 0, 0, 1500);
    recordPhaseMetrics(metricsDir, 'implementation', 3, 3, 5000);

    const metrics = JSON.parse(fs.readFileSync(activePath, 'utf-8'));
    expect(metrics.phases).toHaveLength(2);
    expect(metrics.phases[1].issuesFound).toBe(3);

    reportMetrics(metricsDir);
    expect(fs.existsSync(activePath)).toBe(false);
    const archives = fs.readdirSync(metricsDir).filter(f => f.startsWith('build-'));
    expect(archives).toHaveLength(1);
  });
});

// ─── Construction Validation ────────────────────────────────────────────────

describe('construction validation', () => {
  it('parses construction checks from plan', () => {
    const checks = parseConstructionChecks([
      '## CONSTRUCTION_CHECKS:',
      '- FILE: src/auth/index.ts',
      '- EXPORT_FUNCTION: validateToken IN src/auth/validate.ts',
      '- EXPORT_TYPE: AuthConfig IN src/auth/types.ts',
      '## TESTS:',
    ].join('\n'));
    expect(checks).toHaveLength(3);
    expect(checks[0]).toEqual({ type: 'file', name: 'src/auth/index.ts' });
    expect(checks[1]).toEqual({ type: 'export_function', name: 'validateToken', file: 'src/auth/validate.ts' });
    expect(checks[2]).toEqual({ type: 'export_type', name: 'AuthConfig', file: 'src/auth/types.ts' });
  });

  it('validates existing files and exports', () => {
    writeFile('src/auth/validate.ts', 'export function validateToken(token: string) { return true; }');
    writeFile('src/auth/types.ts', 'export interface AuthConfig { secret: string; }');
    const plan = writeFile('plan.md', [
      '## CONSTRUCTION_CHECKS:',
      '- FILE: src/auth/validate.ts',
      '- EXPORT_FUNCTION: validateToken IN src/auth/validate.ts',
      '- EXPORT_TYPE: AuthConfig IN src/auth/types.ts',
    ].join('\n'));
    const result = validateConstruction(plan, tempDir);
    expect(result.passed).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results.every(r => r.found)).toBe(true);
  });

  it('fails when file is missing', () => {
    const plan = writeFile('plan.md', [
      '## CONSTRUCTION_CHECKS:',
      '- FILE: src/missing/file.ts',
    ].join('\n'));
    const result = validateConstruction(plan, tempDir);
    expect(result.passed).toBe(false);
  });

  it('fails when export is missing', () => {
    writeFile('src/auth.ts', 'function privateFunc() {}');
    const plan = writeFile('plan.md', [
      '## CONSTRUCTION_CHECKS:',
      '- EXPORT_FUNCTION: validateToken IN src/auth.ts',
    ].join('\n'));
    const result = validateConstruction(plan, tempDir);
    expect(result.passed).toBe(false);
  });
});
