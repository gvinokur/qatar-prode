import { vi, describe, it, expect } from 'vitest';
import { getLocalGameTime, getUserLocalTime } from '../../app/utils/date-utils';

// Mock dayjs to control timezone behavior
vi.mock('dayjs', () => {
  const originalDayjs = vi.importActual('dayjs');
  const mockDayjs = vi.fn((date) => {
    const instance = originalDayjs(date);
    instance.tz = vi.fn().mockReturnValue({
      format: vi.fn().mockReturnValue('Mocked timezone time')
    });
    instance.format = vi.fn().mockReturnValue('Mocked local time');
    return instance;
  });
  
  // Copy static methods
  Object.setPrototypeOf(mockDayjs, originalDayjs);
  (mockDayjs as any).extend = originalDayjs.extend;
  
  return mockDayjs;
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
}); 