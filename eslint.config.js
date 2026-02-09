import tseslint from 'typescript-eslint';

// Files >300 lines — warn on file size and function size until split
const GRANDFATHERED_SIZE = [
  'src/profiles/apply.ts',
  'src/ralph/phases/independent-review.ts',
  'src/mcp/operations.ts',
  'src/scanner/index.ts',
  'src/ralph/phases/production-readiness.ts',
  'src/workflow/index.ts',
  'src/ralph/phases/loader.ts',
  'src/trace/index.ts',
  'src/ralph/phases/security-review.ts',
  'src/hooks/index.ts',
];

// Existing files with complexity/function-length/depth violations.
// These get warn instead of error until refactored.
// New files MUST meet the limits (error level applies by default).
const GRANDFATHERED_STRUCTURAL = [
  'src/canon/deployment.ts',
  'src/canon/operations.ts',
  'src/cli/commands/profile.ts',
  'src/cli/commands/scan.ts',
  'src/cli/display/canon.ts',
  'src/cli/display/deps.ts',
  'src/cli/display/mcp.ts',
  'src/cli/display/scan.ts',
  'src/cli/display/tokens.ts',
  'src/hooks/index.ts',
  'src/mcp/operations.ts',
  'src/parser/claude-md.ts',
  'src/profiles/apply.ts',
  'src/profiles/loader.ts',
  'src/profiles/validation.ts',
  'src/ralph/config/loader.ts',
  'src/ralph/index.ts',
  'src/ralph/parsers/qodana.ts',
  'src/ralph/phases/doc-code.ts',
  'src/ralph/phases/implement.ts',
  'src/ralph/phases/independent-review.ts',
  'src/ralph/phases/loader.ts',
  'src/ralph/phases/plan.ts',
  'src/ralph/phases/production-readiness.ts',
  'src/ralph/phases/refactor-check.ts',
  'src/ralph/phases/security-review.ts',
  'src/ralph/phases/static-analysis.ts',
  'src/ralph/phases/structure-first.ts',
  'src/ralph/phases/test.ts',
  'src/ralph/phases/types.ts',
  'src/ralph/process/claude.ts',
  'src/ralph/runner.ts',
  'src/ralph/runner/context.ts',
  'src/ralph/runner/phases.ts',
  'src/ralph/runner/retry.ts',
  'src/ralph/summary/collector.ts',
  'src/ralph/test-utils/mocks.ts',
  'src/scanner/index.ts',
  'src/trace/index.ts',
  'src/workflow/index.ts',
];

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'scripts/**'],
  },
  // Base config for all TypeScript source files
  {
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    rules: {
      // typescript SUMMARY: no explicit any
      '@typescript-eslint/no-explicit-any': 'error',

      // typescript SUMMARY: explicit return types on exports
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        allowedNames: [],
      }],

      // typescript SUMMARY: no unused vars (allow _ prefix)
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // clarity SUMMARY: strict equality
      'eqeqeq': ['error', 'always'],

      // CLAUDE.md standards: no var, prefer const
      'no-var': 'error',
      'prefer-const': 'error',

      // clarity/simplicity: max function length (30 lines)
      'max-lines-per-function': ['error', {
        max: 30,
        skipBlankLines: true,
        skipComments: true,
      }],

      // refactor-check-fix: max file length (300 lines)
      'max-lines': ['error', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],

      // clarity SUMMARY: max nesting depth
      'max-depth': ['error', 4],

      // clarity SUMMARY: cyclomatic complexity
      'complexity': ['error', 10],
    },
  },
  // Test file overrides
  {
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    extends: [
      ...tseslint.configs.recommended,
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'max-lines-per-function': 'off',
      'max-lines': ['error', {
        max: 500,
        skipBlankLines: true,
        skipComments: true,
      }],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'max-depth': ['error', 4],
      'complexity': ['error', 10],
    },
  },
  // Grandfathered: files >300 lines — warn on file size until split
  {
    files: GRANDFATHERED_SIZE,
    rules: {
      'max-lines': ['warn', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },
  // Grandfathered: existing files with structural violations — warn until refactored
  // New files still get error level. Remove files from this list as they're fixed.
  {
    files: GRANDFATHERED_STRUCTURAL,
    rules: {
      'max-lines-per-function': ['warn', {
        max: 30,
        skipBlankLines: true,
        skipComments: true,
      }],
      'complexity': ['warn', 10],
      'max-depth': ['warn', 4],
    },
  },
);
