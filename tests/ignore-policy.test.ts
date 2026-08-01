import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readIgnorePolicy } from '../src/ignore-policy.js';

async function coverage(entries: string, expected: string[]): Promise<Record<string, boolean>> {
  const root = await mkdtemp(path.join(tmpdir(), 'repolock-ignore-'));
  await writeFile(path.join(root, '.gitignore'), entries);
  return (await readIgnorePolicy(root, expected)).covers;
}

test('literal prefixes do not cover different directory names', async () => {
  assert.deepEqual(await coverage('node\ndist\n', ['node_modules/', 'dist/']), {
    'node_modules/': false,
    'dist/': false
  });
  assert.deepEqual(await coverage('node_modules/\n', ['node_modules/']), {
    'node_modules/': true
  });
});

test('later negations override earlier ignore rules', async () => {
  assert.deepEqual(await coverage('node_modules/\n!node_modules/\n', ['node_modules/']), {
    'node_modules/': false
  });
});

test('supports anchored and wildcard coverage patterns', async () => {
  const result = await coverage('/dist/\n*.env\ncache-?/\n', [
    'dist/',
    'packages/dist/',
    '.env',
    'config.env',
    'cache-a/',
    'cache-long/'
  ]);
  assert.deepEqual(result, {
    'dist/': true,
    'packages/dist/': false,
    '.env': true,
    'config.env': true,
    'cache-a/': true,
    'cache-long/': false
  });
});
