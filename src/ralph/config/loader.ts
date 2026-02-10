/**
 * Ralph configuration loader.
 *
 * Following testability: dependency injection for file system access.
 * Following clarity: fail fast with clear errors.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { RalphConfig } from '../types.js';

/** Default config values */
const DEFAULTS: Required<RalphConfig['settings']> = {
  maxIterations: 50,
  maxIterationsPerItem: 10,
  exitOnIdleCommits: 3,
  checkpointEvery: 3,
};

/**
 * Load ralph-config.yaml from project directory.
 *
 * @param projectPath - Path to project root
 * @returns Parsed config with defaults applied
 * @throws Error if config file not found or invalid
 */
export function loadConfig(projectPath: string): RalphConfig {
  const configPath = path.join(projectPath, '.claude', 'ralph-config.yaml');

  let content: string;
  try {
    content = fs.readFileSync(configPath, 'utf-8');
  } catch {
    throw new Error(
      `Ralph config not found: ${configPath}\n` +
      `Run 'lens profile apply <profile>+ralph-integration' to set up.`
    );
  }
  const parsed = yaml.load(content) as Partial<RalphConfig>;

  return {
    skills: {
      plan: parsed.skills?.plan ?? [],
      build: parsed.skills?.build ?? [],
      refactor: parsed.skills?.refactor ?? [],
      test: parsed.skills?.test ?? [],
      review: parsed.skills?.review ?? [],
      doc: parsed.skills?.doc ?? [],
    },
    settings: {
      ...DEFAULTS,
      ...parsed.settings,
    },
  };
}

export function hasConfig(projectPath: string): boolean {
  const configPath = path.join(projectPath, '.claude', 'ralph-config.yaml');
  return fs.existsSync(configPath);
}

