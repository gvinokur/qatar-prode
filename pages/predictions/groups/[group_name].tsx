import {ChangeEvent, useEffect, useState} from 'react';
import {
  Alert,
  Box, Button,
  CardContent,
  Grid,
  Paper, Snackbar,
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
import {LoadingButton} from "@mui/lab";


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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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

  const handleGameGuessChange = (gameGuess: GameGuess) => {
    setGameGuesses({
      ...gameGuesses,
      [gameGuess.gameId]: gameGuess
    })
  }

  const savePredictions = async () => {
    setSaving(true)
    const gameGuessesValues = Object.values(gameGuesses)
    const currentGameGuesses: GameGuess[] =
      await query('game_guesses')
        .where('userId', getCurrentUserId())
        .whereIn('gameId', groupGames.map(game => game.MatchNumber)).fetch();
    console.log(currentGameGuesses)
    // @ts-ignore
    await deleteRecords('game_guesses', currentGameGuesses.map(gameGuess => gameGuess.id))
    await createRecords('game_guesses', gameGuessesValues);
    setSaving(false)
    setSaved(true)
  }
  return (
    <Box p={2}>
      <GroupSelector group={group.name}/>
      <Grid container spacing={4} mt={'8px'}>
        <Grid item xs={6}>
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
        <Grid item xs={6}>
          <Typography variant={'h5'}>Tabla de Resultados</Typography>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pos</TableCell>
                  <TableCell>Equipo</TableCell>
                  <TableCell>Pts</TableCell>
                  <TableCell>G</TableCell>
                  <TableCell>E</TableCell>
                  <TableCell>P</TableCell>
                  <TableCell>GF</TableCell>
                  <TableCell>GC</TableCell>
                  <TableCell>DG</TableCell>
                </TableRow>
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
          <LoadingButton loading={saving} variant='contained' size='large' onClick={savePredictions} sx={{ marginTop: '16px'}}>Guardar Pronostico</LoadingButton>
          <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
            <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
              Tus pronosticos se guardaron correctamente!
            </Alert>
          </Snackbar>
        </Grid>
      </Grid>
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
