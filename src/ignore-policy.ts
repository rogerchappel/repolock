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
  const target = normalize(expected).replace(/\/$/, '');
  const isDirectory = expected.trim().endsWith('/');
  let covered = false;

  for (const entry of entries) {
    const negated = entry.startsWith('!');
    const pattern = negated ? entry.slice(1) : entry;
    if (matchesPattern(pattern, target, isDirectory)) {
      covered = !negated;
    }
  }

  return covered;
}

function normalize(value: string): string {
  return value.trim().replace(/^\//, '');
}

function matchesPattern(pattern: string, target: string, isDirectory: boolean): boolean {
  const anchored = pattern.startsWith('/');
  const directoryOnly = pattern.endsWith('/');
  const normalizedPattern = normalize(pattern).replace(/\/$/, '');

  if (directoryOnly !== isDirectory) {
    return false;
  }

  const expression = globToRegExp(normalizedPattern);
  if (anchored || normalizedPattern.includes('/')) {
    return expression.test(target);
  }

  return target.split('/').some((segment) => expression.test(segment));
}

function globToRegExp(pattern: string): RegExp {
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '*') {
      if (pattern[index + 1] === '*') {
        source += '.*';
        index += 1;
      } else {
        source += '[^/]*';
      }
    } else if (character === '?') {
      source += '[^/]';
    } else {
      source += character.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
    }
  }
  return new RegExp(`${source}$`);
}
