'use client'

import {TournamentGuessNew} from "../../db/tables-definition";
import {Fragment, useState} from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Snackbar,
  TextField,
  Typography
} from "@mui/material";
import {LoadingButton} from "@mui/lab";
import {updateOrCreateTournamentGuess} from "../../actions/guesses-actions";
import {ExtendedPlayerData} from "../../definitions";
import {awardsDefinition, AwardTypes} from "../../utils/award-utils";

type Props = {
  allPlayers: ExtendedPlayerData[],
  tournamentGuesses: TournamentGuessNew,
  tournamentStartDate: Date
}

export default function AwardsPanel({allPlayers, tournamentGuesses: savedTournamentGuesses, tournamentStartDate}: Props) {
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [tournamentGuesses, setTournamentGuesses] = useState(savedTournamentGuesses)
  const saveDisabled = Date.now() > tournamentStartDate.getTime()

  const savePredictions = async () => {
    setSaving(true)
    //Do the actual save
    await updateOrCreateTournamentGuess(tournamentGuesses)
    setSaving(false)
    setSaved(true)
  }

  const handleGuessChange =
    (property: AwardTypes) =>
      (_: any, player: ExtendedPlayerData | null) => {
        setTournamentGuesses({
          ...tournamentGuesses,
          [property]: player?.id
        });
      }

  const isDisabled = tournamentStartDate.getTime() < Date.now()

  return (
    <>
      <Card sx={{ maxWidth: '900px', mr: 'auto', ml: 'auto'}}>
        <CardHeader title={'Premios Individuales'}/>
        <CardContent>
          <Grid container spacing={2}>
            {awardsDefinition.map(awardDefinition => (
              <Fragment key={awardDefinition.property}>
                <Grid item xs={5} flexDirection={'column'} justifyContent={'center'} alignContent={'center'} display={'flex'}>
                  <Typography
                    variant={"h6"}
                    sx={{
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}>
                    {awardDefinition.label}</Typography>
                </Grid>
                <Grid item xs={7}>
                  <Autocomplete
                    id='best-player-autocomplete'
                    options={allPlayers
                      .filter(awardDefinition.playerFilter)
                      .sort((a, b) =>
                        a.team.name.localeCompare(b.team.name))
                    }
                    groupBy={(option) => option.team.name}
                    autoHighlight
                    getOptionLabel={(option) => option.name}
                    value={allPlayers.find(player => player.id === tournamentGuesses[awardDefinition.property])}
                    onChange={handleGuessChange(awardDefinition.property)}
                    disabled={isDisabled}
                    renderOption={(props, option) => (
                      <Box component='li' {...props}>
                        {option.name} - {option.team.short_name}
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Elegir Jugador"
                        inputProps={{
                          ...params.inputProps,
                        }}
                      />
                    )}
                  />
                </Grid>
              </Fragment>
            ))}
          </Grid>
        </CardContent>
      </Card>
      <LoadingButton loading={saving} disabled={saveDisabled} variant='contained' size='large' onClick={savePredictions} sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)' }}>Guardar Pronostico</LoadingButton>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
          Tus pronosticos se guardaron correctamente!
        </Alert>
      </Snackbar>
    </>
  )
}
