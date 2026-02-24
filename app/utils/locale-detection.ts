import type { Locale } from '@/i18n.config';

/**
 * Parse Accept-Language header and return locales sorted by quality value (highest first)
 *
 * Example: "en-US,en;q=0.9,es;q=0.8,fr;q=0.5" -> ['en', 'es', 'fr']
 *
 * Quality value handling:
 * - Parse quality values (q=0.9) for each language
 * - Default to 1 for languages without explicit quality
 * - Sort by quality in descending order
 * - Extract base language code (en-US -> en)
 * - Remove duplicates
 *
 * @param header - Accept-Language header value
 * @returns Array of language codes sorted by preference
 */
export function parseAcceptLanguage(header: string): string[] {
  if (!header || typeof header !== 'string') {
    return [];
  }

  // Parse language-quality pairs
  const languages = header
    .split(',')
    .map(lang => {
      const parts = lang.trim().split(';');
      const code = parts[0].trim();

      // Extract quality value (default to 1)
      let quality = 1;
      if (parts[1]) {
        const qMatch = /q=([0-9.]+)/.exec(parts[1]);
        if (qMatch) {
          quality = Number.parseFloat(qMatch[1]);
        }
      }

      return { code, quality };
    })
    .filter(lang => lang.code); // Remove empty entries

  // Sort by quality (highest first)
  languages.sort((a, b) => b.quality - a.quality);

  // Extract base language codes and deduplicate
  const baseCodes = languages.map(lang => {
    // Extract base code (en-US -> en, es-ES -> es)
    const baseCode = lang.code.split('-')[0].toLowerCase();
    return baseCode;
  });

  // Remove duplicates while preserving order
  return [...new Set(baseCodes)];
}

/**
 * Match parsed languages against supported locales
 *
 * @param acceptedLanguages - Array of language codes from parseAcceptLanguage
 * @param supportedLocales - Array of supported locale codes
 * @returns First matching locale or null
 */
export function matchLocale(
  acceptedLanguages: string[],
  supportedLocales: readonly Locale[]
): Locale | null {
  // Find first language that matches a supported locale
  for (const lang of acceptedLanguages) {
    const match = supportedLocales.find(locale => locale === lang);
    if (match) {
      return match;
    }
  }

  return null;
}
