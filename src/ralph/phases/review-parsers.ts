/**
 * Parsers for independent review phase output.
 */

/** Issue structure from Gemini review */
export interface GeminiIssue {
  severity: string;
  description: string;
  file?: string;
  line?: number;
}

export function parseIssuesFromOutput(output: string): GeminiIssue[] {
  const issues: GeminiIssue[] = [];
  const severities = 'CRITICAL|HIGH|MEDIUM|MODERATE|LOW|INFO';

  const patterns = [
    // Gemini's actual format: - **[SEVERITY]** description (file:line)
    new RegExp(`^[-*•]\\s*\\*\\*\\[(${severities})\\]\\*\\*\\s+(.+?)(?:\\s+\\(([^:)]+?)(?::(\\d+(?:-\\d+)?))?\\))?$`, 'gmi'),
    // [SEVERITY] description (file:line) - brackets are unambiguous
    new RegExp(`\\[(${severities})\\]\\s+(.+?)(?:\\s+\\(([^:)]+?)(?::(\\d+))?\\))?$`, 'gmi'),
    // **SEVERITY**: description or **SEVERITY** description
    new RegExp(`\\*\\*(${severities})\\*\\*[:\\s]+(.+?)(?:\\s+\\(([^:)]+?)(?::(\\d+))?\\))?$`, 'gmi'),
    // - [SEVERITY] or - **SEVERITY**: list items with clear markers
    new RegExp(`^[-*•]\\s*(?:\\[|\\*\\*)(${severities})(?:\\]|\\*\\*)[:\\s]+(.+?)(?:\\s+\\(([^:)]+?)(?::(\\d+))?\\))?$`, 'gmi'),
    // Numbered: 1. [SEVERITY] or 1. **SEVERITY**
    new RegExp(`^\\d+\\.\\s*(?:\\[|\\*\\*)(${severities})(?:\\]|\\*\\*)[:\\s]+(.+?)(?:\\s+\\(([^:)]+?)(?::(\\d+))?\\))?$`, 'gmi'),
    // Gemini markdown: - **SEVERITY:** description (colon inside bold)
    new RegExp(`^[-*•]\\s*\\*\\*(${severities}):\\*\\*\\s*(.+?)(?:\\s+\\(([^:)]+?)(?::(\\d+))?\\))?$`, 'gmi'),
    // Severity in backticks: `SEVERITY` description
    new RegExp(`\`(${severities})\`[:\\s]+(.+?)(?:\\s+\\(([^:)]+?)(?::(\\d+))?\\))?$`, 'gmi'),
    // Start of line only: SEVERITY: description (requires colon, no loose dash matching)
    new RegExp(`^(${severities}):\\s+(.+?)(?:\\s+\\(([^:)]+?)(?::(\\d+))?\\))?$`, 'gmi'),
  ];

  const seen = new Set<string>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      const rawSeverity = match[1].toUpperCase();
      const severity = rawSeverity === 'MEDIUM' ? 'MODERATE' :
                      rawSeverity === 'WARNING' ? 'LOW' :
                      rawSeverity === 'ERROR' ? 'HIGH' : rawSeverity;
      const description = match[2].trim();

      const key = `${severity}:${description.toLowerCase().slice(0, 50)}`;
      if (!seen.has(key)) {
        seen.add(key);
        issues.push({
          severity,
          description,
          file: match[3],
          line: match[4] ? parseInt(match[4], 10) : undefined,
        });
      }
    }
  }

  return issues;
}

export function parseFixedFromOutput(output: string, original: GeminiIssue[]): GeminiIssue[] {
  const fixed: GeminiIssue[] = [];
  const pattern = /\[(CRITICAL|HIGH|MEDIUM|MODERATE|LOW)\]\s+(.+?)\s*-\s*FIXED/gmi;

  let match;
  while ((match = pattern.exec(output)) !== null) {
    const desc = match[2].trim().toLowerCase();
    const orig = original.find(i => i.description.toLowerCase().includes(desc) || desc.includes(i.description.toLowerCase()));
    if (orig) {
      fixed.push(orig);
    } else {
      fixed.push({
        severity: match[1] === 'MEDIUM' ? 'MODERATE' : match[1],
        description: match[2].trim(),
      });
    }
  }

  return fixed;
}

export function parseCannotFixFromOutput(output: string, original: GeminiIssue[]): GeminiIssue[] {
  const cannotFix: GeminiIssue[] = [];
  const pattern = /\[(CRITICAL|HIGH|MEDIUM|MODERATE|LOW)\]\s+(.+?)\s*-\s*REASON:/gmi;

  let match;
  while ((match = pattern.exec(output)) !== null) {
    const desc = match[2].trim().toLowerCase();
    const orig = original.find(i => i.description.toLowerCase().includes(desc) || desc.includes(i.description.toLowerCase()));
    if (orig) {
      cannotFix.push(orig);
    } else {
      cannotFix.push({
        severity: match[1] === 'MEDIUM' ? 'MODERATE' : match[1],
        description: match[2].trim(),
      });
    }
  }

  return cannotFix;
}
