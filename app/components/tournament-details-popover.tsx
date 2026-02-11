import React from 'react';
import { Popover, Card, Typography } from '@mui/material';
import { TournamentPredictionAccordion } from './tournament-prediction-accordion';
import { TournamentPredictionCompletion } from '../db/tables-definition';

interface TournamentDetailsPopoverProps {
  readonly open: boolean;
  readonly anchorEl: HTMLElement | null;
  readonly onClose: () => void;
  readonly width: number;
  readonly tournamentPredictions?: TournamentPredictionCompletion;
  readonly tournamentId?: string;
}

/**
 * Popover displaying detailed tournament predictions
 */
export function TournamentDetailsPopover({
  open,
  anchorEl,
  onClose,
  width,
  tournamentPredictions,
  tournamentId
}: TournamentDetailsPopoverProps) {
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
          Predicciones de Torneo
        </Typography>
        {tournamentPredictions && tournamentId && (
          <TournamentPredictionAccordion
            tournamentPredictions={tournamentPredictions}
            tournamentId={tournamentId}
            isExpanded={true}
            onToggle={() => {}}
          />
        )}
      </Card>
    </Popover>
  );
}
