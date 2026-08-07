import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { getDefaultBranch } from '../src/git.js';

const temporaryDirectories: string[] = [];

function git(repoRoot: string, ...args: string[]): void {
  execFileSync('git', ['-C', repoRoot, ...args], { stdio: 'ignore' });
}

function createRepository(initialBranch = 'main'): string {
  const repoRoot = mkdtempSync(join(tmpdir(), 'repolock-git-test-'));
  temporaryDirectories.push(repoRoot);
  git(repoRoot, 'init', '--initial-branch', initialBranch);
  git(repoRoot, 'config', 'user.name', 'Repolock Test');
  git(repoRoot, 'config', 'user.email', 'test@example.com');
  git(repoRoot, 'commit', '--allow-empty', '-m', 'initial');
  return repoRoot;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('getDefaultBranch', () => {
  it('uses origin/HEAD when it is available', async () => {
    const repoRoot = createRepository('trunk');
    git(repoRoot, 'update-ref', 'refs/remotes/origin/trunk', 'HEAD');
    git(repoRoot, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/trunk');

    assert.equal(await getDefaultBranch(repoRoot), 'trunk');
  });

  it('prefers a local main candidate instead of the checked-out topic branch', async () => {
    const repoRoot = createRepository();
    git(repoRoot, 'switch', '-c', 'feature');

    assert.equal(await getDefaultBranch(repoRoot), 'main');
  });

  it('finds a main candidate from detached HEAD', async () => {
    const repoRoot = createRepository();
    git(repoRoot, 'switch', '--detach');

    assert.equal(await getDefaultBranch(repoRoot), 'main');
  });

  it('returns null when no conventional default branch candidate exists', async () => {
    const repoRoot = createRepository('feature');

    assert.equal(await getDefaultBranch(repoRoot), null);
  });

  it('returns null for a non-repository path', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'repolock-not-git-'));
    temporaryDirectories.push(directory);

    assert.equal(await getDefaultBranch(directory), null);
  });
});
