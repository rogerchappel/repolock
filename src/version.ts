import { readFileSync } from 'node:fs';

/**
 * Package version, read once from package.json so that the CLI --version
 * output, the snapshot tool.version metadata, and the published package can
 * never drift apart. npm always includes package.json in the published
 * tarball, and this module URL resolves to <package root>/package.json in
 * both the src/ (tsx) and dist/ (compiled) layouts.
 */
export const packageVersion = readPackageVersion();

function readPackageVersion(): string {
  const packageJsonUrl = new URL('../package.json', import.meta.url);
  const { version } = JSON.parse(readFileSync(packageJsonUrl, 'utf8')) as { version?: unknown };
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error(`repolock: missing or invalid "version" in ${packageJsonUrl.pathname}`);
  }
  return version;
}