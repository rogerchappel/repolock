#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
example_output="$repo_root/.tmp/example-basic/repolock.snapshot.json"
unrelated_cwd="$(mktemp -d)"
trap 'rm -rf -- "$unrelated_cwd"' EXIT

rm -rf -- "$repo_root/.tmp/example-basic"

(
  cd "$repo_root"
  bash examples/snapshot-basic.sh
)
test -f "$example_output"

rm -rf -- "$repo_root/.tmp/example-basic"

(
  cd "$unrelated_cwd"
  bash "$repo_root/examples/snapshot-basic.sh"
)
test -f "$example_output"
