#!/usr/bin/env node
/**
 * CLI wrapper for detecting unused translation keys
 */
import { detectUnusedKeys } from '../lib/translation-qa';
import path = require('path');

async function main() {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'app');
  const messagesDir = path.join(projectRoot, 'locales');

  console.log('🔍 Scanning for unused translation keys...\n');

  const results = await detectUnusedKeys(srcDir, messagesDir);

  if (results.length === 0) {
    console.log('✅ No unused translation keys found!\n');
    process.exit(0);
  }

  console.warn('⚠️  Unused translation keys detected:\n');

  results.forEach(({ namespace, key, existsIn }) => {
    console.warn(`  ${namespace}:${key}`);
    console.warn(`    Exists in: ${existsIn.join(', ')}`);
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
