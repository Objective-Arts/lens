/**
 * Workflow Skills Types
 *
 * Workflow skills are universal workflow patterns (not domain canon)
 * that apply across all projects.
 */

/**
 * Metadata about the workflow skills source
 */
export interface WorkflowSource {
  type: 'local' | 'git' | 'url';
  path: string;
  gitRemote?: string;
}

/**
 * Information about an installed workflow skill
 */
export interface InstalledWorkflowInfo {
  installedAt: string;
  sourceFile: string;
  hash: string;
  modified: boolean;
  installedCommit?: string;
}

/**
 * Manifest tracking workflow skills in a project
 */
export interface WorkflowManifest {
  source: WorkflowSource;
  installedAt: string;
  sourceCommit?: string;
  skills: Record<string, InstalledWorkflowInfo>;
  scriptHash?: string;
}

/**
 * Status of a workflow skill
 */
export type WorkflowSkillStatus = 'current' | 'outdated' | 'modified' | 'missing' | 'unknown';

/**
 * Info about a workflow skill's status
 */
export interface WorkflowStatusInfo {
  name: string;
  status: WorkflowSkillStatus;
  installedCommit?: string;
  sourceCommit?: string;
  modified?: boolean;
}

/**
 * Info about an available workflow skill
 */
export interface WorkflowSkillInfo {
  name: string;
  path: string;
  description?: string;
}
