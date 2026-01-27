import { describe, it, expect } from 'vitest';
import {
  ONE_HOUR,
  calculateDeadline,
  formatCountdown,
  getUrgencyLevel,
  calculateProgress,
  getUrgencyColor,
  type UrgencyLevel,
} from '../../app/utils/countdown-utils';
import { createTheme } from '@mui/material/styles';

describe('countdown-utils', () => {
  describe('calculateDeadline', () => {
    it('should return 1 hour before game date', () => {
      const gameDate = new Date('2026-01-20T15:00:00Z');
      const deadline = calculateDeadline(gameDate);
      const expectedDeadline = gameDate.getTime() - ONE_HOUR;

      expect(deadline).toBe(expectedDeadline);
    });

    it('should handle different game dates', () => {
      const gameDate1 = new Date('2026-02-15T10:00:00Z');
      const gameDate2 = new Date('2026-03-20T18:30:00Z');

      expect(calculateDeadline(gameDate1)).toBe(gameDate1.getTime() - ONE_HOUR);
      expect(calculateDeadline(gameDate2)).toBe(gameDate2.getTime() - ONE_HOUR);
    });
  });

  describe('formatCountdown', () => {
    it('should format days correctly', () => {
      expect(formatCountdown(1 * 24 * 60 * 60 * 1000)).toBe('1 day');
      expect(formatCountdown(2 * 24 * 60 * 60 * 1000)).toBe('2 days');
      expect(formatCountdown(5 * 24 * 60 * 60 * 1000)).toBe('5 days');
    });

    it('should format hours and minutes correctly', () => {
      expect(formatCountdown(3 * 60 * 60 * 1000 + 45 * 60 * 1000)).toBe('3h 45m');
      expect(formatCountdown(1 * 60 * 60 * 1000 + 30 * 60 * 1000)).toBe('1h 30m');
      expect(formatCountdown(5 * 60 * 60 * 1000)).toBe('5h');
    });

    it('should format minutes correctly', () => {
      expect(formatCountdown(45 * 60 * 1000)).toBe('45m');
      expect(formatCountdown(1 * 60 * 1000)).toBe('1m');
      expect(formatCountdown(30 * 60 * 1000)).toBe('30m');
    });

    it('should format seconds correctly', () => {
      expect(formatCountdown(45 * 1000)).toBe('45s');
      expect(formatCountdown(1 * 1000)).toBe('1s');
      expect(formatCountdown(30 * 1000)).toBe('30s');
    });

    it('should return "Closed" for zero or negative time', () => {
      expect(formatCountdown(0)).toBe('Closed');
      expect(formatCountdown(-1000)).toBe('Closed');
      expect(formatCountdown(-60 * 60 * 1000)).toBe('Closed');
    });

    it('should handle edge cases around boundaries', () => {
      // Just under 1 hour
      expect(formatCountdown(59 * 60 * 1000 + 59 * 1000)).toBe('59m');
      // Exactly 1 hour
      expect(formatCountdown(60 * 60 * 1000)).toBe('1h');
      // Just under 1 day
      expect(formatCountdown(23 * 60 * 60 * 1000 + 59 * 60 * 1000)).toBe('23h 59m');
      // Exactly 1 day
      expect(formatCountdown(24 * 60 * 60 * 1000)).toBe('1 day');
    });
  });

  describe('getUrgencyLevel', () => {
    it('should return "closed" for zero or negative time', () => {
      expect(getUrgencyLevel(0)).toBe('closed');
      expect(getUrgencyLevel(-1000)).toBe('closed');
      expect(getUrgencyLevel(-ONE_HOUR)).toBe('closed');
    });

    it('should return "urgent" for less than 1 hour', () => {
      expect(getUrgencyLevel(59 * 60 * 1000)).toBe('urgent');
      expect(getUrgencyLevel(30 * 60 * 1000)).toBe('urgent');
      expect(getUrgencyLevel(1 * 60 * 1000)).toBe('urgent');
      expect(getUrgencyLevel(1 * 1000)).toBe('urgent');
    });

    it('should return "warning" for 1-24 hours', () => {
      expect(getUrgencyLevel(ONE_HOUR)).toBe('warning');
      expect(getUrgencyLevel(2 * ONE_HOUR)).toBe('warning');
      expect(getUrgencyLevel(12 * ONE_HOUR)).toBe('warning');
      expect(getUrgencyLevel(23 * ONE_HOUR + 59 * 60 * 1000)).toBe('warning');
    });

    it('should return "notice" for 24-48 hours', () => {
      expect(getUrgencyLevel(24 * ONE_HOUR)).toBe('notice');
      expect(getUrgencyLevel(36 * ONE_HOUR)).toBe('notice');
      expect(getUrgencyLevel(47 * ONE_HOUR + 59 * 60 * 1000)).toBe('notice');
    });

    it('should return "safe" for more than 48 hours', () => {
      expect(getUrgencyLevel(48 * ONE_HOUR)).toBe('safe');
      expect(getUrgencyLevel(72 * ONE_HOUR)).toBe('safe');
      expect(getUrgencyLevel(7 * 24 * ONE_HOUR)).toBe('safe');
    });

    it('should handle boundary conditions exactly', () => {
      // Exactly 1 hour (should be warning, not urgent)
      expect(getUrgencyLevel(ONE_HOUR)).toBe('warning');
      // Exactly 24 hours (should be notice, not warning)
      expect(getUrgencyLevel(24 * ONE_HOUR)).toBe('notice');
      // Exactly 48 hours (should be safe, not notice)
      expect(getUrgencyLevel(48 * ONE_HOUR)).toBe('safe');
    });
  });

  describe('calculateProgress', () => {
    it('should return 0 when past deadline', () => {
      const gameDate = new Date('2026-01-20T15:00:00Z');
      const deadline = calculateDeadline(gameDate);

      expect(calculateProgress(gameDate, deadline)).toBe(0);
      expect(calculateProgress(gameDate, deadline + 1000)).toBe(0);
      expect(calculateProgress(gameDate, deadline + ONE_HOUR)).toBe(0);
    });

    it('should return 100 when more than 48 hours before deadline', () => {
      const gameDate = new Date('2026-01-20T15:00:00Z');
      const deadline = calculateDeadline(gameDate);
      const fortyEightHoursBefore = deadline - 48 * ONE_HOUR;

      expect(calculateProgress(gameDate, fortyEightHoursBefore)).toBe(100);
      expect(calculateProgress(gameDate, fortyEightHoursBefore - 1000)).toBe(100);
      expect(calculateProgress(gameDate, fortyEightHoursBefore - ONE_HOUR)).toBe(100);
    });

    it('should calculate correct percentage in middle range', () => {
      const gameDate = new Date('2026-01-20T15:00:00Z');
      const deadline = calculateDeadline(gameDate);
      const fortyEightHoursBefore = deadline - 48 * ONE_HOUR;

      // At 24 hours before deadline (halfway through 48h window)
      const midpoint = deadline - 24 * ONE_HOUR;
      const progress = calculateProgress(gameDate, midpoint);
      expect(progress).toBeCloseTo(50, 1);

      // At 12 hours before deadline (75% through window)
      const threeQuarters = deadline - 12 * ONE_HOUR;
      const progressThreeQuarters = calculateProgress(gameDate, threeQuarters);
      expect(progressThreeQuarters).toBeCloseTo(25, 1);

      // At 36 hours before deadline (25% through window)
      const oneQuarter = deadline - 36 * ONE_HOUR;
      const progressOneQuarter = calculateProgress(gameDate, oneQuarter);
      expect(progressOneQuarter).toBeCloseTo(75, 1);
    });

    it('should handle boundary conditions', () => {
      const gameDate = new Date('2026-01-20T15:00:00Z');
      const deadline = calculateDeadline(gameDate);

      // Exactly at deadline
      expect(calculateProgress(gameDate, deadline)).toBe(0);

      // Exactly 48 hours before
      const fortyEightHoursBefore = deadline - 48 * ONE_HOUR;
      expect(calculateProgress(gameDate, fortyEightHoursBefore)).toBe(100);
    });
  });

  describe('getUrgencyColor', () => {
    const theme = createTheme();

    it('should return success color for "safe"', () => {
      expect(getUrgencyColor(theme, 'safe')).toBe(theme.palette.success.main);
    });

    it('should return info color for "notice"', () => {
      expect(getUrgencyColor(theme, 'notice')).toBe(theme.palette.info.main);
    });

    it('should return warning color for "warning"', () => {
      expect(getUrgencyColor(theme, 'warning')).toBe(theme.palette.warning.main);
    });

    it('should return error color for "urgent"', () => {
      expect(getUrgencyColor(theme, 'urgent')).toBe(theme.palette.error.main);
    });

    it('should return disabled color for "closed"', () => {
      expect(getUrgencyColor(theme, 'closed')).toBe(theme.palette.text.disabled);
    });

    it('should handle different theme modes', () => {
      const darkTheme = createTheme({ palette: { mode: 'dark' } });
      const lightTheme = createTheme({ palette: { mode: 'light' } });

      // Should return valid colors for both themes
      expect(getUrgencyColor(darkTheme, 'urgent')).toBeTruthy();
      expect(getUrgencyColor(lightTheme, 'urgent')).toBeTruthy();
    });
  });
});
