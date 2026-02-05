'use client';

import React, { useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Container, Typography, Alert } from '@mui/material';
import {
  QualifiedTeamsContextProvider,
  useQualifiedTeamsContext,
} from './qualified-teams-context';
import { Team, TournamentGroup, QualifiedTeamPrediction } from '../../db/tables-definition';
import QualifiedTeamsGrid from './qualified-teams-grid';
import ThirdPlaceSummary from './third-place-summary';

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
}

/** Handle drag end event */
function createDragEndHandler(
  groups: Array<{ group: TournamentGroup; teams: Team[] }>,
  predictions: Map<string, QualifiedTeamPrediction>,
  updatePosition: (_groupId: string, _teamId: string, _newPosition: number) => void
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

    const newOrder = arrayMove(teamOrder, oldIndex, newIndex);

    newOrder.forEach((teamId, index) => {
      const newPosition = index + 1;
      const currentPrediction = predictions.get(teamId);

      if (currentPrediction && currentPrediction.predicted_position !== newPosition) {
        updatePosition(group.id, teamId, newPosition);
      }
    });
  };
}

/** Main qualified teams UI with DnD */
function QualifiedTeamsUI({
  tournament,
  groups,
  allowsThirdPlace,
  maxThirdPlace,
  isLocked,
}: Omit<QualifiedTeamsClientPageProps, 'initialPredictions' | 'userId'>) {
  const { predictions, isSaving, updatePosition, toggleThirdPlace } = useQualifiedTeamsContext();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const allTeams = useMemo(() => groups.flatMap(({ teams }) => teams), [groups]);

  const handleDragEnd = useMemo(
    () => createDragEndHandler(groups, predictions, updatePosition),
    [groups, predictions, updatePosition]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {tournament.short_name} - Qualified Teams Predictions
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Predict which teams will qualify from each group by dragging them into your preferred order.
      </Typography>

      {isLocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Predictions are locked for this tournament. You can view your predictions but cannot make changes.
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
          isLocked={isLocked || isSaving}
          allowsThirdPlace={allowsThirdPlace}
          onToggleThirdPlace={toggleThirdPlace}
        />
      </DndContext>
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
