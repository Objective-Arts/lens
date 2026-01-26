#!/usr/bin/env node

/**
 * MCP Server for JetBrains Qodana
 *
 * Provides code quality analysis through Qodana CLI and Cloud API
 *
 * Tools:
 * - qodana_scan: Run a Qodana scan on a project
 * - qodana_results: Get results from a previous scan
 * - qodana_problems: List problems with filtering
 * - qodana_baseline: Create or update a baseline
 * - qodana_status: Check Qodana CLI and Cloud status
 * - qodana_detect: Detect the appropriate linter for a project
 *
 * Cloud Tools (requires QODANA_TOKEN):
 * - qodana_cloud_projects: List Cloud projects
 * - qodana_cloud_reports: List reports for a project
 * - qodana_cloud_problems: Get problems from a Cloud report
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { QodanaClient } from './qodana-client.js';
import type { QodanaLinter, QodanaScanOptions } from './types.js';

// Initialize client
const client = new QodanaClient();

// Define available tools
const tools: Tool[] = [
  {
    name: 'qodana_scan',
    description: 'Run a Qodana code quality scan on a project directory. Returns detected problems with severity levels.',
    inputSchema: {
      type: 'object',
      properties: {
        projectDir: {
          type: 'string',
          description: 'Path to the project directory to scan'
        },
        linter: {
          type: 'string',
          description: 'Qodana linter to use (auto-detected if not specified)',
          enum: [
            'qodana-jvm-community', 'qodana-jvm', 'qodana-jvm-android',
            'qodana-php', 'qodana-python-community', 'qodana-python',
            'qodana-js', 'qodana-dotnet', 'qodana-go', 'qodana-rust',
            'qodana-cpp', 'qodana-ruby'
          ]
        },
        baseline: {
          type: 'string',
          description: 'Path to baseline file to compare against'
        },
        failThreshold: {
          type: 'string',
          description: 'Fail if problems at or above this severity exist',
          enum: ['any', 'critical', 'high', 'moderate', 'low', 'none']
        },
        changesOnly: {
          type: 'boolean',
          description: 'Only analyze changed files (requires git)'
        }
      },
      required: ['projectDir']
    }
  },
  {
    name: 'qodana_results',
    description: 'Get results from a previous Qodana scan in a project directory',
    inputSchema: {
      type: 'object',
      properties: {
        projectDir: {
          type: 'string',
          description: 'Path to the project directory'
        },
        resultsDir: {
          type: 'string',
          description: 'Path to results directory (default: .qodana in project)'
        }
      },
      required: ['projectDir']
    }
  },
  {
    name: 'qodana_problems',
    description: 'List problems from a Qodana scan with filtering options',
    inputSchema: {
      type: 'object',
      properties: {
        projectDir: {
          type: 'string',
          description: 'Path to the project directory'
        },
        severity: {
          type: 'string',
          description: 'Filter by minimum severity',
          enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'INFO']
        },
        file: {
          type: 'string',
          description: 'Filter by file path (partial match)'
        },
        category: {
          type: 'string',
          description: 'Filter by problem category'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of problems to return',
          default: 50
        }
      },
      required: ['projectDir']
    }
  },
  {
    name: 'qodana_baseline',
    description: 'Create a baseline from current scan results to suppress known issues in future scans',
    inputSchema: {
      type: 'object',
      properties: {
        projectDir: {
          type: 'string',
          description: 'Path to the project directory'
        },
        baselinePath: {
          type: 'string',
          description: 'Path to save the baseline file (default: qodana.baseline.json in project)'
        }
      },
      required: ['projectDir']
    }
  },
  {
    name: 'qodana_status',
    description: 'Check Qodana CLI availability and Cloud API configuration',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'qodana_detect',
    description: 'Detect ALL languages in a project and their appropriate Qodana linters. Returns multiple linters for multi-language projects.',
    inputSchema: {
      type: 'object',
      properties: {
        projectDir: {
          type: 'string',
          description: 'Path to the project directory'
        }
      },
      required: ['projectDir']
    }
  },
  {
    name: 'qodana_multi_scan',
    description: 'Run Qodana scans for ALL detected languages in a project. Automatically detects languages and runs appropriate linters sequentially, combining results.',
    inputSchema: {
      type: 'object',
      properties: {
        projectDir: {
          type: 'string',
          description: 'Path to the project directory to scan'
        },
        linters: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'qodana-jvm-community', 'qodana-jvm', 'qodana-jvm-android',
              'qodana-php', 'qodana-python-community', 'qodana-python',
              'qodana-js', 'qodana-dotnet', 'qodana-go', 'qodana-rust',
              'qodana-cpp', 'qodana-ruby'
            ]
          },
          description: 'Specific linters to run (auto-detected if not specified)'
        },
        baseline: {
          type: 'string',
          description: 'Path to baseline file to compare against'
        },
        changesOnly: {
          type: 'boolean',
          description: 'Only analyze changed files (requires git)'
        }
      },
      required: ['projectDir']
    }
  },
  // Cloud API tools
  {
    name: 'qodana_cloud_projects',
    description: 'List projects in Qodana Cloud (requires QODANA_TOKEN)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'qodana_cloud_reports',
    description: 'List recent reports for a Qodana Cloud project',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Qodana Cloud project ID'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of reports to return',
          default: 10
        }
      },
      required: ['projectId']
    }
  },
  {
    name: 'qodana_cloud_problems',
    description: 'Get problems from a Qodana Cloud report',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Qodana Cloud project ID'
        },
        reportId: {
          type: 'string',
          description: 'Report ID'
        },
        severity: {
          type: 'string',
          description: 'Filter by severity',
          enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'INFO']
        },
        limit: {
          type: 'number',
          description: 'Maximum number of problems to return',
          default: 50
        }
      },
      required: ['projectId', 'reportId']
    }
  }
];

// Create server
const server = new Server(
  {
    name: 'qodana-mcp-server',
    version: '0.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'qodana_scan': {
        const options: QodanaScanOptions = {
          projectDir: (args.projectDir as string) || process.cwd(),
          linter: args.linter as QodanaLinter | undefined,
          baseline: args.baseline as string | undefined,
          failThreshold: args.failThreshold as QodanaScanOptions['failThreshold'],
          changes: args.changesOnly as boolean | undefined
        };

        const result = await client.scan(options);

        if (!result.success && result.error) {
          return {
            content: [{
              type: 'text',
              text: `Scan failed: ${result.error}`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: result.success,
              summary: result.summary,
              resultsPath: result.resultsPath,
              reportPath: result.reportPath,
              problemCount: result.problems?.length || 0,
              topProblems: result.problems?.slice(0, 10).map(p => ({
                severity: p.severity,
                type: p.type,
                message: p.comment,
                file: p.sources[0]?.file,
                line: p.sources[0]?.line
              }))
            }, null, 2)
          }]
        };
      }

      case 'qodana_results': {
        const projectDir = args.projectDir as string;
        const resultsDir = (args.resultsDir as string) || `${projectDir}/.qodana`;

        const problems = await client.getLocalProblems(resultsDir);

        const summary = {
          total: problems.length,
          critical: problems.filter(p => p.severity === 'CRITICAL').length,
          high: problems.filter(p => p.severity === 'HIGH').length,
          moderate: problems.filter(p => p.severity === 'MODERATE').length,
          low: problems.filter(p => p.severity === 'LOW').length,
          info: problems.filter(p => p.severity === 'INFO').length
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ summary, problemCount: problems.length }, null, 2)
          }]
        };
      }

      case 'qodana_problems': {
        const projectDir = args.projectDir as string;
        const resultsDir = `${projectDir}/.qodana`;
        const severity = args.severity as string | undefined;
        const file = args.file as string | undefined;
        const category = args.category as string | undefined;
        const limit = (args.limit as number) || 50;

        let problems = await client.getLocalProblems(resultsDir);

        // Apply filters
        if (severity) {
          const severityOrder = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'INFO'];
          const minIndex = severityOrder.indexOf(severity);
          problems = problems.filter(p => severityOrder.indexOf(p.severity) <= minIndex);
        }
        if (file) {
          problems = problems.filter(p =>
            p.sources.some(s => s.file.includes(file))
          );
        }
        if (category) {
          problems = problems.filter(p =>
            p.category.toLowerCase().includes(category.toLowerCase())
          );
        }

        // Apply limit
        problems = problems.slice(0, limit);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: problems.length,
              problems: problems.map(p => ({
                severity: p.severity,
                category: p.category,
                type: p.type,
                message: p.comment,
                file: p.sources[0]?.file,
                line: p.sources[0]?.line
              }))
            }, null, 2)
          }]
        };
      }

      case 'qodana_baseline': {
        const projectDir = args.projectDir as string;
        const baselinePath = (args.baselinePath as string) || `${projectDir}/qodana.baseline.json`;
        const resultsDir = `${projectDir}/.qodana`;

        const result = await client.createBaseline(resultsDir, baselinePath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: result.success,
              baselinePath,
              problemCount: result.problemCount,
              error: result.error
            }, null, 2)
          }]
        };
      }

      case 'qodana_status': {
        const cliStatus = await client.checkCliAvailable();
        const cloudConfigured = client.isCloudConfigured();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              cli: {
                available: cliStatus.available,
                version: cliStatus.version,
                error: cliStatus.error
              },
              cloud: {
                configured: cloudConfigured,
                note: cloudConfigured ? 'QODANA_TOKEN is set' : 'Set QODANA_TOKEN for Cloud features'
              }
            }, null, 2)
          }]
        };
      }

      case 'qodana_detect': {
        const projectDir = args.projectDir as string;
        const allLinters = client.detectAllLinters(projectDir);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              projectDir,
              languages: allLinters.map(l => ({
                language: l.language,
                linter: l.linter,
                confidence: l.confidence
              })),
              isMultiLanguage: allLinters.length > 1,
              recommendation: allLinters.length > 1
                ? `Multi-language project detected. Use qodana_multi_scan for comprehensive analysis.`
                : allLinters.length === 1
                  ? `Use: qodana scan --linter ${allLinters[0].linter}`
                  : 'Could not detect project type. Please specify linter manually.'
            }, null, 2)
          }]
        };
      }

      case 'qodana_multi_scan': {
        const options = {
          projectDir: (args.projectDir as string) || process.cwd(),
          linters: args.linters as QodanaLinter[] | undefined,
          baseline: args.baseline as string | undefined,
          changes: args.changesOnly as boolean | undefined
        };

        // First detect what languages are in the project
        const detected = client.detectAllLinters(options.projectDir);

        if (detected.length === 0 && !options.linters) {
          return {
            content: [{
              type: 'text',
              text: 'No languages detected in project. Please specify linters manually.'
            }],
            isError: true
          };
        }

        const result = await client.multiScan(options);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: result.success,
              languagesScanned: result.scans.map(s => s.language),
              combinedSummary: result.combinedSummary,
              scanResults: result.scans.map(s => ({
                language: s.language,
                linter: s.linter,
                success: s.success,
                summary: s.summary,
                error: s.error
              })),
              totalProblems: result.allProblems.length,
              topProblems: result.allProblems.slice(0, 15).map(p => ({
                language: p.tool,
                severity: p.severity,
                type: p.type,
                message: p.comment,
                file: p.sources[0]?.file,
                line: p.sources[0]?.line
              }))
            }, null, 2)
          }]
        };
      }

      case 'qodana_cloud_projects': {
        if (!client.isCloudConfigured()) {
          return {
            content: [{
              type: 'text',
              text: 'Qodana Cloud not configured. Set QODANA_TOKEN environment variable.'
            }],
            isError: true
          };
        }

        const projects = await client.listProjects();

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              count: projects.length,
              projects: projects.map(p => ({
                id: p.id,
                name: p.name,
                updatedAt: p.updatedAt
              }))
            }, null, 2)
          }]
        };
      }

      case 'qodana_cloud_reports': {
        if (!client.isCloudConfigured()) {
          return {
            content: [{
              type: 'text',
              text: 'Qodana Cloud not configured. Set QODANA_TOKEN environment variable.'
            }],
            isError: true
          };
        }

        const projectId = args.projectId as string;
        const limit = (args.limit as number) || 10;

        const reports = await client.listReports(projectId, limit);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              projectId,
              count: reports.length,
              reports: reports.map(r => ({
                id: r.id,
                branch: r.branch,
                status: r.status,
                totalProblems: r.totalProblems,
                critical: r.criticalProblems,
                high: r.highProblems,
                createdAt: r.createdAt
              }))
            }, null, 2)
          }]
        };
      }

      case 'qodana_cloud_problems': {
        if (!client.isCloudConfigured()) {
          return {
            content: [{
              type: 'text',
              text: 'Qodana Cloud not configured. Set QODANA_TOKEN environment variable.'
            }],
            isError: true
          };
        }

        const projectId = args.projectId as string;
        const reportId = args.reportId as string;
        const severity = args.severity as string | undefined;
        const limit = (args.limit as number) || 50;

        const problems = await client.getReportProblems(projectId, reportId, {
          severity,
          limit
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              projectId,
              reportId,
              count: problems.length,
              problems: problems.map(p => ({
                severity: p.severity,
                category: p.category,
                message: p.message,
                file: p.file,
                line: p.line
              }))
            }, null, 2)
          }]
        };
      }

      default:
        return {
          content: [{
            type: 'text',
            text: `Unknown tool: ${name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Qodana MCP server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
