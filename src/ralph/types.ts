/**
 * Core types for Ralph - PRD-driven autonomous implementation tool.
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

/** Phase names for the 8-phase workflow. */
export type PhaseName =
  | 'plan'
  | 'structure-first'
  | 'implement'
  | 'test'
  | 'refactor-check'
  | 'independent-review'
  | 'static-analysis'
  | 'doc-code'
  | 'production-readiness'  // Post-loop phase
  | 'security-review';      // Post-loop phase

/** Stage execution result */
export type StageResult =
  | { status: 'success'; message: string; metrics?: Record<string, number> }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };

/** Skill reference */
export interface Skill {
  name: string;
  content: string;
  summary: string;
  checklist: readonly string[];
  source: 'profile' | 'dynamic';
}

/** Ralph configuration from ralph-config.yaml */
export interface RalphConfig {
  skills: {
    plan?: string[];
    build?: string[];
    refactor?: string[];
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

/** Skill detection result with matched keywords */
export interface SkillDetection {
  /** Skill names to load */
  skills: string[];
  /** Keywords that triggered dynamic detection */
  keywords: string[];
}

/** Stage status for pipeline progress display */
export type StageStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

// =============================================================================
// PHASE CONFIGURATION TYPES (from workflow-phases.yaml)
// =============================================================================

/**
 * Configuration for a single phase from workflow-phases.yaml.
 * Following typescript: readonly for immutability.
 */
export interface PhaseConfig {
  readonly description: string;
  readonly experts: readonly string[];
}

/**
 * Complete workflow phases configuration.
 * Loaded from config/workflow-phases.yaml.
 */
export interface WorkflowPhasesConfig {
  readonly phases: Readonly<Record<PhaseName, PhaseConfig>>;
  readonly 'ralph-sequence': readonly PhaseName[];
}

// =============================================================================
// KEYWORD DETECTION TYPES (from keyword-detection.yaml)
// =============================================================================

/**
 * A single keyword detection rule.
 * Patterns trigger expert loading.
 */
export interface KeywordRule {
  readonly patterns: readonly string[];
  readonly experts: readonly string[];
}

/**
 * Complete keyword detection configuration.
 * Loaded from config/keyword-detection.yaml.
 */
export interface KeywordDetectionConfig {
  readonly rules: Readonly<Record<string, KeywordRule>>;
}

/**
 * Compiled keyword rule with regex for matching.
 * Following design-patterns: Strategy pattern for detection.
 */
export interface CompiledKeywordRule {
  readonly category: string;
  readonly pattern: RegExp;
  readonly experts: readonly string[];
}

/**
 * Expert detection result with source tracking.
 * Following java: clear return types.
 */
export interface ExpertDetection {
  /** Expert names to load */
  readonly experts: readonly string[];
  /** Keywords that triggered detection (for display) */
  readonly matchedKeywords: readonly string[];
  /** Source of each expert (phase vs keyword) */
  readonly sources: Readonly<Record<string, 'phase' | 'keyword' | 'profile'>>;
}
