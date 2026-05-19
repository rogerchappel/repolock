# Repolock PRD

Status: in-progress

## Summary

Repolock is a local-first repository policy snapshotter for developers and agents. It records the safety-critical shape of a repo - protected paths, package manager, test commands, branch defaults, ignore rules, and commit hygiene - then verifies later work against that snapshot before a human or agent ships.

## Problem

Agentic coding sessions often begin by rediscovering the same repository rules. Small drift in branch defaults, ignored files, scripts, or protected paths can make a routine patch risky. Teams need a deterministic, offline way to capture repo expectations and fail loudly when they change.

## Users

- Developers handing a repo to an autonomous coding agent.
- Maintainers who want a quick local safety gate before publishing.
- Agents that need a compact machine-readable repository contract.

## MVP

- CLI command to create a policy snapshot from a repository.
- CLI command to verify the current repository against a saved snapshot.
- JSON snapshot plus readable markdown report.
- Built-in checks for package scripts, lockfile family, protected paths, git default branch, ignore coverage, and required docs.
- Fixture-backed tests and smoke examples.

## Non-goals

- Remote policy enforcement.
- Secret scanning beyond obvious config shape warnings.
- Replacing CI or branch protection.

## Source Attribution

Inspired by common repo bootstrap checklists, OpenSSF Scorecard-style local checks, and the recurring need for agent-readable repo contracts. Reframed as a small deterministic local CLI rather than a hosted security scanner.

