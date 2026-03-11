'use client'

import { LineChart } from '@mui/x-charts/LineChart';
import { Typography, Box } from '@mui/material';
import { useTranslations } from 'next-intl';

export interface RankHistoryChartProps {
  userHistories: {
    userId: string
    displayName: string
    data: { date: number; rank: number }[]
  }[]
  currentUserId: string
  startDate: number   // YYYYMMDD
  endDate: number     // YYYYMMDD
  totalUsers: number
  themeColor?: string
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

  const series = userHistories.map((user, idx) => {
    const isCurrentUser = user.userId === currentUserId;
    const pointsByDate = new Map(user.data.map((d) => [yyyymmddToMs(d.date), d.rank]));
    return {
      id: user.userId,
      label: user.displayName,
      data: allDates.map((ts) => pointsByDate.get(ts) ?? null),
      ...(isCurrentUser && themeColor ? { color: themeColor } : !isCurrentUser ? { color: LINE_COLORS[idx % LINE_COLORS.length] } : {}),
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
