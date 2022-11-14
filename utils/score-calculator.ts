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
    typeof game.HomeTeamScore !== undefined &&
    typeof game.AwayTeamScore !== undefined &&
    game.HomeTeamScore !== null &&
    game.AwayTeamScore !== null &&
    typeof gameGuess !== 'undefined' &&
    typeof gameGuess?.localScore !== undefined &&
    typeof gameGuess?.awayScore !== undefined &&
    gameGuess?.localScore !== null &&
    gameGuess?.awayScore !== null) {

    const isPlayoff = game.RoundNumber > 3;
    const isTie = (game.HomeTeamScore === game.AwayTeamScore);
    let homePenaltyWin = false;
    let awayPenaltyWin = false;

    // Special case for playoffs and ties
    if (isPlayoff && (game.HomeTeamScore === game.AwayTeamScore)) {
      // @ts-ignore
      homePenaltyWin = (game.HomeTeamPenaltyScore > game.AwayTeamPenaltyScore)
      // @ts-ignore
      awayPenaltyWin = (game.HomeTeamPenaltyScore < game.AwayTeamPenaltyScore)
    }

    if (game.HomeTeamScore === gameGuess?.localScore && game.AwayTeamScore === gameGuess?.awayScore) {
      // If the away team won and guessed the local team did or the other way around, then return 0
      if ((homePenaltyWin && !gameGuess.localPenaltyWinner) || (awayPenaltyWin && !gameGuess.awayPenaltyWinner)) {
        return 0;
      }
      return 2;
    }
    // @ts-ignore Already checking for undefined and null above
    if (Math.sign(game.HomeTeamScore - game.AwayTeamScore) === Math.sign(gameGuess.localScore - gameGuess.awayScore)) {
      if (homePenaltyWin && !gameGuess.localPenaltyWinner || awayPenaltyWin && !gameGuess.awayPenaltyWinner) {
        return 0;
      }
      return 1;
    }
    if (isPlayoff && isTie &&
      (((homePenaltyWin && (gameGuess.localPenaltyWinner || gameGuess.localScore > gameGuess.awayScore)) ||
      (awayPenaltyWin && (gameGuess.awayPenaltyWinner || gameGuess.localScore < gameGuess.awayScore))))) {
      return 1;
    }
  }
  return 0;
}
