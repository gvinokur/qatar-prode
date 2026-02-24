import { describe, it, expect } from 'vitest';
import { parseAcceptLanguage, matchLocale } from '@/app/utils/locale-detection';
import type { Locale } from '@/i18n.config';

describe('parseAcceptLanguage', () => {
  it('should parse simple Accept-Language header', () => {
    const result = parseAcceptLanguage('en-US');
    expect(result).toEqual(['en']);
  });

  it('should parse complex header with quality values', () => {
    const result = parseAcceptLanguage('en-US,en;q=0.9,es;q=0.8');
    expect(result).toEqual(['en', 'es']);
  });

  it('should sort by quality value (highest first)', () => {
    const result = parseAcceptLanguage('es;q=0.9,en-US,fr;q=0.5');
    expect(result).toEqual(['en', 'es', 'fr']);
  });

  it('should handle mixed quality values correctly', () => {
    const result = parseAcceptLanguage('fr;q=0.7,en;q=0.9,es;q=0.8,de;q=0.5');
    expect(result).toEqual(['en', 'es', 'fr', 'de']);
  });

  it('should remove duplicates while preserving order', () => {
    const result = parseAcceptLanguage('en-US,en;q=0.9,en-GB;q=0.8');
    expect(result).toEqual(['en']);
  });

  it('should handle empty header', () => {
    const result = parseAcceptLanguage('');
    expect(result).toEqual([]);
  });

  it('should handle invalid header (null/undefined)', () => {
    // @ts-expect-error Testing invalid input
    expect(parseAcceptLanguage(null)).toEqual([]);
    // @ts-expect-error Testing invalid input
    expect(parseAcceptLanguage(undefined)).toEqual([]);
  });

  it('should handle header with whitespace', () => {
    const result = parseAcceptLanguage('  en-US  ,  es;q=0.8  ');
    expect(result).toEqual(['en', 'es']);
  });

  it('should handle header without quality values', () => {
    const result = parseAcceptLanguage('en,es,fr');
    expect(result).toEqual(['en', 'es', 'fr']);
  });

  it('should handle malformed quality values gracefully', () => {
    const result = parseAcceptLanguage('en;q=invalid,es;q=0.8');
    expect(result).toContain('en');
    expect(result).toContain('es');
  });

  it('should extract base language codes from region-specific codes', () => {
    const result = parseAcceptLanguage('en-US,es-ES,fr-FR');
    expect(result).toEqual(['en', 'es', 'fr']);
  });

  it('should handle single language without region', () => {
    const result = parseAcceptLanguage('en');
    expect(result).toEqual(['en']);
  });

  it('should handle quality value of 1.0 explicitly', () => {
    const result = parseAcceptLanguage('en;q=1.0,es;q=0.8');
    expect(result).toEqual(['en', 'es']);
  });

  it('should handle zero quality value', () => {
    const result = parseAcceptLanguage('en;q=0.0,es;q=0.8');
    // Languages with q=0 should still be included but at the end
    expect(result).toEqual(['es', 'en']);
  });
});

describe('matchLocale', () => {
  const supportedLocales: readonly Locale[] = ['en', 'es'] as const;

  it('should match first supported locale', () => {
    const acceptedLanguages = ['en', 'fr', 'es'];
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBe('en');
  });

  it('should return null when no match found', () => {
    const acceptedLanguages = ['fr', 'de', 'it'];
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBeNull();
  });

  it('should match second language if first not supported', () => {
    const acceptedLanguages = ['fr', 'es', 'en'];
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBe('es');
  });

  it('should return null for empty accepted languages', () => {
    const acceptedLanguages: string[] = [];
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBeNull();
  });

  it('should match exact locale code', () => {
    const acceptedLanguages = ['es'];
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBe('es');
  });

  it('should handle single supported locale', () => {
    const acceptedLanguages = ['en', 'es', 'fr'];
    const singleLocale: readonly Locale[] = ['es'] as const;
    const result = matchLocale(acceptedLanguages, singleLocale);
    expect(result).toBe('es');
  });

  it('should preserve priority order', () => {
    // First match should win, even if others also match
    const acceptedLanguages = ['es', 'en'];
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBe('es');
  });
});

describe('parseAcceptLanguage + matchLocale integration', () => {
  const supportedLocales: readonly Locale[] = ['en', 'es'] as const;

  it('should parse and match in one flow', () => {
    const header = 'fr;q=0.9,es;q=0.8,de;q=0.7';
    const acceptedLanguages = parseAcceptLanguage(header);
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBe('es');
  });

  it('should return null when header has no supported languages', () => {
    const header = 'fr,de,it';
    const acceptedLanguages = parseAcceptLanguage(header);
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBeNull();
  });

  it('should prefer higher quality match', () => {
    const header = 'es;q=0.7,en;q=0.9';
    const acceptedLanguages = parseAcceptLanguage(header);
    // parseAcceptLanguage should sort by quality, so 'en' comes first
    expect(acceptedLanguages[0]).toBe('en');
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBe('en');
  });

  it('should handle real-world browser Accept-Language header', () => {
    const header = 'en-US,en;q=0.9,es-ES;q=0.8,es;q=0.7';
    const acceptedLanguages = parseAcceptLanguage(header);
    const result = matchLocale(acceptedLanguages, supportedLocales);
    expect(result).toBe('en'); // First match
  });
});
