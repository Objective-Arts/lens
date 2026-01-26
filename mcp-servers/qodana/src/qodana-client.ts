/**
 * Qodana client - handles CLI execution and Cloud API calls
 */

import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type {
  QodanaServerConfig,
  QodanaScanOptions,
  QodanaScanResult,
  QodanaLinter,
  QodanaProject,
  QodanaReport,
  QodanaProblem,
  QodanaBaseline,
  SarifLog,
  SarifResult,
  QodanaLocalProblem
} from './types.js';

const DEFAULT_API_URL = 'https://api.qodana.cloud/v1';

export class QodanaClient {
  private config: QodanaServerConfig;

  constructor(config: Partial<QodanaServerConfig> = {}) {
    this.config = {
      cloudApiUrl: config.cloudApiUrl || DEFAULT_API_URL,
      cloudToken: config.cloudToken || process.env.QODANA_TOKEN,
      cliPath: config.cliPath || this.findCliPath(),
      defaultLinter: config.defaultLinter,
      defaultResultsDir: config.defaultResultsDir || '.qodana'
    };
  }

  /**
   * Find qodana CLI in PATH or common locations
   */
  private findCliPath(): string {
    try {
      // Try to find qodana in PATH
      const result = execSync('which qodana 2>/dev/null || where qodana 2>nul', {
        encoding: 'utf-8'
      }).trim();
      if (result) return result.split('\n')[0];
    } catch {
      // Not found in PATH
    }

    // Common installation locations
    const commonPaths = [
      '/usr/local/bin/qodana',
      '/opt/homebrew/bin/qodana',
      path.join(process.env.HOME || '', '.local/bin/qodana'),
      path.join(process.env.HOME || '', 'go/bin/qodana')
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }

    return 'qodana'; // Fall back to PATH lookup
  }

