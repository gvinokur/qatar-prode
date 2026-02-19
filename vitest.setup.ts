import { vi } from 'vitest';

// Stub VAPID environment variables to prevent web-push initialization errors
// This must be done before any modules are loaded
vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'BIgIOpCSB_MFNpSkPb4V_eM4SkemKR1l1XmmYFsewYF-XD0T0LZA8A79eerSnzNP00dIcixBZ_TD3SrSRkiQAlI');
vi.stubEnv('VAPID_PRIVATE_KEY', 'P3Zfb9llkSX79i6PVZW5JhBhsMJed2XtC2vcByjdPNo');

import '@testing-library/jest-dom';

// Mock next-auth globally for all tests
vi.mock('next-auth', () => ({
  __esModule: true,
  default: () => ({})
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: '1', email: 'test@example.com' } },
    status: 'authenticated'
  })
}));

// Load Spanish translations for tests
const spanishTranslations: Record<string, any> = {
  predictions: require('./locales/es/predictions.json'),
  groups: require('./locales/es/groups.json'),
  common: require('./locales/es/common.json'),
  rules: require('./locales/es/rules.json'),
  // Add other namespaces as needed
};

// Load English translations for tests
const englishTranslations: Record<string, any> = {
  rules: require('./locales/en/rules.json'),
  // Add other namespaces as needed
};

// Global variable to track current test locale (can be changed by tests)
let currentTestLocale = 'es';

// Helper function to set the test locale
export function setTestLocale(locale: 'es' | 'en') {
  currentTestLocale = locale;
}

// Helper function to get the translations for the current locale
function getTranslationsForLocale(): Record<string, any> {
  return currentTestLocale === 'en' ? englishTranslations : spanishTranslations;
}

// Helper function to get nested translation value
function getTranslation(namespace: string, key: string, values?: Record<string, any>): string {
  // Handle multi-part namespace (e.g., 'groups.betting')
  const namespaceParts = namespace.split('.');
  let value: any = getTranslationsForLocale();

  // Navigate to the namespace
  for (const part of namespaceParts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return key; // Return key if namespace not found
    }
  }

  // Navigate to the key within the namespace
  const keys = key.split('.');
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (typeof value !== 'string') {
    return key; // Return key if value is not a string
  }

  // Handle ICU MessageFormat pluralization
  // Pattern: {count, plural, =0 {...} one {...} other {...}}
  // Simple approach: match the whole pattern with explicit plural rules
  const simplePluralPattern = /\{(\w+),\s*plural,\s*(?:=(\d+)\s*\{([^}]+)\}\s*)?one\s*\{([^}]+)\}\s*other\s*\{([^}]+)\}\}/g;
  value = value.replace(simplePluralPattern, (match, varName, exactNum, exactText, oneText, otherText) => {
    if (!values || values[varName] === undefined) return match;

    const count = values[varName];

    // Check for exact match first (e.g., =0)
    if (exactNum && count === parseInt(exactNum)) {
      return exactText;
    }

    // Then check for one vs other
    if (count === 1) {
      return oneText;
    } else {
      return otherText;
    }
  });

  // Handle simple interpolation
  if (values) {
    value = value.replace(/\{(\w+)\}/g, (match: string, varName: string) => {
      return values[varName]?.toString() || match;
    });
  }

  return value;
}

// Mock next-intl globally for all tests (client components)
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useLocale: () => currentTestLocale, // Use current test locale
    useTranslations: (namespace: string = 'predictions') => (key: string, values?: Record<string, any>) => {
      return getTranslation(namespace, key, values);
    },
    useFormatter: () => ({
      dateTime: (date: Date) => date.toISOString(),
      number: (num: number) => num.toString(),
      relativeTime: (date: Date) => date.toISOString(),
    }),
  };
});

// Mock next-intl/server for server components
vi.mock('next-intl/server', () => ({
  getLocale: async () => 'es', // Default to Spanish locale
  getTranslations: async () => (key: string) => key, // Return key as-is for tests
  getFormatter: async () => ({
    dateTime: (date: Date) => date.toISOString(),
    number: (num: number) => num.toString(),
    relativeTime: (date: Date) => date.toISOString(),
  }),
  getMessages: async () => ({}),
}));

// Mock next/navigation for routing hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/es',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock the database connection to avoid VercelPostgresError
// Enhanced mock with full Kysely method chain support
vi.mock('./app/db/database', () => ({
  db: {
    selectFrom: vi.fn(() => ({
      selectAll: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      rightJoin: vi.fn().mockReturnThis(),
      fullJoin: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      distinct: vi.fn().mockReturnThis(),
      distinctOn: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
      executeTakeFirst: vi.fn().mockResolvedValue(null),
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    })),
    insertInto: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      onConflict: vi.fn().mockReturnThis(),
      ignore: vi.fn().mockReturnThis(),
      doNothing: vi.fn().mockReturnThis(),
      doUpdateSet: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
      executeTakeFirst: vi.fn().mockResolvedValue({ id: 'mock-id' }),
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    })),
    updateTable: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
      executeTakeFirst: vi.fn().mockResolvedValue({ id: 'mock-id' }),
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    })),
    deleteFrom: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      using: vi.fn().mockReturnThis(),
      returningAll: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
      executeTakeFirst: vi.fn().mockResolvedValue({ id: 'mock-id' }),
      executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    })),
  },
})); 