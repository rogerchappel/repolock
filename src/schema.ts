export const snapshotSchemaVersion = 1;

export type LockfileFamily = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'none' | 'multiple';

export type RepositoryPolicySnapshot = {
  schemaVersion: number;
  tool: {
    name: 'repolock';
    version: string;
  };
  generatedAt: string;
  repository: {
    rootName: string;
    defaultBranch: string | null;
    currentBranch: string | null;
  };
  packageManager: {
    family: LockfileFamily;
    lockfiles: string[];
    packageManagerField: string | null;
  };
  packageScripts: Record<string, string>;
  requiredDocs: Record<string, boolean>;
  ignoreRules: {
    gitignoreExists: boolean;
    entries: string[];
    covers: Record<string, boolean>;
  };
  protectedPaths: string[];
  commitHygiene: {
    conventionalCommitTypes: string[];
    hasPullRequestTemplate: boolean;
    hasContributingGuide: boolean;
    hasSecurityPolicy: boolean;
  };
  warnings: string[];
};

export type SnapshotOptions = {
  protectedPaths?: string[];
  requiredDocs?: string[];
  ignoreCoverage?: string[];
};

export type VerifyStatus = 'pass' | 'fail' | 'warn';

export type VerifyFinding = {
  status: VerifyStatus;
  code: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
};

export type VerifyResult = {
  ok: boolean;
  findings: VerifyFinding[];
};
