/**
 * Profile management - create and apply configuration profiles
 *
 * Supports composable profiles that can be combined with + syntax:
 *   cc-config profile apply base-tech+javascript+react /path/to/project
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { homedir } from 'os';
import type { Profile, ComposableProfile, SkillLibraryPaths, SkillCategory, MCPServerCategory } from '../types.js';
import {
  getServer,
  isServerInstalled,
  installAndEnableServer,
  enableServer,
  disableServer,
  listServers,
  checkRequiredEnv
} from '../mcp/index.js';
import {
  copySkill,
  findSkillSourcePath,
  readManifest,
  writeManifest,
  createManifest,
  updateSkillInManifest,
  getGitCommit,
  getGitRemote,
  hashSkillDirectory,
  getCanonSourcePath
} from '../canon/index.js';
import {
  installAllWorkflowSkills
} from '../workflow/index.js';

const PROFILES_DIR = path.join(homedir(), '.claude', 'profiles');

/**
 * Skill library paths - where skills are stored by category
 */
const SKILL_LIBRARY_PATHS: SkillLibraryPaths = {
  security: path.join(homedir(), '.claude', 'skill-library', 'security'),
  tech: path.join(homedir(), '.claude', 'skill-library', 'tech'),
  canon: path.join(homedir(), 'local-tech-projects', 'canon-skills'),
  global: path.join(homedir(), '.claude', 'skills')
};

export function listProfiles(): ComposableProfile[] {
  if (!fs.existsSync(PROFILES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(PROFILES_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  const profiles: ComposableProfile[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(PROFILES_DIR, file), 'utf-8');
      const profile = parseYaml(content) as ComposableProfile;
      profiles.push(profile);
    } catch (error) {
      console.error(`Failed to parse profile: ${file}`, error);
    }
  }

  return profiles;
}

export function getProfile(name: string): ComposableProfile | null {
  const profiles = listProfiles();
  return profiles.find(p => p.name === name) || null;
}

/**
 * Parse profile string that may contain + for composition
 * Returns array of profile names: "base-tech+javascript+react" -> ["base-tech", "javascript", "react"]
 */
export function parseProfileString(profileString: string): string[] {
  return profileString.split('+').map(s => s.trim()).filter(Boolean);
}

/**
 * Combine multiple profiles into a single merged profile
 */
export function combineProfiles(profileNames: string[]): ComposableProfile | null {
  const profiles = profileNames.map(name => getProfile(name)).filter(Boolean) as ComposableProfile[];

  if (profiles.length === 0) {
    return null;
  }

  if (profiles.length === 1) {
    return profiles[0];
  }

  const combined: ComposableProfile = {
    name: profileNames.join(' + '),
    description: `Combined profile: ${profileNames.join(' + ')}`,
    composable: true,
    skills: {
      security: [],
      tech: [],
      canon: [],
      global: []
    },
    agents: [],
    commands: [],
    claudeMd: {
      standards: [],
      antiPatterns: [],
      autoInvoke: []
    }
  };

  for (const profile of profiles) {
    // Merge skills by category
    if (profile.skills) {
      for (const category of ['security', 'tech', 'canon', 'global'] as SkillCategory[]) {
        const skills = profile.skills[category];
        if (skills) {
          combined.skills![category] = [...new Set([...(combined.skills![category] || []), ...skills])];
        }
      }
    }

    // Merge agents
    if (profile.agents) {
      combined.agents = [...new Set([...(combined.agents || []), ...profile.agents])];
    }

    // Merge commands
    if (profile.commands) {
      combined.commands = [...new Set([...(combined.commands || []), ...profile.commands])];
    }

    // Merge standards
    if (profile.claudeMd?.standards) {
      combined.claudeMd!.standards = [...new Set([...(combined.claudeMd!.standards || []), ...profile.claudeMd.standards])];
    }

    // Merge anti-patterns
    if (profile.claudeMd?.antiPatterns) {
      combined.claudeMd!.antiPatterns = [...new Set([...(combined.claudeMd!.antiPatterns || []), ...profile.claudeMd.antiPatterns])];
    }

    // Merge auto-invoke rules
    if (profile.claudeMd?.autoInvoke) {
      combined.claudeMd!.autoInvoke = [...(combined.claudeMd!.autoInvoke || []), ...profile.claudeMd.autoInvoke];
    }

    // Merge MCP servers
    if (profile.mcpServers) {
      if (!combined.mcpServers) {
        combined.mcpServers = { enable: [], disable: [] };
      }
      if (profile.mcpServers.enable) {
        combined.mcpServers.enable = [...new Set([...combined.mcpServers.enable, ...profile.mcpServers.enable])];
      }
      if (profile.mcpServers.disable) {
        combined.mcpServers.disable = [...new Set([...combined.mcpServers.disable, ...profile.mcpServers.disable])];
      }
    }
  }

  return combined;
}

/**
 * Find the source path for a skill based on its category
 */
function findSkillPath(skillName: string, category: SkillCategory): string | null {
  const basePath = SKILL_LIBRARY_PATHS[category];

  // For canon skills, check subdirectories (javascript/, go/, etc.)
  if (category === 'canon') {
    const subdirs = ['javascript', 'typescript', 'go', 'java', 'python', 'security'];
    for (const subdir of subdirs) {
      const skillPath = path.join(basePath, subdir, skillName);
      if (fs.existsSync(skillPath)) {
        return skillPath;
      }
    }
    // Also check root of canon
    const rootPath = path.join(basePath, skillName);
    if (fs.existsSync(rootPath)) {
      return rootPath;
    }
    return null;
  }

  // For other categories, check directly
  const skillPath = path.join(basePath, skillName);
  if (fs.existsSync(skillPath)) {
    return skillPath;
  }

  return null;
}

export function saveProfile(profile: ComposableProfile): void {
  if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
  }

  const filename = profile.name.toLowerCase().replace(/\s+/g, '-') + '.yaml';
  const filepath = path.join(PROFILES_DIR, filename);
  const content = stringifyYaml(profile);

  fs.writeFileSync(filepath, content, 'utf-8');
}

