import {Game, GameGuess} from "../../types/definitions";
import {
  final,
  group_games,
  groups,
  playoff_games,
  round_of_16,
  round_of_eight,
  semifinals,
  third_place
} from "../../data/group-data";
import {ChangeEvent, useEffect, useState} from "react";
import {createRecords, deleteRecords, getCurrentUserId, query, updateRecord} from "thin-backend";
import {
  calculateGroupPosition,
  calculateRoundOf16TeamsByMatch,
  calculateRoundof8andLowerTeamsByMatch
} from "../../utils/position-calculator";
import {
  Box,
  Grid,
  ListItem,
  Typography,
  List,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Snackbar,
  Alert, useMediaQuery
} from "@mui/material";
import GroupSelector from "../../components/group-selector";
import {getAwayScore, getLocalScore, getLoser, getWinner} from "../../utils/score-utils";
import GameView from "../../components/game-view";
import {LoadingButton} from "@mui/lab";
import {useCurrentUser} from "thin-backend-react";
import {transformBeListToGameGuessDictionary} from "../../utils/be-utils";

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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = useCurrentUser();
  const xsMatch = useMediaQuery('(min-width:900px)')

  useEffect(() => {
    const getData = async () => {
      const currentGameGuesses: GameGuess[] =
        await query('game_guesses')
          .where('userId', getCurrentUserId()).fetch();

      const gameGuesses = transformBeListToGameGuessDictionary(currentGameGuesses)
      const currentMap = calculateRoundOf16TeamsByMatch(gameGuesses);
      const calculatedTeamNameToGameMap = calculateRoundof8andLowerTeamsByMatch(currentMap, gameGuesses)
      setCalculatedTeamNameToGameMap(calculatedTeamNameToGameMap)
      //Doing this
      Object.values(gameGuesses).forEach(gameGuess => {
        if(!gameGuess.localTeam) {
          gameGuess.localTeam = calculatedTeamNameToGameMap[gameGuess.gameId]?.homeTeam
        }
        if(!gameGuess.awayTeam) {
          gameGuess.awayTeam = calculatedTeamNameToGameMap[gameGuess.gameId]?.awayTeam
        }
      })
      setGameGuesses(gameGuesses);
    }

    getData();
  }, [])

  const savePredictions = async () => {
    setSaving(true)
    const gameGuessesValues = Object.values(gameGuesses)
    const playoffGameIds = playoff_games.map(game => game.MatchNumber)
    const gameGuessesToSave = gameGuessesValues.filter(gameGuess => playoffGameIds.includes(gameGuess.gameId))
    console.log(gameGuessesValues)
    const currentGameGuesses: GameGuess[] =
      await query('game_guesses')
        .where('userId', getCurrentUserId())
        .whereIn('gameId', [...round_of_16, ...round_of_eight, ...semifinals, final, third_place].map(game => game.MatchNumber)).fetch();

    // @ts-ignore
    await deleteRecords('game_guesses', currentGameGuesses.map(gameGuess => gameGuess.id))
    await createRecords('game_guesses', gameGuessesToSave);
    // Only save values for honor
    if (Date.now() < new Date(2022, 10,21).valueOf()) {
      const championGuess = getWinner(gameGuesses[final.MatchNumber], calculatedTeamNameToGameMap[final.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[final.MatchNumber]?.awayTeam )
      const secondPlaceGuess = getLoser(gameGuesses[final.MatchNumber], calculatedTeamNameToGameMap[final.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[final.MatchNumber]?.awayTeam )
      const thirdPlaceGuess = getWinner(gameGuesses[third_place.MatchNumber], calculatedTeamNameToGameMap[third_place.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[third_place.MatchNumber]?.awayTeam )
      await updateRecord('users', getCurrentUserId(), { championGuess, secondPlaceGuess, thirdPlaceGuess});
    }
    setSaving(false)
    setSaved(true)
  }

  const calculateTeams = (game: Game, defaultHomeName?: string, defaultAwayName?: string): Game => ({
    ...game,
    HomeTeam: calculatedTeamNameToGameMap[game.MatchNumber]?.homeTeam || defaultHomeName || 'Home Team',
    AwayTeam: calculatedTeamNameToGameMap[game.MatchNumber]?.awayTeam || defaultAwayName || 'Away Team',
  })

  const handleGameGuessChange = (gameGuess: GameGuess) => {
    const newGameGuesses = {
      ...gameGuesses,
      [gameGuess.gameId]: gameGuess
    }
    const newCalculatedTeamNameToGameMap = calculateRoundof8andLowerTeamsByMatch(calculatedTeamNameToGameMap, newGameGuesses)
    setCalculatedTeamNameToGameMap(newCalculatedTeamNameToGameMap)
    //Doing this
    Object.values(newGameGuesses).forEach(gameGuess => {
      gameGuess.localTeam = newCalculatedTeamNameToGameMap[gameGuess.gameId]?.homeTeam
      gameGuess.awayTeam = newCalculatedTeamNameToGameMap[gameGuess.gameId]?.awayTeam
    })
    setGameGuesses(newGameGuesses)
  }

  const editDisabled = Date.now() > new Date(2022, 11, 3).valueOf();
  const pastStartDate = Date.now() > new Date(2022, 10, 23).valueOf();

  // @ts-ignore
  return (
    <Box p={2}>
      <GroupSelector />
      <Grid container spacing={2} mt={2} mb={6} columns={10}>
        <Grid item md={4} xs={12}>
          <Typography variant='h5' sx={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>Octavos de Final</Typography>
          <Grid container spacing={1} >
            {round_of_16.map(game => (
              <Grid item key={game.MatchNumber} xs={6}>
                <GameView game={calculateTeams(game)} gameGuess={gameGuesses[game.MatchNumber]} onGameGuessChange={handleGameGuessChange} editDisabled={editDisabled}/>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item md={2} xs={12}>
          <Typography variant='h5' sx={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>Cuartos de Final</Typography>
          <Grid container spacing={1}>
            {round_of_eight.map(game => (
              <Grid item key={game.MatchNumber} md={12} xs={6}>
                <GameView game={calculateTeams(game, `Ganador ${game.HomeTeam}`, `Ganador ${game.AwayTeam}`)} gameGuess={gameGuesses[game.MatchNumber]} onGameGuessChange={handleGameGuessChange}
                          editDisabled={editDisabled}/>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item md={2} xs={12}>
          <Typography variant='h5' sx={{
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>Semifinales</Typography>
          <Grid container spacing={1}>
            {semifinals.map(game => (
              <Grid item key={game.MatchNumber} md={12} xs={6}>
                <GameView game={calculateTeams(game, `Ganador ${game.HomeTeam}`, `Ganador ${game.AwayTeam}`)} gameGuess={gameGuesses[game.MatchNumber]} onGameGuessChange={handleGameGuessChange}
                          editDisabled={editDisabled}/>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item md={2} xs={12}>
          <Grid container spacing={1}>
            <Grid item xs={6} md={12}>
              <Typography variant='h5' sx={{
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}>Final</Typography>
              <GameView game={calculateTeams(final, `Ganador ${final.HomeTeam}`, `Ganador ${final.AwayTeam}`)} gameGuess={gameGuesses[final.MatchNumber]} onGameGuessChange={handleGameGuessChange}
                        editDisabled={editDisabled}/>
            </Grid>
            <Grid item xs={6} md={12}>
              <Typography variant='h5' sx={{
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}>Tercer Puesto</Typography>
              <GameView game={calculateTeams(third_place, `Perdedor ${third_place.HomeTeam}`, `Perdedor ${third_place.AwayTeam}`)} gameGuess={gameGuesses[third_place.MatchNumber]} onGameGuessChange={handleGameGuessChange}
                        editDisabled={editDisabled}/>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Typography variant='h5'>Cuadro de Honor</Typography>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar alt='Campeon' src='/gold-medal.png'/>
                </ListItemAvatar>
                <ListItemText>
                  {pastStartDate ? user?.championGuess :
                    getWinner(gameGuesses[final.MatchNumber], calculatedTeamNameToGameMap[final.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[final.MatchNumber]?.awayTeam )}
                </ListItemText>
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar alt='Subampeon' src='/silver-medal.png'/>
                </ListItemAvatar>
                <ListItemText>
                  {pastStartDate ? user?.secondPlaceGuess :
                    getLoser(gameGuesses[final.MatchNumber], calculatedTeamNameToGameMap[final.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[final.MatchNumber]?.awayTeam )}
                </ListItemText>
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar alt='Tercero' src='/bronze-medal.png'/>
                </ListItemAvatar>
                <ListItemText>
                  {pastStartDate ? user?.thirdPlaceGuess :
                    getWinner(gameGuesses[third_place.MatchNumber], calculatedTeamNameToGameMap[third_place.MatchNumber]?.homeTeam, calculatedTeamNameToGameMap[third_place.MatchNumber]?.awayTeam )}
                </ListItemText>
              </ListItem>
            </List>
          </Grid>
        </Grid>
      </Grid>

      {xsMatch && <LoadingButton loading={saving} variant='contained' size='large' onClick={savePredictions} sx={{ position: 'fixed', bottom: '24px', right:'24px'}}>Guardar Pronostico</LoadingButton>}
      {!xsMatch && <LoadingButton loading={saving} variant='contained' size='large' onClick={savePredictions} sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)' }}>Guardar Pronostico</LoadingButton>}
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
          Tus pronosticos se guardaron correctamente!
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Playoffs
