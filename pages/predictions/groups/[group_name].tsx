import {ChangeEvent, useEffect, useState} from 'react';
import {Box} from "@mui/material";
import {group_games, groups} from "../../../data/group-data";
import {Game, GameGuess, Group, TeamStats} from "../../../types/definitions";
import {calculateGroupPosition} from "../../../utils/position-calculator";
import GroupSelector from "../../../components/group-selector";
import {createRecords, deleteRecords, GameGuess as StoredGameGuess, getCurrentUserId, query} from "thin-backend";
import {getAwayScore, getLocalScore} from "../../../utils/score-utils";


type GroupPageProps = {
  group: Group,
  groupGames: Game[],
}

type GameGuessDictionary = {
  [key: number]: GameGuess
};

const GroupPage = ( {group, groupGames}: GroupPageProps ) => {
  const [gameGuesses, setGameGuesses] = useState<GameGuessDictionary>({})
  const [groupPositionsByGuess, setGroupPositionsByGuess] = useState<TeamStats[]>([])
  useEffect(() => {
    const groupPosition = calculateGroupPosition(group.teams, groupGames.map(game => ({
      ...game,
      HomeTeamScore: gameGuesses[game.MatchNumber]?.localScore,
      AwayTeamScore: gameGuesses[game.MatchNumber]?.awayScore,
    })))
    setGroupPositionsByGuess(groupPosition);
  }, [gameGuesses])

  useEffect(() => {
    const getData = async () => {
      const currentGameGuesses: StoredGameGuess[] =
        await query('game_guesses')
          .where('userId', getCurrentUserId())
          .whereIn('gameId', groupGames.map(game => game.MatchNumber)).fetch();

      setGameGuesses(Object.fromEntries(currentGameGuesses.map(({ gameId, localScore, awayScore}) => [gameId, {gameId, localScore, awayScore}])));
    };
    getData();

  }, [])

  const handleUpdateScore = (matchNumber: number, homeTeam: boolean) => (event: ChangeEvent<HTMLInputElement>) => {
    let value: number | null = Number.parseInt(event.target.value, 10);
    if(!Number.isInteger(value)) {
      value = null
    }
    setGameGuesses({
      ...gameGuesses,
      [matchNumber]: {
        gameId: matchNumber,
        localScore: homeTeam? value : (gameGuesses[matchNumber] ? gameGuesses[matchNumber].localScore : null),
        awayScore: (!homeTeam)? value : (gameGuesses[matchNumber] ? gameGuesses[matchNumber].awayScore : null),
      }
    })
  }
  const savePredictions = async () => {
    const gameGuessesValues = Object.values(gameGuesses)
    const currentGameGuesses: StoredGameGuess[] =
      await query('game_guesses')
        .where('userId', getCurrentUserId())
        .whereIn('gameId', groupGames.map(game => game.MatchNumber)).fetch();
    console.log(currentGameGuesses)
    await deleteRecords('game_guesses', currentGameGuesses.map(gameGuess => gameGuess.id))
    await createRecords('game_guesses', gameGuessesValues);
  }
  return (
    <Box>
      <GroupSelector/>
      ________________________
      <div>{group.name}</div>
      _________________________
      {group.teams.map(team => (<div key={team}>{team}</div>))}
      _________________________
      {[1,2,3].map(round => groupGames.filter(game => game.RoundNumber === round).map(game => (
        <div key={game.MatchNumber}>{new Date(Date.parse(game.DateUtc)).toLocaleString()} {Intl.DateTimeFormat().resolvedOptions().timeZone} |
          {game.HomeTeam} <input type='number' onChange={handleUpdateScore(game.MatchNumber, true)} value={getLocalScore(gameGuesses[game.MatchNumber])}/> |
          {game.AwayTeam} <input type='number' onChange={handleUpdateScore(game.MatchNumber, false)} value={getAwayScore(gameGuesses[game.MatchNumber])}/></div>
      )))}
      _________________________
      {groupPositionsByGuess.map((teamStats, index) => (
        <div key={index}>{index} | {teamStats.team} | {teamStats.points} | {teamStats.win} | { teamStats.draw} | {teamStats.loss} | {teamStats.goalsFor} | {teamStats.goalsAgainst} | {teamStats.goalDifference} </div>
      ))}
      _________________________
      <div>
        <button onClick={savePredictions}>Save Predictions</button>
      </div>
    </Box>
  )
}

export const getStaticPaths = () => {
  return {
    paths: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(group => ({ params: { group_name: `group-${group}`}})),
    fallback: true
  }
}

export const getStaticProps = ({params}: { params : { group_name: string } }) => {
  const groupName = params.group_name
    .split('-')
    .map(text => text.toLowerCase()
      .replace(/\w/, firstLetter => firstLetter.toUpperCase())
    ).join(' ');
  const group = groups.find(group => group.name === groupName);
  const groupGames = group_games.filter(game => game.Group === groupName);
  return {
    props: {
      group,
      groupGames
    },
    revalidate: 100,
  }
}

export default GroupPage
