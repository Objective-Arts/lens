/**
 * Default configurations for phase loader.
 */

import type { WorkflowPhasesConfig, CompiledKeywordRule } from '../types.js';

/** Default phase experts when YAML not available. */
export function getDefaultPhaseConfig(): WorkflowPhasesConfig {
  return {
    phases: {
      'plan': {
        description: 'Understand requirements, design approach',
        experts: ['clarity', 'simplicity', 'data-first', 'correctness', 'abstraction'],
      },
      'structure': {
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
      'refactoring': {
        description: 'Simplify and clean up, verify still works',
        experts: ['clarity', 'pragmatism', 'legacy', 'design-patterns', 'simplicity'],
      },
      'independent-review': {
        description: 'Independent code review via Gemini, fix issues found',
        experts: [],
      },
      'static-analysis': {
        description: 'Run analyzers, fix issues found',
        experts: ['style'],
      },
      'doc-code': {
        description: 'Document the completed work',
        experts: ['docs', 'brevity', 'prose', 'editing'],
      },
      'production-readiness': {
        description: 'Final production readiness check (post-loop)',
        experts: [],
      },
      'security-review': {
        description: 'Adversarial security review (post-loop)',
        experts: [],
      },
    },
    'ralph-sequence': [
      'plan',
      'structure',
      'implement',
      'test',
      'refactoring',
      'independent-review',
      'static-analysis',
      'doc-code',
    ],
  };
}

export function getDefaultKeywordRules(): readonly CompiledKeywordRule[] {
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
