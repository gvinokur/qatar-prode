import { ExtendedGameData } from '../definitions';
import { Team } from '../db/tables-definition';
import { getTeamDescription } from './playoffs-rule-helper';

/**
 * Calculates team names and short names for a game, checking both the game's
 * team assignments and the user's guess (for playoff games where teams are determined
 * by previous results).
 *
 * @param game - The game data
 * @param gameGuess - The user's guess for this game (may contain team assignments)
 * @param teamsMap - Map of team IDs to team objects
 * @returns Object with team names, short names, and IDs
 */
export function getTeamNames(
  game: ExtendedGameData,
  gameGuess: { home_team?: string | null; away_team?: string | null } | undefined,
  teamsMap: Record<string, Team>
) {
  // Get team IDs from game or guess (for playoff games)
  const homeTeamId = game.home_team || gameGuess?.home_team;
  const awayTeamId = game.away_team || gameGuess?.away_team;

  // Calculate names: use team name if ID exists in map, otherwise use rule description
  const homeTeamName = (homeTeamId && teamsMap[homeTeamId])
    ? teamsMap[homeTeamId].name
    : (getTeamDescription(game.home_team_rule) || 'TBD');

  const awayTeamName = (awayTeamId && teamsMap[awayTeamId])
    ? teamsMap[awayTeamId].name
    : (getTeamDescription(game.away_team_rule) || 'TBD');

  const homeTeamShortName = (homeTeamId && teamsMap[homeTeamId])
    ? teamsMap[homeTeamId].short_name
    : (getTeamDescription(game.home_team_rule, true) || 'TBD');

  const awayTeamShortName = (awayTeamId && teamsMap[awayTeamId])
    ? teamsMap[awayTeamId].short_name
    : (getTeamDescription(game.away_team_rule, true) || 'TBD');

  return {
    homeTeamId,
    awayTeamId,
    homeTeamName,
    awayTeamName,
    homeTeamShortName,
    awayTeamShortName,
  };
}
