'use client'

import {Team, Tournament, TournamentGuessNew} from "../../db/tables-definition";
import React, {Fragment, useState} from "react";
import {
  Alert, AlertTitle,
  Autocomplete, Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Snackbar,
  TextField,
  Typography, useTheme
} from "@mui/material";
import {Close as MissIcon, Done as HitIcon} from "@mui/icons-material";
import {updateOrCreateTournamentGuess} from "../../actions/guesses-actions";
import {ExtendedPlayerData} from "../../definitions";
import {awardsDefinition, AwardTypes} from "../../utils/award-utils";
import TeamSelector from "./team-selector";
import MobileFriendlyAutocomplete from './mobile-friendly-autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';

type Props = {
  readonly allPlayers: ExtendedPlayerData[],
  readonly tournamentGuesses: TournamentGuessNew,
  readonly teams: Team[];
  readonly hasThirdPlaceGame: boolean;
  readonly isPredictionLocked: boolean;
  readonly tournament: Tournament
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
  const isMobile = useMediaQuery('(max-width:600px)');
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [tournamentGuesses, setTournamentGuesses] = useState(savedTournamentGuesses)

  const savePredictions = async (guessesToSave: typeof tournamentGuesses) => {
    setSaving(true)
    //Do the actual save
    await updateOrCreateTournamentGuess(guessesToSave)
    setSaving(false)
    setSaved(true)
  }

  const handleGuessChange =
    (property: AwardTypes) =>
      (_: any, player: ExtendedPlayerData | null) => {
        const newGuesses = {
          ...tournamentGuesses,
          [property]: player?.id
        };
        setTournamentGuesses(newGuesses);
        savePredictions(newGuesses)
      }

  const handlePodiumGuessChange = (property: AwardTypes) =>
    (teamId: string) => {
      const newGuesses = {
        ...tournamentGuesses,
        [property]: (teamId === '') ? null : teamId
      };
      setTournamentGuesses(newGuesses);
      savePredictions(newGuesses)
  }

  const isDisabled = isPredictionLocked || saving

  // Common Autocomplete props/functions for player awards
  const getPlayerOptions = (awardDefinition: typeof awardsDefinition[number]) =>
    allPlayers.filter(awardDefinition.playerFilter).sort((a, b) => a.team.name.localeCompare(b.team.name));

  const groupByTeam = (option: ExtendedPlayerData) => option.team.name;
  const getPlayerLabel = (option: ExtendedPlayerData) => option.name;
  const getPlayerValue = (property: AwardTypes) => allPlayers.find(player => player.id === tournamentGuesses[property]) || null;
  const onPlayerChange = (property: AwardTypes) => handleGuessChange(property);
  const renderPlayerOption = (props: React.HTMLAttributes<HTMLLIElement>, option: ExtendedPlayerData) => (
    <Box component='li' {...props}>
      {option.name} - {option.team.short_name}
    </Box>
  );
  const renderPlayerInput = (params: any) => (
    <TextField
      {...params}
      label="Elegir Jugador"
      slotProps={{
        htmlInput: {
          ...params.inputProps,
        }
      }}
    />
  );

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
            <Grid
              flexDirection="row"
              display="flex"
              size={{
                xs: 12,
                md: hasThirdPlaceGame ? 4 : 6
              }}>
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

            <Grid
              display={'flex'}
              flexDirection={'row'}
              size={{
                xs: 12,
                md: hasThirdPlaceGame ? 4 : 6
              }}>
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
              <Grid
                display={'flex'}
                flexDirection={'row'}
                size={{
                  xs: 12,
                  md: 4
                }}>
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
                  <Grid flexDirection={'row'} alignItems={'center'} display={'flex'} size={5}>
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
                  <Grid size={7}>
                    {isMobile ? (
                      <MobileFriendlyAutocomplete
                        label={awardDefinition.label}
                        options={getPlayerOptions(awardDefinition)}
                        groupBy={groupByTeam}
                        getOptionLabel={getPlayerLabel}
                        value={getPlayerValue(awardDefinition.property)}
                        onChange={onPlayerChange(awardDefinition.property)}
                        disabled={isDisabled}
                        renderOption={renderPlayerOption}
                        renderInput={renderPlayerInput}
                      />
                    ) : (
                      <Autocomplete
                        id='best-player-autocomplete'
                        options={getPlayerOptions(awardDefinition)}
                        groupBy={groupByTeam}
                        autoHighlight
                        getOptionLabel={getPlayerLabel}
                        value={getPlayerValue(awardDefinition.property)}
                        onChange={onPlayerChange(awardDefinition.property)}
                        disabled={isDisabled}
                        renderOption={renderPlayerOption}
                        renderInput={renderPlayerInput}
                      />
                    )}
                  </Grid>
                </Fragment>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
      <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center'}} open={saved} autoHideDuration={2000} onClose={() => setSaved(false)}>
        <Alert onClose={() => setSaved(false)} severity="success" sx={{ width: '100%' }}>
          Tus pronosticos se guardaron correctamente!
        </Alert>
      </Snackbar>
    </>
  );
}
