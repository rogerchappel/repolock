import type { RepositoryPolicySnapshot, VerifyResult } from './schema.js';

export function renderSnapshotReport(snapshot: RepositoryPolicySnapshot): string {
  const lines = [
    '# Repolock Snapshot Report',
    '',
    `Generated: ${snapshot.generatedAt}`,
    `Repository: ${snapshot.repository.rootName}`,
    `Default branch: ${snapshot.repository.defaultBranch ?? 'unknown'}`,
    `Package manager: ${snapshot.packageManager.family}`,
    '',
    '## Package Scripts',
    ...renderRecord(snapshot.packageScripts),
    '',
    '## Required Docs',
    ...renderBooleanRecord(snapshot.requiredDocs),
    '',
    '## Ignore Coverage',
    ...renderBooleanRecord(snapshot.ignoreRules.covers),
    '',
    '## Protected Paths',
    ...snapshot.protectedPaths.map((item) => `- ${item}`),
    '',
    '## Warnings',
    ...(snapshot.warnings.length > 0 ? snapshot.warnings.map((warning) => `- ${warning}`) : ['- None'])
  ];

  return `${lines.join('\n')}\n`;
}

export function renderVerifyReport(result: VerifyResult): string {
  const lines = [
    '# Repolock Verify Report',
    '',
    `Result: ${result.ok ? 'pass' : 'fail'}`,
    '',
    '## Findings',
    ...result.findings.map((finding) => {
      const suffix = finding.expected === undefined && finding.actual === undefined
        ? ''
        : ` (expected: ${JSON.stringify(finding.expected)}, actual: ${JSON.stringify(finding.actual)})`;
      return `- [${finding.status}] ${finding.code}: ${finding.message}${suffix}`;
    })
  ];

  return `${lines.join('\n')}\n`;
}

function renderRecord(record: Record<string, string>): string[] {
  const entries = Object.entries(record);
  return entries.length > 0 ? entries.map(([key, value]) => `- ${key}: \`${value}\``) : ['- None'];
}

function renderBooleanRecord(record: Record<string, boolean>): string[] {
  return Object.entries(record).map(([key, value]) => `- ${value ? '[x]' : '[ ]'} ${key}`);
}
