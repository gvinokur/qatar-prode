import '@testing-library/jest-dom';
import { vi } from 'vitest';

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