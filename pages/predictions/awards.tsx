import {fetchPlayerData} from "../../services/fifa-data-service";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Card, CardActions,
  CardContent,
  CardHeader,
  Grid, Snackbar,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import {Player} from "../../types/definitions";
import {useCurrentUser} from "thin-backend-react";
import {useState} from "react";
import {updateRecord, User} from "thin-backend";
import {LoadingButton} from "@mui/lab";
import GroupSelector from "../../components/group-selector";

const AwardsPage = ({players}: { players: Player[]}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const user = useCurrentUser();
  const [userGuesses, setUserGuesses] = useState<Partial<User>>( {
    bestPlayerGuess: user?.bestPlayerGuess || null,
    topGoalscorerGuess: user?.topGoalscorerGuess || null,
    bestGoalkeeperGuess: user?.bestGoalkeeperGuess || null,
    bestYoungPlayerGuess: user?.bestYoungPlayerGuess || null,
  })
  const xsMatch = useMediaQuery('(min-width:900px)')

  const handleGuessChange = (attribute: string) => (_: any, player: Player | null) => {
    setUserGuesses({
      ...userGuesses,
      [attribute]: player?.name || null,
    })
  }

  const savePredictions = async () => {
    if (user != null) {
      setSaving(true);
      await updateRecord('users', user.id, userGuesses)
      setSaving(false)
      setSaved(true)
    }
  }

  return (
    <Box p={2}>
      <GroupSelector group='individual_awards'/>
      <Card sx={{ marginTop: 3, maxWidth: '900px', mr: 'auto', ml: 'auto'}}>
        <CardHeader title={'Premios Individuales'}/>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={5} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Typography
                variant={"h6"}
                sx={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}>
                Mejor Jugador</Typography>
            </Grid>
            <Grid item xs={7}>
              <Autocomplete
                id='best-player-autocomplete'
                options={players}
                autoHighlight
                getOptionLabel={(option) => option.name}
                value={players.find(player => player.name === userGuesses.bestPlayerGuess)}
                onChange={handleGuessChange('bestPlayerGuess')}
                renderOption={(props, option) => (
                  <Box component='li' {...props}>
                    <Avatar variant='rounded' title={option.team} src={`/flags/${option.team.substring(0,3)}.webp`} sx={{
                      width: '18px', height: '12px', mr: 1 }}/>
                    {option.name}
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Elegir Jugador"
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={5} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Typography
                variant={"h6"}
                sx={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}>
                Goleador</Typography>
            </Grid>
            <Grid item xs={7}>
              <Autocomplete
                id='top-goalscorer-autocomplete'
                options={players}
                autoHighlight
                getOptionLabel={(option) => option.name}
                value={players.find(player => player.name === userGuesses.topGoalscorerGuess)}
                onChange={handleGuessChange('topGoalscorerGuess')}
                renderOption={(props, option) => (
                  <Box component='li' {...props}>
                    <Avatar variant='rounded' title={option.team} src={`/flags/${option.team.substring(0,3)}.webp`} sx={{
                      width: '18px', height: '12px'}}/>
                    {option.name}
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Elegir Jugador"
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={5} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Typography
                variant={"h6"}
                sx={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}>
                Mejor Arquero</Typography>
            </Grid>
            <Grid item xs={7}>
              <Autocomplete
                id='best-goalkeeper-autocomplete'
                options={players.filter(player => player.position === 'Goalkeeper')}
                autoHighlight
                getOptionLabel={(option) => option.name}
                value={players.find(player => player.name === userGuesses.bestGoalkeeperGuess)}
                onChange={handleGuessChange('bestGoalkeeperGuess')}
                renderOption={(props, option) => (
                  <Box component='li' {...props}>
                    <Avatar variant='rounded' title={option.team} src={`/flags/${option.team.substring(0,3)}.webp`} sx={{
                      width: '18px', height: '12px'}}/>
                    {option.name}
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Elegir Jugador"
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={5} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
              <Typography
                variant={"h6"}
                sx={{
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}>
                Mejor Juvenil</Typography>
            </Grid>
            <Grid item xs={7}>
              <Autocomplete
                id='best-youngplayer-autocomplete'
                options={players.filter(player => player.age <= 21)}
                autoHighlight
                value={players.find(player => player.name === userGuesses.bestYoungPlayerGuess)}
                onChange={handleGuessChange('bestYoungPlayerGuess')}
                getOptionLabel={(option) => option.name}
                renderOption={(props, option) => (
                  <Box component='li' {...props}>
                    <Avatar variant='rounded' title={option.team} src={`/flags/${option.team.substring(0,3)}.webp`} sx={{
                      width: '18px', height: '12px'}}/>
                    {option.name}
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Elegir Jugador"
                    inputProps={{
                      ...params.inputProps,
                      autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <LoadingButton loading={saving} variant='contained' size='large' onClick={savePredictions} sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)' }}>Guardar Pronostico</LoadingButton>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
          Tus pronosticos se guardaron correctamente!
        </Alert>
      </Snackbar>
    </Box>
  )
}

export const getStaticProps = async() => {
  const players = await fetchPlayerData();
  return {
    props: { players },
    revalidate: 100000,
  }
}

export default AwardsPage;
