#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(scriptPath), '..');

export function declaredEntrypoints(manifest) {
  const entries = new Set();
  if (typeof manifest.main === 'string') entries.add(manifest.main);
  if (typeof manifest.bin === 'string') entries.add(manifest.bin);
  if (manifest.bin && typeof manifest.bin === 'object') {
    for (const value of Object.values(manifest.bin)) {
      if (typeof value === 'string') entries.add(value);
    }
  }
  collectExportTargets(manifest.exports, entries);
  return [...entries].map(normalizePackagePath);
}

export function missingEntrypoints(manifest, packedFiles) {
  const files = new Set(packedFiles.map(normalizePackagePath));
  return declaredEntrypoints(manifest).filter((entry) => !files.has(entry));
}

function collectExportTargets(value, entries) {
  if (typeof value === 'string') {
    entries.add(value);
  } else if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) collectExportTargets(nested, entries);
  }
}

function normalizePackagePath(path) {
  return path.replace(/^\.\//, '');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function main() {
  const scratch = await mkdtemp(join(tmpdir(), 'repolock-package-smoke-'));
  try {
    run('npm', ['run', 'build'], { cwd: projectRoot });
    const packed = spawnSync('npm', ['pack', '--json', '--pack-destination', scratch], {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    if (packed.status !== 0) {
      process.stderr.write(packed.stderr);
      process.exit(packed.status ?? 1);
    }

    const [packResult] = JSON.parse(packed.stdout);
    const manifest = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf8'));
    const missing = missingEntrypoints(manifest, packResult.files.map(({ path }) => path));
    if (missing.length > 0) {
      throw new Error(`Packed artifact is missing declared entrypoint(s): ${missing.join(', ')}`);
    }

    const consumer = join(scratch, 'consumer');
    await mkdir(consumer);
    run('npm', ['init', '--yes'], { cwd: consumer, stdio: 'ignore' });
    const tarball = join(scratch, packResult.filename);
    run('npm', ['install', '--ignore-scripts', tarball], { cwd: consumer });
    run(process.execPath, ['--input-type=module', '--eval', `import ${JSON.stringify(manifest.name)}`], { cwd: consumer });

    const binTarget = typeof manifest.bin === 'string'
      ? manifest.bin
      : Object.values(manifest.bin ?? {})[0];
    if (binTarget) {
      run(process.execPath, [join(consumer, 'node_modules', manifest.name, normalizePackagePath(binTarget)), '--help'], { cwd: consumer });
    }
    console.log(`Package smoke check passed: ${basename(tarball)}`);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
