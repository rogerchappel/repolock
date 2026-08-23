import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it } from 'node:test';
import { readConfig } from '../src/config.js';

it('returns an empty config when neither default config file exists', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'repolock-config-'));

  assert.deepEqual(await readConfig(repoRoot), {});
});
