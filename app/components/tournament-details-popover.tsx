import React from 'react';
import { Popover, Card, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { TournamentPredictionAccordion } from './tournament-prediction-accordion';

interface TournamentDetailsPopoverProps {
  readonly open: boolean;
  readonly anchorEl: HTMLElement | null;
  readonly onClose: () => void;
  readonly width: number;
  readonly finalStandingsCompleted?: number;
  readonly finalStandingsTotal?: number;
  readonly awardsCompleted?: number;
  readonly awardsTotal?: number;
  readonly qualifiersCompleted?: number;
  readonly qualifiersTotal?: number;
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
  finalStandingsCompleted,
  finalStandingsTotal,
  awardsCompleted,
  awardsTotal,
  qualifiersCompleted,
  qualifiersTotal,
  tournamentId
}: TournamentDetailsPopoverProps) {
  const t = useTranslations('predictions');

  // Reconstruct tournament predictions object for the accordion component
  const tournamentPredictions =
    finalStandingsCompleted !== undefined &&
    finalStandingsTotal !== undefined &&
    awardsCompleted !== undefined &&
    awardsTotal !== undefined &&
    qualifiersCompleted !== undefined &&
    qualifiersTotal !== undefined
      ? {
          finalStandings: {
            completed: finalStandingsCompleted,
            total: finalStandingsTotal,
          },
          awards: {
            completed: awardsCompleted,
            total: awardsTotal,
          },
          qualifiers: {
            completed: qualifiersCompleted,
            total: qualifiersTotal,
          },
        }
      : undefined;

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
          {t('dashboard.tournamentPredictions')}
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
