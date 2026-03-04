'use client'

import {Team, Tournament, TournamentGuessNew} from "../../db/tables-definition";
import React, {Fragment, useState, useEffect, useMemo} from "react";
import { getDismissalState, setDismissalState } from '../../utils/dismissal-storage';
import {
  Alert,
  AlertTitle,
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
import {Close as MissIcon, Done as HitIcon, Lock as LockIcon} from "@mui/icons-material";
import {updateOrCreateTournamentGuess} from "../../actions/guesses-actions";
import {ExtendedPlayerData} from "../../definitions";
import {getAwardsDefinition, AwardDefinition, AwardTypes} from "../../utils/award-utils";
import TeamSelector from "./team-selector";
import MobileFriendlyAutocomplete from './mobile-friendly-autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslations } from 'next-intl';
import { CompactPredictionDashboard } from '../compact-prediction-dashboard';
import { GuessesContextProvider } from '../context-providers/guesses-context-provider';
import { customToMap } from '../../utils/ObjectUtils';
import { isGamePredictionComplete } from '../../utils/game-prediction-helpers';

type Props = {
  readonly allPlayers: ExtendedPlayerData[],
  readonly tournamentGuesses: TournamentGuessNew,
  readonly teams: Team[];
  readonly hasThirdPlaceGame: boolean;
  readonly isPredictionLocked: boolean;
  readonly tournament: Tournament;
  readonly games: any[];
  readonly gameGuessesArray: any[];
  readonly tournamentPredictionCompletion: any;
  readonly tournamentStartDate: Date;
  readonly teamsMap: Record<string, Team>;
}

export default function AwardsPanel({
    allPlayers,
    tournamentGuesses: savedTournamentGuesses,
    teams,
    hasThirdPlaceGame,
    isPredictionLocked,
    tournament,
    games,
    gameGuessesArray,
    tournamentPredictionCompletion,
    tournamentStartDate,
    teamsMap
  }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery('(max-width:600px)');
  const t = useTranslations('awards');
  const [saving, setSaving] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [tournamentGuesses, setTournamentGuesses] = useState(savedTournamentGuesses)
  const [showLockedSnackbar, setShowLockedSnackbar] = useState(false);

  // Initialize locked snackbar state from localStorage
  useEffect(() => {
    const dismissalKey = `dismissedLocked_${tournament.id}_awards`;
    const isDismissed = getDismissalState(dismissalKey);
    setShowLockedSnackbar(isPredictionLocked && !isDismissed);
  }, [isPredictionLocked, tournament.id]);

  const handleCloseLockedSnackbar = () => {
    const dismissalKey = `dismissedLocked_${tournament.id}_awards`;
    setDismissalState(dismissalKey, true);
    setShowLockedSnackbar(false);
  };

  const savePredictions = async (updatePayload: Partial<TournamentGuessNew> & { user_id: string; tournament_id: string }) => {
    setSaving(true)
    //Do the actual save
    const result = await updateOrCreateTournamentGuess(updatePayload)
    setSaving(false)

    // Check if save failed (result would be {success: false, error: string})
    if (result && typeof result === 'object' && 'success' in result && result.success === false) {
      console.error('Failed to save tournament guess:', result.error)
      // Don't show success toast on error
      return
    }

    setSaved(true)
  }

  const handleGuessChange =
    (property: AwardTypes) =>
      (_: any, player: ExtendedPlayerData | null) => {
        // Update local state with full object
        const newGuesses = {
          ...tournamentGuesses,
          [property]: player?.id
        };
        setTournamentGuesses(newGuesses);

        // But only send the changed field to server (plus identifiers)
        const updatePayload = {
          user_id: tournamentGuesses.user_id,
          tournament_id: tournamentGuesses.tournament_id,
          [property]: player?.id
        };
        savePredictions(updatePayload)
      }

  const handlePodiumGuessChange = (property: AwardTypes) =>
    (teamId: string) => {
      // Update local state with full object
      const newGuesses = {
        ...tournamentGuesses,
        [property]: (teamId === '') ? null : teamId
      };
      setTournamentGuesses(newGuesses);

      // But only send the changed field to server (plus identifiers)
      const updatePayload = {
        user_id: tournamentGuesses.user_id,
        tournament_id: tournamentGuesses.tournament_id,
        [property]: (teamId === '') ? null : teamId
      };
      savePredictions(updatePayload)
  }

  const isDisabled = isPredictionLocked || saving

  // Common Autocomplete props/functions for player awards
  const getPlayerOptions = (awardDefinition: AwardDefinition) =>
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
      label={t('individual.selectPlayer')}
      slotProps={{
        htmlInput: {
          ...params.inputProps,
        }
      }}
    />
  );

  // Convert game guesses array to map for GuessesContext
  const gameGuessesMap = useMemo(
    () => customToMap(gameGuessesArray, (g: any) => g.game_id),
    [gameGuessesArray]
  );

  // Create a map of game_id -> game_type for prediction validation
  const gameTypeMap = useMemo(
    () => Object.fromEntries(games.map((g: any) => [g.id, g.game_type])),
    [games]
  );

  // Calculate predictedGames correctly (check scores AND penalty winner for tied playoff games)
  const predictedGames = useMemo(
    () => gameGuessesArray.filter((g: any) =>
      isGamePredictionComplete(
        gameTypeMap[g.game_id],
        g.home_score,
        g.away_score,
        g.home_penalty_winner,
        g.away_penalty_winner
      )
    ).length,
    [gameGuessesArray, gameTypeMap]
  );

  // Calculate individual awards completion from local state
  const awardsCompleted = useMemo(() => {
    return [
      tournamentGuesses.best_player_id,
      tournamentGuesses.top_goalscorer_player_id,
      tournamentGuesses.best_goalkeeper_player_id,
      tournamentGuesses.best_young_player_id,
    ].filter(Boolean).length;
  }, [
    tournamentGuesses.best_player_id,
    tournamentGuesses.top_goalscorer_player_id,
    tournamentGuesses.best_goalkeeper_player_id,
    tournamentGuesses.best_young_player_id,
  ]);

  // Calculate final standings (honor roll) completion from local state
  const finalStandingsCompleted = useMemo(() => {
    return [
      tournamentGuesses.champion_team_id,
      tournamentGuesses.runner_up_team_id,
      tournamentGuesses.third_place_team_id,
    ].filter(Boolean).length;
  }, [
    tournamentGuesses.champion_team_id,
    tournamentGuesses.runner_up_team_id,
    tournamentGuesses.third_place_team_id,
  ]);

  // Filter urgent games (within 48 hours)
  const urgentGames = useMemo(
    () => {
      const now = Date.now();
      const fortyEightHours = 48 * 60 * 60 * 1000;
      return games.filter((game: any) => {
        const gameTime = new Date(game.game_date).getTime();
        return gameTime > now && gameTime <= now + fortyEightHours;
      });
    },
    [games]
  );

  return (
    <GuessesContextProvider
      gameGuesses={gameGuessesMap}
      autoSave={true}
      tournamentMaxSilver={tournament.max_silver_games || 0}
      tournamentMaxGolden={tournament.max_golden_games || 0}
    >
      <CompactPredictionDashboard
        totalGames={tournamentPredictionCompletion?.totalGames ?? games.length}
        predictedGames={predictedGames}
        tournamentId={tournament.id}
        tournamentStartDate={tournamentStartDate}
        urgentGames={urgentGames}
        urgentGameGuesses={gameGuessesMap}
        teamsMap={teamsMap}
        silverBoostsUsed={tournamentPredictionCompletion?.silverBoostsUsed ?? 0}
        silverBoostsMax={tournamentPredictionCompletion?.silverBoostsMax ?? (tournament.max_silver_games || 0)}
        goldenBoostsUsed={tournamentPredictionCompletion?.goldenBoostsUsed ?? 0}
        goldenBoostsMax={tournamentPredictionCompletion?.goldenBoostsMax ?? (tournament.max_golden_games || 0)}
        finalStandingsCompleted={finalStandingsCompleted}
        finalStandingsTotal={tournamentPredictionCompletion?.finalStandings.total ?? 3}
        awardsCompleted={awardsCompleted}
        awardsTotal={tournamentPredictionCompletion?.awards.total ?? 4}
        qualifiersCompleted={tournamentPredictionCompletion?.qualifiers.completed}
        qualifiersTotal={tournamentPredictionCompletion?.qualifiers.total}
        overallPercentage={tournamentPredictionCompletion?.overallPercentage}
        isPredictionLocked={tournamentPredictionCompletion?.isPredictionLocked}
      />

      <Card>
        <CardHeader
          title={t('podium.title')}
          sx={{
            color: theme.palette.primary.main,
            borderBottom: `${theme.palette.primary.light} solid 1px`
          }}
        />
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
                label={t('podium.champion.label')}
                teams={teams}
                selectedTeamId={tournamentGuesses.champion_team_id || ''}
                name="championTeamId"
                disabled={isDisabled}
                helperText={t('podium.champion.helper')}
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
                label={t('podium.runnerUp.label')}
                teams={teams}
                selectedTeamId={tournamentGuesses.runner_up_team_id || ''}
                name="runnerUpTeamId"
                disabled={isDisabled}
                helperText={t('podium.runnerUp.helper')}
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
                  label={t('podium.thirdPlace.label')}
                  teams={teams}
                  selectedTeamId={tournamentGuesses.third_place_team_id || ''}
                  name="thirdPlaceTeamId"
                  disabled={isDisabled}
                  helperText={t('podium.thirdPlace.helper')}
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
      <Card sx={{ marginTop: '24px' }}>
        <CardHeader
          title={t('individual.title')}
          sx={{
            color: theme.palette.primary.main,
            borderBottom: `${theme.palette.primary.light} solid 1px`
          }}
        />
        <CardContent>
          {allPlayers.length === 0 && (
            <Alert variant={'filled'} severity={'warning'}>
              <AlertTitle>{t('individual.unavailableTitle')}</AlertTitle>
              {t('individual.unavailableMessage')}
            </Alert>
          )}
          {allPlayers.length > 0 && (
            <Grid container spacing={2}>
              {getAwardsDefinition(t).map(awardDefinition => (
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
          {t('individual.successMessage')}
        </Alert>
      </Snackbar>
      <Snackbar
        open={showLockedSnackbar}
        onClose={handleCloseLockedSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseLockedSnackbar} severity="info" icon={<LockIcon />} sx={{ width: '100%' }}>
          {t('individual.lockedMessage')}
        </Alert>
      </Snackbar>
    </GuessesContextProvider>
  );
}
