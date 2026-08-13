import assert from 'node:assert/strict';
import { test } from 'node:test';
import { declaredEntrypoints, missingEntrypoints } from '../scripts/package-smoke.mjs';

const manifest = {
  main: './dist/index.js',
  bin: { repolock: './dist/cli.js' },
  exports: {
    '.': {
      import: './dist/index.js',
      types: './dist/index.d.ts'
    }
  }
};

test('collects main, bin, and nested export targets without duplicates', () => {
  assert.deepEqual(declaredEntrypoints(manifest), [
    'dist/index.js',
    'dist/cli.js',
    'dist/index.d.ts'
  ]);
});

test('reports a declared dist entrypoint missing from the tarball', () => {
  assert.deepEqual(
    missingEntrypoints(manifest, ['dist/index.js', 'dist/index.d.ts']),
    ['dist/cli.js']
  );
});

test('accepts a tarball containing every declared entrypoint', () => {
  assert.deepEqual(
    missingEntrypoints(manifest, ['dist/index.js', 'dist/cli.js', 'dist/index.d.ts']),
    []
  );
});
