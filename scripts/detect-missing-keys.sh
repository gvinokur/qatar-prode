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

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Run TypeScript utility
exec ts-node --project tsconfig.json -r tsconfig-paths/register <<'EOF'
import { detectMissingKeys } from './scripts/lib/translation-qa';

async function main() {
  const projectRoot = process.cwd();
  const srcDir = `${projectRoot}/src`;
  const messagesDir = `${projectRoot}/messages`;

  console.log('🔍 Scanning for missing translation keys...\n');

  const results = await detectMissingKeys(srcDir, messagesDir);

  if (results.length === 0) {
    console.log('✅ No missing translation keys found!\n');
    process.exit(0);
  }

  console.error('❌ Missing translation keys detected:\n');

  results.forEach(({ file, line, namespace, key }) => {
    console.error(`  ${file}:${line}`);
    console.error(`    Namespace: ${namespace}`);
    console.error(`    Key: ${key}`);
    console.error('');
  });

  console.error(`Total missing keys: ${results.length}\n`);
  console.error('Please add these keys to the appropriate translation files in messages/');

  process.exit(1);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
EOF