/**
 * Apply a composable profile to a project
 * Copies skills (not symlinks) for portability, creates canon manifest
 */
export async function applyComposableProfile(profile: ComposableProfile, projectPath: string): Promise<ApplyResult> {
  const result: ApplyResult = {
    created: [],
    linked: [],  // Now "copied" but keeping API compatibility
    skipped: [],
    errors: []
  };

  const projectClaudePath = path.join(projectPath, '.claude');
  const globalClaudePath = path.join(homedir(), '.claude');

  // Ensure project .claude directory exists
  if (!fs.existsSync(projectClaudePath)) {
    fs.mkdirSync(projectClaudePath, { recursive: true });
    result.created.push(projectClaudePath);
  }

  // Apply skills by category - COPY instead of symlink for portability
  if (profile.skills) {
    const skillsDir = path.join(projectClaudePath, 'skills');
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    // Initialize or read existing manifest
    const canonPath = getCanonSourcePath();
    let manifest = readManifest(projectPath);
    if (!manifest) {
      manifest = createManifest({
        type: 'local',
        path: canonPath,
        gitRemote: getGitRemote(canonPath)
      });
    }

    for (const category of ['security', 'tech', 'canon', 'global'] as SkillCategory[]) {
      const skills = profile.skills[category];
      if (!skills) continue;

      for (const skillName of skills) {
        // Try canon module's findSkillSourcePath first, then fallback to category-based
        let sourcePath = findSkillSourcePath(skillName);
        if (!sourcePath) {
          sourcePath = findSkillPath(skillName, category);
        }
        const targetPath = path.join(skillsDir, skillName);

        if (!sourcePath) {
          result.errors.push(`Skill not found: ${skillName} (${category})`);
          continue;
        }

        if (fs.existsSync(targetPath)) {
          result.skipped.push(`${skillName} (already exists)`);
          continue;
        }

        try {
          // COPY the skill directory (not symlink) for portability
          copyDirectoryRecursive(sourcePath, targetPath);

          // Update manifest with skill info
          const hash = hashSkillDirectory(targetPath);
          const sourceCommit = getGitCommit(canonPath);

          updateSkillInManifest(manifest, skillName, {
            installedCommit: sourceCommit,
            installedAt: new Date().toISOString(),
            sourceFile: path.relative(canonPath, sourcePath) || skillName,
            hash,
            modified: false
          });

          result.linked.push(`${skillName} (copied from ${sourcePath})`);
        } catch (error) {
          result.errors.push(`Failed to copy skill ${skillName}: ${error}`);
        }
      }
    }

    // Write the updated manifest
    writeManifest(projectPath, manifest);
    result.created.push('.claude/canon-manifest.json');
  }

  // Install workflow skills (universal patterns for all projects)
  const workflowResult = installAllWorkflowSkills(projectPath, { force: false });
  if (workflowResult.installed.length > 0) {
    result.created.push(`Workflow skills: ${workflowResult.installed.join(', ')}`);
  }
  if (workflowResult.skipped.length > 0) {
    // Don't report "already installed" as skipped - that's expected
    const realSkips = workflowResult.skipped.filter(s => !s.includes('already installed'));
    if (realSkips.length > 0) {
      result.skipped.push(...realSkips);
    }
  }
  if (workflowResult.errors.length > 0) {
    result.errors.push(...workflowResult.errors);
  }

  // Apply commands
  if (profile.commands) {
    const commandsDir = path.join(projectClaudePath, 'commands');
    if (!fs.existsSync(commandsDir)) {
      fs.mkdirSync(commandsDir, { recursive: true });
    }

    for (const cmdPattern of profile.commands) {
      // Handle glob patterns like "viz/*"
      const [cmdName] = cmdPattern.split('/');
      const globalCmdPath = path.join(globalClaudePath, 'commands', cmdName);

      if (fs.existsSync(globalCmdPath)) {
        const targetPath = path.join(commandsDir, cmdName);

        if (!fs.existsSync(targetPath)) {
          try {
            fs.symlinkSync(globalCmdPath, targetPath);
            result.linked.push(`command:${cmdName} → ${globalCmdPath}`);
          } catch (error) {
            result.errors.push(`Failed to link command ${cmdName}: ${error}`);
          }
        } else {
          result.skipped.push(`command:${cmdName} (already exists)`);
        }
      }
    }
  }

  // Apply agents (agents are built-in, just note them)
  if (profile.agents && profile.agents.length > 0) {
    result.created.push(`Agents enabled: ${profile.agents.join(', ')}`);
  }

  // Update CLAUDE.md with auto-invoke rules and profile info
  if (profile.claudeMd?.autoInvoke) {
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    await updateClaudeMdWithProfile(claudeMdPath, profile);
    result.created.push('Updated CLAUDE.md with profile info and auto-invoke rules');
  }

  // Handle MCP servers
  if (profile.mcpServers) {
    const mcpResult = await applyMcpServers(profile.mcpServers);
    result.created.push(...mcpResult.created);
    result.skipped.push(...mcpResult.skipped);
    result.errors.push(...mcpResult.errors);
  }

  return result;
}

