# Orchestration

Repolock is a local-first CLI. It does not call external services, collect telemetry,
or enforce remote policy. Agents can use it as a deterministic handoff artifact:

1. Run `repolock snapshot <repo>` at the start of a work cycle.
2. Review `.repolock/repolock.report.md` for warnings.
3. Make the intended code changes.
4. Run `repolock verify <repo>` before handing work back.
5. Treat failed findings as human-review blockers unless the policy drift was intentional.

## Inputs

- Repository root path.
- Optional `repolock.config.json` or `.repolock.json`.
- Optional CLI overrides for protected paths, required docs, and ignore coverage.

## Outputs

- `.repolock/repolock.snapshot.json`
- `.repolock/repolock.report.md`
- Optional verify report path via `--report`

## Agent Contract

- Keep snapshots in the working tree only when the maintainer wants policy artifacts committed.
- Do not treat Repolock as a replacement for CI, branch protection, or security review.
- Do not upload snapshots automatically; they can expose repository structure.
