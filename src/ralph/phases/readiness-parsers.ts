/**
 * Parsers for production readiness phase output.
 */

export function parseFindings(output: string): Array<{
  severity: string;
  description: string;
  file?: string;
}> {
  const findings: Array<{ severity: string; description: string; file?: string }> = [];
  const pattern = /\[(CRITICAL|HIGH|MEDIUM|LOW)\]\s+(.+?)(?:\n|$)/gi;

  let match;
  while ((match = pattern.exec(output)) !== null) {
    const finding: { severity: string; description: string; file?: string } = {
      severity: match[1].toUpperCase(),
      description: match[2].trim(),
    };

    const afterMatch = output.slice(match.index + match[0].length, match.index + match[0].length + 200);
    const fileMatch = afterMatch.match(/File:\s*([^\n]+)/i);
    if (fileMatch) {
      finding.file = fileMatch[1].trim();
    }

    findings.push(finding);
  }

  return findings;
}

export function parseDocIssues(output: string): string[] {
  const issues: string[] = [];
  const section = output.match(/DOC_ISSUES:([\s\S]*?)(?:AUDIT_COMPLETE|$)/i);
  if (section) {
    const lines = section[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-')) {
        issues.push(trimmed.slice(1).trim());
      }
    }
  }
  return issues;
}

export function parseFixes(output: string): Array<{
  severity: string;
  description: string;
  change?: string;
}> {
  const fixes: Array<{ severity: string; description: string; change?: string }> = [];
  const section = output.match(/FIXES_APPLIED:([\s\S]*?)(?:DOCS_UPDATED:|FIX_COMPLETE|$)/i);
  if (!section) return fixes;

  const lines = section[1].split('\n');
  let current: { severity: string; description: string; change?: string } | null = null;

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
      const changeMatch = line.match(/Change:\s*(.+)/i);
      if (changeMatch) {
        current.change = changeMatch[1].trim();
      }
    }
  }

  if (current) fixes.push(current);
  return fixes;
}

export function parseDocsUpdated(output: string): string[] {
  const docs: string[] = [];
  const section = output.match(/DOCS_UPDATED:([\s\S]*?)(?:FIX_COMPLETE|$)/i);
  if (section) {
    const lines = section[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-')) {
        docs.push(trimmed.slice(1).trim());
      }
    }
  }
  return docs;
}
