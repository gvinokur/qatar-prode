import {Game, GameGuess} from "../types/definitions";
import {groups} from "../data/group-data";
import {calculateGroupPosition} from "./position-calculator";
import {User} from "thin-backend";
import {getLoser, getWinner} from "./score-utils";

export const calculateScoreForHonorRoll = (final: Game, thirdPlace: Game, user: User | null) => {
  const championTeam = getWinner(final, final.CalculatedHomeTeam || '', final.CalculatedAwayTeam || '');
  const secondPlaceTeam = getLoser(final, final.CalculatedHomeTeam || '', final.CalculatedAwayTeam || '');
  const thirdPlaceTeam = getWinner(thirdPlace, thirdPlace.CalculatedHomeTeam || '', thirdPlace.CalculatedAwayTeam || '');
  let points = 0;
  if (championTeam !== null && championTeam === user?.championGuess) {
    points += 5
  }
  if (secondPlaceTeam !== null && secondPlaceTeam === user?.secondPlaceGuess) {
    points += 3
  }
  if (thirdPlaceTeam !== null && thirdPlaceTeam === user?.thirdPlaceGuess) {
    points += 1
  }
  return {
    championTeam,
    secondPlaceTeam,
    thirdPlaceTeam,
    points
  }
}

export const calculateScoreForGroupStageQualifiers = (groupGames: Game[], gameGuesses: { [key: number]: GameGuess }) => {
  let score = 0;
  groups.forEach(group => {
    const thisGroupGames = groupGames.filter(game => game.Group === group.name);
    const allGroupGamesPlayed = thisGroupGames.filter(game => (game.localScore === null || game.awayScore === null)).length === 0;
    if(allGroupGamesPlayed) {
      const realPositions = calculateGroupPosition(group.teams, thisGroupGames);
      const guessedPositions = calculateGroupPosition(group.teams, thisGroupGames.map(game => ({
        ...game,
        localScore: gameGuesses[game.MatchNumber]?.localScore,
        awayScore: gameGuesses[game.MatchNumber]?.awayScore,
      })))
      if (guessedPositions[0].team === realPositions[0].team ||
        guessedPositions[0].team === realPositions[1].team) {
        score++;
      }
      if (guessedPositions[1].team === realPositions[0].team ||
        guessedPositions[1].team === realPositions[1].team) {
        score++;
      }
    }
  })
  return score;
}

export const calculateScoreStatsForGames = (groupGames: Game[], gameGuesses: { [key: number]: GameGuess }) => {
  const scoreByGame: number[] = groupGames.map(game => calculateScoreForGame(game, gameGuesses[game.MatchNumber]))
  return {
    correctPredictions: scoreByGame.filter(score => score >= 1).length ,
    exactPredictions: scoreByGame.filter(score => score > 1).length,
    totalPoints: scoreByGame.reduce((accum, score) => score + accum, 0)
  }
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

    // Playoff points are only awarded if both teams are the right ones.
    if (isPlayoff &&
      (game.CalculatedHomeTeam !== gameGuess.localTeam || game.CalculatedAwayTeam !== gameGuess.awayTeam)) {
      return 0;
    }

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
