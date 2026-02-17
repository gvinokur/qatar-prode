import { vi, describe, it, expect } from 'vitest';
import { getLocalGameTime, getUserLocalTime, getCompactGameTime, getCompactUserTime, getTodayYYYYMMDD } from '../../app/utils/date-utils';

// Mock Intl.supportedValuesOf for timezone validation
const mockSupportedTimezones = ['America/New_York', 'America/Argentina/Buenos_Aires', 'Europe/London', 'Asia/Tokyo'];
Object.defineProperty(Intl, 'supportedValuesOf', {
  value: vi.fn().mockReturnValue(mockSupportedTimezones),
  writable: true,
  configurable: true
});

describe('date-utils', () => {
  const mockDate = new Date('2023-12-25T10:30:00Z');

  describe('getLocalGameTime', () => {
    it('should format with Spanish locale by default', () => {
      const result = getLocalGameTime(mockDate, 'America/New_York');
      // Spanish month abbreviation for December
      expect(result).toContain('dic');
    });

    it('should format with English locale when provided', () => {
      const result = getLocalGameTime(mockDate, 'America/New_York', 'en');
      // English month abbreviation for December
      expect(result).toContain('Dec');
    });

    it('should return local formatted time when timezone is not provided', () => {
      const result = getLocalGameTime(mockDate);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return local formatted time when timezone is not supported', () => {
      const result = getLocalGameTime(mockDate, 'Invalid/Timezone');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getUserLocalTime', () => {
    it('should format with Spanish locale by default', () => {
      const result = getUserLocalTime(mockDate);
      // Spanish month abbreviation
      expect(result).toContain('dic');
    });

    it('should format with English locale when provided', () => {
      const result = getUserLocalTime(mockDate, 'en');
      // English month abbreviation
      expect(result).toContain('Dec');
    });
  });

  describe('getCompactGameTime', () => {
    it('should format with Spanish locale by default', () => {
      const result = getCompactGameTime(mockDate, 'America/New_York');
      // Spanish month abbreviation
      expect(result).toContain('dic');
      // Should include GMT offset
      expect(result).toContain('GMT');
    });

    it('should format with English locale when provided', () => {
      const result = getCompactGameTime(mockDate, 'America/New_York', 'en');
      // English month abbreviation
      expect(result).toContain('Dec');
      // Should include GMT offset
      expect(result).toContain('GMT');
    });

    it('should NOT include label in return value', () => {
      const result = getCompactGameTime(mockDate, 'America/New_York');
      // Labels removed - component handles separately
      expect(result).not.toContain('Horario Local');
      expect(result).not.toContain('Local Time');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
    });

    it('should return local formatted time when timezone is not provided', () => {
      const result = getCompactGameTime(mockDate);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return local formatted time when timezone is not supported', () => {
      const result = getCompactGameTime(mockDate, 'Invalid/Timezone');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getCompactUserTime', () => {
    it('should format with Spanish locale by default', () => {
      const result = getCompactUserTime(mockDate);
      // Spanish month abbreviation
      expect(result).toContain('dic');
    });

    it('should format with English locale when provided', () => {
      const result = getCompactUserTime(mockDate, 'en');
      // English month abbreviation
      expect(result).toContain('Dec');
    });

    it('should NOT include label in return value', () => {
      const result = getCompactUserTime(mockDate);
      // Labels removed - component handles separately
      expect(result).not.toContain('Tu Horario');
      expect(result).not.toContain('Your Time');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
    });

    it('should handle different date formats', () => {
      const date1 = new Date('2023-01-15T12:00:00Z');
      const date2 = new Date('2023-06-15T12:00:00Z');

      const result1 = getCompactUserTime(date1, 'es');
      const result2 = getCompactUserTime(date2, 'en');

      // January in Spanish
      expect(result1).toContain('ene');
      // June in English
      expect(result2).toContain('Jun');
    });
  });

  describe('getTodayYYYYMMDD', () => {
    it('should return integer in YYYYMMDD format', () => {
      const result = getTodayYYYYMMDD();
      expect(typeof result).toBe('number');
      // Should be 8 digits (YYYYMMDD)
      expect(result.toString()).toMatch(/^\d{8}$/);
    });
  });
});