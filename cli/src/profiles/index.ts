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
import type { Profile, ComposableProfile, SkillLibraryPaths, SkillCategory } from '../types.js';

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
 * Handles skill categories and creates symlinks from appropriate library paths
 */
export async function applyComposableProfile(profile: ComposableProfile, projectPath: string): Promise<ApplyResult> {
  const result: ApplyResult = {
    created: [],
    linked: [],
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

  // Apply skills by category
  if (profile.skills) {
    const skillsDir = path.join(projectClaudePath, 'skills');
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    for (const category of ['security', 'tech', 'canon', 'global'] as SkillCategory[]) {
      const skills = profile.skills[category];
      if (!skills) continue;

      for (const skillName of skills) {
        const sourcePath = findSkillPath(skillName, category);
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
          // Get the real path if it's a symlink
          const realPath = fs.realpathSync(sourcePath);
          fs.symlinkSync(realPath, targetPath);
          result.linked.push(`${skillName} → ${realPath}`);
        } catch (error) {
          result.errors.push(`Failed to link skill ${skillName}: ${error}`);
        }
      }
    }
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
 * Update CLAUDE.md with profile info and auto-invoke rules
 */
async function updateClaudeMdWithProfile(
  claudeMdPath: string,
  profile: ComposableProfile
): Promise<void> {
  let content = '';

  if (fs.existsSync(claudeMdPath)) {
    content = fs.readFileSync(claudeMdPath, 'utf-8');
  }

  // Build the new sections
  const autoInvokeTable = profile.claudeMd?.autoInvoke?.map(ai => `| ${ai.context} | ${ai.action} |`).join('\n') || '';

  const newSections = `## Profiles Applied

\`${profile.name}\`

## Auto-Invoke Skills

| Context | Action |
|---------|--------|
${autoInvokeTable}
`;

  // Remove existing sections if they exist
  content = content.replace(/## Profiles Applied[\s\S]*?(?=\n## [^A]|\n# |$)/g, '');
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
 * Get skill library paths configuration
 */
export function getSkillLibraryPaths(): SkillLibraryPaths {
  return { ...SKILL_LIBRARY_PATHS };
}
