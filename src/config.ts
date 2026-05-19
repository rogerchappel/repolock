import path from 'node:path';
import { readJsonFile, pathExists } from './fs-utils.js';
import type { SnapshotOptions } from './schema.js';

export type RepolockConfig = SnapshotOptions & {
  outputDir?: string;
};

export async function readConfig(repoRoot: string, configPath?: string): Promise<RepolockConfig> {
  const candidates = configPath
    ? [path.resolve(configPath)]
    : [
      path.join(repoRoot, 'repolock.config.json'),
      path.join(repoRoot, '.repolock.json')
    ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return readJsonFile<RepolockConfig>(candidate);
    }
  }

  return {};
}

export function mergeSnapshotOptions(config: RepolockConfig, overrides: SnapshotOptions): SnapshotOptions {
  return {
    protectedPaths: overrides.protectedPaths ?? config.protectedPaths,
    requiredDocs: overrides.requiredDocs ?? config.requiredDocs,
    ignoreCoverage: overrides.ignoreCoverage ?? config.ignoreCoverage
  };
}
