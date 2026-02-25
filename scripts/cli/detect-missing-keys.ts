#!/usr/bin/env node
/**
 * CLI wrapper for detecting missing translation keys
 */
import { detectMissingKeys } from '../lib/translation-qa';
import { join } from 'path';

async function main() {
  const projectRoot = process.cwd();
  const srcDir = join(projectRoot, 'app');
  const messagesDir = join(projectRoot, 'locales');

  console.log('🔍 Scanning for missing translation keys...\n');

  const results = await detectMissingKeys(srcDir, messagesDir);

  if (results.length === 0) {
    console.log('✅ No missing translation keys found!\n');
    process.exit(0);
  }

  console.error('❌ Missing translation keys detected:\n');

  results.forEach(({ file, line, namespace, key, missingLocales }) => {
    console.error(`  ${file}:${line}`);
    console.error(`    Namespace: ${namespace}`);
    console.error(`    Key: ${key}`);
    console.error(`    Missing in: ${missingLocales.join(', ')}`);
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
