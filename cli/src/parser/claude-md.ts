/**
 * CLAUDE.md parser - extracts auto-invoke rules, skill references, etc.
 */

import * as fs from 'fs';
import type { ClaudeMdParsed, ClaudeMdAutoInvoke, ConfigScope } from '../types.js';

export async function parseClaudeMd(filePath: string, scope: ConfigScope): Promise<ClaudeMdParsed | null> {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const autoInvokes = extractAutoInvokes(content);
  const skillReferences = extractSkillReferences(content);
  const commandReferences = extractCommandReferences(content);
  const agentReferences = extractAgentReferences(content);
  const sections = extractSections(content);

  return {
    path: filePath,
    scope,
    autoInvokes,
    skillReferences,
    commandReferences,
    agentReferences,
    rawContent: content,
    sections
  };
}

function extractAutoInvokes(content: string): ClaudeMdAutoInvoke[] {
  const autoInvokes: ClaudeMdAutoInvoke[] = [];

  // Pattern 1: Markdown table format
  // | Context | Action |
  // | React/JSX/TSX files | INVOKE `/abramov` |
  const tablePattern = /\|([^|]+)\|([^|]*(?:invoke|INVOKE)[^|]*)\|/gi;
  let match;

  while ((match = tablePattern.exec(content)) !== null) {
    const context = match[1].trim();
    const action = match[2].trim();

    // Skip header rows
    if (context.toLowerCase() === 'context' || context.includes('---')) {
      continue;
    }

    // Extract skill name from action
    const skillMatch = action.match(/[`\/](\w+(?:[-:]\w+)?)[`]?/);
    if (skillMatch) {
      autoInvokes.push({
        context,
        action,
        skillName: skillMatch[1]
      });
    }
  }

  // Pattern 2: Prose format
  // "Before writing React code, invoke /abramov"
  // "When working with D3, use the bostock skill"
  const prosePatterns = [
    /(?:before|when|for|if)\s+(?:writing|working|editing|creating)?\s*(?:with|on)?\s*([^,]+),?\s*(?:invoke|use|activate|load)\s+[`\/]?(\w+(?:[-:]\w+)?)/gi,
    /invoke\s+[`\/](\w+(?:[-:]\w+)?)\s+(?:for|when|before)\s+([^.]+)/gi
  ];

  for (const pattern of prosePatterns) {
    while ((match = pattern.exec(content)) !== null) {
      const [, contextOrSkill, skillOrContext] = match;

      // Determine which capture group is which based on pattern
      if (pattern.source.startsWith('(?:before')) {
        autoInvokes.push({
          context: contextOrSkill.trim(),
          action: `INVOKE /${skillOrContext}`,
          skillName: skillOrContext
        });
      } else {
        autoInvokes.push({
          context: skillOrContext.trim(),
          action: `INVOKE /${contextOrSkill}`,
          skillName: contextOrSkill
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return autoInvokes.filter(ai => {
    const key = `${ai.context}:${ai.skillName}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractSkillReferences(content: string): string[] {
  const skills = new Set<string>();

  // Pattern: /skillname or `skillname` in skill-related context
  const patterns = [
    /(?:invoke|use|activate|load)\s+[`\/](\w+(?:[-:]\w+)?)/gi,
    /skill[s]?:\s*[`\/]?(\w+(?:[-:]\w+)?)/gi,
    /\/(\w+(?:[-:]\w+)?)\s+skill/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      skills.add(match[1]);
    }
  }

  return Array.from(skills);
}

function extractCommandReferences(content: string): string[] {
  const commands = new Set<string>();

  // Pattern: /command format (slash commands)
  const commandPattern = /(?:^|\s)\/(\w+(?:[-:]\w+)?)\b/gm;
  let match;

  while ((match = commandPattern.exec(content)) !== null) {
    const cmd = match[1];
    // Filter out common non-command words
    if (!['help', 'clear', 'exit', 'quit'].includes(cmd.toLowerCase())) {
      commands.add(cmd);
    }
  }

  return Array.from(commands);
}

function extractAgentReferences(content: string): string[] {
  const agents = new Set<string>();

  // Pattern: agent names in context
  const agentPatterns = [
    /(?:agent|subagent)[s]?:\s*(\w+(?:-\w+)?)/gi,
    /use\s+(?:the\s+)?(\w+(?:-\w+)?)\s+agent/gi,
    /(\w+(?:-\w+)?)\s+agent/gi
  ];

  for (const pattern of agentPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const agent = match[1];
      // Filter common words
      if (!['the', 'an', 'a', 'this', 'that'].includes(agent.toLowerCase())) {
        agents.add(agent);
      }
    }
  }

  return Array.from(agents);
}

function extractSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');

  let currentSection = 'intro';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }

      // Start new section
      currentSection = headingMatch[2].toLowerCase().replace(/\s+/g, '-');
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }

  return sections;
}
