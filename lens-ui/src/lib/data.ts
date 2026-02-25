import fs from 'fs';
import path from 'path';
import type { Project, RunResult } from '@/types/lens';

// Where to look for projects with .lens/ directories
// Set LENS_PROJECTS_DIR env var, or defaults to ~/local-tech-projects
const PROJECTS_ROOT = process.env.LENS_PROJECTS_DIR || path.join(process.env.HOME || '', 'local-tech-projects');

function readJson<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function discoverProjects(): Project[] {
  const projects: Project[] = [];

  try {
    const entries = fs.readdirSync(PROJECTS_ROOT, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectDir = path.join(PROJECTS_ROOT, entry.name);
      const lensDir = path.join(projectDir, '.lens');
      const projectFile = path.join(lensDir, 'project.json');

      if (!fs.existsSync(projectFile)) continue;

      const meta = readJson<Record<string, unknown>>(projectFile);
      if (!meta) continue;

      const runs = getProjectRuns(meta.id as string, lensDir);
      const latestRun = runs[0] ?? null;

      projects.push({
        id: meta.id as string,
        name: meta.name as string,
        path: meta.path as string,
        language: (meta.language as string) || 'Unknown',
        framework: (meta.framework as string) || 'Unknown',
        lastRun: latestRun?.startedAt ?? null,
        lastScore: latestRun?.totalScore ?? null,
        maxScore: 70,
        runCount: runs.length,
      });
    }
  } catch {
    // PROJECTS_ROOT doesn't exist or isn't readable
  }

  return projects;
}

function getRunsDir(lensDir: string): string {
  return path.join(lensDir, 'runs');
}

function loadRunsFromDir(runsDir: string): RunResult[] {
  if (!fs.existsSync(runsDir)) return [];

  try {
    const files = fs.readdirSync(runsDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse(); // newest first

    const runs: RunResult[] = [];
    for (const file of files) {
      const run = readJson<RunResult>(path.join(runsDir, file));
      if (run) runs.push(run);
    }
    return runs;
  } catch {
    return [];
  }
}

function findLensDir(projectId: string): string | null {
  try {
    const entries = fs.readdirSync(PROJECTS_ROOT, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const lensDir = path.join(PROJECTS_ROOT, entry.name, '.lens');
      const projectFile = path.join(lensDir, 'project.json');

      if (!fs.existsSync(projectFile)) continue;

      const meta = readJson<Record<string, unknown>>(projectFile);
      if (meta?.id === projectId) return lensDir;
    }
  } catch {
    // ignore
  }

  return null;
}

function getProjectRuns(projectId: string, lensDir?: string): RunResult[] {
  const dir = lensDir || findLensDir(projectId);
  if (!dir) return [];
  return loadRunsFromDir(getRunsDir(dir));
}

// --- Public API (matches what sample-data.ts exported) ---

export function getProjects(): Project[] {
  return discoverProjects();
}

export function getProject(id: string): Project | null {
  return discoverProjects().find(p => p.id === id) ?? null;
}

export function getRuns(projectId: string): RunResult[] {
  return getProjectRuns(projectId);
}

export function getAllRuns(): RunResult[] {
  const projects = discoverProjects();
  const allRuns: RunResult[] = [];
  for (const p of projects) {
    allRuns.push(...getProjectRuns(p.id));
  }
  return allRuns.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function getRun(runId: string): RunResult | null {
  const allRuns = getAllRuns();
  return allRuns.find(r => r.id === runId) ?? null;
}
