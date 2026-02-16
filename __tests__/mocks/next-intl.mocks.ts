/**
 * Mock utilities for next-intl in tests
 *
 * Usage in test files:
 * ```ts
 * import { mockUseLocale } from '@/__tests__/mocks/next-intl.mocks'
 *
 * mockUseLocale('es') // or 'en'
 * ```
 */

export const mockUseLocale = (locale: 'en' | 'es' = 'es') => {
  // Mock useLocale hook
  jest.mock('next-intl', () => ({
    ...jest.requireActual('next-intl'),
    useLocale: () => locale,
  }))
}

export const mockUseTranslations = (translations: Record<string, string> = {}) => {
  // Mock useTranslations hook
  jest.mock('next-intl', () => ({
    ...jest.requireActual('next-intl'),
    useTranslations: () => (key: string) => translations[key] || key,
  }))
}

// Default mock for all next-intl hooks
export const mockNextIntl = (locale: 'en' | 'es' = 'es') => {
  jest.mock('next-intl', () => ({
    useLocale: () => locale,
    useTranslations: () => (key: string) => key,
    useFormatter: () => ({
      dateTime: (date: Date) => date.toISOString(),
      number: (num: number) => num.toString(),
      relativeTime: (date: Date) => date.toISOString(),
    }),
  }))
}
