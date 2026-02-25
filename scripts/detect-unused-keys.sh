#!/usr/bin/env bash
#
# Detect Unused Translation Keys
#
# Scans translation files for keys that are never used in the codebase.
# Exits with code 0 (warning only, not a CI failure).
#
# Usage:
#   ./scripts/detect-unused-keys.sh

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the TypeScript CLI wrapper
npx ts-node --transpile-only -P "$SCRIPT_DIR/tsconfig.json" "$SCRIPT_DIR/cli/detect-unused-keys.ts"
