'use client'

import {Team, Tournament, TournamentGuessNew} from "../../db/tables-definition";
import React, {Fragment, useState} from "react";
import {
  Alert, AlertTitle,
  Autocomplete, Avatar,
  Box, Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Snackbar,
  TextField,
  Typography, useTheme
} from "@mui/material";
import {Close as MissIcon, Done as HitIcon} from "@mui/icons-material";
import {LoadingButton} from "@mui/lab";
import {updateOrCreateTournamentGuess} from "../../actions/guesses-actions";
import {ExtendedPlayerData} from "../../definitions";
import {awardsDefinition, AwardTypes} from "../../utils/award-utils";
import TeamSelector from "./team-selector";

type Props = {
  allPlayers: ExtendedPlayerData[],
  tournamentGuesses: TournamentGuessNew,
  teams: Team[];
  hasThirdPlaceGame: boolean;
  isPredictionLocked: boolean;
  tournament: Tournament
}

export default function AwardsPanel({
    allPlayers,
    tournamentGuesses: savedTournamentGuesses,
    teams,
    hasThirdPlaceGame,
    isPredictionLocked,
    tournament
  }: Props) {
  const theme = useTheme()
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [tournamentGuesses, setTournamentGuesses] = useState(savedTournamentGuesses)

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

  const handlePodiumGuessChange = (property: AwardTypes) =>
    (teamId: string) => {
      setTournamentGuesses({
        ...tournamentGuesses,
        [property]: (teamId === '') ? null : teamId
      });
  }

  const isDisabled = isPredictionLocked || saving

  return (
    <>
      {isPredictionLocked ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Predictions Locked</AlertTitle>
          Predictions are no longer available as the tournament has already started.
        </Alert>
      ) : null}

      <Card sx={{ maxWidth: '800px', mr: 'auto', ml: 'auto'}}>
        <CardHeader title={'Podio del Torneo'}/>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={hasThirdPlaceGame ? 4 : 6} flexDirection="row" display="flex">
              <TeamSelector
                label="Campeón"
                teams={teams}
                selectedTeamId={tournamentGuesses.champion_team_id || ''}
                name="championTeamId"
                disabled={isDisabled}
                helperText="Selecciona el equipo que predigas que ganará el torneo"
                onChange={handlePodiumGuessChange('champion_team_id')}
              />
              {tournament.champion_team_id && tournament.champion_team_id === tournamentGuesses.champion_team_id && (
                <Avatar title='Pronostico Correcto' sx={{ width: '24px', height: '24px', bgcolor: theme.palette.success.light, mt:2, ml:1 }}>
                  <HitIcon sx={{ fontSize: 14 }} />
                </Avatar>

              )}
              {tournament.champion_team_id && tournament.champion_team_id !== tournamentGuesses.champion_team_id && (
                <Avatar title='Pronostico Errado' sx={{ width: '24px', height: '24px', bgcolor: theme.palette.error.main, mt:2, ml: 1 }}>
                  <MissIcon sx={{ fontSize: 14 }} />
                </Avatar>
              )}
            </Grid>

            <Grid item xs={12} md={hasThirdPlaceGame ? 4 : 6} display={'flex'} flexDirection={'row'}>
              <TeamSelector
                label="Subcampeón"
                teams={teams}
                selectedTeamId={tournamentGuesses.runner_up_team_id || ''}
                name="runnerUpTeamId"
                disabled={isDisabled}
                helperText="Selecciona el equipo que predigas que llegará a la final"
                onChange={handlePodiumGuessChange('runner_up_team_id')}
              />
              {tournament.runner_up_team_id && tournament.runner_up_team_id === tournamentGuesses.runner_up_team_id && (
                <Avatar title='Pronostico Correcto' sx={{ width: '24px', height: '24px', bgcolor: theme.palette.success.light, mt:2, ml:1 }}>
                  <HitIcon sx={{ fontSize: 14 }} />
                </Avatar>
              )}
              {tournament.runner_up_team_id && tournament.runner_up_team_id !== tournamentGuesses.runner_up_team_id && (
                <Avatar title='Pronostico Errado' sx={{ width: '24px', height: '24px', bgcolor: theme.palette.error.main, mt:2, ml: 1 }}>
                  <MissIcon sx={{ fontSize: 14 }} />
                </Avatar>
              )}
            </Grid>

            {hasThirdPlaceGame && (
              <Grid item xs={12} md={4} display={'flex'} flexDirection={'row'}>
                <TeamSelector
                  label="Third Place"
                  teams={teams}
                  selectedTeamId={tournamentGuesses.third_place_team_id || ''}
                  name="thirdPlaceTeamId"
                  disabled={isDisabled}
                  helperText="Select the team you predict will win the third place match"
                  onChange={handlePodiumGuessChange('third_place_team_id')}
                />
                {tournament.third_place_team_id && tournament.third_place_team_id === tournamentGuesses.third_place_team_id && (
                  <Avatar title='Pronostico Correcto' sx={{ width: '24px', height: '24px', bgcolor: theme.palette.success.light, mt:2, ml:1 }}>
                    <HitIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                )}
                {tournament.third_place_team_id && tournament.third_place_team_id !== tournamentGuesses.third_place_team_id && (
                  <Avatar title='Pronostico Errado' sx={{ width: '24px', height: '24px', bgcolor: theme.palette.error.main, mt:2, ml: 1 }}>
                    <MissIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                )}
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: '800px', mr: 'auto', ml: 'auto', marginTop: '24px'}}>
        <CardHeader title={'Premios Individuales'}/>
        <CardContent>
          {allPlayers.length === 0 && (
            <Alert variant={'filled'} severity={'warning'}>
              <AlertTitle>Premios Inviduales no disponibles</AlertTitle>
              Esta seccion estara disponible una vez que se den a conocer las nominas de los equipos participantes en el torneo
            </Alert>
          )}
          {allPlayers.length > 0 && (
            <Grid container spacing={2}>
              {awardsDefinition.map(awardDefinition => (
                <Fragment key={awardDefinition.property}>
                  <Grid item xs={5} flexDirection={'row'} alignItems={'center'} display={'flex'}>
                    {tournament[awardDefinition.property] && tournament[awardDefinition.property] === tournamentGuesses[awardDefinition.property] && (
                      <Avatar title='Pronostico Correcto' sx={{ width: '24px', height: '24px', bgcolor: theme.palette.success.light, mr: 1}}>
                        <HitIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                    )}
                    {tournament[awardDefinition.property] && tournament[awardDefinition.property] !== tournamentGuesses[awardDefinition.property] && (
                      <Avatar title='Pronostico Errado' sx={{ width: '24px', height: '24px', bgcolor: theme.palette.error.main, mr: 1 }}>
                        <MissIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                    )}
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
          )}
        </CardContent>
      </Card>
      <LoadingButton loading={saving} disabled={isPredictionLocked} variant='contained' size='large' onClick={savePredictions} sx={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translate(-50%, 0)' }}>Guardar Pronostico</LoadingButton>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
          Tus pronosticos se guardaron correctamente!
        </Alert>
      </Snackbar>
    </>
  )
}
