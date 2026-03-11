'use client'

import { Card, CardContent, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { TournamentScoreHistory } from '../../db/tables-definition';
import { ScoreGrowthChart } from './score-growth-chart';

interface HistoryTabCardProps {
  readonly rows: TournamentScoreHistory[];
}

export function HistoryTabCard({ rows }: HistoryTabCardProps) {
  const t = useTranslations('stats');

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        {t('history.emptyState')}
      </Typography>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <ScoreGrowthChart rows={rows} />
      </CardContent>
    </Card>
  );
}