  /**
   * Check if Qodana CLI is available
   */
  async checkCliAvailable(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const result = execSync(`${this.config.cliPath} --version 2>&1`, {
        encoding: 'utf-8',
        timeout: 10000
      });
      const versionMatch = result.match(/qodana\s+version\s+([\d.]+)/i);
      return {
        available: true,
        version: versionMatch ? versionMatch[1] : 'unknown'
      };
    } catch (error) {
      return {
        available: false,
        error: `Qodana CLI not found. Install with: brew install jetbrains/utils/qodana`
      };
    }
  }

  /**
   * Detect the appropriate linter for a project (returns first match)
   */
  detectLinter(projectDir: string): QodanaLinter | null {
    const linters = this.detectAllLinters(projectDir);
    return linters.length > 0 ? linters[0].linter : null;
  }

  /**
   * Detect ALL languages/linters in a project
   */
  detectAllLinters(projectDir: string): Array<{ linter: QodanaLinter; language: string; confidence: 'high' | 'medium' }> {
    const detected: Array<{ linter: QodanaLinter; language: string; confidence: 'high' | 'medium' }> = [];

    // Recursively find files (limit depth to avoid node_modules etc.)
    const findFiles = (dir: string, depth = 0): string[] => {
      if (depth > 3) return [];
      const skipDirs = ['node_modules', '.git', 'vendor', 'target', 'build', 'dist', '.qodana', '__pycache__', 'venv', '.venv'];

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let files: string[] = [];

        for (const entry of entries) {
          if (entry.isDirectory()) {
            if (!skipDirs.includes(entry.name)) {
              files = files.concat(findFiles(path.join(dir, entry.name), depth + 1));
            }
          } else {
            files.push(entry.name);
          }
        }
        return files;
      } catch {
        return [];
      }
    };

    const allFiles = findFiles(projectDir);
    const rootFiles = fs.readdirSync(projectDir);

    const hasRootFile = (patterns: string[]) =>
      patterns.some(p => rootFiles.some(f => f.match(new RegExp(p, 'i'))));

    const hasAnyFile = (patterns: string[]) =>
      patterns.some(p => allFiles.some(f => f.match(new RegExp(p, 'i'))));

    // Java/Kotlin - high confidence from build files
    if (hasRootFile(['pom\\.xml', 'build\\.gradle', 'build\\.gradle\\.kts'])) {
      detected.push({ linter: 'qodana-jvm-community', language: 'Java/Kotlin', confidence: 'high' });
    } else if (hasAnyFile(['\\.java$', '\\.kt$'])) {
      detected.push({ linter: 'qodana-jvm-community', language: 'Java/Kotlin', confidence: 'medium' });
    }

    // Go
    if (hasRootFile(['go\\.mod'])) {
      detected.push({ linter: 'qodana-go', language: 'Go', confidence: 'high' });
    } else if (hasAnyFile(['\\.go$'])) {
      detected.push({ linter: 'qodana-go', language: 'Go', confidence: 'medium' });
    }

    // Rust
    if (hasRootFile(['Cargo\\.toml'])) {
      detected.push({ linter: 'qodana-rust', language: 'Rust', confidence: 'high' });
    } else if (hasAnyFile(['\\.rs$'])) {
      detected.push({ linter: 'qodana-rust', language: 'Rust', confidence: 'medium' });
    }

    // PHP
    if (hasRootFile(['composer\\.json'])) {
      detected.push({ linter: 'qodana-php', language: 'PHP', confidence: 'high' });
    } else if (hasAnyFile(['\\.php$'])) {
      detected.push({ linter: 'qodana-php', language: 'PHP', confidence: 'medium' });
    }

    // Python
    if (hasRootFile(['requirements\\.txt', 'pyproject\\.toml', 'setup\\.py', 'Pipfile'])) {
      detected.push({ linter: 'qodana-python-community', language: 'Python', confidence: 'high' });
    } else if (hasAnyFile(['\\.py$'])) {
      detected.push({ linter: 'qodana-python-community', language: 'Python', confidence: 'medium' });
    }

    // C#/.NET
    if (hasRootFile(['\\.sln$']) || hasAnyFile(['\\.csproj$'])) {
      detected.push({ linter: 'qodana-dotnet', language: 'C#/.NET', confidence: 'high' });
    } else if (hasAnyFile(['\\.cs$'])) {
      detected.push({ linter: 'qodana-dotnet', language: 'C#/.NET', confidence: 'medium' });
    }

    // Ruby
    if (hasRootFile(['Gemfile'])) {
      detected.push({ linter: 'qodana-ruby', language: 'Ruby', confidence: 'high' });
    } else if (hasAnyFile(['\\.rb$'])) {
      detected.push({ linter: 'qodana-ruby', language: 'Ruby', confidence: 'medium' });
    }

    // C/C++
    if (hasRootFile(['CMakeLists\\.txt', 'Makefile'])) {
      detected.push({ linter: 'qodana-cpp', language: 'C/C++', confidence: 'high' });
    } else if (hasAnyFile(['\\.cpp$', '\\.hpp$', '\\.c$', '\\.h$'])) {
      detected.push({ linter: 'qodana-cpp', language: 'C/C++', confidence: 'medium' });
    }

    // JavaScript/TypeScript - check last as it's common in many projects
    if (hasRootFile(['package\\.json'])) {
      detected.push({ linter: 'qodana-js', language: 'JavaScript/TypeScript', confidence: 'high' });
    } else if (hasAnyFile(['\\.ts$', '\\.tsx$', '\\.js$', '\\.jsx$'])) {
      detected.push({ linter: 'qodana-js', language: 'JavaScript/TypeScript', confidence: 'medium' });
    }

    return detected;
  }

  /**
   * Run multi-linter scan for projects with multiple languages
   */
  async multiScan(options: QodanaScanOptions & { linters?: QodanaLinter[] }): Promise<{
    success: boolean;
    scans: Array<{
      linter: QodanaLinter;
      language: string;
      success: boolean;
      summary?: { total: number; critical: number; high: number; moderate: number; low: number; info: number };
      problems?: QodanaLocalProblem[];
      error?: string;
    }>;
    combinedSummary: { total: number; critical: number; high: number; moderate: number; low: number; info: number };
    allProblems: QodanaLocalProblem[];
  }> {
    // Detect or use provided linters
    const lintersToRun = options.linters ||
      this.detectAllLinters(options.projectDir).map(d => d.linter);

    if (lintersToRun.length === 0) {
      return {
        success: false,
        scans: [],
        combinedSummary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
        allProblems: []
      };
    }

    const scans: Array<{
      linter: QodanaLinter;
      language: string;
      success: boolean;
      summary?: { total: number; critical: number; high: number; moderate: number; low: number; info: number };
      problems?: QodanaLocalProblem[];
      error?: string;
    }> = [];

    const allProblems: QodanaLocalProblem[] = [];
    const combinedSummary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };

    // Get language names for each linter
    const linterLanguages: Record<string, string> = {
      'qodana-jvm-community': 'Java/Kotlin',
      'qodana-jvm': 'Java/Kotlin',
      'qodana-go': 'Go',
      'qodana-rust': 'Rust',
      'qodana-php': 'PHP',
      'qodana-python-community': 'Python',
      'qodana-python': 'Python',
      'qodana-dotnet': 'C#/.NET',
      'qodana-ruby': 'Ruby',
      'qodana-cpp': 'C/C++',
      'qodana-js': 'JavaScript/TypeScript'
    };

    // Run each linter sequentially
    for (const linter of lintersToRun) {
      const language = linterLanguages[linter] || linter;

      // Use separate results directory per linter
      const resultsDir = path.join(options.projectDir, '.qodana', linter);

      const result = await this.scan({
        ...options,
        linter,
        resultsDir
      });

      const scanResult = {
        linter,
        language,
        success: result.success,
        summary: result.summary,
        problems: result.problems,
        error: result.error
      };

      scans.push(scanResult);

      if (result.success && result.problems) {
        allProblems.push(...result.problems);
        if (result.summary) {
          combinedSummary.total += result.summary.total;
          combinedSummary.critical += result.summary.critical;
          combinedSummary.high += result.summary.high;
          combinedSummary.moderate += result.summary.moderate;
          combinedSummary.low += result.summary.low;
          combinedSummary.info += result.summary.info;
        }
      }
    }

    return {
      success: scans.every(s => s.success),
      scans,
      combinedSummary,
      allProblems
    };
  }

  /**
   * Run Qodana scan using CLI
   */
  async scan(options: QodanaScanOptions): Promise<QodanaScanResult> {
    const cliCheck = await this.checkCliAvailable();
    if (!cliCheck.available) {
      return {
        success: false,
        exitCode: -1,
        error: cliCheck.error
      };
    }

    // Determine linter
    const linter = options.linter || this.config.defaultLinter || this.detectLinter(options.projectDir);
    if (!linter) {
      return {
        success: false,
        exitCode: -1,
        error: 'Could not detect project type. Please specify --linter explicitly.'
      };
    }

    // Build command arguments
    const resultsDir = options.resultsDir || path.join(options.projectDir, this.config.defaultResultsDir || '.qodana');
    const args = [
      'scan',
      '--project-dir', options.projectDir,
      '--linter', linter,
      '--results-dir', resultsDir
    ];

    if (options.reportDir) {
      args.push('--report-dir', options.reportDir);
    }
    if (options.cacheDir) {
      args.push('--cache-dir', options.cacheDir);
    }
    if (options.baseline) {
      args.push('--baseline', options.baseline);
    }
    if (options.baselineIncludeAbsent) {
      args.push('--baseline-include-absent');
    }
    if (options.failThreshold) {
      args.push('--fail-threshold', options.failThreshold);
    }
    if (options.profileName) {
      args.push('--profile-name', options.profileName);
    }
    if (options.profilePath) {
      args.push('--profile-path', options.profilePath);
    }
    if (options.disableSanity) {
      args.push('--disable-sanity');
    }
    if (options.sourceDirectory) {
      args.push('--source-directory', options.sourceDirectory);
    }
    if (options.changes) {
      args.push('--changes');
    }

    return new Promise((resolve) => {
      const proc = spawn(this.config.cliPath!, args, {
        env: { ...process.env, ...options.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        const exitCode = code ?? 0;

        // Try to parse results
        const sarifPath = path.join(resultsDir, 'qodana.sarif.json');
        let problems: QodanaLocalProblem[] = [];
        let summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };

        if (fs.existsSync(sarifPath)) {
          try {
            const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf-8')) as SarifLog;
            const parsed = this.parseSarifResults(sarif);
            problems = parsed.problems;
            summary = parsed.summary;
          } catch {
            // Failed to parse SARIF
          }
        }

        resolve({
          success: exitCode === 0 || exitCode === 255, // 255 = problems found but scan succeeded
          exitCode,
          resultsPath: resultsDir,
          reportPath: options.reportDir || path.join(resultsDir, 'report'),
          summary,
          problems,
          error: exitCode !== 0 && exitCode !== 255 ? stderr || stdout : undefined
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          exitCode: -1,
          error: error.message
        });
      });
    });
  }

  /**
   * Parse SARIF results into our format
   */
  private parseSarifResults(sarif: SarifLog): {
    problems: QodanaLocalProblem[];
    summary: { total: number; critical: number; high: number; moderate: number; low: number; info: number };
  } {
    const problems: QodanaLocalProblem[] = [];
    const summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };

    for (const run of sarif.runs || []) {
      const rules = new Map(run.tool.driver.rules?.map(r => [r.id, r]) || []);

      for (const result of run.results || []) {
        const rule = rules.get(result.ruleId);
        const severity = this.mapSarifLevel(result.level);

        summary.total++;
        if (severity === 'CRITICAL') summary.critical++;
        else if (severity === 'HIGH') summary.high++;
        else if (severity === 'MODERATE') summary.moderate++;
        else if (severity === 'LOW') summary.low++;
        else summary.info++;

        problems.push({
          tool: run.tool.driver.name,
          category: rule?.shortDescription?.text || 'Unknown',
          type: result.ruleId,
          severity,
          comment: result.message.text,
          detailsInfo: rule?.fullDescription?.text || '',
          sources: result.locations?.map(loc => ({
            file: loc.physicalLocation.artifactLocation.uri,
            line: loc.physicalLocation.region?.startLine || 0,
            column: loc.physicalLocation.region?.startColumn || 0,
            length: 0,
            offset: 0,
            message: result.message.text
          })) || []
        });
      }
    }

    return { problems, summary };
  }

  /**
   * Map SARIF level to Qodana severity
   */
  private mapSarifLevel(level: string): string {
    switch (level) {
      case 'error': return 'HIGH';
      case 'warning': return 'MODERATE';
      case 'note': return 'LOW';
      default: return 'INFO';
    }
  }

  /**
   * Get problems from a local results directory
   */
  async getLocalProblems(resultsDir: string): Promise<QodanaLocalProblem[]> {
    const sarifPath = path.join(resultsDir, 'qodana.sarif.json');

    if (!fs.existsSync(sarifPath)) {
      throw new Error(`SARIF file not found at ${sarifPath}`);
    }

    const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf-8')) as SarifLog;
    return this.parseSarifResults(sarif).problems;
  }

  /**
   * Create or update baseline from current results
   */
  async createBaseline(resultsDir: string, baselinePath: string): Promise<{ success: boolean; problemCount: number; error?: string }> {
    const sarifPath = path.join(resultsDir, 'qodana.sarif.json');

    if (!fs.existsSync(sarifPath)) {
      return {
        success: false,
        problemCount: 0,
        error: `SARIF file not found at ${sarifPath}. Run a scan first.`
      };
    }

    try {
      // Qodana baseline format
      const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf-8')) as SarifLog;
      const baseline = {
        version: 1,
        problems: sarif.runs.flatMap(run =>
          run.results.map(r => ({
            tool: run.tool.driver.name,
            hash: this.hashProblem(r),
            ruleId: r.ruleId,
            file: r.locations?.[0]?.physicalLocation.artifactLocation.uri,
            line: r.locations?.[0]?.physicalLocation.region?.startLine
          }))
        )
      };

      fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));

      return {
        success: true,
        problemCount: baseline.problems.length
      };
    } catch (error) {
      return {
        success: false,
        problemCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a hash for a problem (for baseline matching)
   */
  private hashProblem(result: SarifResult): string {
    const parts = [
      result.ruleId,
      result.message.text,
      result.locations?.[0]?.physicalLocation.artifactLocation.uri || ''
    ];
    // Simple hash - in production use crypto
    return Buffer.from(parts.join('|')).toString('base64').slice(0, 16);
  }

  // ============================================
  // Qodana Cloud API methods
  // ============================================

  /**
   * Check if Cloud API is configured
   */
  isCloudConfigured(): boolean {
    return !!this.config.cloudToken;
  }

  /**
   * Make authenticated API request to Qodana Cloud
   */
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.config.cloudToken) {
      throw new Error('QODANA_TOKEN not configured. Set the environment variable.');
    }

    const url = `${this.config.cloudApiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.cloudToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Qodana API error (${response.status}): ${error}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * List projects in Qodana Cloud
   */
  async listProjects(): Promise<QodanaProject[]> {
    return this.apiRequest<QodanaProject[]>('/projects');
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<QodanaProject> {
    return this.apiRequest<QodanaProject>(`/projects/${projectId}`);
  }

  /**
   * List reports for a project
   */
  async listReports(projectId: string, limit = 10): Promise<QodanaReport[]> {
    return this.apiRequest<QodanaReport[]>(`/projects/${projectId}/reports?limit=${limit}`);
  }

  /**
   * Get report details
   */
  async getReport(projectId: string, reportId: string): Promise<QodanaReport> {
    return this.apiRequest<QodanaReport>(`/projects/${projectId}/reports/${reportId}`);
  }

  /**
   * Get problems from a Cloud report
   */
  async getReportProblems(
    projectId: string,
    reportId: string,
    options: { severity?: string; limit?: number; offset?: number } = {}
  ): Promise<QodanaProblem[]> {
    const params = new URLSearchParams();
    if (options.severity) params.set('severity', options.severity);
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.apiRequest<QodanaProblem[]>(
      `/projects/${projectId}/reports/${reportId}/problems${query}`
    );
  }

  /**
   * List baselines for a project
   */
  async listBaselines(projectId: string): Promise<QodanaBaseline[]> {
    return this.apiRequest<QodanaBaseline[]>(`/projects/${projectId}/baselines`);
  }
}
