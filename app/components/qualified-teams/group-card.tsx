'use client';

import React, { useMemo, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Team, TournamentGroup, QualifiedTeamPrediction } from '../../db/tables-definition';
import DraggableTeamCard from './draggable-team-card';
import { TeamScoringResult } from '../../utils/qualified-teams-scoring';

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
  /** Scoring results for teams in this group */
  readonly groupResults?: TeamScoringResult[];
  /** Whether this group is complete (results can be shown) */
  readonly isGroupComplete: boolean;
  /** Whether all groups in the tournament are complete */
  readonly allGroupsComplete: boolean;
}

/** Group header component */
function GroupHeader({
  groupLetter,
  groupTotalPoints
}: {
  readonly groupLetter: string;
  readonly groupTotalPoints?: number;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          GRUPO {groupLetter.toUpperCase()}
        </Typography>
        {groupTotalPoints !== undefined && (
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {groupTotalPoints} {groupTotalPoints === 1 ? 'punto' : 'puntos'}
          </Typography>
        )}
      </Box>
      <Divider />
    </Box>
  );
}

/**
 * Group card component that displays a tournament group with draggable team cards
 * Handles drag-and-drop reordering and third place qualification selection
 * On mobile: Uses accordion for collapsible groups
 * On desktop: Uses card layout
 */
export default function GroupCard({
  group,
  teams,
  predictions,
  isLocked,
  allowsThirdPlace,
  onPositionChange,
  onToggleThirdPlace,
  groupResults = [],
  isGroupComplete,
  allGroupsComplete,
}: GroupCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isExpanded, setIsExpanded] = useState(true);

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

  // Count qualified teams for accordion summary
  const qualifiedCount = useMemo(() => {
    return sortedTeams.filter((team) => {
      const prediction = predictions.get(team.id);
      return prediction?.predicted_to_qualify === true;
    }).length;
  }, [sortedTeams, predictions]);

  // Create lookup map for team results
  const resultsMap = useMemo(() => {
    return new Map(groupResults.map((result) => [result.teamId, result]));
  }, [groupResults]);

  // Calculate total group points
  const groupTotalPoints = useMemo(() => {
    if (!isGroupComplete || groupResults.length === 0) return undefined;
    return groupResults.reduce((sum, result) => sum + result.pointsAwarded, 0);
  }, [groupResults, isGroupComplete]);

  /**
   * Determine if a team is in pending 3rd place state:
   * - User predicted this team to qualify (in any position)
   * - Team is currently 3rd in actual tournament standings (not user's prediction)
   * - This group is complete
   * - NOT all groups are complete (so best 3rds haven't been determined yet)
   * - Tournament allows 3rd place qualification
   */
  const isPending3rdPlace = (teamId: string): boolean => {
    // Must allow 3rd place, group complete, but NOT all groups complete
    if (!allowsThirdPlace || !isGroupComplete || allGroupsComplete) return false;

    const prediction = predictions.get(teamId);
    // User must have predicted this team to qualify (in any position)
    if (!prediction || !prediction.predicted_to_qualify) {
      return false;
    }

    const result = resultsMap.get(teamId);
    if (!result) return false;

    // Team must be 3rd in ACTUAL standings (not predicted)
    // and not yet qualified (because best 3rds haven't been determined)
    return result.actualPosition === 3 && !result.actuallyQualified;
  };

  // Content to render (shared between accordion and card)
  const content = (
    <>
      {!isMobile && <GroupHeader groupLetter={group.group_letter} groupTotalPoints={groupTotalPoints} />}

      <Box sx={{ flex: 1 }}>
        <SortableContext items={teamIds} strategy={verticalListSortingStrategy}>
          {sortedTeams.map((team) => {
            const prediction = predictions.get(team.id);
            if (!prediction) return null;

            const result = resultsMap.get(team.id);
            const isPending = isPending3rdPlace(team.id);

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
                result={result}
                isGroupComplete={isGroupComplete}
                isPending3rdPlace={isPending}
              />
            );
          })}
        </SortableContext>
      </Box>
    </>
  );

  // Mobile: Accordion layout
  if (isMobile) {
    return (
      <Accordion
        expanded={isExpanded}
        onChange={() => setIsExpanded(!isExpanded)}
        sx={{
          mb: 2,
          border: 1,
          borderColor: 'divider',
          '&:before': { display: 'none' },
          boxShadow: 1
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`group-${group.group_letter}-content`}
          id={`group-${group.group_letter}-header`}
          sx={{
            '& .MuiAccordionSummary-content': {
              my: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            GRUPO {group.group_letter.toUpperCase()} - {qualifiedCount} seleccionado{qualifiedCount === 1 ? '' : 's'}
          </Typography>
          {groupTotalPoints !== undefined && (
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', ml: 2 }}>
              {groupTotalPoints} {groupTotalPoints === 1 ? 'pt' : 'pts'}
            </Typography>
          )}
        </AccordionSummary>

        <AccordionDetails>
          {content}
        </AccordionDetails>
      </Accordion>
    );
  }

  // Desktop: Card layout
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {content}
      </CardContent>
    </Card>
  );
}
