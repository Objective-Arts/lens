/**
 * Qodana client - handles CLI execution and Cloud API calls
 */
import type { QodanaServerConfig, QodanaScanOptions, QodanaScanResult, QodanaLinter, QodanaProject, QodanaReport, QodanaProblem, QodanaBaseline, QodanaLocalProblem } from './types.js';
export declare class QodanaClient {
    private config;
    constructor(config?: Partial<QodanaServerConfig>);
    /**
     * Find qodana CLI in PATH or common locations
     */
    private findCliPath;
    /**
     * Check if Qodana CLI is available
     */
    checkCliAvailable(): Promise<{
        available: boolean;
        version?: string;
        error?: string;
    }>;
    /**
     * Detect the appropriate linter for a project (returns first match)
     */
    detectLinter(projectDir: string): QodanaLinter | null;
    /**
     * Detect ALL languages/linters in a project
     */
    detectAllLinters(projectDir: string): Array<{
        linter: QodanaLinter;
        language: string;
        confidence: 'high' | 'medium';
    }>;
    /**
     * Run multi-linter scan for projects with multiple languages
     */
    multiScan(options: QodanaScanOptions & {
        linters?: QodanaLinter[];
    }): Promise<{
        success: boolean;
        scans: Array<{
            linter: QodanaLinter;
            language: string;
            success: boolean;
            summary?: {
                total: number;
                critical: number;
                high: number;
                moderate: number;
                low: number;
                info: number;
            };
            problems?: QodanaLocalProblem[];
            error?: string;
        }>;
        combinedSummary: {
            total: number;
            critical: number;
            high: number;
            moderate: number;
            low: number;
            info: number;
        };
        allProblems: QodanaLocalProblem[];
    }>;
    /**
     * Run Qodana scan using CLI
     */
    scan(options: QodanaScanOptions): Promise<QodanaScanResult>;
    /**
     * Parse SARIF results into our format
     */
    private parseSarifResults;
    /**
     * Map SARIF level to Qodana severity
     */
    private mapSarifLevel;
    /**
     * Get problems from a local results directory
     */
    getLocalProblems(resultsDir: string): Promise<QodanaLocalProblem[]>;
    /**
     * Create or update baseline from current results
     */
    createBaseline(resultsDir: string, baselinePath: string): Promise<{
        success: boolean;
        problemCount: number;
        error?: string;
    }>;
    /**
     * Create a hash for a problem (for baseline matching)
     */
    private hashProblem;
    /**
     * Check if Cloud API is configured
     */
    isCloudConfigured(): boolean;
    /**
     * Make authenticated API request to Qodana Cloud
     */
    private apiRequest;
    /**
     * List projects in Qodana Cloud
     */
    listProjects(): Promise<QodanaProject[]>;
    /**
     * Get project by ID
     */
    getProject(projectId: string): Promise<QodanaProject>;
    /**
     * List reports for a project
     */
    listReports(projectId: string, limit?: number): Promise<QodanaReport[]>;
    /**
     * Get report details
     */
    getReport(projectId: string, reportId: string): Promise<QodanaReport>;
    /**
     * Get problems from a Cloud report
     */
    getReportProblems(projectId: string, reportId: string, options?: {
        severity?: string;
        limit?: number;
        offset?: number;
    }): Promise<QodanaProblem[]>;
    /**
     * List baselines for a project
     */
    listBaselines(projectId: string): Promise<QodanaBaseline[]>;
}
//# sourceMappingURL=qodana-client.d.ts.map