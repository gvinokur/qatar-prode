import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayYYYYMMDD } from '../../app/utils/date-utils';

describe('getTodayYYYYMMDD', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return today\'s date in YYYYMMDD integer format', () => {
    vi.setSystemTime(new Date('2026-02-06T12:00:00Z'));

    const result = getTodayYYYYMMDD();

    expect(result).toBe(20260206);
    expect(typeof result).toBe('number');
  });

  it('should return correct format for single-digit month', () => {
    vi.setSystemTime(new Date('2026-01-05T12:00:00Z'));

    const result = getTodayYYYYMMDD();

    expect(result).toBe(20260105);
  });

  it('should return correct format for single-digit day', () => {
    vi.setSystemTime(new Date('2025-12-03T12:00:00Z'));

    const result = getTodayYYYYMMDD();

    expect(result).toBe(20251203);
  });

  it('should return correct format for year boundary', () => {
    vi.setSystemTime(new Date('2025-12-31T23:59:59Z'));

    const result = getTodayYYYYMMDD();

    expect(result).toBe(20251231);
  });

  it('should return correct format for new year', () => {
    // Use noon to avoid timezone issues
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    const result = getTodayYYYYMMDD();

    expect(result).toBe(20260101);
  });

  it('should change when date changes', () => {
    vi.setSystemTime(new Date('2026-02-06T12:00:00Z'));
    const result1 = getTodayYYYYMMDD();

    vi.setSystemTime(new Date('2026-02-07T12:00:00Z'));
    const result2 = getTodayYYYYMMDD();

    expect(result1).toBe(20260206);
    expect(result2).toBe(20260207);
    expect(result1).not.toBe(result2);
  });
});
