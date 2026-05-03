'use client'

import {Team, Tournament, TournamentGuessNew} from "../../db/tables-definition";
import React, {Fragment, useState, useEffect, useMemo, useCallback, useRef} from "react";
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
import { useTranslations, useLocale } from 'next-intl';
import { PredictionStatusHeader, computeAwardsHeaderVariant } from '../prediction-status-header';
import { GuessesContextProvider } from '../context-providers/guesses-context-provider';
import { customToMap } from '../../utils/ObjectUtils';
import { PREDICTION_LOCK_OFFSET_MS } from '../../utils/prediction-constants';

interface PlayerAwardInputProps {
  readonly label: string;
  readonly inputRef?: React.RefCallback<HTMLInputElement>;
  readonly params: React.ComponentProps<typeof TextField>;
}

function PlayerAwardInput({ label, inputRef, params }: PlayerAwardInputProps) {
  return (
    <TextField
      {...params}
      label={label}
      inputRef={inputRef}
      slotProps={{
        htmlInput: {
          ...params.inputProps,
        }
      }}
    />
  );
}

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
  }: Props) {
  const theme = useTheme()
  const isMobile = useMediaQuery('(max-width:600px)');
  const t = useTranslations('awards');
  const tPredictions = useTranslations('predictions');
  const locale = useLocale();
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
  const makeRenderPlayerInput = useCallback(
    (inputRef?: React.RefCallback<HTMLInputElement>) => {
      const label = t('individual.selectPlayer');
      return (params: React.ComponentProps<typeof TextField>) => (
        <PlayerAwardInput label={label} inputRef={inputRef} params={params} />
      );
    },
    [t]
  );

  // Convert game guesses array to map for GuessesContext
  const gameGuessesMap = useMemo(
    () => customToMap(gameGuessesArray, (g: any) => g.game_id),
    [gameGuessesArray]
  );

  // Calculate podium + individual awards completion from local state
  const awardsCompleted = useMemo(() => {
    return [
      tournamentGuesses.champion_team_id,
      tournamentGuesses.runner_up_team_id,
      hasThirdPlaceGame ? tournamentGuesses.third_place_team_id : null,
      tournamentGuesses.best_player_id,
      tournamentGuesses.top_goalscorer_player_id,
      tournamentGuesses.best_goalkeeper_player_id,
      tournamentGuesses.best_young_player_id,
    ].filter(Boolean).length;
  }, [
    hasThirdPlaceGame,
    tournamentGuesses.champion_team_id,
    tournamentGuesses.runner_up_team_id,
    tournamentGuesses.third_place_team_id,
    tournamentGuesses.best_player_id,
    tournamentGuesses.top_goalscorer_player_id,
    tournamentGuesses.best_goalkeeper_player_id,
    tournamentGuesses.best_young_player_id,
  ]);

  const awardsLockAt = useMemo(() => {
    if (!tournamentStartDate) return null;
    return new Date(tournamentStartDate.getTime() + PREDICTION_LOCK_OFFSET_MS);
  }, [tournamentStartDate]);

  const decidedSoFar = useMemo(() => {
    return [
      tournament.champion_team_id,
      tournament.runner_up_team_id,
      hasThirdPlaceGame ? tournament.third_place_team_id : null,
      tournament.best_player_id,
      tournament.top_goalscorer_player_id,
      tournament.best_goalkeeper_player_id,
      tournament.best_young_player_id,
    ].filter(Boolean).length;
  }, [hasThirdPlaceGame, tournament]);

  const correctSoFar = useMemo(() => {
    return [
      { result: tournament.champion_team_id, pick: tournamentGuesses.champion_team_id },
      { result: tournament.runner_up_team_id, pick: tournamentGuesses.runner_up_team_id },
      ...(hasThirdPlaceGame ? [{ result: tournament.third_place_team_id, pick: tournamentGuesses.third_place_team_id }] : []),
      { result: tournament.best_player_id, pick: tournamentGuesses.best_player_id },
      { result: tournament.top_goalscorer_player_id, pick: tournamentGuesses.top_goalscorer_player_id },
      { result: tournament.best_goalkeeper_player_id, pick: tournamentGuesses.best_goalkeeper_player_id },
      { result: tournament.best_young_player_id, pick: tournamentGuesses.best_young_player_id },
    ].filter(({ result, pick }) => result && result === pick).length;
  }, [hasThirdPlaceGame, tournament, tournamentGuesses]);

  // awardsTotal: 3 podium + 4 individual = 7 (or 6 when no third-place game)
  // Always computed locally — server awards.total counts only individual awards (4), not podium picks
  const awardsTotal = hasThirdPlaceGame ? 7 : 6;

  const [openPodiumField, setOpenPodiumField] = useState<AwardTypes | null>(null);

  const fieldContainerRefs = useRef<Map<AwardTypes, HTMLElement>>(new Map());
  const fieldInputRefs = useRef<Map<AwardTypes, HTMLInputElement>>(new Map());

  const registerContainerRef = useCallback((field: AwardTypes) => (el: HTMLElement | null) => {
    if (el) fieldContainerRefs.current.set(field, el);
    else fieldContainerRefs.current.delete(field);
  }, []);

  const registerInputRef = useCallback((field: AwardTypes) => (el: HTMLInputElement | null) => {
    if (el) fieldInputRefs.current.set(field, el);
    else fieldInputRefs.current.delete(field);
  }, []);

  const handleFocusNextAward = useCallback(() => {
    const podiumFields: AwardTypes[] = [
      'champion_team_id',
      'runner_up_team_id',
      ...(hasThirdPlaceGame ? ['third_place_team_id' as AwardTypes] : []),
    ];
    const individualFields = getAwardsDefinition(t).map(d => d.property);
    const firstUnpredicted = [...podiumFields, ...individualFields].find(f => !tournamentGuesses[f]);
    if (!firstUnpredicted) return;

    const container = fieldContainerRefs.current.get(firstUnpredicted);
    container?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (podiumFields.includes(firstUnpredicted)) {
      setTimeout(() => setOpenPodiumField(firstUnpredicted), 400);
    } else {
      const input = fieldInputRefs.current.get(firstUnpredicted);
      if (input) setTimeout(() => input.focus(), 400);
    }
  }, [tournamentGuesses, hasThirdPlaceGame, t]);

  const awardsHeaderVariant = useMemo(() => computeAwardsHeaderVariant(
    {
      isLocked: isPredictionLocked,
      awardsLockAt,
      awardsCompleted,
      awardsTotal,
      decidedSoFar,
      correctSoFar,
      awardsPointsEarned: tournamentGuesses.individual_awards_score ?? undefined,
      onFocusNextAward: handleFocusNextAward,
      tournamentId: tournament.id,
      locale,
    },
    tPredictions as (key: string, values?: Record<string, unknown>) => string
  ), [isPredictionLocked, awardsLockAt, awardsCompleted, awardsTotal, decidedSoFar, correctSoFar, tournamentGuesses.individual_awards_score, handleFocusNextAward, tournament.id, locale, tPredictions]);

  return (
    <GuessesContextProvider
      gameGuesses={gameGuessesMap}
      autoSave={true}
      tournamentMaxSilver={tournament.max_silver_games || 0}
      tournamentMaxGolden={tournament.max_golden_games || 0}
    >
      <PredictionStatusHeader variant={awardsHeaderVariant} />

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
              ref={registerContainerRef('champion_team_id')}
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
                open={openPodiumField === 'champion_team_id' || undefined}
                onClose={() => setOpenPodiumField(null)}
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
              ref={registerContainerRef('runner_up_team_id')}
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
                open={openPodiumField === 'runner_up_team_id' || undefined}
                onClose={() => setOpenPodiumField(null)}
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
                ref={registerContainerRef('third_place_team_id')}
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
                  open={openPodiumField === 'third_place_team_id' || undefined}
                  onClose={() => setOpenPodiumField(null)}
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
                  <Grid ref={registerContainerRef(awardDefinition.property)} size={7}>
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
                        renderInput={makeRenderPlayerInput()}
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
                        renderInput={makeRenderPlayerInput(registerInputRef(awardDefinition.property))}
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
