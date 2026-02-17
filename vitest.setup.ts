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

// Mock next-intl globally for all tests (client components)
vi.mock('next-intl', () => ({
  useLocale: () => 'es', // Default to Spanish locale
  useTranslations: () => (key: string) => key, // Return key as-is for tests
  useFormatter: () => ({
    dateTime: (date: Date) => date.toISOString(),
    number: (num: number) => num.toString(),
    relativeTime: (date: Date) => date.toISOString(),
  }),
}));

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