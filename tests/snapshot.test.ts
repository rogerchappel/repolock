import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSnapshot } from '../src/snapshot.js';

describe('createSnapshot', () => {
  it('captures package, docs, protected paths, and ignore coverage', async () => {
    const snapshot = await createSnapshot('fixtures/basic-repo');

    assert.equal(snapshot.schemaVersion, 1);
    assert.equal(snapshot.packageManager.family, 'npm');
    assert.deepEqual(snapshot.packageManager.lockfiles, ['package-lock.json']);
    assert.equal(snapshot.packageScripts.test, 'node --test');
    assert.equal(snapshot.requiredDocs['README.md'], true);
    assert.equal(snapshot.requiredDocs['SECURITY.md'], true);
    assert.equal(snapshot.ignoreRules.covers['node_modules/'], true);
    assert.equal(snapshot.ignoreRules.covers['.env'], true);
    assert.ok(snapshot.protectedPaths.includes('package.json'));
  });

  it('records exact file and directory ignore coverage', async () => {
    const snapshot = await createSnapshot('fixtures/basic-repo', {
      ignoreCoverage: ['node_modules/', 'node', 'dist/', 'dist']
    });

    assert.deepEqual(snapshot.ignoreRules.covers, {
      'node_modules/': true,
      node: false,
      'dist/': true,
      dist: false
    });
  });
});
