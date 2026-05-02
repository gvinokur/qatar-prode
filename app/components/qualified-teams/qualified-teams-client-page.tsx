'use client';

import React, { useMemo, useState, useEffect, useCallback, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Typography, Alert, Snackbar, Box, Popover, Backdrop, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import LockIcon from '@mui/icons-material/Lock';
import { bulkAutoFillFromPredictions } from '../../actions/qualification-actions';
import { toLocale } from '../../utils/locale-utils';
import {
  QualifiedTeamsContextProvider,
  useQualifiedTeamsContext,
} from './qualified-teams-context';
import { Team, TournamentGroup, QualifiedTeamPrediction } from '../../db/tables-definition';
import QualifiedTeamsGrid from './qualified-teams-grid';
import { QualifiedTeamsScoringResult } from '../../utils/qualified-teams-scoring';
import { getDismissalState, setDismissalState } from '../../utils/dismissal-storage';
import { PredictionStatusHeader, computeQTHeaderVariant } from '../prediction-status-header';
import { GuessesContextProvider } from '../context-providers/guesses-context-provider';
import { customToMap } from '../../utils/ObjectUtils';
import { ScrollShadowContainer } from '../common/scroll-shadow-container';
import { PREDICTION_LOCK_OFFSET_MS } from '../../utils/prediction-constants';

interface QualifiedTeamsClientPageProps {
  /** Tournament data */
  readonly tournament: {
    readonly id: string;
    readonly short_name: string;
    readonly is_active: boolean;
    readonly max_silver_games?: number | null;
    readonly max_golden_games?: number | null;
  };
  /** Groups with their teams */
  readonly groups: Array<{
    readonly group: TournamentGroup;
    readonly teams: Team[];
  }>;
  /** Initial predictions from server */
  readonly initialPredictions: QualifiedTeamPrediction[];
  /** User ID */
  readonly userId: string;
  /** Whether tournament is locked */
  readonly isLocked: boolean;
  /** Whether third place qualification is enabled */
  readonly allowsThirdPlace: boolean;
  /** Maximum allowed third place qualifiers */
  readonly maxThirdPlace: number;
  /** Actual qualified teams (progressive results) */
  readonly actualResults?: Array<{ id: string; group_id: string }>;
  /** Set of group IDs that are complete (have positions determined) */
  readonly completeGroupIds: Set<string>;
  /** Whether all groups in the tournament are complete */
  readonly allGroupsComplete: boolean;
  /** Scoring breakdown for user's predictions */
  readonly scoringBreakdown?: QualifiedTeamsScoringResult | null;
  /** Whether to show the page header (default: true) */
  readonly showHeader?: boolean;
  /** Dashboard data */
  readonly games: any[];
  readonly gameGuessesArray: any[];
  readonly tournamentPredictionCompletion: any;
  readonly tournamentStartDate?: Date;
  readonly teamsMap: Record<string, Team>;
}

/** Handle drag end event - batch updates for entire group */
function createDragEndHandler(
  groups: Array<{ group: TournamentGroup; teams: Team[] }>,
  predictions: Map<string, QualifiedTeamPrediction>,
  updateGroupPositions: (_groupId: string, _updates: Array<{ teamId: string; position: number; qualifies: boolean }>) => Promise<void>
) {
  return (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeTeamId = active.id as string;
    const overTeamId = over.id as string;

    const groupWithTeams = groups.find(
      ({ teams }) => teams.some((t) => t.id === activeTeamId || t.id === overTeamId)
    );

    if (!groupWithTeams) {
      return;
    }

    const { group, teams } = groupWithTeams;

    // Before the drag, find the current team at position 3 and remember its qualification status
    // This will be inherited by whoever ends up at position 3 after the drag
    const currentThirdPlaceTeam = teams.find((team) => {
      const prediction = predictions.get(team.id);
      return prediction?.predicted_position === 3;
    });
    const thirdPlaceQualificationStatus = currentThirdPlaceTeam
      ? predictions.get(currentThirdPlaceTeam.id)?.predicted_to_qualify ?? false
      : false;

    // Get current team order by position
    const teamOrder = teams
      .map((team) => {
        const prediction = predictions.get(team.id);
        return prediction ? { teamId: team.id, position: prediction.predicted_position } : null;
      })
      .filter((item): item is { teamId: string; position: number } => item !== null)
      .sort((a, b) => a.position - b.position)
      .map((item) => item.teamId);

    const oldIndex = teamOrder.indexOf(activeTeamId);
    const newIndex = teamOrder.indexOf(overTeamId);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Calculate new order after drag
    const newOrder = arrayMove(teamOrder, oldIndex, newIndex);

    // Build batch update for all teams in the group
    const updates = newOrder.map((teamId, index) => {
      const newPosition = index + 1;

      // Determine qualification status
      let qualifies: boolean;
      if (newPosition <= 2) {
        // Positions 1-2 always qualify
        qualifies = true;
      } else if (newPosition === 3) {
        // ANY team moving to position 3 inherits the old 3rd place qualification status
        qualifies = thirdPlaceQualificationStatus;
      } else {
        // Position 4+: not qualified
        qualifies = false;
      }

      return {
        teamId,
        position: newPosition,
        qualifies,
      };
    });

    // Send batch update to server
    updateGroupPositions(group.id, updates);
  };
}

function AutoFillDialog({
  open, isCalculating, onClose, onConfirm,
}: { open: boolean; isCalculating: boolean; onClose: () => void; onConfirm: () => void }) {
  const t = useTranslations('qualified-teams.nudge');
  return (
    <Dialog open={open} onClose={isCalculating ? undefined : onClose} disableEscapeKeyDown={isCalculating}>
      <DialogTitle>{t('autoFillDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('autoFillDialog.body')}</DialogContentText>
        <DialogContentText sx={{ mt: 1 }}>{t('autoFillDialog.note')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isCalculating}>{t('autoFillDialog.cancel')}</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={isCalculating}
          autoFocus
          startIcon={isCalculating ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isCalculating ? t('autoFillDialog.calculating') : t('autoFillDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Main qualified teams UI with DnD */
function QualifiedTeamsUI({
  tournament,
  groups,
  allowsThirdPlace,
  maxThirdPlace,
  isLocked,
  completeGroupIds,
  allGroupsComplete,
  scoringBreakdown,
  games,
  gameGuessesArray,
  tournamentPredictionCompletion,
  tournamentStartDate,
  teamsMap,
  actualResults,
}: Omit<QualifiedTeamsClientPageProps, 'initialPredictions' | 'userId'>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const locale = useLocale();
  const t = useTranslations('qualified-teams');
  const tPredictions = useTranslations('predictions');
  const { predictions, isSaving, saveState, error, clearError, updateGroupPositions, resetPredictions } = useQualifiedTeamsContext();
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showLockedSnackbar, setShowLockedSnackbar] = useState(false);
  const [autoFillDialogOpen, setAutoFillDialogOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [autoFillErrorOpen, setAutoFillErrorOpen] = useState(false);
  const [, startTransition] = useTransition();
  const tNudge = useTranslations('qualified-teams.nudge');

  const handleAutoFillClick = useCallback(() => setAutoFillDialogOpen(true), []);

  const handleAutoFillConfirm = useCallback(() => {
    setIsCalculating(true);
    startTransition(async () => {
      const result = await bulkAutoFillFromPredictions(tournament.id, toLocale(locale));
      setIsCalculating(false);
      setAutoFillDialogOpen(false);
      if (result.success && result.predictions) {
        resetPredictions(result.predictions);
      } else {
        setAutoFillErrorOpen(true);
      }
    });
  }, [tournament.id, locale, resetPredictions, startTransition]);

  // Calculate current third place count for limit checking
  const currentThirdPlaceCount = useMemo(() => {
    return Array.from(predictions.values()).filter(
      p => p.predicted_position === 3 && p.predicted_to_qualify
    ).length;
  }, [predictions]);

  // Initialize locked snackbar state from localStorage
  useEffect(() => {
    const dismissalKey = `dismissedLocked_${tournament.id}_qualifiedTeams`;
    const isDismissed = getDismissalState(dismissalKey);
    setShowLockedSnackbar(isLocked && !isDismissed);
  }, [isLocked, tournament.id]);

  // Show snackbar when save succeeds
  useEffect(() => {
    if (saveState === 'saved') {
      setShowSuccessSnackbar(true);
    }
  }, [saveState]);

  const handleCloseSnackbar = () => {
    setShowSuccessSnackbar(false);
  };

  const handleCloseErrorSnackbar = () => {
    clearError();
  };

  const handleCloseLockedSnackbar = () => {
    const dismissalKey = `dismissedLocked_${tournament.id}_qualifiedTeams`;
    setDismissalState(dismissalKey, true);
    setShowLockedSnackbar(false);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  const handleDragEnd = useMemo(
    () => createDragEndHandler(groups, predictions, updateGroupPositions),
    [groups, predictions, updateGroupPositions]
  );

  /**
   * Handle third place toggle - batch update entire group
   * Auto-qualifies positions 1-2 to prevent server validation errors
   */
  const handleToggleThirdPlace = useCallback(
    (groupId: string, teamId: string) => {
      // Find the group
      const groupWithTeams = groups.find((g) => g.group.id === groupId);
      if (!groupWithTeams) return;

      // Get all team predictions for this group
      const { teams } = groupWithTeams;
      const updates = teams
        .map((team) => {
          const prediction = predictions.get(team.id);
          if (!prediction) return null;

          // Toggle qualification for the target team at position 3
          if (team.id === teamId && prediction.predicted_position === 3) {
            return {
              teamId: team.id,
              position: prediction.predicted_position,
              qualifies: !prediction.predicted_to_qualify,
            };
          }

          // Auto-qualify positions 1-2 (always qualify)
          if (prediction.predicted_position === 1 || prediction.predicted_position === 2) {
            return {
              teamId: team.id,
              position: prediction.predicted_position,
              qualifies: true,
            };
          }

          // Keep other teams as-is
          return {
            teamId: team.id,
            position: prediction.predicted_position,
            qualifies: prediction.predicted_to_qualify,
          };
        })
        .filter((update): update is { teamId: string; position: number; qualifies: boolean } => update !== null);

      // Send batch update
      updateGroupPositions(groupId, updates);
    },
    [groups, predictions, updateGroupPositions]
  );

  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);

  const handleInfoClose = () => {
    setInfoAnchorEl(null);
  };

  const infoOpen = Boolean(infoAnchorEl);

  // Convert game guesses array to map for GuessesContext
  const gameGuessesMap = useMemo(
    () => customToMap(gameGuessesArray, (g: any) => g.game_id),
    [gameGuessesArray]
  );

  // Calculate qualified teams completion (DISTINCT teams marked as predicted_to_qualify)
  const qualifiedTeamsCompleted = useMemo(() => {
    const uniqueTeams = new Set<string>();
    for (const prediction of predictions.values()) {
      if (prediction.predicted_to_qualify) {
        uniqueTeams.add(prediction.team_id);
      }
    }
    return uniqueTeams.size;
  }, [predictions]);

  const qtLockAt = useMemo(
    () => tournamentStartDate ? new Date(tournamentStartDate.getTime() + PREDICTION_LOCK_OFFSET_MS) : null,
    [tournamentStartDate]
  );

  const correctSoFar = useMemo(() => {
    if (!scoringBreakdown) return 0;
    return scoringBreakdown.breakdown.reduce((acc, group) => {
      return acc + group.teams.filter(t => t.predictedToQualify && t.actuallyQualified).length;
    }, 0);
  }, [scoringBreakdown]);

  const qtHeaderVariant = useMemo(
    () => computeQTHeaderVariant(
      {
        isLocked,
        qtLockAt,
        predictedGroupGames: tournamentPredictionCompletion?.completedGroupGames ?? 0,
        totalGroupGames: tournamentPredictionCompletion?.totalGroupGames ?? 0,
        qualifiersCompleted: qualifiedTeamsCompleted,
        qualifiersTotal: tournamentPredictionCompletion?.qualifiers.total ?? 0,
        definedSoFar: actualResults?.length ?? 0,
        correctSoFar,
        qtPointsEarned: scoringBreakdown?.totalScore,
        onAutoFillClick: handleAutoFillClick,
        tournamentId: tournament.id,
        locale,
      },
      tPredictions as (key: string, values?: Record<string, unknown>) => string
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLocked, qtLockAt, tournamentPredictionCompletion, qualifiedTeamsCompleted, actualResults, correctSoFar, scoringBreakdown, locale]
  );

  return (
    <GuessesContextProvider
      gameGuesses={gameGuessesMap}
      autoSave={true}
      tournamentMaxSilver={tournament.max_silver_games || 0}
      tournamentMaxGolden={tournament.max_golden_games || 0}
    >
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : '100%',
      }}>
        {/* Prediction Status Header */}
        <Box sx={{ flexShrink: 0, pt: 2 }}>
          <PredictionStatusHeader variant={qtHeaderVariant} />
        </Box>

        <Popover
          open={infoOpen}
          anchorEl={infoAnchorEl}
          onClose={handleInfoClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            <strong>{t('instructions.title')}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • {t('instructions.dragTeams')}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            • {t('instructions.autoQualify')}
          </Typography>
          {allowsThirdPlace && (
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              • {t('instructions.thirdPlace')}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            {t('instructions.autoSave')}
          </Typography>
        </Box>
      </Popover>

        {/* Scrollable content area */}
        {isMobile ? (
          // Mobile: Full page scroll, no ScrollShadowContainer
          <Box sx={{ py: 2 }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <QualifiedTeamsGrid
                groups={groups}
                predictions={predictions}
                isLocked={isLocked}
                isSaving={isSaving}
                allowsThirdPlace={allowsThirdPlace}
                maxThirdPlace={maxThirdPlace}
                currentThirdPlaceCount={currentThirdPlaceCount}
                onToggleThirdPlace={handleToggleThirdPlace}
                scoringBreakdown={scoringBreakdown}
                completeGroupIds={completeGroupIds}
                allGroupsComplete={allGroupsComplete}
              />
            </DndContext>
          </Box>
        ) : (
          // Desktop: Scrollable with shadows
          <ScrollShadowContainer
            direction="vertical"
            hideScrollbar={true}
            sx={{ flex: 1, minHeight: 0, py: 2 }}
          >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <QualifiedTeamsGrid
                groups={groups}
                predictions={predictions}
                isLocked={isLocked}
                isSaving={isSaving}
                allowsThirdPlace={allowsThirdPlace}
                maxThirdPlace={maxThirdPlace}
                currentThirdPlaceCount={currentThirdPlaceCount}
                onToggleThirdPlace={handleToggleThirdPlace}
                scoringBreakdown={scoringBreakdown}
                completeGroupIds={completeGroupIds}
                allGroupsComplete={allGroupsComplete}
              />
            </DndContext>
          </ScrollShadowContainer>
        )}

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {t('page.savedSuccess')}
        </Alert>
      </Snackbar>

      <Snackbar
        open={saveState === 'error' && !!error}
        autoHideDuration={6000}
        onClose={handleCloseErrorSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseErrorSnackbar} severity="error" sx={{ width: '100%' }}>
          {error || t('page.saveError')}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showLockedSnackbar}
        onClose={handleCloseLockedSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseLockedSnackbar} severity="info" icon={<LockIcon />} sx={{ width: '100%' }}>
          {t('page.lockedAlert')}
        </Alert>
      </Snackbar>

      <Backdrop
        open={isSaving}
        sx={{
          color: 'common.white',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(2px)',
        }}
      >
        <CircularProgress color="inherit" size={60} />
      </Backdrop>
      </Box>

      <AutoFillDialog
        open={autoFillDialogOpen}
        isCalculating={isCalculating}
        onClose={() => setAutoFillDialogOpen(false)}
        onConfirm={handleAutoFillConfirm}
      />

      <Snackbar
        open={autoFillErrorOpen}
        autoHideDuration={4000}
        onClose={() => setAutoFillErrorOpen(false)}
        message={tNudge('autoFillError')}
      />
    </GuessesContextProvider>
  );
}

/**
 * Client page component for qualified teams predictions
 * Wraps UI with context and DnD providers
 */
export default function QualifiedTeamsClientPage(props: QualifiedTeamsClientPageProps) {
  return (
    <QualifiedTeamsContextProvider
      initialPredictions={props.initialPredictions}
      tournamentId={props.tournament.id}
      userId={props.userId}
      isLocked={props.isLocked}
    >
      <QualifiedTeamsUI {...props} />
    </QualifiedTeamsContextProvider>
  );
}
