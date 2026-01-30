'use client'

import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
import { TournamentPredictionCategoryCard } from './tournament-prediction-category-card';
import type { TournamentPredictionCompletion } from '../db/tables-definition';

interface TournamentPredictionAccordionProps {
  readonly tournamentPredictions: TournamentPredictionCompletion;
  readonly tournamentId: string;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
}

export function TournamentPredictionAccordion({
  tournamentPredictions,
  tournamentId,
  isExpanded,
  onToggle
}: TournamentPredictionAccordionProps) {
  const { overallCompleted, overallTotal, overallPercentage, isPredictionLocked } = tournamentPredictions;

  // Color logic for accordion border
  const getAccordionColor = (): string => {
    if (isPredictionLocked) return 'text.disabled';  // Gray (locked)
    if (overallPercentage === 100) return 'success.main';  // Green (complete)
    return 'warning.main';  // Orange (incomplete)
  };

  // Icon logic - 24px icons (default size)
  const getAccordionIcon = (): JSX.Element => {
    if (isPredictionLocked) {
      return <LockIcon color="disabled" />;
    }
    if (overallPercentage === 100) {
      return <CheckCircleIcon color="success" />;
    }
    return <WarningIcon color="warning" />;
  };

  return (
    <Accordion
      expanded={isExpanded}
      onChange={onToggle}
      sx={{
        mb: 1,
        border: 1,
        borderColor: 'divider',
        '&:before': { display: 'none' },
        boxShadow: 'none'
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="tournament-predictions-content"
        id="tournament-predictions-header"
        sx={{
          borderLeft: 4,
          borderLeftColor: getAccordionColor(),
          '& .MuiAccordionSummary-content': {
            my: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }
        }}
      >
        {getAccordionIcon()}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Predicciones de Torneo - {overallCompleted}/{overallTotal} ({overallPercentage}%)
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Podio */}
          <TournamentPredictionCategoryCard
            title="Podio"
            completed={tournamentPredictions.finalStandings.completed}
            total={tournamentPredictions.finalStandings.total}
            link={`/tournaments/${tournamentId}/awards`}
            isLocked={isPredictionLocked}
          />

          {/* Premios Individuales */}
          <TournamentPredictionCategoryCard
            title="Premios Individuales"
            completed={tournamentPredictions.awards.completed}
            total={tournamentPredictions.awards.total}
            link={`/tournaments/${tournamentId}/awards`}
            isLocked={isPredictionLocked}
          />

          {/* Clasificados (conditional) */}
          {tournamentPredictions.qualifiers.total > 0 && (
            <TournamentPredictionCategoryCard
              title="Clasificados"
              completed={tournamentPredictions.qualifiers.completed}
              total={tournamentPredictions.qualifiers.total}
              link={`/tournaments/${tournamentId}/playoffs`}
              isLocked={isPredictionLocked}
            />
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
