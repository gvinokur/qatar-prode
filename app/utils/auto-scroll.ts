import { ExtendedGameData } from '../definitions';

/**
 * Find the scroll target game ID based on current date
 * @param games - Array of games (should be sorted by date)
 * @returns Element ID to scroll to, or null if no games
 */
export function findScrollTarget(games: ExtendedGameData[]): string | null {
  if (games.length === 0) return null;

  const now = new Date();

  // Find first game with date >= today
  const upcomingGame = games.find(g => g.game_date >= now);

  if (upcomingGame) {
    return `game-${upcomingGame.id}`;
  }

  // No future games, scroll to most recent game
  const lastGame = games[games.length - 1];
  return `game-${lastGame.id}`;
}

/**
 * Scroll to a game element in the DOM
 * @param gameId - Element ID to scroll to (e.g., "game-123")
 * @param behavior - Scroll behavior ('smooth' or 'auto')
 */
export function scrollToGame(gameId: string, behavior: 'smooth' | 'auto' = 'smooth'): void {
  const element = document.getElementById(gameId);

  if (element) {
    element.scrollIntoView({
      behavior,
      block: 'center',
      inline: 'nearest'
    });
  } else {
    // Element not found - silently fail (may not be in DOM yet)
    console.warn(`ScrollToGame: Element with id "${gameId}" not found`);
  }
}
