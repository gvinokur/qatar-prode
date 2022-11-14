import {GameGuess, GameGuessDictionary} from '../types/definitions';

export const transformBeListToGameGuessDictionary = (beGameGuesses: GameGuess[]): GameGuessDictionary => {
  return Object.fromEntries(beGameGuesses.map(beGameGuess => [beGameGuess.gameId, trimGameGuess(beGameGuess)]))
}

// Keep only attributes for GameGuess type (remove extra ones from BE)
const trimGameGuess = (gameGuess: GameGuess): GameGuess => ({
  gameId: gameGuess.gameId,
  localScore: gameGuess.localScore,
  localTeam: gameGuess.localTeam,
  localPenaltyWinner: gameGuess.localPenaltyWinner,
  awayScore: gameGuess.awayScore,
  awayTeam: gameGuess.awayTeam,
  awayPenaltyWinner: gameGuess.awayPenaltyWinner
})
