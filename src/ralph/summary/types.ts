/**
 * Summary data types for D3 visualization.
 *
 * Following data-first: data structures first.
 * Following typescript: precise types, discriminated unions.
 */

/** Issue severity levels */
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

/** Individual issue from Gemini or Qodana */
export interface Issue {
  readonly severity: IssueSeverity;
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly fixed: boolean;
}

/** Gemini review results */
export interface GeminiSummary {
  readonly issues: Issue[];
  readonly totalFound: number;
  readonly criticalHigh: number;
  readonly fixed: number;
  readonly verifiedClean: boolean;
}

/** Qodana static analysis results */
export interface QodanaSummary {
  readonly issues: Issue[];
  readonly totalFound: number;
  readonly criticalHigh: number;
  readonly fixed: number;
  readonly verifiedClean: boolean;
}

/** Test stage results */
export interface TestSummary {
  readonly passed: number;
  readonly failed: number;
  readonly written: number;
}

/** Refactor stage results */
export interface RefactorSummary {
  readonly improvements: string[];
}

/** Individual stage summary */
export interface StageSummary {
  readonly name: string;
  readonly status: 'done' | 'failed' | 'skipped';
  readonly durationMs: number;
  readonly gemini?: GeminiSummary;
  readonly qodana?: QodanaSummary;
  readonly tests?: TestSummary;
  readonly refactor?: RefactorSummary;
}

/** PRD item summary */
export interface ItemSummary {
  readonly number: number;
  readonly text: string;
  readonly status: 'success' | 'failed';
  readonly stages: StageSummary[];
}

/** Production readiness check result */
export interface ProductionCheckSummary {
  readonly status: 'success' | 'failed' | 'skipped';
  readonly message: string;
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
}

/** Full run summary */
export interface RunSummary {
  readonly sessionId: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly durationMs: number;
  readonly prdPath: string;
  readonly projectType: string;
  readonly totalItems: number;
  readonly completedItems: number;
  readonly failedItems: number;
  readonly items: ItemSummary[];
  productionCheck?: ProductionCheckSummary;
}
