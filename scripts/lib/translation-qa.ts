#!/usr/bin/env ts-node

/**
 * Translation QA Utilities
 *
 * Core logic for detecting missing and unused translation keys,
 * and generating coverage reports.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TranslationUsage {
  namespace: string;
  key: string;
  file: string;
  line: number;
}

export interface MissingKey {
  namespace: string;
  key: string;
  file: string;
  line: number;
  missingLocales: string[];
}

export interface UnusedKey {
  namespace: string;
  key: string;
  existsIn: string[]; // ['en', 'es']
}

export interface NamespaceCoverage {
  namespace: string;
  enKeys: number;    // Leaf key count in English
  esKeys: number;    // Leaf key count in Spanish
  coverage: number;  // Percentage (0-100)
  missingKeys: number;
  unusedKeys: number;
}

// ============================================================================
// 1. Extract Namespaces from File Content
// ============================================================================

/**
 * Extract namespace declarations from TypeScript/TSX file content.
 * Finds useTranslations('namespace') and getTranslations('namespace') patterns.
 *
 * @param content - File content to parse
 * @param filePath - Path to the file (for context)
 * @returns Map of variable name to namespace
 *
 * @example
 * const content = `const t = useTranslations('auth');`;
 * const namespaces = extractNamespaces(content, 'page.tsx');
 * // Returns: Map { 't' => 'auth' }
 */
export function extractNamespaces(content: string, filePath: string): Map<string, string> {
  const namespaces = new Map<string, string>();

  // Regex: const VAR = useTranslations('namespace') or const VAR = getTranslations('namespace')
  // Also matches await getTranslations('namespace')
  const namespacePattern = /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(['"`](\w+)['"`]\)/g;

  let match;
  while ((match = namespacePattern.exec(content)) !== null) {
    const varName = match[1];  // e.g., 't', 'tAuth', 'tCommon'
    const namespace = match[2]; // e.g., 'auth', 'common'
    namespaces.set(varName, namespace);
  }

  return namespaces;
}

// ============================================================================
// 2. Extract Translation Keys from File Content
// ============================================================================

/**
 * Extract translation key usage from TypeScript/TSX file content.
 * Finds t('key'), t("key"), t.rich('key') patterns.
 *
 * @param content - File content to parse
 * @param filePath - Path to the file (for line numbers)
 * @param namespaces - Map of variable names to namespaces
 * @returns Array of translation key usages
 *
 * @example
 * const content = `<Button>{t('login.submitButton')}</Button>`;
 * const usages = extractTranslationKeys(content, 'page.tsx', new Map([['t', 'auth']]));
 * // Returns: [{ namespace: 'auth', key: 'login.submitButton', file: 'page.tsx', line: 1 }]
 */
export function extractTranslationKeys(
  content: string,
  filePath: string,
  namespaces: Map<string, string>
): TranslationUsage[] {
  const usages: TranslationUsage[] = [];
  const lines = content.split('\n');

  // Regex: VAR('key') or VAR.rich('key') or VAR("key") or VAR.rich("key")
  // Matches t('key'), t.rich('key'), tAuth('key'), etc.
  const keyPattern = /\b(\w+)(?:\.rich)?\(['"`]([a-zA-Z0-9_.]+)['"`]\)/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = keyPattern.exec(line)) !== null) {
      const varName = match[1];  // e.g., 't', 'tAuth'
      const key = match[2];       // e.g., 'login.submitButton'

      // Check if this variable is a translation function
      const namespace = namespaces.get(varName);
      if (namespace) {
        usages.push({
          namespace,
          key,
          file: filePath,
          line: index + 1
        });
      }
    }

    // Reset regex state for next line
    keyPattern.lastIndex = 0;
  });

  return usages;
}

// ============================================================================
// 3. Check if Key Exists in JSON
// ============================================================================

/**
 * Check if a key exists in a JSON object (supports nested keys).
 *
 * @param key - Dot-notation key (e.g., 'auth.login.email.label')
 * @param jsonData - JSON object to search
 * @returns true if key exists, false otherwise
 *
 * @example
 * const json = { auth: { login: { email: { label: 'Email' } } } };
 * checkKeyExists('auth.login.email.label', json); // true
 * checkKeyExists('auth.login.password', json);    // false
 */
export function checkKeyExists(key: string, jsonData: any): boolean {
  const parts = key.split('.');
  let current = jsonData;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }

  return true;
}

