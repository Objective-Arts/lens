/**
 * Phase and keyword configuration loader.
 *
 * Pragmatic: get it working first, then optimize.
 * Clarity: explicit error handling, clear code.
 * Simplicity: small functions, single responsibility.
 */

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

// =============================================================================
// CACHES
// =============================================================================

let cachedPhaseConfig: WorkflowPhasesConfig | null = null;
let cachedPhaseConfigPath: string | null = null;

let cachedKeywordRules: readonly CompiledKeywordRule[] | null = null;
let cachedKeywordRulesPath: string | null = null;

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/** Default phase experts when YAML not available. */
function getDefaultPhaseConfig(): WorkflowPhasesConfig {
  return {
    phases: {
      'plan': {
        description: 'Understand requirements, design approach',
        experts: ['clarity', 'simplicity', 'data-first', 'correctness', 'abstraction'],
      },
      'structure-first': {
        description: 'Design data structures and types before code',
        experts: ['data-first', 'typescript', 'correctness', 'abstraction', 'java', 'design-patterns'],
      },
      'implement': {
        description: 'Write the code',
        experts: ['pragmatism', 'clarity', 'simplicity', 'composition', 'distributed', 'optimization'],
      },
      'test': {
        description: 'Write tests for implemented code',
        experts: ['test-doubles', 'test-strategy', 'react-test', 'angular-core', 'legacy'],
      },
      'refactor-check': {
        description: 'Simplify and clean up, verify still works',
        experts: ['clarity', 'pragmatism', 'legacy', 'design-patterns', 'simplicity'],
      },
      'independent-review': {
        description: 'Independent code review via Gemini, fix issues found',
        experts: [],  // Uses Gemini MCP, not Claude experts
      },
      'static-analysis': {
        description: 'Run analyzers, fix issues found',
        experts: ['style'],  // Universal style principles for fixing issues
      },
      'doc-code': {
        description: 'Document the completed work',
        experts: ['docs', 'brevity', 'prose', 'editing'],
      },
      'production-readiness': {
        description: 'Final production readiness check (post-loop)',
        experts: [],  // Uses its own prompts, not Claude experts
      },
      'security-review': {
        description: 'Adversarial security review (post-loop)',
        experts: [],  // Uses Gemini MCP with security focus
      },
    },
    'ralph-sequence': [
      'plan',
      'structure-first',
      'implement',
      'test',
      'refactor-check',
      'independent-review',
      'static-analysis',
      'doc-code',
    ],
  };
}

/**
 * Default keyword rules when YAML not available.
 */
function getDefaultKeywordRules(): readonly CompiledKeywordRule[] {
  return [
    {
      category: 'security',
      pattern: /\b(auth|password|login|token|jwt|oauth|credential|secret|encrypt|hash|session|permission|csrf|xss|injection)\b/i,
      experts: ['security-mindset', 'owasp', 'appsec', 'web-security'],
    },
    {
      category: 'testing',
      pattern: /\b(test|spec|mock|stub|coverage|unit|integration|e2e|jest|vitest|pytest)\b/i,
      experts: ['test-doubles', 'test-strategy', 'react-test', 'angular-core'],
    },
    {
      category: 'api',
      pattern: /\b(api|endpoint|rest|graphql|route|controller|middleware|http)\b/i,
      experts: ['java', 'simplicity'],
    },
    {
      category: 'performance',
      pattern: /\b(performance|optimize|cache|memory|latency|benchmark)\b/i,
      experts: ['optimization', 'algorithms'],
    },
    {
      category: 'typescript',
      pattern: /\b(typescript|type|interface|generic|inference)\b/i,
      experts: ['typescript', 'type-systems'],
    },
    {
      category: 'react',
      pattern: /\b(react|hook|component|state|props|redux)\b/i,
      experts: ['react-state', 'react-test'],
    },
  ];
}

// =============================================================================
// PHASE CONFIG LOADING
// =============================================================================

/**
 * Load phase configuration from workflow-phases.yaml.
 */
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

/**
 * Get experts for a specific phase.
 */
export function getPhaseExperts(projectPath: string, phase: PhaseName): readonly string[] {
  const config = loadPhaseConfig(projectPath);
  return config.phases[phase]?.experts ?? [];
}

/**
 * Get the Ralph execution sequence.
 */
export function getRalphSequence(projectPath: string): readonly PhaseName[] {
  const config = loadPhaseConfig(projectPath);
  return config['ralph-sequence'] ?? getDefaultPhaseConfig()['ralph-sequence'];
}

// =============================================================================
// KEYWORD RULES LOADING
// =============================================================================

/**
 * Escape special regex characters in a pattern string.
 */
function escapeRegexPattern(pattern: string): string {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build regex from pattern strings.
 */
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

/** Compile a single keyword rule from config. Returns null if invalid. */
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

/** Compile all rules from parsed config. */
function compileRulesFromConfig(parsed: KeywordDetectionConfig): CompiledKeywordRule[] {
  const rules: CompiledKeywordRule[] = [];
  for (const [category, rule] of Object.entries(parsed.rules)) {
    const compiled = compileKeywordRule(category, rule);
    if (compiled) rules.push(compiled);
  }
  return rules;
}

/** Set cached keyword rules and return them. */
function setCachedRules(rules: readonly CompiledKeywordRule[], configPath: string): readonly CompiledKeywordRule[] {
  cachedKeywordRules = rules;
  cachedKeywordRulesPath = configPath;
  return cachedKeywordRules;
}

/** Load keyword detection rules from keyword-detection.yaml. */
export function loadKeywordRules(projectPath: string): readonly CompiledKeywordRule[] {
  const configPath = path.join(projectPath, 'config', 'keyword-detection.yaml');
  if (cachedKeywordRules && cachedKeywordRulesPath === configPath) return cachedKeywordRules;
  if (!fs.existsSync(configPath)) return setCachedRules(getDefaultKeywordRules(), configPath);

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

/** Find keyword matches and add their experts. */
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

/** Detect experts for a phase + task text. Combines phase, profile, and keyword experts. */
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

/**
 * Check if custom phase config exists.
 */
export function hasCustomPhaseConfig(projectPath: string): boolean {
  return fs.existsSync(path.join(projectPath, 'config', 'workflow-phases.yaml'));
}

/**
 * Check if custom keyword rules exist.
 */
export function hasCustomKeywordRules(projectPath: string): boolean {
  return fs.existsSync(path.join(projectPath, 'config', 'keyword-detection.yaml'));
}
