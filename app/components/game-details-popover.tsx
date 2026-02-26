'use client'

import React from 'react';
import { Popover, Card, Typography, Alert } from '@mui/material';
import { useTranslations } from 'next-intl';
import { UrgencyAccordionGroup } from './urgency-accordion-group';
import type { ExtendedGameData } from '../definitions';
import { Team } from '../db/tables-definition';

interface GameDetailsPopoverProps {
  readonly open: boolean;
  readonly anchorEl: HTMLElement | null;
  readonly onClose: () => void;
  readonly width: number;
  readonly hasUrgentGames: boolean;
  readonly urgentGames?: ExtendedGameData[];
  readonly urgentGameGuesses?: Record<string, { home_score: number | null; away_score: number | null }>;
  readonly teamsMap?: Record<string, Team>;
  readonly tournamentId?: string;
  readonly silverMax: number;
  readonly goldenMax: number;
}

/**
 * Popover displaying detailed game predictions grouped by urgency level
 */
export function GameDetailsPopover({
  open,
  anchorEl,
  onClose,
  width,
  hasUrgentGames,
  urgentGames,
  urgentGameGuesses,
  teamsMap,
  tournamentId,
  silverMax,
  goldenMax
}: GameDetailsPopoverProps) {
  const t = useTranslations('predictions');

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Card sx={{ width, maxHeight: '80vh', overflow: 'auto', p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('dashboard.gamePredictions')}
        </Typography>
        {hasUrgentGames ? null : (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('urgency.noGamesIn48Hours')}
          </Alert>
        )}
        {urgentGames && teamsMap && tournamentId !== undefined && urgentGameGuesses && (
          <UrgencyAccordionGroup
            games={urgentGames}
            teamsMap={teamsMap}
            gameGuesses={urgentGameGuesses as Record<string, any>}
            tournamentId={tournamentId}
          />
        )}
      </Card>
    </Popover>
  );
}
