/**
 * Schema types for .lens/ output.
 *
 * These types define the JSON structure written to the target project's
 * .lens/ directory after scan and fix operations.
 */

// ---------------------------------------------------------------------------
// Enums / Literals
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Verdict = 'production-ready' | 'needs-attention' | 'needs-work' | 'needs-rework';
export type RunMode = 'scan' | 'fix';
export type FindingStatus = 'open' | 'fixed' | 'ignored';

// ---------------------------------------------------------------------------
// Dimension names (the 13 quality dimensions)
// ---------------------------------------------------------------------------

export const DIMENSION_NAMES = [
  'Structure',
  'Clarity',
  'Data Design',
  'Error Handling',
  'Security',
  'Framework Idioms',
  'Dead Code',
  'AI Smells',
  'Duplication',
  'Consistency',
  'Type Safety',
  'Dependency Health',
  'Conversion Residue'
] as const;

export type DimensionName = typeof DIMENSION_NAMES[number];

// ---------------------------------------------------------------------------
// Project metadata (.lens/project.json)
// ---------------------------------------------------------------------------

export interface LensProject {
  version: 1;
  id: string;
  name: string;
  path: string;
  language: string;
  framework: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Run results (.lens/runs/{timestamp}.json)
// ---------------------------------------------------------------------------

export interface LensDimension {
  name: DimensionName;
  score: number;
  max: 10;
}

export interface LensFinding {
  id: string;
  severity: Severity;
  dimension: string;
  title: string;
  description: string;
  file: string;
  line: number | null;
  suggestion: string;
  canon: string | null;
  status: FindingStatus;
}

export interface LensScore {
  total: number;
  max: 100;
  verdict: Verdict;
}

export interface LensSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface LensRun {
  version: 1;
  id: string;
  mode: RunMode;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  score: LensScore;
  dimensions: LensDimension[];
  summary: LensSummary;
  findings: LensFinding[];
  /** If this is a fix run, which scan run it was fixing */
  fixedFrom?: string;
}
