/**
 * Core types for Ralph - PRD-driven autonomous implementation tool.
 *
 * Following cherny: strict types, discriminated unions, no any.
 */

/** PRD item status */
export type ItemStatus = 'pending' | 'complete';

/** A single PRD item */
export interface PrdItem {
  lineNumber: number;
  text: string;
  status: ItemStatus;
}

/** Parsed PRD file */
export interface Prd {
  filepath: string;
  items: PrdItem[];
  raw: string;
}

/** Stage names */
export type StageName =
  | 'scaffold'
  | 'plan'
  | 'build'
  | 'clean'
  | 'test'
  | 'review'
  | 'doc';

/** Stage execution result */
export type StageResult =
  | { status: 'success'; message: string; metrics?: Record<string, number> }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };

/** Skill reference */
export interface Skill {
  name: string;
  content: string;
  source: 'profile' | 'dynamic';
}

/** Ralph configuration from ralph-config.yaml */
export interface RalphConfig {
  skills: {
    plan?: string[];
    build?: string[];
    clean?: string[];
    test?: string[];
    review?: string[];
    doc?: string[];
  };
  settings?: {
    maxIterations?: number;
    maxIterationsPerItem?: number;
    exitOnIdleCommits?: number;
    checkpointEvery?: number;
  };
}

/** Gemini review result */
export interface GeminiResult {
  totalIssues: number;
  criticalHigh: number;
  issuesFixed: number;
  verifiedClean: boolean;
  raw: string;
}

/** Qodana SARIF issue */
export interface QodanaIssue {
  ruleId: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  message: string;
  file: string;
  line: number;
}

/** Qodana scan result */
export interface QodanaResult {
  issues: QodanaIssue[];
  critical: number;
  high: number;
  warnings: number;
}

/** Claude process output */
export interface ClaudeOutput {
  success: boolean;
  jsonPath: string;
  rawPath: string;
  result: string;
  durationMs: number;
}

/** Session state */
export interface Session {
  id: string;
  startTime: Date;
  prdPath: string;
  projectPath: string;
  logsDir: string;
  currentItem: number;
  totalItems: number;
  completedItems: number;
}

/** Display options */
export interface DisplayOptions {
  verbose: boolean;
  quiet: boolean;
  noColor: boolean;
}