// ============================================================================
// 4. Extract All Keys from JSON (Flatten to Dot-Notation)
// ============================================================================

/**
 * Extract all keys from a JSON object as a flat array of dot-notation strings.
 * Only returns leaf keys (keys with non-object values).
 *
 * @param jsonData - JSON object to flatten
 * @param prefix - Current key prefix (used for recursion)
 * @returns Array of dot-notation keys
 *
 * @example
 * const json = { auth: { login: { email: 'Email', password: 'Password' } } };
 * extractAllKeys(json);
 * // Returns: ['auth.login.email', 'auth.login.password']
 */
export function extractAllKeys(jsonData: any, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(jsonData)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse for nested objects
      keys.push(...extractAllKeys(value, fullKey));
    } else {
      // Leaf node - this is a translatable key
      keys.push(fullKey);
    }
  }

  return keys;
}

// ============================================================================
// 5. Count Leaf Keys in JSON
// ============================================================================

/**
 * Count the number of leaf keys (keys with non-object values) in a JSON object.
 *
 * @param jsonData - JSON object to count keys in
 * @returns Number of leaf keys
 *
 * @example
 * const json = { auth: { login: { email: 'Email', password: 'Password' } } };
 * countLeafKeys(json); // Returns: 2
 */
export function countLeafKeys(jsonData: any): number {
  return extractAllKeys(jsonData).length;
}

// ============================================================================
// 6. Calculate Coverage Percentage
// ============================================================================

/**
 * Calculate coverage percentage between two key counts.
 * Formula: (min / max) * 100
 *
 * @param enKeys - Number of keys in English
 * @param esKeys - Number of keys in Spanish
 * @returns Coverage percentage (0-100)
 *
 * @example
 * calculateCoverage(100, 100); // 100%
 * calculateCoverage(100, 80);  // 80%
 * calculateCoverage(50, 60);   // 83%
 */
export function calculateCoverage(enKeys: number, esKeys: number): number {
  if (enKeys === 0 && esKeys === 0) return 100; // Both empty = 100% match
  if (enKeys === 0 || esKeys === 0) return 0;   // One empty = 0% match

  const min = Math.min(enKeys, esKeys);
  const max = Math.max(enKeys, esKeys);
  return Math.round((min / max) * 100);
}

// ============================================================================
// Helper: Find TypeScript Files Recursively
// ============================================================================

/**
 * Recursively find all .ts and .tsx files in a directory.
 * Excludes node_modules, .next, __tests__, coverage, dist.
 */
function findTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip excluded directories
      if (['node_modules', '.next', '__tests__', 'coverage', 'dist', '.git'].includes(file)) {
        return;
      }
      findTsFiles(filePath, fileList);
    } else if (stat.isFile()) {
      // Only include .ts and .tsx files
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// ============================================================================
// 7. Main: Detect Missing Translation Keys
// ============================================================================

/**
 * Scan codebase for translation key usage and detect missing keys in JSON files.
 *
 * @param rootPath - Project root path
 * @param localesPath - Path to locales directory
 * @returns Array of missing keys
 */
export async function detectMissingKeys(
  rootPath: string,
  localesPath: string
): Promise<MissingKey[]> {
  const missingKeys: MissingKey[] = [];

  // Find all TypeScript files (exclude node_modules, .next, __tests__, coverage)
  const files = findTsFiles(rootPath);

  console.log(`🔍 Scanning ${files.length} files for translation key usage...`);

  // Process each file
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(rootPath, file);

    // Extract namespaces from this file
    const namespaces = extractNamespaces(content, relativePath);

    if (namespaces.size === 0) {
      continue; // No translation usage in this file
    }

    // Extract translation keys from this file
    const usages = extractTranslationKeys(content, relativePath, namespaces);

    // Check each usage against JSON files
    for (const usage of usages) {
      const enPath = path.join(localesPath, 'en', `${usage.namespace}.json`);
      const esPath = path.join(localesPath, 'es', `${usage.namespace}.json`);

      const missingLocales: string[] = [];

      // Check English
      if (!fs.existsSync(enPath)) {
        missingLocales.push('en');
      } else {
        const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
        if (!checkKeyExists(usage.key, enData)) {
          missingLocales.push('en');
        }
      }

      // Check Spanish
      if (!fs.existsSync(esPath)) {
        missingLocales.push('es');
      } else {
        const esData = JSON.parse(fs.readFileSync(esPath, 'utf-8'));
        if (!checkKeyExists(usage.key, esData)) {
          missingLocales.push('es');
        }
      }

      // Record if missing in any locale
      if (missingLocales.length > 0) {
        missingKeys.push({
          namespace: usage.namespace,
          key: usage.key,
          file: usage.file,
          line: usage.line,
          missingLocales
        });
      }
    }
  }

  return missingKeys;
}

