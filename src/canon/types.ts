/**
 * Types for the canon skill copy-with-manifest system
 */

export interface CanonSource {
  type: 'local' | 'git';
  path: string;
  gitRemote?: string;
}

export interface InstalledSkillInfo {
  installedCommit?: string;
  installedAt: string;
  sourceFile: string;
  hash: string;
  modified: boolean;
}

export interface CanonManifest {
  source: CanonSource;
  installedAt: string;
  sourceCommit?: string;
  skills: Record<string, InstalledSkillInfo>;
}

export type SkillStatus = 'current' | 'outdated' | 'modified' | 'missing' | 'unknown';

export interface SkillStatusInfo {
  name: string;
  status: SkillStatus;
  installedHash?: string;
  sourceHash?: string;
  installedCommit?: string;
  sourceCommit?: string;
  installedAt?: string;
  sourcePath?: string;
}

export interface CanonUpgradeResult {
  upgraded: string[];
  skipped: string[];
  errors: string[];
}

export interface CanonListItem {
  name: string;
  path: string;
  category?: string;
}
