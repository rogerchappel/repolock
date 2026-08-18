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

### Git branch detection

The snapshot records the default branch separately from the currently checked-out
branch. Repolock first reads `origin/HEAD`. When that symbolic ref is unavailable
(for example, in an offline or locally created repository), it checks for `main`
and then `master`, considering both local branches and existing `origin` refs. It
does not assume that the current branch is the default. If none of those refs can
identify a default branch, including outside a Git repository, the snapshot
records the default branch as `null` (`unknown` in the readable report).

By default this writes:

- `.repolock/repolock.snapshot.json`
- `.repolock/repolock.report.md`

The command prints a JSON result whose `snapshot` and `report` fields contain
the absolute paths actually written. This applies to the default directory,
configured `outputDir`, and `--output`, so callers can consume the artifacts
without reconstructing their locations.

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

### Path resolution

- The repository argument is resolved from the caller's current working directory.
- A relative `outputDir` in repository configuration is resolved from the target
  repository root. An absolute `outputDir` is used unchanged.
- CLI path options (`--config`, `--output`, `--snapshot`, and `--report`) are
  resolved from the caller's current working directory. Absolute paths are used
  unchanged.
- `snapshot --output` takes precedence over the configured `outputDir`, including
  when the CLI value is relative.

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

Ignore coverage follows the relevant `.gitignore` matching rules for exact
file and directory names, root-anchored patterns, `*`, `**`, and `?` wildcards,
and ordered negations. Coverage checks whether the configured path itself is
ignored; they do not infer coverage from arbitrary text prefixes or inspect
descendant files to prove broader directory contents are ignored.

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


## Release readiness

Use [docs/release-readiness.md](docs/release-readiness.md) before opening release PRs or tagging a release.

## Package contents

Run `npm run package:smoke` before release. The command builds the package,
checks every declared `main`, `bin`, and `exports` entrypoint against the packed
tarball, installs that tarball in a temporary consumer project, imports the
package root, and executes the packed `repolock --help` CLI. It fails before
release if the published artifact cannot be consumed.
