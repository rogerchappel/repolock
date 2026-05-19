import path from 'node:path';
import { readTextIfExists } from './fs-utils.js';

export const defaultIgnoreCoverage = [
  'node_modules/',
  'dist/',
  '.env',
  '.tmp/'
];

export async function readIgnorePolicy(repoRoot: string, coverage = defaultIgnoreCoverage): Promise<{
  gitignoreExists: boolean;
  entries: string[];
  covers: Record<string, boolean>;
}> {
  const raw = await readTextIfExists(path.join(repoRoot, '.gitignore'));
  const entries = raw === null
    ? []
    : raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

  return {
    gitignoreExists: raw !== null,
    entries,
    covers: Object.fromEntries(coverage.map((item) => [item, coversPattern(entries, item)]))
  };
}

function coversPattern(entries: string[], expected: string): boolean {
  const normalizedExpected = normalize(expected);
  return entries.some((entry) => {
    const normalizedEntry = normalize(entry);
    return normalizedEntry === normalizedExpected
      || normalizedEntry === normalizedExpected.replace(/\/$/, '')
      || normalizedExpected.startsWith(normalizedEntry.replace(/\*$/, ''));
  });
}

function normalize(value: string): string {
  return value.trim().replace(/^\//, '');
}
