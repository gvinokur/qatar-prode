import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the database connection to avoid VercelPostgresError
vi.mock('./app/db/database', () => ({
  db: {
    selectFrom: vi.fn(() => ({
      selectAll: vi.fn(() => ({
        execute: vi.fn().mockResolvedValue([]),
        executeTakeFirst: vi.fn().mockResolvedValue(null),
      })),
      select: vi.fn(() => ({
        where: vi.fn(() => ({
          execute: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    insertInto: vi.fn(() => ({
      values: vi.fn(() => ({
        returningAll: vi.fn(() => ({
          executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 'mock-id' }),
        })),
      })),
    })),
    updateTable: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          execute: vi.fn(),
        })),
      })),
    })),
    deleteFrom: vi.fn(() => ({
      where: vi.fn(() => ({
        execute: vi.fn(),
      })),
    })),
  },
})); 