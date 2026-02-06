import { vi, describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { getLocalGameTime, getUserLocalTime, getCompactGameTime, getCompactUserTime, getTodayYYYYMMDD } from '../../app/utils/date-utils';

// Store original dayjs module
let originalDayjs: any;

beforeAll(async () => {
  originalDayjs = await vi.importActual('dayjs');
});

afterAll(() => {
  vi.unmock('dayjs');
});

// Mock dayjs to control timezone behavior
vi.mock('dayjs', () => {
  const mockDayjs = vi.fn((_date) => {
    const instance = {
      tz: vi.fn().mockReturnValue({
        format: vi.fn().mockReturnValue('Mocked timezone time')
      }),
      format: vi.fn().mockReturnValue('Mocked local time')
    };
    return instance;
  });

  // Add static methods
  (mockDayjs as any).extend = vi.fn();
  (mockDayjs as any).locale = vi.fn();
  (mockDayjs as any).tz = {
    guess: vi.fn().mockReturnValue('UTC')
  };

  return {
    default: mockDayjs,
    extend: vi.fn(),
    locale: vi.fn(),
    tz: {
      guess: vi.fn().mockReturnValue('UTC')
    }
  };
});

// Mock Intl.supportedValuesOf
const mockSupportedTimezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];
Object.defineProperty(Intl, 'supportedValuesOf', {
  value: vi.fn().mockReturnValue(mockSupportedTimezones),
  writable: true
});

describe('date-utils', () => {
  const mockDate = new Date('2023-12-25T10:30:00Z');

  describe('getLocalGameTime', () => {
    it('should return timezone formatted time when valid timezone is provided', () => {
      const result = getLocalGameTime(mockDate, 'America/New_York');
      expect(result).toBe('Mocked timezone time');
    });

    it('should return local formatted time when timezone is not provided', () => {
      const result = getLocalGameTime(mockDate);
      expect(result).toBe('Mocked local time');
    });

    it('should return local formatted time when timezone is undefined', () => {
      const result = getLocalGameTime(mockDate, undefined);
      expect(result).toBe('Mocked local time');
    });

    it('should return local formatted time when timezone is empty string', () => {
      const result = getLocalGameTime(mockDate, '');
      expect(result).toBe('Mocked local time');
    });

    it('should return local formatted time when timezone is not supported', () => {
      const result = getLocalGameTime(mockDate, 'Invalid/Timezone');
      expect(result).toBe('Mocked local time');
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2023-01-01T00:00:00Z');
      const date2 = new Date('2023-12-31T23:59:59Z');
      
      const result1 = getLocalGameTime(date1, 'America/New_York');
      const result2 = getLocalGameTime(date2, 'Europe/London');
      
      expect(result1).toBe('Mocked timezone time');
      expect(result2).toBe('Mocked timezone time');
    });
  });

  describe('getUserLocalTime', () => {
    it('should return formatted local time', () => {
      const result = getUserLocalTime(mockDate);
      expect(result).toBe('Mocked local time');
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2023-01-01T00:00:00Z');
      const date2 = new Date('2023-12-31T23:59:59Z');
      
      const result1 = getUserLocalTime(date1);
      const result2 = getUserLocalTime(date2);
      
      expect(result1).toBe('Mocked local time');
      expect(result2).toBe('Mocked local time');
    });

    it('should handle edge case dates', () => {
      const edgeDate = new Date('1970-01-01T00:00:00Z');
      const result = getUserLocalTime(edgeDate);
      expect(result).toBe('Mocked local time');
    });
  });

  describe('getCompactGameTime', () => {
    it('should return compact timezone formatted time when valid timezone is provided', () => {
      const result = getCompactGameTime(mockDate, 'America/New_York');
      // With mocked dayjs, should return the mocked timezone time + GMT prefix
      expect(result).toContain('Mocked timezone time');
    });

    it('should return local formatted time when timezone is not provided', () => {
      const result = getCompactGameTime(mockDate);
      expect(result).toBe('Mocked local time');
    });

    it('should return local formatted time when timezone is not supported', () => {
      const result = getCompactGameTime(mockDate, 'Invalid/Timezone');
      expect(result).toBe('Mocked local time');
    });
  });

  describe('getCompactUserTime', () => {
    it('should return compact formatted local time with "(Tu Horario)" label', () => {
      const result = getCompactUserTime(mockDate);
      // Should include the "(Tu Horario)" label (Spanish)
      expect(result).toContain('(Tu Horario)');
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2023-01-01T00:00:00Z');
      const date2 = new Date('2023-12-31T23:59:59Z');

      const result1 = getCompactUserTime(date1);
      const result2 = getCompactUserTime(date2);

      // Both should return formatted strings with the Spanish label
      expect(result1).toContain('(Tu Horario)');
      expect(result2).toContain('(Tu Horario)');
    });
  });
});