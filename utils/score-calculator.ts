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
    typeof gameGuess?.awayScore !== undefined) {

    if (game.HomeTeamScore === gameGuess?.localScore && game.AwayTeamScore === gameGuess?.awayScore) {
      return 2;
    }
    // @ts-ignore Already checking for undefined and null above
    if (Math.sign(game.HomeTeamScore - game.AwayTeamScore) === Math.sign(gameGuess.localScore - gameGuess.awayScore)) {
      return 1;
    }
  }
  return 0;
}
