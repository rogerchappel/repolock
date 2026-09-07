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
  assert.deepEqual(await coverage('node\ndist-other\n', ['node_modules/', 'dist/']), {
    'node_modules/': false,
    'dist/': false
  });
  assert.deepEqual(await coverage('node_modules/\n', ['node_modules/']), {
    'node_modules/': true
  });
});

test('slashless patterns cover matching directories at any level', async () => {
  assert.deepEqual(await coverage('dist\n.tmp\n', [
    'dist/',
    'packages/dist/',
    '.tmp/',
    'packages/.tmp/'
  ]), {
    'dist/': true,
    'packages/dist/': true,
    '.tmp/': true,
    'packages/.tmp/': true
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

test('middle globstars consume zero or multiple directories', async () => {
  assert.deepEqual(await coverage('foo/**/bar/\n', [
    'foo/bar/',
    'foo/one/two/bar/',
    'foo/one/two/baz/'
  ]), {
    'foo/bar/': true,
    'foo/one/two/bar/': true,
    'foo/one/two/baz/': false
  });
});

test('leading globstars match root and nested directories', async () => {
  assert.deepEqual(await coverage('**/cache/\n', [
    'cache/',
    'one/two/cache/',
    'one/two/caches/'
  ]), {
    'cache/': true,
    'one/two/cache/': true,
    'one/two/caches/': false
  });
});
