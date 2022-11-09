import {Game, GameGuess} from "../../types/definitions";
import {final, group_games, groups, round_of_16, round_of_eight, semifinals, third_place} from "../../data/group-data";
import {ChangeEvent, useEffect, useState} from "react";
import {createRecords, deleteRecords, GameGuess as StoredGameGuess, getCurrentUserId, query} from "thin-backend";
import {calculateGroupPosition} from "../../utils/position-calculator";
import {Box} from "@mui/material";
import GroupSelector from "../../components/group-selector";
import {getAwayScore, getLocalScore, getLoser, getWinner} from "../../utils/score-utils";

type PlayoffProps = {
  roundOfSixteen: Game[],
  roundOfEight: Game[],
  semifinals: Game[],
  thirdPlace: Game,
  final: Game,
}

type GameGuessDictionary = {
  [key: number]: GameGuess
};

const Playoffs = () => {
  const [gameGuesses, setGameGuesses] = useState<GameGuessDictionary>({})
  const [calculatedTeamNameToGameMap, setCalculatedTeamNameToGameMap] = useState<{ [key: number]: { homeTeam: string, awayTeam: string } }>({})

  const recalculateLowerRounds = (gameGuesses: GameGuessDictionary, currentMap: { [key: number]: { homeTeam: string, awayTeam: string } }) => {
    const mapGame = (currentMap: { [key: number]: { homeTeam: string, awayTeam: string } }, fn: (guess: GameGuess, homeTeam: string, awayTeam: string ) => string | null) => (game: Game): any[] => [
      game.MatchNumber,
      {
        // @ts-ignore
        homeTeam:
          fn(gameGuesses[game.HomeTeam as number],
            currentMap[game.HomeTeam as number]?.homeTeam,
            currentMap[game.HomeTeam as number]?.awayTeam),
        // @ts-ignore
        awayTeam:
          fn(gameGuesses[game.AwayTeam as number],
            currentMap[game.AwayTeam as number]?.homeTeam,
            currentMap[game.AwayTeam as number]?.awayTeam),
      }];
    currentMap = {
      ...currentMap,
      ...Object.fromEntries(round_of_eight.map(mapGame(currentMap, getWinner)))
    }
    currentMap = {
      ...currentMap,
      ...Object.fromEntries(semifinals.map(mapGame(currentMap, getWinner)))
    }
    const finalArray = mapGame(currentMap, getWinner)(final);
    const thirdPlaceArray = mapGame(currentMap, getLoser)(third_place);
    currentMap = {
      ...currentMap,
      [finalArray[0]]: finalArray[1],
      [thirdPlaceArray[0]]: thirdPlaceArray[1]
    }

    return currentMap;
  }

  useEffect(() => {
    const getData = async () => {
      const currentGameGuesses: StoredGameGuess[] =
        await query('game_guesses')
          .where('userId', getCurrentUserId()).fetch();
      const gameGuesses = Object.fromEntries(currentGameGuesses.map(({ gameId, localScore, awayScore}) => [gameId, {gameId, localScore, awayScore}]))
      setGameGuesses(gameGuesses);

      const positionTeamMap = groups.reduce((tempMap, group) => {
        const groupPositions = calculateGroupPosition(group.teams, group_games.filter(game => game.Group === group.name).map(game => ({
          ...game,
          HomeTeamScore: gameGuesses[game.MatchNumber]?.localScore,
          AwayTeamScore: gameGuesses[game.MatchNumber]?.awayScore,
        })));
        return {
          ...tempMap,
          [`1-${group.name}`]: groupPositions[0]?.team,
          [`2-${group.name}`]: groupPositions[1]?.team,
        }
      }, {})

      const currentMap = Object.fromEntries(
        round_of_16.map(game => [
          game.MatchNumber,
          {
            // @ts-ignore
            homeTeam: positionTeamMap[`${game.HomeTeam.position}-${game.HomeTeam.group}`] as string,
            // @ts-ignore
            awayTeam: positionTeamMap[`${game.AwayTeam.position}-${game.AwayTeam.group}`] as string,
          }]))

      setCalculatedTeamNameToGameMap(recalculateLowerRounds(gameGuesses, currentMap))
    }

    getData();
  }, [])

  const handleUpdateScore = (matchNumber: number, homeTeam: boolean) => (event: ChangeEvent<HTMLInputElement>) => {
    let value: number | null = Number.parseInt(event.target.value, 10);
    if(!Number.isInteger(value)) {
      value = null
    }
    const newGameGuesses = {
      ...gameGuesses,
      [matchNumber]: {
        gameId: matchNumber,
        localScore: homeTeam? value : (gameGuesses[matchNumber] ? gameGuesses[matchNumber].localScore : null),
        awayScore: (!homeTeam)? value : (gameGuesses[matchNumber] ? gameGuesses[matchNumber].awayScore : null),
      }
    }
    setGameGuesses(newGameGuesses)

    setCalculatedTeamNameToGameMap(recalculateLowerRounds(newGameGuesses, calculatedTeamNameToGameMap))
  }

  const savePredictions = async () => {
    const gameGuessesValues = Object.values(gameGuesses)
    const currentGameGuesses: StoredGameGuess[] =
      await query('game_guesses')
        .where('userId', getCurrentUserId())
        .whereIn('gameId', [...round_of_16, ...round_of_eight, ...semifinals, final, third_place].map(game => game.MatchNumber)).fetch();

    await deleteRecords('game_guesses', currentGameGuesses.map(gameGuess => gameGuess.id))
    await createRecords('game_guesses', gameGuessesValues);
  }

  // @ts-ignore
  return (
    <Box>
      <GroupSelector />
      ------------- Round of 16 ----------------
      {round_of_16.map(game => (
        <div key={game.MatchNumber}>
          {new Date(Date.parse(game.DateUtc)).toLocaleString()} {Intl.DateTimeFormat().resolvedOptions().timeZone} |
          {calculatedTeamNameToGameMap[game.MatchNumber]?.homeTeam}
          <input type='number' onChange={handleUpdateScore(game.MatchNumber, true)} value={getLocalScore(gameGuesses[game.MatchNumber])}/>
          |
          {calculatedTeamNameToGameMap[game.MatchNumber]?.awayTeam}
          <input type='number' onChange={handleUpdateScore(game.MatchNumber, false)} value={getAwayScore(gameGuesses[game.MatchNumber])}/>
        </div>
      ))}
      ------------- Round of 8 ----------------
      {round_of_eight.map(game => (
        <div key={game.MatchNumber}>
          {new Date(Date.parse(game.DateUtc)).toLocaleString()} {Intl.DateTimeFormat().resolvedOptions().timeZone} |
          {calculatedTeamNameToGameMap[game.MatchNumber]?.homeTeam  || `Winner of Match ${game.HomeTeam}`}
          <input type='number' onChange={handleUpdateScore(game.MatchNumber, true)} value={getLocalScore(gameGuesses[game.MatchNumber])}/> |
          {calculatedTeamNameToGameMap[game.MatchNumber]?.awayTeam || `Winner of Match ${game.AwayTeam}`}
          <input type='number' onChange={handleUpdateScore(game.MatchNumber, false)} value={getAwayScore(gameGuesses[game.MatchNumber])}/> |
        </div>
      ))}
      ------------- Semifinals ----------------
      {semifinals.map(game => (
        <div key={game.MatchNumber}>
          {new Date(Date.parse(game.DateUtc)).toLocaleString()} {Intl.DateTimeFormat().resolvedOptions().timeZone} |
          {calculatedTeamNameToGameMap[game.MatchNumber]?.homeTeam  || `Winner of Match ${game.HomeTeam}`}
          <input type='number' onChange={handleUpdateScore(game.MatchNumber, true)} value={getLocalScore(gameGuesses[game.MatchNumber])}/> |
          {calculatedTeamNameToGameMap[game.MatchNumber]?.awayTeam || `Winner of Match ${game.AwayTeam}`}
          <input type='number' onChange={handleUpdateScore(game.MatchNumber, false)} value={getAwayScore(gameGuesses[game.MatchNumber])}/> |
        </div>
      ))}
      ----------- Final ----------------
      <div>
        {new Date(Date.parse(final.DateUtc)).toLocaleString()} {Intl.DateTimeFormat().resolvedOptions().timeZone} |
        {calculatedTeamNameToGameMap[final.MatchNumber]?.homeTeam  || `Winner of Match ${final.HomeTeam}`}
        <input type='number' onChange={handleUpdateScore(final.MatchNumber, true)} value={getLocalScore(gameGuesses[final.MatchNumber])}/> |
        {calculatedTeamNameToGameMap[final.MatchNumber]?.awayTeam || `Winner of Match ${final.AwayTeam}`}
        <input type='number' onChange={handleUpdateScore(final.MatchNumber, false)} value={getAwayScore(gameGuesses[final.MatchNumber])}/> |
      </div>
      ----------- Third Place ----------------
      <div>
        {new Date(Date.parse(third_place.DateUtc)).toLocaleString()} {Intl.DateTimeFormat().resolvedOptions().timeZone} |
        {calculatedTeamNameToGameMap[third_place.MatchNumber]?.homeTeam  || `Winner of Match ${third_place.HomeTeam}`}
        <input type='number' onChange={handleUpdateScore(third_place.MatchNumber, true)} value={getLocalScore(gameGuesses[third_place.MatchNumber])}/> |
        {calculatedTeamNameToGameMap[third_place.MatchNumber]?.awayTeam || `Winner of Match ${third_place.AwayTeam}`}
        <input type='number' onChange={handleUpdateScore(third_place.MatchNumber, false)} value={getAwayScore(gameGuesses[third_place.MatchNumber])}/> |
      </div>
      ---------- Honor Box ----------
      <div>First Place: {getWinner(gameGuesses[final.MatchNumber], calculatedTeamNameToGameMap[final.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[final.MatchNumber]?.awayTeam )}</div>
      <div>First Place: {getLoser(gameGuesses[final.MatchNumber], calculatedTeamNameToGameMap[final.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[final.MatchNumber]?.awayTeam )}</div>
      <div>First Place: {getWinner(gameGuesses[third_place.MatchNumber], calculatedTeamNameToGameMap[third_place.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[third_place.MatchNumber]?.awayTeam )}</div>
      -------------------------------
      <div>
        <button onClick={savePredictions}>Save Predictions</button>
      </div>
    </Box>
  )
}

export default Playoffs
