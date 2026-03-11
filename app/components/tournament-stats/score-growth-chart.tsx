'use client'

import { LineChart } from '@mui/x-charts/LineChart';
import { Typography, Box } from '@mui/material';
import { useTranslations } from 'next-intl';
import { TournamentScoreHistory } from '../../db/tables-definition';

function yyyymmddToMs(d: number): number {
  const year = Math.floor(d / 10000);
  const month = Math.floor((d % 10000) / 100) - 1;
  const day = d % 100;
  return new Date(year, month, day).getTime();
}

interface ScoreGrowthChartProps {
  readonly rows: TournamentScoreHistory[];
}

export function ScoreGrowthChart({ rows }: ScoreGrowthChartProps) {
  const t = useTranslations('stats');

  const dates = rows.map((r) => yyyymmddToMs(r.snapshot_date));

  const series = [
    {
      id: 'gameScore',
      label: t('history.bands.gameScore'),
      data: rows.map((r) => r.total_game_score),
      area: true,
      stack: 'total',
      showMark: false,
    },
    {
      id: 'boostBonus',
      label: t('history.bands.boostBonus'),
      data: rows.map((r) => r.total_boost_bonus),
      area: true,
      stack: 'total',
      showMark: false,
    },
    {
      id: 'honorRoll',
      label: t('history.bands.honorRoll'),
      data: rows.map((r) => r.honor_roll_score),
      area: true,
      stack: 'total',
      showMark: false,
    },
    {
      id: 'individualAwards',
      label: t('history.bands.individualAwards'),
      data: rows.map((r) => r.individual_awards_score),
      area: true,
      stack: 'total',
      showMark: false,
    },
    {
      id: 'qualifiedTeams',
      label: t('history.bands.qualifiedTeams'),
      data: rows.map((r) => r.qualified_teams_score),
      area: true,
      stack: 'total',
      showMark: false,
    },
    {
      id: 'groupPosition',
      label: t('history.bands.groupPosition'),
      data: rows.map((r) => r.group_position_score),
      area: true,
      stack: 'total',
      showMark: false,
    },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {t('history.title')}
      </Typography>
      <LineChart
        xAxis={[{
          data: dates,
          scaleType: 'time',
          valueFormatter: (v) =>
            new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        }]}
        series={series}
        height={260}
        slotProps={{ tooltip: { trigger: 'axis' } }}
        margin={{ left: 40, right: 16, top: 10, bottom: 30 }}
      />
    </Box>
  );
}
