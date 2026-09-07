import type { RepolockConfig } from './config.js';
import type { RepositoryPolicySnapshot } from './schema.js';
import { snapshotSchemaVersion } from './schema.js';

type JsonObject = Record<string, unknown>;

export function validateConfig(value: unknown, filePath: string): RepolockConfig {
  const config = object(value, filePath, 'config');
  optionalString(config, 'outputDir', filePath);
  for (const field of ['protectedPaths', 'requiredDocs', 'ignoreCoverage'] as const) {
    if (config[field] !== undefined) stringArray(config[field], filePath, field);
  }
  return config as RepolockConfig;
}

export function validateSnapshot(value: unknown, filePath: string): RepositoryPolicySnapshot {
  const snapshot = object(value, filePath, 'snapshot');
  number(snapshot.schemaVersion, filePath, 'schemaVersion');
  if (snapshot.schemaVersion !== snapshotSchemaVersion) {
    throw new Error(`${filePath}: unsupported schemaVersion ${JSON.stringify(snapshot.schemaVersion)} (expected ${snapshotSchemaVersion})`);
  }
  const tool = object(snapshot.tool, filePath, 'tool');
  string(tool.name, filePath, 'tool.name');
  if (tool.name !== 'repolock') {
    throw new Error(`${filePath}: unexpected tool.name ${JSON.stringify(tool.name)} (expected "repolock")`);
  }
  string(tool.version, filePath, 'tool.version');
  string(snapshot.generatedAt, filePath, 'generatedAt');
  if (!Number.isFinite(Date.parse(snapshot.generatedAt))) {
    throw new Error(`${filePath}: malformed generatedAt ${JSON.stringify(snapshot.generatedAt)} (expected an ISO 8601 timestamp)`);
  }

  const repository = object(snapshot.repository, filePath, 'repository');
  string(repository.rootName, filePath, 'repository.rootName');
  nullableString(repository.defaultBranch, filePath, 'repository.defaultBranch');
  nullableString(repository.currentBranch, filePath, 'repository.currentBranch');

  const packageManager = object(snapshot.packageManager, filePath, 'packageManager');
  string(packageManager.family, filePath, 'packageManager.family');
  stringArray(packageManager.lockfiles, filePath, 'packageManager.lockfiles');
  nullableString(packageManager.packageManagerField, filePath, 'packageManager.packageManagerField');
  stringRecord(snapshot.packageScripts, filePath, 'packageScripts');
  booleanRecord(snapshot.requiredDocs, filePath, 'requiredDocs');

  const ignoreRules = object(snapshot.ignoreRules, filePath, 'ignoreRules');
  boolean(ignoreRules.gitignoreExists, filePath, 'ignoreRules.gitignoreExists');
  stringArray(ignoreRules.entries, filePath, 'ignoreRules.entries');
  booleanRecord(ignoreRules.covers, filePath, 'ignoreRules.covers');
  stringArray(snapshot.protectedPaths, filePath, 'protectedPaths');

  const hygiene = object(snapshot.commitHygiene, filePath, 'commitHygiene');
  stringArray(hygiene.conventionalCommitTypes, filePath, 'commitHygiene.conventionalCommitTypes');
  boolean(hygiene.hasPullRequestTemplate, filePath, 'commitHygiene.hasPullRequestTemplate');
  boolean(hygiene.hasContributingGuide, filePath, 'commitHygiene.hasContributingGuide');
  boolean(hygiene.hasSecurityPolicy, filePath, 'commitHygiene.hasSecurityPolicy');
  stringArray(snapshot.warnings, filePath, 'warnings');
  return snapshot as RepositoryPolicySnapshot;
}

function fail(filePath: string, field: string, expectation: string): never {
  throw new Error(`${filePath}: ${field} must be ${expectation}`);
}

function object(value: unknown, filePath: string, field: string): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(filePath, field, 'an object');
  return value as JsonObject;
}

function string(value: unknown, filePath: string, field: string): asserts value is string {
  if (typeof value !== 'string') fail(filePath, field, 'a string');
}

function optionalString(value: JsonObject, field: string, filePath: string): void {
  if (value[field] !== undefined) string(value[field], filePath, field);
}

function nullableString(value: unknown, filePath: string, field: string): void {
  if (value !== null) string(value, filePath, field);
}

function number(value: unknown, filePath: string, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(filePath, field, 'a finite number');
}

function boolean(value: unknown, filePath: string, field: string): void {
  if (typeof value !== 'boolean') fail(filePath, field, 'a boolean');
}

function stringArray(value: unknown, filePath: string, field: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) fail(filePath, field, 'an array of strings');
}

function stringRecord(value: unknown, filePath: string, field: string): void {
  const record = object(value, filePath, field);
  if (Object.values(record).some((item) => typeof item !== 'string')) fail(filePath, field, 'an object with string values');
}

function booleanRecord(value: unknown, filePath: string, field: string): void {
  const record = object(value, filePath, field);
  if (Object.values(record).some((item) => typeof item !== 'boolean')) fail(filePath, field, 'an object with boolean values');
}
