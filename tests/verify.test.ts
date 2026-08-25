import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
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
    assert.equal(result.findings.find((finding) => finding.code === 'package-manager-field')?.status, 'pass');
  });

  for (const [savedField, currentField] of [
    ['npm@10.0.0', 'npm@11.0.0'],
    [null, 'npm@11.0.0'],
    ['npm@10.0.0', null]
  ] as const) {
    it(`fails when packageManager changes from ${String(savedField)} to ${String(currentField)}`, async () => {
      const root = await mkdtemp(path.join(tmpdir(), 'repolock-package-manager-'));
      await cp('fixtures/basic-repo', root, { recursive: true });
      const packagePath = path.join(root, 'package.json');
      const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as Record<string, unknown>;
      if (savedField === null) delete pkg.packageManager;
      else pkg.packageManager = savedField;
      await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
      const snapshot = await createSnapshot(root);

      if (currentField === null) delete pkg.packageManager;
      else pkg.packageManager = currentField;
      await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);

      const result = await verifySnapshot(root, snapshot);
      const finding = result.findings.find((item) => item.code === 'package-manager-field');
      assert.equal(result.ok, false);
      assert.deepEqual(finding, {
        status: 'fail',
        code: 'package-manager-field',
        message: 'package.json packageManager field matches the snapshot',
        expected: savedField,
        actual: currentField
      });
    });
  }

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
