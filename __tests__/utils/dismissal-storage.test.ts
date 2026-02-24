import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDismissalState, setDismissalState } from '../../app/utils/dismissal-storage';

describe('dismissal-storage', () => {
  // Store original localStorage
  const originalLocalStorage = globalThis.window?.localStorage;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original localStorage
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'window', {
        value: { localStorage: originalLocalStorage },
        writable: true,
      });
    }
  });

  describe('getDismissalState', () => {
    it('should return false when key does not exist', () => {
      const result = getDismissalState('test-key');
      expect(result).toBe(false);
    });

    it('should return true when key exists and value is "true"', () => {
      localStorage.setItem('test-key', 'true');
      const result = getDismissalState('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key exists but value is not "true"', () => {
      localStorage.setItem('test-key', 'false');
      const result = getDismissalState('test-key');
      expect(result).toBe(false);
    });

    it('should return false when key exists but value is empty string', () => {
      localStorage.setItem('test-key', '');
      const result = getDismissalState('test-key');
      expect(result).toBe(false);
    });

    it('should handle keys with special characters', () => {
      const key = 'dismissed_locked_tournament-123_qualifiedTeams';
      localStorage.setItem(key, 'true');
      const result = getDismissalState(key);
      expect(result).toBe(true);
    });

    it('should return false when window is undefined (SSR)', () => {
      // Mock window as undefined
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
      });

      const result = getDismissalState('test-key');
      expect(result).toBe(false);

      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
      });
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage.getItem to throw an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = getDismissalState('test-key');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading dismissal state:', expect.any(Error));

      // Restore mocks
      consoleErrorSpy.mockRestore();
      getItemSpy.mockRestore();
    });
  });

  describe('setDismissalState', () => {
    it('should set key to "true" when dismissed is true', () => {
      setDismissalState('test-key', true);
      expect(localStorage.getItem('test-key')).toBe('true');
    });

    it('should remove key when dismissed is false', () => {
      // First set it
      localStorage.setItem('test-key', 'true');
      expect(localStorage.getItem('test-key')).toBe('true');

      // Then clear it
      setDismissalState('test-key', false);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should handle setting multiple keys', () => {
      setDismissalState('key1', true);
      setDismissalState('key2', true);
      setDismissalState('key3', false);

      expect(localStorage.getItem('key1')).toBe('true');
      expect(localStorage.getItem('key2')).toBe('true');
      expect(localStorage.getItem('key3')).toBeNull();
    });

    it('should handle keys with special characters', () => {
      const key = 'dismissed_locked_tournament-456_awards';
      setDismissalState(key, true);
      expect(localStorage.getItem(key)).toBe('true');
    });

    it('should do nothing when window is undefined (SSR)', () => {
      // Mock window as undefined
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, 'window', {
        value: undefined,
        writable: true,
      });

      // Should not throw
      expect(() => setDismissalState('test-key', true)).not.toThrow();

      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
      });
    });

    it('should handle localStorage errors gracefully when setting', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      expect(() => setDismissalState('test-key', true)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error setting dismissal state:', expect.any(Error));

      // Restore mocks
      consoleErrorSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully when removing', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      expect(() => setDismissalState('test-key', false)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error setting dismissal state:', expect.any(Error));

      // Restore mocks
      consoleErrorSpy.mockRestore();
      removeItemSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should support full dismissal flow', () => {
      const key = 'dismissed_locked_tournament-789_matches';

      // Initial state - not dismissed
      expect(getDismissalState(key)).toBe(false);

      // User dismisses
      setDismissalState(key, true);
      expect(getDismissalState(key)).toBe(true);

      // Verify it persists (simulating page reload)
      expect(localStorage.getItem(key)).toBe('true');
      expect(getDismissalState(key)).toBe(true);

      // User wants to see it again (clearing dismissal)
      setDismissalState(key, false);
      expect(getDismissalState(key)).toBe(false);
      expect(localStorage.getItem(key)).toBeNull();
    });

    it('should handle multiple snackbars independently', () => {
      const lockedKey = 'dismissedLocked_tournament-1_qualifiedTeams';
      const awardsKey = 'dismissedLocked_tournament-1_awards';
      const matchesKey = 'dismissedLocked_tournament-2_matches';

      // Dismiss some but not others
      setDismissalState(lockedKey, true);
      setDismissalState(awardsKey, true);
      // matchesKey not dismissed

      expect(getDismissalState(lockedKey)).toBe(true);
      expect(getDismissalState(awardsKey)).toBe(true);
      expect(getDismissalState(matchesKey)).toBe(false);

      // Clear one
      setDismissalState(lockedKey, false);
      expect(getDismissalState(lockedKey)).toBe(false);
      expect(getDismissalState(awardsKey)).toBe(true); // Others unchanged
    });
  });
});
