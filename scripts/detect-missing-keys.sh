#!/usr/bin/env bash
#
# Detect Missing Translation Keys
#
# Scans all TypeScript files for translation keys that don't exist in translation files.
# Exits with code 1 if missing keys are found (CI failure), 0 otherwise.
#
# Usage:
#   ./scripts/detect-missing-keys.sh

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the TypeScript CLI wrapper
npx ts-node --transpile-only -P "$SCRIPT_DIR/tsconfig.json" "$SCRIPT_DIR/cli/detect-missing-keys.ts"
