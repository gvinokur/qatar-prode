'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Container, Typography, Alert, Snackbar, Box, IconButton, Popover, Backdrop, CircularProgress } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  QualifiedTeamsContextProvider,
  useQualifiedTeamsContext,
} from './qualified-teams-context';
import { Team, TournamentGroup, QualifiedTeamPrediction } from '../../db/tables-definition';
import QualifiedTeamsGrid from './qualified-teams-grid';
import ThirdPlaceSummary from './third-place-summary';
import { QualifiedTeamsScoringResult } from '../../utils/qualified-teams-scoring';

interface QualifiedTeamsClientPageProps {
  /** Tournament data */
  readonly tournament: {
    readonly id: string;
    readonly short_name: string;
    readonly is_active: boolean;
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

/** Main qualified teams UI with DnD */
function QualifiedTeamsUI({
  tournament,
  groups,
  allowsThirdPlace,
  maxThirdPlace,
  isLocked,
  actualResults,
  completeGroupIds,
  allGroupsComplete,
  scoringBreakdown,
  showHeader = true,
}: Omit<QualifiedTeamsClientPageProps, 'initialPredictions' | 'userId'>) {
  const t = useTranslations('qualified-teams');
  const { predictions, isSaving, saveState, error, clearError, updateGroupPositions } = useQualifiedTeamsContext();
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const allTeams = useMemo(() => groups.flatMap(({ teams }) => teams), [groups]);

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

  const handleInfoClick = (event: React.MouseEvent<HTMLElement>) => {
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setInfoAnchorEl(null);
  };

  const infoOpen = Boolean(infoAnchorEl);

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: '100%' }}>
      {showHeader && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Typography variant="h4" component="h1">
            {t('page.title')}
          </Typography>
          <IconButton onClick={handleInfoClick} size="small" sx={{ color: 'text.secondary' }}>
            <InfoOutlinedIcon />
          </IconButton>
        </Box>
      )}

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

      {isLocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('page.lockedAlert')}
        </Alert>
      )}

      {allowsThirdPlace && (
        <ThirdPlaceSummary
          teams={allTeams}
          predictions={predictions}
          maxThirdPlace={maxThirdPlace}
          allowsThirdPlace={allowsThirdPlace}
        />
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <QualifiedTeamsGrid
          groups={groups}
          predictions={predictions}
          isLocked={isLocked}
          isSaving={isSaving}
          allowsThirdPlace={allowsThirdPlace}
          onToggleThirdPlace={handleToggleThirdPlace}
          scoringBreakdown={scoringBreakdown}
          completeGroupIds={completeGroupIds}
          allGroupsComplete={allGroupsComplete}
        />
      </DndContext>

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

      <Backdrop
        open={isSaving}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(2px)',
        }}
      >
        <CircularProgress color="inherit" size={60} />
      </Backdrop>
    </Container>
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
