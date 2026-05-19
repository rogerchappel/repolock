#!/usr/bin/env bash
set -euo pipefail

node ../dist/cli.js snapshot ../fixtures/basic-repo --output ../.tmp/example-basic
node ../dist/cli.js verify ../fixtures/basic-repo --snapshot ../.tmp/example-basic/repolock.snapshot.json
