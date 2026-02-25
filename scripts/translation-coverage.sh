#!/usr/bin/env bash
#
# Translation Coverage Report
#
# Generates a coverage report showing translation completeness across languages.
# Reports key counts and coverage percentage for EN vs ES.
#
# Usage:
#   ./scripts/translation-coverage.sh

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run the TypeScript CLI wrapper
npx ts-node --transpile-only -P "$SCRIPT_DIR/tsconfig.json" "$SCRIPT_DIR/cli/translation-coverage.ts"
