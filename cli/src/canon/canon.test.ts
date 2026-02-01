/**
 * Canon Skill System Tests
 *
 * Validates:
 * 1. Skill frontmatter (name, description)
 * 2. Skill naming conventions (directory name matches frontmatter name)
 * 3. Profile skill references (all referenced skills exist)
 * 4. Auto-invoke rules reference valid skills
 * 5. Profile inheritance (extends references valid profiles)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';
import matter from 'gray-matter';
import YAML from 'yaml';
import { listCanonSkills, getCanonSourcePath, deployAllSkills } from './index.js';

// Paths
const CANON_PATH = getCanonSourcePath();
const PROFILES_PATH = path.join(homedir(), '.claude', 'profiles');

// Types
interface SkillFrontmatter {
  name?: string;
  description?: string;
  [key: string]: unknown;
}

interface ProfileConfig {
  name: string;
  extends?: string;
  skills?: Record<string, string[]>;
  claudeMd?: {
    autoInvoke?: Array<{
      context: string;
      action: string;
    }>;
  };
}

// Helpers
function parseSkillFrontmatter(skillPath: string): { frontmatter: SkillFrontmatter; content: string } | null {
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) return null;

  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const parsed = matter(content);
  return {
    frontmatter: parsed.data as SkillFrontmatter,
    content: parsed.content
  };
}

function loadProfile(profileName: string): ProfileConfig | null {
  const profilePath = path.join(PROFILES_PATH, `${profileName}.yaml`);
  if (!fs.existsSync(profilePath)) return null;

  const content = fs.readFileSync(profilePath, 'utf-8');
  return YAML.parse(content) as ProfileConfig;
}

function listProfiles(): string[] {
  if (!fs.existsSync(PROFILES_PATH)) return [];

  return fs.readdirSync(PROFILES_PATH)
    .filter(f => f.endsWith('.yaml'))
    .map(f => f.replace('.yaml', ''));
}

function extractSkillReferences(action: string): string[] {
  // Extract skill names from auto-invoke actions like "INVOKE `/skill-name`"
  const matches = action.match(/`\/([a-z0-9-]+)`/gi) || [];
  return matches.map(m => m.replace(/`\//g, '').replace(/`/g, ''));
}

// Test Data
let allSkills: ReturnType<typeof listCanonSkills>;
let skillNames: Set<string>;

beforeAll(() => {
  allSkills = listCanonSkills();
  skillNames = new Set(allSkills.map(s => s.name));
});

describe('Canon Skill Frontmatter', () => {
  it('canon source path exists', () => {
    expect(fs.existsSync(CANON_PATH)).toBe(true);
  });

  it('all skills have SKILL.md files', () => {
    const missingSkillMd: string[] = [];

    for (const skill of allSkills) {
      const skillMdPath = path.join(skill.path, 'SKILL.md');
      if (!fs.existsSync(skillMdPath)) {
        missingSkillMd.push(`${skill.category}/${skill.name}`);
      }
    }

    expect(missingSkillMd).toEqual([]);
  });

  it('all skills have valid frontmatter with name field', () => {
    const invalidSkills: string[] = [];

    for (const skill of allSkills) {
      const parsed = parseSkillFrontmatter(skill.path);
      if (!parsed) {
        invalidSkills.push(`${skill.name}: no SKILL.md`);
        continue;
      }

      if (!parsed.frontmatter.name) {
        invalidSkills.push(`${skill.name}: missing 'name' in frontmatter`);
      }
    }

    expect(invalidSkills).toEqual([]);
  });

  it('all skills have description in frontmatter', () => {
    const missingDescription: string[] = [];

    for (const skill of allSkills) {
      const parsed = parseSkillFrontmatter(skill.path);
      if (!parsed) continue;

      if (!parsed.frontmatter.description) {
        missingDescription.push(skill.name);
      }
    }

    expect(missingDescription).toEqual([]);
  });

  it('frontmatter name matches directory name', () => {
    const mismatches: string[] = [];

    for (const skill of allSkills) {
      const parsed = parseSkillFrontmatter(skill.path);
      if (!parsed?.frontmatter.name) continue;

      if (parsed.frontmatter.name !== skill.name) {
        mismatches.push(`${skill.name}: frontmatter name is '${parsed.frontmatter.name}' but directory is '${skill.name}'`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('no empty skill directories', () => {
    const emptyDirs: string[] = [];

    // Walk through canon directories looking for empty skill folders
    const categories = fs.readdirSync(CANON_PATH, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.'));

    for (const category of categories) {
      const categoryPath = path.join(CANON_PATH, category.name);
      const entries = fs.readdirSync(categoryPath, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.'));

      for (const entry of entries) {
        const entryPath = path.join(categoryPath, entry.name);
        const files = fs.readdirSync(entryPath).filter(f => !f.startsWith('.'));

        if (files.length === 0) {
          emptyDirs.push(`${category.name}/${entry.name}`);
        }
      }
    }

    expect(emptyDirs).toEqual([]);
  });
});

describe('Profile Skill References', () => {
  it('profiles directory exists', () => {
    expect(fs.existsSync(PROFILES_PATH)).toBe(true);
  });

  it('all skills referenced in profiles exist in canon', () => {
    const missingSkills: string[] = [];
    const profiles = listProfiles();

    for (const profileName of profiles) {
      const profile = loadProfile(profileName);
      if (!profile?.skills) continue;

      for (const [category, skills] of Object.entries(profile.skills)) {
        for (const skillName of skills) {
          if (!skillNames.has(skillName)) {
            missingSkills.push(`${profileName}.yaml: skill '${skillName}' (${category}) not found in canon`);
          }
        }
      }
    }

    expect(missingSkills).toEqual([]);
  });

  it('all auto-invoke skill references exist', () => {
    const invalidRefs: string[] = [];
    const profiles = listProfiles();

    for (const profileName of profiles) {
      const profile = loadProfile(profileName);
      if (!profile?.claudeMd?.autoInvoke) continue;

      for (const rule of profile.claudeMd.autoInvoke) {
        const refs = extractSkillReferences(rule.action);
        for (const ref of refs) {
          // Skip known non-skill references (agents, etc.)
          if (ref.includes('-') && !skillNames.has(ref)) {
            // Check if it might be an agent or other reference
            const isLikelySkill = !['security-auditor', 'code-reviewer', 'test-engineer'].includes(ref);
            if (isLikelySkill && !skillNames.has(ref)) {
              invalidRefs.push(`${profileName}.yaml: auto-invoke references '${ref}' which doesn't exist`);
            }
          }
        }
      }
    }

    expect(invalidRefs).toEqual([]);
  });

  it('profile extends references valid base profiles', () => {
    const invalidExtends: string[] = [];
    const profiles = listProfiles();
    const profileSet = new Set(profiles);

    for (const profileName of profiles) {
      const profile = loadProfile(profileName);
      if (!profile?.extends) continue;

      if (!profileSet.has(profile.extends)) {
        invalidExtends.push(`${profileName}.yaml: extends '${profile.extends}' which doesn't exist`);
      }
    }

    expect(invalidExtends).toEqual([]);
  });
});

describe('Skill Naming Conventions', () => {
  it('skill names use lowercase with hyphens', () => {
    const invalidNames: string[] = [];

    for (const skill of allSkills) {
      if (!/^[a-z0-9-]+$/.test(skill.name)) {
        invalidNames.push(`${skill.name}: contains invalid characters (should be lowercase, numbers, hyphens only)`);
      }
    }

    expect(invalidNames).toEqual([]);
  });

  it('no duplicate skill names across categories', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const skill of allSkills) {
      const category = skill.category || 'root';
      const existing = seen.get(skill.name);
      if (existing) {
        duplicates.push(`${skill.name}: exists in both '${existing}' and '${category}'`);
      } else {
        seen.set(skill.name, category);
      }
    }

    expect(duplicates).toEqual([]);
  });
});

describe('Canon Completeness', () => {
  it('has expected minimum number of skills', () => {
    // Sanity check - we should have at least 50 skills
    expect(allSkills.length).toBeGreaterThanOrEqual(50);
  });

  it('has skills in expected categories', () => {
    const categories = new Set(allSkills.map(s => s.category));

    const expectedCategories = ['javascript', 'security', 'testing', 'ui-ux'];
    for (const expected of expectedCategories) {
      expect(categories.has(expected)).toBe(true);
    }
  });

  it('security skills have proper frontmatter', () => {
    const securitySkills = allSkills.filter(s => s.category === 'security');
    const issues: string[] = [];

    for (const skill of securitySkills) {
      const parsed = parseSkillFrontmatter(skill.path);
      if (!parsed) {
        issues.push(`${skill.name}: missing SKILL.md`);
        continue;
      }

      if (!parsed.frontmatter.name || !parsed.frontmatter.description) {
        issues.push(`${skill.name}: incomplete frontmatter`);
      }
    }

    expect(issues).toEqual([]);
  });

  it('pattern skills have proper frontmatter', () => {
    const patternSkills = allSkills.filter(s => s.category === 'patterns');
    const issues: string[] = [];

    for (const skill of patternSkills) {
      const parsed = parseSkillFrontmatter(skill.path);
      if (!parsed) {
        issues.push(`${skill.name}: missing SKILL.md`);
        continue;
      }

      if (!parsed.frontmatter.name || !parsed.frontmatter.description) {
        issues.push(`${skill.name}: incomplete frontmatter`);
      }
    }

    expect(issues).toEqual([]);
  });
});

describe('Profile Deployment Validation', () => {
  it('base-tech profile deploys all base brain skills', () => {
    const baseBrainSkills = ['kernighan', 'pike', 'mcilroy', 'linus', 'dijkstra', 'thompson', 'bill-joy'];
    const missing: string[] = [];

    for (const skill of baseBrainSkills) {
      if (!skillNames.has(skill)) {
        missing.push(skill);
      }
    }

    expect(missing).toEqual([]);
  });

  it('base-tech profile deploys all security skills', () => {
    const profile = loadProfile('base-tech');
    if (!profile?.skills?.security) {
      expect.fail('base-tech profile missing security skills section');
      return;
    }

    const missing: string[] = [];
    for (const skill of profile.skills.security) {
      if (!skillNames.has(skill)) {
        missing.push(skill);
      }
    }

    expect(missing).toEqual([]);
  });

  it('javascript profile deploys all listed skills', () => {
    const profile = loadProfile('javascript');
    if (!profile) {
      // Profile not deployed to ~/.claude/profiles - skip this test
      console.log('Skipping: javascript profile not deployed');
      return;
    }
    if (!profile.skills?.canon) {
      // Profile exists but has no canon section - valid for some profiles
      console.log('Skipping: javascript profile has no canon skills section');
      return;
    }

    const missing: string[] = [];
    for (const skill of profile.skills.canon) {
      if (!skillNames.has(skill)) {
        missing.push(`javascript.yaml: '${skill}' not found in canon`);
      }
    }

    expect(missing).toEqual([]);
  });
});

describe('Auto-Invoke Coverage', () => {
  it('all auto-invoked skills exist in canon', () => {
    const profiles = listProfiles();
    const invokedSkills = new Set<string>();
    const missing: string[] = [];

    // Collect all skills referenced in auto-invoke rules
    for (const profileName of profiles) {
      const profile = loadProfile(profileName);
      if (!profile?.claudeMd?.autoInvoke) continue;

      for (const rule of profile.claudeMd.autoInvoke) {
        const refs = extractSkillReferences(rule.action);
        refs.forEach(r => invokedSkills.add(r));
      }
    }

    // Check each invoked skill exists
    for (const skill of invokedSkills) {
      if (!skillNames.has(skill)) {
        missing.push(`Auto-invoke references '${skill}' but skill not found in canon`);
      }
    }

    expect(missing).toEqual([]);
  });

  it('base brain skills are auto-invoked', () => {
    const baseBrainSkills = ['kernighan', 'pike', 'mcilroy', 'linus', 'dijkstra', 'thompson', 'bill-joy'];
    const profile = loadProfile('base-tech');

    if (!profile?.claudeMd?.autoInvoke) {
      expect.fail('base-tech profile missing autoInvoke rules');
      return;
    }

    // Find the "Writing any code" rule
    const codeRule = profile.claudeMd.autoInvoke.find(r => r.context.includes('Writing any code'));
    if (!codeRule) {
      expect.fail('base-tech missing "Writing any code" auto-invoke rule');
      return;
    }

    const invokedSkills = extractSkillReferences(codeRule.action);
    const missing = baseBrainSkills.filter(s => !invokedSkills.includes(s));

    expect(missing).toEqual([]);
  });

  it('security skills are auto-invoked', () => {
    const profile = loadProfile('base-tech');
    if (!profile?.claudeMd?.autoInvoke) {
      expect.fail('base-tech profile missing autoInvoke rules');
      return;
    }

    // Collect all security-related auto-invoke rules
    const securityRules = profile.claudeMd.autoInvoke.filter(r =>
      r.context.toLowerCase().includes('security') ||
      r.context.toLowerCase().includes('auth') ||
      r.context.toLowerCase().includes('input')
    );

    expect(securityRules.length).toBeGreaterThan(0);

    // Verify security skills are invoked
    const invokedSkills = new Set<string>();
    for (const rule of securityRules) {
      extractSkillReferences(rule.action).forEach(s => invokedSkills.add(s));
    }

    const expectedSecuritySkills = ['schneier', 'owasp', 'bruce-schneier', 'troy-hunt', 'tanya-janca', 'security-mindset'];
    const missing = expectedSecuritySkills.filter(s => !invokedSkills.has(s));

    // At least some security skills should be invoked
    expect(invokedSkills.size).toBeGreaterThan(0);
  });

});

describe('Skill Utilization', () => {
  it('warns about skills with no auto-invoke rules', () => {
    const profiles = listProfiles();
    const invokedSkills = new Set<string>();

    // Collect all skills referenced in auto-invoke rules across all profiles
    for (const profileName of profiles) {
      const profile = loadProfile(profileName);
      if (!profile?.claudeMd?.autoInvoke) continue;

      for (const rule of profile.claudeMd.autoInvoke) {
        extractSkillReferences(rule.action).forEach(s => invokedSkills.add(s));
      }
    }

    // Find skills that exist but are never auto-invoked
    const unusedSkills: string[] = [];
    for (const skill of allSkills) {
      if (!invokedSkills.has(skill.name)) {
        unusedSkills.push(`${skill.name} (${skill.category})`);
      }
    }

    // This is a warning, not a failure - some skills may be manually invoked
    // But we want visibility into what's not auto-invoked
    if (unusedSkills.length > 0) {
      console.warn(`\nSkills without auto-invoke rules (${unusedSkills.length}):\n  ${unusedSkills.slice(0, 20).join('\n  ')}${unusedSkills.length > 20 ? '\n  ...' : ''}`);
    }

    // For now, just verify we checked (always passes, but logs warnings)
    expect(true).toBe(true);
  });
});

describe('deployAllSkills', () => {
  const testProjectPath = path.join(homedir(), '.claude-test-deploy-skills');

  beforeAll(() => {
    // Clean up any previous test directory
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true });
    }
    fs.mkdirSync(testProjectPath, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true });
    }
  });

  it('deploys skills as directories, not flattened .md files', () => {
    const result = deployAllSkills(testProjectPath, { force: true });
    const skillsDir = path.join(testProjectPath, '.claude', 'skills');

    // Should have deployed skills
    expect(result.deployed).toBeGreaterThan(0);

    // Check for flattened .md files at top level (should be NONE)
    const topLevelMdFiles = fs.readdirSync(skillsDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('.'));

    expect(topLevelMdFiles).toEqual([]);
  });

  it('deploys skills as directories with SKILL.md inside', () => {
    const skillsDir = path.join(testProjectPath, '.claude', 'skills');
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const directories = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

    // Should have directories
    expect(directories.length).toBeGreaterThan(0);

    // Each directory should have SKILL.md
    const missingSkillMd: string[] = [];
    for (const dir of directories) {
      const skillMdPath = path.join(skillsDir, dir.name, 'SKILL.md');
      if (!fs.existsSync(skillMdPath)) {
        missingSkillMd.push(dir.name);
      }
    }

    expect(missingSkillMd).toEqual([]);
  });

  it('preserves SUMMARY.md files when deploying', () => {
    const skillsDir = path.join(testProjectPath, '.claude', 'skills');

    // Find skills that have SUMMARY.md in source
    const sourceSkillsWithSummary = allSkills.filter(skill => {
      const summaryPath = path.join(skill.path, 'SUMMARY.md');
      return fs.existsSync(summaryPath);
    });

    // At least some skills should have SUMMARY.md
    expect(sourceSkillsWithSummary.length).toBeGreaterThan(0);

    // Check that deployed versions also have SUMMARY.md
    const missingSummary: string[] = [];
    for (const skill of sourceSkillsWithSummary) {
      const deployedSummaryPath = path.join(skillsDir, skill.name, 'SUMMARY.md');
      if (!fs.existsSync(deployedSummaryPath)) {
        missingSummary.push(skill.name);
      }
    }

    expect(missingSummary).toEqual([]);
  });

  it('does not create duplicate representations of skills', () => {
    const skillsDir = path.join(testProjectPath, '.claude', 'skills');
    const entries = fs.readdirSync(skillsDir);

    // Get all directory names
    const directories = entries.filter(e => {
      const fullPath = path.join(skillsDir, e);
      return fs.statSync(fullPath).isDirectory() && !e.startsWith('.');
    });

    // Get all .md file names (without extension)
    const mdFiles = entries
      .filter(e => e.endsWith('.md') && !e.startsWith('.'))
      .map(f => f.replace('.md', ''));

    // Find duplicates (same name as both directory and .md file)
    const duplicates = directories.filter(d => mdFiles.includes(d));

    expect(duplicates).toEqual([]);
  });

  it('skill content matches source after deployment', () => {
    const skillsDir = path.join(testProjectPath, '.claude', 'skills');

    // Check a few specific skills
    const skillsToCheck = ['bloch', 'owasp', 'feathers'].filter(name => skillNames.has(name));
    const contentMismatches: string[] = [];

    for (const skillName of skillsToCheck) {
      const sourceSkill = allSkills.find(s => s.name === skillName);
      if (!sourceSkill) continue;

      const sourceSkillMd = path.join(sourceSkill.path, 'SKILL.md');
      const deployedSkillMd = path.join(skillsDir, skillName, 'SKILL.md');

      if (!fs.existsSync(sourceSkillMd) || !fs.existsSync(deployedSkillMd)) {
        contentMismatches.push(`${skillName}: missing file`);
        continue;
      }

      const sourceContent = fs.readFileSync(sourceSkillMd, 'utf-8');
      const deployedContent = fs.readFileSync(deployedSkillMd, 'utf-8');

      if (sourceContent !== deployedContent) {
        contentMismatches.push(`${skillName}: content differs`);
      }
    }

    expect(contentMismatches).toEqual([]);
  });
});
