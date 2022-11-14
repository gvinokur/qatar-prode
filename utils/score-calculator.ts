import {Game, GameGuess} from "../types/definitions";
import {group_games} from "../data/group-data";

export const calculateScoreForGroupStageQualifiers = (gameGuesses: { [key: number]: GameGuess }) => {

}

export const calculateScoreForGroupStageGames = (gameGuesses: { [key: number]: GameGuess }) => {
  group_games.reduce((score, game) => {
    const gameScore = calculateScoreForGame(game, gameGuesses[game.MatchNumber])
    return score + gameScore;
  }, 0);
}

export const calculateScoreForGame = (game: Game, gameGuess?: GameGuess) => {
  if (
    typeof game.localScore !== undefined &&
    typeof game.awayScore !== undefined &&
    game.localScore !== null &&
    game.awayScore !== null &&
    typeof gameGuess !== 'undefined' &&
    typeof gameGuess?.localScore !== undefined &&
    typeof gameGuess?.awayScore !== undefined &&
    gameGuess?.localScore !== null &&
    gameGuess?.awayScore !== null) {

    const isPlayoff = game.RoundNumber > 3;
    const isTie = (game.localScore === game.awayScore);
    const guessTie = (gameGuess.localScore === gameGuess.awayScore)
    let homePenaltyWin = false;
    let awayPenaltyWin = false;

    // Special case for playoffs and ties
    if (isPlayoff && (game.localScore === game.awayScore)) {
      // @ts-ignore
      homePenaltyWin = (game.localPenaltyScore > game.awayPenaltyScore)
      // @ts-ignore
      awayPenaltyWin = (game.localPenaltyScore < game.awayPenaltyScore)
    }

    if (game.localScore === gameGuess?.localScore && game.awayScore === gameGuess?.awayScore) {
      // This condition can only be false in tied games during the playoffs.
      // If the penalty win guess is wrong, then 0 points
      if ((homePenaltyWin && !gameGuess.localPenaltyWinner) || (awayPenaltyWin && !gameGuess.awayPenaltyWinner)) {
        return 0;
      }
      return 2;
    }
    // @ts-ignore Already checking for undefined and null above
    if (Math.sign(game.localScore - game.awayScore) === Math.sign(gameGuess.localScore - gameGuess.awayScore)) {
      // This condition can only be false in tied games during the playoffs.
      // If the penalty win guess is wrong, then 0 points
      if (homePenaltyWin && !gameGuess.localPenaltyWinner || awayPenaltyWin && !gameGuess.awayPenaltyWinner) {
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
      (((homePenaltyWin && (gameGuess.localPenaltyWinner || gameGuess.localScore > gameGuess.awayScore)) ||
      (awayPenaltyWin && (gameGuess.awayPenaltyWinner || gameGuess.localScore < gameGuess.awayScore))))) {
      return 1;
    }
    if (isPlayoff && guessTie &&
      ((gameGuess.localPenaltyWinner && (game.localScore > game.awayScore)) ||
        (gameGuess.awayPenaltyWinner && (game.localScore < game.awayScore)))) {
      return 1
    }
  }
  return 0;
}
