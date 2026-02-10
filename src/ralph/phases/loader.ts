import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type {
  PhaseName,
  WorkflowPhasesConfig,
  KeywordRule,
  KeywordDetectionConfig,
  CompiledKeywordRule,
  ExpertDetection,
} from '../types.js';
import { resolveSkillName } from '../../canon/naming.js';
import { getDefaultPhaseConfig, getDefaultKeywordRules } from './loader-defaults.js';

// =============================================================================
// CACHES
// =============================================================================

let cachedPhaseConfig: WorkflowPhasesConfig | null = null;
let cachedPhaseConfigPath: string | null = null;

let cachedKeywordRules: readonly CompiledKeywordRule[] | null = null;
let cachedKeywordRulesPath: string | null = null;

// =============================================================================
// PHASE CONFIG LOADING
// =============================================================================

export function loadPhaseConfig(projectPath: string): WorkflowPhasesConfig {
  const configPath = path.join(projectPath, 'config', 'workflow-phases.yaml');

  // Return cached if path unchanged
  if (cachedPhaseConfig && cachedPhaseConfigPath === configPath) {
    return cachedPhaseConfig;
  }

  if (!fs.existsSync(configPath)) {
    cachedPhaseConfig = getDefaultPhaseConfig();
    cachedPhaseConfigPath = configPath;
    return cachedPhaseConfig;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = yaml.parse(content) as WorkflowPhasesConfig;

    if (!parsed?.phases || typeof parsed.phases !== 'object') {
      console.warn('Invalid workflow-phases.yaml: missing phases. Using defaults.');
      cachedPhaseConfig = getDefaultPhaseConfig();
      cachedPhaseConfigPath = configPath;
      return cachedPhaseConfig;
    }

    cachedPhaseConfig = parsed;
    cachedPhaseConfigPath = configPath;
    return cachedPhaseConfig;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Failed to parse workflow-phases.yaml: ${message}. Using defaults.`);
    cachedPhaseConfig = getDefaultPhaseConfig();
    cachedPhaseConfigPath = configPath;
    return cachedPhaseConfig;
  }
}

export function getPhaseExperts(projectPath: string, phase: PhaseName): readonly string[] {
  const config = loadPhaseConfig(projectPath);
  return config.phases[phase]?.experts ?? [];
}

export function getRalphSequence(projectPath: string): readonly PhaseName[] {
  const config = loadPhaseConfig(projectPath);
  return config['ralph-sequence'] ?? getDefaultPhaseConfig()['ralph-sequence'];
}

// =============================================================================
// KEYWORD RULES LOADING
// =============================================================================

function escapeRegexPattern(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRegexFromPatterns(patterns: readonly string[]): RegExp {
  const escaped = patterns.map(p => {
    const esc = escapeRegexPattern(p);
    // Multi-word patterns: replace spaces with flexible whitespace
    return esc.replace(/ /g, '[.\\s-]?');
  });

  // Sort by length descending so longer patterns match first
  const sorted = [...escaped].sort((a, b) => b.length - a.length);

  return new RegExp(`\\b(${sorted.join('|')})\\b`, 'i');
}

function compileKeywordRule(category: string, rule: KeywordRule): CompiledKeywordRule | null {
  if (!Array.isArray(rule.patterns) || rule.patterns.length === 0) {
    console.warn(`Skipping keyword rule "${category}": missing patterns`);
    return null;
  }
  if (!Array.isArray(rule.experts) || rule.experts.length === 0) {
    console.warn(`Skipping keyword rule "${category}": missing experts`);
    return null;
  }
  return { category, pattern: buildRegexFromPatterns(rule.patterns), experts: [...rule.experts] };
}

function compileRulesFromConfig(parsed: KeywordDetectionConfig): CompiledKeywordRule[] {
  const rules: CompiledKeywordRule[] = [];
  for (const [category, rule] of Object.entries(parsed.rules)) {
    const compiled = compileKeywordRule(category, rule);
    if (compiled) rules.push(compiled);
  }
  return rules;
}

function setCachedRules(rules: readonly CompiledKeywordRule[], configPath: string): readonly CompiledKeywordRule[] {
  cachedKeywordRules = rules;
  cachedKeywordRulesPath = configPath;
  return cachedKeywordRules;
}

export function loadKeywordRules(projectPath: string): readonly CompiledKeywordRule[] {
  const configPath = path.join(projectPath, 'config', 'keyword-detection.yaml');
  if (cachedKeywordRules && cachedKeywordRulesPath === configPath) return cachedKeywordRules;
  try {
    const parsed = yaml.parse(fs.readFileSync(configPath, 'utf-8')) as KeywordDetectionConfig;
    if (!parsed?.rules || typeof parsed.rules !== 'object') {
      console.warn('Invalid keyword-detection.yaml: missing rules. Using defaults.');
      return setCachedRules(getDefaultKeywordRules(), configPath);
    }
    return setCachedRules(compileRulesFromConfig(parsed), configPath);
  } catch (err) {
    console.warn(`Failed to parse keyword-detection.yaml: ${err instanceof Error ? err.message : err}. Using defaults.`);
    return setCachedRules(getDefaultKeywordRules(), configPath);
  }
}

// =============================================================================
// EXPERT DETECTION
// =============================================================================

type ExpertSource = 'phase' | 'keyword' | 'profile';

/** Add experts to set and record source (only if not already present). Resolves tribute names. */
function addExperts(
  experts: Set<string>,
  sources: Record<string, ExpertSource>,
  newExperts: readonly string[],
  source: ExpertSource
): void {
  for (const expert of newExperts) {
    const resolved = resolveSkillName(expert);
    if (!experts.has(resolved)) {
      experts.add(resolved);
      sources[resolved] = source;
    }
  }
}

function addKeywordExperts(
  experts: Set<string>,
  sources: Record<string, ExpertSource>,
  matchedKeywords: string[],
  taskText: string,
  rules: readonly CompiledKeywordRule[]
): void {
  for (const rule of rules) {
    const match = taskText.match(rule.pattern);
    if (match) {
      matchedKeywords.push(match[0]);
      addExperts(experts, sources, rule.experts, 'keyword');
    }
  }
}

export function detectExperts(
  projectPath: string, phase: PhaseName, taskText: string, profileExperts: readonly string[] = []
): ExpertDetection {
  const experts = new Set<string>();
  const sources: Record<string, ExpertSource> = {};
  const matchedKeywords: string[] = [];

  addExperts(experts, sources, profileExperts, 'profile');
  addExperts(experts, sources, getPhaseExperts(projectPath, phase), 'phase');
  addKeywordExperts(experts, sources, matchedKeywords, taskText, loadKeywordRules(projectPath));

  return { experts: Array.from(experts), matchedKeywords, sources };
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/**
 * Clear all caches. Useful for testing or after file changes.
 */
export function clearPhaseLoaderCaches(): void {
  cachedPhaseConfig = null;
  cachedPhaseConfigPath = null;
  cachedKeywordRules = null;
  cachedKeywordRulesPath = null;
}

export function hasCustomPhaseConfig(projectPath: string): boolean {
  return fs.existsSync(path.join(projectPath, 'config', 'workflow-phases.yaml'));
}

export function hasCustomKeywordRules(projectPath: string): boolean {
  return fs.existsSync(path.join(projectPath, 'config', 'keyword-detection.yaml'));
}
