/**
 * Tests for technology stack detection:
 * detectStack — Node.js frameworks, Python, Java, C#, Go, Rust, fallback
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { detectStack } from './stack-detector.js';

describe('detectStack', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(tmpdir(), 'lens-detect-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // JavaScript / TypeScript frameworks
  // -------------------------------------------------------------------------

  it('detects Next.js project', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { next: '14.0.0', react: '18.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.framework).toBe('nextjs');
    expect(result.language).toBe('typescript');
    expect(result.profile).toBe('nextjs');
  });

  it('detects Angular project via @angular/core dependency', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { '@angular/core': '17.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.framework).toBe('angular');
    expect(result.language).toBe('typescript');
    expect(result.profile).toBe('angular');
  });

  it('detects React project with TypeScript', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { react: '18.0.0' }, devDependencies: { typescript: '5.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.framework).toBe('react');
    expect(result.language).toBe('typescript');
    expect(result.profile).toBe('react');
  });

  it('detects React project without TypeScript as javascript', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { react: '18.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.framework).toBe('react');
    expect(result.language).toBe('javascript');
    expect(result.profile).toBe('react');
  });

  it('detects D3 project', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { d3: '7.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.framework).toBe('d3');
    expect(result.language).toBe('javascript');
    expect(result.profile).toBe('d3');
  });

  it('detects pure TypeScript project (no framework)', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { typescript: '5.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.language).toBe('typescript');
    expect(result.framework).toBeNull();
    expect(result.profile).toBe('javascript');
  });

  it('detects plain JavaScript project', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'my-js-app', dependencies: { express: '4.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.language).toBe('javascript');
    expect(result.framework).toBeNull();
    expect(result.profile).toBe('javascript');
  });

  // -------------------------------------------------------------------------
  // Other languages
  // -------------------------------------------------------------------------

  it('detects Python project via requirements.txt', () => {
    fs.writeFileSync(path.join(tmpDir, 'requirements.txt'), 'flask==3.0.0\n');

    const result = detectStack(tmpDir);

    expect(result.language).toBe('python');
    expect(result.profile).toBe('python');
  });

  it('detects Python project via pyproject.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pyproject.toml'), '[project]\nname = "myapp"\n');

    const result = detectStack(tmpDir);

    expect(result.language).toBe('python');
    expect(result.profile).toBe('python');
  });

  it('detects Java project via pom.xml', () => {
    fs.writeFileSync(path.join(tmpDir, 'pom.xml'), '<project></project>');

    const result = detectStack(tmpDir);

    expect(result.language).toBe('java');
    expect(result.profile).toBe('java');
  });

  it('detects Java project via build.gradle', () => {
    fs.writeFileSync(path.join(tmpDir, 'build.gradle'), 'apply plugin: "java"\n');

    const result = detectStack(tmpDir);

    expect(result.language).toBe('java');
    expect(result.profile).toBe('java');
  });

  it('detects C# project via .csproj file', () => {
    fs.writeFileSync(path.join(tmpDir, 'MyApp.csproj'), '<Project Sdk="Microsoft.NET.Sdk"></Project>');

    const result = detectStack(tmpDir);

    expect(result.language).toBe('csharp');
    expect(result.profile).toBe('csharp');
  });

  it('detects Go project via go.mod', () => {
    fs.writeFileSync(path.join(tmpDir, 'go.mod'), 'module example.com/myapp\n\ngo 1.21\n');

    const result = detectStack(tmpDir);

    expect(result.language).toBe('go');
    expect(result.profile).toBe('software-base');
  });

  it('detects Rust project via Cargo.toml', () => {
    fs.writeFileSync(path.join(tmpDir, 'Cargo.toml'), '[package]\nname = "myapp"\n');

    const result = detectStack(tmpDir);

    expect(result.language).toBe('rust');
    expect(result.profile).toBe('software-base');
  });

  // -------------------------------------------------------------------------
  // Fallback and edge cases
  // -------------------------------------------------------------------------

  it('returns fallback stack for unknown project type', () => {
    // No marker files — empty directory

    const result = detectStack(tmpDir);

    expect(result.language).toBe('unknown');
    expect(result.profile).toBe('software-base');
    expect(result.framework).toBeNull();
  });

  it('handles malformed package.json gracefully (returns fallback)', () => {
    fs.writeFileSync(path.join(tmpDir, 'package.json'), '{ invalid json !!!');

    const result = detectStack(tmpDir);

    // Falls back to other detectors — no matching files so returns unknown
    expect(result.profile).toBe('software-base');
  });

  it('ignores oversized package.json (over 1MB)', () => {
    // Write a file over 1MB
    const oversizedContent = JSON.stringify({ dependencies: { react: '18.0.0' } }).padEnd(1024 * 1024 + 100, ' ');
    fs.writeFileSync(path.join(tmpDir, 'package.json'), oversizedContent);

    const result = detectStack(tmpDir);

    // Should fall through as if package.json was not readable
    // Other detectors run and find nothing, so fallback
    expect(result.language).toBe('unknown');
  });

  it('uses devDependencies to detect dependencies', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { next: '14.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.framework).toBe('nextjs');
  });

  it('prefers Next.js over React when both present', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ dependencies: { next: '14.0.0', react: '18.0.0' } })
    );

    const result = detectStack(tmpDir);

    expect(result.framework).toBe('nextjs');
  });
});
