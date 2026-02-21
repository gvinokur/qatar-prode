import common from '@/locales/en/common.json';
import navigation from '@/locales/en/navigation.json';
import auth from '@/locales/en/auth.json';
import awards from '@/locales/en/awards.json';
import groups from '@/locales/en/groups.json';
import emails from '@/locales/en/emails.json';
import validation from '@/locales/en/validation.json';
import errors from '@/locales/en/errors.json';
import onboarding from '@/locales/en/onboarding.json';
import predictions from '@/locales/en/predictions.json';
import rules from '@/locales/en/rules.json';
import stats from '@/locales/en/stats.json';
import tables from '@/locales/en/tables.json';

// Merge all namespaces into single type
type Messages = {
  common: typeof common;
  navigation: typeof navigation;
  auth: typeof auth;
  awards: typeof awards;
  groups: typeof groups;
  emails: typeof emails;
  validation: typeof validation;
  errors: typeof errors;
  onboarding: typeof onboarding;
  predictions: typeof predictions;
  rules: typeof rules;
  stats: typeof stats;
  tables: typeof tables;
};

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}

// Export for use in getMessages() server-side
export default Messages;
