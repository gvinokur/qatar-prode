import { ExtendedGameData } from '../definitions';
import { GameGuessNew } from '../db/tables-definition';

export type FilterType = 'all' | 'groups' | 'playoffs' | 'unpredicted' | 'closingSoon';

/**
 * Filter games based on primary and secondary filters
 * @param games - Array of games to filter
 * @param activeFilter - Primary filter type
 * @param groupFilter - Secondary filter: specific group ID or null
 * @param roundFilter - Secondary filter: specific playoff round ID or null
 * @param gameGuesses - Record of user's game guesses
 * @returns Filtered and sorted games array
 */
export function filterGames(
  games: ExtendedGameData[],
  activeFilter: FilterType,
  groupFilter: string | null,
  roundFilter: string | null,
  gameGuesses: Record<string, GameGuessNew>
): ExtendedGameData[] {
  let filtered = games;

  // Primary filter
  switch (activeFilter) {
    case 'groups':
      filtered = games.filter(g => g.group !== null && g.group !== undefined);
      break;
    case 'playoffs':
      filtered = games.filter(g => g.playoffStage !== null && g.playoffStage !== undefined);
      break;
    case 'unpredicted':
      filtered = games.filter(g => {
        const guess = gameGuesses[g.id];
        return !guess || guess.home_score === null || guess.away_score === null;
      });
      break;
    case 'closingSoon': {
      const now = Date.now();
      const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
      filtered = games.filter(g => {
        const timeUntilGame = g.game_date.getTime() - now;
        return timeUntilGame > 0 && timeUntilGame < FORTY_EIGHT_HOURS;
      });
      break;
    }
    case 'all':
    default:
      // No filtering
      break;
  }

  // Secondary filter: Group
  if (groupFilter) {
    filtered = filtered.filter(g => g.group?.tournament_group_id === groupFilter);
  }

  // Secondary filter: Round
  if (roundFilter) {
    filtered = filtered.filter(g =>
      g.playoffStage?.tournament_playoff_round_id === roundFilter
    );
  }

  // Sort by game date (ascending)
  return filtered.sort((a, b) => a.game_date.getTime() - b.game_date.getTime());
}

/**
 * Calculate badge counts for each filter type
 * @param games - Array of all games
 * @param gameGuesses - Record of user's game guesses
 * @returns Object with counts for each filter type
 */
export function calculateFilterCounts(
  games: ExtendedGameData[],
  gameGuesses: Record<string, GameGuessNew>
): {
  total: number;
  groups: number;
  playoffs: number;
  unpredicted: number;
  closingSoon: number;
} {
  const now = Date.now();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

  let groupsCount = 0;
  let playoffsCount = 0;
  let unpredictedCount = 0;
  let closingSoonCount = 0;

  games.forEach(game => {
    // Count group games
    if (game.group !== null && game.group !== undefined) {
      groupsCount++;
    }

    // Count playoff games
    if (game.playoffStage !== null && game.playoffStage !== undefined) {
      playoffsCount++;
    }

    // Count unpredicted games
    const guess = gameGuesses[game.id];
    if (!guess || guess.home_score === null || guess.away_score === null) {
      unpredictedCount++;
    }

    // Count games closing soon (within 48 hours)
    const timeUntilGame = game.game_date.getTime() - now;
    if (timeUntilGame > 0 && timeUntilGame < FORTY_EIGHT_HOURS) {
      closingSoonCount++;
    }
  });

  return {
    total: games.length,
    groups: groupsCount,
    playoffs: playoffsCount,
    unpredicted: unpredictedCount,
    closingSoon: closingSoonCount
  };
}
