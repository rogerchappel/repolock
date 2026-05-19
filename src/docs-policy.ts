import path from 'node:path';
import { pathExists } from './fs-utils.js';

export const defaultRequiredDocs = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'LICENSE',
  '.github/pull_request_template.md'
];

export async function readRequiredDocs(repoRoot: string, docs = defaultRequiredDocs): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};

  for (const doc of docs) {
    result[doc] = await pathExists(path.join(repoRoot, doc));
  }

  return result;
}

export const defaultProtectedPaths = [
  '.github/workflows/',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lock',
  'scripts/validate.sh',
  'SECURITY.md',
  'AGENTS.md'
];
