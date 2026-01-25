/**
 * Qodana client - handles CLI execution and Cloud API calls
 */
import { spawn, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
const DEFAULT_API_URL = 'https://api.qodana.cloud/v1';
export class QodanaClient {
    config;
    constructor(config = {}) {
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
    findCliPath() {
        try {
            // Try to find qodana in PATH
            const result = execSync('which qodana 2>/dev/null || where qodana 2>nul', {
                encoding: 'utf-8'
            }).trim();
            if (result)
                return result.split('\n')[0];
        }
        catch {
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
            if (fs.existsSync(p))
                return p;
        }
        return 'qodana'; // Fall back to PATH lookup
    }
    /**
     * Check if Qodana CLI is available
     */
    async checkCliAvailable() {
        try {
            const result = execSync(`${this.config.cliPath} version 2>&1`, {
                encoding: 'utf-8',
                timeout: 10000
            });
            const versionMatch = result.match(/qodana\s+v?([\d.]+)/i);
            return {
                available: true,
                version: versionMatch ? versionMatch[1] : 'unknown'
            };
        }
        catch (error) {
            return {
                available: false,
                error: `Qodana CLI not found. Install with: brew install jetbrains/utils/qodana`
            };
        }
    }
    /**
     * Detect the appropriate linter for a project
     */
    detectLinter(projectDir) {
        const files = fs.readdirSync(projectDir);
        const hasFile = (patterns) => patterns.some(p => files.some(f => f.match(new RegExp(p, 'i'))));
        // Check for project files to determine language/framework
        if (hasFile(['pom\\.xml', 'build\\.gradle', '\\.java$'])) {
            return 'qodana-jvm-community';
        }
        if (hasFile(['go\\.mod', '\\.go$'])) {
            return 'qodana-go';
        }
        if (hasFile(['Cargo\\.toml', '\\.rs$'])) {
            return 'qodana-rust';
        }
        if (hasFile(['composer\\.json', '\\.php$'])) {
            return 'qodana-php';
        }
        if (hasFile(['requirements\\.txt', 'pyproject\\.toml', 'setup\\.py', '\\.py$'])) {
            return 'qodana-python-community';
        }
        if (hasFile(['\\.csproj$', '\\.sln$', '\\.cs$'])) {
            return 'qodana-dotnet';
        }
        if (hasFile(['Gemfile', '\\.rb$'])) {
            return 'qodana-ruby';
        }
        if (hasFile(['CMakeLists\\.txt', '\\.cpp$', '\\.hpp$', '\\.c$', '\\.h$'])) {
            return 'qodana-cpp';
        }
        if (hasFile(['package\\.json', 'tsconfig\\.json', '\\.ts$', '\\.js$', '\\.tsx$', '\\.jsx$'])) {
            return 'qodana-js';
        }
        return null;
    }
    /**
     * Run Qodana scan using CLI
     */
    async scan(options) {
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
            const proc = spawn(this.config.cliPath, args, {
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
                let problems = [];
                let summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
                if (fs.existsSync(sarifPath)) {
                    try {
                        const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf-8'));
                        const parsed = this.parseSarifResults(sarif);
                        problems = parsed.problems;
                        summary = parsed.summary;
                    }
                    catch {
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
    parseSarifResults(sarif) {
        const problems = [];
        const summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
        for (const run of sarif.runs || []) {
            const rules = new Map(run.tool.driver.rules?.map(r => [r.id, r]) || []);
            for (const result of run.results || []) {
                const rule = rules.get(result.ruleId);
                const severity = this.mapSarifLevel(result.level);
                summary.total++;
                if (severity === 'CRITICAL')
                    summary.critical++;
                else if (severity === 'HIGH')
                    summary.high++;
                else if (severity === 'MODERATE')
                    summary.moderate++;
                else if (severity === 'LOW')
                    summary.low++;
                else
                    summary.info++;
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
    mapSarifLevel(level) {
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
    async getLocalProblems(resultsDir) {
        const sarifPath = path.join(resultsDir, 'qodana.sarif.json');
        if (!fs.existsSync(sarifPath)) {
            throw new Error(`SARIF file not found at ${sarifPath}`);
        }
        const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf-8'));
        return this.parseSarifResults(sarif).problems;
    }
    /**
     * Create or update baseline from current results
     */
    async createBaseline(resultsDir, baselinePath) {
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
            const sarif = JSON.parse(fs.readFileSync(sarifPath, 'utf-8'));
            const baseline = {
                version: 1,
                problems: sarif.runs.flatMap(run => run.results.map(r => ({
                    tool: run.tool.driver.name,
                    hash: this.hashProblem(r),
                    ruleId: r.ruleId,
                    file: r.locations?.[0]?.physicalLocation.artifactLocation.uri,
                    line: r.locations?.[0]?.physicalLocation.region?.startLine
                })))
            };
            fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2));
            return {
                success: true,
                problemCount: baseline.problems.length
            };
        }
        catch (error) {
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
    hashProblem(result) {
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
    isCloudConfigured() {
        return !!this.config.cloudToken;
    }
    /**
     * Make authenticated API request to Qodana Cloud
     */
    async apiRequest(endpoint, options = {}) {
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
        return response.json();
    }
    /**
     * List projects in Qodana Cloud
     */
    async listProjects() {
        return this.apiRequest('/projects');
    }
    /**
     * Get project by ID
     */
    async getProject(projectId) {
        return this.apiRequest(`/projects/${projectId}`);
    }
    /**
     * List reports for a project
     */
    async listReports(projectId, limit = 10) {
        return this.apiRequest(`/projects/${projectId}/reports?limit=${limit}`);
    }
    /**
     * Get report details
     */
    async getReport(projectId, reportId) {
        return this.apiRequest(`/projects/${projectId}/reports/${reportId}`);
    }
    /**
     * Get problems from a Cloud report
     */
    async getReportProblems(projectId, reportId, options = {}) {
        const params = new URLSearchParams();
        if (options.severity)
            params.set('severity', options.severity);
        if (options.limit)
            params.set('limit', options.limit.toString());
        if (options.offset)
            params.set('offset', options.offset.toString());
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.apiRequest(`/projects/${projectId}/reports/${reportId}/problems${query}`);
    }
    /**
     * List baselines for a project
     */
    async listBaselines(projectId) {
        return this.apiRequest(`/projects/${projectId}/baselines`);
    }
}
//# sourceMappingURL=qodana-client.js.map