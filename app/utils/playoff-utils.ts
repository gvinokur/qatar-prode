/**
 * Playoff Utility Functions
 *
 * Pure utility functions for playoff calculations that can be safely used
 * in both client and server components. No database dependencies.
 */

import { ExtendedGameData } from "../definitions";
import { Game, GameGuessNew } from "../db/tables-definition";
import { isTeamWinnerRule } from "./playoffs-rule-helper";
import { getGuessLoser, getGuessWinner } from "./score-utils";

/**
 * Calculate team names for playoff games based on guesses
 * Used to show which teams will play in future playoff rounds based on predictions
 */
export function calculateTeamNamesForPlayoffGame(
  isPlayoffGame: boolean,
  game: ExtendedGameData,
  gameGuesses: { [k: string]: GameGuessNew },
  gamesMap: { [p: string]: Game } | undefined
) {
  /**
   * Recalculate the home and away teams for playoffs of rounds below the first playoff round every time
   * a guess in the playoffs change.
   * Only do this before the games have been played and an actual team exists.
   */
  if (
    isPlayoffGame &&
    !game.home_team &&
    !game.away_team &&
    isTeamWinnerRule(game.home_team_rule) &&
    isTeamWinnerRule(game.away_team_rule)
  ) {
    let homeTeam;
    let awayTeam;

    const homeTeamRule = game.home_team_rule;
    const homeGameGuess = Object.values(gameGuesses).find(
      (guess) => guess.game_number === homeTeamRule.game
    );
    const homeGame =
      gamesMap &&
      Object.values(gamesMap).find(
        (game) => game.game_number === homeTeamRule.game
      );

    if (homeGameGuess) {
      homeTeam = homeTeamRule.winner
        ? getGuessWinner(
            homeGameGuess,
            homeGame?.home_team || homeGameGuess?.home_team,
            homeGame?.away_team || homeGameGuess?.away_team
          )
        : getGuessLoser(
            homeGameGuess,
            homeGame?.home_team || homeGameGuess?.home_team,
            homeGame?.away_team || homeGameGuess?.away_team
          );
    }

    const awayTeamRule = game.away_team_rule;
    const awayGameGuess = Object.values(gameGuesses).find(
      (guess) => guess.game_number === awayTeamRule.game
    );
    const awayGame =
      gamesMap &&
      Object.values(gamesMap).find(
        (game) => game.game_number === awayTeamRule.game
      );

    if (awayGameGuess) {
      awayTeam = awayTeamRule.winner
        ? getGuessWinner(
            awayGameGuess,
            awayGame?.home_team || awayGameGuess?.home_team,
            awayGame?.away_team || awayGameGuess?.away_team
          )
        : getGuessLoser(
            awayGameGuess,
            awayGame?.home_team || awayGameGuess?.home_team,
            awayGame?.away_team || awayGameGuess?.away_team
          );
    }
    return {
      homeTeam,
      awayTeam,
    };
  }
}