// ============================================================================
// 8. Main: Detect Unused Translation Keys
// ============================================================================

/**
 * Find translation keys that exist in JSON files but are never used in the codebase.
 *
 * @param rootPath - Project root path
 * @param localesPath - Path to locales directory
 * @returns Array of unused keys
 */
export async function detectUnusedKeys(
  rootPath: string,
  localesPath: string
): Promise<UnusedKey[]> {
  const unusedKeys: UnusedKey[] = [];

  // Load all translation keys from JSON files
  const namespaces = ['en', 'es'].flatMap(locale => {
    const localePath = path.join(localesPath, locale);
    if (!fs.existsSync(localePath)) return [];

    return fs.readdirSync(localePath)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  });

  // Get unique namespace names
  const uniqueNamespaces = [...new Set(namespaces)];

  console.log(`🔍 Scanning ${uniqueNamespaces.length} namespaces for unused keys...`);

  // For each namespace, load keys and check usage
  for (const namespace of uniqueNamespaces) {
    const enPath = path.join(localesPath, 'en', `${namespace}.json`);
    const esPath = path.join(localesPath, 'es', `${namespace}.json`);

    // Load keys from both locales
    const allKeys = new Set<string>();

    if (fs.existsSync(enPath)) {
      const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
      const enKeys = extractAllKeys(enData);
      enKeys.forEach(key => allKeys.add(key));
    }

    if (fs.existsSync(esPath)) {
      const esData = JSON.parse(fs.readFileSync(esPath, 'utf-8'));
      const esKeys = extractAllKeys(esData);
      esKeys.forEach(key => allKeys.add(key));
    }

    // Read all source files
    const files = findTsFiles(rootPath);

    const allContent = files
      .map(file => fs.readFileSync(file, 'utf-8'))
      .join('\n');

    // Check each key for usage
    for (const key of allKeys) {
      // Search for t('key') or t.rich('key') or t("key") or t.rich("key")
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const usagePattern = new RegExp(`\\bt(?:\\.rich)?\\(['\"\`]${escapedKey}['\"\`]\\)`, 'm');

      if (!usagePattern.test(allContent)) {
        // Key not used anywhere
        const existsIn: string[] = [];
        if (fs.existsSync(enPath)) {
          const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
          if (checkKeyExists(key, enData)) existsIn.push('en');
        }
        if (fs.existsSync(esPath)) {
          const esData = JSON.parse(fs.readFileSync(esPath, 'utf-8'));
          if (checkKeyExists(key, esData)) existsIn.push('es');
        }

        unusedKeys.push({
          namespace,
          key,
          existsIn
        });
      }
    }
  }

  return unusedKeys;
}

// ============================================================================
// 9. Generate Coverage Report
// ============================================================================

/**
 * Generate markdown table with translation coverage metrics.
 *
 * @param rootPath - Project root path
 * @param localesPath - Path to locales directory
 * @returns Markdown formatted report
 */
