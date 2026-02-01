/**
 * Context and session helpers for runner.
 *
 * Following McIlroy: do one thing well.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Session, RalphConfig, PrdItem, PhaseName, SkillDetection } from '../types.js';
import { Phase, PhaseContext, detectExperts } from '../phases/index.js';
import { loadSkills } from '../skills/loader.js';
import {
  StageSummary, parseGeminiIssues, parseQodanaIssues, parseRefactorResults,
} from '../summary/index.js';

/** Phases that use MCP tools instead of Claude experts. */
export const MCP_PHASES: readonly PhaseName[] = ['independent-review', 'static-analysis'];

/** Build phase execution context. */
export function buildPhaseContext(
  session: Session, item: PrdItem, config: RalphConfig, phase: Phase, projectPath: string
): PhaseContext {
  if (MCP_PHASES.includes(phase.name as PhaseName)) {
    return { session, item, experts: [], projectPath, logsDir: session.logsDir };
  }
  const profileExperts = getProfileExpertsForPhase(config, phase.name);
  const detection = detectExperts(projectPath, phase.name, item.text, profileExperts);
  const skills = loadSkills(projectPath, detection.experts as string[], false);
  return { session, item, experts: skills, projectPath, logsDir: session.logsDir };
}

/** Get profile experts for a phase. */
export function getProfileExpertsForPhase(config: RalphConfig, phaseName: PhaseName): string[] {
  if (phaseName === 'independent-review' || phaseName === 'static-analysis') return [];
  if (phaseName === 'production-readiness' || phaseName === 'security-review') return [];

  const mapping: Partial<Record<PhaseName, keyof RalphConfig['skills']>> = {
    'plan': 'plan', 'structure-first': 'plan', 'implement': 'build', 'test': 'test',
    'refactor-check': 'refactor', 'doc-code': 'doc',
  };
  return config.skills[mapping[phaseName] ?? 'review'] ?? [];
}

/** Parse independent-review metrics. Returns updated summary. */
export function parseAdversarialMetrics(summary: StageSummary, logsDir: string, itemNum: number): StageSummary {
  const rawPath = path.join(logsDir, `item${itemNum}-independent-review.raw`);
  const qodanaPath = path.join(logsDir, `item${itemNum}-static-analysis-qodana.raw`);
  let result = { ...summary };

  if (fs.existsSync(rawPath)) {
    result = { ...result, gemini: parseGeminiIssues(fs.readFileSync(rawPath, 'utf-8')) };
  }
  if (fs.existsSync(qodanaPath)) {
    result = { ...result, qodana: parseQodanaIssues(fs.readFileSync(qodanaPath, 'utf-8')) };
  }
  return result;
}

/** Parse phase-specific metrics into summary. */
export function parsePhaseMetrics(
  summary: StageSummary, name: PhaseName, logsDir: string, itemNum: number, metrics: Record<string, unknown>
): StageSummary {
  if (name === 'independent-review') {
    return parseAdversarialMetrics(summary, logsDir, itemNum);
  }
  if (name === 'test') {
    return {
      ...summary,
      tests: {
        passed: (metrics.passed as number) ?? 0,
        failed: (metrics.failed as number) ?? 0,
        written: (metrics.written as number) ?? 0,
      },
    };
  }
  if (name === 'refactor-check') {
    const rawPath = path.join(logsDir, `item${itemNum}-refactor-check.raw`);
    if (fs.existsSync(rawPath)) {
      return { ...summary, refactor: parseRefactorResults(fs.readFileSync(rawPath, 'utf-8')) };
    }
  }
  return summary;
}

/** Get detection info for phase header. */
export function getDetectionInfo(
  config: RalphConfig, phase: Phase, item: PrdItem, projectPath: string
): SkillDetection {
  if (MCP_PHASES.includes(phase.name as PhaseName)) {
    return { skills: [], keywords: [] };
  }
  const profileExperts = getProfileExpertsForPhase(config, phase.name);
  const detection = detectExperts(projectPath, phase.name, item.text, profileExperts);
  return { skills: detection.experts as string[], keywords: detection.matchedKeywords as string[] };
}

/** Create a new session. */
export function createSession(prdPath: string, projectPath: string, totalItems: number, completedCount: number): Session {
  const id = generateSessionId();
  const logsDir = path.join(projectPath, '.claude', 'ralph-logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  return {
    id, startTime: new Date(), prdPath, projectPath, logsDir,
    currentItem: 0, totalItems, completedItems: completedCount,
  };
}

/** Generate a unique session ID. */
function generateSessionId(): string {
  return crypto.randomUUID();
}

/** Validate and resolve project path to prevent path traversal. */
export function validateProjectPath(projectPath: string): string {
  const resolved = path.resolve(projectPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Project path does not exist: ${resolved}`);
  }
  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error(`Project path is not a directory: ${resolved}`);
  }
  return resolved;
}

/** Create workflow marker to allow Edit/Write through hooks. */
export function createWorkflowMarker(projectPath: string): void {
  const markerDir = path.join(projectPath, '.claude');
  const markerPath = path.join(markerDir, 'active-workflow.json');
  const tempPath = markerPath + '.tmp';

  if (!fs.existsSync(markerDir)) fs.mkdirSync(markerDir, { recursive: true });

  const content = JSON.stringify({
    skill: 'ralph-loop',
    started: new Date().toISOString(),
    pid: process.pid,
  });
  fs.writeFileSync(tempPath, content);
  fs.renameSync(tempPath, markerPath);
}

/** Detect project type from package.json or files. */
export function detectProjectType(projectPath: string): string {
  const pkgPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) return 'TypeScript';
      return 'JavaScript';
    } catch { /* ignore */ }
  }
  if (fs.existsSync(path.join(projectPath, 'tsconfig.json'))) return 'TypeScript';
  if (fs.existsSync(path.join(projectPath, 'pyproject.toml'))) return 'Python';
  if (fs.existsSync(path.join(projectPath, 'go.mod'))) return 'Go';
  if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) return 'Rust';
  return 'Unknown';
}
