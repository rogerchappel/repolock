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
  it('reports default output paths resolved from the target repository', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository();

    const output = await runSnapshot(repoRoot, unrelatedCwd);

    assertOutputPaths(output, path.join(repoRoot, '.repolock'));
  });

  it('resolves a relative config outputDir from the target repository', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository('.policy-out');

    const output = await runSnapshot(repoRoot, unrelatedCwd);

    await assertSnapshotFiles(path.join(repoRoot, '.policy-out'));
    assertOutputPaths(output, path.join(repoRoot, '.policy-out'));
    await assert.rejects(access(path.join(unrelatedCwd, '.policy-out', 'repolock.snapshot.json')));
  });

  it('preserves an absolute config outputDir', async () => {
    const absoluteOutput = await mkdtemp(path.join(tmpdir(), 'repolock-absolute-output-'));
    const { repoRoot, unrelatedCwd } = await createTestRepository(absoluteOutput);

    const output = await runSnapshot(repoRoot, unrelatedCwd);

    await assertSnapshotFiles(absoluteOutput);
    assertOutputPaths(output, absoluteOutput);
  });

  it('gives a relative --output precedence and resolves it from the caller cwd', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository('.config-output');

    const output = await runSnapshot(repoRoot, unrelatedCwd, ['--output', '.cli-output']);

    await assertSnapshotFiles(path.join(unrelatedCwd, '.cli-output'));
    assertOutputPaths(output, path.join(unrelatedCwd, '.cli-output'));
    await assert.rejects(access(path.join(repoRoot, '.config-output', 'repolock.snapshot.json')));
  });

  it('reports an absolute --output unchanged', async () => {
    const absoluteOutput = await mkdtemp(path.join(tmpdir(), 'repolock-cli-output-'));
    const { repoRoot, unrelatedCwd } = await createTestRepository('.config-output');

    const output = await runSnapshot(repoRoot, unrelatedCwd, ['--output', absoluteOutput]);

    await assertSnapshotFiles(absoluteOutput);
    assertOutputPaths(output, absoluteOutput);
  });
});

describe('verify command snapshot paths', () => {
  it('reads the default .repolock snapshot from the target repository', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository();
    await runSnapshot(repoRoot, unrelatedCwd);

    assert.equal((await runVerify(repoRoot, unrelatedCwd)).ok, true);
  });

  it('reads a relative configured outputDir from the target repository', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository('.policy-out');
    await runSnapshot(repoRoot, unrelatedCwd);

    assert.equal((await runVerify(repoRoot, unrelatedCwd)).ok, true);
  });

  it('reads an absolute configured outputDir unchanged', async () => {
    const absoluteOutput = await mkdtemp(path.join(tmpdir(), 'repolock-verify-absolute-'));
    const { repoRoot, unrelatedCwd } = await createTestRepository(absoluteOutput);
    await runSnapshot(repoRoot, unrelatedCwd);

    assert.equal((await runVerify(repoRoot, unrelatedCwd)).ok, true);
  });

  it('uses an explicit config while rooting its relative outputDir at the target repository', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository();
    const configPath = path.join(unrelatedCwd, 'custom-config.json');
    await writeFile(configPath, `${JSON.stringify({ outputDir: '.configured-policy' })}\n`);
    await runSnapshot(repoRoot, unrelatedCwd, ['--config', configPath]);

    assert.equal((await runVerify(repoRoot, unrelatedCwd, ['--config', configPath])).ok, true);
  });

  it('gives an explicit --snapshot precedence and resolves it from the caller cwd', async () => {
    const { repoRoot, unrelatedCwd } = await createTestRepository('.missing-configured-policy');
    await runSnapshot(repoRoot, unrelatedCwd, ['--output', '.explicit-policy']);

    assert.equal((await runVerify(repoRoot, unrelatedCwd, ['--snapshot', '.explicit-policy/repolock.snapshot.json'])).ok, true);
  });
});

async function createTestRepository(outputDir?: string): Promise<{ repoRoot: string; unrelatedCwd: string }> {
  const root = await mkdtemp(path.join(tmpdir(), 'repolock-command-'));
  const repoRoot = path.join(root, 'repository');
  const unrelatedCwd = path.join(root, 'caller');
  await cp(path.join(projectRoot, 'fixtures', 'basic-repo'), repoRoot, { recursive: true });
  await cp(path.join(projectRoot, 'fixtures', 'basic-repo'), unrelatedCwd, { recursive: true });
  if (outputDir !== undefined) {
    await writeFile(path.join(repoRoot, 'repolock.config.json'), `${JSON.stringify({ outputDir })}\n`);
  }
  return { repoRoot, unrelatedCwd };
}

async function runSnapshot(repoRoot: string, cwd: string, extraArgs: string[] = []): Promise<Record<string, unknown>> {
  const { stdout } = await execFileAsync(process.execPath, ['--import', tsxLoaderPath, cliPath, 'snapshot', repoRoot, ...extraArgs], {
    cwd
  });
  return JSON.parse(stdout) as Record<string, unknown>;
}

async function runVerify(repoRoot: string, cwd: string, extraArgs: string[] = []): Promise<Record<string, unknown>> {
  const { stdout } = await execFileAsync(process.execPath, ['--import', tsxLoaderPath, cliPath, 'verify', repoRoot, ...extraArgs], {
    cwd
  });
  return JSON.parse(stdout) as Record<string, unknown>;
}

async function assertSnapshotFiles(outputDir: string): Promise<void> {
  await access(path.join(outputDir, 'repolock.snapshot.json'));
  await access(path.join(outputDir, 'repolock.report.md'));
}

function assertOutputPaths(output: Record<string, unknown>, outputDir: string): void {
  assert.equal(output.snapshot, path.join(outputDir, 'repolock.snapshot.json'));
  assert.equal(output.report, path.join(outputDir, 'repolock.report.md'));
}
