import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it } from 'node:test';
import { readConfig } from '../src/config.js';

it('returns an empty config when neither default config file exists', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'repolock-config-'));

  assert.deepEqual(await readConfig(repoRoot), {});
});

it('accepts a valid discovered config', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'repolock-config-'));
  const configPath = path.join(repoRoot, 'repolock.config.json');
  const config = { outputDir: '.policy', requiredDocs: ['README.md'] };
  await writeFile(configPath, `${JSON.stringify(config)}\n`);

  assert.deepEqual(await readConfig(repoRoot), config);
});

it('identifies invalid fields in discovered and explicit configs', async () => {
  const repoRoot = await mkdtemp(path.join(tmpdir(), 'repolock-config-'));
  const discoveredPath = path.join(repoRoot, 'repolock.config.json');
  await writeFile(discoveredPath, JSON.stringify({ requiredDocs: 'README.md' }));

  await assert.rejects(readConfig(repoRoot), new RegExp(`${escapeRegExp(discoveredPath)}: requiredDocs must be an array of strings`));

  const explicitPath = path.join(repoRoot, 'custom.json');
  await writeFile(explicitPath, JSON.stringify({ outputDir: [] }));
  await assert.rejects(readConfig(repoRoot, explicitPath), new RegExp(`${escapeRegExp(explicitPath)}: outputDir must be a string`));
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
