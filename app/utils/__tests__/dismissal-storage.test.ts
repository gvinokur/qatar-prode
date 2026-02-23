import { describe, it, expect, beforeEach } from 'vitest';
import { getDismissalState, setDismissalState } from '../dismissal-storage';

describe('dismissal-storage', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Replace global localStorage with mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
  });

  describe('getDismissalState', () => {
    it('should return false for new keys that do not exist', () => {
      const result = getDismissalState('dismissedLocked_test123_qualifiedTeams');
      expect(result).toBe(false);
    });

    it('should return true when key is set to "true"', () => {
      localStorage.setItem('dismissedLocked_test123_qualifiedTeams', 'true');
      const result = getDismissalState('dismissedLocked_test123_qualifiedTeams');
      expect(result).toBe(true);
    });

    it('should return false when key is set to "false"', () => {
      localStorage.setItem('dismissedLocked_test123_qualifiedTeams', 'false');
      const result = getDismissalState('dismissedLocked_test123_qualifiedTeams');
      expect(result).toBe(false);
    });

    it('should return false when key has non-boolean value', () => {
      localStorage.setItem('dismissedLocked_test123_qualifiedTeams', 'other');
      const result = getDismissalState('dismissedLocked_test123_qualifiedTeams');
      expect(result).toBe(false);
    });

    it('should return false when localStorage throws error', () => {
      // Mock localStorage to throw error
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => {
            throw new Error('localStorage error');
          },
        },
        writable: true,
      });

      const result = getDismissalState('dismissedLocked_test123_qualifiedTeams');
      expect(result).toBe(false);

      // Restore mock
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });
    });
  });

  describe('setDismissalState', () => {
    it('should store "true" when dismissed is true', () => {
      setDismissalState('dismissedLocked_test123_qualifiedTeams', true);
      const stored = localStorage.getItem('dismissedLocked_test123_qualifiedTeams');
      expect(stored).toBe('true');
    });

    it('should remove key when dismissed is false', () => {
      // Set it first
      localStorage.setItem('dismissedLocked_test123_qualifiedTeams', 'true');
      expect(localStorage.getItem('dismissedLocked_test123_qualifiedTeams')).toBe('true');

      // Now set to false (should remove)
      setDismissalState('dismissedLocked_test123_qualifiedTeams', false);
      const stored = localStorage.getItem('dismissedLocked_test123_qualifiedTeams');
      expect(stored).toBeNull();
    });

    it('should store and retrieve correctly for different keys', () => {
      setDismissalState('dismissedLocked_tournament1_qualifiedTeams', true);
      setDismissalState('dismissedLocked_tournament2_awards', true);
      setDismissalState('dismissedLocked_tournament3_qualifiedTeams', false);

      expect(getDismissalState('dismissedLocked_tournament1_qualifiedTeams')).toBe(true);
      expect(getDismissalState('dismissedLocked_tournament2_awards')).toBe(true);
      expect(getDismissalState('dismissedLocked_tournament3_qualifiedTeams')).toBe(false);
    });

    it('should not throw when localStorage throws error', () => {
      // Mock localStorage to throw error
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => {
            throw new Error('localStorage error');
          },
        },
        writable: true,
      });

      // Should not throw
      expect(() => setDismissalState('dismissedLocked_test123_qualifiedTeams', true)).not.toThrow();

      // Restore mock
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });
    });
  });

  describe('integration tests', () => {
    it('should persist dismissal state across multiple operations', () => {
      const key1 = 'dismissedLocked_tournament1_qualifiedTeams';
      const key2 = 'dismissedLocked_tournament1_awards';

      // Initially both should be false
      expect(getDismissalState(key1)).toBe(false);
      expect(getDismissalState(key2)).toBe(false);

      // Dismiss qualified teams
      setDismissalState(key1, true);
      expect(getDismissalState(key1)).toBe(true);
      expect(getDismissalState(key2)).toBe(false);

      // Dismiss awards
      setDismissalState(key2, true);
      expect(getDismissalState(key1)).toBe(true);
      expect(getDismissalState(key2)).toBe(true);

      // Undismiss qualified teams
      setDismissalState(key1, false);
      expect(getDismissalState(key1)).toBe(false);
      expect(getDismissalState(key2)).toBe(true);
    });
  });
});
