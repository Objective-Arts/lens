/**
 * Scanner analysis and summary generation.
 */

import type { ConfigItem, ConfigScope, ConfigItemType, ScanSummary, ConfigConflict, MissingReference, ClaudeMdParsed } from '../types.js';

export function buildDependencies(items: ConfigItem[], claudeMds: (ClaudeMdParsed | null)[]): void {
  const itemByName = new Map<string, ConfigItem>();
  const itemByPath = new Map<string, ConfigItem>();
  for (const item of items) {
    itemByName.set(item.name, item);
    itemByPath.set(item.path, item);
  }

  for (const claudeMd of claudeMds) {
    if (!claudeMd) continue;

    const claudeMdItem = itemByPath.get(claudeMd.path);
    if (!claudeMdItem) continue;

    for (const skillRef of claudeMd.skillReferences) {
      claudeMdItem.dependencies.push(skillRef);
      const skillItem = itemByName.get(skillRef);
      if (skillItem) {
        skillItem.referencedBy.push(claudeMdItem.name);
      }
    }

    for (const cmdRef of claudeMd.commandReferences) {
      claudeMdItem.dependencies.push(cmdRef);
      const cmdItem = itemByName.get(cmdRef);
      if (cmdItem) {
        cmdItem.referencedBy.push(claudeMdItem.name);
      }
    }
  }
}

function countItems(items: ConfigItem[]): {
  byType: Record<ConfigItemType, number>;
  byScope: Record<ConfigScope, number>;
  tokensByScope: Record<ConfigScope, number>;
  totalTokens: number;
} {
  const byType: Record<ConfigItemType, number> = { skill: 0, command: 0, agent: 0, memory: 0, settings: 0, hook: 0, mcp: 0 };
  const byScope: Record<ConfigScope, number> = { global: 0, project: 0, plugin: 0 };
  const tokensByScope: Record<ConfigScope, number> = { global: 0, project: 0, plugin: 0 };
  let totalTokens = 0;

  for (const item of items) {
    byType[item.type]++;
    byScope[item.scope]++;
    totalTokens += item.tokens;
    tokensByScope[item.scope] += item.tokens;
  }
  return { byType, byScope, tokensByScope, totalTokens };
}

function findConflicts(items: ConfigItem[]): ConfigConflict[] {
  const nameMap = new Map<string, ConfigItem[]>();
  for (const item of items) {
    const key = `${item.type}:${item.name}`;
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key)!.push(item);
  }

  return Array.from(nameMap.entries())
    .filter(([, itemsWithName]) => itemsWithName.length > 1)
    .map(([key, itemsWithName]) => {
      const [type, name] = key.split(':');
      return { name, type: type as ConfigItemType, locations: itemsWithName.map(i => i.path) };
    });
}

function findMissingReferences(
  claudeMds: (ClaudeMdParsed | null)[],
  allItemNames: Set<string>
): MissingReference[] {
  const missing: MissingReference[] = [];
  for (const claudeMd of claudeMds) {
    if (!claudeMd) continue;
    for (const skillRef of claudeMd.skillReferences) {
      if (!allItemNames.has(skillRef)) {
        missing.push({ referencedName: skillRef, referencedIn: claudeMd.path, referenceType: 'skill' });
      }
    }
  }
  return missing;
}

export function generateSummary(items: ConfigItem[], claudeMds: (ClaudeMdParsed | null)[]): ScanSummary {
  const counts = countItems(items);
  const conflicts = findConflicts(items);
  const allItemNames = new Set(items.map(i => i.name));
  const missingReferences = findMissingReferences(claudeMds, allItemNames);
  const unusedItems = items.filter(i => i.type === 'skill' && i.referencedBy.length === 0).map(i => i.name);

  return {
    totalItems: items.length,
    ...counts,
    conflicts,
    missingReferences,
    unusedItems,
  };
}

export function extractDescription(content: string): string | undefined {
  const lines = content.split('\n');

  if (lines[0] === '---') {
    const endIndex = lines.slice(1).findIndex(l => l === '---');
    if (endIndex > 0) {
      const frontmatter = lines.slice(1, endIndex + 1).join('\n');
      const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m);
      if (descMatch) {
        return descMatch[1];
      }
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
      return trimmed.slice(0, 100);
    }
  }

  return undefined;
}
