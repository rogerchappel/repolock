import path from 'node:path';
import { pathExists, readJsonFile } from './fs-utils.js';
import type { LockfileFamily } from './schema.js';

type PackageJson = {
  packageManager?: string;
  scripts?: Record<string, string>;
};

const lockfileMap: Record<string, LockfileFamily> = {
  'package-lock.json': 'npm',
  'npm-shrinkwrap.json': 'npm',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lock': 'bun',
  'bun.lockb': 'bun'
};

export async function readPackagePolicy(repoRoot: string): Promise<{
  family: LockfileFamily;
  lockfiles: string[];
  packageManagerField: string | null;
  scripts: Record<string, string>;
}> {
  const lockfiles = [];

  for (const lockfile of Object.keys(lockfileMap)) {
    if (await pathExists(path.join(repoRoot, lockfile))) {
      lockfiles.push(lockfile);
    }
  }

  const families = new Set(lockfiles.map((lockfile) => lockfileMap[lockfile]));
  const family: LockfileFamily = families.size === 0
    ? 'none'
    : families.size === 1
      ? [...families][0]
      : 'multiple';

  let packageManagerField: string | null = null;
  let scripts: Record<string, string> = {};

  if (await pathExists(path.join(repoRoot, 'package.json'))) {
    const pkg = await readJsonFile<PackageJson>(path.join(repoRoot, 'package.json'));
    packageManagerField = pkg.packageManager ?? null;
    scripts = Object.fromEntries(Object.entries(pkg.scripts ?? {}).sort(([a], [b]) => a.localeCompare(b)));
  }

  return {
    family,
    lockfiles: lockfiles.sort(),
    packageManagerField,
    scripts
  };
}
