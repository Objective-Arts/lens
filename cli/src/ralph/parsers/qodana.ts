/**
 * Qodana SARIF output parser.
 *
 * Following kernighan: parse carefully, validate inputs.
 * Following bloch: defensive programming, never trust external input.
 */

import { QodanaResult, QodanaIssue } from '../types.js';

/** SARIF severity mapping */
const SEVERITY_MAP: Record<string, QodanaIssue['severity']> = {
  error: 'critical',
  warning: 'high',
  note: 'moderate',
  none: 'low',
};

/** SARIF result structure (partial) */
interface SarifResult {
  ruleId?: string;
  level?: string;
  message?: { text?: string };
  locations?: Array<{
    physicalLocation?: {
      artifactLocation?: { uri?: string };
      region?: { startLine?: number };
    };
  }>;
}

interface SarifRun {
  results?: SarifResult[];
}

interface SarifReport {
  runs?: SarifRun[];
}

/**
 * Parse SARIF JSON into structured Qodana result.
 *
 * @param sarif - Parsed SARIF JSON object
 * @returns Structured result with categorized issues
 */
export function parseQodanaSarif(sarif: unknown): QodanaResult {
  const report = sarif as SarifReport;
  const issues: QodanaIssue[] = [];

  if (!report.runs || !Array.isArray(report.runs)) {
    return { issues: [], critical: 0, high: 0, warnings: 0 };
  }

  for (const run of report.runs) {
    if (!run.results || !Array.isArray(run.results)) {
      continue;
    }

    for (const result of run.results) {
      const issue = parseSarifResult(result);
      if (issue) {
        issues.push(issue);
      }
    }
  }

  return {
    issues,
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    warnings: issues.filter(i => ['moderate', 'low'].includes(i.severity)).length,
  };
}

/**
 * Parse a single SARIF result into a QodanaIssue.
 */
function parseSarifResult(result: SarifResult): QodanaIssue | null {
  if (!result.ruleId) {
    return null;
  }

  const location = result.locations?.[0]?.physicalLocation;
  const severity = SEVERITY_MAP[result.level ?? 'none'] ?? 'info';

  return {
    ruleId: result.ruleId,
    severity,
    message: result.message?.text ?? 'No message',
    file: location?.artifactLocation?.uri ?? 'unknown',
    line: location?.region?.startLine ?? 0,
  };
}

/**
 * Format issue for display.
 */
export function formatIssue(issue: QodanaIssue): string {
  return `${issue.file}:${issue.line} - ${issue.ruleId}: ${issue.message}`;
}

/**
 * Get summary string for display.
 */
export function getQodanaSummary(result: QodanaResult): string {
  const parts: string[] = [];

  if (result.critical > 0) {
    parts.push(`${result.critical} critical`);
  }
  if (result.high > 0) {
    parts.push(`${result.high} high`);
  }
  if (result.warnings > 0) {
    parts.push(`${result.warnings} warnings`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No issues';
}
