import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readConfig, mergeSnapshotOptions } from './config.js';
import { renderSnapshotReport, renderVerifyReport } from './report.js';
import type { RepositoryPolicySnapshot, SnapshotOptions, VerifyResult } from './schema.js';
import { createSnapshot } from './snapshot.js';
import { verifySnapshot } from './verify.js';

export type SnapshotCommandOptions = SnapshotOptions & {
  output?: string;
  config?: string;
};

export type VerifyCommandOptions = SnapshotOptions & {
  snapshot?: string;
  report?: string;
  config?: string;
  json?: boolean;
};

export type SnapshotCommandResult = {
  snapshot: RepositoryPolicySnapshot;
  snapshotPath: string;
  reportPath: string;
};

export async function runSnapshotCommand(repo: string, options: SnapshotCommandOptions): Promise<SnapshotCommandResult> {
  const repoRoot = path.resolve(repo);
  const config = await readConfig(repoRoot, options.config);
  const snapshot = await createSnapshot(repoRoot, mergeSnapshotOptions(config, options));
  const outputDir = options.output
    ? path.resolve(options.output)
    : path.resolve(repoRoot, config.outputDir ?? '.repolock');

  const snapshotPath = path.join(outputDir, 'repolock.snapshot.json');
  const reportPath = path.join(outputDir, 'repolock.report.md');

  await mkdir(outputDir, { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  await writeFile(reportPath, renderSnapshotReport(snapshot));

  return { snapshot, snapshotPath, reportPath };
}

export async function runVerifyCommand(repo: string, options: VerifyCommandOptions): Promise<VerifyResult> {
  const repoRoot = path.resolve(repo);
  const config = await readConfig(repoRoot, options.config);
  const snapshotPath = options.snapshot
    ? path.resolve(options.snapshot)
    : path.join(path.resolve(repoRoot, config.outputDir ?? '.repolock'), 'repolock.snapshot.json');
  const expected = JSON.parse(await readFile(snapshotPath, 'utf8')) as RepositoryPolicySnapshot;
  const result = await verifySnapshot(repoRoot, {
    ...expected,
    protectedPaths: options.protectedPaths ?? config.protectedPaths ?? expected.protectedPaths,
    requiredDocs: options.requiredDocs
      ? Object.fromEntries(options.requiredDocs.map((doc) => [doc, expected.requiredDocs[doc] ?? true]))
      : expected.requiredDocs,
    ignoreRules: options.ignoreCoverage
      ? {
        ...expected.ignoreRules,
        covers: Object.fromEntries(options.ignoreCoverage.map((item) => [item, expected.ignoreRules.covers[item] ?? true]))
      }
      : expected.ignoreRules
  });

  if (options.report) {
    await mkdir(path.dirname(path.resolve(options.report)), { recursive: true });
    await writeFile(path.resolve(options.report), renderVerifyReport(result));
  }

  return result;
}
