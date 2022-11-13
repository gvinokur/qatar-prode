import {Game, GameGuess} from "../types/definitions";

export const getLocalScore = (guess: GameGuess): number | '' => {
  return (guess && guess.localScore !== null) ? guess.localScore : '';
}
export const getAwayScore = (guess: GameGuess): number | '' => {
  return (guess && guess.awayScore !== null) ? guess.awayScore : '';
}

export const getWinner = (guess: GameGuess, homeTeam: string, awayTeam: string): string | null => {
  if (guess && guess.localScore !== null && guess.awayScore !== null && Number.isInteger(guess.localScore) && Number.isInteger(guess.awayScore)) {
    if (guess.localScore > guess.awayScore) {
      return homeTeam;
    } else if (guess.localScore < guess.awayScore) {
      return awayTeam;
    } else if (guess.localPenaltyWinner) {
      return homeTeam
    } else if (guess.awayPenaltyWinner) {
      return awayTeam
    }
  }
  return null;
}

export const getLoser = (guess: GameGuess, homeTeam: string, awayTeam: string): string | null => {
  if (guess && guess.localScore !== null && guess.awayScore !== null && Number.isInteger(guess.localScore) && Number.isInteger(guess.awayScore)) {
    if (guess.localScore < guess.awayScore) {
      return homeTeam;
    } else if (guess.localScore > guess.awayScore) {
      return awayTeam;
    } else if (guess.localPenaltyWinner) {
      return awayTeam
    } else if (guess.awayPenaltyWinner) {
      return homeTeam
    }
  }
  return null;
}
