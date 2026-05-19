import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderSnapshotReport, renderVerifyReport } from '../src/report.js';
import { createSnapshot } from '../src/snapshot.js';
import { verifySnapshot } from '../src/verify.js';

describe('reports', () => {
  it('renders readable snapshot markdown', async () => {
    const snapshot = await createSnapshot('fixtures/basic-repo');
    const report = renderSnapshotReport(snapshot);

    assert.match(report, /# Repolock Snapshot Report/);
    assert.match(report, /Package manager: npm/);
    assert.match(report, /scripts\/validate.sh/);
  });

  it('renders verify findings with status labels', async () => {
    const snapshot = await createSnapshot('fixtures/basic-repo');
    const result = await verifySnapshot('fixtures/basic-repo', snapshot);
    const report = renderVerifyReport(result);

    assert.match(report, /# Repolock Verify Report/);
    assert.match(report, /Result: pass/);
    assert.match(report, /\[pass\] package-scripts/);
  });
});
