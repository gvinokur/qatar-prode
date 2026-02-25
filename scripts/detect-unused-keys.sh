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

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Run TypeScript utility
exec ts-node --project tsconfig.json -r tsconfig-paths/register <<'EOF'
import { detectUnusedKeys } from './scripts/lib/translation-qa';

async function main() {
  const projectRoot = process.cwd();
  const srcDir = `${projectRoot}/src`;
  const messagesDir = `${projectRoot}/messages`;

  console.log('🔍 Scanning for unused translation keys...\n');

  const results = await detectUnusedKeys(srcDir, messagesDir);

  if (results.length === 0) {
    console.log('✅ No unused translation keys found!\n');
    process.exit(0);
  }

  console.warn('⚠️  Unused translation keys detected:\n');

  results.forEach(({ namespace, key }) => {
    console.warn(`  ${namespace}:${key}`);
  });

  console.warn(`\nTotal unused keys: ${results.length}`);
  console.warn('\nThese keys exist in translation files but are never used in the codebase.');
  console.warn('Consider removing them during quarterly cleanup (see docs/i18n-guide.md).\n');

  // Exit 0 - this is a warning, not an error
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
EOF
