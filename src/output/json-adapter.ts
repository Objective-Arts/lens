/**
 * JSON output adapter for .lens/ directory.
 *
 * Writes structured run results and project metadata to the target project's
 * .lens/ directory. Called at the end of scan/fix operations.
 */

import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  LensProject, LensRun, LensDimension, LensFinding, LensSummary,
  RunMode, Severity, Verdict, FindingStatus, DimensionName
} from './types.js';
import { DIMENSION_NAMES } from './types.js';

// --- Types (must appear before functions) ---

export interface RunInput {
  mode: RunMode;
  startedAt: Date;
  completedAt: Date;
  penaltyIndex?: number;
  dimensionPenalties?: Partial<Record<DimensionName, number>>;
  findings?: RawFinding[];
  fixedFrom?: string;
  /** Optional ID generator for deterministic test output. Defaults to crypto.randomUUID. */
  idGenerator?: () => string;
}

export interface RawFinding {
  severity: Severity;
  dimension: string;
  title: string;
  description: string;
  file: string;
  line?: number | null;
  suggestion?: string;
  canon?: string | null;
  status?: FindingStatus;
}


// --- Constants ---

const MAX_PENALTY_INDEX = 130;
const MAX_SCORE = 100;
const MAX_DIMENSION_SCORE = 10;
const PRODUCTION_READY_THRESHOLD = 90;
const NEEDS_ATTENTION_THRESHOLD = 70;
const NEEDS_WORK_THRESHOLD = 50;
const DEFAULT_RUN_LIMIT = 50;
const SCHEMA_VERSION = 1;
const FINDING_ID_BYTES = 6;
const MAX_JSON_FILE_SIZE = 1024 * 1024; // 1 MB guard for project/run JSON files

// --- Score conversion ---

export function penaltyToScore(penaltyIndex: number): number {
  const clamped = Math.max(0, Math.min(MAX_PENALTY_INDEX, penaltyIndex));
  return Math.round(MAX_SCORE - (clamped / MAX_PENALTY_INDEX) * MAX_SCORE);
}

function penaltyToLocalScore(penaltyPoints: number): number {
  return Math.max(0, MAX_DIMENSION_SCORE - penaltyPoints);
}

export function scoreToVerdict(score: number): Verdict {
  if (score >= PRODUCTION_READY_THRESHOLD) return 'production-ready';
  if (score >= NEEDS_ATTENTION_THRESHOLD) return 'needs-attention';
  if (score >= NEEDS_WORK_THRESHOLD) return 'needs-work';
  return 'needs-rework';
}

function generateId(): string {
  return crypto.randomUUID();
}

function generateFindingId(): string {
  return `f-${crypto.randomBytes(FINDING_ID_BYTES).toString('hex')}`;
}

function isValidProject(value: unknown): value is LensProject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === SCHEMA_VERSION &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.path === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

