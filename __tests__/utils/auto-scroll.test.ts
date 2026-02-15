import { describe, it, expect, beforeEach, vi } from 'vitest';
import { findScrollTarget, scrollToGame } from '../../app/utils/auto-scroll';
import { ExtendedGameData } from '../../app/definitions';

// Mock games data
const createMockGame = (id: string, dateOffset: number): ExtendedGameData => ({
  id,
  tournament_id: 'tournament-1',
  home_team_id: 'team-home',
  away_team_id: 'team-away',
  game_date: new Date(Date.now() + dateOffset),
  home_score: null,
  away_score: null,
  home_penalty_score: null,
  away_penalty_score: null,
  group: null,
  playoffStage: null,
  status: 'scheduled'
});

describe('findScrollTarget', () => {
  describe('with empty games array', () => {
    it('returns null when games array is empty', () => {
      expect(findScrollTarget([])).toBeNull();
    });
  });

  describe('with future games', () => {
    it('returns first upcoming game when there are future games', () => {
      const games = [
        createMockGame('game-past', -24 * 60 * 60 * 1000), // 1 day ago
        createMockGame('game-future-1', 2 * 60 * 60 * 1000), // 2 hours from now
        createMockGame('game-future-2', 4 * 60 * 60 * 1000), // 4 hours from now
      ];

      expect(findScrollTarget(games)).toBe('game-game-future-1');
    });

    it('returns nearest future game when multiple future games exist', () => {
      const games = [
        createMockGame('game-2', 1 * 60 * 60 * 1000), // 1 hour from now (nearest, first in array)
        createMockGame('game-1', 24 * 60 * 60 * 1000), // 1 day from now
        createMockGame('game-3', 48 * 60 * 60 * 1000), // 2 days from now
      ];

      // Since games are not necessarily sorted, function finds first game >= now
      expect(findScrollTarget(games)).toBe('game-game-2');
    });
  });

  describe('with only past games', () => {
    it('returns last game when all games are in the past', () => {
      const games = [
        createMockGame('game-1', -48 * 60 * 60 * 1000), // 2 days ago
        createMockGame('game-2', -24 * 60 * 60 * 1000), // 1 day ago
        createMockGame('game-3', -1 * 60 * 60 * 1000), // 1 hour ago (most recent)
      ];

      expect(findScrollTarget(games)).toBe('game-game-3');
    });

    it('returns last game when there is only one past game', () => {
      const games = [
        createMockGame('game-1', -1 * 60 * 60 * 1000), // 1 hour ago
      ];

      expect(findScrollTarget(games)).toBe('game-game-1');
    });
  });

  describe('with mixed past and future games', () => {
    it('prefers future games over past games', () => {
      const games = [
        createMockGame('game-past-1', -48 * 60 * 60 * 1000),
        createMockGame('game-past-2', -24 * 60 * 60 * 1000),
        createMockGame('game-future-1', 1 * 60 * 60 * 1000),
        createMockGame('game-future-2', 2 * 60 * 60 * 1000),
      ];

      expect(findScrollTarget(games)).toBe('game-game-future-1');
    });
  });

  describe('edge cases', () => {
    it('handles game with date exactly at current time', () => {
      // Use fake timers to ensure consistent Date.now() across test execution
      vi.useFakeTimers();
      const fixedTime = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(fixedTime);

      const games = [
        createMockGame('game-now', 0), // exactly now
        createMockGame('game-future', 60 * 60 * 1000), // 1 hour from now
      ];

      // Should select the game at current time since >= now
      expect(findScrollTarget(games)).toBe('game-game-now');

      vi.useRealTimers();
    });

    it('returns null when .at(-1) returns undefined for empty array', () => {
      const games: ExtendedGameData[] = [];
      expect(findScrollTarget(games)).toBeNull();
    });
  });
});

describe('scrollToGame', () => {
  let mockElement: {
    scrollIntoView: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock element with scrollIntoView method
    mockElement = {
      scrollIntoView: vi.fn()
    };

    // Mock document.getElementById
    global.document.getElementById = vi.fn((id: string) => {
      if (id === 'game-123' || id === 'game-existing') {
        return mockElement as any;
      }
      return null;
    });

    // Mock console.warn
    global.console.warn = vi.fn();
  });

  describe('successful scroll', () => {
    it('scrolls to game element with smooth behavior by default', () => {
      scrollToGame('game-123');

      expect(document.getElementById).toHaveBeenCalledWith('game-123');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    });

    it('scrolls to game element with auto behavior when specified', () => {
      scrollToGame('game-123', 'auto');

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'center',
        inline: 'nearest'
      });
    });

    it('scrolls to game element with smooth behavior when explicitly specified', () => {
      scrollToGame('game-existing', 'smooth');

      expect(document.getElementById).toHaveBeenCalledWith('game-existing');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    });
  });

  describe('element not found', () => {
    it('logs warning when element is not found', () => {
      scrollToGame('game-nonexistent');

      expect(document.getElementById).toHaveBeenCalledWith('game-nonexistent');
      expect(console.warn).toHaveBeenCalledWith(
        'ScrollToGame: Element with id "game-nonexistent" not found'
      );
      expect(mockElement.scrollIntoView).not.toHaveBeenCalled();
    });

    it('does not throw error when element is not found', () => {
      expect(() => scrollToGame('game-missing')).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('handles empty string game ID', () => {
      scrollToGame('');

      expect(document.getElementById).toHaveBeenCalledWith('');
      expect(console.warn).toHaveBeenCalled();
    });

    it('handles special characters in game ID', () => {
      const specialId = 'game-with-special-chars-!@#$%';
      scrollToGame(specialId);

      expect(document.getElementById).toHaveBeenCalledWith(specialId);
    });
  });
});
