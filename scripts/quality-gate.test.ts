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
  checkCSharpAsyncVoid,
  checkCSharpSyncOverAsync,
  checkCSharpMissingCancellationToken,
  checkCSharpSqlInjection,
  checkCSharpInsecureDeserialization,
  checkCSharpPathTraversal,
  checkCSharpMissingDispose,
  checkCSharpMultipleHttpClient,
  checkCSharpMutablePublicFields,
  checkCSharpLargeStructs,
  checkCSharpUnsealedClasses,
  checkCSharpLinqInLoops,
  checkCSharpMissingConfigureAwait,
  checkJavaRawTypes,
  checkJavaStringConcatInLoops,
  checkJavaMutablePublicFields,
  checkPolyglotFunctionLength,
  checkPolyglotParameterCount,
  checkPolyglotCommentSpam,
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
    expect(checkFunctionLength([f], tempDir)).toHaveLength(0);
  });
});

// ─── C# Checks ──────────────────────────────────────────────────────────────

describe('checkCSharpAsyncVoid', () => {
  it('catches async void method', () => {
    const f = writeFile('src/Service.cs', 'public async void DoWork() { await Task.Delay(1); }');
    const v = checkCSharpAsyncVoid([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-async-void');
  });

  it('allows async void for event handlers', () => {
    const f = writeFile('src/Form.cs', 'private async void OnClick(object sender, EventArgs e) {}');
    expect(checkCSharpAsyncVoid([f], tempDir)).toHaveLength(0);
  });

  it('passes async Task', () => {
    const f = writeFile('src/Service.cs', 'public async Task DoWork() { await Task.Delay(1); }');
    expect(checkCSharpAsyncVoid([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpSyncOverAsync', () => {
  it('catches .Result', () => {
    const f = writeFile('src/Service.cs', 'var data = GetDataAsync().Result;');
    const v = checkCSharpSyncOverAsync([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-sync-over-async');
  });

  it('catches .Wait()', () => {
    const f = writeFile('src/Service.cs', 'task.Wait();');
    expect(checkCSharpSyncOverAsync([f], tempDir)).toHaveLength(1);
  });

  it('catches .GetAwaiter().GetResult()', () => {
    const f = writeFile('src/Service.cs', 'var x = task.GetAwaiter().GetResult();');
    expect(checkCSharpSyncOverAsync([f], tempDir)).toHaveLength(1);
  });

  it('skips comments', () => {
    const f = writeFile('src/Service.cs', '// Avoid .Result on tasks');
    expect(checkCSharpSyncOverAsync([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpMissingCancellationToken', () => {
  it('catches public async Task without CT', () => {
    const f = writeFile('src/Api.cs', 'public async Task<int> GetCount(string name) { }');
    const v = checkCSharpMissingCancellationToken([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-missing-cancellation-token');
  });

  it('passes when CT is present', () => {
    const f = writeFile('src/Api.cs', 'public async Task<int> GetCount(string name, CancellationToken ct) { }');
    expect(checkCSharpMissingCancellationToken([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpSqlInjection', () => {
  it('catches SqlCommand with interpolation', () => {
    const f = writeFile('src/Repo.cs', 'var cmd = new SqlCommand($"SELECT * FROM Users WHERE Id = {id}");');
    const v = checkCSharpSqlInjection([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-sql-injection');
  });

  it('catches SqlCommand with concatenation', () => {
    const f = writeFile('src/Repo.cs', 'var cmd = new SqlCommand("SELECT * FROM Users WHERE Id = " + id);');
    expect(checkCSharpSqlInjection([f], tempDir)).toHaveLength(1);
  });

  it('passes parameterized query', () => {
    const f = writeFile('src/Repo.cs', 'var cmd = new SqlCommand("SELECT * FROM Users WHERE Id = @id");');
    expect(checkCSharpSqlInjection([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpInsecureDeserialization', () => {
  it('catches BinaryFormatter', () => {
    const f = writeFile('src/Serializer.cs', 'var formatter = new BinaryFormatter();');
    const v = checkCSharpInsecureDeserialization([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-insecure-deserialization');
  });

  it('catches JavaScriptSerializer', () => {
    const f = writeFile('src/Json.cs', 'var s = new JavaScriptSerializer();');
    expect(checkCSharpInsecureDeserialization([f], tempDir)).toHaveLength(1);
  });

  it('passes System.Text.Json', () => {
    const f = writeFile('src/Json.cs', 'var obj = JsonSerializer.Deserialize<Foo>(json);');
    expect(checkCSharpInsecureDeserialization([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpPathTraversal', () => {
  it('catches Path.Combine with user input', () => {
    const f = writeFile('src/Files.cs', 'var p = Path.Combine(baseDir, input);');
    const v = checkCSharpPathTraversal([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-path-traversal');
  });

  it('passes when validation is present', () => {
    const f = writeFile('src/Files.cs', [
      'if (input.Contains("..")) throw;',
      'var p = Path.Combine(baseDir, input);',
    ].join('\n'));
    expect(checkCSharpPathTraversal([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpMissingDispose', () => {
  it('catches new HttpClient without using', () => {
    const f = writeFile('src/Api.cs', 'var client = new HttpClient();');
    const v = checkCSharpMissingDispose([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-missing-dispose');
  });

  it('catches new SqlConnection without using', () => {
    const f = writeFile('src/Db.cs', 'var conn = new SqlConnection(cs);');
    expect(checkCSharpMissingDispose([f], tempDir)).toHaveLength(1);
  });

  it('passes with using statement', () => {
    const f = writeFile('src/Api.cs', 'using var client = new HttpClient();');
    expect(checkCSharpMissingDispose([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpMultipleHttpClient', () => {
  it('catches multiple HttpClient instantiations', () => {
    const f = writeFile('src/Service.cs', [
      'var a = new HttpClient();',
      'var b = new HttpClient();',
    ].join('\n'));
    const v = checkCSharpMultipleHttpClient([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-multiple-httpclient');
  });

  it('passes single HttpClient', () => {
    const f = writeFile('src/Service.cs', 'var client = new HttpClient();');
    expect(checkCSharpMultipleHttpClient([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpMutablePublicFields', () => {
  it('catches public mutable field', () => {
    const f = writeFile('src/Model.cs', '  public string Name;');
    const v = checkCSharpMutablePublicFields([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-mutable-public-field');
  });

  it('passes readonly field', () => {
    const f = writeFile('src/Model.cs', '  public readonly string Name;');
    expect(checkCSharpMutablePublicFields([f], tempDir)).toHaveLength(0);
  });

  it('passes const field', () => {
    const f = writeFile('src/Model.cs', '  public const int Max = 100;');
    expect(checkCSharpMutablePublicFields([f], tempDir)).toHaveLength(0);
  });

  it('skips records', () => {
    const f = writeFile('src/Model.cs', 'public record Foo { public string Name; }');
    expect(checkCSharpMutablePublicFields([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpLargeStructs', () => {
  it('catches struct with >4 fields', () => {
    const f = writeFile('src/Types.cs', [
      'public struct BigStruct {',
      '  public int A;',
      '  public int B;',
      '  public int C;',
      '  public int D;',
      '  public int E;',
      '}',
    ].join('\n'));
    const v = checkCSharpLargeStructs([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-large-struct');
  });

  it('passes struct with 4 fields', () => {
    const f = writeFile('src/Types.cs', [
      'public struct Small {',
      '  public int A;',
      '  public int B;',
      '  public int C;',
      '  public int D;',
      '}',
    ].join('\n'));
    expect(checkCSharpLargeStructs([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpUnsealedClasses', () => {
  it('catches unsealed public class', () => {
    const f = writeFile('src/Service.cs', '  public class UserService {');
    const v = checkCSharpUnsealedClasses([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-unsealed-class');
  });

  it('passes sealed class', () => {
    const f = writeFile('src/Service.cs', '  public sealed class UserService {');
    expect(checkCSharpUnsealedClasses([f], tempDir)).toHaveLength(0);
  });

  it('passes abstract class', () => {
    const f = writeFile('src/Base.cs', '  public abstract class BaseService {');
    expect(checkCSharpUnsealedClasses([f], tempDir)).toHaveLength(0);
  });

  it('excludes controllers', () => {
    const f = writeFile('src/UsersController.cs', '  public class UsersController {');
    expect(checkCSharpUnsealedClasses([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpLinqInLoops', () => {
  it('catches LINQ in foreach', () => {
    const f = writeFile('src/Process.cs', [
      'foreach (var item in items) {',
      '  var filtered = collection.Where(x => x.Active);',
      '}',
    ].join('\n'));
    const v = checkCSharpLinqInLoops([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-linq-in-loop');
  });

  it('passes LINQ outside loops', () => {
    const f = writeFile('src/Process.cs', 'var filtered = items.Where(x => x.Active);');
    expect(checkCSharpLinqInLoops([f], tempDir)).toHaveLength(0);
  });
});

describe('checkCSharpMissingConfigureAwait', () => {
  it('catches await without ConfigureAwait in library code', () => {
    const f = writeFile('src/lib/DataService.cs', 'var data = await GetDataAsync();');
    const v = checkCSharpMissingConfigureAwait([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('csharp-missing-configure-await');
  });

  it('passes await with ConfigureAwait', () => {
    const f = writeFile('src/lib/DataService.cs', 'var data = await GetDataAsync().ConfigureAwait(false);');
    expect(checkCSharpMissingConfigureAwait([f], tempDir)).toHaveLength(0);
  });

  it('skips controller files', () => {
    const f = writeFile('src/controller/UserController.cs', 'var data = await GetDataAsync();');
    expect(checkCSharpMissingConfigureAwait([f], tempDir)).toHaveLength(0);
  });
});

// ─── Java Checks ─────────────────────────────────────────────────────────────

describe('checkJavaRawTypes', () => {
  it('catches raw List', () => {
    const f = writeFile('src/App.java', '  List items = new ArrayList();');
    const v = checkJavaRawTypes([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('java-raw-type');
  });

  it('catches raw Map', () => {
    const f = writeFile('src/App.java', '  Map data = new HashMap();');
    expect(checkJavaRawTypes([f], tempDir)).toHaveLength(1);
  });

  it('passes generic List<String>', () => {
    const f = writeFile('src/App.java', '  List<String> items = new ArrayList<>();');
    expect(checkJavaRawTypes([f], tempDir)).toHaveLength(0);
  });

  it('skips comments', () => {
    const f = writeFile('src/App.java', '// List items = bad;');
    expect(checkJavaRawTypes([f], tempDir)).toHaveLength(0);
  });
});

describe('checkJavaStringConcatInLoops', () => {
  it('catches += in for loop', () => {
    const f = writeFile('src/Builder.java', [
      'for (String s : items) {',
      '  result += "prefix";',
      '}',
    ].join('\n'));
    const v = checkJavaStringConcatInLoops([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('java-string-concat-in-loop');
  });

  it('catches += in while loop', () => {
    const f = writeFile('src/Builder.java', [
      'while (iter.hasNext()) {',
      '  result += "item";',
      '}',
    ].join('\n'));
    expect(checkJavaStringConcatInLoops([f], tempDir)).toHaveLength(1);
  });

  it('passes StringBuilder', () => {
    const f = writeFile('src/Builder.java', [
      'for (String s : items) {',
      '  sb.append(s);',
      '}',
    ].join('\n'));
    expect(checkJavaStringConcatInLoops([f], tempDir)).toHaveLength(0);
  });
});

describe('checkJavaMutablePublicFields', () => {
  it('catches public non-final field', () => {
    const f = writeFile('src/Model.java', '  public String name;');
    const v = checkJavaMutablePublicFields([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('java-mutable-public-field');
  });

  it('passes public final field', () => {
    const f = writeFile('src/Model.java', '  public final String name;');
    expect(checkJavaMutablePublicFields([f], tempDir)).toHaveLength(0);
  });

  it('passes static final', () => {
    const f = writeFile('src/Constants.java', '  public static final int MAX = 100;');
    expect(checkJavaMutablePublicFields([f], tempDir)).toHaveLength(0);
  });
});

// ─── Polyglot Proxy Checks ──────────────────────────────────────────────────

describe('checkPolyglotFunctionLength', () => {
  it('catches long C# method', () => {
    const body = Array.from({ length: 31 }, (_, i) => `    var v${i} = ${i};`).join('\n');
    const f = writeFile('src/Service.cs', `public void Process(string input) {\n${body}\n}`);
    const v = checkPolyglotFunctionLength([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('function-length');
  });

  it('catches long Java method', () => {
    const body = Array.from({ length: 31 }, (_, i) => `    int v${i} = ${i};`).join('\n');
    const f = writeFile('src/Service.java', `public void process(String input) {\n${body}\n}`);
    const v = checkPolyglotFunctionLength([f], tempDir);
    expect(v).toHaveLength(1);
  });

  it('passes short method', () => {
    const f = writeFile('src/Service.cs', 'public void DoWork() {\n  return;\n}');
    expect(checkPolyglotFunctionLength([f], tempDir)).toHaveLength(0);
  });
});

describe('checkPolyglotParameterCount', () => {
  it('catches C# method with >4 params', () => {
    const f = writeFile('src/Service.cs', '  public void Process(int a, int b, int c, int d, int e) {');
    const v = checkPolyglotParameterCount([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('parameter-count');
  });

  it('catches Java method with >4 params', () => {
    const f = writeFile('src/Service.java', '  public void process(int a, int b, int c, int d, int e) {');
    expect(checkPolyglotParameterCount([f], tempDir)).toHaveLength(1);
  });

  it('passes method with 4 params', () => {
    const f = writeFile('src/Service.cs', '  public void Process(int a, int b, int c, int d) {');
    expect(checkPolyglotParameterCount([f], tempDir)).toHaveLength(0);
  });
});

describe('checkPolyglotCommentSpam', () => {
  it('catches C# XML doc restating method name', () => {
    const f = writeFile('src/Parser.cs', [
      '  /// <summary>Parse checklist rows</summary>',
      '  public void ParseChecklistRows(string content) {',
    ].join('\n'));
    const v = checkPolyglotCommentSpam([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('comment-spam');
  });

  it('catches Java Javadoc restating method name', () => {
    const f = writeFile('src/Parser.java', [
      '  /** Parse checklist rows */',
      '  public void parseChecklistRows(String content) {',
    ].join('\n'));
    const v = checkPolyglotCommentSpam([f], tempDir);
    expect(v).toHaveLength(1);
    expect(v[0].check).toBe('comment-spam');
  });

  it('passes substantive comment', () => {
    const f = writeFile('src/Parser.cs', [
      '  /// <summary>Extracts markdown table rows, skipping headers and returning parsed data.</summary>',
      '  public void ParseChecklistRows(string content) {',
    ].join('\n'));
    expect(checkPolyglotCommentSpam([f], tempDir)).toHaveLength(0);
  });
});

// ─── Gate Integration (C#, Java, Mixed) ─────────────────────────────────────

describe('runGate integration', () => {
  it('runs C# checks on C#-only project', () => {
    writeFile('src/Service.cs', [
      'public async void Fire() { }',
      'var cmd = new SqlCommand($"SELECT {id}");',
    ].join('\n'));
    const result = runGate(tempDir, true);
    expect(result.languages).toContain('csharp');
    expect(result.violations.some(v => v.check === 'csharp-async-void')).toBe(true);
    expect(result.violations.some(v => v.check === 'csharp-sql-injection')).toBe(true);
  });

  it('runs Java checks on Java-only project', () => {
    writeFile('src/App.java', [
      'List items = new ArrayList();',
    ].join('\n'));
    const result = runGate(tempDir, true);
    expect(result.languages).toContain('java');
    expect(result.violations.some(v => v.check === 'java-raw-type')).toBe(true);
  });

  it('dispatches correct checks for mixed TS+C#+Java project', () => {
    writeFile('src/index.ts', 'export const x = 1;');
    writeFile('src/Service.cs', 'public async void Fire() { }');
    writeFile('src/App.java', 'List items = new ArrayList();');
    const result = runGate(tempDir, true);
    expect(result.languages).toContain('typescript');
    expect(result.languages).toContain('csharp');
    expect(result.languages).toContain('java');
    expect(result.violations.some(v => v.check === 'csharp-async-void')).toBe(true);
    expect(result.violations.some(v => v.check === 'java-raw-type')).toBe(true);
  });
});
