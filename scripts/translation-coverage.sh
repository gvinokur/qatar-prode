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

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Run TypeScript utility
exec ts-node --project tsconfig.json -r tsconfig-paths/register <<'EOF'
import { generateCoverageReport } from './scripts/lib/translation-qa';

async function main() {
  const projectRoot = process.cwd();
  const messagesDir = `${projectRoot}/messages`;

  console.log('📊 Generating translation coverage report...\n');

  const report = await generateCoverageReport(messagesDir);

  console.log('='.repeat(60));
  console.log('Translation Coverage Report');
  console.log('='.repeat(60));
  console.log('');

  report.forEach(({ namespace, enKeys, esKeys, coverage }) => {
    const status = coverage === 100 ? '✅' : coverage >= 80 ? '⚠️ ' : '❌';
    console.log(`${status} ${namespace}`);
    console.log(`   EN: ${enKeys} keys`);
    console.log(`   ES: ${esKeys} keys`);
    console.log(`   Coverage: ${coverage}%`);
    console.log('');
  });

  const totalEnKeys = report.reduce((sum, r) => sum + r.enKeys, 0);
  const totalEsKeys = report.reduce((sum, r) => sum + r.esKeys, 0);
  const avgCoverage = report.length > 0
    ? Math.round(report.reduce((sum, r) => sum + r.coverage, 0) / report.length)
    : 100;

  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total EN keys: ${totalEnKeys}`);
  console.log(`Total ES keys: ${totalEsKeys}`);
  console.log(`Average coverage: ${avgCoverage}%`);
  console.log('');

  if (avgCoverage < 100) {
    console.warn('⚠️  Some namespaces have incomplete translations.');
    console.warn('Review the report above and add missing translations.\n');
  } else {
    console.log('✅ All translations are complete!\n');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
EOF
