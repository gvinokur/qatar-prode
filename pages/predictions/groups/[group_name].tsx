import { useEffect, useState} from 'react';
import {
  Alert, Avatar,
  Box,
  Grid,
  Paper, Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography, useMediaQuery,
} from "@mui/material";
import {group_games, groups} from "../../../data/group-data";
import {Game, GameGuess, Group, TeamStats} from "../../../types/definitions";
import {calculateGroupPosition} from "../../../utils/position-calculator";
import GroupSelector from "../../../components/group-selector";
import {createRecords, deleteRecords, getCurrentUserId, query} from "thin-backend";
import GameView from "../../../components/game-view";
import {LoadingButton} from "@mui/lab";
import {Close as MissIcon, Done as HitIcon} from "@mui/icons-material";
import {useTheme} from "@mui/system";
import {transformBeListToGameGuessDictionary} from "../../../utils/be-utils";
import {useCurrentUser} from "thin-backend-react";


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
  const [groupPositions, setGroupPositions] = useState<TeamStats[]>([])
  const [usePredictionsTable, setUsePredictionsTable] = useState(true)
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = useCurrentUser();
  const xsMatch = useMediaQuery('(min-width:900px)')
  const theme = useTheme();

  useEffect(() => {
    const groupPosition = calculateGroupPosition(group.teams, groupGames.map(game => ({
      ...game,
      localScore: gameGuesses[game.MatchNumber]?.localScore,
      awayScore: gameGuesses[game.MatchNumber]?.awayScore,
    })))
    setGroupPositionsByGuess(groupPosition);

    setGroupPositions(calculateGroupPosition(group.teams, groupGames));
  }, [gameGuesses, groupGames, group.teams])

  useEffect(() => {
    const getData = async () => {
      const currentGameGuesses: GameGuess[] =
        await query('game_guesses')
          .where('userId', getCurrentUserId())
          .whereIn('gameId', groupGames.map(game => game.MatchNumber)).fetch();

      setGameGuesses(transformBeListToGameGuessDictionary(currentGameGuesses));
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
    // @ts-ignore
    await deleteRecords('game_guesses', currentGameGuesses.map(gameGuess => gameGuess.id))
    await createRecords('game_guesses', gameGuessesValues);
    setSaving(false)
    setSaved(true)
  }

  const editDisabled = (game: Game) => {
    if (['gustavo@grupowelltech.com', 'vaguiler@hotmail.com', 'lorenaarchidamo@grupowellltech.com'].includes(user?.email || '')) {
      return (Date.now() > Date.parse(game.DateUtc))
    }
    return Date.now() > new Date(2022, 10, 20).valueOf();
  }
  const allGroupGamesPlayed = groupGames.filter(game => (game.localScore === null || game.awayScore === null)).length === 0;

  return (
    <Box p={2}>
      <GroupSelector group={group.name}/>
      <Grid container spacing={4} mt={'8px'}>
        <Grid item xs={12} md={6}>
          {[1,2,3].map(round => (
            <Box key={round} mb={3}>
              <Typography variant={'h5'}>Fecha {round}</Typography>
              <Grid container spacing={2} >
                {groupGames.filter(game => game.RoundNumber === round).map(game => (
                  <Grid key={game.MatchNumber} item xs={6}>
                    <GameView game={game} gameGuess={gameGuesses[game.MatchNumber]} onGameGuessChange={handleGameGuessChange} editDisabled={editDisabled(game)}/>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Grid>
        <Grid item xs={12} md={6} mb={xsMatch ? 0 : 12}>
          <Box display='flex'>
            <Typography variant={'h5'} component='a' flexGrow={1} sx={{ textDecoration: 'underline'}}
                        onClick={() => setUsePredictionsTable(true)}>
              Tabla de Pronosticos
            </Typography>
            <Typography variant={'h5'} component='a' flexGrow={1} sx={{ textDecoration: 'underline'}} textAlign='right'
                        onClick={() => setUsePredictionsTable(false)}>
              Tabla Real
            </Typography>
          </Box>
          <Paper>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main'}}>
                  <TableCell sx={{ color: 'primary.contrastText'}}>Pos</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText'}}>Equipo</TableCell>
                  <TableCell sx={{ color: 'primary.contrastText'}}>Pts</TableCell>
                  {xsMatch && <TableCell sx={{ color: 'primary.contrastText'}}>G</TableCell>}
                  {xsMatch && <TableCell sx={{ color: 'primary.contrastText'}}>E</TableCell>}
                  {xsMatch && <TableCell sx={{ color: 'primary.contrastText'}}>P</TableCell> }
                  {xsMatch && <TableCell sx={{ color: 'primary.contrastText'}}>GF</TableCell>}
                  {xsMatch && <TableCell sx={{ color: 'primary.contrastText'}}>GC</TableCell>}
                  <TableCell sx={{ color: 'primary.contrastText'}}>DG</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(usePredictionsTable ? groupPositionsByGuess : groupPositions).map((teamStats, index) => (
                  <TableRow key={index} sx={[0,1].includes(index) ? {backgroundColor: 'primary.contrastText'} : {}}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell sx={{
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}>
                      {usePredictionsTable && allGroupGamesPlayed && index < 2 && (
                        <Box sx={{ float: 'right'}}>
                          {teamStats.team === groupPositions[0].team || teamStats.team === groupPositions[1].team ?
                            (<Avatar title='Pronostico Correcto' sx={{ width: '18px', height: '18px', bgcolor: theme.palette.success.light }}><HitIcon sx={{ width: '12px', height: '12px'}}/></Avatar>):
                            (<Avatar title='Pronostico Errado' sx={{ width: '18px', height: '18px', bgcolor: theme.palette.error.main }}><MissIcon sx={{ width: '12px', height: '12px'}}/></Avatar>)}
                        </Box>
                      )}
                      {teamStats.team}
                    </TableCell>
                    <TableCell>{teamStats.points}</TableCell>
                    {xsMatch && <TableCell>{teamStats.win}</TableCell>}
                    {xsMatch && <TableCell>{teamStats.draw}</TableCell>}
                    {xsMatch && <TableCell>{teamStats.loss}</TableCell>}
                    {xsMatch && <TableCell>{teamStats.goalsFor}</TableCell>}
                    {xsMatch && <TableCell>{teamStats.goalsAgainst}</TableCell>}
                    <TableCell>{teamStats.goalDifference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          {xsMatch && <LoadingButton loading={saving} variant='contained' size='large' onClick={savePredictions} sx={{ marginTop: '16px'}}>Guardar Pronostico</LoadingButton>}
          {!xsMatch && <LoadingButton loading={saving} variant='contained' size='large' onClick={savePredictions} sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)' }}>Guardar Pronostico</LoadingButton>}
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