/**
 * Apply MCP server configuration from a profile
 */
async function applyMcpServers(mcpConfig: {
  enable?: string[];
  disable?: string[];
  categories?: MCPServerCategory[];
  requireAll?: boolean;
}): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const result = { created: [] as string[], skipped: [] as string[], errors: [] as string[] };

  // Build list of servers to enable
  const serversToEnable = new Set<string>(mcpConfig.enable || []);

  // Add servers from categories
  if (mcpConfig.categories) {
    for (const category of mcpConfig.categories) {
      const categoryServers = listServers({ category });
      for (const server of categoryServers) {
        serversToEnable.add(server.name);
      }
    }
  }

  // Remove disabled servers from the enable list
  if (mcpConfig.disable) {
    for (const server of mcpConfig.disable) {
      serversToEnable.delete(server);
    }
  }

  // Process each server
  for (const serverName of serversToEnable) {
    // Check if in registry
    const serverDef = getServer(serverName);

    if (!serverDef) {
      if (mcpConfig.requireAll) {
        result.errors.push(`MCP server not found in registry: ${serverName}`);
      } else {
        result.skipped.push(`MCP server ${serverName} not in registry (skipping)`);
      }
      continue;
    }

    // Check required env vars
    if (serverDef.requiredEnv && serverDef.requiredEnv.length > 0) {
      const envCheck = checkRequiredEnv(serverDef);
      if (!envCheck.ok) {
        if (mcpConfig.requireAll) {
          result.errors.push(`MCP server ${serverName} requires: ${envCheck.missing.join(', ')}`);
        } else {
          result.skipped.push(`MCP server ${serverName} requires ${envCheck.missing.join(', ')} - set env vars to enable`);
        }
        continue;
      }
    }

    // Check if already installed
    if (isServerInstalled(serverName)) {
      const enableResult = enableServer(serverName);
      if (enableResult.success) {
        result.created.push(`MCP server ${serverName}: enabled`);
      } else {
        result.skipped.push(`MCP server ${serverName}: ${enableResult.message}`);
      }
    } else {
      // Install and enable
      const installResult = installAndEnableServer(serverName);
      if (installResult.success) {
        result.created.push(`MCP server ${serverName}: installed and enabled`);
      } else {
        result.errors.push(`MCP server ${serverName}: ${installResult.message}`);
      }
    }
  }

  // Handle explicit disables
  if (mcpConfig.disable) {
    for (const serverName of mcpConfig.disable) {
      const disableResult = disableServer(serverName);
      if (disableResult.success && !disableResult.warnings?.length) {
        result.created.push(`MCP server ${serverName}: disabled`);
      }
    }
  }

  return result;
}

