# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-05-19

- Added `repolock snapshot` for local repository policy capture.
- Added `repolock verify` for drift detection against saved snapshots.
- Added JSON snapshots, markdown reports, fixtures, tests, and smoke checks.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Changed

- Refreshed the `tsx` development dependency lock to resolve
  [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr)
  in its transitive `esbuild` dependency.

### Fixed

- CLI `--version` and snapshot `tool.version` now read the package version
  from `package.json` instead of a hardcoded value, so released packages,
  CLI output, and snapshot metadata can no longer drift apart.

### Added

- Added a release-readiness checklist for local verification and package review.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/repolock/compare/...HEAD`
- Latest release:
  `https://github.com/rogerchappel/repolock/releases/latest`

Replace placeholder links once the first release tag exists.
