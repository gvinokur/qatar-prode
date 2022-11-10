import {ChangeEvent, useEffect, useState} from 'react';
import {
  Box,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import {group_games, groups} from "../../../data/group-data";
import {Game, GameGuess, Group, TeamStats} from "../../../types/definitions";
import {calculateGroupPosition} from "../../../utils/position-calculator";
import GroupSelector from "../../../components/group-selector";
import {createRecords, deleteRecords, getCurrentUserId, query} from "thin-backend";
import {getAwayScore, getLocalScore} from "../../../utils/score-utils";
import GameView from "../../../components/game-view";


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
  }, [gameGuesses, groupGames, group.teams])

  useEffect(() => {
    const getData = async () => {
      const currentGameGuesses: GameGuess[] =
        await query('game_guesses')
          .where('userId', getCurrentUserId())
          .whereIn('gameId', groupGames.map(game => game.MatchNumber)).fetch();

      setGameGuesses(Object.fromEntries(currentGameGuesses.map(({ gameId, localScore, awayScore}) => [gameId, {gameId, localScore, awayScore}])));
    };
    getData();

  }, [groupGames])

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

  const handleGameGuessChange = (gameGuess: GameGuess) => {
    setGameGuesses({
      ...gameGuesses,
      [gameGuess.gameId]: gameGuess
    })
  }

  const savePredictions = async () => {
    const gameGuessesValues = Object.values(gameGuesses)
    const currentGameGuesses: GameGuess[] =
      await query('game_guesses')
        .where('userId', getCurrentUserId())
        .whereIn('gameId', groupGames.map(game => game.MatchNumber)).fetch();
    console.log(currentGameGuesses)
    // @ts-ignore
    await deleteRecords('game_guesses', currentGameGuesses.map(gameGuess => gameGuess.id))
    await createRecords('game_guesses', gameGuessesValues);
  }
  return (
    <Box>
      <GroupSelector group={group.name}/>
      ________________________
      <div>{group.name}</div>
      _________________________
      {group.teams.map(team => (<div key={team}>{team}</div>))}
      _________________________
      <Grid container spacing={2}>
        <Grid item xs={8}>
          {[1,2,3].map(round => (
            <div key={round}>
              <Typography variant={'h5'}>Fecha {round}</Typography>
              <Grid container spacing={2}>
                {groupGames.filter(game => game.RoundNumber === round).map(game => (
                  <Grid key={game.MatchNumber} item xs={6}>
                    <GameView game={game} gameGuess={gameGuesses[game.MatchNumber]} onGameGuessChange={handleGameGuessChange}/>
                  </Grid>
                ))}
              </Grid>
            </div>
          ))}
        </Grid>
        <Grid item xs={4}>
          <Paper>
            <Table>
              <TableHead>
                <TableCell>Pos</TableCell>
                <TableCell>Equipo</TableCell>
                <TableCell>Pts</TableCell>
                <TableCell>G</TableCell>
                <TableCell>E</TableCell>
                <TableCell>P</TableCell>
                <TableCell>GF</TableCell>
                <TableCell>GC</TableCell>
                <TableCell>DG</TableCell>
              </TableHead>
              <TableBody>
                {groupPositionsByGuess.map((teamStats, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{teamStats.team}</TableCell>
                    <TableCell>{teamStats.points}</TableCell>
                    <TableCell>{teamStats.win}</TableCell>
                    <TableCell>{teamStats.draw}</TableCell>
                    <TableCell>{teamStats.loss}</TableCell>
                    <TableCell>{teamStats.goalsFor}</TableCell>
                    <TableCell>{teamStats.goalsAgainst}</TableCell>
                    <TableCell>{teamStats.goalDifference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
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
