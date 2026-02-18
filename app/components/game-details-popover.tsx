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
  readonly games?: ExtendedGameData[];
  readonly teamsMap?: Record<string, Team>;
  readonly gameGuesses: Record<string, any>;
  readonly tournamentId?: string;
  readonly isPlayoffs: boolean;
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
  games,
  teamsMap,
  gameGuesses,
  tournamentId,
  isPlayoffs,
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
        {games && teamsMap && tournamentId !== undefined && (
          <UrgencyAccordionGroup
            games={games}
            teamsMap={teamsMap}
            gameGuesses={gameGuesses}
            tournamentId={tournamentId}
            isPlayoffs={isPlayoffs}
          />
        )}
      </Card>
    </Popover>
  );
}
