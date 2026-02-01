/**
 * Test script for summary generation.
 *
 * Run: npx tsx src/ralph/summary/test-summary.ts
 * Opens browser with sample summary data.
 */

import { generateSummaryHtml, openSummary } from './generator.js';
import { RunSummary } from './types.js';
import * as path from 'path';
import * as fs from 'fs';

// Sample data matching real Ralph output
const sampleSummary: RunSummary = {
  sessionId: 'test-' + Date.now().toString(36),
  startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  endTime: new Date().toISOString(),
  durationMs: 45 * 60 * 1000,
  prdPath: 'test-prd.md',
  projectType: 'typescript',
  totalItems: 3,
  completedItems: 2,
  failedItems: 1,
  items: [
    {
      number: 1,
      text: 'Add user authentication with JWT tokens',
      status: 'success',
      stages: [
        {
          name: 'plan',
          status: 'done',
          durationMs: 120000,
        },
        {
          name: 'structure-first',
          status: 'done',
          durationMs: 90000,
        },
        {
          name: 'implement',
          status: 'done',
          durationMs: 300000,
        },
        {
          name: 'refactor-check',
          status: 'done',
          durationMs: 60000,
          refactor: {
            improvements: [
              'Extracted token validation to separate function',
              'Simplified error handling with early returns',
              'Renamed ambiguous variables for clarity',
            ],
          },
        },
        {
          name: 'independent-review',
          status: 'done',
          durationMs: 180000,
          gemini: {
            issues: [
              { severity: 'HIGH', message: 'JWT secret should use env var', file: 'auth.ts', line: 42, fixed: true },
              { severity: 'MEDIUM', message: 'Missing rate limiting on login', file: 'routes/auth.ts', line: 15, fixed: true },
              { severity: 'LOW', message: 'Consider adding refresh tokens', file: 'auth.ts', fixed: false },
            ],
            totalFound: 3,
            criticalHigh: 1,
            fixed: 2,
            verifiedClean: false,
          },
        },
        {
          name: 'static-analysis',
          status: 'done',
          durationMs: 150000,
          qodana: {
            issues: [
              { severity: 'MEDIUM', message: 'Unused import', file: 'auth.ts', line: 3, fixed: true },
              { severity: 'LOW', message: 'Consider using const', file: 'routes/auth.ts', line: 28, fixed: true },
            ],
            totalFound: 2,
            criticalHigh: 0,
            fixed: 2,
            verifiedClean: true,
          },
        },
        {
          name: 'test',
          status: 'done',
          durationMs: 240000,
          tests: {
            passed: 12,
            failed: 0,
            written: 8,
          },
        },
        {
          name: 'doc-code',
          status: 'done',
          durationMs: 60000,
        },
      ],
    },
    {
      number: 2,
      text: 'Create user profile API endpoints',
      status: 'success',
      stages: [
        {
          name: 'plan',
          status: 'done',
          durationMs: 80000,
        },
        {
          name: 'structure-first',
          status: 'done',
          durationMs: 70000,
        },
        {
          name: 'implement',
          status: 'done',
          durationMs: 200000,
        },
        {
          name: 'refactor-check',
          status: 'skipped',
          durationMs: 5000,
        },
        {
          name: 'independent-review',
          status: 'done',
          durationMs: 120000,
          gemini: {
            issues: [
              { severity: 'CRITICAL', message: 'SQL injection vulnerability in user lookup', file: 'profile.ts', line: 67, fixed: true },
            ],
            totalFound: 1,
            criticalHigh: 1,
            fixed: 1,
            verifiedClean: true,
          },
        },
        {
          name: 'static-analysis',
          status: 'done',
          durationMs: 100000,
          qodana: {
            issues: [],
            totalFound: 0,
            criticalHigh: 0,
            fixed: 0,
            verifiedClean: true,
          },
        },
        {
          name: 'test',
          status: 'done',
          durationMs: 180000,
          tests: {
            passed: 8,
            failed: 0,
            written: 5,
          },
        },
        {
          name: 'doc-code',
          status: 'done',
          durationMs: 45000,
        },
      ],
    },
    {
      number: 3,
      text: 'Add admin dashboard with analytics',
      status: 'failed',
      stages: [
        {
          name: 'plan',
          status: 'done',
          durationMs: 100000,
        },
        {
          name: 'structure-first',
          status: 'done',
          durationMs: 80000,
        },
        {
          name: 'implement',
          status: 'failed',
          durationMs: 250000,
        },
      ],
    },
  ],
};

async function main(): Promise<void> {
  console.log('Generating test summary...');

  // Use temp directory for output
  const outputDir = process.env.TMPDIR ?? '/tmp';

  try {
    const htmlPath = generateSummaryHtml(sampleSummary, outputDir);
    console.log(`Generated: ${htmlPath}`);

    // Verify file has embedded data
    const content = fs.readFileSync(htmlPath, 'utf-8');
    if (content.includes('ralph-summary-data')) {
      console.log('✓ Data embedded successfully');
    } else {
      console.error('✗ Data not embedded!');
    }

    // Open in browser
    console.log('Opening in browser...');
    await openSummary(htmlPath);

  } catch (error) {
    console.error('Failed to generate summary:', error);
    process.exit(1);
  }
}

main();
