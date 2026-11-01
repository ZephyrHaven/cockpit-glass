#!/usr/bin/env bash
# One command from any working directory: install tooling, build, validate, deploy.
set -euo pipefail
THEME_PROJECT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$THEME_PROJECT_DIR"
if [ ! -d node_modules/lightningcss ] || [ ! -d node_modules/fflate ]; then
  npm ci --ignore-scripts
fi
node scripts/deploy.mjs "$@"
