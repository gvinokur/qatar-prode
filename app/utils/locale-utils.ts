import { locales, defaultLocale, type Locale } from '../../i18n.config';

/**
 * Safely converts a string to a Locale type with runtime validation.
 * If the value is not a valid locale, returns the default locale ('es').
 *
 * This is needed because next-intl's useLocale() returns `string`,
 * but our server actions expect the stricter `Locale` type ('en' | 'es').
 *
 * @param value - The locale string from useLocale() or other sources
 * @returns A validated Locale value
 *
 * @example
 * ```typescript
 * import { useLocale } from 'next-intl';
 * import { toLocale } from '@/app/utils/locale-utils';
 *
 * const locale = toLocale(useLocale());
 * await myServerAction(param, locale); // TypeScript happy!
 * ```
 */
export function toLocale(value: string): Locale {
  // Type guard: check if value is one of the valid locales
  if (locales.includes(value as Locale)) {
    return value as Locale;
  }

  // Fallback to default if invalid (shouldn't happen with proper routing)
  console.warn(`Invalid locale "${value}", falling back to "${defaultLocale}"`);
  return defaultLocale;
}

/**
 * Type guard to check if a string is a valid Locale.
 * Useful for conditional logic based on locale validation.
 *
 * @param value - The value to check
 * @returns True if the value is a valid Locale
 *
 * @example
 * ```typescript
 * if (isValidLocale(someString)) {
 *   // TypeScript knows someString is Locale here
 *   await serverAction(someString);
 * }
 * ```
 */
export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
