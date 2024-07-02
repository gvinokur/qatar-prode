import {GameGuessNew} from "../db/tables-definition";
import {ExtendedGameData} from "../definitions";

export const calculateScoreForGame = (game: ExtendedGameData, gameGuess: GameGuessNew) => {
  if (
    game.gameResult &&
    typeof game.gameResult.home_score === 'number' &&
    Number.isInteger(game.gameResult.home_score) &&
    typeof game.gameResult.away_score === 'number' &&
    Number.isInteger(game.gameResult.away_score) &&
    gameGuess &&
    typeof gameGuess.home_score === 'number' &&
    Number.isInteger(gameGuess.home_score) &&
    typeof gameGuess.away_score === 'number' &&
    Number.isInteger(gameGuess.away_score)) {

    const gameHomeScore = game.gameResult.home_score
    const gameAwayScore = game.gameResult.away_score

    const isPlayoff = game.game_type !== 'group';
    const isTie = (gameHomeScore === gameAwayScore);
    const guessTie = (gameGuess.home_score === gameGuess.away_score)
    let homePenaltyWin = false;
    let awayPenaltyWin = false;

    // Playoff points are only awarded if both teams are the right ones.
    // Not anymore
    // if (isPlayoff &&
    //   (game.home_team !== gameGuess.home_team || game.away_team !== gameGuess.away_team)) {
    //   return 0;
    // }

    // Special case for playoffs and ties
    if (isPlayoff && (gameHomeScore === gameAwayScore)) {
      // @ts-ignore
      homePenaltyWin = (game.gameResult.home_penalty_score > game.gameResult.away_penalty_score)
      // @ts-ignore
      awayPenaltyWin = (game.gameResult.home_penalty_score < game.gameResult.away_penalty_score)
    }

    if (gameHomeScore === gameGuess.home_score && gameAwayScore === gameGuess.away_score) {
      // This condition can only be false in tied games during the playoffs.
      // If the penalty win guess is wrong, then 0 points
      if ((homePenaltyWin && !gameGuess.home_penalty_winner) || (awayPenaltyWin && !gameGuess.away_penalty_winner)) {
        return 0;
      }
      return 2;
    }
    // @ts-ignore Already checking for undefined and null above
    if (Math.sign(gameHomeScore - gameAwayScore) === Math.sign(gameGuess.home_score - gameGuess.away_score)) {
      // This condition can only be false in tied games during the playoffs.
      // If the penalty win guess is wrong, then 0 points
      if (homePenaltyWin && !gameGuess.home_penalty_winner || awayPenaltyWin && !gameGuess.away_penalty_winner) {
        return 0;
      }
      return 1;
    }
    /*
    The next 2 conditions check the following
    A Playoff game was tied, and the guess is correct on the eventual penalty winner (but the guess was a straight win).
    A Playoff game was won by a team, the guess was for a tied with that team winning by penalties.
    Both of these scenarios are 1 pointers
     */
    if (isPlayoff && isTie &&
      (((homePenaltyWin && (gameGuess.home_penalty_winner || gameGuess.home_score > gameGuess.away_score)) ||
        (awayPenaltyWin && (gameGuess.away_penalty_winner || gameGuess.home_score < gameGuess.away_score))))) {
      return 1;
    }
    if (isPlayoff && guessTie &&
      ((gameGuess.home_penalty_winner && (gameHomeScore > gameAwayScore)) ||
        (gameGuess.away_penalty_winner && (gameHomeScore < gameAwayScore)))) {
      return 1
    }
  }
  return 0;
}
