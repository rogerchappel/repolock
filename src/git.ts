import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function git(repoRoot: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['-C', repoRoot, ...args], {
      timeout: 5000
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getCurrentBranch(repoRoot: string): Promise<string | null> {
  const branch = await git(repoRoot, ['branch', '--show-current']);
  return branch && branch.length > 0 ? branch : null;
}

export async function getDefaultBranch(repoRoot: string): Promise<string | null> {
  const symbolic = await git(repoRoot, ['symbolic-ref', 'refs/remotes/origin/HEAD', '--short']);
  if (symbolic) {
    return symbolic.replace(/^origin\//, '');
  }

  const current = await getCurrentBranch(repoRoot);
  return current ?? null;
}
