import * as fs from 'fs';
import chalk from 'chalk';
import type { ScanResult } from '../../types.js';

// Skill category definitions
const BASE_CANON = ['clarity', 'owasp', 'react-test'];
const SECURITY_SKILLS = ['security-mindset', 'owasp', 'threat-model', 'web-security'];
const CANON_SKILLS = [
  'clarity', 'java', 'typescript', 'design-patterns', 'abstraction', 'testability', 'angular',
  'angular-perf', 'rxjs', 'js-internals', 'react-test', 'owasp', 'security-mindset',
  'threat-model', 'web-security', 'react-state', 'web-perf'
];

function printPatternChecks(result: ScanResult, projectSkills: string[]): void {
  console.log(`\n${chalk.cyan('Claude-Optimal Patterns')}:`);

  // Check for STRATEGY.md
  const strategyPath = result.projectPath
    ? `${result.projectPath}/.claude/STRATEGY.md`
    : null;
  const hasStrategy = result.items.some(i =>
    i.name === 'STRATEGY.md' || i.path.includes('STRATEGY.md')
  ) || (strategyPath && fs.existsSync(strategyPath));
  console.log(hasStrategy
    ? chalk.green('  ✓ STRATEGY.md present')
    : chalk.yellow('  ○ STRATEGY.md missing - consider adding configuration rationale')
  );

  // Check for base canon skills
  const missingBaseCanon = BASE_CANON.filter(s => !projectSkills.includes(s));
  if (missingBaseCanon.length === 0) {
    console.log(chalk.green('  ✓ Base canon complete (clarity, owasp, react-test)'));
  } else {
    console.log(chalk.yellow(`  ○ Base canon missing: ${missingBaseCanon.join(', ')}`));
  }

  // Check for security skills
  const hasSecuritySkills = SECURITY_SKILLS.filter(s => projectSkills.includes(s));
  if (hasSecuritySkills.length >= 2) {
    console.log(chalk.green(`  ✓ Security skills present (${hasSecuritySkills.length}/5)`));
  } else {
    console.log(chalk.yellow(`  ○ Security skills sparse (${hasSecuritySkills.length}/5) - consider adding more`));
  }
}

function printQualityFlags(claudeMdContent: string): void {
  const hasStructureFirst = claudeMdContent.includes('--structure');
  const hasReviewHard = claudeMdContent.includes('--security-review');
  const hasRefactorClean = claudeMdContent.includes('--refactoring');

  const flagCount = [hasStructureFirst, hasReviewHard, hasRefactorClean].filter(Boolean).length;
  if (flagCount === 3) {
    console.log(chalk.green('  ✓ Quality flags documented (--structure, --security-review, --refactoring)'));
  } else if (flagCount > 0) {
    console.log(chalk.yellow(`  ○ Quality flags partial (${flagCount}/3) - consider documenting all flags`));
  } else {
    console.log(chalk.yellow('  ○ Quality flags not documented - add --structure, --security-review, --refactoring'));
  }
}

function printConflicts(result: ScanResult): void {
  const { summary } = result;

  console.log(`\n${chalk.yellow('Conflicts')} (same name, different scopes):`);
  const projectConflicts = summary.conflicts.filter(c =>
    c.locations.some(l => l.includes(result.projectPath || ''))
  );
  if (projectConflicts.length === 0) {
    console.log(chalk.green('  ✓ No project conflicts found'));
  } else {
    for (const conflict of projectConflicts) {
      console.log(`  ${chalk.red('✗')} ${conflict.name} (${conflict.type})`);
      conflict.locations.forEach(loc => console.log(chalk.gray(`      ${loc}`)));
    }
  }
}

function printMissingRefs(result: ScanResult): void {
  const { summary } = result;

  console.log(`\n${chalk.red('Missing References')}:`);
  if (summary.missingReferences.length === 0) {
    console.log(chalk.green('  ✓ All references resolved'));
  } else {
    for (const missing of summary.missingReferences) {
      console.log(`  ${chalk.red('✗')} ${missing.referencedName} (${missing.referenceType})`);
      console.log(chalk.gray(`      Referenced in: ${missing.referencedIn}`));
    }
  }
}

function printSkillsSummary(projectSkills: string[]): void {
  console.log(`\n${chalk.cyan('Project Skills')} (${projectSkills.length} total):`);
  if (projectSkills.length === 0) return;

  const canonSkills = projectSkills.filter(s => CANON_SKILLS.includes(s));
  const securitySkillsFound = projectSkills.filter(s => SECURITY_SKILLS.includes(s));
  const domainSkills = projectSkills.filter(s =>
    !canonSkills.includes(s) && !securitySkillsFound.includes(s)
  );

  if (canonSkills.length > 0) {
    console.log(chalk.blue(`  Canon (${canonSkills.length}): ${canonSkills.join(', ')}`));
  }
  if (securitySkillsFound.length > 0) {
    console.log(chalk.red(`  Security (${securitySkillsFound.length}): ${securitySkillsFound.join(', ')}`));
  }
  if (domainSkills.length > 0) {
    console.log(chalk.green(`  Domain (${domainSkills.length}): ${domainSkills.join(', ')}`));
  }
}

function printClaudeMdAnalysis(result: ScanResult): void {
  console.log(`\n${chalk.cyan('CLAUDE.md Analysis')}:`);
  for (const claudeMd of result.claudeMds) {
    if (!claudeMd || claudeMd.scope !== 'project') continue;
    console.log(`\n  ${chalk.bold(claudeMd.path)}`);
    console.log(`    Auto-invoke rules: ${claudeMd.autoInvokes.length}`);
    console.log(`    Skill references:  ${claudeMd.skillReferences.length}`);

    if (claudeMd.autoInvokes.length > 0) {
      console.log(chalk.gray('    Rules:'));
      claudeMd.autoInvokes.forEach(ai => {
        console.log(chalk.gray(`      ${ai.context} → ${ai.skillName}`));
      });
    }
  }
}

export function printAuditReport(result: ScanResult): void {
  console.log(chalk.bold('\nConfiguration Audit Report'));
  console.log(chalk.gray('═'.repeat(50)));

  const projectSkills = result.items
    .filter(i => i.type === 'skill' && i.scope === 'project')
    .map(i => i.name);

  const claudeMdContent = result.items.find(i =>
    i.type === 'memory' && i.scope === 'project' && i.name === 'CLAUDE.md'
  )?.content || '';

  printPatternChecks(result, projectSkills);
  printQualityFlags(claudeMdContent);
  printConflicts(result);
  printMissingRefs(result);
  printSkillsSummary(projectSkills);
  printClaudeMdAnalysis(result);
}
