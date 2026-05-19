import path from 'node:path';
import { defaultProtectedPaths, defaultRequiredDocs, readRequiredDocs } from './docs-policy.js';
import { getCurrentBranch, getDefaultBranch } from './git.js';
import { defaultIgnoreCoverage, readIgnorePolicy } from './ignore-policy.js';
import { readPackagePolicy } from './package-policy.js';
import { snapshotSchemaVersion, type RepositoryPolicySnapshot, type SnapshotOptions } from './schema.js';

const packageVersion = '0.1.0';

export async function createSnapshot(repoRoot: string, options: SnapshotOptions = {}): Promise<RepositoryPolicySnapshot> {
  const resolvedRoot = path.resolve(repoRoot);
  const packagePolicy = await readPackagePolicy(resolvedRoot);
  const requiredDocs = await readRequiredDocs(resolvedRoot, options.requiredDocs ?? defaultRequiredDocs);
  const ignoreRules = await readIgnorePolicy(resolvedRoot, options.ignoreCoverage ?? defaultIgnoreCoverage);
  const protectedPaths = [...(options.protectedPaths ?? defaultProtectedPaths)].sort();

  return {
    schemaVersion: snapshotSchemaVersion,
    tool: {
      name: 'repolock',
      version: packageVersion
    },
    generatedAt: new Date().toISOString(),
    repository: {
      rootName: path.basename(resolvedRoot),
      defaultBranch: await getDefaultBranch(resolvedRoot),
      currentBranch: await getCurrentBranch(resolvedRoot)
    },
    packageManager: {
      family: packagePolicy.family,
      lockfiles: packagePolicy.lockfiles,
      packageManagerField: packagePolicy.packageManagerField
    },
    packageScripts: packagePolicy.scripts,
    requiredDocs,
    ignoreRules,
    protectedPaths,
    commitHygiene: {
      conventionalCommitTypes: ['feat', 'fix', 'docs', 'test', 'refactor', 'chore', 'ci', 'perf', 'types'],
      hasPullRequestTemplate: requiredDocs['.github/pull_request_template.md'] ?? false,
      hasContributingGuide: requiredDocs['CONTRIBUTING.md'] ?? false,
      hasSecurityPolicy: requiredDocs['SECURITY.md'] ?? false
    },
    warnings: buildWarnings(packagePolicy.family, requiredDocs, ignoreRules.covers)
  };
}

function buildWarnings(
  lockfileFamily: string,
  requiredDocs: Record<string, boolean>,
  ignoreCoverage: Record<string, boolean>
): string[] {
  const warnings: string[] = [];

  if (lockfileFamily === 'none') {
    warnings.push('No package lockfile was detected.');
  }

  if (lockfileFamily === 'multiple') {
    warnings.push('Multiple package lockfile families were detected.');
  }

  for (const [doc, exists] of Object.entries(requiredDocs)) {
    if (!exists) {
      warnings.push(`Required document is missing: ${doc}`);
    }
  }

  for (const [pattern, covered] of Object.entries(ignoreCoverage)) {
    if (!covered) {
      warnings.push(`.gitignore does not cover expected pattern: ${pattern}`);
    }
  }

  return warnings;
}
