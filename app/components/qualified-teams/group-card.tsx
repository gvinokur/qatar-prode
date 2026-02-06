'use client';

import React, { useMemo, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

  // Content to render (shared between accordion and card)
  const content = (
    <>
      {!isMobile && <GroupHeader groupLetter={group.group_letter} />}
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
              my: 1
            }
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            GRUPO {group.group_letter.toUpperCase()} - {qualifiedCount} seleccionado{qualifiedCount !== 1 ? 's' : ''}
          </Typography>
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
