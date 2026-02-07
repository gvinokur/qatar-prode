'use client';

import React from 'react';
import { Grid, Box } from '@mui/material';
import { TournamentGroup, Team, QualifiedTeamPrediction } from '../../db/tables-definition';
import GroupCard from './group-card';

export interface QualifiedTeamsGridProps {
  /** Tournament groups with their teams */
  readonly groups: Array<{
    readonly group: TournamentGroup;
    readonly teams: Team[];
  }>;
  /** Predictions for all teams */
  readonly predictions: Map<string, QualifiedTeamPrediction>;
  /** Whether tournament is locked */
  readonly isLocked: boolean;
  /** Whether third place qualification is enabled */
  readonly allowsThirdPlace: boolean;
  /** Callback when team position changes - receives groupId, teamId, and new position */
  readonly onPositionChange?: (_groupId: string, _teamId: string, _newPosition: number) => void;
  /** Callback when third place qualification is toggled - receives groupId and teamId */
  readonly onToggleThirdPlace?: (_groupId: string, _teamId: string) => void;
}

/**
 * Responsive grid layout for displaying tournament group cards
 * Adapts to different screen sizes:
 * - Mobile (xs): 1 column (<600px)
 * - Small tablet (sm): 1 column (600-900px)
 * - Medium tablet (md): 2 columns (900-1200px)
 * - Desktop (lg+): 3 columns (1200px+)
 */
export default function QualifiedTeamsGrid({
  groups,
  predictions,
  isLocked,
  allowsThirdPlace,
  onPositionChange,
  onToggleThirdPlace,
}: QualifiedTeamsGridProps) {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Grid container spacing={3}>
        {groups.map(({ group, teams }) => (
          <Grid key={group.id} size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
            <GroupCard
              group={group}
              teams={teams}
              predictions={predictions}
              isLocked={isLocked}
              allowsThirdPlace={allowsThirdPlace}
              onPositionChange={
                onPositionChange ? (teamId, newPosition) => onPositionChange(group.id, teamId, newPosition) : undefined
              }
              onToggleThirdPlace={
                onToggleThirdPlace ? (teamId) => onToggleThirdPlace(group.id, teamId) : undefined
              }
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
