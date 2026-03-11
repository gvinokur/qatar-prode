'use client'

import { LineChart } from '@mui/x-charts/LineChart';
import { Typography, Box } from '@mui/material';
import { useTranslations } from 'next-intl';

export interface RankHistoryChartProps {
  readonly userHistories: readonly {
    readonly userId: string
    readonly displayName: string
    readonly data: readonly { readonly date: number; readonly rank: number }[]
  }[]
  readonly currentUserId: string
  readonly startDate: number   // YYYYMMDD
  readonly endDate: number     // YYYYMMDD
  readonly totalUsers: number
  readonly themeColor?: string
}

function yyyymmddToMs(d: number): number {
  const year = Math.floor(d / 10000);
  const month = Math.floor((d % 10000) / 100) - 1;
  const day = d % 100;
  return new Date(year, month, day).getTime();
}

const LINE_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F',
  '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed',
];

export default function RankHistoryChart({
  userHistories,
  currentUserId,
  startDate,
  endDate,
  totalUsers,
  themeColor,
}: RankHistoryChartProps) {
  const t = useTranslations('groups.history');

  if (userHistories.length === 0) return null;

  const allDates = Array.from(
    new Set(userHistories.flatMap((u) => u.data.map((d) => d.date)))
  ).sort((a, b) => a - b).map(yyyymmddToMs);

  // Sort ascending by last known rank so tooltip rows appear best-rank-first (#1 at top)
  const sorted = [...userHistories].sort((a, b) => {
    const aLast = a.data.at(-1)?.rank ?? Infinity;
    const bLast = b.data.at(-1)?.rank ?? Infinity;
    return aLast - bLast;
  });

  const series = sorted.map((user, idx) => {
    const isCurrentUser = user.userId === currentUserId;
    const pointsByDate = new Map(user.data.map((d) => [yyyymmddToMs(d.date), d.rank]));
    const color = isCurrentUser ? themeColor : LINE_COLORS[idx % LINE_COLORS.length];
    return {
      id: user.userId,
      label: user.displayName,
      data: allDates.map((ts) => pointsByDate.get(ts) ?? null),
      ...(color === undefined ? {} : { color }),
      strokeWidth: isCurrentUser ? 3 : 1.5,
      showMark: false,
    };
  });

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {t('rankChartTitle')}
      </Typography>
      <LineChart
        xAxis={[{
          data: allDates,
          scaleType: 'time',
          min: yyyymmddToMs(startDate),
          max: yyyymmddToMs(endDate),
          valueFormatter: (v) =>
            new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        }]}
        yAxis={[{
          min: 1,
          max: totalUsers,
          reverse: true,
          valueFormatter: (v: number) => `#${v}`,
        }]}
        series={series}
        height={260}
        slotProps={{ tooltip: { trigger: 'axis' } }}
        margin={{ left: 40, right: 16, top: 10, bottom: 30 }}
      />
    </Box>
  );
}
