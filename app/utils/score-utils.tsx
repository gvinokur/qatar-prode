import {GameGuessNew} from "../db/tables-definition";
import {ExtendedGameData} from "../definitions";

export const getGameWinner = (game: ExtendedGameData) => {
  const homeScore = game.gameResult?.home_score
  const awayScore = game.gameResult?.away_score
  const homePenaltyScore = game.gameResult?.home_penalty_score
  const awayPenaltyScore = game.gameResult?.away_penalty_score
  const homePenaltyWinner =
    Number.isInteger(homePenaltyScore) &&
    Number.isInteger(awayPenaltyScore) &&
    typeof homePenaltyScore !== 'undefined' &&
    typeof awayPenaltyScore !== 'undefined' &&
    (homePenaltyScore > awayPenaltyScore)

  const awayPenaltyWinner =
    Number.isInteger(homePenaltyScore) &&
    Number.isInteger(awayPenaltyScore) &&
    typeof homePenaltyScore !== 'undefined' &&
    typeof awayPenaltyScore !== 'undefined' &&
    (homePenaltyScore < awayPenaltyScore)

  return getWinner(homeScore, awayScore, homePenaltyWinner, awayPenaltyWinner, game.home_team, game.away_team)
}

export const getGameLoser = (game: ExtendedGameData) => {
  const homeScore = game.gameResult?.home_score
  const awayScore = game.gameResult?. away_score
  const homePenaltyScore = game.gameResult?.home_penalty_score
  const awayPenaltyScore = game.gameResult?.away_penalty_score
  const homePenaltyWinner =
    Number.isInteger(homePenaltyScore) &&
    Number.isInteger(awayPenaltyScore) &&
    typeof homePenaltyScore !== 'undefined' &&
    typeof awayPenaltyScore !== 'undefined' &&
    (homePenaltyScore > awayPenaltyScore)

  const awayPenaltyWinner =
    Number.isInteger(homePenaltyScore) &&
    Number.isInteger(awayPenaltyScore) &&
    typeof homePenaltyScore !== 'undefined' &&
    typeof awayPenaltyScore !== 'undefined' &&
    (homePenaltyScore < awayPenaltyScore)

  return getLoser(homeScore, awayScore, homePenaltyWinner, awayPenaltyWinner, game.home_team, game.away_team)
}

export const getGuessWinner = (guess: GameGuessNew, homeTeam?: string | null, awayTeam?: string | null)  => {
  const homeScore = guess.home_score;
  const awayScore = guess.away_score
  return getWinner(homeScore, awayScore, guess.home_penalty_winner, guess.away_penalty_winner, homeTeam, awayTeam)
}

export const getGuessLoser = (guess: GameGuessNew, homeTeam?: string | null, awayTeam?: string | null) => {
  const homeScore = guess.home_score;
  const awayScore = guess.away_score
  return getLoser(homeScore, awayScore, guess.home_penalty_winner, guess.away_penalty_winner, homeTeam, awayTeam)
}

export const getWinner = (homeScore?:number, awayScore?:number, homePenaltyWinner?:boolean, awayPenaltyWinner?:boolean, homeTeam?: string | null, awayTeam?: string | null) => {
  if (
    Number.isInteger(homeScore) &&
    Number.isInteger(awayScore) &&
    typeof homeScore !== 'undefined' &&
    typeof awayScore !== 'undefined'
  ) {
    if (homeScore > awayScore) {
      return homeTeam
    } else if (homeScore < awayScore) {
      return awayTeam
    } else if (homePenaltyWinner) {
      return homeTeam
    } else if (awayPenaltyWinner) {
      return awayTeam
    }
  }
  return;
}

const getLoser = (homeScore?:number, awayScore?:number, homePenaltyWinner?:boolean, awayPenaltyWinner?:boolean, homeTeam?: string | null, awayTeam?: string | null) => {
  if (
    Number.isInteger(homeScore) &&
    Number.isInteger(awayScore) &&
    typeof homeScore !== 'undefined' &&
    typeof awayScore !== 'undefined'
  ) {
    if (homeScore < awayScore) {
      return homeTeam;
    } else if (homeScore > awayScore) {
      return awayTeam;
    } else if (homePenaltyWinner) {
      return awayTeam
    } else if (awayPenaltyWinner) {
      return homeTeam
    }
  }
  return;
}
