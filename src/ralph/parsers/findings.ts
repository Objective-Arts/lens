/**
 * Shared findings parser for review phases.
 *
 * Used by: independent-review, security-review, production-readiness
 * Following clarity: one function, one job, under 25 lines.
 */

/** Parsed finding from Claude/Gemini output */
export interface Finding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  description: string;
  file?: string;
  line?: number;
}

/** Parsed fix from fix step output */
export interface Fix {
  severity: string;
  description: string;
  file?: string;
  change?: string;
}

/** Standard severities for parsing */
const SEVERITIES = 'CRITICAL|HIGH|MEDIUM|MODERATE|LOW|INFO';

/**
 * Parse findings from Claude/Gemini output.
 * Handles formats: [SEVERITY] desc, **SEVERITY**: desc, SEVERITY: desc
 */
export function parseFindings(output: string): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  // Pattern: [SEVERITY] description (file:line)
  const pattern = new RegExp(
    `\\[(${SEVERITIES})\\]\\s+(.+?)(?:\\n|$)`,
    'gim'
  );

  let match;
  while ((match = pattern.exec(output)) !== null) {
    const severity = normalizeSeverity(match[1]);
    const description = match[2].trim();
    const key = `${severity}:${description.slice(0, 50).toLowerCase()}`;

    if (seen.has(key)) continue;
    seen.add(key);

    const finding: Finding = { severity, description };
    addFileLocation(finding, output, match.index + match[0].length);
    findings.push(finding);
  }

  return findings;
}

function addFileLocation(finding: Finding, output: string, startIndex: number): void {
  const afterMatch = output.slice(startIndex, startIndex + 200);

  const evidenceMatch = afterMatch.match(/Evidence:\s*([^:\n]+):(\d+)/i);
  if (evidenceMatch) {
    finding.file = evidenceMatch[1].trim();
    finding.line = parseInt(evidenceMatch[2], 10);
    return;
  }

  const fileMatch = afterMatch.match(/File:\s*([^\n]+)/i);
  if (fileMatch) {
    finding.file = fileMatch[1].trim();
  }
}

function normalizeSeverity(raw: string): Finding['severity'] {
  const upper = raw.toUpperCase();
  if (upper === 'MODERATE') return 'MEDIUM';
  if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].includes(upper)) {
    return upper as Finding['severity'];
  }
  return 'INFO';
}

export function parseFixes(output: string): Fix[] {
  const fixes: Fix[] = [];
  const section = output.match(/FIXES_APPLIED:([\s\S]*?)(?:DOCS_UPDATED:|GEMINI_REVIEW_COMPLETE|SECURITY_REVIEW_COMPLETE|$)/i);
  if (!section) return fixes;

  const lines = section[1].split('\n');
  let current: Fix | null = null;

  for (const line of lines) {
    const severityMatch = line.match(/\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s+(.+)/i);
    if (severityMatch) {
      if (current) fixes.push(current);
      current = {
        severity: severityMatch[1].toUpperCase(),
        description: severityMatch[2].trim(),
      };
      continue;
    }

    if (current) {
      const fileMatch = line.match(/File:\s*(.+)/i);
      if (fileMatch) { current.file = fileMatch[1].trim(); continue; }

      const changeMatch = line.match(/Change:\s*(.+)/i);
      if (changeMatch) { current.change = changeMatch[1].trim(); }
    }
  }

  if (current) fixes.push(current);
  return fixes;
}

export function parseDocIssues(output: string): string[] {
  const issues: string[] = [];
  const section = output.match(/DOC_ISSUES:([\s\S]*?)(?:AUDIT_COMPLETE|$)/i);
  if (!section) return issues;

  for (const line of section[1].split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-')) {
      issues.push(trimmed.slice(1).trim());
    }
  }
  return issues;
}

export function parseDocsUpdated(output: string): string[] {
  const docs: string[] = [];
  const section = output.match(/DOCS_UPDATED:([\s\S]*?)(?:GEMINI_REVIEW_COMPLETE|$)/i);
  if (!section) return docs;

  for (const line of section[1].split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-')) {
      docs.push(trimmed.slice(1).trim());
    }
  }
  return docs;
}

export function countBySeverity(findings: Finding[]): Record<string, number> {
  return {
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high: findings.filter(f => f.severity === 'HIGH').length,
    medium: findings.filter(f => f.severity === 'MEDIUM').length,
    low: findings.filter(f => f.severity === 'LOW').length,
    info: findings.filter(f => f.severity === 'INFO').length,
  };
}

/** Filter findings that should be fixed (not INFO/LOW for some phases) */
export function getFixableFindings(findings: Finding[], includeLow = false): Finding[] {
  const fixable = ['CRITICAL', 'HIGH', 'MEDIUM'];
  if (includeLow) fixable.push('LOW');
  return findings.filter(f => fixable.includes(f.severity));
}
