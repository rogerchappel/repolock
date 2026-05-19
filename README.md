# Repolock

Repolock is a local-first repository policy snapshotter for developers and
agents. It records the safety-critical shape of a repository, then verifies
later work against that saved contract before a human or agent ships.

It focuses on deterministic local facts:

- package manager and lockfile family
- package scripts
- git default and current branch
- required docs
- pull request template presence
- .gitignore coverage for generated files and common secret paths
- protected paths that deserve review when changed

## Install

```bash
npm install
npm run build
```

Run from source:

```bash
node dist/cli.js --help
```

## Snapshot

```bash
repolock snapshot .
```

By default this writes:

- `.repolock/repolock.snapshot.json`
- `.repolock/repolock.report.md`

Use another output directory when you do not want artifacts in the target repo:

```bash
repolock snapshot fixtures/basic-repo --output .tmp/basic-policy
```

## Verify

```bash
repolock verify . --snapshot .repolock/repolock.snapshot.json
```

Write a readable verification report:

```bash
repolock verify . --report .repolock/verify.md
```

Print full JSON findings:

```bash
repolock verify . --json
```

## Configuration

Repolock looks for `repolock.config.json` or `.repolock.json` in the target
repository. CLI flags override config values.

```json
{
  "outputDir": ".repolock",
  "protectedPaths": [
    ".github/workflows/",
    "package.json",
    "scripts/validate.sh",
    "SECURITY.md",
    "AGENTS.md"
  ],
  "requiredDocs": [
    "README.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "LICENSE",
    ".github/pull_request_template.md"
  ],
  "ignoreCoverage": [
    "node_modules/",
    "dist/",
    ".env",
    ".tmp/"
  ]
}
```

Equivalent CLI overrides can be repeated:

```bash
repolock snapshot . \
  --protected-path package.json \
  --required-doc SECURITY.md \
  --ignore-coverage .env
```

## Local Checks

```bash
npm run check
npm test
npm run build
npm run smoke
bash scripts/validate.sh
```

## Source Attribution

Inspired by common repo bootstrap checklists, OpenSSF Scorecard-style local
checks, and the recurring need for agent-readable repo contracts. Reframed as a
small deterministic local CLI rather than a hosted security scanner.
