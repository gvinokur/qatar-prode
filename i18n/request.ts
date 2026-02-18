import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: {
      common: (await import(`../locales/${locale}/common.json`)).default,
      navigation: (await import(`../locales/${locale}/navigation.json`)).default,
      auth: (await import(`../locales/${locale}/auth.json`)).default,
      groups: (await import(`../locales/${locale}/groups.json`)).default,
      emails: (await import(`../locales/${locale}/emails.json`)).default,
      validation: (await import(`../locales/${locale}/validation.json`)).default,
      errors: (await import(`../locales/${locale}/errors.json`)).default,
      onboarding: (await import(`../locales/${locale}/onboarding.json`)).default,
      predictions: (await import(`../locales/${locale}/predictions.json`)).default
    }
  };
});
