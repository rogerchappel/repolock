import assert from 'node:assert/strict';
import { cp, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { createSnapshot } from '../src/snapshot.js';
import { verifySnapshot } from '../src/verify.js';

describe('verifySnapshot', () => {
  it('passes when the repository still matches the snapshot', async () => {
    const snapshot = await createSnapshot('fixtures/basic-repo');
    const result = await verifySnapshot('fixtures/basic-repo', snapshot);

    assert.equal(result.ok, true);
    assert.equal(result.findings.some((finding) => finding.status === 'fail'), false);
  });

  it('fails when scripts, docs, or ignore coverage drift', async () => {
    const snapshot = await createSnapshot('fixtures/basic-repo');
    const result = await verifySnapshot('fixtures/drifted-repo', snapshot);

    assert.equal(result.ok, false);
    assert.ok(result.findings.some((finding) => finding.code === 'package-scripts'));
    assert.ok(result.findings.some((finding) => finding.code === 'required-docs'));
    assert.ok(result.findings.some((finding) => finding.code === 'ignore-coverage'));
  });

  it('detects coverage removed by a later negation', async () => {
    const snapshot = await createSnapshot('fixtures/basic-repo');
    const root = await mkdtemp(path.join(tmpdir(), 'repolock-verify-'));
    await cp('fixtures/basic-repo', root, { recursive: true });
    await writeFile(path.join(root, '.gitignore'), 'node_modules/\n!node_modules/\ndist/\n.env\n.tmp/\n');

    const result = await verifySnapshot(root, snapshot);
    const finding = result.findings.find((item) => item.code === 'ignore-coverage');
    assert.equal(result.ok, false);
    assert.equal(finding?.status, 'fail');
  });
});