function isValidRun(value: unknown): value is LensRun {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === SCHEMA_VERSION &&
    typeof candidate.id === 'string' &&
    typeof candidate.mode === 'string' &&
    typeof candidate.startedAt === 'string'
  );
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  const tmpFile = filePath + '.tmp';
  try {
    await fsPromises.writeFile(tmpFile, content, 'utf-8');
    await fsPromises.rename(tmpFile, filePath);
  } catch (cause) {
    // Clean up tmp file if rename failed
    await fsPromises.unlink(tmpFile).catch(() => { /* ignore cleanup error */ });
    throw new Error(`Failed to write ${path.basename(filePath)}: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
  }
}

// --- Project metadata ---

function newProject(projectPath: string, stackInfo: { language: string; framework: string | null }): LensProject {
  return {
    version: 1,
    id: generateId(),
    name: path.basename(projectPath),
    path: projectPath,
    language: stackInfo.language,
    framework: stackInfo.framework,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function tryLoadExistingProject(
  projectFile: string,
  stackInfo: { language: string; framework: string | null }
): Promise<LensProject | null> {
  const stat = await fsPromises.stat(projectFile);
  if (stat.size > MAX_JSON_FILE_SIZE) return null;
  const fileContent = await fsPromises.readFile(projectFile, 'utf-8');
  const parsed: unknown = JSON.parse(fileContent);
  if (!isValidProject(parsed)) return null;
  parsed.updatedAt = new Date().toISOString();
  parsed.language = stackInfo.language;
  parsed.framework = stackInfo.framework;
  await writeAtomic(projectFile, JSON.stringify(parsed, null, 2));
  return parsed;
}

export async function ensureProject(
  projectPath: string,
  stackInfo: { language: string; framework: string | null }
): Promise<LensProject> {
  const lensDir = path.join(projectPath, '.lens');
  const projectFile = path.join(lensDir, 'project.json');
  await fsPromises.mkdir(lensDir, { recursive: true });

  try {
    const existing = await tryLoadExistingProject(projectFile, stackInfo);
    if (existing) return existing;
  } catch (cause) {
    const isExpected = cause instanceof SyntaxError ||
      (cause as NodeJS.ErrnoException)?.code === 'ENOENT';
    if (!isExpected) throw new Error('Failed to read project.json', { cause });
  }

  const project = newProject(projectPath, stackInfo);
  await writeAtomic(projectFile, JSON.stringify(project, null, 2));
  return project;
}

// --- Run building helpers ---

function buildDimensions(penalties: Partial<Record<DimensionName, number>>): LensDimension[] {
  return DIMENSION_NAMES.map(name => ({
    name,
    score: penaltyToLocalScore(penalties[name] ?? 0),
    max: 10 as const
  }));
}

function buildSummary(findings: LensFinding[]): LensSummary {
  const counts: LensSummary = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of findings) { counts[finding.severity]++; }
  return counts;
}

function buildFindings(rawFindings: RawFinding[]): LensFinding[] {
  return rawFindings.map(finding => ({
    id: generateFindingId(),
    severity: finding.severity, dimension: finding.dimension,
    title: finding.title, description: finding.description,
    file: finding.file, line: finding.line ?? null,
    suggestion: finding.suggestion ?? '', canon: finding.canon ?? null,
    status: finding.status ?? 'open'
  }));
}

// --- Run construction (pure) ---

export function buildRun(input: RunInput): LensRun {
  const idGen = input.idGenerator ?? generateId;
  const totalScore = input.penaltyIndex !== undefined
    ? penaltyToScore(input.penaltyIndex) : MAX_SCORE;
  const findings = buildFindings(input.findings ?? []);
  const dimensions = buildDimensions(input.dimensionPenalties ?? {});

  return {
    version: 1, id: idGen(), mode: input.mode,
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    durationMs: input.completedAt.getTime() - input.startedAt.getTime(),
    score: { total: totalScore, max: 100 as const, verdict: scoreToVerdict(totalScore) },
    dimensions, summary: buildSummary(findings), findings,
    ...(input.fixedFrom ? { fixedFrom: input.fixedFrom } : {})
  };
}

// --- Write operations ---

export async function writeRun(projectPath: string, input: RunInput): Promise<LensRun> {
  const runsDir = path.join(projectPath, '.lens', 'runs');
  await fsPromises.mkdir(runsDir, { recursive: true });

  const run = buildRun(input);

  const timestamp = input.completedAt.toISOString().replace(/[:.]/g, '-');
  const runFile = path.join(runsDir, `${timestamp}.json`);
  await writeAtomic(runFile, JSON.stringify(run, null, 2));
  return run;
}

// --- Read operations ---

export async function readProject(projectPath: string): Promise<LensProject | null> {
  try {
    const filePath = path.join(projectPath, '.lens', 'project.json');
    const stat = await fsPromises.stat(filePath);
    if (stat.size > MAX_JSON_FILE_SIZE) return null;
    const fileContent = await fsPromises.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    if (!isValidProject(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function parseRunFile(runsDir: string, file: string): Promise<LensRun | null> {
  try {
    const filePath = path.join(runsDir, file);
    const stat = await fsPromises.stat(filePath);
    if (stat.size > MAX_JSON_FILE_SIZE) return null;
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(content);
    if (!isValidRun(parsed)) {
      console.warn(`Skipping invalid run file: ${file}`);
      return null;
    }
    return parsed;
  } catch (e) {
    console.warn(`Skipping corrupt run file: ${path.join(runsDir, file)}`, e);
    return null;
  }
}

export async function listRuns(
  projectPath: string,
  limit: number = DEFAULT_RUN_LIMIT
): Promise<LensRun[]> {
  const runsDir = path.join(projectPath, '.lens', 'runs');
  try {
    const files = await fsPromises.readdir(runsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse().slice(0, limit);
    const results = await Promise.all(jsonFiles.map(f => parseRunFile(runsDir, f)));
    return results.filter((r): r is LensRun => r !== null);
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw new Error('Failed to list runs', { cause });
  }
}

