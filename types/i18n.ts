import common from '@/locales/en/common.json';
import navigation from '@/locales/en/navigation.json';

// Merge all namespaces into single type
type Messages = {
  common: typeof common;
  navigation: typeof navigation;
};

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}

// Export for use in getMessages() server-side
export default Messages;
