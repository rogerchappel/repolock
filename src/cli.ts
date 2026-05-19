#!/usr/bin/env node
import { Command, Option } from 'commander';
import { runSnapshotCommand, runVerifyCommand } from './commands.js';
import type { SnapshotOptions } from './schema.js';

const program = new Command();

program
  .name('repolock')
  .description('Local-first repository policy snapshot and verify CLI.')
  .version('0.1.0');

program
  .command('snapshot')
  .argument('[repo]', 'Repository root to snapshot', '.')
  .description('Create a JSON policy snapshot and markdown report.')
  .option('-o, --output <dir>', 'Output directory for snapshot files')
  .option('-c, --config <path>', 'Optional repolock config JSON path')
  .addOption(listOption('--protected-path <path>', 'Protected path to include. Can be repeated.'))
  .addOption(listOption('--required-doc <path>', 'Required document to check. Can be repeated.'))
  .addOption(listOption('--ignore-coverage <pattern>', 'Ignore pattern coverage to check. Can be repeated.'))
  .action(async (repo: string, options: Record<string, unknown>) => {
    const snapshot = await runSnapshotCommand(repo, normalizeOptions(options));
    console.log(JSON.stringify({
      ok: true,
      snapshot: 'repolock.snapshot.json',
      report: 'repolock.report.md',
      warnings: snapshot.warnings
    }, null, 2));
  });

program
  .command('verify')
  .argument('[repo]', 'Repository root to verify', '.')
  .description('Verify a repository against a saved policy snapshot.')
  .option('-s, --snapshot <path>', 'Snapshot JSON path')
  .option('-r, --report <path>', 'Write a markdown verify report')
  .option('-c, --config <path>', 'Optional repolock config JSON path')
  .option('--json', 'Print full JSON verification result')
  .addOption(listOption('--protected-path <path>', 'Protected path to include. Can be repeated.'))
  .addOption(listOption('--required-doc <path>', 'Required document to check. Can be repeated.'))
  .addOption(listOption('--ignore-coverage <pattern>', 'Ignore pattern coverage to check. Can be repeated.'))
  .action(async (repo: string, options: Record<string, unknown>) => {
    const result = await runVerifyCommand(repo, normalizeOptions(options));
    console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify({ ok: result.ok, findings: result.findings.length }, null, 2));
    if (!result.ok) {
      process.exitCode = 1;
    }
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

function listOption(flags: string, description: string): Option {
  return new Option(flags, description).argParser((value, previous: string[] = []) => [...previous, value]);
}

function normalizeOptions(options: Record<string, unknown>): Record<string, unknown> & SnapshotOptions {
  return {
    ...options,
    protectedPaths: options.protectedPath as string[] | undefined,
    requiredDocs: options.requiredDoc as string[] | undefined,
    ignoreCoverage: options.ignoreCoverage as string[] | undefined
  };
}
