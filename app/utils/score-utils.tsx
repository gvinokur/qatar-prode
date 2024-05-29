import {GameGuessNew, GameResult} from "../db/tables-definition";


export const getWinner = (guess: GameGuessNew, homeTeam?: string, awayTeam?: string): string | undefined  => {
  const homeScore = guess.home_score;
  const awayScore = guess.away_score
  if (
    Number.isInteger(homeScore) &&
    Number.isInteger(awayScore) &&
    typeof homeScore !== 'undefined' &&
    typeof awayScore !== 'undefined'
  ) {
    if (homeScore > awayScore) {
      return homeTeam;
    } else if (homeScore < awayScore) {
      return awayTeam;
    } else if (guess.home_penalty_winner) {
      return homeTeam
    } else if (guess.away_penalty_winner) {
      return awayTeam
    }
  }
  return;
}

export const getLoser = (guess: GameGuessNew, homeTeam?: string, awayTeam?: string): string | undefined => {
  const homeScore = guess.home_score;
  const awayScore = guess.away_score
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
    } else if (guess.home_penalty_winner) {
      return awayTeam
    } else if (guess.away_penalty_winner) {
      return homeTeam
    }
  }
  return;
}
