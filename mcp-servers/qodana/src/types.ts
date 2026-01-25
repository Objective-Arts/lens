/**
 * Qodana API and CLI types
 */

// Qodana Cloud API types
export interface QodanaProject {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QodanaReport {
  id: string;
  projectId: string;
  branch: string;
  revision: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  totalProblems: number;
  criticalProblems: number;
  highProblems: number;
  moderateProblems: number;
  lowProblems: number;
  infoProblems: number;
}

export interface QodanaProblem {
  id: string;
  reportId: string;
  inspectionId: string;
  inspectionName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';
  category: string;
  message: string;
  file: string;
  line: number;
  column?: number;
  snippet?: string;
  suggestionFix?: string;
}

export interface QodanaInspection {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  enabled: boolean;
}

export interface QodanaBaseline {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  problemCount: number;
  createdAt: string;
}

// CLI execution types
export interface QodanaScanOptions {
  projectDir: string;
  linter?: QodanaLinter;
  resultsDir?: string;
  reportDir?: string;
  cacheDir?: string;
  baseline?: string;
  baselineIncludeAbsent?: boolean;
  failThreshold?: 'any' | 'critical' | 'high' | 'moderate' | 'low' | 'none';
  profileName?: string;
  profilePath?: string;
  disableSanity?: boolean;
  sourceDirectory?: string;
  changes?: boolean;
  script?: 'default' | 'php-migration';
  env?: Record<string, string>;
}

export type QodanaLinter =
  | 'qodana-jvm-community'
  | 'qodana-jvm'
  | 'qodana-jvm-android'
  | 'qodana-php'
  | 'qodana-python-community'
  | 'qodana-python'
  | 'qodana-js'
  | 'qodana-dotnet'
  | 'qodana-go'
  | 'qodana-rust'
  | 'qodana-cpp'
  | 'qodana-ruby';

export interface QodanaScanResult {
  success: boolean;
  exitCode: number;
  reportPath?: string;
  resultsPath?: string;
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
}

export interface QodanaLocalProblem {
  tool: string;
  category: string;
  type: string;
  severity: string;
  comment: string;
  detailsInfo: string;
  sources: Array<{
    file: string;
    line: number;
    column: number;
    length: number;
    offset: number;
    message: string;
  }>;
}

// SARIF format (Qodana outputs SARIF)
export interface SarifLog {
  version: string;
  $schema: string;
  runs: SarifRun[];
}

export interface SarifRun {
  tool: {
    driver: {
      name: string;
      version: string;
      rules: SarifRule[];
    };
  };
  results: SarifResult[];
}

export interface SarifRule {
  id: string;
  name: string;
  shortDescription: { text: string };
  fullDescription?: { text: string };
  defaultConfiguration?: {
    level: 'error' | 'warning' | 'note' | 'none';
  };
}

export interface SarifResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note' | 'none';
  message: { text: string };
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region?: {
        startLine: number;
        startColumn?: number;
        endLine?: number;
        endColumn?: number;
        snippet?: { text: string };
      };
    };
  }>;
  fixes?: Array<{
    description: { text: string };
    artifactChanges: Array<{
      artifactLocation: { uri: string };
      replacements: Array<{
        deletedRegion: { startLine: number; endLine: number };
        insertedContent: { text: string };
      }>;
    }>;
  }>;
}

// Server configuration
export interface QodanaServerConfig {
  cloudApiUrl: string;
  cloudToken?: string;
  cliPath?: string;
  defaultLinter?: QodanaLinter;
  defaultResultsDir?: string;
}