/**
 * Legacy applyProfile for backwards compatibility
 */
export async function applyProfile(profile: Profile, projectPath: string): Promise<ApplyResult> {
  // Convert legacy profile to composable format
  const composable: ComposableProfile = {
    name: profile.name,
    description: profile.description,
    skills: {
      global: profile.skills?.include || []
    },
    agents: profile.agents?.include,
    commands: profile.commands?.include,
    claudeMd: profile.claudeMd,
    mcpServers: profile.mcpServers
  };

  return applyComposableProfile(composable, projectPath);
}

/**
 * Update CLAUDE.md with profile info, standards, anti-patterns, and auto-invoke rules
 */
async function updateClaudeMdWithProfile(
  claudeMdPath: string,
  profile: ComposableProfile
): Promise<void> {
  let content = '';

  if (fs.existsSync(claudeMdPath)) {
    content = fs.readFileSync(claudeMdPath, 'utf-8');
  }

  // Build profile section
  let newSections = `## Profiles Applied

\`${profile.name}\`
`;

  // Add standards section if present
  if (profile.claudeMd?.standards && profile.claudeMd.standards.length > 0) {
    newSections += `
## Standards

${profile.claudeMd.standards.map(s => `- ${s}`).join('\n')}
`;
  }

  // Add anti-patterns section if present
  if (profile.claudeMd?.antiPatterns && profile.claudeMd.antiPatterns.length > 0) {
    newSections += `
## Anti-Patterns (Avoid)

${profile.claudeMd.antiPatterns.map(p => `- ${p}`).join('\n')}
`;
  }

  // Add auto-invoke table
  if (profile.claudeMd?.autoInvoke && profile.claudeMd.autoInvoke.length > 0) {
    const autoInvokeTable = profile.claudeMd.autoInvoke.map(ai => `| ${ai.context} | ${ai.action} |`).join('\n');
    newSections += `
## Auto-Invoke Skills

| Context | Action |
|---------|--------|
${autoInvokeTable}
`;
  }

  // Remove existing sections if they exist
  content = content.replace(/## Profiles Applied[\s\S]*?(?=\n## [^A]|\n# |$)/g, '');
  content = content.replace(/## Standards[\s\S]*?(?=\n## |\n# |$)/g, '');
  content = content.replace(/## Anti-Patterns[\s\S]*?(?=\n## |\n# |$)/g, '');
  content = content.replace(/## Auto-Invoke[\s\S]*?(?=\n## |\n# |$)/g, '');

  // Clean up any double newlines that might have been created
  content = content.replace(/\n{3,}/g, '\n\n').trim();

  // Find first heading and insert after it
  const firstHeadingMatch = content.match(/^#[^#].*\n/m);
  if (firstHeadingMatch) {
    const insertPos = (firstHeadingMatch.index ?? 0) + firstHeadingMatch[0].length;
    content = content.slice(0, insertPos) + '\n' + newSections + '\n' + content.slice(insertPos).trim();
  } else {
    content = newSections + '\n' + content;
  }

  fs.writeFileSync(claudeMdPath, content.trim() + '\n', 'utf-8');
}

/**
 * Legacy: Update only auto-invoke section (for backwards compatibility)
 */
async function updateClaudeMdAutoInvoke(
  claudeMdPath: string,
  autoInvoke: Array<{ context: string; action: string }>
): Promise<void> {
  let content = '';

  if (fs.existsSync(claudeMdPath)) {
    content = fs.readFileSync(claudeMdPath, 'utf-8');
  }

  // Check if auto-invoke section exists
  const autoInvokeSection = `## Auto-Invoke Skills

| Context | Action |
|---------|--------|
${autoInvoke.map(ai => `| ${ai.context} | ${ai.action} |`).join('\n')}
`;

  if (content.includes('## Auto-Invoke')) {
    // Replace existing section
    content = content.replace(
      /## Auto-Invoke.*?(?=\n## |\n# |$)/s,
      autoInvokeSection
    );
  } else {
    // Add new section
    content = content.trim() + '\n\n' + autoInvokeSection;
  }

  fs.writeFileSync(claudeMdPath, content, 'utf-8');
}

export interface ApplyResult {
  created: string[];
  linked: string[];
  skipped: string[];
  errors: string[];
}

// Example composable profile template
export const exampleComposableProfile: ComposableProfile = {
  name: 'example',
  description: 'Example composable profile',
  composable: true,
  skills: {
    security: ['security-mindset', 'owasp'],
    tech: ['ceremony'],
    canon: ['abramov', 'dodds']
  },
  agents: ['css-expert', 'code-reviewer'],
  commands: ['viz/*'],
  claudeMd: {
    autoInvoke: [
      { context: 'React components, hooks', action: 'INVOKE `/abramov`' },
      { context: 'Writing or reviewing tests', action: 'INVOKE `/dodds`' }
    ]
  }
};

// Legacy example profile (for backwards compatibility)
export const exampleProfile: Profile = {
  name: 'D3 Development',
  description: 'Full D3/visualization development environment',
  skills: {
    include: ['bostock', 'abramov', 'dodds', 'osmani', 'cherny'],
    exclude: []
  },
  commands: {
    include: ['viz/*', 'd3/*'],
    exclude: []
  },
  agents: {
    include: ['css-expert', 'accessibility-tester'],
    exclude: []
  },
  claudeMd: {
    autoInvoke: [
      { context: 'D3.js or data visualization', action: 'INVOKE `/bostock`' },
      { context: 'React/JSX/TSX files', action: 'INVOKE `/abramov`' },
      { context: 'Writing or reviewing tests', action: 'INVOKE `/dodds`' }
    ]
  },
  mcpServers: {
    enable: ['linear'],
    disable: []
  }
};

/**
 * Recursively copy a directory
 */
function copyDirectoryRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Get skill library paths configuration
 */
export function getSkillLibraryPaths(): SkillLibraryPaths {
  return { ...SKILL_LIBRARY_PATHS };
}
