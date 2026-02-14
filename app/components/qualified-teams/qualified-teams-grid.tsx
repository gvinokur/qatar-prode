'use client';

import React, { useMemo } from 'react';
import { Grid, Box } from '@mui/material';
import { TournamentGroup, Team, QualifiedTeamPrediction } from '../../db/tables-definition';
import GroupCard from './group-card';
import { QualifiedTeamsScoringResult } from '../../utils/qualified-teams-scoring';

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
  /** Whether predictions are currently being saved */
  readonly isSaving: boolean;
  /** Whether third place qualification is enabled */
  readonly allowsThirdPlace: boolean;
  /** Callback when team position changes - receives groupId, teamId, and new position */
  readonly onPositionChange?: (_groupId: string, _teamId: string, _newPosition: number) => void;
  /** Callback when third place qualification is toggled - receives groupId and teamId */
  readonly onToggleThirdPlace?: (_groupId: string, _teamId: string) => void;
  /** Scoring breakdown for user's predictions */
  readonly scoringBreakdown?: QualifiedTeamsScoringResult | null;
  /** Set of group IDs that are complete (have results available) */
  readonly completeGroupIds: Set<string>;
  /** Whether all groups in the tournament are complete */
  readonly allGroupsComplete: boolean;
}

/**
 * Responsive grid layout for displaying tournament group cards
 * Uses CSS container queries to adapt to container width (not viewport):
 * - Narrow containers: 1 column (<500px)
 * - Wide containers: 2 columns (500px+)
 */
export default function QualifiedTeamsGrid({
  groups,
  predictions,
  isLocked,
  isSaving,
  allowsThirdPlace,
  onPositionChange,
  onToggleThirdPlace,
  scoringBreakdown,
  completeGroupIds,
  allGroupsComplete,
}: QualifiedTeamsGridProps) {
  // Create lookup map: groupId -> team scoring results
  const groupResultsMap = useMemo(() => {
    if (!scoringBreakdown) return new Map();

    const map = new Map<string, Array<{ teamId: string; teamName: string; groupId: string; predictedPosition: number; actualPosition: number | null; predictedToQualify: boolean; actuallyQualified: boolean; pointsAwarded: number; reason: string }>>();

    scoringBreakdown.breakdown.forEach((groupBreakdown) => {
      map.set(groupBreakdown.groupId, groupBreakdown.teams);
    });

    return map;
  }, [scoringBreakdown]);

  return (
    <Box sx={{
      width: '100%',
      // Enable container queries on this element
      containerType: 'inline-size',
      containerName: 'qualified-teams-grid'
    }}>
      <Grid container spacing={2}>
        {groups.map(({ group, teams }) => {
          const isGroupComplete = completeGroupIds.has(group.id);
          const groupResults = groupResultsMap.get(group.id) || [];

          return (
            <Grid
              key={group.id}
              sx={{
                // Use container queries instead of viewport breakpoints
                // Default: 1 column (100%)
                width: '100%',
                // 2 columns when container is at least 500px wide
                '@container qualified-teams-grid (min-width: 500px)': {
                  width: '50%'
                }
              }}
            >
              <GroupCard
                group={group}
                teams={teams}
                predictions={predictions}
                isLocked={isLocked}
                isSaving={isSaving}
                allowsThirdPlace={allowsThirdPlace}
                onPositionChange={
                  onPositionChange ? (teamId, newPosition) => onPositionChange(group.id, teamId, newPosition) : undefined
                }
                onToggleThirdPlace={
                  onToggleThirdPlace ? (teamId) => onToggleThirdPlace(group.id, teamId) : undefined
                }
                groupResults={groupResults}
                isGroupComplete={isGroupComplete}
                allGroupsComplete={allGroupsComplete}
              />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
