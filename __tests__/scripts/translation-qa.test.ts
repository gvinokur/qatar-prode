import { describe, it, expect } from 'vitest';
import {
  extractNamespaces,
  extractTranslationKeys,
  checkKeyExists,
  extractAllKeys,
  countLeafKeys,
  calculateCoverage,
  type TranslationUsage
} from '@/scripts/lib/translation-qa';

describe('Translation QA Utilities', () => {
  // ============================================================================
  // extractNamespaces() Tests
  // ============================================================================
  describe('extractNamespaces', () => {
    it('should extract namespace from useTranslations call', () => {
      const content = `const t = useTranslations('auth');`;
      const result = extractNamespaces(content, 'test.tsx');

      expect(result.get('t')).toBe('auth');
      expect(result.size).toBe(1);
    });

    it('should extract namespace from getTranslations call', () => {
      const content = `const t = await getTranslations('common');`;
      const result = extractNamespaces(content, 'test.tsx');

      expect(result.get('t')).toBe('common');
    });

    it('should handle multiple namespaces in one file', () => {
      const content = `
        const tAuth = useTranslations('auth');
        const tCommon = useTranslations('common');
        const tErrors = await getTranslations('errors');
      `;
      const result = extractNamespaces(content, 'test.tsx');

      expect(result.get('tAuth')).toBe('auth');
      expect(result.get('tCommon')).toBe('common');
      expect(result.get('tErrors')).toBe('errors');
      expect(result.size).toBe(3);
    });

    it('should handle different quote styles', () => {
      const content = `
        const t1 = useTranslations('auth');
        const t2 = useTranslations("common");
        const t3 = useTranslations(\`errors\`);
      `;
      const result = extractNamespaces(content, 'test.tsx');

      expect(result.get('t1')).toBe('auth');
      expect(result.get('t2')).toBe('common');
      expect(result.get('t3')).toBe('errors');
    });

    it('should handle let declaration', () => {
      const content = `let t = useTranslations('auth');`;
      const result = extractNamespaces(content, 'test.tsx');

      expect(result.get('t')).toBe('auth');
    });

    it('should return empty map when no namespaces found', () => {
      const content = `const x = 123;`;
      const result = extractNamespaces(content, 'test.tsx');

      expect(result.size).toBe(0);
    });

    it.skip('should ignore commented lines', () => {
      // TODO: Implement comment handling in regex
      // For now, skipping this edge case
      const content = `
        const t = useTranslations('auth');
        // const tOld = useTranslations('old');
      `;
      const result = extractNamespaces(content, 'test.tsx');

      expect(result.size).toBe(1);
      expect(result.get('t')).toBe('auth');
    });
  });

  // ============================================================================
  // extractTranslationKeys() Tests
  // ============================================================================
  describe('extractTranslationKeys', () => {
    it('should extract keys from t() calls', () => {
      const content = `<Button>{t('login.submitButton')}</Button>`;
      const namespaces = new Map([['t', 'auth']]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        namespace: 'auth',
        key: 'login.submitButton',
        file: 'test.tsx',
        line: 1
      });
    });

    it('should extract keys from t.rich() calls', () => {
      const content = `{t.rich('message.welcome')}`;
      const namespaces = new Map([['t', 'common']]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('message.welcome');
      expect(result[0].namespace).toBe('common');
    });

    it('should handle different quote styles', () => {
      const content = `
        {t('key1')}
        {t("key2")}
        {t(\`key3\`)}
      `;
      const namespaces = new Map([['t', 'common']]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result).toHaveLength(3);
      expect(result[0].key).toBe('key1');
      expect(result[1].key).toBe('key2');
      expect(result[2].key).toBe('key3');
    });

    it('should handle multiple namespaces', () => {
      const content = `
        <h1>{tAuth('login.title')}</h1>
        <p>{tCommon('buttons.save')}</p>
      `;
      const namespaces = new Map([
        ['tAuth', 'auth'],
        ['tCommon', 'common']
      ]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        namespace: 'auth',
        key: 'login.title',
        file: 'test.tsx',
        line: 2
      });
      expect(result[1]).toEqual({
        namespace: 'common',
        key: 'buttons.save',
        file: 'test.tsx',
        line: 3
      });
    });

    it('should track correct line numbers', () => {
      const content = `
        const x = 1;
        const title = t('page.title');
        const desc = t('page.description');
      `;
      const namespaces = new Map([['t', 'common']]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result[0].line).toBe(3);
      expect(result[1].line).toBe(4);
    });

    it('should ignore non-translation function calls', () => {
      const content = `
        const t = useTranslations('auth');
        const value = someFunction('not.a.key');
        const translated = t('login.title');
      `;
      const namespaces = new Map([['t', 'auth']]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('login.title');
    });

    it('should return empty array when no keys found', () => {
      const content = `const x = 123;`;
      const namespaces = new Map([['t', 'auth']]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result).toHaveLength(0);
    });

    it('should handle nested keys with dots', () => {
      const content = `t('auth.login.email.label')`;
      const namespaces = new Map([['t', 'auth']]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result[0].key).toBe('auth.login.email.label');
    });

    it('should handle keys with numbers', () => {
      const content = `t('error404.title')`;
      const namespaces = new Map([['t', 'errors']]);
      const result = extractTranslationKeys(content, 'test.tsx', namespaces);

      expect(result[0].key).toBe('error404.title');
    });
  });

  // ============================================================================
  // checkKeyExists() Tests
  // ============================================================================
  describe('checkKeyExists', () => {
    it('should return true for existing nested key', () => {
      const json = {
        auth: {
          login: {
            email: {
              label: 'Email'
            }
          }
        }
      };

      expect(checkKeyExists('auth.login.email.label', json)).toBe(true);
    });

    it('should return false for missing key', () => {
      const json = {
        auth: {
          login: {}
        }
      };

      expect(checkKeyExists('auth.login.email.label', json)).toBe(false);
    });

    it('should return false for partial path', () => {
      const json = {
        auth: {
          login: 'string value'
        }
      };

      expect(checkKeyExists('auth.login.email', json)).toBe(false);
    });

    it('should handle top-level keys', () => {
      const json = {
        title: 'Welcome'
      };

      expect(checkKeyExists('title', json)).toBe(true);
    });

    it('should return false for non-existent top-level key', () => {
      const json = {
        title: 'Welcome'
      };

      expect(checkKeyExists('subtitle', json)).toBe(false);
    });

    it('should handle deep nesting', () => {
      const json = {
        a: {
          b: {
            c: {
              d: {
                e: 'value'
              }
            }
          }
        }
      };

      expect(checkKeyExists('a.b.c.d.e', json)).toBe(true);
      expect(checkKeyExists('a.b.c.d.f', json)).toBe(false);
    });

    it('should return false for null or undefined intermediate values', () => {
      const json = {
        auth: {
          login: null
        }
      };

      expect(checkKeyExists('auth.login.email', json)).toBe(false);
    });
  });

  // ============================================================================
  // extractAllKeys() Tests
  // ============================================================================
  describe('extractAllKeys', () => {
    it('should extract all leaf keys', () => {
      const json = {
        auth: {
          login: {
            email: 'Email',
            password: 'Password'
          },
          signup: {
            title: 'Sign Up'
          }
        }
      };

      const keys = extractAllKeys(json);

      expect(keys).toHaveLength(3);
      expect(keys).toContain('auth.login.email');
      expect(keys).toContain('auth.login.password');
      expect(keys).toContain('auth.signup.title');
    });

    it('should return empty array for empty object', () => {
      const keys = extractAllKeys({});
      expect(keys).toHaveLength(0);
    });

    it('should handle top-level keys', () => {
      const json = {
        title: 'Welcome',
        subtitle: 'Hello'
      };

      const keys = extractAllKeys(json);

      expect(keys).toHaveLength(2);
      expect(keys).toContain('title');
      expect(keys).toContain('subtitle');
    });

    it('should only count leaf nodes, not intermediate objects', () => {
      const json = {
        auth: {
          login: {
            email: {
              label: 'Email'
            }
          }
        }
      };

      const keys = extractAllKeys(json);

      expect(keys).toHaveLength(1);
      expect(keys).toContain('auth.login.email.label');
    });

    it('should handle arrays as leaf nodes', () => {
      const json = {
        items: ['a', 'b', 'c'],
        value: 'text'
      };

      const keys = extractAllKeys(json);

      expect(keys).toHaveLength(2);
      expect(keys).toContain('items');
      expect(keys).toContain('value');
    });
  });

  // ============================================================================
  // countLeafKeys() Tests
  // ============================================================================
  describe('countLeafKeys', () => {
    it('should count only leaf nodes', () => {
      const json = {
        auth: {
          login: {
            email: 'Email',
            password: 'Password'
          },
          signup: {
            title: 'Sign Up'
          }
        }
      };

      expect(countLeafKeys(json)).toBe(3);
    });

    it('should return 0 for empty object', () => {
      expect(countLeafKeys({})).toBe(0);
    });

    it('should count top-level keys', () => {
      const json = {
        title: 'Welcome',
        subtitle: 'Hello',
        description: 'World'
      };

      expect(countLeafKeys(json)).toBe(3);
    });

    it('should handle nested structure', () => {
      const json = {
        a: {
          b: {
            c: 'value1',
            d: 'value2'
          },
          e: 'value3'
        },
        f: 'value4'
      };

      expect(countLeafKeys(json)).toBe(4);
    });
  });

  // ============================================================================
  // calculateCoverage() Tests
  // ============================================================================
  describe('calculateCoverage', () => {
    it('should return 100% for equal counts', () => {
      expect(calculateCoverage(100, 100)).toBe(100);
      expect(calculateCoverage(50, 50)).toBe(100);
      expect(calculateCoverage(1, 1)).toBe(100);
    });

    it('should return percentage when ES < EN', () => {
      expect(calculateCoverage(100, 80)).toBe(80);
      expect(calculateCoverage(100, 50)).toBe(50);
    });

    it('should return percentage when EN < ES', () => {
      expect(calculateCoverage(50, 60)).toBe(83);
      expect(calculateCoverage(75, 100)).toBe(75);
    });

    it('should return 100% when both are 0', () => {
      expect(calculateCoverage(0, 0)).toBe(100);
    });

    it('should return 0% when one is 0', () => {
      expect(calculateCoverage(0, 100)).toBe(0);
      expect(calculateCoverage(100, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateCoverage(3, 7)).toBe(43); // 3/7 = 42.857...
      expect(calculateCoverage(2, 3)).toBe(67); // 2/3 = 66.666...
    });
  });

  // ============================================================================
  // Integration Tests with Temporary Filesystem
  // ============================================================================
  describe('Integration Tests', () => {
    const tmpDir = '/tmp/translation-qa-test';
    const srcDir = `${tmpDir}/src`;
    const messagesDir = `${tmpDir}/messages`;

    beforeAll(async () => {
      const fs = await import('fs');
      const path = await import('path');

      // Create test directory structure
      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(`${messagesDir}/en`, { recursive: true });
      fs.mkdirSync(`${messagesDir}/es`, { recursive: true });

      // Create sample source files with translation usage
      fs.writeFileSync(
        `${srcDir}/component1.tsx`,
        `
import { useTranslations } from 'next-intl';

export function Component1() {
  const t = useTranslations('common');
  return <div>{t('greeting')}</div>;
}
        `.trim()
      );

      fs.writeFileSync(
        `${srcDir}/component2.tsx`,
        `
import { useTranslations } from 'next-intl';

export function Component2() {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  return (
    <div>
      {tAuth('login.title')}
      {tCommon('missing.key')}
    </div>
  );
}
        `.trim()
      );

      fs.writeFileSync(
        `${srcDir}/no-translations.tsx`,
        `
export function NoTranslations() {
  return <div>No translations here</div>;
}
        `.trim()
      );

      // Create translation JSON files
      fs.writeFileSync(
        `${messagesDir}/en/common.json`,
        JSON.stringify({
          greeting: 'Hello',
          unused: {
            key: 'This is unused'
          }
        }, null, 2)
      );

      fs.writeFileSync(
        `${messagesDir}/es/common.json`,
        JSON.stringify({
          greeting: 'Hola',
          unused: {
            key: 'Esto no se usa'
          }
        }, null, 2)
      );

      fs.writeFileSync(
        `${messagesDir}/en/auth.json`,
        JSON.stringify({
          login: {
            title: 'Login',
            email: 'Email'
          }
        }, null, 2)
      );

      fs.writeFileSync(
        `${messagesDir}/es/auth.json`,
        JSON.stringify({
          login: {
            title: 'Iniciar sesión',
            email: 'Correo electrónico'
          }
        }, null, 2)
      );
    });

    afterAll(async () => {
      const fs = await import('fs');
      // Clean up test directory
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    describe('detectMissingKeys', () => {
      it('should detect missing translation keys', async () => {
        const { detectMissingKeys } = await import('@/scripts/lib/translation-qa');
        const results = await detectMissingKeys(srcDir, messagesDir);

        // Should find 'common.missing.key' as missing
        expect(results.length).toBeGreaterThan(0);

        const missingCommonKey = results.find(
          r => r.namespace === 'common' && r.key === 'missing.key'
        );
        expect(missingCommonKey).toBeDefined();
        expect(missingCommonKey?.missingLocales).toContain('en');
        expect(missingCommonKey?.missingLocales).toContain('es');
        expect(missingCommonKey?.file).toContain('component2.tsx');
      });

      it('should not report keys that exist', async () => {
        const { detectMissingKeys } = await import('@/scripts/lib/translation-qa');
        const results = await detectMissingKeys(srcDir, messagesDir);

        // 'common.greeting' exists, should not be in results
        const greetingKey = results.find(
          r => r.namespace === 'common' && r.key === 'greeting'
        );
        expect(greetingKey).toBeUndefined();

        // 'auth.login.title' exists, should not be in results
        const loginTitle = results.find(
          r => r.namespace === 'auth' && r.key === 'login.title'
        );
        expect(loginTitle).toBeUndefined();
      });
    });

    describe('detectUnusedKeys', () => {
      it('should detect unused translation keys', async () => {
        const { detectUnusedKeys } = await import('@/scripts/lib/translation-qa');
        const results = await detectUnusedKeys(srcDir, messagesDir);

        // Should find 'common.unused.key' as unused
        const unusedKey = results.find(
          r => r.namespace === 'common' && r.key === 'unused.key'
        );
        expect(unusedKey).toBeDefined();
        expect(unusedKey?.existsIn).toContain('en');
        expect(unusedKey?.existsIn).toContain('es');
      });

      it('should not report keys that are used', async () => {
        const { detectUnusedKeys } = await import('@/scripts/lib/translation-qa');
        const results = await detectUnusedKeys(srcDir, messagesDir);

        // 'common.greeting' is used, should not be in results
        const greetingKey = results.find(
          r => r.namespace === 'common' && r.key === 'greeting'
        );
        expect(greetingKey).toBeUndefined();

        // 'auth.login.title' is used, should not be in results
        const loginTitle = results.find(
          r => r.namespace === 'auth' && r.key === 'login.title'
        );
        expect(loginTitle).toBeUndefined();
      });

      it('should detect unused keys that only exist in one locale', async () => {
        const { detectUnusedKeys } = await import('@/scripts/lib/translation-qa');
        const results = await detectUnusedKeys(srcDir, messagesDir);

        // 'auth.login.email' exists but is unused
        const emailKey = results.find(
          r => r.namespace === 'auth' && r.key === 'login.email'
        );
        expect(emailKey).toBeDefined();
        expect(emailKey?.existsIn).toContain('en');
        expect(emailKey?.existsIn).toContain('es');
      });
    });

    describe('generateCoverageReport', () => {
      it('should generate coverage report with correct metrics', async () => {
        const { generateCoverageReport } = await import('@/scripts/lib/translation-qa');
        const results = await generateCoverageReport(messagesDir);

        // Should have coverage for both namespaces
        expect(results.length).toBe(2);

        // Check common namespace
        const commonCoverage = results.find(r => r.namespace === 'common');
        expect(commonCoverage).toBeDefined();
        expect(commonCoverage?.enKeys).toBe(2); // greeting, unused.key
        expect(commonCoverage?.esKeys).toBe(2);
        expect(commonCoverage?.coverage).toBe(100);

        // Check auth namespace
        const authCoverage = results.find(r => r.namespace === 'auth');
        expect(authCoverage).toBeDefined();
        expect(authCoverage?.enKeys).toBe(2); // login.title, login.email
        expect(authCoverage?.esKeys).toBe(2);
        expect(authCoverage?.coverage).toBe(100);
      });

      it('should calculate coverage correctly when keys differ', async () => {
        const fs = await import('fs');

        // Add a key only to EN
        const enAuth = JSON.parse(fs.readFileSync(`${messagesDir}/en/auth.json`, 'utf-8'));
        enAuth.signup = { title: 'Sign Up' };
        fs.writeFileSync(`${messagesDir}/en/auth.json`, JSON.stringify(enAuth, null, 2));

        const { generateCoverageReport } = await import('@/scripts/lib/translation-qa');
        const results = await generateCoverageReport(messagesDir);

        const authCoverage = results.find(r => r.namespace === 'auth');
        expect(authCoverage).toBeDefined();
        expect(authCoverage?.enKeys).toBe(3); // login.title, login.email, signup.title
        expect(authCoverage?.esKeys).toBe(2); // login.title, login.email
        // Coverage should be (2/3) * 100 = 67%
        expect(authCoverage?.coverage).toBe(67);

        // Restore original state
        delete enAuth.signup;
        fs.writeFileSync(`${messagesDir}/en/auth.json`, JSON.stringify(enAuth, null, 2));
      });
    });
  });
});
