import { createSnapshot } from './snapshot.js';
import type { RepositoryPolicySnapshot, VerifyFinding, VerifyResult } from './schema.js';

export async function verifySnapshot(repoRoot: string, expected: RepositoryPolicySnapshot): Promise<VerifyResult> {
  const actual = await createSnapshot(repoRoot, {
    protectedPaths: expected.protectedPaths,
    requiredDocs: Object.keys(expected.requiredDocs),
    ignoreCoverage: Object.keys(expected.ignoreRules.covers)
  });

  const findings: VerifyFinding[] = [];

  compareScalar(findings, 'default-branch', 'Git default branch changed', expected.repository.defaultBranch, actual.repository.defaultBranch);
  compareScalar(findings, 'lockfile-family', 'Package lockfile family changed', expected.packageManager.family, actual.packageManager.family);
  compareArray(findings, 'lockfiles', 'Package lockfiles changed', expected.packageManager.lockfiles, actual.packageManager.lockfiles);
  compareRecord(findings, 'package-scripts', 'Package scripts changed', expected.packageScripts, actual.packageScripts);
  compareRecord(findings, 'required-docs', 'Required document presence changed', expected.requiredDocs, actual.requiredDocs);
  compareRecord(findings, 'ignore-coverage', 'Ignore coverage changed', expected.ignoreRules.covers, actual.ignoreRules.covers);
  compareArray(findings, 'protected-paths', 'Protected path policy changed', expected.protectedPaths, actual.protectedPaths);

  if (expected.packageManager.family === 'multiple' || actual.packageManager.family === 'multiple') {
    findings.push({
      status: 'warn',
      code: 'multiple-lockfile-families',
      message: 'Multiple lockfile families make package manager policy ambiguous.',
      expected: expected.packageManager.lockfiles,
      actual: actual.packageManager.lockfiles
    });
  }

  for (const warning of actual.warnings) {
    findings.push({
      status: 'warn',
      code: 'snapshot-warning',
      message: warning
    });
  }

  return {
    ok: findings.every((finding) => finding.status !== 'fail'),
    findings
  };
}

function compareScalar(findings: VerifyFinding[], code: string, message: string, expected: unknown, actual: unknown): void {
  if (expected !== actual) {
    findings.push({ status: 'fail', code, message, expected, actual });
    return;
  }

  findings.push({ status: 'pass', code, message });
}

function compareArray(findings: VerifyFinding[], code: string, message: string, expected: string[], actual: string[]): void {
  const normalizedExpected = [...expected].sort();
  const normalizedActual = [...actual].sort();
  if (JSON.stringify(normalizedExpected) !== JSON.stringify(normalizedActual)) {
    findings.push({ status: 'fail', code, message, expected: normalizedExpected, actual: normalizedActual });
    return;
  }

  findings.push({ status: 'pass', code, message });
}

function compareRecord(
  findings: VerifyFinding[],
  code: string,
  message: string,
  expected: Record<string, unknown>,
  actual: Record<string, unknown>
): void {
  const normalizedExpected = sortRecord(expected);
  const normalizedActual = sortRecord(actual);

  if (JSON.stringify(normalizedExpected) !== JSON.stringify(normalizedActual)) {
    findings.push({ status: 'fail', code, message, expected: normalizedExpected, actual: normalizedActual });
    return;
  }

  findings.push({ status: 'pass', code, message });
}

function sortRecord(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
}
