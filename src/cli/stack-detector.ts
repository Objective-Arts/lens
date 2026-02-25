/**
 * Technology stack detection for project directories.
 *
 * Pure detection logic extracted from init.ts — no Commander, no chalk.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DetectedStack } from './commands/init-display.js';

const FALLBACK_STACK: DetectedStack = { language: 'unknown', framework: null, profile: 'software-base' };
const MAX_JSON_FILE_SIZE = 1024 * 1024;

function isStringRecord(value: unknown): value is Record<string, string> {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.values(value as object).every(v => typeof v === 'string');
}

function allDeps(packageJson: Record<string, unknown>): Record<string, string> {
  return {
    ...(isStringRecord(packageJson.dependencies) ? packageJson.dependencies : {}),
    ...(isStringRecord(packageJson.devDependencies) ? packageJson.devDependencies : {})
  };
}

function detectJsFramework(packageJson: Record<string, unknown>): DetectedStack {
  const deps = allDeps(packageJson);
  const hasDep = (depName: string): boolean => depName in deps;

  if (hasDep('next')) return { language: 'typescript', framework: 'nextjs', profile: 'nextjs' };
  if (hasDep('angular') || hasDep('@angular/core')) return { language: 'typescript', framework: 'angular', profile: 'angular' };
  if (hasDep('react')) {
    const language = hasDep('typescript') ? 'typescript' : 'javascript';
    return { language, framework: 'react', profile: 'react' };
  }
  if (hasDep('d3') || hasDep('d3-selection')) return { language: 'javascript', framework: 'd3', profile: 'd3' };
  if (hasDep('typescript')) return { language: 'typescript', framework: null, profile: 'javascript' };
  return { language: 'javascript', framework: null, profile: 'javascript' };
}

function fileExistsAt(projectPath: string, file: string): boolean {
  try { fs.accessSync(path.join(projectPath, file)); return true; }
  catch { return false; }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readJsonFile(projectPath: string, file: string): Record<string, unknown> | null {
  try {
    const filePath = path.join(projectPath, file);
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_JSON_FILE_SIZE) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;
    return parsed;
  } catch { return null; }
}

function detectCSharp(projectPath: string): DetectedStack | null {
  try {
    const hasCsProj = fs.readdirSync(projectPath).some(f => f.endsWith('.csproj') || f.endsWith('.sln'));
    return hasCsProj ? { language: 'csharp', framework: null, profile: 'csharp' } : null;
  } catch {
    return null;
  }
}

function isPythonProject(has: (f: string) => boolean): boolean {
  return has('requirements.txt') || has('pyproject.toml') || has('setup.py') || has('Pipfile');
}

function isJavaProject(has: (f: string) => boolean): boolean {
  return has('pom.xml') || has('build.gradle') || has('build.gradle.kts');
}

export function detectStack(projectPath: string): DetectedStack {
  const hasFile = (file: string): boolean => fileExistsAt(projectPath, file);

  const packageJson = readJsonFile(projectPath, 'package.json');
  if (packageJson) return detectJsFramework(packageJson);
  if (isPythonProject(hasFile)) return { language: 'python', framework: null, profile: 'python' };
  if (isJavaProject(hasFile)) return { language: 'java', framework: null, profile: 'java' };

  const csharp = detectCSharp(projectPath);
  if (csharp) return csharp;

  if (hasFile('go.mod')) return { language: 'go', framework: null, profile: 'software-base' };
  if (hasFile('Cargo.toml')) return { language: 'rust', framework: null, profile: 'software-base' };
  return FALLBACK_STACK;
}
