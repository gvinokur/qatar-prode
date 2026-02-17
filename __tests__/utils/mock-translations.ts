/**
 * Creates a mock translation function for testing components that use next-intl
 * Returns translation keys wrapped in brackets with optional interpolation values
 *
 * Usage:
 * ```typescript
 * vi.mock('next-intl', () => ({
 *   useTranslations: vi.fn(() => createMockTranslations('onboarding.dialog'))
 * }));
 * ```
 *
 * Component calls: t('skipButton') → test sees: '[skipButton]'
 * Component calls: t('available', { count: 3 }) → test sees: '[available]{count:3}'
 */
export function createMockTranslations(namespace: string) {
  return (key: string, values?: Record<string, any>) => {
    if (values) {
      // Handle interpolation: show values in output for test verification
      const valuesStr = JSON.stringify(values).replace(/[{}"]/g, '');
      return `[${key}]{${valuesStr}}`;
    }
    return `[${key}]`;
  };
}
