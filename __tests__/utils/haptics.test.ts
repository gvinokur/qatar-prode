import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerRankUpHaptic, triggerRankChangeHaptic, isHapticSupported } from '../../app/utils/haptics';

describe('haptics', () => {
  beforeEach(() => {
    // Reset navigator mock before each test
    vi.stubGlobal('navigator', {
      vibrate: vi.fn(),
    });
  });

  describe('triggerRankUpHaptic', () => {
    it('should trigger vibration pattern when supported', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate');

      triggerRankUpHaptic();

      expect(vibrateSpy).toHaveBeenCalledWith([50, 100, 50]);
      expect(vibrateSpy).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when vibration fails', () => {
      vi.spyOn(navigator, 'vibrate').mockImplementation(() => {
        throw new Error('Vibration not supported');
      });

      expect(() => triggerRankUpHaptic()).not.toThrow();
    });

    it('should not vibrate when navigator.vibrate is undefined', () => {
      vi.stubGlobal('navigator', {});

      // Should not throw error
      expect(() => triggerRankUpHaptic()).not.toThrow();
    });

    it('should not vibrate when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      expect(() => triggerRankUpHaptic()).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('triggerRankChangeHaptic', () => {
    it('should trigger short vibration when supported', () => {
      const vibrateSpy = vi.spyOn(navigator, 'vibrate');

      triggerRankChangeHaptic();

      expect(vibrateSpy).toHaveBeenCalledWith(30);
      expect(vibrateSpy).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when vibration fails', () => {
      vi.spyOn(navigator, 'vibrate').mockImplementation(() => {
        throw new Error('Vibration not supported');
      });

      expect(() => triggerRankChangeHaptic()).not.toThrow();
    });

    it('should not vibrate when navigator.vibrate is undefined', () => {
      vi.stubGlobal('navigator', {});

      expect(() => triggerRankChangeHaptic()).not.toThrow();
    });
  });

  describe('isHapticSupported', () => {
    it('should return true when vibrate API is available', () => {
      const result = isHapticSupported();

      expect(result).toBe(true);
    });

    it('should return false when vibrate API is not available', () => {
      vi.stubGlobal('navigator', {});

      const result = isHapticSupported();

      expect(result).toBe(false);
    });

    it('should return false when window is undefined (SSR)', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const result = isHapticSupported();

      expect(result).toBe(false);

      global.window = originalWindow;
    });
  });
});
