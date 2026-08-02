import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, cp, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(projectRoot, 'src', 'cli.ts');
const tsxLoaderPath = path.join(projectRoot, 'node_modules', 'tsx', 'dist', 'loader.mjs');

describe('snapshot command output paths', () => {
  it('resolves a relative config outputDir from the target repository', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository('.policy-out');

    await runSnapshot(repoRoot, unrelatedCwd);

    await assertSnapshotFiles(path.join(repoRoot, '.policy-out'));
    await assert.rejects(access(path.join(unrelatedCwd, '.policy-out', 'repolock.snapshot.json')));
  });

  it('preserves an absolute config outputDir', async () => {
    const absoluteOutput = await mkdtemp(path.join(tmpdir(), 'repolock-absolute-output-'));
    const { repoRoot, unrelatedCwd } = await createTestRepository(absoluteOutput);

    await runSnapshot(repoRoot, unrelatedCwd);

    await assertSnapshotFiles(absoluteOutput);
  });

  it('gives a relative --output precedence and resolves it from the caller cwd', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository('.config-output');

    await runSnapshot(repoRoot, unrelatedCwd, ['--output', '.cli-output']);

    await assertSnapshotFiles(path.join(unrelatedCwd, '.cli-output'));
    await assert.rejects(access(path.join(repoRoot, '.config-output', 'repolock.snapshot.json')));
  });
});

async function createTestRepository(outputDir: string): Promise<{ repoRoot: string; unrelatedCwd: string }> {
  const root = await mkdtemp(path.join(tmpdir(), 'repolock-command-'));
  const repoRoot = path.join(root, 'repository');
  const unrelatedCwd = path.join(root, 'caller');
  await cp(path.join(projectRoot, 'fixtures', 'basic-repo'), repoRoot, { recursive: true });
  await cp(path.join(projectRoot, 'fixtures', 'basic-repo'), unrelatedCwd, { recursive: true });
  await writeFile(path.join(repoRoot, 'repolock.config.json'), `${JSON.stringify({ outputDir })}\n`);
  return { repoRoot, unrelatedCwd };
}

async function runSnapshot(repoRoot: string, cwd: string, extraArgs: string[] = []): Promise<void> {
  await execFileAsync(process.execPath, ['--import', tsxLoaderPath, cliPath, 'snapshot', repoRoot, ...extraArgs], {
    cwd
  });
}

async function assertSnapshotFiles(outputDir: string): Promise<void> {
  await access(path.join(outputDir, 'repolock.snapshot.json'));
  await access(path.join(outputDir, 'repolock.report.md'));
}
