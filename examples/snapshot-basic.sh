#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"

node "$repo_root/dist/cli.js" snapshot "$repo_root/fixtures/basic-repo" --output "$repo_root/.tmp/example-basic"
node "$repo_root/dist/cli.js" verify "$repo_root/fixtures/basic-repo" --snapshot "$repo_root/.tmp/example-basic/repolock.snapshot.json"
