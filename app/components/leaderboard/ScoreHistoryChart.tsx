'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Typography, Box, useTheme } from '@mui/material';
import { useTranslations } from 'next-intl';

export interface ScoreHistoryChartProps {
  userHistories: {
    userId: string
    displayName: string
    data: { date: number; totalPoints: number }[]
  }[]
  currentUserId: string
  startDate: number   // YYYYMMDD — X-axis left bound
  endDate: number     // YYYYMMDD — X-axis right bound
  themeColor?: string
}

/**
 * Convert a YYYYMMDD integer to a Unix timestamp (ms).
 * Using local time so ticks align with calendar dates.
 */
function yyyymmddToMs(d: number): number {
  const year = Math.floor(d / 10000);
  const month = Math.floor((d % 10000) / 100) - 1;
  const day = d % 100;
  return new Date(year, month, day).getTime();
}

function formatDateTick(value: number): string {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// Palette of colors for non-current users
const LINE_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F',
  '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed',
];

export default function ScoreHistoryChart({
  userHistories,
  currentUserId,
  startDate,
  endDate,
  themeColor,
}: ScoreHistoryChartProps) {
  const t = useTranslations('groups.history');
  const theme = useTheme();

  if (userHistories.length === 0) return null;

  const allDates = Array.from(
    new Set(userHistories.flatMap((u) => u.data.map((d) => d.date)))
  ).sort((a, b) => a - b);

  // Use timestamps as the X axis key for proper time-proportional spacing
  const chartData = allDates.map((date) => {
    const entry: Record<string, number> = { date: yyyymmddToMs(date) };
    for (const user of userHistories) {
      const point = user.data.find((d) => d.date === date);
      if (point !== undefined) entry[user.userId] = point.totalPoints;
    }
    return entry;
  });

  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {t('totalPointsChartTitle')}
      </Typography>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="number"
            domain={[yyyymmddToMs(startDate), yyyymmddToMs(endDate)]}
            tickFormatter={formatDateTick}
            scale="time"
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(v) => formatDateTick(Number(v))}
            formatter={(value, name) => {
              const user = userHistories.find((u) => u.userId === name);
              return [value, user?.displayName ?? name];
            }}
          />
          <Legend
            formatter={(value) => {
              const user = userHistories.find((u) => u.userId === value);
              return user?.displayName ?? value;
            }}
          />
          {userHistories.map((user, idx) => {
            const isCurrentUser = user.userId === currentUserId;
            const color = isCurrentUser
              ? (themeColor ?? '#1976d2')
              : LINE_COLORS[idx % LINE_COLORS.length];
            return (
              <Line
                key={user.userId}
                type="monotone"
                dataKey={user.userId}
                stroke={color}
                strokeWidth={isCurrentUser ? 3 : 2}
                dot={false}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
