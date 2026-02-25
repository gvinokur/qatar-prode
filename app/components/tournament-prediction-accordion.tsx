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
import { TournamentPredictionCategoryCard } from './tournament-prediction-category-card';
import type { TournamentPredictionCompletion } from '../db/tables-definition';
import { useLocale, useTranslations } from 'next-intl';
import { getCategoryUrgencyLevel, getWorstUrgencyLevel, getUrgencyIcon } from './urgency-helpers';

interface TournamentPredictionAccordionProps {
  readonly tournamentPredictions: TournamentPredictionCompletion;
  readonly tournamentId: string;
  readonly tournamentStartDate?: Date;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
}

export function TournamentPredictionAccordion({
  tournamentPredictions,
  tournamentId,
  tournamentStartDate,
  isExpanded,
  onToggle
}: TournamentPredictionAccordionProps) {
  const t = useTranslations('predictions');
  const locale = useLocale();
  const { overallCompleted, overallTotal, overallPercentage, isPredictionLocked } = tournamentPredictions;

  // Calculate urgency for each category
  const finalStandingsUrgency = getCategoryUrgencyLevel(
    tournamentPredictions.finalStandings.completed,
    tournamentPredictions.finalStandings.total,
    isPredictionLocked,
    tournamentStartDate
  );

  const awardsUrgency = getCategoryUrgencyLevel(
    tournamentPredictions.awards.completed,
    tournamentPredictions.awards.total,
    isPredictionLocked,
    tournamentStartDate
  );

  const qualifiersUrgency = tournamentPredictions.qualifiers.total > 0
    ? getCategoryUrgencyLevel(
        tournamentPredictions.qualifiers.completed,
        tournamentPredictions.qualifiers.total,
        isPredictionLocked,
        tournamentStartDate
      )
    : 'complete';

  // Get worst urgency level across all categories
  const overallUrgency = getWorstUrgencyLevel(
    finalStandingsUrgency,
    awardsUrgency,
    qualifiersUrgency
  );

  // Color logic for accordion border
  const getAccordionColor = (): string => {
    switch (overallUrgency) {
      case 'urgent': return 'error.main';
      case 'warning': return 'warning.main';
      case 'notice': return 'info.main';
      case 'complete': return 'success.main';
      case 'locked': return 'text.disabled';
    }
  };

  // Icon logic - 24px icons (default 1.25rem = 20px, close to 24px)
  const getAccordionIcon = (): React.ReactElement => {
    return getUrgencyIcon(overallUrgency);
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
          {t('tournament.predictions')} - {overallCompleted}/{overallTotal} ({overallPercentage}%)
        </Typography>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Podio */}
          <TournamentPredictionCategoryCard
            title={t('tournament.podium')}
            completed={tournamentPredictions.finalStandings.completed}
            total={tournamentPredictions.finalStandings.total}
            link={`/${locale}/tournaments/${tournamentId}/awards`}
            isLocked={isPredictionLocked}
            tournamentStartDate={tournamentStartDate}
          />

          {/* Premios Individuales */}
          <TournamentPredictionCategoryCard
            title={t('tournament.individualAwards')}
            completed={tournamentPredictions.awards.completed}
            total={tournamentPredictions.awards.total}
            link={`/${locale}/tournaments/${tournamentId}/awards`}
            isLocked={isPredictionLocked}
            tournamentStartDate={tournamentStartDate}
          />

          {/* Clasificados (conditional) */}
          {tournamentPredictions.qualifiers.total > 0 && (
            <TournamentPredictionCategoryCard
              title={t('tournament.qualified')}
              completed={tournamentPredictions.qualifiers.completed}
              total={tournamentPredictions.qualifiers.total}
              link={`/${locale}/tournaments/${tournamentId}/qualified-teams`}
              isLocked={isPredictionLocked}
              tournamentStartDate={tournamentStartDate}
            />
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