export async function generateCoverageReport(
  rootPath: string,
  localesPath: string
): Promise<string> {
  const coverages: NamespaceCoverage[] = [];

  // Get all namespace files
  const enPath = path.join(localesPath, 'en');
  const esPath = path.join(localesPath, 'es');

  const namespaces = fs.existsSync(enPath)
    ? fs.readdirSync(enPath).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
    : [];

  // Get missing and unused keys
  const missingKeys = await detectMissingKeys(rootPath, localesPath);
  const unusedKeys = await detectUnusedKeys(rootPath, localesPath);

  // Calculate coverage for each namespace
  for (const namespace of namespaces) {
    const enFile = path.join(enPath, `${namespace}.json`);
    const esFile = path.join(esPath, `${namespace}.json`);

    const enKeys = fs.existsSync(enFile)
      ? countLeafKeys(JSON.parse(fs.readFileSync(enFile, 'utf-8')))
      : 0;

    const esKeys = fs.existsSync(esFile)
      ? countLeafKeys(JSON.parse(fs.readFileSync(esFile, 'utf-8')))
      : 0;

    const coverage = calculateCoverage(enKeys, esKeys);
    const missing = missingKeys.filter(k => k.namespace === namespace).length;
    const unused = unusedKeys.filter(k => k.namespace === namespace).length;

    coverages.push({
      namespace,
      enKeys,
      esKeys,
      coverage,
      missingKeys: missing,
      unusedKeys: unused
    });
  }

  // Generate markdown report
  const now = new Date().toISOString();
  const totalEnKeys = coverages.reduce((sum, c) => sum + c.enKeys, 0);
  const totalEsKeys = coverages.reduce((sum, c) => sum + c.esKeys, 0);
  const totalMissing = missingKeys.length;
  const totalUnused = unusedKeys.length;

  const report = `# Translation Coverage Report

Generated: ${now}

## Summary
- Total Namespaces: ${coverages.length}
- Total Keys (EN): ${totalEnKeys.toLocaleString()}
- Total Keys (ES): ${totalEsKeys.toLocaleString()}
- Missing Keys: ${totalMissing}
- Unused Keys: ${totalUnused}

## By Namespace

| Namespace | EN Keys | ES Keys | Coverage | Missing | Unused |
|-----------|---------|---------|----------|---------|--------|
${coverages.map(c =>
  `| ${c.namespace} | ${c.enKeys} | ${c.esKeys} | ${c.coverage}% | ${c.missingKeys} | ${c.unusedKeys} |`
).join('\n')}

## ${totalMissing === 0 ? '✅ Status: PASS' : '❌ Status: FAIL'}
${totalMissing === 0
  ? 'All namespaces have complete translations.'
  : `Found ${totalMissing} missing translation keys that must be added.`}

## Recommendations
${totalUnused > 0
  ? `- Review ${totalUnused} unused keys for potential removal`
  : '- No unused keys found'}
- Keep translation files lean and maintainable
`;

  return report;
}

// ============================================================================
// CLI Entry Points
// ============================================================================

async function main() {
  const command = process.argv[2];
  const rootPath = process.cwd();
  const localesPath = path.join(rootPath, 'locales');

  try {
    switch (command) {
      case 'detect-missing-keys': {
        const missing = await detectMissingKeys(rootPath, localesPath);

        if (missing.length === 0) {
          console.log('\n✅ No missing translation keys found!\n');
          process.exit(0);
        } else {
          console.log('\n❌ MISSING KEYS FOUND:\n');

          // Group by namespace
          const byNamespace = missing.reduce((acc, key) => {
            if (!acc[key.namespace]) acc[key.namespace] = [];
            acc[key.namespace].push(key);
            return acc;
          }, {} as Record<string, MissingKey[]>);

          for (const [namespace, keys] of Object.entries(byNamespace)) {
            console.log(`Namespace: ${namespace}`);
            keys.forEach(key => {
              console.log(`  File: ${key.file}:${key.line}`);
              console.log(`  Key: ${key.key}`);
              console.log(`  Missing in: ${key.missingLocales.join(', ')}\n`);
            });
          }

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`Summary: ${missing.length} missing keys found across ${Object.keys(byNamespace).length} namespaces\n`);
          process.exit(1);
        }
      }

      case 'detect-unused-keys': {
        const unused = await detectUnusedKeys(rootPath, localesPath);

        if (unused.length === 0) {
          console.log('\n✅ No unused translation keys found!\n');
          process.exit(0);
        } else {
          console.log('\n⚠️  UNUSED KEYS FOUND:\n');

          // Group by namespace
          const byNamespace = unused.reduce((acc, key) => {
            if (!acc[key.namespace]) acc[key.namespace] = [];
            acc[key.namespace].push(key);
            return acc;
          }, {} as Record<string, UnusedKey[]>);

          for (const [namespace, keys] of Object.entries(byNamespace)) {
            console.log(`Namespace: ${namespace} (${keys.length} unused keys)`);
            keys.forEach(key => {
              console.log(`  - ${key.key}`);
            });
            console.log();
          }

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`Summary: ${unused.length} unused keys across ${Object.keys(byNamespace).length} namespaces`);
          console.log('Note: These are warnings only. Review before removing.\n');
          process.exit(0); // Exit 0 (warnings only)
        }
      }

      case 'generate-coverage': {
        const report = await generateCoverageReport(rootPath, localesPath);
        console.log(report);
        process.exit(0);
      }

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Usage: tsx translation-qa.ts <command>');
        console.error('Commands: detect-missing-keys, detect-unused-keys, generate-coverage');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run CLI if executed directly
if (require.main === module) {
  main();
}
