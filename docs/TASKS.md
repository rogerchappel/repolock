# Repolock Tasks

## MVP

- [x] Scaffold an OSS TypeScript CLI package from StackForge.
- [x] Preserve the source PRD in `docs/PRD.md`.
- [x] Capture package manager and lockfile policy.
- [x] Capture package scripts.
- [x] Capture required docs and pull request template presence.
- [x] Capture branch defaults and current branch when git metadata exists.
- [x] Capture .gitignore coverage for safety-critical generated and secret paths.
- [x] Capture protected paths for review-sensitive files.
- [x] Verify current repository state against a saved snapshot.
- [x] Emit JSON snapshots and readable markdown reports.
- [x] Add fixture-backed tests and a CLI smoke script.
- [x] Document local usage, security posture, and contribution flow.

## Follow-up

- [ ] Add optional commit history checks for Conventional Commit prefixes.
- [ ] Add configurable severity levels per policy item.
- [ ] Add JSON schema publication for `repolock.snapshot.json`.
- [ ] Add richer examples for non-Node repositories.
