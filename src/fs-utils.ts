import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(target: string): Promise<T> {
  const raw = await readFile(target, 'utf8');
  return JSON.parse(raw) as T;
}

export async function readTextIfExists(target: string): Promise<string | null> {
  if (!(await pathExists(target))) {
    return null;
  }

  return readFile(target, 'utf8');
}

export async function listFiles(root: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }

    const relative = path.posix.join(prefix.split(path.sep).join(path.posix.sep), entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }

  return files.sort();
}
