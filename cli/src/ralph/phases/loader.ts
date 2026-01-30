/**
 * Phase and keyword configuration loader.
 *
 * Following thompson: get it working first, then optimize.
 * Following kernighan: explicit error handling, clear code.
 * Following pike: small functions, single responsibility.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type {
  PhaseName,
  PhaseConfig,
  WorkflowPhasesConfig,
  KeywordRule,
  KeywordDetectionConfig,
  CompiledKeywordRule,
  ExpertDetection,
  PHASE_ORDER,
} from '../types.js';

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

/**
 * Default phase experts when YAML not available.
 * Following bill-joy: handle missing config gracefully.
 */
function getDefaultPhaseConfig(): WorkflowPhasesConfig {
  return {
    phases: {
      'plan': {
        description: 'Understand requirements, design approach',
        experts: ['kernighan', 'pike', 'linus', 'dijkstra', 'liskov'],
      },
      'structure-first': {
        description: 'Design data structures and types before code',
        experts: ['linus', 'cherny', 'dijkstra', 'liskov', 'bloch', 'gang-of-four'],
      },
      'implement': {
        description: 'Write the code',
        experts: ['thompson', 'kernighan', 'pike', 'mcilroy', 'bill-joy', 'carmack'],
      },
      'build-tests': {
        description: 'Write tests for implemented code',
        experts: ['meszaros', 'fowler-test', 'dodds', 'hevery', 'feathers'],
      },
      'refactor-check': {
        description: 'Simplify and clean up, verify still works',
        experts: ['kernighan', 'thompson', 'feathers', 'gang-of-four', 'pike'],
      },
      'adversarial-review': {
        description: 'Attack your own code, fix issues found',
        experts: ['schneier', 'owasp', 'tanya-janca', 'troy-hunt', 'petroski', 'leveson', 'taleb'],
      },
      'static-analysis': {
        description: 'Run analyzers, fix issues found',
        experts: ['bloch', 'liskov', 'owasp', 'crockford'],
      },
      'doc-code': {
        description: 'Document the completed work',
        experts: ['procida', 'strunk-white', 'zinsser', 'king'],
      },
    },
    'ralph-sequence': [
      'plan',
      'structure-first',
      'implement',
      'build-tests',
      'refactor-check',
      'adversarial-review',
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
      experts: ['schneier', 'owasp', 'tanya-janca', 'troy-hunt'],
    },
    {
      category: 'testing',
      pattern: /\b(test|spec|mock|stub|coverage|unit|integration|e2e|jest|vitest|pytest)\b/i,
      experts: ['meszaros', 'fowler-test', 'dodds', 'hevery'],
    },
    {
      category: 'api',
      pattern: /\b(api|endpoint|rest|graphql|route|controller|middleware|http)\b/i,
      experts: ['bloch', 'pike'],
    },
    {
      category: 'performance',
      pattern: /\b(performance|optimize|cache|memory|latency|benchmark)\b/i,
      experts: ['carmack', 'knuth'],
    },
    {
      category: 'typescript',
      pattern: /\b(typescript|type|interface|generic|inference)\b/i,
      experts: ['cherny', 'hejlsberg'],
    },
    {
      category: 'react',
      pattern: /\b(react|hook|component|state|props|redux)\b/i,
      experts: ['abramov', 'dodds'],
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

/**
 * Load keyword detection rules from keyword-detection.yaml.
 */
export function loadKeywordRules(projectPath: string): readonly CompiledKeywordRule[] {
  const configPath = path.join(projectPath, 'config', 'keyword-detection.yaml');

  // Return cached if path unchanged
  if (cachedKeywordRules && cachedKeywordRulesPath === configPath) {
    return cachedKeywordRules;
  }

  if (!fs.existsSync(configPath)) {
    cachedKeywordRules = getDefaultKeywordRules();
    cachedKeywordRulesPath = configPath;
    return cachedKeywordRules;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = yaml.parse(content) as KeywordDetectionConfig;

    if (!parsed?.rules || typeof parsed.rules !== 'object') {
      console.warn('Invalid keyword-detection.yaml: missing rules. Using defaults.');
      cachedKeywordRules = getDefaultKeywordRules();
      cachedKeywordRulesPath = configPath;
      return cachedKeywordRules;
    }

    const rules: CompiledKeywordRule[] = [];

    for (const [category, rule] of Object.entries(parsed.rules)) {
      if (!Array.isArray(rule.patterns) || rule.patterns.length === 0) {
        console.warn(`Skipping keyword rule "${category}": missing patterns`);
        continue;
      }

      if (!Array.isArray(rule.experts) || rule.experts.length === 0) {
        console.warn(`Skipping keyword rule "${category}": missing experts`);
        continue;
      }

      rules.push({
        category,
        pattern: buildRegexFromPatterns(rule.patterns),
        experts: [...rule.experts],
      });
    }

    cachedKeywordRules = rules;
    cachedKeywordRulesPath = configPath;
    return cachedKeywordRules;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Failed to parse keyword-detection.yaml: ${message}. Using defaults.`);
    cachedKeywordRules = getDefaultKeywordRules();
    cachedKeywordRulesPath = configPath;
    return cachedKeywordRules;
  }
}

// =============================================================================
// EXPERT DETECTION
// =============================================================================

/**
 * Detect experts for a phase + task text.
 * Combines phase experts with keyword-detected experts.
 *
 * @param projectPath - Project root
 * @param phase - Current phase
 * @param taskText - Task description to analyze for keywords
 * @param profileExperts - Additional experts from profile (optional)
 * @returns ExpertDetection with deduplicated experts and sources
 */
export function detectExperts(
  projectPath: string,
  phase: PhaseName,
  taskText: string,
  profileExperts: readonly string[] = []
): ExpertDetection {
  const experts = new Set<string>();
  const sources: Record<string, 'phase' | 'keyword' | 'profile'> = {};
  const matchedKeywords: string[] = [];

  // 1. Add profile experts
  for (const expert of profileExperts) {
    experts.add(expert);
    sources[expert] = 'profile';
  }

  // 2. Add phase experts
  const phaseExperts = getPhaseExperts(projectPath, phase);
  for (const expert of phaseExperts) {
    if (!experts.has(expert)) {
      experts.add(expert);
      sources[expert] = 'phase';
    }
  }

  // 3. Add keyword-detected experts
  const keywordRules = loadKeywordRules(projectPath);
  for (const rule of keywordRules) {
    const match = taskText.match(rule.pattern);
    if (match) {
      matchedKeywords.push(match[0]);
      for (const expert of rule.experts) {
        if (!experts.has(expert)) {
          experts.add(expert);
          sources[expert] = 'keyword';
        }
      }
    }
  }

  return {
    experts: Array.from(experts),
    matchedKeywords,
    sources,
  };
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
