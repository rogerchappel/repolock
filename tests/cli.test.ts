import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, it } from 'node:test';
import { createSnapshot } from '../src/snapshot.js';

const execFileAsync = promisify(execFile);

describe('verify CLI snapshot contract', () => {
  for (const [field, value] of [
    ['schemaVersion', 999],
    ['tool', { name: 'not-repolock', version: '0.1.0' }],
    ['generatedAt', 'not-a-date']
  ] as const) {
    it(`exits nonzero for an invalid ${field}`, async () => {
      const snapshot = await createSnapshot('fixtures/basic-repo');
      const directory = await mkdtemp(path.join(tmpdir(), 'repolock-cli-'));
      const snapshotPath = path.join(directory, 'invalid.snapshot.json');
      await writeFile(snapshotPath, JSON.stringify({ ...snapshot, [field]: value }));

      await assert.rejects(
        execFileAsync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'verify', 'fixtures/basic-repo', '--snapshot', snapshotPath]),
        (error: NodeJS.ErrnoException & { stderr?: string }) => {
          assert.match(error.stderr ?? '', new RegExp(`${escapeRegExp(snapshotPath)}: .*${field.replace('tool', 'tool\\.name')}`));
          return true;
        }
      );
    });
  }

  it('continues to verify a current generated snapshot', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'repolock-cli-'));
    await execFileAsync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'snapshot', 'fixtures/basic-repo', '--output', directory]);
    const snapshotPath = path.join(directory, 'repolock.snapshot.json');
    assert.equal(JSON.parse(await readFile(snapshotPath, 'utf8')).schemaVersion, 1);

    const { stdout } = await execFileAsync(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'verify', 'fixtures/basic-repo', '--snapshot', snapshotPath]);
    assert.equal(JSON.parse(stdout).ok, true);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
