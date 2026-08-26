import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { createSnapshot } from '../src/snapshot.js';
import { packageVersion } from '../src/version.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };

describe('version parity', () => {
  it('derives the shared package version from package.json', () => {
    assert.equal(packageVersion, packageJson.version);
  });

  it('prints the package.json version from CLI --version', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/cli.ts', '--version'], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), packageJson.version);
  });

  it('embeds the package.json version in snapshot tool metadata', async () => {
    const snapshot = await createSnapshot('fixtures/basic-repo');
    assert.equal(snapshot.tool.version, packageJson.version);
  });
});