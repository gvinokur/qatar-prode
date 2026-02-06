'use client';

import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, Typography, Box, Divider, Alert } from '@mui/material';
import { Team, TournamentGroup, QualifiedTeamPrediction } from '../../db/tables-definition';
import DraggableTeamCard from './draggable-team-card';

export interface GroupCardProps {
  /** Tournament group data */
  readonly group: TournamentGroup;
  /** Teams in this group */
  readonly teams: Team[];
  /** Predictions for teams in this group */
  readonly predictions: Map<string, QualifiedTeamPrediction>;
  /** Whether tournament is locked */
  readonly isLocked: boolean;
  /** Whether third place qualification is enabled */
  readonly allowsThirdPlace: boolean;
  /** Callback when team position changes */
  readonly onPositionChange?: (teamId: string, newPosition: number) => void;
  /** Callback when third place qualification is toggled */
  readonly onToggleThirdPlace?: (teamId: string) => void;
}

/** Group header component */
function GroupHeader({ groupLetter }: { groupLetter: string }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
        GRUPO {groupLetter.toUpperCase()}
      </Typography>
      <Divider />
    </Box>
  );
}

/** Qualification instructions component */
function QualificationInstructions({ allowsThirdPlace }: { allowsThirdPlace: boolean }) {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="body2">
        <strong>Posiciones 1-2:</strong> Clasifican automáticamente a la siguiente ronda
        {allowsThirdPlace && (
          <>
            <br />
            <strong>Posición 3:</strong> Selecciona los equipos que predices que clasificarán
          </>
        )}
      </Typography>
    </Alert>
  );
}

/**
 * Group card component that displays a tournament group with draggable team cards
 * Handles drag-and-drop reordering and third place qualification selection
 */
export default function GroupCard({
  group,
  teams,
  predictions,
  isLocked,
  allowsThirdPlace,
  onPositionChange,
  onToggleThirdPlace,
}: GroupCardProps) {
  // Sort teams by predicted position
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => {
      const predA = predictions.get(a.id);
      const predB = predictions.get(b.id);
      if (!predA || !predB) return 0;
      return predA.predicted_position - predB.predicted_position;
    });
  }, [teams, predictions]);

  // Extract team IDs for SortableContext
  const teamIds = useMemo(() => sortedTeams.map((team) => team.id), [sortedTeams]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <GroupHeader groupLetter={group.group_letter} />
        <QualificationInstructions allowsThirdPlace={allowsThirdPlace} />

        <Box sx={{ flex: 1 }}>
          <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
            {sortedTeams.map((team) => {
              const prediction = predictions.get(team.id);
              if (!prediction) return null;

              return (
                <DraggableTeamCard
                  key={team.id}
                  team={team}
                  position={prediction.predicted_position}
                  predictedToQualify={prediction.predicted_to_qualify}
                  disabled={isLocked}
                  onToggleThirdPlace={
                    onToggleThirdPlace && prediction.predicted_position === 3
                      ? () => onToggleThirdPlace(team.id)
                      : undefined
                  }
                />
              );
            })}
          </SortableContext>
        </Box>
      </CardContent>
    </Card>
  );
}
